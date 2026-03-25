#!/bin/bash
set -e

echo "=========================================="
echo "  本地开发启动脚本"
echo "=========================================="

# 设置环境变量
# 注意：SQLite 路径相对于 prisma/schema.prisma，所以用 ../data 而不是 ./data
export DATABASE_URL="file:../data/order.db"
export JWT_SECRET="dev-secret-12345"
export NODE_ENV="development"

echo ""
echo ">>> 环境变量已设置:"
echo "    DATABASE_URL=$DATABASE_URL"
echo "    NODE_ENV=$NODE_ENV"
echo ""

# 确保依赖安装
if [ ! -d "node_modules" ]; then
  echo ">>> 安装依赖..."
  npm install
fi

# 生成 Prisma Client
echo ">>> 生成 Prisma Client..."
npx prisma generate

# 创建数据库目录
mkdir -p data

# 检查数据库是否存在
if [ ! -f "data/order.db" ]; then
  echo ">>> 创建数据库..."
  npx prisma db push
  echo ">>> 数据库创建完成"
else
  echo ">>> 数据库已存在"
fi

echo ""
echo ">>> 启动开发服务器..."
echo "    访问: http://localhost:3000"
echo "    初始化: http://localhost:3000/admin/setup"
echo ""

npm run dev
