FROM node:18

WORKDIR /app

# Enable pnpm
RUN corepack enable

# Copy the entire strudel repo (context should be the root of algorave, but we will scope it in compose)
# Actually, the build context in docker-compose will be the root, so we copy strudel/
COPY strudel/ ./

# Install dependencies
RUN pnpm install

# Expose Astro default port
EXPOSE 4321

# Run the dev server (npm run start -> cd website && npm run dev -> astro dev --host)
CMD ["npm", "run", "start"]
