# M3u8 Preview

M3U8 流媒体预览管理平台 — 支持在线播放、收藏管理、播放列表、观看历史追踪和批量导入。采用 Emby 风格深色主题 UI，适配桌面端和移动端。

## 功能特性

### 播放器

- **HLS 流媒体播放** — 基于 hls.js，支持多画质自动切换
- **按需加载** — 详情页点击播放才加载 HLS 流，节省带宽
- **键盘快捷键** — 播放/暂停、音量、快进快退、全屏等
- **播放进度记忆** — 自动保存并恢复上次播放位置
- **自动封面提取** — 无海报的媒体自动从视频流提取随机帧作为封面

### 媒体管理

- **分类管理** — 电影、电视剧、动漫、纪录片、直播等
- **标签系统** — 支持多标签、标签筛选
- **搜索 & 排序** — 按标题搜索、多维度排序
- **评分 & 年份** — 媒体评分和年份信息
- **播放量统计** — 自动记录播放次数

### 用户功能

- **收藏** — 一键收藏喜欢的媒体
- **播放列表** — 创建和管理自定义播放列表
- **观看历史** — 自动记录完整观看历史
- **继续观看** — 首页展示未看完的内容，支持一键续播

### 管理面板（仅管理员）

- **用户管理** — 查看、编辑、禁用用户账号
- **媒体管理** — 添加、编辑、删除媒体
- **批量导入** — 支持 CSV、Excel、JSON、文本格式批量导入
- **数据备份与恢复** — 一键导出/导入全量数据（ZIP 格式，含数据库和上传文件）
- **缩略图生成** — 基于 ffmpeg 从视频流自动截取封面
- **系统设置** — 注册开关等全局配置

### 安全特性

- **JWT 双 Token 认证** — Access Token + Refresh Token 机制
- **bcrypt 密码加密** — cost factor 12
- **Helmet 安全头** — XSS 防护、内容类型嗅探防护等
- **CORS 跨域控制** — 可配置的跨域来源
- **API 限流** — 多层级速率限制，防止滥用
- **代理接口 HMAC 签名** — 代理请求必须携带有效签名和过期时间，签名由服务端密钥生成，防止代理接口被滥用
- **生产密钥校验** — 生产环境强制要求修改默认密钥（≥32 字符）

## 默认账号

首次部署时，种子脚本会自动创建以下账号：

| 角色 | 用户名 | 默认密码 |
|------|--------|----------|
| 管理员 | `admin` | `Admin123` |
| 演示用户 | `demo` | `Demo1234` |

可通过环境变量 `ADMIN_SEED_PASSWORD` 和 `DEMO_SEED_PASSWORD` 覆盖默认密码。

> **⚠️ 生产环境务必修改默认密码！** 建议通过环境变量设置强密码，或登录后在管理面板中修改。

## 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | React 18 · Vite 6 · TypeScript · TailwindCSS 3 · hls.js |
| **状态管理** | Zustand · TanStack React Query |
| **路由** | React Router DOM v7 |
| **后端** | Express 4 · Prisma 6 · SQLite |
| **认证** | JWT + Refresh Token · bcryptjs |
| **共享** | Zod schema 校验 |
| **部署** | Docker · Nginx · ffmpeg |
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
├── docker-compose.yml
├── Dockerfile
├── nginx.conf
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

在项目根目录创建 `.env` 文件（参考 `.env.example`）：

