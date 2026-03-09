# 点单 Web App (PWA) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建一个 Next.js 全栈 PWA 点单系统，支持用户匿名点单、管理员邮箱登录管理、WebSocket 实时通知、Docker 部署。

**Architecture:** Next.js App Router 全栈应用，自定义 Node 服务器集成 WebSocket。Prisma ORM + SQLite 做数据持久化。用户端匿名 sessionId，管理端 JWT 认证。单 Docker 容器部署。

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Prisma, SQLite, ws (WebSocket), bcryptjs, jsonwebtoken, Docker

**UI 设计参考：** `docs/ui/` 目录下的设计稿截图

---

## Task 1: 项目初始化与基础配置

**Files:**
- Create: `webapp/package.json`
- Create: `webapp/tsconfig.json`
- Create: `webapp/next.config.js`
- Create: `webapp/tailwind.config.ts`
- Create: `webapp/postcss.config.js`
- Create: `webapp/.env.local`
- Create: `webapp/.gitignore`
- Create: `webapp/src/app/layout.tsx`
- Create: `webapp/src/app/globals.css`

**Step 1: 初始化 Next.js 项目**

```bash
cd /Users/yizhuobai/Documents/除了work/order
mkdir webapp && cd webapp
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

**Step 2: 安装依赖**

```bash
cd /Users/yizhuobai/Documents/除了work/order/webapp
npm install prisma @prisma/client bcryptjs jsonwebtoken ws uuid
npm install -D @types/bcryptjs @types/jsonwebtoken @types/ws @types/uuid
```

**Step 3: 创建 `.env.local`**

```
DATABASE_URL="file:./data/order.db"
JWT_SECRET="dev-secret-change-in-production"
```

**Step 4: 配置 `tailwind.config.ts` 添加自定义主题色**

在 `theme.extend` 中添加：

```typescript
colors: {
  primary: '#FF8D4D',
  'ios-bg': '#F2F2F7',
  'text-main': '#1C1C1E',
  'text-secondary': '#8E8E93',
  'text-light': '#C7C7CC',
  'border-color': '#E5E5EA',
  'progress-blue': '#007AFF',
  'success-green': '#34C759',
  'danger-red': '#FF3B30',
},
```

**Step 5: 配置全局样式 `src/app/globals.css`**

在 Tailwind 指令之后添加基础样式：
- body 字体 `font-family: system-ui, -apple-system, sans-serif`
- 基础颜色变量
- 移动端视口优化

**Step 6: 配置 `next.config.js`**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
}
module.exports = nextConfig
```

**Step 7: Commit**

```bash
git add webapp/
git commit -m "feat(webapp): 初始化 Next.js 项目，配置 Tailwind 主题和依赖"
```

---

## Task 2: Prisma Schema 与数据库

**Files:**
- Create: `webapp/prisma/schema.prisma`
- Create: `webapp/src/lib/prisma.ts`

**Step 1: 创建 Prisma Schema**

`webapp/prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  name      String
  role      String   @default("staff") // 'admin' | 'staff'
  createdAt DateTime @default(now())
}

model Category {
  id                Int       @id @default(autoincrement())
  name              String
  sort              Int       @default(0)
  isActive          Boolean   @default(true)
  processTemplateId Int?
  createdAt         DateTime  @default(now())
  products          Product[]
}

model SpecTemplate {
  id        Int      @id @default(autoincrement())
  name      String
  type      String   @default("single") // 'single' | 'multiple'
  options   String   @default("[]") // JSON
  createdAt DateTime @default(now())
}

model ProcessTemplate {
  id        Int      @id @default(autoincrement())
  name      String
  steps     String   @default("[]") // JSON
  createdAt DateTime @default(now())
}

model Product {
  id                Int      @id @default(autoincrement())
  categoryId        Int
  category          Category @relation(fields: [categoryId], references: [id])
  name              String
  description       String   @default("")
  price             Int      // 分
  imageUrl          String   @default("")
  isOnSale          Boolean  @default(true)
  sort              Int      @default(0)
  specs             String   @default("[]") // JSON
  processTemplateId Int?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model Order {
  id            Int       @id @default(autoincrement())
  orderNo       String    @unique
  sessionId     String
  items         String    // JSON
  totalPrice    Int
  status        String    @default("pending")
  estimatedTime Int?
  remark        String    @default("")
  createdAt     DateTime  @default(now())
  confirmedAt   DateTime?
  readyAt       DateTime?
  completedAt   DateTime?
}
```

