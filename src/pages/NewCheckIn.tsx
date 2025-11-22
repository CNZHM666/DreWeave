import React from 'react'
import { useAuthStore } from '../stores/authStore'
import { useCheckinNewStore } from '../stores/checkinNewStore'
import { computeDeviceFingerprint } from '../services/checkin/fingerprint'
import type { CheckInMethod, SubmitPayload } from '../services/checkin/types'
import { QrCode, MapPin, CheckCircle, Clock } from 'lucide-react'

export default function NewCheckIn() {
  const { user } = useAuthStore()
  const store = useCheckinNewStore()
  const [method, setMethod] = React.useState<CheckInMethod>('manual')
  const [qrToken, setQrToken] = React.useState('')
  const [geo, setGeo] = React.useState<{ lat?: number; lng?: number; accuracy?: number }>({})
  const [submitting, setSubmitting] = React.useState(false)
  const [msg, setMsg] = React.useState('')
  const enterHandlerRef = React.useRef<(e: KeyboardEvent) => void>()

  React.useEffect(() => { if (user?.id) store.fetchEvents(user.id) }, [user?.id])

  React.useEffect(() => {
    const h = () => { if (user?.id) store.syncOffline(user.id) }
    window.addEventListener('online', h)
    return () => window.removeEventListener('online', h)
  }, [user?.id])

  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Enter') submit()
      if (e.key === 'Escape') { setQrToken(''); setMsg('') }
    }
    enterHandlerRef.current = h
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  async function captureGeo() {
    try {
      setMsg('正在获取定位...')
      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => { setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }); resolve() },
          (err) => { setMsg(`定位失败：${err.message}`); reject(err) },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        )
      })
      setMsg('定位完成')
    } catch {}
  }

  async function submit() {
    if (!user?.id) { setMsg('请先登录'); return }
    setSubmitting(true); setMsg('正在提交...')
    const tsClient = new Date().toISOString()
    const tz = new Date().getTimezoneOffset() * -1
    const fp = await computeDeviceFingerprint()
    const payload: SubmitPayload = {
      user_id: user.id,
      method,
      ts_client: tsClient,
      tz_offset_minutes: tz,
      device_fp: fp,
      qr_session_id: method === 'qr' && qrToken ? qrToken : undefined,
      geo: method === 'gps' ? (geo.lat && geo.lng ? { lat: geo.lat!, lng: geo.lng!, accuracy: geo.accuracy } : undefined) : undefined,
    }
    const res = await store.submit(payload)
    if (res) setMsg('签到成功')
    else {
      const err = store.error || ''
      setMsg(err.includes('离线') ? '已离线保存，将自动重试' : `签到失败：${err || '请稍后重试'}`)
    }
    setSubmitting(false)
    if (user?.id) store.fetchEvents(user.id)
  }

  return (
    <div className="min-h-screen gradient-healing p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-white text-shadow-strong">每日打卡</h1>
          <p className="text-blue-100 text-shadow-medium">选择签到方式，完成今日打卡</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-light p-6 rounded-3xl transition-gpu">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-blue-900">
                <CheckCircle className="w-6 h-6 text-[#4CAF50]" />
                <span className="font-semibold">选择方式</span>
              </div>
              <Clock className="w-5 h-5 text-blue-300" />
            </div>
            <div className="mb-4">
              <select value={method} onChange={(e) => setMethod(e.target.value as CheckInMethod)} className="w-full p-3 rounded-2xl bg-white bg-opacity-60 text-blue-900">
                <option value="manual">手动签到</option>
                <option value="gps">GPS定位</option>
                <option value="qr">二维码扫描</option>
              </select>
            </div>
            {method === 'qr' && (
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2 text-blue-800">
                  <QrCode className="w-5 h-5" />
                  <span>输入或扫描 QR Token</span>
                </div>
                <input className="border rounded-2xl p-3 w-full" placeholder="QR Token" value={qrToken} onChange={(e) => setQrToken(e.target.value)} />
              </div>
            )}
            {method === 'gps' && (
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2 text-blue-800">
                  <MapPin className="w-5 h-5" />
                  <span>获取当前位置</span>
                </div>
                <button onClick={captureGeo} className="px-4 py-2 rounded-2xl bg-blue-600 text-white hover:scale-105 transition-gpu">获取位置</button>
                {geo.lat && geo.lng && <p className="mt-2 text-sm text-blue-900">位置 {geo.lat?.toFixed(6)}, {geo.lng?.toFixed(6)} · 精度 {geo.accuracy?.toFixed(1)}m</p>}
              </div>
            )}
            <button disabled={submitting} onClick={submit} className={`px-6 py-3 rounded-3xl font-bold btn-primary-desktop ${submitting ? 'opacity-70' : 'hover:scale-105 transition-gpu'}`}>
              {submitting ? '提交中...' : '签到'}
            </button>
            {msg && <p className="mt-3 text-sm text-blue-800">{msg}</p>}
          </div>
          <div className="glass p-6 rounded-3xl">
            <div className="mb-4 text-center">
              <h2 className="text-2xl font-semibold text-blue-900 text-shadow-light">最近签到事件</h2>
            </div>
            <ul className="space-y-3">
              {store.events.map((e: any) => (
                <li key={e.id} className="flex items-center justify-between hover-target-lg">
                  <span className="text-blue-900">{new Date(e.ts_server).toLocaleString()} · {e.method}</span>
                  <span className={`text-sm px-3 py-1 rounded-full ${e.status === 'verified' ? 'bg-[#4CAF50] text-white' : e.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'}`}>{e.status || 'pending'} · 风险 {e.risk_score ?? 0}</span>
                </li>
              ))}
              {store.events.length === 0 && <li className="text-blue-800 text-sm">暂无记录</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}