import React from 'react'
import { TABLES, supabase } from '../config/supabase'

export default function HealthStatusPanel() {
  const [online, setOnline] = React.useState<boolean>(navigator.onLine)
  const [envOk, setEnvOk] = React.useState<boolean>(Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY))
  const [backendOk, setBackendOk] = React.useState<boolean | null>(null)
  const [message, setMessage] = React.useState<string>('')

  React.useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  React.useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL as string
    if (!url) {
      setBackendOk(false)
      setMessage('配置缺失')
      return
    }
    ;(async () => {
      try {
        const res = await fetch(url, { method: 'HEAD' })
        setBackendOk(res.ok)
        setMessage(res.ok ? '正常' : String(res.status))
      } catch (e: any) {
        setBackendOk(false)
        setMessage(e?.message || '不可用')
      }
    })()
  }, [])

  const badge = (ok: boolean | null) => {
    if (ok === null) return 'bg-yellow-500'
    return ok ? 'bg-green-600' : 'bg-red-600'
  }

  return (
    <div className="fixed top-2 right-2 z-50">
      <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-3 py-2 border border-white/30 shadow">
        <span className={`w-2 h-2 rounded-full ${online ? 'bg-green-600' : 'bg-red-600'}`}></span>
        <span className="text-xs">网络</span>
        <span className={`w-2 h-2 rounded-full ${envOk ? 'bg-green-600' : 'bg-red-600'}`}></span>
        <span className="text-xs">配置</span>
        <span className={`w-2 h-2 rounded-full ${badge(backendOk)}`}></span>
        <span className="text-xs">后端</span>
        <span className="text-xs text-gray-700">{message}</span>
      </div>
    </div>
  )
}