**Step 2: 创建 Prisma 客户端单例**

`webapp/src/lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Step 3: 初始化数据库**

```bash
cd /Users/yizhuobai/Documents/除了work/order/webapp
mkdir -p data
npx prisma db push
npx prisma generate
```

**Step 4: Commit**

```bash
git add webapp/prisma/ webapp/src/lib/prisma.ts
git commit -m "feat(webapp): 添加 Prisma Schema 和数据库初始化"
```

---

## Task 3: 认证系统（注册/登录/中间件）

**Files:**
- Create: `webapp/src/lib/auth.ts`
- Create: `webapp/src/lib/session.ts`
- Create: `webapp/src/app/api/auth/register/route.ts`
- Create: `webapp/src/app/api/auth/login/route.ts`
- Create: `webapp/src/app/api/auth/logout/route.ts`
- Create: `webapp/src/app/api/auth/me/route.ts`
- Create: `webapp/src/middleware.ts`

**Step 1: 创建认证工具库**

`webapp/src/lib/auth.ts`:
```typescript
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export function signToken(payload: { userId: number; role: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; role: string }
  } catch {
    return null
  }
}

export async function getAdminUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  return user
}
```

**Step 2: 创建匿名 session 工具**

`webapp/src/lib/session.ts`:
```typescript
import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'

export async function getSessionId(): Promise<string> {
  const cookieStore = await cookies()
  let sessionId = cookieStore.get('session_id')?.value
  if (!sessionId) {
    sessionId = uuidv4()
    cookieStore.set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60,
    })
  }
  return sessionId
}
```

**Step 3: 创建 API 路由**

注册 `webapp/src/app/api/auth/register/route.ts`:
- 接收 `{ email, password, name }`
- 如果是第一个用户，role 设为 'admin'，否则 'staff'
- bcrypt 加密密码，创建用户
- 签发 JWT，设置 cookie

登录 `webapp/src/app/api/auth/login/route.ts`:
- 接收 `{ email, password }`
- 验证密码，签发 JWT cookie

登出 `webapp/src/app/api/auth/logout/route.ts`:
- 清除 admin_token cookie

获取当前用户 `webapp/src/app/api/auth/me/route.ts`:
- 从 cookie 读取 token，返回用户信息

**Step 4: 创建中间件**

`webapp/src/middleware.ts`:
- `/admin` 路径（除 login/register）检查 admin_token
- 无 token 则重定向到 `/admin/login`
- 所有请求自动设置 session_id cookie（如果没有）

**Step 5: Commit**

```bash
git add webapp/src/lib/auth.ts webapp/src/lib/session.ts webapp/src/app/api/auth/ webapp/src/middleware.ts
git commit -m "feat(webapp): 实现认证系统，管理员邮箱注册登录+匿名session"
```

---

## Task 4: 菜单 API 与管理端 CRUD API

**Files:**
- Create: `webapp/src/app/api/menu/route.ts`
- Create: `webapp/src/app/api/admin/products/route.ts`
- Create: `webapp/src/app/api/admin/products/[id]/route.ts`
- Create: `webapp/src/app/api/admin/products/[id]/toggle/route.ts`
- Create: `webapp/src/app/api/admin/categories/route.ts`
- Create: `webapp/src/app/api/admin/categories/[id]/route.ts`
- Create: `webapp/src/app/api/admin/specs/route.ts`
- Create: `webapp/src/app/api/admin/specs/[id]/route.ts`
- Create: `webapp/src/app/api/admin/process/route.ts`
- Create: `webapp/src/app/api/admin/process/[id]/route.ts`
- Create: `webapp/src/app/api/upload/route.ts`
- Create: `webapp/src/lib/admin-guard.ts`

**Step 1: 创建管理员权限守卫**

`webapp/src/lib/admin-guard.ts`:
```typescript
import { NextResponse } from 'next/server'
import { getAdminUser } from './auth'

