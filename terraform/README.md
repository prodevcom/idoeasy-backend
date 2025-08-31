# 🚀 iDoEasy Backend - Terraform Infrastructure

AWS infrastructure for iDoEasy backend using Terraform.

## 🎯 **Features**

- ✅ **Secrets Manager**: Secure environment variables management
- ✅ **App Runner**: Automatic backend deployment
- ✅ **Custom Domain**: `api.idoeasy.net` with automatic SSL
- ✅ **IAM Roles**: Optimized permissions for App Runner and ECR
- ✅ **Health Check**: `/api/v1/health` endpoint configured

## 🚀 **Quick Deploy**

### **✅ Already Configured!**
The `.tfvars` file is already configured with production values. You can deploy directly!

### **Deploy**
```bash
# Production
./deploy.sh -prod

# Development
./deploy.sh -dev
```

### **Customize Variables (Optional)**
If you want to change values:
```bash
# Edit the .tfvars file
nano .tfvars

# Then deploy
./deploy.sh -prod
```

## �� **Structure**

```