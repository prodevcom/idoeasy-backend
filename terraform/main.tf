# AWS Provider Configuration
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.0"
}

provider "aws" {
  region = var.aws_region
}

# Reference to existing Secrets Manager Secret (DO NOT CREATE OR MODIFY)
data "aws_secretsmanager_secret" "app_env" {
  name = "${var.project_name}-${var.environment}-env"
}

# IAM Role for App Runner Service (execution) - already exists
data "aws_iam_role" "app_runner_service_role" {
  name = "${var.project_name}-${var.environment}-app-runner-service-role"
}

# IAM Role for App Runner to access ECR - already exists
data "aws_iam_role" "app_runner_access_role" {
  name = "${var.project_name}-${var.environment}-app-runner-access-role"
}

# App Runner Service
resource "aws_apprunner_service" "backend" {
  service_name = "${var.project_name}-${var.environment}-backend"

  source_configuration {
    image_repository {
      image_configuration {
        port = var.port
        runtime_environment_secrets = {
          # Using existing Secrets Manager values (DO NOT MODIFY)
          NODE_ENV                 = "${data.aws_secretsmanager_secret.app_env.arn}:NODE_ENV::"
          PORT                     = "${data.aws_secretsmanager_secret.app_env.arn}:PORT::"
          LOG_LEVEL                = "${data.aws_secretsmanager_secret.app_env.arn}:LOG_LEVEL::"
          LOG_FORMAT               = "${data.aws_secretsmanager_secret.app_env.arn}:LOG_FORMAT::"
          AWS_DEFAULT_REGION       = "${data.aws_secretsmanager_secret.app_env.arn}:AWS_DEFAULT_REGION::"
          MONGODB_URI              = "${data.aws_secretsmanager_secret.app_env.arn}:MONGODB_URI::"
          JWT_SECRET               = "${data.aws_secretsmanager_secret.app_env.arn}:JWT_SECRET::"
          JWT_EXPIRES              = "${data.aws_secretsmanager_secret.app_env.arn}:JWT_EXPIRES::"
          JWT_MAX_INACTIVE_MINUTES = "${data.aws_secretsmanager_secret.app_env.arn}:JWT_MAX_INACTIVE_MINUTES::"
          USER_ADMIN               = "${data.aws_secretsmanager_secret.app_env.arn}:USER_ADMIN::"
          USER_PASSWORD            = "${data.aws_secretsmanager_secret.app_env.arn}:USER_PASSWORD::"
          AWS_ACCESS_KEY_ID        = "${data.aws_secretsmanager_secret.app_env.arn}:AWS_ACCESS_KEY_ID::"
          AWS_SECRET_ACCESS_KEY    = "${data.aws_secretsmanager_secret.app_env.arn}:AWS_SECRET_ACCESS_KEY::"
        }
      }
      image_identifier      = var.docker_image_uri
      image_repository_type = "ECR"
    }

    # Authentication configuration for ECR
    authentication_configuration {
      access_role_arn = data.aws_iam_role.app_runner_access_role.arn
    }
  }

  # Health Check Configuration - More lenient settings
  health_check_configuration {
    protocol            = "HTTP"
    path                = "/api/v1/health"
    interval            = 20
    timeout             = 10
    healthy_threshold   = 1
    unhealthy_threshold = 10
  }

  # Network Configuration
  network_configuration {
    egress_configuration {
      egress_type = "DEFAULT"
    }
    ingress_configuration {
      is_publicly_accessible = true
    }
    ip_address_type = "IPV4"
  }

  instance_configuration {
    instance_role_arn = data.aws_iam_role.app_runner_service_role.arn
    cpu               = var.app_runner_cpu
    memory            = var.app_runner_memory
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Custom Domain for api.idoeasy.net
resource "aws_apprunner_custom_domain_association" "api_domain" {
  domain_name = var.custom_domain
  service_arn = aws_apprunner_service.backend.arn

  # Automatic SSL/TLS configuration
  enable_www_subdomain = false
}

