#!/bin/bash
set -e

echo "Building API server..."
cd /home/runner/workspace
pnpm --filter @workspace/api-server run build

echo "Starting API server on port 3000..."
PORT=3000 node --enable-source-maps artifacts/api-server/dist/index.mjs &
API_PID=$!

echo "Starting frontend on port 5000..."
PORT=5000 BASE_PATH=/ pnpm --filter @workspace/notebook run dev &
FRONTEND_PID=$!

trap "kill $API_PID $FRONTEND_PID 2>/dev/null; exit" SIGTERM SIGINT

wait $API_PID $FRONTEND_PID
