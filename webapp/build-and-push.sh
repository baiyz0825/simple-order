#!/bin/bash

# 一键构建并推送 Docker 镜像到 GitHub Container Registry
# 支持多平台构建 (amd64/arm64) 和 docker-slim 瘦身
# 使用方法: ./build-and-push.sh [tag] [options]

set -e  # 遇到错误立即退出

# 切换到脚本所在目录（确保在 webapp 目录下执行）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 检查 Dockerfile 是否存在
if [ ! -f "Dockerfile" ]; then
    echo "❌ 错误：Dockerfile 不存在于当前目录"
    echo "   当前目录: $SCRIPT_DIR"
    exit 1
fi

# 配置变量
REGISTRY="ghcr.io"
PLATFORMS="linux/amd64,linux/arm64"
USE_SLIM=true
# docker-slim 只支持 amd64，多平台构建时会额外构建并瘦身 amd64 镜像

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_header() {
    echo ""
    echo "========================================="
    echo "$1"
    echo "========================================="
    echo ""
}

# 从 git remote 获取 GitHub 用户名和仓库名
get_repo_info() {
    # 在 webapp 子目录中，git 命令仍然可以工作（会向上查找 .git）
    if ! git rev-parse --git-dir >/dev/null 2>&1; then
        print_error "当前目录不是 Git 仓库"
        echo "请使用 git init 初始化或手动设置 GITHUB_USERNAME 和 REPO_NAME"
        exit 1
    fi

    GIT_REMOTE=$(git remote get-url origin 2>/dev/null || echo "")

    if [ -z "$GIT_REMOTE" ]; then
        print_error "无法获取 git remote URL"
        echo "请设置 git remote: git remote add origin <repository-url>"
        exit 1
    fi

    if [[ $GIT_REMOTE =~ git@github\.com:([^/]+)/(.+)\.git ]]; then
        GITHUB_USERNAME="${BASH_REMATCH[1]}"
        REPO_NAME="${BASH_REMATCH[2]}"
    elif [[ $GIT_REMOTE =~ https://github\.com/([^/]+)/(.+)\.git ]]; then
        GITHUB_USERNAME="${BASH_REMATCH[1]}"
        REPO_NAME="${BASH_REMATCH[2]}"
    elif [[ $GIT_REMOTE =~ https://github\.com/([^/]+)/(.+) ]]; then
        GITHUB_USERNAME="${BASH_REMATCH[1]}"
        REPO_NAME="${BASH_REMATCH[2]}"
    else
        print_error "无法解析 GitHub URL: $GIT_REMOTE"
        exit 1
    fi

    # 对于 monorepo，使用 webapp 作为镜像名的一部分
    # 如果 REPO_NAME 包含 webapp，则保持不变；否则添加 -webapp 后缀
    if [[ "$REPO_NAME" != *"webapp"* ]]; then
        REPO_NAME="${REPO_NAME}-webapp"
    fi
}

# 检查 buildx 是否可用
check_buildx() {
    if ! docker buildx version >/dev/null 2>&1; then
        print_error "Docker buildx 不可用"
        echo "请升级 Docker 到支持 buildx 的版本"
        exit 1
    fi

    # 检查是否有多平台构建的 builder
    BUILDER_NAME="multiarch-builder"

    if ! docker buildx inspect "$BUILDER_NAME" >/dev/null 2>&1; then
        print_info "创建多平台构建器: $BUILDER_NAME"
        docker buildx create --name "$BUILDER_NAME" --driver docker-container --use
        docker buildx inspect --bootstrap
    else
        print_info "使用现有构建器: $BUILDER_NAME"
        docker buildx use "$BUILDER_NAME"
    fi
}

# 检查 docker-slim 是否可用
check_slim() {
    if ! command -v docker-slim &> /dev/null && ! docker run --rm dslim/docker-slim version &> /dev/null; then
        print_warning "docker-slim 未安装，跳过瘦身步骤"
        print_info "安装方法: https://github.com/slimtoolkit/slim#installation"
        USE_SLIM=false
        return
    fi

    # 确定 slim 命令
    if command -v docker-slim &> /dev/null; then
        SLIM_CMD="docker-slim"
    else
        SLIM_CMD="docker run --rm -v /var/run/docker.sock:/var/run/docker.sock dslim/docker-slim"
    fi
}

# 使用 docker-slim 瘦身镜像
# 参数: $1 = 源镜像, $2 = 目标镜像（可选，默认为源镜像-slim）
slim_image() {
    local SOURCE_IMAGE="$1"
    local SLIM_IMAGE="${2:-${SOURCE_IMAGE}-slim}"

    print_header "🔪 镜像瘦身 (docker-slim)"

    if [ "$USE_SLIM" = false ]; then
        print_info "跳过瘦身步骤"
        return
    fi

    # 保存原始镜像大小（在瘦身前）
    local ORIGINAL_SIZE
    ORIGINAL_SIZE=$(docker image inspect "$SOURCE_IMAGE" --format='{{.Size}}' 2>/dev/null | awk '{printf "%.2f", $1/1024/1024}' || echo "N/A")

    print_info "正在瘦身镜像: $SOURCE_IMAGE -> $SLIM_IMAGE"

    # 使用 docker-slim 进行瘦身
    # --include-path 确保必要文件不被删除
    $SLIM_CMD build \
        --target "$SOURCE_IMAGE" \
        --tag "$SLIM_IMAGE" \
        --include-path /app/data \
        --include-path /app/public/uploads \
        --include-path /app/prisma \
        --include-path /app/node_modules/.prisma \
        --include-path /app/node_modules/@prisma \
        --include-path /app/.next \
        --include-path /app/public \
        --include-path /app/server.js \
        --include-path /app/entrypoint.sh \
        --http-probe-off \
        --continue-after 1

    if [ $? -eq 0 ]; then
        print_success "镜像瘦身完成"

        # 显示大小对比
        local SLIM_SIZE
        SLIM_SIZE=$(docker image inspect "$SLIM_IMAGE" --format='{{.Size}}' 2>/dev/null | awk '{printf "%.2f", $1/1024/1024}' || echo "N/A")

        echo ""
        print_info "镜像大小对比:"
        echo "  原始镜像: ${ORIGINAL_SIZE} MB"
        echo "  瘦身后:   ${SLIM_SIZE} MB"
        if [ "$ORIGINAL_SIZE" != "N/A" ] && [ "$SLIM_SIZE" != "N/A" ]; then
            local REDUCTION
            REDUCTION=$(echo "scale=1; ($ORIGINAL_SIZE - $SLIM_SIZE) / $ORIGINAL_SIZE * 100" | bc 2>/dev/null || echo "N/A")
            echo "  减少:     ${REDUCTION}%"
        fi
        echo ""

        # 推送瘦身后的镜像
        print_info "推送瘦身后的镜像..."
        docker push "$SLIM_IMAGE"
        print_success "瘦身镜像已推送: $SLIM_IMAGE"
    else
        print_warning "镜像瘦身失败，使用原始镜像"
    fi
}

# 显示帮助信息
show_help() {
    echo "使用方法: $0 [tag] [options]"
    echo ""
    echo "参数:"
    echo "  tag           镜像标签 (默认: latest)"
    echo ""
    echo "选项:"
    echo "  --no-slim     跳过 docker-slim 瘦身"
    echo "  --platforms   指定平台 (默认: linux/amd64,linux/arm64)"
    echo "  --single      只构建当前平台 (不使用 buildx)"
    echo "  --help        显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                    # 构建 latest 标签，多平台，启用瘦身"
    echo "  $0 v1.0.0             # 构建 v1.0.0 标签"
    echo "  $0 latest --no-slim   # 不进行瘦身"
    echo "  $0 latest --single    # 只构建当前平台"
    echo ""
    exit 0
}

# 解析参数
TAG="latest"
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-slim)
            USE_SLIM=false
            shift
            ;;
        --platforms)
            PLATFORMS="$2"
            shift 2
            ;;
        --single)
            SINGLE_PLATFORM=true
            shift
            ;;
        --help|-h)
            show_help
            ;;
        *)
            if [[ ! "$1" =~ ^-- ]]; then
                TAG="$1"
            fi
            shift
            ;;
    esac
