#!/bin/bash
set -e

pnpm --filter @workspace/api-server run build

PORT=3000 node --enable-source-maps ./artifacts/api-server/dist/index.mjs &
API_PID=$!

PORT=5000 BASE_PATH=/ pnpm --filter @workspace/notebook run dev &
FRONTEND_PID=$!

wait $API_PID $FRONTEND_PID
