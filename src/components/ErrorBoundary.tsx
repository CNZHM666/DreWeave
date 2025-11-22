import React from 'react'
 

type State = { hasError: boolean; error?: any; code?: 'network' | 'session' | 'server' | 'unknown'; retrying?: boolean; retryCount?: number }

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, code: 'unknown', retrying: false, retryCount: 0 }
  static getDerivedStateFromError(error: any) { return { hasError: true, error } }
  componentDidCatch(error: any) {
    const msg = String(error?.message || '')
    let net: any = 'unknown'
    try {
      const raw = localStorage.getItem('auth-store')
      const s = raw ? JSON.parse(raw) : null
      net = s?.state?.networkStatus || 'unknown'
    } catch {}
    const code = classifyError(msg, net)
    this.setState({ code })
    this.scheduleRetry()
  }
  scheduleRetry() {
    if (this.state.retrying) return
    this.setState({ retrying: true })
    const attempt = async () => {
      try {
        const ok = await new Promise<boolean>((resolve) => {
          try {
            const img = new Image()
            let done = false
            const t = setTimeout(() => { if (!done) { done = true; resolve(false) } }, 1500)
            img.onload = () => { if (!done) { done = true; clearTimeout(t); resolve(true) } }
            img.onerror = () => { if (!done) { done = true; clearTimeout(t); resolve(false) } }
            img.src = `/favicon.svg?ts=${Date.now()}`
          } catch { resolve(false) }
        })
        if (ok) {
          this.setState({ hasError: false, error: null, retrying: false, retryCount: 0 })
          return
        }
      } catch {}
      const n = (this.state.retryCount || 0) + 1
      if (n < 3) {
        this.setState({ retryCount: n })
        setTimeout(attempt, 1500)
      } else {
        this.setState({ retrying: false })
      }
    }
    setTimeout(attempt, 800)
  }
  handleRetry = () => {
    this.setState({ retryCount: 0, retrying: false })
    this.scheduleRetry()
  }
  handleGoLogin = () => {
    try { window.location.href = '/login' } catch {}
  }
  render() {
    if (this.state.hasError) {
      const isNetwork = this.state.code === 'network'
      const isSession = this.state.code === 'session'
      const isServer = this.state.code === 'server'
      let offline = false
      try {
        const raw = localStorage.getItem('auth-store')
        const s = raw ? JSON.parse(raw) : null
        offline = !!s?.state?.isOfflineMode
      } catch {}
      if (offline && (isNetwork || isServer)) {
        return (
          <>
            <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 glass-light px-4 py-2 rounded-xl bg-white/80 text-blue-900">
              <span className="font-semibold mr-2">{isNetwork ? '网络连接问题' : '服务器错误'}</span>
              <button className="btn-healing" onClick={this.handleRetry}>{this.state.retrying ? '正在重试...' : '重试'}</button>
            </div>
            {this.props.children}
          </>
        )
      }
      return (
        <div className="min-h-screen flex items-center justify-center gradient-healing">
          <div className="glass-light p-6 rounded-3xl bg-white/60 text-blue-900 w-full max-w-md">
            <div className="text-xl font-bold mb-2">{isNetwork ? '网络连接问题' : isSession ? '会话已过期' : isServer ? '服务器错误' : '页面加载失败'}</div>
            <div className="text-sm mb-4">
              {isNetwork ? '请检查网络连接或稍后重试' : isSession ? '请重新登录以继续' : isServer ? '服务暂不可用，请稍后再试' : '请刷新或重新登录尝试'}
            </div>
            <div className="flex gap-2">
              <button className="btn-healing" onClick={this.handleRetry}>{this.state.retrying ? '正在重试...' : '重试'}</button>
              {isSession && <button className="btn-healing" onClick={this.handleGoLogin}>去登录</button>}
              <button className="btn-healing" onClick={() => { try { window.location.reload() } catch {} }}>刷新页面</button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export function classifyError(message: string, net: string): 'network' | 'session' | 'server' | 'unknown' {
  const msg = String(message || '')
  if (msg.includes('Failed to fetch') || msg.includes('timeout') || msg.includes('ERR_CONNECTION_CLOSED') || msg.includes('ERR_ABORTED') || net === 'offline') return 'network'
  if (msg.includes('JWT') || msg.includes('expired') || msg.includes('auth') || msg.includes('401')) return 'session'
  if (msg.includes('500') || msg.toLowerCase().includes('service unavailable') || msg.toLowerCase().includes('database')) return 'server'
  return 'unknown'
}