done

# 获取仓库信息
get_repo_info

# 完整镜像名称
IMAGE_NAME="${REGISTRY}/${GITHUB_USERNAME}/${REPO_NAME}:${TAG}"

print_header "🏗️  开始构建 Docker 镜像"
echo "镜像名称: ${IMAGE_NAME}"
echo "目标平台: ${PLATFORMS}"
echo "瘦身优化: $([ "$USE_SLIM" = true ] && echo "启用" || echo "禁用")"
echo ""

# 检查是否已登录到 ghcr.io
print_info "检查 Docker 登录状态..."
if ! grep -q "\"${REGISTRY}" ~/.docker/config.json 2>/dev/null; then
    print_warning "可能未登录到 ${REGISTRY}"
    echo "请先运行: docker login ${REGISTRY}"
    echo ""
    echo "创建 GitHub Personal Access Token: https://github.com/settings/tokens/new"
    echo "需要权限: write:packages, read:packages"
    read -p "是否继续？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 构建镜像
if [ "$SINGLE_PLATFORM" = true ]; then
    print_info "单平台构建模式..."
    docker build -t "${IMAGE_NAME}" .
    
    if [ $? -ne 0 ]; then
        print_error "构建失败"
        exit 1
    fi
    
    print_success "镜像构建完成"
    
    # 推送镜像
    print_info "推送镜像到 ${REGISTRY}..."
    docker push "${IMAGE_NAME}"
    
    if [ $? -ne 0 ]; then
        print_error "推送失败"
        exit 1
    fi
    
    print_success "镜像推送完成"
