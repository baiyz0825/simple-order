#!/bin/bash
set -e

# ============================================================
#  精品咖啡烘焙店 - 在线点单系统 一键部署脚本
# ============================================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
fail()  { echo -e "${RED}[FAIL]${NC}  $1"; exit 1; }

# ──────────────── 参数解析 ────────────────

MODE="docker"       # docker | local
PORT=3000
JWT_SECRET=""
SKIP_SEED=false

print_usage() {
  echo ""
  echo "用法: ./deploy.sh [选项]"
  echo ""
  echo "选项:"
  echo "  --mode <docker|local>   部署模式 (默认: docker)"
  echo "  --port <端口号>          服务端口 (默认: 3000)"
  echo "  --jwt-secret <密钥>     JWT 签名密钥 (生产环境必须设置)"
  echo "  --skip-seed             跳过种子数据填充"
  echo "  -h, --help              显示帮助信息"
  echo ""
  echo "示例:"
  echo "  ./deploy.sh                                    # Docker 默认部署"
  echo "  ./deploy.sh --mode local                       # 本地部署"
  echo "  ./deploy.sh --port 8080 --jwt-secret mykey123  # 自定义端口和密钥"
  echo ""
}

while [[ $# -gt 0 ]]; do
  case $1 in
    --mode)       MODE="$2"; shift 2 ;;
    --port)       PORT="$2"; shift 2 ;;
    --jwt-secret) JWT_SECRET="$2"; shift 2 ;;
    --skip-seed)  SKIP_SEED=true; shift ;;
    -h|--help)    print_usage; exit 0 ;;
    *)            warn "未知参数: $1"; shift ;;
  esac
done

# ──────────────── 生成 JWT_SECRET ────────────────

if [ -z "$JWT_SECRET" ]; then
  JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | base64 | tr -d '/+=' | head -c 64)
  warn "未指定 JWT_SECRET，已自动生成随机密钥"
fi

echo ""
echo "=============================================="
echo "  精品咖啡烘焙店 - 在线点单系统"
echo "=============================================="
echo ""
info "部署模式: ${MODE}"
info "服务端口: ${PORT}"
echo ""

# ============================================================
#  Docker 部署模式
# ============================================================

deploy_docker() {
  info "检查 Docker 环境..."

  if ! command -v docker &>/dev/null; then
    fail "未找到 Docker，请先安装: https://docs.docker.com/get-docker/"
  fi

  if ! docker info &>/dev/null; then
    fail "Docker 未运行，请先启动 Docker"
  fi

  # 检查 docker compose 命令
  if docker compose version &>/dev/null; then
    COMPOSE_CMD="docker compose"
  elif command -v docker-compose &>/dev/null; then
    COMPOSE_CMD="docker-compose"
  else
    fail "未找到 docker compose，请安装 Docker Compose"
  fi

  ok "Docker 环境就绪"

  # 停止旧容器（如有）
  info "停止旧容器..."
  PORT=$PORT JWT_SECRET=$JWT_SECRET $COMPOSE_CMD down 2>/dev/null || true

  # 构建镜像
  info "构建 Docker 镜像（首次可能需要几分钟）..."
  PORT=$PORT JWT_SECRET=$JWT_SECRET $COMPOSE_CMD build --no-cache

  ok "镜像构建完成"

  # 启动容器
  info "启动容器..."
  PORT=$PORT JWT_SECRET=$JWT_SECRET $COMPOSE_CMD up -d

  ok "容器已启动"

  # 等待服务就绪
  info "等待服务就绪..."
  RETRIES=30
  until curl -sf "http://localhost:${PORT}/api/settings" >/dev/null 2>&1; do
    RETRIES=$((RETRIES - 1))
    if [ $RETRIES -le 0 ]; then
      warn "服务启动超时，请检查日志: ${COMPOSE_CMD} logs"
      return
    fi
    sleep 2
  done

  ok "服务已就绪"
  echo ""
  echo "=============================================="
  echo -e "  ${GREEN}部署成功!${NC}"
  echo "=============================================="
  echo ""
  echo "  访问地址:     http://localhost:${PORT}"
  echo "  管理后台:     http://localhost:${PORT}/admin/login"
  echo ""
  echo "  管理员账户:   admin@example.com / admin123"
  echo "  测试顾客:     13800138001 / 123456"
  echo ""
  echo "  常用命令:"
  echo "    查看日志:   ${COMPOSE_CMD} logs -f"
  echo "    停止服务:   ${COMPOSE_CMD} down"
  echo "    重启服务:   ${COMPOSE_CMD} restart"
  echo ""
}