export async function requireAdmin() {
  const user = await getAdminUser()
  if (!user) {
    return { error: NextResponse.json({ error: '未授权' }, { status: 401 }), user: null }
  }
  return { error: null, user }
}
```

**Step 2: 实现 GET /api/menu**

查询所有启用分类 + 上架商品 + 属性模板 + 制作流程模板，为每个商品解析 resolvedSpecs（与小程序 getMenu 逻辑一致）。

**Step 3: 实现管理端 CRUD API**

每个资源的 CRUD 模式相同：
- `GET /api/admin/[resource]` - 列表
- `POST /api/admin/[resource]` - 创建
- `PATCH /api/admin/[resource]/[id]` - 更新
- `DELETE /api/admin/[resource]/[id]` - 删除

所有管理端 API 先调用 `requireAdmin()` 鉴权。

**Step 4: 实现图片上传 API**

`POST /api/upload`:
- 接收 multipart/form-data
- 保存到 `public/uploads/` 目录
- 返回 `/uploads/filename.jpg` 路径

**Step 5: Commit**

```bash
git add webapp/src/app/api/ webapp/src/lib/admin-guard.ts
git commit -m "feat(webapp): 实现菜单API和管理端CRUD API（商品/分类/属性/流程）"
```

---

## Task 5: 订单 API

**Files:**
- Create: `webapp/src/app/api/orders/route.ts`
- Create: `webapp/src/app/api/orders/[id]/route.ts`
- Create: `webapp/src/app/api/orders/[id]/status/route.ts`
- Create: `webapp/src/app/api/orders/[id]/process/route.ts`
- Create: `webapp/src/lib/order-utils.ts`

**Step 1: 创建订单工具函数**

`webapp/src/lib/order-utils.ts`:
- `generateOrderNo()`: 日期 + 4位流水号
- `resolveProcessTemplate()`: 从商品或分类继承制作流程
- `checkAllItemsDone()`: 检查是否所有商品制作完成

**Step 2: POST /api/orders（提交订单）**

- 从 session cookie 获取 sessionId
- 校验商品有效性
- 计算价格（含规格加价）
- 为每个商品初始化制作流程
- 创建订单
- 通过 WebSocket 广播 `new_order` 事件（Task 7 实现，这里先预留 hook）

**Step 3: GET /api/orders（查询订单列表）**

- 如果是管理员 + 带 `?admin=true` 参数，返回全部订单
- 否则根据 sessionId 返回当前用户的订单
- 支持 `?status=pending,confirmed` 状态筛选
- 分页

**Step 4: GET /api/orders/[id]（查询单个订单）**

**Step 5: PATCH /api/orders/[id]/status（更新订单状态）**

- 管理员鉴权
- 校验状态流转合法性
- 更新对应时间戳字段

**Step 6: PATCH /api/orders/[id]/process（推进制作步骤）**

- 管理员鉴权
- 推进指定商品的制作步骤
- 如果全部完成，自动将订单状态改为 ready

**Step 7: Commit**

```bash
git add webapp/src/app/api/orders/ webapp/src/lib/order-utils.ts
git commit -m "feat(webapp): 实现订单API，含提交、查询、状态流转、制作步骤推进"
```

---

## Task 6: WebSocket 服务器

**Files:**
- Create: `webapp/server.js`
- Create: `webapp/src/lib/ws.ts`

**Step 1: 创建自定义 Node 服务器**

`webapp/server.js`:
```javascript
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { WebSocketServer } = require('ws')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  const wss = new WebSocketServer({ server, path: '/ws' })

  // 存储连接
  const adminClients = new Set()
  const orderSubscriptions = new Map() // orderId -> Set<ws>

  wss.on('connection', (ws) => {
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw)
        if (msg.type === 'subscribe_admin') {
          adminClients.add(ws)
        } else if (msg.type === 'subscribe_order') {
          const subs = orderSubscriptions.get(msg.orderId) || new Set()
          subs.add(ws)
          orderSubscriptions.set(msg.orderId, subs)
        }
      } catch {}
    })

    ws.on('close', () => {
      adminClients.delete(ws)
      orderSubscriptions.forEach(subs => subs.delete(ws))
    })
  })

  // 暴露广播函数到全局，供 API 路由调用
  global.broadcastNewOrder = (order) => {
    const msg = JSON.stringify({ type: 'new_order', order })
    adminClients.forEach(client => {
      if (client.readyState === 1) client.send(msg)
    })
  }

  global.broadcastOrderUpdate = (orderId, data) => {
    const msg = JSON.stringify({ type: 'order_updated', orderId, ...data })
    const subs = orderSubscriptions.get(orderId) || new Set()
    subs.forEach(client => {
      if (client.readyState === 1) client.send(msg)
    })
    // 也通知管理端
    adminClients.forEach(client => {
      if (client.readyState === 1) client.send(msg)
    })
  }

  const port = process.env.PORT || 3000
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`)
  })
})
```

