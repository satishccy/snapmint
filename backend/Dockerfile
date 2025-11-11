# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Enable corepack and pnpm
RUN corepack enable

# Copy lockfile and package.json for install layer caching
COPY pnpm-lock.yaml package.json ./

# Install dependencies (frozen lockfile for reproducibility)
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Generate Prisma client if schema exists (will no-op if not configured)
RUN if [ -f prisma/schema.prisma ]; then pnpm prisma:generate; fi

# Build TypeScript
RUN pnpm build

# Runtime stage (Debian-based to provide compatible OpenSSL for Prisma)
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3543

# Enable corepack and pnpm
RUN corepack enable
# Install OpenSSL for Prisma engine compatibility
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy only production deps
COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile --prod

# Copy prisma schema before generating client
COPY --from=build /app/prisma ./prisma
# Install Prisma CLI matching @prisma/client version and generate client
RUN pnpm add -D prisma@5.22.0 \
  && pnpm prisma generate

# Copy build artifacts
COPY --from=build /app/dist ./dist

EXPOSE 3543

# Optional: Healthcheck could be added at compose level
CMD ["node", "dist/index.js"]
