# Dockerfile for Bolt.DIY - Revised for Render Deployment

# Use the desired Node.js version
ARG BASE=node:20.18.0
FROM ${BASE} AS base

# Set working directory
WORKDIR /app

# Install pnpm globally and copy dependency definitions
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm

# Install dependencies using pnpm (this layer is cached if lockfile doesn't change)
RUN pnpm install

# Copy the rest of the application code
# Note: Ensure your .dockerignore file excludes node_modules and .git
COPY . .

# Expose the port the application will run on internally
EXPOSE 5173

# --- Development Stage ---
# Defined here but NOT the final stage, so Render won't run this by default.
# Useful for local multi-stage builds if needed: docker build --target bolt-ai-development .
FROM base AS bolt-ai-development
# Add any ENV vars specifically needed only for the dev server, if any.
# The CMD starts the Vite development server.
CMD ["pnpm", "run", "dev", "--host"]
# --- End Development Stage ---


# --- Production Stage (FINAL STAGE) ---
# This is the stage Render will build and run by default.
FROM base AS bolt-ai-production

# Define ARG variables that can be passed during build time (less relevant for Render runtime)
# ARG GROQ_API_KEY
# ... other build-time ARGs if needed ...

# Define ENV variables for runtime configuration.
# Render will set these based on render.yaml or dashboard settings.
ENV WRANGLER_SEND_METRICS=false \
    # Ensure these ENV var names exactly match what Bolt.DIY expects at runtime
    GROQ_API_KEY=${GROQ_API_KEY} \
    HuggingFace_KEY=${HuggingFace_API_KEY} \
    OPENAI_API_KEY=${OPENAI_API_KEY} \
    ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY} \
    OPEN_ROUTER_API_KEY=${OPEN_ROUTER_API_KEY} \
    GOOGLE_GENERATIVE_AI_API_KEY=${GOOGLE_GENERATIVE_AI_API_KEY} \
    OLLAMA_API_BASE_URL=${OLLAMA_API_BASE_URL} \
    XAI_API_KEY=${XAI_API_KEY} \
    TOGETHER_API_KEY=${TOGETHER_API_KEY} \
    TOGETHER_API_BASE_URL=${TOGETHER_API_BASE_URL} \
    MISTRAL_API_KEY=${MISTRAL_API_KEY} \
    DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY} \
    COHERE_API_KEY=${COHERE_API_KEY} \
    PERPLEXITY_API_KEY=${PERPLEXITY_API_KEY} \
    AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID} \
    AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY} \
    AWS_REGION=${AWS_REGION} \
    LMSTUDIO_BASE_URL=${LMSTUDIO_BASE_URL} \
    OPENAI_LIKE_BASE_URL=${OPENAI_LIKE_BASE_URL} \
    # VITE_LOG_LEVEL=info # Set a default log level for production if needed
    # DEFAULT_NUM_CTX= # Set default context if needed
    RUNNING_IN_DOCKER=true \
    # Set NODE_ENV to production for Remix/other libraries
    NODE_ENV=production

# Create wrangler config directory to disable metrics sending (optional but good practice)
RUN mkdir -p /root/.config/.wrangler && \
    echo '{"enabled":false}' > /root/.config/.wrangler/metrics.json

# Build the production application artifacts
RUN pnpm run build

# Define the command to run the production server
# Ensure the 'dockerstart' script in package.json correctly starts the production server.
CMD [ "pnpm", "run", "dockerstart"]
# --- End Production Stage ---
