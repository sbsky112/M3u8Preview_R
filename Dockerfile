# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/
COPY packages/client/package.json ./packages/client/
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build shared types
RUN npm run build -w packages/shared

# Generate Prisma Client
RUN npx prisma generate --schema=packages/server/prisma/schema.prisma

# Build server
RUN npm run build -w packages/server

# Build client
RUN npm run build -w packages/client

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/

# Install production dependencies
RUN npm ci --omit=dev

# Copy Prisma schema and generate client
COPY packages/server/prisma ./packages/server/prisma
RUN npx prisma generate --schema=packages/server/prisma/schema.prisma

# Copy build outputs
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/server/dist ./packages/server/dist
COPY --from=builder /app/packages/client/dist ./packages/client/dist

# Create data and uploads directories
RUN mkdir -p /data /app/packages/server/uploads

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Run migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy --schema=packages/server/prisma/schema.prisma && node packages/server/dist/index.js"]
