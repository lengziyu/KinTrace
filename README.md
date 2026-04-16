# 宗迹 KinTrace

“宗迹 / KinTrace” 是一个面向家族祭扫协作场景的地图系统 MVP。首期目标是先打通家族加入、地图看墓点、年度祭扫、已拜记录、祈福留言和简单路线规划的核心流程，并为后续家谱树、代祭、权限和通知能力预留扩展空间。

## 1. 整体架构设计

### 1.1 架构原则

- 以 MVP 为优先，先打通“管理端录入 -> 用户端查看 -> 祭扫记录闭环”。
- 主仓 `KinTrace` 采用 monorepo，包含 `H5 + Server + Shared`。
- 后台仓 `KinTrace-admin` 独立维护，方便单独部署和快速迭代，但接口规范与主仓统一。
- 不做微服务，后端统一使用 NestJS 单体应用，按业务模块拆分。
- 所有页面、接口和实体命名统一使用英文代码名，中文用于展示文案。
- UI 统一采用 `Vue 3 + TailwindCSS + shadcn-vue` 风格组件方案，并支持浅色/深色主题切换。

### 1.2 系统组成

- `apps/h5`
  - 移动端 H5，面向家族成员。
  - 重点页面：首页、地图、墓点详情、年度祭扫、路线规划、留言、我的。
- `apps/server`
  - NestJS REST API。
  - 负责认证、家族成员、墓点、任务、记录、留言、路线模板、静态资源。
- `packages/shared`
  - 共享类型、枚举、接口模型、常量、路由 key。
- `KinTrace-admin`（独立仓）
  - PC 管理后台，面向管理员。
  - 重点提升数据录入与审核效率。

### 1.3 核心流程

1. 管理员在后台创建家族、墓点、年度祭扫任务。
2. 管理员生成邀请链接，家族成员通过 H5 输入昵称加入家族。
3. 家族成员在地图上查看墓点、查看详情、发起导航。
4. 家族成员对墓点执行“已拜”操作，写入祭扫记录。
5. 家族成员撰写祈福留言，后台审核后展示。
6. 家族成员可勾选多个墓点，生成简单路线规划结果。

## 2. 目录结构

```text
KinTrace/
├─ apps/
│  ├─ h5/                      # H5 用户端
│  └─ server/                  # NestJS 服务端
├─ packages/
│  └─ shared/                  # 共享类型/常量/枚举
├─ docs/
│  └─ architecture.md          # 架构与开发说明
├─ package.json
├─ pnpm-workspace.yaml
└─ tsconfig.base.json

KinTrace-admin/
├─ src/                        # 后台管理前端
├─ public/
├─ package.json
└─ vite.config.ts
```

## 3. 数据库 Schema 设计

### 3.1 实体关系

- `User`
  - 系统登录主体。
  - 首期承载管理员账号，也保留家族成员登录扩展能力。
- `FamilyGroup`
  - 家族群组主体。
  - 维护家族名称、简介、邀请码等。
- `FamilyMember`
  - 家族成员。
  - 关联 `FamilyGroup`，可通过昵称快速加入。
- `TombPoint`
  - 墓点。
  - 关联家族，保存地图经纬度、辈分、支系、介绍、封面图。
- `WorshipTask`
  - 年度祭扫任务。
  - 对应某一年某个家族的祭扫周期。
- `WorshipRecord`
  - 祭扫记录。
  - 记录成员在任务下对墓点执行“已拜”等行为。
- `MemorialMessage`
  - 祈福留言。
  - 需审核状态。
- `RoutePlan`
  - 路线模板或成员保存的路线方案。

### 3.2 建模要点

- 一个家族对应多个成员、多个墓点、多个任务、多个留言、多个路线模板。
- 一个年度任务下可关联多条祭扫记录。
- “年度重置”不直接修改墓点基础信息，而是通过新建 `WorshipTask` 并以该任务维度重新统计状态。
- 留言采用审核流：`pending / approved / rejected`。
- 路线规划首期存储为墓点 ID 顺序数组，便于后续接入高级路径优化。

### 3.3 推荐表字段

#### User

- `id`
- `username`
- `passwordHash`
- `displayName`
- `role`
- `status`
- `createdAt`
- `updatedAt`

#### FamilyGroup

- `id`
- `name`
- `code`
- `description`
- `inviteCode`
- `ownerUserId`
- `createdAt`
- `updatedAt`

#### FamilyMember

- `id`
- `familyId`
- `userId` nullable
- `nickname`
- `avatar`
- `phone` nullable
- `role`
- `joinSource`
- `status`
- `joinedAt`
- `createdAt`
- `updatedAt`

#### TombPoint

- `id`
- `familyId`
- `name`
- `titleName`
- `generation`
- `branchName`
- `lng`
- `lat`
- `areaName`
- `description`
- `coverImage`
- `createdAt`
- `updatedAt`

