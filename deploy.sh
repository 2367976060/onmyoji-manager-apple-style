#!/bin/bash
# ==============================================
# 阴阳师账号管理器 - GitHub Pages 自动部署脚本
# Apple Style Edition
# ==============================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║          阴阳师账号管理器 - GitHub Pages 部署工具              ║"
echo "║                    Apple Style Edition                        ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 检查是否安装 git
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ 错误: 未检测到 git 命令，请先安装 git${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 部署前准备${NC}"
echo "请确保已完成以下步骤："
echo ""
echo "1. 访问 https://github.com/new 创建新仓库"
echo "2. 仓库名称建议: onmyoji-manager-apple-style"
echo "3. 选择 Public（公开）"
echo "4. 不要勾选 Initialize this repository with a README"
echo ""

read -p "请输入您的 GitHub 用户名: " GITHUB_USERNAME
read -p "请输入您创建的仓库名称: " GITHUB_REPO

echo ""
echo -e "${YELLOW}🚀 开始部署...${NC}"
echo ""

# 配置 git
git config user.name "$GITHUB_USERNAME"
git config user.email "$GITHUB_USERNAME@users.noreply.github.com"

# 重命名分支为 main（如果需要）
git branch -M main 2>/dev/null || true

# 添加远程仓库
git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/$GITHUB_USERNAME/$GITHUB_REPO.git"

echo -e "${BLUE}📤 推送代码到 GitHub...${NC}"
if git push -u origin main; then
    echo -e "${GREEN}✅ 代码推送成功!${NC}"
else
    echo -e "${RED}❌ 推送失败，请检查用户名和仓库名称是否正确${NC}"
    echo ""
    echo "如果提示需要认证，请使用以下方式之一："
    echo "1. 输入 GitHub 用户名和 Personal Access Token"
    echo "2. 或者使用 SSH 方式推送"
    exit 1
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ 部署成功!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📦 GitHub 仓库地址:${NC}"
echo "  https://github.com/$GITHUB_USERNAME/$GITHUB_REPO"
echo ""
echo -e "${YELLOW}⚙️  启用 GitHub Pages:${NC}"
echo "  1. 访问上面的仓库地址"
echo "  2. 点击 Settings → Pages"
echo "  3. 在 Source 下选择 GitHub Actions"
echo "  4. 等待 1-2 分钟，自动部署完成"
echo ""
echo -e "${BLUE}🌐 GitHub Pages 访问地址 (部署后):${NC}"
echo "  https://$GITHUB_USERNAME.github.io/$GITHUB_REPO/"
echo ""
echo -e "${YELLOW}💡 提示:${NC}"
echo "  部署状态可在 Actions 标签页查看"
echo "  首次部署可能需要 2-3 分钟"
echo ""
echo -e "${GREEN}🎉 享受您的 Apple 风格阴阳师账号管理器!${NC}"
echo ""