```env
PORT=3000
NODE_ENV=development
DATABASE_URL="file:./data/m3u8preview.db"
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
PROXY_SECRET="your-proxy-secret"
CORS_ORIGIN=http://localhost:5173
VITE_API_BASE_URL=http://localhost:3000/api/v1
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

### 架构说明

Docker 生产环境采用双容器架构：

```
用户请求 → Nginx (端口 80) → 静态文件 (前端 SPA)
                             → 反向代理 /api/* → Node.js App (端口 3000)
                             → 反向代理 /uploads/* → Node.js App
```

- **nginx** 容器：提供前端静态文件、反向代理 API 请求、Gzip 压缩、安全头注入、静态资源缓存
- **app** 容器：运行 Node.js 后端，内置 ffmpeg，以非 root 用户运行

### 快速启动（生产环境）

```bash
# 设置密钥（必须修改！密钥长度需 ≥32 字符）
export JWT_SECRET="your-secure-random-secret-at-least-32-chars"
export JWT_REFRESH_SECRET="your-secure-random-refresh-secret-at-least-32-chars"
export PROXY_SECRET="your-secure-random-proxy-secret-at-least-32-chars"

# 构建并启动
docker compose up -d --build

# 查看日志
docker compose logs -f
```

访问 http://localhost 即可使用。

### 自定义端口

```bash
# 使用 8080 端口
DOCKER_PORT=8080 docker compose up -d --build
```

### 自定义种子账号密码

```bash
export ADMIN_SEED_PASSWORD="YourStrongAdminPass1"
export DEMO_SEED_PASSWORD="YourStrongDemoPass1"
docker compose up -d --build
```

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `JWT_SECRET` | `change-me-in-production` | JWT 签名密钥（**生产环境必须修改，≥32 字符**） |
| `JWT_REFRESH_SECRET` | `change-me-in-production-refresh` | JWT 刷新令牌密钥（**生产环境必须修改，≥32 字符**） |
| `PROXY_SECRET` | `change-me-proxy-secret-in-production` | 代理签名密钥（**生产环境必须修改，≥32 字符**） |
| `DOCKER_PORT` | `80` | Nginx 对外端口 |
| `ADMIN_SEED_PASSWORD` | `Admin123` | 管理员种子账号密码 |
| `DEMO_SEED_PASSWORD` | `Demo1234` | 演示用户种子账号密码 |
| `CORS_ORIGIN` | `http://localhost` | 允许的跨域来源 |

### 数据持久化

Docker 使用命名卷存储数据，容器重建后数据不丢失：

| 卷名 | 容器路径 | 说明 |
|------|----------|------|
| `db-data` | `/data` | SQLite 数据库文件 |
| `uploads` | `/app/packages/server/uploads` | 上传的文件（缩略图等） |
| `client-dist` | `/app/packages/client/dist` | 前端构建产物 |

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

## 使用教程

### 普通用户

1. **登录** — 使用管理员提供的账号登录，或在开放注册时自行注册
2. **浏览内容** — 首页展示媒体分类横向滚动行，支持按分类、标签筛选
3. **搜索** — 使用顶部搜索框按标题搜索媒体
4. **播放** — 点击媒体卡片进入详情页，点击播放按钮开始观看
5. **收藏** — 在详情页点击收藏按钮，收藏的内容可在个人收藏页查看
6. **播放列表** — 创建自定义播放列表，将媒体添加到不同列表中
7. **继续观看** — 首页"继续观看"区域展示未看完的内容，点击即可续播

### 管理员操作

#### 添加媒体

在管理面板 → 媒体管理中，点击"添加媒体"，填写标题、M3U8 地址、分类、标签等信息。

#### 批量导入

管理面板 → 批量导入，支持两种方式：

**方式一：文本输入**

每行一条记录，支持两种格式：
```
# 纯 URL（标题自动从 URL 提取）
https://example.com/video1.m3u8
https://example.com/video2.m3u8

# 管道分隔格式：标题|URL|分类|标签1,标签2
我的视频|https://example.com/video.m3u8|电影|动作,科幻
```

**方式二：文件上传**

支持以下格式：
- **CSV** — 可下载模板
- **Excel (.xlsx)** — 可下载模板
- **JSON** — 可下载模板

#### 用户管理

管理面板 → 用户管理，可查看所有用户、修改角色、禁用/启用账号。

#### 系统设置

管理面板 → 系统设置，可控制：
- **注册开关** — 开启/关闭新用户注册（`allowRegistration`）

#### 数据备份与恢复

管理面板中提供一键备份与恢复功能：

- **导出备份** — 下载 ZIP 文件，包含完整数据库数据（`backup.json`）和所有上传文件（`uploads/` 目录）
- **导入恢复** — 上传之前导出的 ZIP 文件，系统将在事务中清空并重写所有数据表，然后恢复上传文件

也可通过命令行手动备份数据库文件：
```bash
docker cp m3u8preview-app:/data/m3u8preview.db ./backup.db
```

> **注意：** 导入恢复会覆盖当前所有数据，操作前请确认！

#### 缩略图生成

系统支持基于 ffmpeg 从 M3U8 视频流自动截取封面缩略图：

- 管理面板中可触发为缺少封面的媒体批量生成缩略图
- 生成过程：使用 ffprobe 获取视频时长 → 随机选取 10%~40% 位置 → ffmpeg 截取单帧 → 缩放至 480px 宽 → 编码为 WebP 格式
- 并发限制：最多 2 个并发生成任务
- **本地开发** 需要系统安装 ffmpeg；**Docker 环境** 已内置 ffmpeg

## 注意事项

### 生产环境安全配置

1. **密钥配置** — `JWT_SECRET`、`JWT_REFRESH_SECRET` 和 `PROXY_SECRET` **必须修改**，长度需 ≥32 字符，且三个密钥**应使用不同的值**
2. **默认密码** — 建议通过环境变量修改默认的 admin/demo 账号密码，或部署后立即在管理面板中修改
3. **注册控制** — 根据需要在管理面板中关闭公开注册

### 密码策略

用户密码需满足以下要求：
- 长度 ≥ 8 个字符
- 必须包含至少一个大写字母
- 必须包含至少一个小写字母
- 必须包含至少一个数字

用户名要求：3-50 个字符，仅允许字母、数字和下划线。

### ffmpeg 依赖

缩略图生成功能依赖 ffmpeg：
- **Docker 部署** — 镜像已内置，无需额外安装
- **本地开发** — 需自行安装 ffmpeg 并确保在系统 PATH 中可用

## API 限流

服务端使用 `express-rate-limit` 对 API 请求进行速率限制，防止滥用：

| 限流层级 | 作用范围 | 窗口时间 | 最大请求数 | 说明 |
|----------|----------|----------|------------|------|
| 认证路由 | `/api/v1/auth/*` | 15 分钟 | 50 次 | 登录、注册、刷新 token 等共享配额 |
| 全局 API | `/api/v1/*` | 15 分钟 | 200 次 | 所有 API 路由 |
| 播放量统计 | `POST /api/v1/media/:id/views` | 15 分钟 | 100 次 | 防止刷播放量 |
| 代理签名 | `GET /api/v1/proxy/sign` | 15 分钟 | 60 次 | 获取代理签名 URL |
| 代理请求 | `GET /api/v1/proxy/m3u8` | 15 分钟 | 1500 次 | HLS 代理（含 segment） |

超出限制后会返回 `429 Too Many Requests`，等待窗口期重置即可。

## 键盘快捷键（播放器）

| 快捷键 | 功能 |
|--------|------|
| `空格` / `K` | 播放/暂停 |
| `←` / `→` | 后退/前进 10 秒 |
| `↑` / `↓` | 音量增减 |
| `F` | 全屏切换 |
| `M` | 静音切换 |
| `Esc` | 退出全屏 / 返回上一页 |

## 许可证

Private
