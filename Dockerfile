# Use Node.js 18 as the base image
FROM node:18

# Set working directory
WORKDIR /app

# Install Core Utilities
RUN apt-get update && apt-get install -y curl

# Remove existing PNPM installation if it exists
RUN rm -rf /usr/local/bin/pnpm /root/.local/share/pnpm

# Install PNPM properly
RUN curl -fsSL https://get.pnpm.io/install.sh | bash

# Ensure PNPM is accessible globally
ENV PATH="/root/.local/share/pnpm:/usr/local/bin:$PATH"

# Copy package.json and lock file first (optimizes caching)
COPY package*.json pnpm-lock.yaml ./

# Install dependencies
RUN /root/.local/share/pnpm/pnpm install

# Copy all project files into the container
COPY . .

# Expose the default Vite development port
EXPOSE 5173

# Start the app
CMD ["pnpm", "run", "dev", "--host"]
