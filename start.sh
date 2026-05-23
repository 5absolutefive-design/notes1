#!/bin/bash
PORT=21990 BASE_PATH=/ pnpm --filter @workspace/notebook run dev 2>/dev/null &
PORT=5000 BASE_PATH=/ pnpm --filter @workspace/notebook run dev
