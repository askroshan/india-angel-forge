#!/bin/bash
# Event Attendance Test Runner
# Complete test execution script with server management

set -e

echo "🧹 Cleaning up existing processes..."
pkill -9 -f "tsx watch server.ts" 2>/dev/null || true
pkill -9 -f "node.*vite" 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
sleep 2

echo "🚀 Starting backend server..."
npm run dev:server > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

echo "🎨 Starting frontend server..."
PORT=8080 npm run dev > /tmp/vite.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo "⏳ Waiting for servers to start..."
sleep 15

echo "🔍 Checking server health..."
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend is running on http://localhost:3001"
else
    echo "❌ Backend failed to start"
    cat /tmp/backend.log
    exit 1
fi

if curl -s http://localhost:8080 > /dev/null; then
    echo "✅ Frontend is running on http://localhost:8080"
else
    echo "❌ Frontend failed to start"
    cat /tmp/vite.log
    exit 1
fi

echo ""
echo "🧪 Running Event Attendance Test Suite..."
echo "================================================"
npx playwright test e2e/event-attendance.spec.ts --project=chromium --timeout=60000

TEST_EXIT_CODE=$?

echo ""
echo "📊 Test Results:"
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ All tests passed!"
else
    echo "⚠️  Some tests failed (exit code: $TEST_EXIT_CODE)"
    echo "View detailed report: npx playwright show-report"
fi

echo ""
echo "🛑 Stopping servers..."
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
pkill -9 -f "tsx watch server.ts" 2>/dev/null || true
pkill -9 -f "node.*vite" 2>/dev/null || true

echo "✨ Done!"
exit $TEST_EXIT_CODE
