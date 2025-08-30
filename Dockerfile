# Production Dockerfile for NestJS application
FROM node:22-alpine

# Build arguments for environment configuration
ARG ENV_FILE=.env

# Install git and openssh for private repository access
RUN apk add --no-cache git openssh-client

# Set working directory
WORKDIR /app

# Copy SSH keys for private repository access
COPY ssh_keys/ /root/.ssh/
RUN chmod 600 /root/.ssh/deploy_key && \
    chmod 644 /root/.ssh/deploy_key.pub && \
    ssh-keyscan github.com >> /root/.ssh/known_hosts && \
    echo "IdentityFile /root/.ssh/deploy_key" >> /root/.ssh/config && \
    eval "$(ssh-agent -s)" && \
    ssh-add /root/.ssh/deploy_key && \
    git config --global url."git@github.com:".insteadOf "https://github.com/" && \
    ssh -T git@github.com || true

# Copy package files
COPY package*.json ./

# Install dependencies using SSH keys
RUN npm ci

# Copy source code
COPY . .

# Copy environment file if it exists
COPY ${ENV_FILE} .env

# Build the application
RUN npm run build

# Clean up source code, dev dependencies, SSH keys, and build tools
RUN npm prune --production && \
    rm -rf src test docs scripts .eslintrc* .prettierrc* tsconfig* jest.config* eslint.config* /root/.ssh && \
    apk del git openssh-client

# Expose port
EXPOSE 3000

# Start the application with environment variables
CMD ["sh", "-c", "node dist/main"]

