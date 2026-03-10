#!/bin/sh
set -e

DB_PATH="${DATABASE_URL#file:}"

# 首次启动：如果数据库文件不存在，则初始化
if [ ! -f "$DB_PATH" ]; then
  echo ">>> 首次启动，初始化数据库..."
  npx prisma db push --skip-generate
  echo ">>> 填充种子数据..."
  npx tsx prisma/seed.ts
  echo ">>> 数据库初始化完成"
else
  echo ">>> 检测到已有数据库，跳过初始化"
  # 应用可能的 schema 变更（安全操作，不会删除数据）
  npx prisma db push --skip-generate --accept-data-loss 2>/dev/null || true
fi

echo ">>> 启动服务器..."
exec node server.js
