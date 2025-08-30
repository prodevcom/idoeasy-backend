# 🚀 iDoEasy Backend - Terraform Infrastructure

AWS infrastructure for iDoEasy backend using Terraform.

## 🎯 **Features**

- ✅ **Secrets Manager**: Secure environment variables management
- ✅ **App Runner**: Automatic backend deployment
- ✅ **Custom Domain**: `api.idoeasy.net` with automatic SSL
- ✅ **IAM Roles**: Optimized permissions for App Runner and ECR
- ✅ **Health Check**: `/api/v1/health` endpoint configured

## 🚀 **Quick Deploy**

### **1. Configure Sensitive Variables (First time)**
```bash
# Copy example file
cp example.tfvars .tfvars

# Edit with your real values
nano .tfvars
```

### **2. Deploy**
```bash
# Production
./deploy.sh -prod

# Development
./deploy.sh -dev
```

## 📁 **Structure**

```
terraform/
├── main.tf              # Main resources
├── variables.tf         # Variable declarations (no sensitive data)
├── outputs.tf           # Infrastructure outputs
├── deploy.sh            # Simplified deploy script
├── example.tfvars       # Configuration example
└── README.md            # This documentation
```

## 🔧 **Configuration**

### **Required Variables** (in `.tfvars` file)
- `mongodb_uri` → Your MongoDB Atlas URI
- `jwt_secret` → Your JWT secret key
- `user_admin` → Admin user email
- `user_password` → Admin user password
- `aws_access_key_id` → Your AWS Access Key
- `aws_secret_access_key` → Your AWS Secret Key

### **Optional Variables** (use defaults)
- `app_runner_cpu` → CPU (default: 1024 = 1 vCPU)
- `app_runner_memory` → Memory (default: 2048 = 2 GB)
- `custom_domain` → Domain (default: api.idoeasy.net)

## 🌐 **Domains**

- **Production**: `https://api.idoeasy.net` ✅ WORKING
- **Development**: `https://dev-api.idoeasy.net` (when configured)

## 📊 **Created Resources**

- **Secrets Manager**: `idoeasy-{env}-env`
- **App Runner**: `idoeasy-{env}-backend`
- **IAM Roles**: Service Role + Access Role
- **Custom Domain**: With automatic SSL

## 🔐 **Secrets Manager Management**

### **Update Existing Secrets**
```bash
# Edit your .tfvars file
nano .tfvars

# Apply only Secrets Manager changes
terraform apply -target=aws_secretsmanager_secret_version.app_env
```

### **Add New Environment Variables**
```bash
# 1. Add new variable to variables.tf
variable "new_secret" {
  description = "New secret variable"
  type        = string
  sensitive   = true
}

# 2. Add to main.tf in runtime_environment_secrets
runtime_environment_secrets = {
  # ... existing secrets ...
  NEW_SECRET = "${aws_secretsmanager_secret.app_env.arn}:NEW_SECRET::"
}

# 3. Add value to .tfvars
new_secret = "your-new-secret-value"

# 4. Apply changes
terraform apply
```

### **View Current Secrets**
```bash
# List all secrets
aws secretsmanager list-secrets

# Get specific secret value
aws secretsmanager get-secret-value --secret-id "idoeasy-prod-env"

# View in Terraform
terraform output secret_arn
```

## 🚨 **Important**

- ✅ **Domain preserved**: `api.idoeasy.net` always maintained
- ✅ **Automatic SSL**: Certificates renewed automatically
- ✅ **Secure secrets**: Sensitive variables in Secrets Manager
- ✅ **Simple deploy**: Just `./deploy.sh -prod` or `./deploy.sh -dev`
- 🔒 **Security**: Sensitive values NEVER in code

## 🔍 **Check Status**

```bash
# App Runner status
aws apprunner describe-service --service-arn <arn>

# Domain status
aws apprunner describe-custom-domains --service-arn <arn>

# Test health check
curl https://api.idoeasy.net/api/v1/health
```

## 🎉 **Ready to use!**

1. Configure your sensitive variables in `.tfvars`
2. Run `./deploy.sh -prod`
3. Everything will be configured automatically! 🚀

**NEVER put sensitive data in code!** 🔒
