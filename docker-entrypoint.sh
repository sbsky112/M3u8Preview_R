#!/bin/sh
set -e

# Fix volume permissions (volumes may not inherit ownership from image)
chown -R appuser:appgroup /data /app/packages/server/uploads

# Run migrations, seed, and start server as appuser
exec su-exec appuser sh -c "\
  npx prisma migrate deploy --schema=packages/server/prisma/schema.prisma && \
  node packages/server/dist/prisma/seed.js && \
  node packages/server/dist/index.js"
