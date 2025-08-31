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
AUTO_APPROVE="false"

usage() {
  cat <<EOF
Usage: $(basename "$0") -prod|-dev [--profile <aws-profile>] [--region <aws-region>] [--yes]

  -prod | -dev           Choose environment (required)
  --profile <profile>    AWS CLI profile to use (optional)
  --region <region>      AWS region override (defaults to ${AWS_REGION_DEFAULT})
  --yes                  Skip confirmation (terraform apply -auto-approve)
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -prod) ENVIRONMENT="prod"; shift ;;
    -dev)  ENVIRONMENT="dev";  shift ;;
    --profile) AWS_PROFILE="$2"; shift 2 ;;
    --region)  AWS_REGION="$2";  shift 2 ;;
    --yes)     AUTO_APPROVE="true"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) error "Unknown arg: $1";;
  esac
done

[[ -z "${ENVIRONMENT}" ]] && { usage; error "Missing -prod or -dev"; }

# Tools
command -v terraform >/dev/null || error "Terraform not installed"
command -v aws >/dev/null || error "AWS CLI not installed"

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

# Region
if [[ -z "${AWS_REGION}" ]]; then
  AWS_REGION="${AWS_REGION_DEFAULT}"
fi
export AWS_REGION
log "AWS region: ${AWS_REGION}"

# Verify caller identity
aws sts get-caller-identity >/dev/null || error "AWS CLI not configured or lacks permissions"

# Terraform vars
TFVARS_FILE="env/${ENVIRONMENT}.tfvars"
PLAN_ARGS=(-var="environment=${ENVIRONMENT}" -var="aws_region=${AWS_REGION}")

if [[ -f "${TFVARS_FILE}" ]]; then
  log "Loading var-file: ${TFVARS_FILE}"
  PLAN_ARGS+=(-var-file="${TFVARS_FILE}")
else
  warn "No ${TFVARS_FILE} found. Using defaults & inline vars."
fi

log "Effective settings:"
echo "  environment = ${ENVIRONMENT}"
echo "  aws_region  = ${AWS_REGION}"
[[ -f "${TFVARS_FILE}" ]] && echo "  var-file    = ${TFVARS_FILE}"

# Init
log "terraform init..."
terraform init -upgrade

# State presence (optional)
if terraform state list >/dev/null 2>&1; then
  log "Terraform state detected"
else
  warn "No Terraform state found (first apply?)"
fi

# Plan (gera tfplan com os args acima)
log "terraform plan..."
terraform plan -out=tfplan "${PLAN_ARGS[@]}"

# Apply (NÃO passar -var/-var-file aqui quando usa tfplan)
if [[ "${AUTO_APPROVE}" == "true" ]]; then
  log "terraform apply -auto-approve tfplan"
  terraform apply -auto-approve tfplan
else
  warn "About to apply changes to AWS."
  read -r -p "Continue? (y/N): " REPLY
  if [[ ! "${REPLY}" =~ ^[Yy]$ ]]; then
    log "Cancelled."
    rm -f tfplan
    exit 0
  fi
  log "terraform apply tfplan"
  terraform apply tfplan
fi

ok "Deploy completed."
log "Outputs:"
terraform output || true
rm -f tfplan || true