# ============================================================
#  本地部署模式（无 Docker）
# ============================================================

deploy_local() {
  info "检查 Node.js 环境..."

  if ! command -v node &>/dev/null; then
    fail "未找到 Node.js，请先安装 Node.js >= 18: https://nodejs.org"
  fi

  NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_VER" -lt 18 ]; then
    fail "Node.js 版本过低 (v${NODE_VER})，需要 >= 18"
  fi

  ok "Node.js $(node -v) 就绪"

  if ! command -v npm &>/dev/null; then
    fail "未找到 npm"
  fi

  # 安装依赖
  info "安装依赖..."
  npm ci --omit=dev 2>/dev/null || npm install --production

  # 额外安装构建时需要的 devDependencies
  npm install --no-save tsx @tailwindcss/postcss tailwindcss typescript @types/node @types/react @types/react-dom @types/bcryptjs @types/jsonwebtoken @types/uuid @types/ws eslint eslint-config-next

  ok "依赖安装完成"

  # 生成 Prisma Client
  info "生成 Prisma Client..."
  npx prisma generate
  ok "Prisma Client 已生成"

  # 初始化数据库
  DB_FILE="./prisma/data/order.db"
  if [ ! -f "$DB_FILE" ]; then
    info "初始化数据库..."
    npx prisma db push
    ok "数据库结构已同步"

    if [ "$SKIP_SEED" = false ]; then
      info "填充种子数据..."
      npx prisma db seed
      ok "种子数据已填充"
    fi
  else
    ok "检测到已有数据库，跳过初始化"
    npx prisma db push --accept-data-loss 2>/dev/null || true
  fi

  # 构建
  info "构建生产版本..."
  npm run build
  ok "构建完成"

  # 写入环境变量
  echo "JWT_SECRET=${JWT_SECRET}" > .env.production
  echo "PORT=${PORT}" >> .env.production
  echo 'DATABASE_URL="file:./prisma/data/order.db"' >> .env.production

  ok "环境变量已写入 .env.production"

  # 启动
  info "启动生产服务器..."
  echo ""
  echo "=============================================="
  echo -e "  ${GREEN}部署完成!${NC}"
  echo "=============================================="
  echo ""
  echo "  启动命令:     PORT=${PORT} JWT_SECRET=*** npm run start"
  echo "  访问地址:     http://localhost:${PORT}"
  echo "  管理后台:     http://localhost:${PORT}/admin/login"
  echo ""
  echo "  管理员账户:   admin@example.com / admin123"
  echo "  测试顾客:     13800138001 / 123456"
  echo ""
  echo "  后台运行(推荐):"
  echo "    nohup env PORT=${PORT} JWT_SECRET=${JWT_SECRET} npm run start > app.log 2>&1 &"
  echo ""
  echo "  使用 PM2 (推荐生产环境):"
  echo "    npm install -g pm2"
  echo "    PORT=${PORT} JWT_SECRET=${JWT_SECRET} pm2 start server.js --name order-app"
  echo "    pm2 save && pm2 startup"
  echo ""
}

# ──────────────── 执行部署 ────────────────

case $MODE in
  docker) deploy_docker ;;
  local)  deploy_local ;;
  *)      fail "未知部署模式: ${MODE}，支持 docker 或 local" ;;
esac
