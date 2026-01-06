
# Inherit from the base image built from strudel-mcp-server
FROM algorave/mcp-base:latest

WORKDIR /app

# Install Bridge Dependencies on top
RUN npm install express @modelcontextprotocol/sdk

# Copy Bridge Script
COPY docker/strudel-mcp/sse-bridge.js .

# Expose SSE Port
EXPOSE 3001

# Run the Bridge
CMD ["node", "sse-bridge.js"]
