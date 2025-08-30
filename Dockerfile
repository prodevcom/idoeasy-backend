# syntax=docker/dockerfile:1.6

########### BUILDER (git + ssh only here) ###########
FROM node:22-alpine AS builder
WORKDIR /app

# Tools needed only to resolve git+ssh deps
RUN apk add --no-cache git openssh-client libc6-compat

# ---- SSH setup ----
# Expect: ssh_keys/deploy_key (required). deploy_key.pub is optional.
COPY ssh_keys/ /root/.ssh/
RUN chmod 700 /root/.ssh \
    && chmod 600 /root/.ssh/deploy_key \
    && if [ -f /root/.ssh/deploy_key.pub ]; then chmod 644 /root/.ssh/deploy_key.pub; fi \
    && touch /root/.ssh/known_hosts \
    && ssh-keyscan -t rsa,ecdsa,ed25519 github.com >> /root/.ssh/known_hosts \
    && printf "Host github.com\n  IdentityFile /root/.ssh/deploy_key\n  IdentitiesOnly yes\n" >> /root/.ssh/config \
    && git config --global url."git@github.com:".insteadOf "https://github.com/"

# ---- deps (npm ci) ----
# If you don't keep a lockfile, change 'npm ci' to 'npm install'
COPY package.json package-lock.json* ./
RUN npm ci

# ---- build (ts -> js) ----
COPY . .
RUN npm run build

# keep only prod deps for runtime
RUN npm prune --omit=dev

# remove ssh and build tools from this stage's filesystem (belt & suspenders)
RUN rm -rf /root/.ssh && apk del git openssh-client

########### RUNTIME (no git, no ssh, no npm) ###########
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NODE_OPTIONS="--enable-source-maps"

# Non-root user
RUN addgroup -S nodejs && adduser -S nodeuser -G nodejs

# Copy minimal runtime artifacts
COPY --chown=nodeuser:nodejs package.json ./package.json
COPY --from=builder --chown=nodeuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodeuser:nodejs /app/dist ./dist

USER nodeuser
EXPOSE 3000
CMD ["node", "dist/main.js"]