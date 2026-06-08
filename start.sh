#!/bin/bash
PORT=3000 pnpm --filter @workspace/api-server run dev &
PORT=21990 BASE_PATH=/ pnpm --filter @workspace/notebook run dev 2>/dev/null &
PORT=5000 BASE_PATH=/ pnpm --filter @workspace/notebook run dev
