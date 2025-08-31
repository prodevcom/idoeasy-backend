#!/usr/bin/env bash
set -euo pipefail

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()    { echo -e "${BLUE}🚀 iDoEasy Backend - $*${NC}"; }
error()  { echo -e "${RED}❌ $*${NC}"; exit 1; }
warn()   { echo -e "${YELLOW}⚠️  $*${NC}"; }
ok()     { echo -e "${GREEN}✅ $*${NC}"; }

# Defaults
AWS_REGION_DEFAULT="us-east-1"

# Parse args
ENVIRONMENT=""
AWS_PROFILE=""
AWS_REGION=""
DRY_RUN="false"

usage() {
  cat <<EOF
Usage: $(basename "$0") -prod|-dev [--profile <aws-profile>] [--region <aws-region>] [--dry-run]

  -prod | -dev           Choose environment (required)
  --profile <profile>    AWS CLI profile to use (optional)
  --region <region>      AWS region override (defaults to ${AWS_REGION_DEFAULT})
  --dry-run              Only run terraform plan, no apply (recommended for production)

Examples:
  ./deploy.sh -prod --dry-run                    # Production plan only
  ./deploy.sh -dev --profile myprofile           # Development with custom profile
  ./deploy.sh -prod --region us-west-2 --dry-run # Production plan in different region
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -prod) ENVIRONMENT="prod"; shift ;;
    -dev)  ENVIRONMENT="dev";  shift ;;
    --profile) AWS_PROFILE="$2"; shift 2 ;;
    --region)  AWS_REGION="$2";  shift 2 ;;
    --dry-run) DRY_RUN="true"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) error "Unknown arg: $1";;
  esac
done

[[ -z "${ENVIRONMENT}" ]] && { usage; error "Missing -prod or -dev"; }

# Safety check for production
if [[ "${ENVIRONMENT}" == "prod" && "${DRY_RUN}" != "true" ]]; then
  warn "⚠️  PRODUCTION DEPLOYMENT DETECTED! ⚠️"
  warn "This will make actual changes to your production infrastructure."
  warn "Use --dry-run flag to only plan changes without applying them."
  read -r -p "Are you sure you want to deploy to PRODUCTION? (type 'YES' to confirm): " REPLY
  if [[ "${REPLY}" != "YES" ]]; then
    log "Production deployment cancelled. Use --dry-run to plan changes safely."
    exit 0
  fi
fi

# Tools
command -v terraform >/dev/null || error "Terraform not installed"
command -v aws >/dev/null || error "AWS CLI not installed"

# Load environment variables from .env file
ENV_FILE=".env"
if [[ -f "${ENV_FILE}" ]]; then
  log "Loading environment variables from ${ENV_FILE}"
  set -a  # automatically export all variables
  source "${ENV_FILE}"
  set +a  # stop automatically exporting
  
  # Log loaded variables (without sensitive data)
  log "Environment variables loaded:"
  echo "  NODE_ENV: ${NODE_ENV:-not set}"
  echo "  PRIMARY_DOMAIN: ${PRIMARY_DOMAIN:-not set}"
  echo "  AWS_DEFAULT_REGION: ${AWS_DEFAULT_REGION:-not set}"
  echo "  LOG_LEVEL: ${LOG_LEVEL:-not set}"
  echo "  LOG_FORMAT: ${LOG_FORMAT:-not set}"
else
  warn "No ${ENV_FILE} found. Using system environment variables."
fi

# AWS profile handling (fallback if profile não existe)
if [[ -n "${AWS_PROFILE}" ]]; then
  if ! aws configure list-profiles | grep -qx "${AWS_PROFILE}"; then
    warn "Profile '${AWS_PROFILE}' not found; using default credentials."
    unset AWS_PROFILE
  else
    export AWS_PROFILE
    log "Using AWS profile: ${AWS_PROFILE}"
  fi
fi

