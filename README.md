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

### 3. 创建 Upstash Redis 数据库

在 [Vercel Dashboard](https://vercel.com/dashboard) 中：

1. 进入你的项目
2. 点击 **Storage** 标签
3. 点击 **Browse Storage** 或访问 Marketplace
4. 选择 **Upstash** 提供商
5. 创建一个新的 **Redis** 数据库
6. 连接到你的项目

> **重要**: Upstash 会自动设置 `UPSTASH_REDIS_REST_URL` 和 `UPSTASH_REDIS_REST_TOKEN` 环境变量。

或者直接在 [Upstash Console](https://console.upstash.com/) 创建：
1. 注册/登录 Upstash
2. 创建 Redis 数据库
3. 复制 REST URL 和 REST Token
4. 在 Vercel 项目设置中添加环境变量

### 4. 部署

```bash
cd url-shortener
vercel --prod
```

## 本地开发

```bash
# 安装依赖
npm install

# 创建 .env.local 文件并添加 Upstash 凭据
echo "UPSTASH_REDIS_REST_URL=your_url_here" > .env.local
echo "UPSTASH_REDIS_REST_TOKEN=your_token_here" >> .env.local

# 启动开发服务器
npm run dev
```

## 技术栈

- **前端**: HTML + CSS + JavaScript
- **后端**: Vercel Serverless Functions
- **存储**: Upstash Redis

## 环境变量

| 变量名 | 描述 |
|--------|------|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST API URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST API Token |

## 许可证

MIT
