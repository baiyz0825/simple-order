#!/bin/sh
set -e

echo "=========================================="
echo "  订单系统 Docker 启动"
echo "=========================================="

# 设置环境变量（确保即使 Dockerfile 没设置也能工作）
export DATABASE_URL="${DATABASE_URL:-file:../data/order.db}"
export JWT_SECRET="${JWT_SECRET:-production-secret-change-me}"
export NODE_ENV="${NODE_ENV:-production}"

echo ""
echo ">>> 环境变量:"
echo "    DATABASE_URL=$DATABASE_URL"
echo "    NODE_ENV=$NODE_ENV"
echo ""

# 创建必要的目录
mkdir -p data public/uploads

# 数据库路径（相对于项目根目录）
DB_PATH="./data/order.db"

# 首次启动时初始化数据库
if [ ! -f "$DB_PATH" ] || [ ! -s "$DB_PATH" ]; then
  echo ">>> 首次启动，初始化数据库..."
  # 先确保目录存在
  mkdir -p "$(dirname "$DB_PATH")"
  # 删除可能存在的空文件
  rm -f "$DB_PATH"
  # 创建数据库并同步表结构
  npx prisma db push --skip-generate
  # 验证数据库创建成功
  if [ ! -s "$DB_PATH" ]; then
    echo ">>> 错误：数据库创建失败"
    exit 1
  fi
  echo ">>> 数据库初始化完成"
  echo ""
else
  echo ">>> 数据库已存在，跳过初始化"
  echo ""
fi

echo ">>> 启动服务器..."
echo "    访问: http://localhost:3000"
echo "    初始化: http://localhost:3000/admin/setup"
echo ""

exec node server.js
