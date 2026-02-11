#!/bin/sh
set -e

echo "🚀 Starting India Angel Forum Production Server..."

# Run database migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client (if not already done)
echo "🔧 Generating Prisma client..."
npx prisma generate

# Seed database if SEED_ON_START is set
if [ "$SEED_ON_START" = "true" ]; then
  echo "🌱 Seeding database..."
  node --experimental-specifier-resolution=node dist-server/prisma/seed/index.js || echo "⚠️ Seed skipped or failed (non-fatal)"
fi

# Start the server using tsx (handles TypeScript ESM)
echo "✅ Starting API server on port ${API_PORT:-3001}..."
exec npx tsx server.ts
