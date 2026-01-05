# Stage 1: Build (Same as original)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy only package files first (better layer caching)
COPY package*.json ./

# Install all dependencies (needed for build)
RUN npm ci --ignore-scripts

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Prune dev dependencies to reduce size
RUN npm prune --production && \
    rm -rf ~/.npm /tmp/*

# Stage 2: Runtime (smaller image)
FROM node:20-alpine AS runtime

# Install Chromium, socat and cleanup in single layer
RUN apk add --no-cache chromium socat && \
    rm -rf /var/cache/apk/*

# Chromium configuration
ENV PLAYWRIGHT_BROWSERS_PATH=/usr/bin
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=true
ENV CHROMIUM_PATH=/usr/bin/chromium-browser
ENV NODE_ENV=production

WORKDIR /app

# Copy only production dependencies and built code
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Create patterns directory
RUN mkdir -p patterns

# Create default config for headless mode in container
RUN echo '{"headless":true}' > config.json

# Expose port (standard MCP port, though configurable)
EXPOSE 3000

# Run via socat to expose Stdio over TCP
# server: connect to stdin/stdout of the node process
# client: connect to TCP port 3000
CMD socat TCP-LISTEN:3000,fork,reuseaddr EXEC:"node dist/index.js"