else
    # 检查 buildx
    check_buildx

    print_info "多平台构建模式..."
    docker buildx build \
        --platform "${PLATFORMS}" \
        --tag "${IMAGE_NAME}" \
        --push \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        .
    
    if [ $? -ne 0 ]; then
        print_error "构建失败"
        exit 1
    fi
    
    print_success "镜像构建并推送完成"
fi

# 瘦身处理
if [ "$USE_SLIM" = true ]; then
    check_slim

    if [ "$SINGLE_PLATFORM" = true ]; then
        # 单平台构建：直接瘦身
        slim_image "${IMAGE_NAME}"
    elif [[ "$PLATFORMS" == *"amd64"* ]]; then
        # 多平台构建且包含 amd64：额外构建 amd64 镜像并瘦身
        print_info "检测到包含 amd64 平台，开始构建 amd64 瘦身版本..."

        # 使用临时标签构建 amd64 镜像
        TEMP_AMD64_IMAGE="${IMAGE_NAME}-amd64-temp"
        SLIM_IMAGE_NAME="${IMAGE_NAME}-slim"

        # 本地构建 amd64 镜像用于瘦身
        docker buildx build \
            --platform "linux/amd64" \
            --tag "${TEMP_AMD64_IMAGE}" \
            --load \
            .

        if [ $? -eq 0 ]; then
            print_success "amd64 镜像构建完成"
            # 瘦身：源镜像用临时标签，目标用 slim 标签
            slim_image "${TEMP_AMD64_IMAGE}" "${SLIM_IMAGE_NAME}"
            
            # 清理临时镜像
            docker rmi "${TEMP_AMD64_IMAGE}" 2>/dev/null || true
        else
            print_warning "amd64 瘦身版构建失败，跳过"
        fi
    fi
fi

print_header "✅ 构建完成！"
echo "镜像地址: ${IMAGE_NAME}"
echo ""
echo "使用方法:"
echo "  docker pull ${IMAGE_NAME}"
echo "  docker run -p 3000:3000 ${IMAGE_NAME}"
echo ""

# 显示镜像信息
if [ "$SINGLE_PLATFORM" = true ]; then
    IMAGE_SIZE=$(docker image inspect "${IMAGE_NAME}" --format='{{.Size}}' 2>/dev/null | awk '{printf "%.2f", $1/1024/1024}' || echo "N/A")
    echo "镜像大小: ${IMAGE_SIZE} MB"
fi
