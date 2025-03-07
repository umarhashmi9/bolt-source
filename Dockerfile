FROM node:20-alpine

# Install git and other needed dependencies
RUN apk add --no-cache git

WORKDIR /app

# Copy package files first for better caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install

# Copy all files
COPY . /app/

# Update the vite.config.ts file to include v3_singleFetch future flag
RUN if [ -f vite.config.ts ]; then \
    sed -i 's/remix()/remix({ future: { v3_singleFetch: true } })/g' vite.config.ts; \
    fi

# Build with different approach to avoid Cloudflare worker issues
RUN NODE_ENV=production pnpm run build || (echo "Build failed, trying with different settings" && \
    sed -i 's/vite:build/build/g' package.json && \
    pnpm run build)

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["pnpm", "run", "start"]
