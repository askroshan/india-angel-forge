# ============================================
# India Angel Forum - Production Dockerfile
# Single-stage build with tsx for TypeScript ESM
# ============================================

FROM node:20-alpine

WORKDIR /app

# Install build dependencies and runtime tools
RUN apk add --no-cache python3 make g++ curl

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (need devDeps for tsx, prisma generate)
RUN npm install --legacy-peer-deps

# Copy prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy all source files
COPY . .

# Build frontend (Vite)
RUN npm run build

# Create directories for uploads and data
RUN mkdir -p uploads invoices attachments archives public/statements public/certificates public/uploads

# Make startup script executable
RUN chmod +x start-production.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

# Expose API port
EXPOSE 3001

# Start the application
CMD ["./start-production.sh"]
