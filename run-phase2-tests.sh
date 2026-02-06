#!/bin/bash

# Phase 2 Test Runner
# Starts servers and runs all Phase 2 E2E tests

set -e

echo "🚀 Starting Phase 2 Test Suite..."

# Kill any existing servers
echo "🧹 Cleaning up existing processes..."
pkill -f "tsx watch server" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
lsof -ti:3001,8080 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 2

# Start backend server
echo "🔧 Starting backend server..."
npm run dev:server > /tmp/phase2-server.log 2>&1 &
SERVER_PID=$!
echo "Backend PID: $SERVER_PID"

# Wait for backend
sleep 5

# Check if backend is running
if ! curl -s http://localhost:3001/api/health > /dev/null; then
  echo "❌ Backend server failed to start"
  cat /tmp/phase2-server.log
  exit 1
fi
echo "✅ Backend server running"

# Start frontend server
echo "🎨 Starting frontend server..."
npm run dev > /tmp/phase2-vite.log 2>&1 &
VITE_PID=$!
echo "Frontend PID: $VITE_PID"

# Wait for frontend
sleep 8

# Check if frontend is running
if ! curl -s -I http://localhost:8080/ > /dev/null 2>&1; then
  echo "❌ Frontend server failed to start"
  cat /tmp/phase2-vite.log
  kill $SERVER_PID $VITE_PID 2>/dev/null || true
  exit 1
fi
echo "✅ Frontend server running"

# Run tests
echo ""
echo "🧪 Running Phase 2 E2E Tests..."
echo "================================"

npx playwright test \
  e2e/transaction-history.spec.ts \
  e2e/event-attendance.spec.ts \
  e2e/activity-timeline.spec.ts \
  e2e/financial-statements.spec.ts \
  --project=chromium \
  --reporter=list

TEST_EXIT=$?

# Cleanup
echo ""
echo "🧹 Cleaning up..."
kill $SERVER_PID $VITE_PID 2>/dev/null || true

if [ $TEST_EXIT -eq 0 ]; then
  echo "✅ All tests passed!"
else
  echo "❌ Some tests failed (exit code: $TEST_EXIT)"
fi

exit $TEST_EXIT
