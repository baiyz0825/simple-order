#!/bin/bash
set -e

# ============================================================
#  精品咖啡烘焙店 - 在线点单系统 一键安装脚本
# ============================================================

# Docker 镜像地址
IMAGE_NAME="${IMAGE_NAME:-ghcr.io/baiyz0825/order-webapp:latest}"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
fail()  { echo -e "${RED}[FAIL]${NC}  $1"; exit 1; }

# 打印标题
print_header() {
  echo ""
  echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${BLUE}║${NC}        ${BOLD}精品咖啡烘焙店 - 在线点单系统${NC}              ${BOLD}${BLUE}║${NC}"
  echo -e "${BOLD}${BLUE}║${NC}              ${BOLD}Docker 镜像部署${NC}                       ${BOLD}${BLUE}║${NC}"
  echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

# 显示使用帮助
show_help() {
  echo "使用方法: $0 [选项]"
  echo ""
  echo "选项:"
  echo "  --port PORT        服务端口 (默认: 3000)"
  echo "  --jwt-secret KEY   JWT 密钥 (默认: 自动生成)"
  echo "  --image IMAGE      Docker 镜像地址 (默认: ghcr.io/baiyz0825/order-webapp:latest)"
  echo "  --name NAME        容器名称 (默认: order-app)"
  echo "  --help             显示帮助信息"
  echo ""
  echo "示例:"
  echo "  $0                           # 使用默认配置"
  echo "  $0 --port 8080               # 指定端口"
  echo "  $0 --jwt-secret mysecret     # 指定 JWT 密钥"
  echo ""
  exit 0
}

# 解析参数
PORT=3000
JWT_SECRET=""
CONTAINER_NAME="order-app"

while [[ $# -gt 0 ]]; do
  case $1 in
    --port)
      PORT="$2"
      shift 2
      ;;
    --jwt-secret)
      JWT_SECRET="$2"
      shift 2
      ;;
    --image)
      IMAGE_NAME="$2"
      shift 2
      ;;
    --name)
      CONTAINER_NAME="$2"
      shift 2
      ;;
    --help|-h)
      show_help
      ;;
    *)
      warn "未知参数: $1"
      shift
      ;;
  esac
done

print_header

# 检查 Docker
info "检查 Docker 环境..."
if ! command -v docker &>/dev/null; then
  fail "未找到 Docker，请先安装: https://docs.docker.com/get-docker/"
fi

if ! docker info &>/dev/null; then
  fail "Docker 未运行，请先启动 Docker"
fi
ok "Docker 环境就绪"

# 生成 JWT 密钥
if [ -z "$JWT_SECRET" ]; then
  JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | base64 | tr -d '/+=' | head -c 64)
  ok "已自动生成 JWT 密钥"
fi

# 显示配置
echo ""
echo -e "${BOLD}${BLUE}═════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  部署配置${NC}"
echo -e "${BOLD}${BLUE}═════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${CYAN}镜像地址:${NC}   ${GREEN}${IMAGE_NAME}${NC}"
echo -e "  ${CYAN}容器名称:${NC}   ${GREEN}${CONTAINER_NAME}${NC}"
echo -e "  ${CYAN}服务端口:${NC}   ${GREEN}${PORT}${NC}"
echo -e "  ${CYAN}JWT密钥:${NC}    ${GREEN}${JWT_SECRET:0:16}...${NC}"
echo ""

# 拉取镜像
info "拉取镜像: ${IMAGE_NAME}"
if ! docker pull "${IMAGE_NAME}"; then
  fail "镜像拉取失败，请检查网络或镜像地址"
fi
ok "镜像拉取完成"

# 检查并停止现有容器
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    info "停止运行中的容器..."
    docker stop "${CONTAINER_NAME}" >/dev/null 2>&1 || true
  fi
  info "删除旧容器..."
  docker rm "${CONTAINER_NAME}" >/dev/null 2>&1 || true
fi

# 创建数据目录（使用本地目录而非卷，方便备份）
info "创建数据目录..."
mkdir -p ./data ./uploads
ok "数据目录已创建"

# 启动容器
info "启动容器..."
docker run -d \
  --name "${CONTAINER_NAME}" \
  --restart unless-stopped \
  -p "${PORT}:3000" \
  -v "$(pwd)/data:/app/data" \
  -v "$(pwd)/uploads:/app/public/uploads" \
  -e NODE_ENV=production \
  -e JWT_SECRET="${JWT_SECRET}" \
  -e DATABASE_URL="file:../data/order.db" \
  "${IMAGE_NAME}" || fail "容器启动失败"

ok "容器已启动"

# 等待服务就绪
info "等待服务启动..."
for i in {1..30}; do
  if curl -sf "http://localhost:${PORT}" >/dev/null 2>&1; then
    ok "服务已就绪！"
    break
  fi
  if [ $i -eq 30 ]; then
    warn "服务启动超时，请检查日志: docker logs ${CONTAINER_NAME}"
  fi
  sleep 1
done

# 保存配置
cat > .env.deploy <<EOF
# 部署配置
PORT=${PORT}
JWT_SECRET=${JWT_SECRET}
CONTAINER_NAME=${CONTAINER_NAME}
IMAGE_NAME=${IMAGE_NAME}
EOF

# 显示完成信息
echo ""
echo -e "${BOLD}${BLUE}═════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  部署完成！${NC}"
echo -e "${BOLD}${BLUE}═════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${CYAN}访问地址:${NC}     ${GREEN}http://localhost:$PORT${NC}"
echo ""
echo -e "${YELLOW}首次使用请访问初始化页面:${NC}"
echo -e "  ${GREEN}http://localhost:$PORT/admin/setup${NC}"
echo ""
echo -e "${CYAN}常用命令:${NC}"
echo -e "  查看日志:   ${GREEN}docker logs -f ${CONTAINER_NAME}${NC}"
echo -e "  停止服务:   ${GREEN}docker stop ${CONTAINER_NAME}${NC}"
echo -e "  重启服务:   ${GREEN}docker restart ${CONTAINER_NAME}${NC}"
echo -e "  删除容器:   ${GREEN}docker rm -f ${CONTAINER_NAME}${NC}"
echo ""
echo -e "${YELLOW}提示:${NC}"
echo -e "  • 数据库文件: ${GREEN}./data/order.db${NC}"
echo -e "  • 上传文件:   ${GREEN}./uploads/${NC}"
echo -e "  • 配置文件:   ${GREEN}.env.deploy${NC}"
echo ""