# Region (priority: CLI arg > .env > default)
if [[ -z "${AWS_REGION}" ]]; then
  if [[ -n "${AWS_DEFAULT_REGION:-}" ]]; then
    AWS_REGION="${AWS_DEFAULT_REGION}"
    log "Using region from .env: ${AWS_REGION}"
  else
    AWS_REGION="${AWS_REGION_DEFAULT}"
    log "Using default region: ${AWS_REGION}"
  fi
fi
export AWS_REGION

# Verify caller identity
log "Verifying AWS credentials..."
aws sts get-caller-identity >/dev/null || error "AWS CLI not configured or lacks permissions"
ok "AWS credentials verified"

# Terraform vars
TFVARS_FILE="env/${ENVIRONMENT}.tfvars"
PLAN_ARGS=(
  -var="environment=${ENVIRONMENT}" 
  -var="aws_region=${AWS_REGION}"
  -var="primary_domain=${PRIMARY_DOMAIN:-idoeasy.net}"
  -var="log_level=${LOG_LEVEL:-info}"
  -var="log_format=${LOG_FORMAT:-json}"
  -var="port=${PORT:-3000}"
)

if [[ -f "${TFVARS_FILE}" ]]; then
  log "Loading Terraform variables from: ${TFVARS_FILE}"
  PLAN_ARGS+=(-var-file="${TFVARS_FILE}")
else
  warn "No ${TFVARS_FILE} found. Using defaults & inline vars."
fi

log "Effective Terraform settings:"
echo "  environment     = ${ENVIRONMENT}"
echo "  aws_region      = ${AWS_REGION}"
echo "  primary_domain  = ${PRIMARY_DOMAIN:-idoeasy.net}"
echo "  log_level       = ${LOG_LEVEL:-info}"
echo "  log_format      = ${LOG_FORMAT:-json}"
echo "  port            = ${PORT:-3000}"
[[ -f "${TFVARS_FILE}" ]] && echo "  var-file        = ${TFVARS_FILE}"

# Init
log "Running terraform init..."
terraform init -upgrade

# State presence (optional)
if terraform state list >/dev/null 2>&1; then
  log "Terraform state detected"
else
  warn "No Terraform state found (first deployment?)"
fi

# Plan
log "Running terraform plan..."
if terraform plan -out=tfplan "${PLAN_ARGS[@]}"; then
  ok "Terraform plan completed successfully"
  
  # Show plan summary
  log "Plan Summary:"
  terraform show -json tfplan | jq -r '.resource_changes[] | "  \(.change.actions[]): \(.type) \(.name)"' 2>/dev/null || {
    log "Plan details (raw):"
    terraform show tfplan | grep -E "^(Plan:|  #|  \+|  -|  ~)" || true
  }
else
  error "Terraform plan failed"
fi

# Apply logic (only if not dry-run)
if [[ "${DRY_RUN}" == "true" ]]; then
  log "DRY RUN MODE: No changes will be applied"
  log "To apply changes, run without --dry-run flag"
  rm -f tfplan
  ok "Dry run completed successfully"
  exit 0
fi

# Apply (only if not production or explicitly confirmed)
if [[ "${ENVIRONMENT}" == "prod" ]]; then
  warn "⚠️  PRODUCTION DEPLOYMENT - Manual confirmation required"
  read -r -p "Apply these changes to PRODUCTION? (y/N): " REPLY
  if [[ ! "${REPLY}" =~ ^[Yy]$ ]]; then
    log "Production deployment cancelled."
    rm -f tfplan
    exit 0
  fi
else
  warn "About to apply changes to ${ENVIRONMENT} environment."
  read -r -p "Continue? (y/N): " REPLY
  if [[ ! "${REPLY}" =~ ^[Yy]$ ]]; then
    log "Deployment cancelled."
    rm -f tfplan
    exit 0
  fi
fi

# Apply changes
log "Applying Terraform changes..."
if terraform apply tfplan; then
  ok "Deployment completed successfully"
  
  # Show outputs
  log "Infrastructure outputs:"
  terraform output || true
else
  error "Terraform apply failed"
fi

# Cleanup
rm -f tfplan || true
ok "Deployment process completed"