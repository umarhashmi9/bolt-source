FROM node:20-alpine

WORKDIR /app

# Copy all files
COPY . /app/

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install

# Build the application
RUN pnpm run build

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["pnpm", "run", "start"]
