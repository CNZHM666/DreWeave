# 每日打卡模块 API 与技术说明

## 概述
- 模块采用组件化设计，分为控制器 Hook 与视图组件
- 状态管理依赖现有 Zustand `useCheckInStore`，历史分页通过 Supabase API

## 控制器 Hook
- `useCheckInController(opts)`
  - 属性：`theme`, `note`, `setNote`, `noteOpen`, `setNoteOpen`, `submit()`, `hasCheckedInToday`, `isSubmitting`
  - 备注校验：最少 5 字符；本地缓存键：`dreweave_checkin_note_{userId}_{date}`
  - 事件：提交耗时通过 `metrics` 记录 `timer:checkin_submit`

## 视图组件
- `CheckInStats`：当前连签、最长记录、本月次数
- `CheckInCalendar`：月度日历渲染（Set 加速）
- `CheckInButton`：支持 Enter/空格触发、ESC 全局关闭弹窗
- `NoteModal`：备注输入弹窗
- `SuccessModal`：成功反馈弹窗
- `CheckInHistory`：分页加载历史记录，`pageSize` 默认 20

## Supabase API
- `checkInApi.getUserCheckInsPage(userId, page, pageSize)`：分页获取，返回 `{ data, total }`

## 性能监控
- `utils/metrics.ts`：`recordEvent`, `startTimer`, `endTimer`
- 记录事件存储在 `localStorage: dreweave_metrics`

## 响应时间目标
- 提交签到本地路径在 200ms 内完成；后台获取与同步不阻塞交互