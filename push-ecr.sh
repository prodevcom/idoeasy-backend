#!/usr/bin/env bash
set -euo pipefail

AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-800572458310}"
REPO_NAME="${REPO_NAME:-idoeasy-backend}"
IMAGE_TAG="${IMAGE_TAG:-$(date +%Y%m%d-%H%M%S)}"
IMAGE_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${REPO_NAME}"

echo "[INFO] Logging in to ECR..."
aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "[INFO] Ensuring repository exists..."
aws ecr describe-repositories --repository-names "$REPO_NAME" --region "$AWS_REGION" >/dev/null 2>&1 \
  || aws ecr create-repository --repository-name "$REPO_NAME" --region "$AWS_REGION" >/dev/null

# Ensure buildx is ready
if ! docker buildx inspect >/dev/null 2>&1; then
  echo "[INFO] Creating a buildx builder..."
  docker buildx create --use --name ecrbuilder
  docker buildx inspect --bootstrap
fi

echo "[INFO] Building (linux/amd64) and pushing to ECR..."
DOCKER_BUILDKIT=1 docker buildx build \
  --platform linux/amd64 \
  -t "${IMAGE_URI}:${IMAGE_TAG}" \
  -t "${IMAGE_URI}:latest" \
  --push .

echo "[INFO] Verifying manifest contains linux/amd64..."
if ! docker manifest inspect "${IMAGE_URI}:latest" \
    | jq -e '.manifests[].platform | select(.os=="linux" and .architecture=="amd64")' >/dev/null; then
  echo "[ERROR] Tag 'latest' in ECR does not include linux/amd64. App Runner will fail."
  exit 1
fi

echo "[INFO] Done. Images:"
echo "  ${IMAGE_URI}:${IMAGE_TAG}"
echo "  ${IMAGE_URI}:latest"