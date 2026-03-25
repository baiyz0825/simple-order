# ========== 阶段1: 安装依赖 ==========
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ========== 阶段2: 构建 ==========
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 设置构建时数据库路径
ENV DATABASE_URL="file:../data/order.db"

# 生成 Prisma Client
RUN npx prisma generate

# 构建应用
RUN npm run build

# ========== 阶段3: 运行 ==========
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL="file:../data/order.db"

# 复制完整的 node_modules（包含 prisma generate 生成的客户端）
COPY --from=builder /app/node_modules ./node_modules

# 复制 package.json 和 package-lock.json
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/server.js ./
COPY --from=builder /app/next.config.ts ./

# 复制 Prisma 相关文件
COPY --from=builder /app/prisma ./prisma

# 启动脚本
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

# 创建数据目录和上传目录
RUN mkdir -p data public/uploads

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
