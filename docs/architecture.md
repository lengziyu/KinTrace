# KinTrace MVP 架构补充

## UI 与主题

- 视觉风格：简洁、庄重、低饱和，以米白、墨黑、石青、黛金为主。
- H5 与后台统一采用 `shadcn-vue` 风格组件，不使用夸张拟物或强科技感。
- 主题切换采用 `light / dark / system` 三态，主题状态分别保存在本地缓存。

## API 设计约定

- Base URL: `/api/v1`
- 响应结构统一：
  - `success`
  - `message`
  - `data`
- 管理后台和 H5 统一通过 Bearer JWT 调用。
- 首期允许 H5 使用“昵称 + familyCode/inviteCode”换取 member token。

## 关键扩展预留

- `FamilyMember.role` 预留 `admin / manager / member`
- `WorshipRecord.actionType` 预留 `visited / cleaned / offered / note`
- `RoutePlan` 预留路线类型和共享范围
- `MemorialMessage` 预留匿名开关与审核人字段
- `TombPoint` 后续可扩展相册、碑文、视频、墓区层级
