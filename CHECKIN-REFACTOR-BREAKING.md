# Check-in 界面重构说明

## BREAKING CHANGE
- 完全替换 `src/pages/CheckIn.tsx` 的实现为组件化架构（`NoteModal`、`SuccessModal`、`CheckInStats`、`CheckInCalendar`、`CheckInButton`、`useCheckInController`）。
- 新增“签到备注”弹窗，提交需满足最少 5 个字符验证；ESC 关闭、Enter 提交。
- 新增本地缓存：每日备注缓存到 `localStorage`，键名 `dreweave_checkin_note_{userId}_{date}`。
- 键盘交互增强：全局监听 Enter/ESC 以适配桌面端操作习惯。

## 兼容性
- 保持原有视觉风格与颜色体系；主色系在组件层面使用 `#4CAF50` 和 `#8BC34A`。
- 图标沿用项目现有 `lucide-react`，避免引入新库。

## 测试
- 新增 Vitest 单元测试于 `src/components/checkin/__tests__`，覆盖核心控制器、日历生成与按钮交互。