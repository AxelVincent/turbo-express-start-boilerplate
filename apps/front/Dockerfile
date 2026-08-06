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
RUN turbo prune @repo/front --docker

# Installer Stage    
FROM base AS installer
WORKDIR /app

# VITE_* values are inlined at build time, so they must be present here rather
# than supplied at run time. Add an ARG/ENV pair for each new one, and list it
# in turbo.json's build env so the cache key accounts for it.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY --from=builder /app/out/full/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Install dependencies and build the project
# Modified to use --no-frozen-lockfile to address the lockfile mismatch
RUN pnpm install --no-frozen-lockfile && pnpm -v && node -v

# Build the project
RUN pnpm turbo build --filter=@repo/front...

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