# Secrets Manager Outputs
output "secret_arn" {
  description = "ARN of the Secrets Manager secret"
  value       = aws_secretsmanager_secret.app_env.arn
}

output "secret_id" {
  description = "ID of the Secrets Manager secret"
  value       = aws_secretsmanager_secret.app_env.id
}

output "secret_name" {
  description = "Name of the Secrets Manager secret"
  value       = aws_secretsmanager_secret.app_env.name
}

output "secret_version_id" {
  description = "Version ID of the Secrets Manager secret"
  value       = aws_secretsmanager_secret_version.app_env.version_id
}

# App Runner Outputs
output "app_runner_service_url" {
  description = "App Runner service URL"
  value       = aws_apprunner_service.backend.service_url
}

output "app_runner_service_arn" {
  description = "App Runner service ARN"
  value       = aws_apprunner_service.backend.arn
}

output "app_runner_service_name" {
  description = "App Runner service name"
  value       = aws_apprunner_service.backend.service_name
}

# Custom Domain Outputs
output "custom_domain_name" {
  description = "Custom domain configured"
  value       = aws_apprunner_custom_domain_association.api_domain.domain_name
}

output "custom_domain_status" {
  description = "Custom domain status"
  value       = aws_apprunner_custom_domain_association.api_domain.status
}

output "custom_domain_certificate_validation_records" {
  description = "SSL certificate validation records"
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
  description = "Instructions for using the created resources"
  value = <<EOT
To use this secret in your application:
    
1. Secret ARN: ${aws_secretsmanager_secret.app_env.arn}
2. Secret Name: ${aws_secretsmanager_secret.app_env.name}
    
To retrieve values:
- AWS CLI: aws secretsmanager get-secret-value --secret-id "${aws_secretsmanager_secret.app_env.name}"
- AWS SDK: Use the ARN or secret name
    
To update values:
- Modify the .tfvars file
- Run: terraform apply -var-file=".tfvars"
    
App Runner Service:
- URL: ${aws_apprunner_service.backend.service_url}
- Name: ${aws_apprunner_service.backend.service_name}

Custom Domain:
- Domain: ${var.custom_domain}
- Status: ${aws_apprunner_custom_domain_association.api_domain.status}
EOT
}
