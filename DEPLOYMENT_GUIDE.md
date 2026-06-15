# 🚀 GitHub Pages 完整部署指南

## 🔐 重要说明

由于涉及您的 **GitHub 个人账户安全**，我无法直接操作您的账号。以下是完整的分步操作指南，5分钟即可完成部署。

---

## 📋 第一步：创建 GitHub 仓库

### 1.1 创建新仓库
1. 访问: https://github.com/new
2. 填写信息：
   - **Repository name**: `onmyoji-manager-apple-style`
   - **Description**: `阴阳师账号管理器 - Apple风格设计`
   - **Public**: ✅ 勾选（公开仓库）
   - **Initialize this repository with a README**: ❌ **不要勾选**
3. 点击 **Create repository**

---

## 💻 第二步：获取 Personal Access Token (可选，推荐)

如果使用 HTTPS 方式推送，需要创建 Token：

1. 访问: https://github.com/settings/tokens
2. 点击 **Generate new token** → **Generate new token (classic)**
3. 设置：
   - **Note**: `Onmyoji Manager Deployment`
   - **Expiration**: `No expiration` 或选择有效期
   - **Select scopes**: 勾选 `repo` (完整仓库权限)
4. 点击 **Generate token**
5. **复制保存生成的 Token**（只会显示一次！）

---

## ⚡ 第三步：一键部署（推荐）

### 方法 A：使用自动化部署脚本

在项目目录下执行：

```bash
# 进入项目目录
cd OnmyojiManager-AppleStyle

# 给脚本执行权限
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh
```

按照提示输入：
- 您的 GitHub 用户名
- 您创建的仓库名称

---

### 方法 B：手动执行 Git 命令

如果脚本执行有问题，逐条执行以下命令：

```bash
cd OnmyojiManager-AppleStyle

# 1. 配置 Git 用户信息（替换为您的信息）
git config user.name "您的GitHub用户名"
git config user.email "您的邮箱"

# 2. 确保在 main 分支
git branch -M main

# 3. 添加远程仓库（替换为您的用户名和仓库名）
git remote add origin https://github.com/您的用户名/onmyoji-manager-apple-style.git

# 4. 推送代码
git push -u origin main
```

**当提示输入密码时**：
- 用户名：输入您的 GitHub 用户名
- 密码：输入上面创建的 **Personal Access Token**

---

## 🌐 第四步：启用 GitHub Pages

### 4.1 配置 Pages
1. 进入您的仓库: `https://github.com/您的用户名/onmyoji-manager-apple-style`
2. 点击顶部的 **Settings**
3. 左侧菜单找到 **Pages**（在 Code and automation 分类下）
4. **Source** 下拉选择 **GitHub Actions**
5. 系统会自动检测到我们的部署配置文件

### 4.2 查看部署状态
1. 点击顶部的 **Actions** 标签
2. 可以看到正在运行的工作流
3. 等待 1-2 分钟，状态变为 ✅

---

## ✅ 第五步：验证部署成功

### 访问地址
部署成功后，访问：

```
https://您的用户名.github.io/onmyoji-manager-apple-style/
```

### 检查清单
- [ ] 页面正常加载，无 404 错误
- [ ] Apple 风格样式正确显示
- [ ] 磨砂玻璃效果正常
- [ ] 示例数据显示正常
- [ ] 添加/编辑功能可用
- [ ] 数据本地存储正常（刷新不丢失）

---

## 📝 最终交付链接模板

### 📦 GitHub 仓库地址
```
https://github.com/[您的用户名]/onmyoji-manager-apple-style
```

### 🌐 GitHub Pages 在线访问地址
```
https://[您的用户名].github.io/onmyoji-manager-apple-style/
```

---

## ❓ 常见问题

### Q: 推送时提示认证失败？
A: 使用 Personal Access Token 代替密码，确保勾选了 repo 权限

### Q: Pages 显示 404？
A: 
1. 等待 2-3 分钟（CDN 缓存）
2. 检查 Settings → Pages 中 Source 是否选了 GitHub Actions
3. 检查 Actions 是否部署成功

### Q: 样式显示不正确？
A: 检查浏览器控制台，确保 CSS 文件路径正确

### Q: 如何更新代码？
```bash
git add .
git commit -m "更新内容"
git push
```
推送后 GitHub Actions 会自动重新部署

---

## 🎯 完成！

部署完成后您将拥有：
- ✅ 完整的 GitHub 公开仓库
- ✅ 自动化 CI/CD 部署流程
- ✅ GitHub Pages 托管的在线网站
- ✅ Apple 风格的阴阳师账号管理器

**祝您使用愉快！** 🍎