# Build stage
FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"


# Install turbo and pnpm
RUN npm install -g pnpm@9.7.1 turbo

# Builder Stage
FROM base AS builder
WORKDIR /app

# Copy source code
COPY . .

# Prune the workspace
RUN turbo prune front --docker

# Installer Stage    
FROM base AS installer
WORKDIR /app

# Define build arguments again
ARG VITE_API_WEB_BASE_URL
ARG VITE_WS_BASE_URL
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG SENTRY_AUTH_TOKEN
ARG VITE_POSTHOG_KEY
ARG VITE_POSTHOG_HOST


# Set them as environment variables
ENV VITE_API_WEB_BASE_URL=$VITE_API_WEB_BASE_URL
ENV VITE_WS_BASE_URL=$VITE_WS_BASE_URL
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN
ENV VITE_POSTHOG_KEY=$VITE_POSTHOG_KEY
ENV VITE_POSTHOG_HOST=$VITE_POSTHOG_HOST

COPY --from=builder /app/out/full/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Install dependencies and build the project
# Modified to use --no-frozen-lockfile to address the lockfile mismatch
RUN pnpm install --no-frozen-lockfile && pnpm -v && node -v

# Build the project
RUN pnpm turbo build --filter=front...

# Production image
FROM node:22-slim AS runner
WORKDIR /app

# Copy the built output from Nitro
COPY --from=installer /app/apps/front/.output /app/.output

# Copy package.json for npm start command (optional, but good practice)
COPY --from=installer /app/apps/front/package.json /app/package.json

# Expose port (Railway will set PORT env var, but Nitro defaults to 3000)
EXPOSE 3000

# Start the application using node
CMD ["node", ".output/server/index.mjs"]