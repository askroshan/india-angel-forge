#!/bin/bash
# ============================================
# India Angel Forum - Production Deployment Script
# Runs on the production server after image transfer
# ============================================
set -euo pipefail

DEPLOY_DIR="/home/deployuser/indiaangelforum"
ENV_FILE="$DEPLOY_DIR/.env.production"
COMPOSE_FILE="$DEPLOY_DIR/docker-compose.prod.yml"
IMAGE_ARCHIVE="$DEPLOY_DIR/indiaangelforum-image.tar.gz"

echo "=========================================="
echo "🚀 India Angel Forum - Production Deploy"
echo "=========================================="

cd "$DEPLOY_DIR"

# ---- Step 1: Generate secrets if first deploy ----
if [ ! -f "$ENV_FILE" ]; then
  echo "📝 First deploy - generating .env.production..."
  
  DB_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
  JWT_SECRET=$(openssl rand -base64 64 | tr -dc 'a-zA-Z0-9' | head -c 64)
  ENCRYPTION_KEY=$(openssl rand -hex 32)
  
  cat > "$ENV_FILE" <<EOF
# India Angel Forum - Production Environment
# Auto-generated on $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# DO NOT COMMIT THIS FILE

NODE_ENV=production
API_PORT=3001

# Database (Docker internal network)
POSTGRES_DB=indiaangelforum
POSTGRES_USER=indiaangel
POSTGRES_PASSWORD=${DB_PASSWORD}
DATABASE_URL=postgresql://indiaangel:${DB_PASSWORD}@db:5432/indiaangelforum?schema=public

# Redis (Docker internal network)
REDIS_URL=redis://redis:6379

# Security
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# Frontend URL
FRONTEND_URL=https://indiaangelforum.com
CORS_ORIGINS=https://indiaangelforum.com,https://www.indiaangelforum.com

# Email (set via GitHub secrets)
EMAILIT_API_KEY=${EMAILIT_API_KEY:-}
EMAILIT_FROM_EMAIL=noreply@indiaangelforum.com
EMAILIT_FROM_NAME=India Angel Forum

# Razorpay (add later)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# File storage
UPLOAD_DIR=./uploads
INVOICE_DIR=./invoices
ATTACHMENT_DIR=./attachments
ARCHIVE_DIR=./archives

# Seed on first deploy
SEED_ON_START=true
EOF

  echo "✅ Generated .env.production with secure secrets"
else
  echo "✅ .env.production already exists"
fi

# ---- Step 2: Verify Docker image is loaded ----
if [ -f "$IMAGE_ARCHIVE" ]; then
  echo "📦 Loading Docker image from archive..."
  docker load -i "$IMAGE_ARCHIVE"
  rm -f "$IMAGE_ARCHIVE"
  echo "✅ Docker image loaded from archive"
elif docker image inspect indiaangelforum:latest > /dev/null 2>&1; then
  echo "✅ Docker image already loaded"
else
  echo "❌ No image archive and no image loaded"
  exit 1
fi

# ---- Step 3: Export env vars for docker compose ----
echo "📋 Loading environment variables..."
set -a
source "$ENV_FILE"
set +a

# ---- Step 4: Stop existing containers (graceful) ----
echo "🛑 Stopping existing containers..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down --timeout 30 2>/dev/null || true

# ---- Step 5: Start services ----
echo "🚀 Starting services..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

# ---- Step 6: Wait for health checks ----
echo "⏳ Waiting for services to be healthy..."
RETRIES=30
until docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps | grep -q "(healthy)" || [ $RETRIES -eq 0 ]; do
  echo "  Waiting... ($RETRIES retries left)"
  sleep 5
  RETRIES=$((RETRIES - 1))
done

if [ $RETRIES -eq 0 ]; then
  echo "❌ Services did not become healthy in time"
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs --tail=50
  exit 1
fi

# ---- Step 7: Disable seed after first run ----
if grep -q "SEED_ON_START=true" "$ENV_FILE"; then
  sed -i 's/SEED_ON_START=true/SEED_ON_START=false/' "$ENV_FILE"
  echo "✅ Disabled SEED_ON_START after first deploy"
fi

echo ""
echo "=========================================="
echo "✅ Deployment complete!"
echo "  App: http://127.0.0.1:11160"
echo "  Health: http://127.0.0.1:11160/api/health"
echo "=========================================="
