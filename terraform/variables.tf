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

# Application Configuration
variable "node_env" {
  description = "Node.js environment"
  type        = string
  default     = "production"
}

variable "port" {
  description = "Application port"
  type        = number
  default     = 3000
}

# Database Configuration
variable "mongodb_uri" {
  description = "MongoDB Atlas URI"
  type        = string
  sensitive   = true
}

# JWT Configuration
variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

variable "jwt_expires" {
  description = "JWT expiration time (minutes)"
  type        = number
  default     = 1440
}

variable "jwt_max_inactive_minutes" {
  description = "JWT maximum inactivity time (minutes)"
  type        = number
  default     = 86400
}

# Admin User Configuration
variable "user_admin" {
  description = "Admin user email"
  type        = string
}

variable "user_password" {
  description = "Admin user password"
  type        = string
  sensitive   = true
}

# Logging Configuration
variable "log_level" {
  description = "Log level"
  type        = string
  default     = "info"
}

variable "log_format" {
  description = "Log format"
  type        = string
  default     = "json"
}

# AWS Configuration
variable "aws_access_key_id" {
  description = "AWS Access Key ID"
  type        = string
  sensitive   = true
}

variable "aws_secret_access_key" {
  description = "AWS Secret Access Key"
  type        = string
  sensitive   = true
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
