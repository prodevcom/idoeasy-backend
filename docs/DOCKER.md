# Docker Setup for iDoEasy Backend

This document describes how to build and deploy the iDoEasy Backend using Docker.

> 📖 **Back to [README.md](../README.md)**

## Prerequisites

- Docker installed and running
- AWS CLI configured (for ECR deployment)
- Node.js 22+ (for local development)
- SSH keys for private repositories (placed in `ssh_keys/` folder)

## Quick Start

### Local Development with Docker Compose

```bash
# Build and start the application
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Build Docker Image Locally

```bash
# Build image
docker build -t idoeasy-backend:latest .

# Run container
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database \
  idoeasy-backend:latest
```

## ECR Deployment

### Using the Build Script

```bash
# Make script executable (first time only)
chmod +x scripts/build-ecr.sh

# Build and push to ECR (using default repository)
./scripts/build-ecr.sh

# Build and push to ECR (custom repository and tag)
./scripts/build-ecr.sh <ECR_REPOSITORY_URL> <IMAGE_TAG> [ENV_FILE]

# Examples:
./scripts/build-ecr.sh 800572458310.dkr.ecr.us-east-1.amazonaws.com/idoeasy-backend v1.0.0
```

### Manual ECR Deployment

```bash
# 1. Build image
docker build -t idoeasy-backend:latest .

# 2. Tag for ECR (using default repository)
docker tag idoeasy-backend:latest 800572458310.dkr.ecr.us-east-1.amazonaws.com/idoeasy-backend:latest

# 3. Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 800572458310.dkr.ecr.us-east-1.amazonaws.com/idoeasy-backend

# 4. Push to ECR
docker push 800572458310.dkr.ecr.us-east-1.amazonaws.com/idoeasy-backend:latest
```

## Environment Variables

### Configuration Files

The Docker setup uses a single `.env` file for all environment variables:

1. **.env** - Main environment file for all Docker operations
2. **Build arguments** - Passed during Docker build
3. **Runtime environment** - Set when running containers

### Available Variables

The following environment variables can be configured:

| Variable | Default | Description |
|-----------|---------|-------------|
| `NODE_ENV` | `development` | Application environment |
| `PORT` | `3000` | Application port |
| `MONGODB_URI` | `mongodb://localhost:27017/i-do-easy` | MongoDB connection string |
| `JWT_SECRET` | `your-secret-key` | JWT signing secret |
| `JWT_EXPIRES` | `1440` | JWT expiration in minutes |
| `JWT_MAX_INACTIVE_MINUTES` | `180` | Max inactive session time |
| `USER_ADMIN` | `admin@entech.io` | Admin user email |
| `USER_PASSWORD` | `123@Change$` | Admin user password |
| `LOG_LEVEL` | `info` | Logging level |
| `LOG_FORMAT` | `json` | Log format |

## Image Details

- **Base Image**: Node.js 22 Alpine
- **Simple Build**: Single-stage build for production
- **SSH Support**: Includes SSH keys for private repository access during build
- **Port**: Exposes port 3000
- **Optimized**: Removes source code, SSH keys, and build tools after build

## Environment Variables Usage

### Docker Compose
```bash
# Copy example file and customize
cp env.example .env
nano .env

# Start services with environment variables
docker-compose up --build
```

### Docker Run
```bash
# Run with environment file
docker run --env-file .env -p 3000:3000 idoeasy-backend:latest

# Run with specific variables
docker run -e NODE_ENV=production -e PORT=3000 -p 3000:3000 idoeasy-backend:latest
```

### Build with Environment
```bash
# Build with .env file (default)
docker build -t idoeasy-backend:latest .

# Build for ECR with .env file
./scripts/build-ecr.sh <ECR_URL> <TAG>
```

## Production Considerations

1. **Environment Variables**: Always override sensitive defaults in production
2. **MongoDB Atlas**: Use your Atlas connection string in production
3. **JWT Secret**: Use strong, unique secrets in production
4. **Logging**: Configure appropriate log levels for production
5. **Resource Limits**: Set appropriate CPU/memory limits in your deployment
6. **Environment File**: Use single `.env` file for all configurations

## Troubleshooting

### Common Issues

1. **Port Already in Use**: Change the port mapping in docker-compose.yml
2. **MongoDB Connection**: Ensure MongoDB is accessible from the container
3. **Permission Issues**: Check file permissions for the build script

### Debug Commands

```bash
# Check container logs
docker logs <container_id>

# Enter running container
docker exec -it <container_id> /bin/sh

# Check container health
docker inspect <container_id> | grep Health -A 10

# View running containers
docker ps
```

## Security Notes

- Environment variables should be managed securely in production
- Consider using Docker secrets for sensitive data in production
- The image runs as root (standard for Node.js containers)
