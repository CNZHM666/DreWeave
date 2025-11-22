# 新签到模块 API 文档

## 概述
- 统一提交：支持 `qr/gps/manual` 三种方式
- 幂等与重试：前端 3 次退避重试，后端唯一约束 + 幂等键（可扩展）

## 端点
### POST /v1/checkins
- 请求体：
```
{
  "user_id": "uuid",
  "method": "qr|gps|manual",
  "ts_client": "2025-01-01T12:00:00.000Z",
  "tz_offset_minutes": 480,
  "geo": { "lat": 31.23, "lng": 121.47, "accuracy": 30 },
  "device_fp": "sha256-hex",
  "qr_session_id": "uuid"
}
```
- 响应：
```
{ "id": "uuid", "status": "pending|verified|rejected", "risk_score": 0, "ts_server": "2025-01-01T12:00:01.000Z" }
```

### GET /v1/checkins?user_id&limit&cursor
- 列出最近事件（分页）

### POST /v1/qr/sessions
- 生成短时效会话，用于二维码签到

### GET /v1/checkins/stats?user_id
- 返回方法分布、风险分布、连续趋势（后续可扩展）

## 错误码
- 400 参数错误；401 未鉴权；403 风控拒绝；409 重复提交；503 服务不可用

## 备注
- 时间戳窗口 ±120s；地理位置精度默认需 ≤100m；设备指纹变更提高风险分