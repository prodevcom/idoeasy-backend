#!/bin/bash

# 🚀 iDoEasy Backend - Deploy Script
# Usage: ./deploy.sh -prod or ./deploy.sh -dev

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to show messages
log() {
    echo -e "${BLUE}🚀 iDoEasy Backend - $1${NC}"
}

error() {
    echo -e "${RED}❌ Error: $1${NC}"
    exit 1
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check parameters
if [ $# -eq 0 ]; then
    error "Usage: $0 -prod or $0 -dev"
fi

# Define environment
case "$1" in
    -prod)
        ENVIRONMENT="prod"
        log "Production"
        ;;
    -dev)
        ENVIRONMENT="dev"
        log "Development"
        ;;
    *)
        error "Invalid parameter. Use -prod or -dev"
        ;;
esac

# Set only environment - Terraform uses existing state
export TF_VAR_environment="$ENVIRONMENT"

log "Environment: $ENVIRONMENT"
log "Using existing Terraform state"

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    error "Terraform is not installed"
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    error "AWS CLI is not configured or has no permissions"
fi

# Initialize Terraform (if necessary)
if [ ! -d ".terraform" ]; then
    log "Initializing Terraform..."
    terraform init
fi

# Check current state
log "Checking current state..."
terraform state list

# Plan changes
log "Planning changes..."
terraform plan -out=tfplan

# Apply changes
warning "Applying changes to AWS..."
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "Applying..."
    terraform apply tfplan
    success "Deploy completed successfully!"
    
    # Show outputs
    log "Outputs:"
    terraform output
    
    # Clean plan file
    rm -f tfplan
else
    log "Deploy cancelled"
    rm -f tfplan
    exit 0
fi
