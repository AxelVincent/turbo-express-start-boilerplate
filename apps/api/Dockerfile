# Build stage
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Install turbo and pnpm
RUN npm install -g pnpm@9.7.1 turbo

# Builder Stage
FROM base AS builder
WORKDIR /app
COPY . .
# Prune the workspace
RUN turbo prune api --docker

# Installer Stage    
FROM base AS installer
WORKDIR /app

# First install dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/full/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install

# Build the project and its dependencies
RUN pnpm turbo run build --filter=api

# Runner Stage
FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 expressjs
RUN adduser --system --uid 1001 expressjs
USER expressjs

# Copy the built project
COPY --from=installer /app .

EXPOSE 3030
CMD ["node", "apps/api/dist/index.js"]
