import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  const meta = (user as any)?.user_metadata || {}
  const isAdmin = !!(user && (
    meta?.roles?.includes?.('admin') ||
    (user as any)?.username === 'admin' ||
    String(meta?.username || '').toLowerCase() === 'admin'
  ))
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />
  if (isLoading) return (<div className="min-h-screen flex items-center justify-center">加载中...</div>)
  if (!isAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}

export default ProtectedAdminRoute