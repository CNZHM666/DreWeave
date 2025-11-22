import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import App from './App'
import './index.css'
import { initPerfVitals } from './utils/perfVitals'
import { recordEvent, startTimer, endTimer } from './utils/metrics'

startTimer('mount')
window.addEventListener('load', () => { endTimer('mount') })
window.addEventListener('error', (e: any) => { try { recordEvent('global_error', { message: String(e?.message||''), filename: String(e?.filename||''), lineno: e?.lineno, colno: e?.colno }) } catch {} })
window.addEventListener('unhandledrejection', (e: any) => { try { recordEvent('promise_rejection', { reason: String(e?.reason?.message||e?.reason||'') }) } catch {} })

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
    <Toaster position="top-center" richColors />
  </BrowserRouter>
)

// 仅在显式开启时才注册 Service Worker；预览/局域网默认不启用
if (import.meta.env.PROD && import.meta.env.VITE_ENABLE_SW === 'true' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
  } else if ('serviceWorker' in navigator) {
  // 未启用时主动反注册，避免旧缓存导致脚本错误
  try {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(r => r.unregister().catch(() => {}))
      try {
        const wc: any = (window as any).caches
        if (wc && typeof wc.keys === 'function') {
          wc.keys().then((keys: any[]) => keys.forEach((k: any) => wc.delete(k))).catch(() => {})
        }
      } catch {}
    }).catch(() => {})
  } catch {}
}

try { initPerfVitals() } catch {}
// 运行时为后端域名添加预连接与 DNS 预取，提升弱网首包连接成功率
try {
  const url = (import.meta as any).env?.VITE_SUPABASE_URL
  if (typeof url === 'string' && url.startsWith('http')) {
    const host = new URL(url).origin
    const add = (rel: string) => {
      const link = document.createElement('link')
      link.rel = rel
      link.href = host
      link.crossOrigin = ''
      document.head.appendChild(link)
    }
    add('preconnect')
    add('dns-prefetch')
  }
} catch {}
