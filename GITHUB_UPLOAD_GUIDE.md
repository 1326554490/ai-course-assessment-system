# GitHub 上传指南（手动上传）

## 准备工作已完成 ✅

以下文件已准备就绪：
- ✅ `.gitignore` - Git 忽略配置
- ✅ `README.md` - 项目说明文档
- ✅ `FIX_SUMMARY.md` - 修复记录
- ✅ `COMPLETE_FIX_REPORT.md` - 详细修复报告
- ✅ `QUICK_TEST.md` - 快速测试清单
- ✅ `TEST_CHECKLIST.md` - 完整测试清单

---

## 方式一：通过 GitHub 网页上传（最简单）

### 步骤 1：创建 GitHub 仓库
1. 访问 https://github.com
2. 登录你的账号
3. 点击右上角 **"+"** → **"New repository"**
4. 填写信息：
   - **Repository name**: `ai-course-assessment-system` 或你喜欢的名字
   - **Description**: `星芽 · AI通识课教学平台 - 面向中小学的AI课程教学评测系统`
   - **Public** 或 **Private**（根据需要选择）
   - ❌ 不要勾选 "Add a README file"（我们已经有了）
   - ❌ 不要添加 .gitignore（我们已经有了）
5. 点击 **"Create repository"**

### 步骤 2：准备上传文件
在项目文件夹中，需要上传以下内容：

**必须上传的文件/文件夹：**
```
ai-course-assessment-system-main/
├── .gitignore
├── README.md
├── FIX_SUMMARY.md
├── COMPLETE_FIX_REPORT.md
├── QUICK_TEST.md
├── TEST_CHECKLIST.md
├── package.json
├── package-lock.json
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── tailwind.config.js
├── postcss.config.js
├── public/              (整个文件夹)
└── src/                 (整个文件夹)
```

**不要上传的文件/文件夹：**
```
❌ node_modules/        (依赖包，通过 npm install 安装)
❌ dist/                (构建产物)
❌ .vscode/             (编辑器配置)
❌ .DS_Store            (Mac 系统文件)
```

### 步骤 3：上传文件（GitHub 网页）

由于 GitHub 网页上传有文件数量限制，建议使用**方式二**（命令行）。

---

## 方式二：通过 Git 命令行上传（推荐）

### 步骤 1：确保 Git 已安装
```bash
git --version
```

如果未安装，请访问 https://git-scm.com/ 下载安装。

### 步骤 2：初始化本地仓库
在项目目录打开命令行/终端，执行：

```bash
cd C:\Users\L\Desktop\ai-course-assessment-system-main

git init
git add .
git commit -m "feat: 初始提交 - AI通识课教学平台完整项目"
```

### 步骤 3：创建 GitHub 仓库
1. 访问 https://github.com/new
2. 填写仓库名称和描述
3. **不要**勾选任何初始化选项
4. 点击 **"Create repository"**
5. 记下仓库地址（形如 `https://github.com/你的用户名/仓库名.git`）

### 步骤 4：推送到 GitHub
```bash
git remote add origin https://github.com/你的用户名/仓库名.git
git branch -M main
git push -u origin main
```

如果提示输入用户名密码，请使用 GitHub 的 **Personal Access Token**（不是登录密码）。

---

## 方式三：使用 GitHub Desktop（最友好）

### 步骤 1：安装 GitHub Desktop
访问 https://desktop.github.com/ 下载安装。

### 步骤 2：添加项目
1. 打开 GitHub Desktop
2. 点击 **"File"** → **"Add Local Repository"**
3. 选择项目文件夹 `C:\Users\L\Desktop\ai-course-assessment-system-main`
4. 如果提示"not a Git repository"，点击 **"Create a repository"**

### 步骤 3：提交更改
1. 在左侧查看文件列表（应该显示所有文件）
2. 确认 **node_modules** 不在列表中（被 .gitignore 忽略了）
3. 在底部填写：
   - **Summary**: `feat: 初始提交 - AI通识课教学平台`
   - **Description**: 可选，填写项目说明
4. 点击 **"Commit to main"**

### 步骤 4：发布到 GitHub
1. 点击顶部 **"Publish repository"**
2. 填写仓库名称和描述
3. 选择 **Public** 或 **Private**
4. 点击 **"Publish Repository"**

---

## 验证上传成功

上传完成后，访问你的 GitHub 仓库页面，应该看到：

1. ✅ 项目文件全部显示
2. ✅ README.md 自动渲染在首页
3. ✅ 文件结构清晰完整
4. ✅ **没有** node_modules 文件夹

---

## 后续操作

### 添加项目描述
在 GitHub 仓库页面：
1. 点击右上角的 **⚙️ Settings**
2. 添加 **Description**: `星芽 · AI通识课教学平台 - 面向中小学的AI课程教学评测系统`
3. 添加 **Website**: 如果有部署的话
4. 添加 **Topics**: `react` `typescript` `vite` `education` `ai` `teaching-platform`

### 添加 License
1. 在仓库主页点击 **"Add file"** → **"Create new file"**
2. 文件名输入 `LICENSE`
3. 点击右侧 **"Choose a license template"**
4. 选择 **MIT License**
5. 填写年份和名字
6. 点击 **"Commit new file"**

### 开启 GitHub Pages（可选）
如果想部署预览：
1. 先构建项目：`npm run build`
2. 上传 `dist/` 文件夹到单独的分支
3. 在 Settings → Pages 中配置

---

## 推荐的上传方式

**新手推荐**: 方式三（GitHub Desktop）- 可视化操作，最简单  
**有经验推荐**: 方式二（Git 命令行）- 灵活强大  
**文件很少推荐**: 方式一（网页上传）- 本项目文件多，不推荐

---

## 需要帮助？

如果遇到问题：
1. 确认 `.gitignore` 文件存在并正确配置
2. 确认没有上传 `node_modules/` 文件夹
3. 如果是权限问题，需要配置 GitHub Personal Access Token
4. 可以在 GitHub Issues 或相关论坛寻求帮助

---

**祝上传顺利！** 🎉
