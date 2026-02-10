#!/bin/sh
set -e

# 每次启动时将镜像中的前端构建产物同步到卷，确保重建镜像后前端也更新
# （Docker 命名卷仅在首次创建时从镜像复制，后续不会自动更新）
rm -rf /app/packages/client/dist/*
cp -a /app/packages/client/dist-image/. /app/packages/client/dist/

# Fix volume permissions (volumes may not inherit ownership from image)
chown -R appuser:appgroup /data /app/packages/server/uploads

# Run migrations, seed, and start server as appuser
exec su-exec appuser sh -c "\
  npx prisma migrate deploy --schema=packages/server/prisma/schema.prisma && \
  node packages/server/dist/prisma/seed.js && \
  node packages/server/dist/index.js"
