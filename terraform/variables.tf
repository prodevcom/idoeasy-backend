# Project Configuration
variable "project_name" {
  description = "Project name"
  type        = string
  default     = "idoeasy"
}

variable "environment" {
  description = "Environment (prod or dev)"
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "port" {
  description = "Application port"
  type        = number
  default     = 3000
}

# Docker Configuration
variable "docker_image_uri" {
  description = "Docker image URI in ECR"
  type        = string
  default     = "800572458310.dkr.ecr.us-east-1.amazonaws.com/idoeasy-backend:latest"
}

# App Runner Configuration
variable "app_runner_cpu" {
  description = "CPU for App Runner (1 vCPU = 1024, 2 vCPU = 2048)"
  type        = string
  default     = "1024"
}

variable "app_runner_memory" {
  description = "Memory for App Runner (2 GB = 2048, 4 GB = 4096)"
  type        = string
  default     = "2048"
}

# Custom Domain Configuration
variable "custom_domain" {
  description = "Custom domain for App Runner"
  type        = string
  default     = "api.idoeasy.net"
}
