# Outputs for iDoEasy Backend Infrastructure

# Secrets Manager Information
output "secret_arn" {
  description = "ARN of the Secrets Manager secret"
  value       = data.aws_secretsmanager_secret.app_env.arn
}

output "secret_id" {
  description = "ID of the Secrets Manager secret"
  value       = data.aws_secretsmanager_secret.app_env.id
}

output "secret_name" {
  description = "Name of the Secrets Manager secret"
  value       = data.aws_secretsmanager_secret.app_env.name
}

# App Runner Service Information
output "app_runner_service_name" {
  description = "Name of the App Runner service"
  value       = aws_apprunner_service.backend.service_name
}

output "app_runner_service_arn" {
  description = "ARN of the App Runner service"
  value       = aws_apprunner_service.backend.arn
}

output "app_runner_service_url" {
  description = "URL of the App Runner service"
  value       = aws_apprunner_service.backend.service_url
}

# Custom Domain Information
output "custom_domain_name" {
  description = "Custom domain name"
  value       = aws_apprunner_custom_domain_association.api_domain.domain_name
}

output "custom_domain_status" {
  description = "Status of the custom domain"
  value       = aws_apprunner_custom_domain_association.api_domain.status
}

output "custom_domain_certificate_validation_records" {
  description = "Certificate validation records for the custom domain"
  value       = aws_apprunner_custom_domain_association.api_domain.certificate_validation_records
}

# Project Information
output "project_info" {
  description = "Project information"
  value = {
    project_name = var.project_name
    environment  = var.environment
    aws_region   = var.aws_region
  }
}

# Usage Instructions
output "usage_instructions" {
  description = "Instructions for using the deployed infrastructure"
  value       = <<-EOT
    🚀 iDoEasy Backend Deployed Successfully!
    
    📍 Service Details:
    1. Secret ARN: ${data.aws_secretsmanager_secret.app_env.arn}
    2. Secret Name: ${data.aws_secretsmanager_secret.app_env.name}
    3. Service URL: ${aws_apprunner_service.backend.service_url}
    4. Custom Domain: ${aws_apprunner_custom_domain_association.api_domain.domain_name}
    
    🔐 Accessing Secrets:
    - AWS CLI: aws secretsmanager get-secret-value --secret-id "${data.aws_secretsmanager_secret.app_env.name}"
    - Console: AWS Secrets Manager > ${data.aws_secretsmanager_secret.app_env.name}
    
    🌐 Health Check:
    - URL: ${aws_apprunner_service.backend.service_url}/api/v1/health
    - Custom Domain: https://${aws_apprunner_custom_domain_association.api_domain.domain_name}/api/v1/health
    
    📊 Monitoring:
    - App Runner Console: https://console.aws.amazon.com/apprunner/
    - CloudWatch Logs: Available in App Runner console
    
    🔄 Auto-deployments: Enabled
    EOT
}
