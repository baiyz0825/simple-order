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

# 设置构建时数据库路径（构建阶段仅生成 Prisma Client，不需要真实 DB）
ENV DATABASE_URL="file:./prisma/data/order.db"
RUN npx prisma generate
RUN npm run build

# ========== 阶段3: 运行 ==========
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# 从构建产物中复制必要文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Prisma 运行时
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# 自定义服务器（WebSocket 支持）
COPY --from=builder /app/server.js ./server.js

# 种子数据脚本依赖
COPY --from=builder /app/node_modules/tsx ./node_modules/tsx
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=builder /app/node_modules/uuid ./node_modules/uuid

# 启动脚本
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

# 创建数据目录和上传目录
RUN mkdir -p data public/uploads

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