#### WorshipTask

- `id`
- `familyId`
- `year`
- `name`
- `startDate`
- `endDate`
- `status`
- `createdAt`
- `updatedAt`

#### WorshipRecord

- `id`
- `taskId`
- `tombId`
- `memberId`
- `actionType`
- `remark`
- `worshipTime`
- `createdAt`

#### MemorialMessage

- `id`
- `familyId`
- `tombId`
- `memberId`
- `content`
- `status`
- `createdAt`

#### RoutePlan

- `id`
- `familyId`
- `name`
- `description`
- `tombIds`
- `createdByMemberId` nullable
- `createdAt`
- `updatedAt`

## 4. 后端模块划分

- `auth`
  - 管理员账号登录
  - H5 昵称加入/游客登录
  - JWT 签发与鉴权
- `users`
  - 管理员用户管理
- `family`
  - 家族信息、邀请码、基础资料
- `member`
  - 家族成员 CRUD、成员状态管理
- `tomb`
  - 墓点 CRUD、地图列表、详情查询
- `worship-task`
  - 年度任务 CRUD、年度重置
- `worship-record`
  - 已拜标记、任务进度统计
- `memorial-message`
  - 留言发布、审核、展示
- `route-plan`
  - 模板路线 CRUD、成员多点路线保存
- `upload`
  - 本地静态目录上传占位接口

## 5. H5 页面路由设计

| 路由 | 页面 | 说明 |
| --- | --- | --- |
| `/` | 首页 | 家族概览、当前任务、快捷入口 |
| `/join` | 邀请加入页 | 通过邀请参数加入家族 |
| `/login` | 简化登录页 | 昵称进入 |
| `/map` | 地图页 | 高德地图、墓点列表、筛选 |
| `/tombs/:id` | 墓点详情页 | 墓点介绍、导航、已拜、留言入口 |
| `/tasks` | 年度祭扫页 | 当前年度任务、状态统计 |
| `/routes` | 路线规划页 | 多选墓点、简单路线结果 |
| `/messages` | 留言页 | 查看与提交祈福留言 |
| `/me` | 我的页面 | 成员资料、主题切换、加入家族信息 |

## 6. 管理后台菜单设计

- `仪表盘`
  - 核心统计
  - 今日待办
- `家族管理`
  - 家族信息
  - 邀请设置
- `成员管理`
  - 成员列表
  - 成员状态
- `墓点管理`
  - 墓点列表
  - 新增/编辑墓点
- `年度任务管理`
  - 年度任务列表
  - 年度重置
  - 祭扫进度
- `留言管理`
  - 待审核留言
  - 审核记录
- `路线管理`
  - 路线模板
  - 多点方案
- `系统设置`
  - 主题偏好
  - 上传配置占位

## 7. MVP 开发顺序

### Step 1 基础初始化

- 初始化 workspace、H5、Server、Admin。
- 确定统一命名、主题、共享类型。

### Step 2 数据层与接口

- Prisma schema
- migration / seed
- NestJS 基础模块
- Swagger 与 REST 路由骨架

### Step 3 管理后台 MVP

- 登录
- 家族管理
- 墓点 CRUD
- 年度任务 CRUD
- 留言审核
- 路线模板管理

### Step 4 H5 MVP

- 邀请加入/昵称登录
- 首页
- 地图页
- 墓点详情
- 已拜标记
- 留言提交
- 路线规划

### Step 5 联调与补强

- 接口联调
- seed 数据优化
- 基础校验
- 兼容手机浏览器

## 8. 当前阶段文件清单

### 已创建

- `README.md`
- `package.json`
- `pnpm-workspace.yaml`
- `tsconfig.base.json`
- `docker-compose.yml`
- `.gitignore`

### 下一步即将创建

- `apps/server/*`
- `apps/h5/*`
- `packages/shared/*`
- `KinTrace-admin/*`

## 9. 本地运行建议

### 主仓 KinTrace

1. 启动 PostgreSQL：
   - `docker compose up -d`
   - 如果本机已安装 PostgreSQL，也可直接使用本地服务，只需保证连接串与 `apps/server/.env` 一致
2. 配置服务端环境：
   - 复制 `apps/server/.env.example` 为 `apps/server/.env`
3. 执行 Prisma：
   - `pnpm --filter @kintrace/server prisma:migrate`
   - `pnpm --filter @kintrace/server prisma:seed`
4. 启动服务端：
   - `pnpm dev:server`
5. 启动 H5：
   - `pnpm dev:h5`

### 后台仓 KinTrace-admin

1. 确认 `VITE_API_BASE_URL` 指向服务端 `/api/v1`
2. 启动：
   - `pnpm dev`
