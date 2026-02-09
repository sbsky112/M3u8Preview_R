# M3u8 Preview

M3U8 流媒体预览管理平台 — 支持在线播放、收藏管理、播放列表、观看历史追踪和批量导入。

## 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | React 18 · Vite 6 · TypeScript · TailwindCSS 3 · hls.js |
| **状态管理** | Zustand · TanStack React Query |
| **路由** | React Router DOM v7 |
| **后端** | Express 4 · Prisma 6 · SQLite |
| **认证** | JWT + Refresh Token · bcryptjs |
| **共享** | Zod schema 校验 |
| **架构** | npm workspaces monorepo |

## 项目结构

```
m3u8-preview/
├── packages/
│   ├── shared/          # 前后端共享类型和 Zod schema
│   ├── server/          # Express API 服务
│   │   ├── prisma/      # 数据库 schema 和迁移
│   │   └── src/
│   │       ├── routes/  # API 路由
│   │       ├── middleware/
│   │       └── index.ts
│   └── client/          # React 前端应用
│       └── src/
│           ├── components/
│           │   ├── layout/    # Header, AppLayout
│           │   ├── media/     # MediaCard, MediaGrid
│           │   ├── player/    # VideoPlayer (hls.js)
│           │   ├── playlist/  # AddToPlaylistModal
│           │   └── ui/        # ScrollRow, PageTransition
│           ├── hooks/         # useAuth, useWatchProgress, useVideoThumbnail
│           ├── pages/
│           ├── services/      # API 请求层
│           ├── stores/        # Zustand stores
│           └── lib/           # 工具函数
└── package.json
```

## 快速开始

### 前置要求

- Node.js >= 18
- npm >= 9

### 安装

```bash
# 克隆仓库
git clone <repository-url>
cd m3u8-preview

# 安装所有依赖（workspaces 自动链接）
npm install
```

### 配置

在 `packages/server/` 目录下创建 `.env` 文件：

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
PORT=3000
```

### 数据库初始化

```bash
# 运行 Prisma 迁移
npm run db:migrate

# （可选）填充种子数据
npm run db:seed
```

### 开发

```bash
# 同时启动前后端开发服务器
npm run dev
```

- 前端：http://localhost:5173
- 后端 API：http://localhost:3000
- Vite 自动代理 `/api` 和 `/uploads` 到后端

### 构建

```bash
npm run build
```

## Docker 部署

### 快速启动（生产环境）

```bash
# 设置 JWT 密钥（必须修改！）
export JWT_SECRET="your-secure-random-secret"
export JWT_REFRESH_SECRET="your-secure-random-refresh-secret"

# 构建并启动
docker compose up -d --build

# 查看日志
docker compose logs -f
```

访问 http://localhost 即可使用。

### 自定义端口

```bash
# 使用 8080 端口
PORT=8080 docker compose up -d --build
```

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `JWT_SECRET` | `change-me-in-production` | JWT 签名密钥（**生产环境必须修改**） |
| `JWT_REFRESH_SECRET` | `change-me-in-production-refresh` | JWT 刷新令牌密钥（**生产环境必须修改**） |
| `PORT` | `80` | Nginx 对外端口 |
| `CORS_ORIGIN` | `http://localhost` | 允许的跨域来源 |

### 数据持久化

Docker 使用命名卷存储数据，容器重建后数据不丢失：

| 卷名 | 容器路径 | 说明 |
|------|----------|------|
| `db-data` | `/data` | SQLite 数据库文件 |
| `uploads` | `/app/packages/server/uploads` | 上传的文件 |
| `client-dist` | `/app/packages/client/dist` | 前端构建产物 |

备份数据库：
```bash
docker cp m3u8preview-app:/data/m3u8preview.db ./backup.db
```

### 常用命令

```bash
# 停止服务
docker compose down

# 停止并删除数据卷（⚠️ 会丢失所有数据）
docker compose down -v

# 重新构建（代码更新后）
docker compose up -d --build

# 查看服务状态
docker compose ps
```

### 开发环境（Docker）

```bash
docker compose -f docker-compose.dev.yml up --build
```

- 前端：http://localhost:5173
- 后端：http://localhost:3000
- 源码变更自动热重载

### 数据库管理

```bash
# 打开 Prisma Studio 可视化管理数据库
npm run db:studio
```

## API 限流

服务端使用 `express-rate-limit` 对 API 请求进行速率限制，防止滥用：

| 限流层级 | 作用范围 | 窗口时间 | 最大请求数 | 说明 |
|----------|----------|----------|------------|------|
| 认证路由 | `/api/v1/auth/*` | 15 分钟 | 50 次 | 登录、注册、刷新 token 等共享配额 |
| 全局 API | `/api/v1/*` | 15 分钟 | 200 次 | 所有 API 路由 |
| 播放量统计 | `POST /api/v1/media/:id/views` | 15 分钟 | 100 次 | 防止刷播放量 |

超出限制后会返回 `429 Too Many Requests`，等待窗口期重置即可。

## 功能特性

- **M3U8 流媒体播放** — 基于 hls.js，支持多画质切换、键盘快捷键、进度记忆
- **按需加载播放器** — 详情页点击播放才加载 HLS 流，节省带宽
- **自动封面提取** — 无海报的媒体自动从视频流提取随机帧作为封面（前端 canvas 实现）
- **用户认证** — JWT + Refresh Token，支持 ADMIN/USER 角色
- **媒体管理** — 分类、标签、评分、年份、播放量统计
- **收藏 & 播放列表** — 用户可收藏媒体、创建播放列表
- **观看历史** — 自动记录和恢复播放进度
- **批量导入** — 支持 CSV、Excel、JSON、文本格式批量导入媒体
- **响应式 UI** — Emby 风格深色主题，适配桌面端和移动端
- **页面过渡动画** — 轻量 CSS 过渡，提升导航流畅感

## 键盘快捷键（播放器）

| 快捷键 | 功能 |
|--------|------|
| `空格` / `K` | 播放/暂停 |
| `←` / `→` | 后退/前进 10 秒 |
| `↑` / `↓` | 音量增减 |
| `F` | 全屏切换 |
| `M` | 静音切换 |

## 许可证

Private
