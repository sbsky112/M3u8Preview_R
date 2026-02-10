# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# 先复制 package 文件以利用 Docker 层缓存
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/
COPY packages/client/package.json ./packages/client/
RUN npm ci

# 复制全部源码（node_modules 已在 .dockerignore 中排除，不会覆盖）
COPY . .

# Generate Prisma Client
RUN npx prisma generate --schema=packages/server/prisma/schema.prisma

# Build server（tsc -b 通过 references 自动先构建 shared）
RUN npm run build -w packages/server

# Compile seed script (outside src/, needs separate tsc call)
RUN npx tsc --esModuleInterop --module nodenext --moduleResolution nodenext --target es2022 --outDir packages/server/dist/prisma --rootDir packages/server/prisma packages/server/prisma/seed.ts

# Build client
RUN npm run build -w packages/client

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install ffmpeg and su-exec (for entrypoint privilege drop)
RUN apk add --no-cache ffmpeg su-exec curl

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package files
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/
COPY packages/client/package.json ./packages/client/

# Install production dependencies
RUN npm ci --omit=dev

# Copy Prisma schema and generate client
COPY packages/server/prisma ./packages/server/prisma
RUN npx prisma generate --schema=packages/server/prisma/schema.prisma

# Copy build outputs
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/server/dist ./packages/server/dist
COPY --from=builder /app/packages/client/dist ./packages/client/dist

# Create data and uploads directories with proper ownership
RUN mkdir -p /data /app/packages/server/uploads/thumbnails && \
    chown -R appuser:appgroup /data /app/packages/server/uploads /app/packages/server/prisma

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -sf http://127.0.0.1:3000/api/health > /dev/null || exit 1

# Entrypoint fixes volume permissions then drops to appuser
ENTRYPOINT ["docker-entrypoint.sh"]
