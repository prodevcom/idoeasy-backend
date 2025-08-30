#!/usr/bin/env bash
set -euo pipefail

# ---------------------------
# Config
# ---------------------------
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="800572458310"
REPO_NAME="idoeasy-backend"
IMAGE_TAG="${IMAGE_TAG:-$(date +%Y%m%d-%H%M%S)}"
IMAGE_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${REPO_NAME}"

# ---------------------------
# Build & Push
# ---------------------------
echo "[INFO] Logging in to ECR..."
aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

echo "[INFO] Ensuring repository exists..."
aws ecr describe-repositories --repository-names "$REPO_NAME" --region "$AWS_REGION" >/dev/null 2>&1 \
  || aws ecr create-repository --repository-name "$REPO_NAME" --region "$AWS_REGION"

echo "[INFO] Building Docker image..."
docker buildx build \
  --platform linux/amd64 \
  -t "${IMAGE_URI}:${IMAGE_TAG}" \
  -t "${IMAGE_URI}:latest" .

echo "[INFO] Pushing image to ECR..."
docker push "${IMAGE_URI}:${IMAGE_TAG}"
docker push "${IMAGE_URI}:latest"

echo "[INFO] Done! Image available at:"
echo "  ${IMAGE_URI}:${IMAGE_TAG}"
echo "  ${IMAGE_URI}:latest"