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

# Secrets Manager Secret
resource "aws_secretsmanager_secret" "app_env" {
  name = "${var.project_name}-${var.environment}-env"
  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Secrets Manager Secret Version
resource "aws_secretsmanager_secret_version" "app_env" {
  secret_id = aws_secretsmanager_secret.app_env.id
  secret_string = jsonencode({
    NODE_ENV                 = var.node_env
    PORT                     = var.port
    MONGODB_URI             = var.mongodb_uri
    JWT_SECRET              = var.jwt_secret
    JWT_EXPIRES             = var.jwt_expires
    JWT_MAX_INACTIVE_MINUTES = var.jwt_max_inactive_minutes
    USER_ADMIN              = var.user_admin
    USER_PASSWORD           = var.user_password
    LOG_LEVEL               = var.log_level
    LOG_FORMAT              = var.log_format
    AWS_DEFAULT_REGION      = var.aws_region
    AWS_ACCESS_KEY_ID       = var.aws_access_key_id
    AWS_SECRET_ACCESS_KEY   = var.aws_secret_access_key
  })
}

# IAM Role for App Runner Service (execution)
resource "aws_iam_role" "app_runner_service_role" {
  name = "${var.project_name}-${var.environment}-app-runner-service-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "tasks.apprunner.amazonaws.com"
        }
      }
    ]
  })
  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# IAM Role for App Runner to access ECR
resource "aws_iam_role" "app_runner_access_role" {
  name = "${var.project_name}-${var.environment}-app-runner-access-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "build.apprunner.amazonaws.com"
        }
      }
    ]
  })
  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Policy to access Secrets Manager
resource "aws_iam_role_policy" "app_runner_secrets_policy" {
  name = "${var.project_name}-${var.environment}-secrets-policy"
  role = aws_iam_role.app_runner_service_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.app_env.arn
      }
    ]
  })
}

# Policy to access ECR (in access role)
resource "aws_iam_role_policy" "app_runner_ecr_policy" {
  name = "${var.project_name}-${var.environment}-ecr-policy"
  role = aws_iam_role.app_runner_access_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:DescribeRepositories",
          "ecr:DescribeImages"
        ]
        Resource = "*"
      }
    ]
  })
}

# App Runner Service
resource "aws_apprunner_service" "backend" {
  service_name = "${var.project_name}-${var.environment}-backend"

  source_configuration {
    image_repository {
      image_configuration {
        port = var.port
        runtime_environment_secrets = {
          # Basic variables
          NODE_ENV                 = "${aws_secretsmanager_secret.app_env.arn}:NODE_ENV::"
          PORT                     = "${aws_secretsmanager_secret.app_env.arn}:PORT::"
          LOG_LEVEL                = "${aws_secretsmanager_secret.app_env.arn}:LOG_LEVEL::"
          LOG_FORMAT               = "${aws_secretsmanager_secret.app_env.arn}:LOG_FORMAT::"
          AWS_DEFAULT_REGION       = "${aws_secretsmanager_secret.app_env.arn}:AWS_DEFAULT_REGION::"
          MONGODB_URI              = "${aws_secretsmanager_secret.app_env.arn}:MONGODB_URI::"
          JWT_SECRET               = "${aws_secretsmanager_secret.app_env.arn}:JWT_SECRET::"
          JWT_EXPIRES              = "${aws_secretsmanager_secret.app_env.arn}:JWT_EXPIRES::"
          JWT_MAX_INACTIVE_MINUTES = "${aws_secretsmanager_secret.app_env.arn}:JWT_MAX_INACTIVE_MINUTES::"
          USER_ADMIN               = "${aws_secretsmanager_secret.app_env.arn}:USER_ADMIN::"
          USER_PASSWORD            = "${aws_secretsmanager_secret.app_env.arn}:USER_PASSWORD::"
          AWS_ACCESS_KEY_ID        = "${aws_secretsmanager_secret.app_env.arn}:AWS_ACCESS_KEY_ID::"
          AWS_SECRET_ACCESS_KEY    = "${aws_secretsmanager_secret.app_env.arn}:AWS_SECRET_ACCESS_KEY::"
        }
      }
      image_identifier      = var.docker_image_uri
      image_repository_type = "ECR"
    }
    
    # Authentication configuration for ECR
    authentication_configuration {
      access_role_arn = aws_iam_role.app_runner_access_role.arn
    }
  }

  # Health Check Configuration
  health_check_configuration {
    protocol            = "HTTP"
    path                = "/api/v1/health"
    interval            = 5
    timeout             = 2
    healthy_threshold   = 1
    unhealthy_threshold = 5
  }

  instance_configuration {
    instance_role_arn = aws_iam_role.app_runner_service_role.arn
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
