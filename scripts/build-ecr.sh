#!/bin/bash

# Script to build and push Docker image to ECR
# Usage: ./scripts/build-ecr.sh [ECR_REPOSITORY_URL] [IMAGE_TAG] [ENV_FILE]

set -e

# Default values
ECR_REPOSITORY_URL=${1:-"800572458310.dkr.ecr.us-east-1.amazonaws.com/idoeasy-backend"}
IMAGE_TAG=${2:-"latest"}
ENV_FILE=${3:-".env"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Building Docker image for ECR...${NC}"

# Build the Docker image
echo -e "${YELLOW}📦 Building image with tag: ${IMAGE_TAG}${NC}"
if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}🔧 Using environment file: ${ENV_FILE}${NC}"
    docker build --build-arg ENV_FILE=${ENV_FILE} -t ${ECR_REPOSITORY_URL}:${IMAGE_TAG} .
else
    echo -e "${YELLOW}⚠️  Environment file ${ENV_FILE} not found, building without it${NC}"
    docker build -t ${ECR_REPOSITORY_URL}:${IMAGE_TAG} .
fi

# Tag the image for ECR
echo -e "${YELLOW}🏷️  Tagging image for ECR...${NC}"
docker tag ${ECR_REPOSITORY_URL}:${IMAGE_TAG} ${ECR_REPOSITORY_URL}:${IMAGE_TAG}

# Login to ECR (if not already logged in)
echo -e "${YELLOW}🔐 Logging in to ECR...${NC}"
aws ecr get-login-password --region ${AWS_DEFAULT_REGION:-us-east-1} | docker login --username AWS --password-stdin ${ECR_REPOSITORY_URL}

# Push the image to ECR
echo -e "${YELLOW}⬆️  Pushing image to ECR...${NC}"
docker push ${ECR_REPOSITORY_URL}:${IMAGE_TAG}

echo -e "${GREEN}✅ Successfully built and pushed image to ECR!${NC}"
echo -e "${GREEN}📋 Image: ${ECR_REPOSITORY_URL}:${IMAGE_TAG}${NC}"

# Clean up local images (optional)
read -p "Do you want to remove local Docker images? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🧹 Cleaning up local images...${NC}"
    docker rmi ${ECR_REPOSITORY_URL}:${IMAGE_TAG}
    echo -e "${GREEN}✅ Cleanup completed!${NC}"
fi