**Step 2: 创建客户端 WebSocket hook**

`webapp/src/lib/ws.ts`:
```typescript
// useWebSocket hook for React components
export function getWsUrl() {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}/ws`
}
```

**Step 3: 更新 package.json scripts**

```json
{
  "scripts": {
    "dev": "node server.js",
    "build": "next build",
    "start": "NODE_ENV=production node server.js"
  }
}
```

**Step 4: 在订单 API 中调用广播**

回到 `webapp/src/app/api/orders/route.ts`，在创建订单后调用：
```typescript
if (typeof global.broadcastNewOrder === 'function') {
  global.broadcastNewOrder(order)
}
```

同理在状态更新和步骤推进 API 中调用 `global.broadcastOrderUpdate`。

**Step 5: Commit**

```bash
git add webapp/server.js webapp/src/lib/ws.ts webapp/package.json
git commit -m "feat(webapp): 集成 WebSocket 服务器，支持新订单和状态更新实时推送"
```

---

## Task 7: 用户端 - 点单页

**Files:**
- Create: `webapp/src/app/page.tsx`
- Create: `webapp/src/components/CategoryNav.tsx`
- Create: `webapp/src/components/ProductCard.tsx`
- Create: `webapp/src/components/ProductDetailModal.tsx`
- Create: `webapp/src/components/CartBar.tsx`
- Create: `webapp/src/lib/cart.ts`

**UI 参考：** `docs/ui/2026_03_06_order_miniapp_design.md_2/screen.png` 和 `docs/ui/product_customization_popup/screen.png`

**Step 1: 创建购物车状态管理**

`webapp/src/lib/cart.ts`:
- React Context + useReducer 管理购物车状态
- addToCart / removeFromCart / updateQuantity / clearCart
- getCartTotal / getCartCount
- 持久化到 localStorage

**Step 2: 实现点单页主页面**

`webapp/src/app/page.tsx`:
- 服务端获取菜单数据 (fetch /api/menu)
- 布局：顶部店铺信息 + 主体（左分类导航 + 右商品列表）+ 底部购物车浮层
- 移动端优先的响应式设计

**Step 3: 实现组件**

- `CategoryNav`: 左侧分类列表，点击滚动到对应区域，sticky 定位
- `ProductCard`: 商品图片 + 名称 + 描述 + 价格 + 加购按钮
- `ProductDetailModal`: 底部弹出的半屏弹窗，规格选择 + 数量 + 加入购物车
- `CartBar`: 底部毛玻璃购物车浮层，数量角标 + 总价 + 去结算按钮

**Step 4: Commit**

```bash
git add webapp/src/
git commit -m "feat(webapp): 实现用户端点单页，含分类导航、商品列表、规格弹窗、购物车"
```

---

## Task 8: 用户端 - 订单确认页

**Files:**
- Create: `webapp/src/app/order/confirm/page.tsx`

**UI 参考：** `docs/ui/checkout_and_payment_screen/screen.png`

**Step 1: 实现订单确认页**

- 读取购物车数据
- 显示自取提示卡片
- 商品明细列表（图片/名称/规格/价格/数量控制）
- 备注输入
- 到店付款提示
- 底部提交栏（总价 + 提交按钮）
- 提交后清空购物车，跳转到订单详情页

**Step 2: Commit**

```bash
git add webapp/src/app/order/
git commit -m "feat(webapp): 实现订单确认页"
```

---

## Task 9: 用户端 - 订单详情页（WebSocket 实时更新）

**Files:**
- Create: `webapp/src/app/order/[id]/page.tsx`
- Create: `webapp/src/hooks/useWebSocket.ts`

**UI 参考：** `docs/ui/2026_03_06_order_miniapp_design.md_3/screen.png`

**Step 1: 创建 WebSocket hook**

`webapp/src/hooks/useWebSocket.ts`:
- 连接 WebSocket，自动重连
- 发送 `subscribe_order` 消息
- 监听 `order_updated` 事件更新页面数据

**Step 2: 实现订单详情页**

- 顶部状态图标 + 状态文字 + 订单号
- 预计取餐时间卡片
- 订单整体进度条（已下单→已接单→待取餐→已完成）
- 商品制作进度时间轴（绿色勾=完成，蓝色脉冲=进行中，灰色=等待）
- 底部订单信息（下单时间、备注、总价）
- WebSocket 实时更新

**Step 3: Commit**

```bash
git add webapp/src/app/order/ webapp/src/hooks/
git commit -m "feat(webapp): 实现订单详情页，含制作进度时间轴和WebSocket实时更新"
```

---

## Task 10: 用户端 - 我的订单页

**Files:**
- Create: `webapp/src/app/orders/page.tsx`

**UI 参考：** `docs/ui/user_order_history_list/screen.png`

**Step 1: 实现我的订单页**

- Tab 导航：进行中 / 已完成 / 已取消
- 卡片式订单列表（订单号 + 时间 + 状态标签 + 商品摘要 + 价格）
- 点击跳转详情
- 分页加载

**Step 2: Commit**

```bash
git add webapp/src/app/orders/
git commit -m "feat(webapp): 实现我的订单页，含状态Tab筛选"
```

---

## Task 11: 用户端底部导航栏

**Files:**
- Create: `webapp/src/components/BottomNav.tsx`
- Modify: `webapp/src/app/layout.tsx`

**Step 1: 创建底部导航组件**

三个 Tab：点单 / 订单 / 关于
仅在用户端页面显示（非 /admin 路径）

**Step 2: Commit**

```bash
git add webapp/src/components/BottomNav.tsx webapp/src/app/layout.tsx
git commit -m "feat(webapp): 添加用户端底部导航栏"
```

---

## Task 12: 管理端 - 登录/注册页

**Files:**
- Create: `webapp/src/app/admin/login/page.tsx`
- Create: `webapp/src/app/admin/register/page.tsx`
- Create: `webapp/src/app/admin/layout.tsx`

**Step 1: 实现登录页**

- 邮箱 + 密码输入
- 登录按钮
- 跳转到注册页的链接
- 登录成功后跳转到 /admin

**Step 2: 实现注册页**

- 邮箱 + 密码 + 姓名输入
- 首个注册账户的提示文案
- 注册成功自动登录跳转

**Step 3: 管理端 layout**

- 侧边栏 / 顶部导航（订单管理、商品管理、系统配置子菜单）
- 移动端：底部导航 Tab（订单管理 / 商品管理 / 系统配置）

**Step 4: Commit**

```bash
git add webapp/src/app/admin/
git commit -m "feat(webapp): 实现管理端登录注册页和layout"
```

---

## Task 13: 管理端 - 订单管理页

**Files:**
- Create: `webapp/src/app/admin/page.tsx`
- Create: `webapp/src/hooks/useAdminWebSocket.ts`

**UI 参考：** `docs/ui/2026_03_06_order_miniapp_design.md_4/screen.png`

**Step 1: 创建管理端 WebSocket hook**

- 连接后发送 `subscribe_admin`
- 监听 `new_order` 事件，振动提醒 + 刷新列表
- 监听 `order_updated` 更新列表中的订单状态

**Step 2: 实现订单管理页**

- Tab：待确认（含数量）/ 制作中 / 待取餐
- 订单卡片：订单号 + 状态标签 + 时间 + 商品列表(含规格) + 备注 + 总价
- 待确认：确认接单按钮（弹出预估时间输入）+ 拒绝按钮
- 制作中：每个商品的进度条 + "下一步(步骤名)" 按钮
- 待取餐：确认取餐完成按钮

**Step 3: Commit**

```bash
git add webapp/src/app/admin/page.tsx webapp/src/hooks/
git commit -m "feat(webapp): 实现管理端订单管理页，含WebSocket实时监听和制作步骤推进"
```

---

## Task 14: 管理端 - 商品管理页

**Files:**
- Create: `webapp/src/app/admin/products/page.tsx`

**UI 参考：** `docs/ui/admin_product_management_screen/screen.png` 和 `docs/ui/admin_edit_product_popup/screen.png`

**Step 1: 实现商品管理页**

- 搜索框
- 商品列表：图片 + 名称 + 价格 + 编辑按钮 + 上下架 toggle
- 底部添加新商品按钮
- 编辑/新增弹窗（底部抽屉）：图片上传 + 名称 + 价格 + 分类选择 + 描述 + 规格设置

**Step 2: Commit**

```bash
git add webapp/src/app/admin/products/
git commit -m "feat(webapp): 实现管理端商品管理页"
```

---

## Task 15: 管理端 - 分类/属性模板/制作流程管理页

**Files:**
- Create: `webapp/src/app/admin/categories/page.tsx`
- Create: `webapp/src/app/admin/specs/page.tsx`
- Create: `webapp/src/app/admin/process/page.tsx`

**Step 1: 分类管理页**

- 分类列表：名称 + 排序 + 启用/禁用 toggle + 关联制作流程 + 编辑/删除
- 新增/编辑弹窗

**Step 2: 属性模板管理页**

- 模板列表：名称 + 类型(单选/多选) + 选项标签
- 新增/编辑弹窗：名称 + 类型 + 动态选项列表(选项名+加价)

**Step 3: 制作流程管理页**

- 流程列表：名称 + 步骤数
- 新增/编辑弹窗：名称 + 动态步骤列表

**Step 4: Commit**

```bash
git add webapp/src/app/admin/categories/ webapp/src/app/admin/specs/ webapp/src/app/admin/process/
git commit -m "feat(webapp): 实现管理端分类、属性模板、制作流程管理页"
```

---

## Task 16: PWA 配置

**Files:**
- Create: `webapp/public/manifest.json`
- Create: `webapp/public/sw.js`
- Create: `webapp/public/icons/` (各尺寸图标)
- Modify: `webapp/src/app/layout.tsx`

**Step 1: 创建 manifest.json**

```json
{
  "name": "精品咖啡烘焙店",
  "short_name": "点单",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFFFFF",
  "theme_color": "#FF8D4D",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**Step 2: 创建 Service Worker**

基本的静态资源缓存策略。

**Step 3: 在 layout.tsx 中注册**

添加 `<link rel="manifest">` 和 Service Worker 注册脚本。
添加 `<meta name="apple-mobile-web-app-capable" content="yes">`。

**Step 4: 生成 PWA 图标**

使用橙色主题的简单图标占位。

**Step 5: Commit**

```bash
git add webapp/public/ webapp/src/app/layout.tsx
git commit -m "feat(webapp): 添加PWA配置，支持安装到桌面"
```

---

## Task 17: Docker 配置

**Files:**
- Create: `webapp/Dockerfile`
- Create: `webapp/docker-compose.yml`
- Create: `webapp/.dockerignore`

**Step 1: 创建 Dockerfile**

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/server.js ./server.js
RUN mkdir -p data public/uploads
EXPOSE 3000
CMD ["node", "server.js"]
```

**Step 2: 创建 docker-compose.yml**

**Step 3: 创建 .dockerignore**

```
node_modules
.next
data
.env.local
```

**Step 4: Commit**

```bash
git add webapp/Dockerfile webapp/docker-compose.yml webapp/.dockerignore
git commit -m "feat(webapp): 添加Docker部署配置"
```

---

## Task 18: 种子数据脚本

**Files:**
- Create: `webapp/prisma/seed.ts`
- Modify: `webapp/package.json`

**Step 1: 创建种子数据脚本**

`webapp/prisma/seed.ts`:
- 创建初始管理员 (admin@example.com / admin123)
- 创建 4 个属性模板（杯型、糖度、冰量、加料）
- 创建 2 个制作流程模板（饮品、烘焙）
- 创建 6 个分类
- 创建 6 个示例商品（含 specs 配置）

**Step 2: 配置 package.json**

```json
{
  "prisma": {
    "seed": "npx tsx prisma/seed.ts"
  }
}
```

安装 tsx: `npm install -D tsx`

**Step 3: 运行种子数据**

```bash
npx prisma db seed
```

**Step 4: Commit**

```bash
git add webapp/prisma/seed.ts webapp/package.json
git commit -m "feat(webapp): 添加种子数据脚本"
```

---

## Task 19: 联调测试与收尾

**Step 1: 启动开发服务器验证**

```bash
cd webapp
npm run dev
```

**Step 2: 逐页面验证**

- [ ] 点单页加载菜单正常
- [ ] 商品规格弹窗交互正确
- [ ] 购物车加减和总价计算正确
- [ ] 提交订单成功，跳转到订单详情
- [ ] 订单详情 WebSocket 实时更新
- [ ] 我的订单列表分页
- [ ] 管理端注册/登录
- [ ] 管理端接单 + 推进制作步骤
- [ ] 管理端商品 CRUD + 上下架
- [ ] 属性模板/流程模板/分类 CRUD
- [ ] PWA 安装到桌面测试
- [ ] Docker 构建和运行

**Step 3: 修复问题并提交**

```bash
git add -A
git commit -m "fix(webapp): 联调修复与收尾"
```
