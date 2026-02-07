# URL Shortener

一个现代化的短链接生成器，托管在 Vercel 上。

## 功能特性

- 🔗 快速生成短链接
- 📋 一键复制
- 🎨 现代化深色主题界面
- ⚡ Serverless 架构
- 🔒 安全可靠

## 部署指南

### 1. 安装 Vercel CLI

```bash
npm i -g vercel
```

### 2. 登录 Vercel

```bash
vercel login
```

### 3. 创建 KV 存储

在 [Vercel Dashboard](https://vercel.com/dashboard) 中：

1. 进入你的项目
2. 点击 **Storage** 标签
3. 点击 **Create Database**
4. 选择 **KV**
5. 按提示完成创建

### 4. 部署

```bash
cd url-shortener
vercel --prod
```

## 本地开发

```bash
# 安装依赖
npm install

# 链接 Vercel 项目（获取 KV 环境变量）
vercel link
vercel env pull .env.development.local

# 启动开发服务器
npm run dev
```

## 技术栈

- **前端**: HTML + CSS + JavaScript
- **后端**: Vercel Serverless Functions
- **存储**: Vercel KV (Redis)

## 许可证

MIT
