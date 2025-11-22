import React, { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useCheckinNewStore } from '../stores/checkinNewStore'
import { useMarketStore } from '../stores/marketStore'
import { useAchievementStore } from '../stores/achievementStore'
import { testApi, supabase, TABLES, isSupabaseConfigured, userApi } from '../config/supabase'
import { computeDeviceFingerprint } from '../services/checkin/fingerprint'
import type { SubmitPayload } from '../services/checkin/types'
import { User, Mail, Calendar, Award, Target, Clock, Edit3, Save, X, GraduationCap, Camera, Upload } from 'lucide-react'
import { toast } from 'sonner'
import BackToHome from '../components/BackToHome'
import { useAbstinenceStore } from '../stores/abstinenceStore'

const Profile: React.FC = () => {
  const { user, isAuthenticated, logout, updateAvatar } = useAuthStore()
  const abst = useAbstinenceStore()
  const [isEditing, setIsEditing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editedUser, setEditedUser] = useState({
    username: '',
    email: '',
    studentId: ''
  })
  const events = useCheckinNewStore(s => s.events)
  const fetchEvents = useCheckinNewStore(s => s.fetchEvents)
  const submitEvent = useCheckinNewStore(s => s.submit)
  const submitError = useCheckinNewStore(s => s.error)
  const coins = useMarketStore(s => s.coins)
  const transactions = useMarketStore(s => s.transactions)
  const fetchMarketData = useMarketStore(s => s.fetchUserData)
  const achievementsStats = useAchievementStore(s => s.stats)
  const userAchievements = useAchievementStore(s => s.userAchievements)
  const fetchUserAchievements = useAchievementStore(s => s.fetchUserAchievements)
  const [testsCount, setTestsCount] = useState(0)
  const [submittingCheckin, setSubmittingCheckin] = useState(false)
  const [checkinMsg, setCheckinMsg] = useState('')
  const hasCheckedInToday = React.useMemo(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const today = `${y}-${m}-${day}`
    return events.some(e => {
      const dd = new Date(e.ts_server)
      const y2 = dd.getFullYear(); const m2 = String(dd.getMonth()+1).padStart(2,'0'); const d2 = String(dd.getDate()).padStart(2,'0')
      return `${y2}-${m2}-${d2}` === today && (e.status === 'verified' || e.status === 'pending')
    })
  }, [events])

  useEffect(() => {
    if (user) {
      setEditedUser({
        username: user.username || '',
        email: user.email || '',
        studentId: user.studentId || ''
      })
      try { fetchEvents(user.id) } catch {}
      try { fetchMarketData(user.id) } catch {}
      try { fetchUserAchievements(user.id) } catch {}
      ;(async () => {
        try {
          const history = await testApi.getUserTestHistory(user.id)
          setTestsCount((history || []).length)
        } catch {}
      })()
    }
  }, [user, fetchEvents, fetchMarketData, fetchUserAchievements])

  // 实时订阅：我的数据（打卡、织梦豆、成就、测试、用户资料）
  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured) return
    const channel = supabase.channel(`profile-realtime-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.CHECKIN_EVENTS, filter: `user_id=eq.${user.id}` }, () => {
        try { fetchEvents(user.id) } catch {}
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.COINS, filter: `user_id=eq.${user.id}` }, () => {
        try { fetchMarketData(user.id) } catch {}
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.USER_ACHIEVEMENTS, filter: `user_id=eq.${user.id}` }, () => {
        try { fetchUserAchievements(user.id) } catch {}
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: TABLES.TEST_RESULTS, filter: `user_id=eq.${user.id}` }, async () => {
        try {
          const history = await testApi.getUserTestHistory(user.id)
          setTestsCount((history || []).length)
        } catch {}
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.PROFILES, filter: `id=eq.${user.id}` }, async () => {
        try {
          const profile = await userApi.getUserProfile(user.id)
          if (profile) {
            // 乐观更新个人资料（仅视觉刷新）
            setEditedUser(prev => ({
              username: profile.username || prev.username,
              email: profile.email || prev.email,
              studentId: profile.student_id || prev.studentId
            }))
          }
        } catch {}
      })

    channel.subscribe()
    return () => { try { supabase.removeChannel(channel) } catch {} }
  }, [user?.id])

  const handleSaveProfile = () => {
    // 保存用户资料逻辑（乐观本地更新；如有后端接口可在此提交）
    setEditedUser(prev => ({ ...prev }))
    toast.success('个人资料已更新！')
    setIsEditing(false)
  }

  // 个人中心快速打卡（手动）
  const quickCheckIn = async () => {
    try {
      if (!user?.id) { toast.error('请先登录'); return }
      if (submittingCheckin) return
      setSubmittingCheckin(true)
      setCheckinMsg('正在提交...')
      const tsClient = new Date().toISOString()
      const tz = new Date().getTimezoneOffset() * -1
      const fp = await computeDeviceFingerprint()
      const payload: SubmitPayload = {
        user_id: user.id,
        method: 'manual',
        ts_client: tsClient,
        tz_offset_minutes: tz,
        device_fp: fp,
      }
      const res = await submitEvent(payload)
      if (res) {
        setCheckinMsg('签到成功')
        toast.success('签到成功')
      } else {
        const err = submitError || ''
        setCheckinMsg(err.includes('离线') ? '已离线保存，将自动重试' : `签到失败：${err || '请稍后重试'}`)
        if (err.includes('离线')) toast.info('离线保存，将自动重试')
        else toast.error('签到失败，请稍后重试')
      }
      setSubmittingCheckin(false)
      fetchEvents(user.id)
    } catch {
      setSubmittingCheckin(false)
      toast.error('签到失败')
    }
  }

  const handleLogout = async () => {
    if (confirm('确定要退出登录吗？')) {
      try {
        await logout()
        toast.success('已成功退出登录')
      } catch (error: any) {
        toast.error('退出登录失败，请重试')
      }
    }
  }

  // 头像处理函数
  const handleAvatarClick = () => {
    if (!isEditing) {
      fileInputRef.current?.click()
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      return
    }

    // 验证文件大小 (最大5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB')
      return
    }

    setIsUploading(true)

    try {
      // 将图片转换为Base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64String = e.target?.result as string
        
        try {
          await updateAvatar(base64String)
          toast.success('头像更新成功！')
        } catch (error: any) {
          toast.error('头像更新失败，请重试')
        } finally {
          setIsUploading(false)
        }
      }
      
      reader.onerror = () => {
        toast.error('图片读取失败')
        setIsUploading(false)
      }
      
      reader.readAsDataURL(file)
    } catch (error: any) {
      toast.error('头像上传失败')
      setIsUploading(false)
    }
  }

  const activityItems = React.useMemo(() => {
    const ci = events.filter(e => e.status === 'verified').slice(0, 1).map(e => ({
      key: `ci_${e.id}`,
      iconBg: 'bg-green-100',
      iconText: '✓',
      title: '打卡完成',
      desc: e.method === 'gps' ? 'GPS定位打卡' : e.method === 'qr' ? '二维码打卡' : '手动打卡',
      time: new Date(e.ts_server).toLocaleDateString('zh-CN')
    }))
    const tx = transactions.slice(0, 3).map(tx => ({
      key: `tx_${tx.id}`,
      iconBg: tx.amount >= 0 ? 'bg-blue-100' : 'bg-orange-100',
      iconText: tx.amount >= 0 ? '＋' : '－',
      title: tx.amount >= 0 ? '获得织梦豆' : '花费织梦豆',
      desc: tx.description,
      time: new Date(tx.created_at).toLocaleDateString('zh-CN')
    }))
    const ach = userAchievements
      .filter(ua => ua.is_completed)
      .sort((a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime())
      .slice(0, 2)
      .map(ua => ({
        key: `ach_${ua.id}`,
        iconBg: 'bg-purple-100',
        iconText: '🏆',
        title: '解锁成就',
        desc: ua.achievement.title,
        time: new Date(ua.completed_at || new Date().toISOString()).toLocaleDateString('zh-CN')
      }))
    return [...ci, ...tx, ...ach]
  }, [events, transactions, userAchievements])

  const getAvatarContent = () => {
    if (user?.avatar_url) {
      return (
        <img 
          src={user.avatar_url} 
          alt="头像" 
          className="w-full h-full object-cover rounded-full"
        />
      )
    }
    return user?.username ? user.username.charAt(0).toUpperCase() : 'U'
  }

  // 预设头像选项
  const defaultAvatars = [
    { name: '治愈绿', gradient: 'from-green-400 to-green-600', emoji: '🌱' },
    { name: '天空蓝', gradient: 'from-blue-400 to-blue-600', emoji: '🌊' },
    { name: '夕阳橙', gradient: 'from-orange-400 to-red-500', emoji: '🌅' },
    { name: '神秘紫', gradient: 'from-purple-400 to-pink-500', emoji: '🦄' },
    { name: '温暖黄', gradient: 'from-yellow-400 to-orange-500', emoji: '☀️' },
    { name: '清新青', gradient: 'from-cyan-400 to-teal-500', emoji: '🌿' }
  ]

  const selectDefaultAvatar = async (avatar: typeof defaultAvatars[0]) => {
    if (isUploading) return
    
    setIsUploading(true)
    try {
      // 创建渐变头像SVG
      const svgContent = `
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${avatar.gradient.includes('green') ? '#4ade80' : 
                avatar.gradient.includes('blue') ? '#60a5fa' :
                avatar.gradient.includes('orange') ? '#fb923c' :
                avatar.gradient.includes('purple') ? '#a78bfa' :
                avatar.gradient.includes('yellow') ? '#fbbf24' : '#22d3ee'};stop-opacity:1" />
              <stop offset="100%" style="stop-color:${avatar.gradient.includes('green') ? '#16a34a' : 
                avatar.gradient.includes('blue') ? '#2563eb' :
                avatar.gradient.includes('orange') ? '#dc2626' :
                avatar.gradient.includes('purple') ? '#ec4899' :
                avatar.gradient.includes('yellow') ? '#f59e0b' : '#0d9488'};stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="200" height="200" fill="url(#grad)"/>
          <text x="100" y="120" font-family="Arial" font-size="80" fill="white" text-anchor="middle" dominant-baseline="middle">
            ${avatar.emoji}
          </text>
        </svg>
      `
      
      const svgBase64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgContent)))
      await updateAvatar(svgBase64)
      toast.success(`头像已更换为${avatar.name}！`)
    } catch (error: any) {
      toast.error('头像更换失败，请重试')
    } finally {
      setIsUploading(false)
    }
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">请先登录</h2>
          <p className="text-gray-500">您需要登录才能查看个人资料</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-healing p-4">
      <div className="max-w-4xl mx-auto">
        {/* 页面标题 */}
        <div className="relative mb-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">个人中心</h1>
            <p className="text-white text-opacity-90 text-lg drop-shadow-md">管理您的个人信息和查看成长记录</p>
          </div>
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
            <BackToHome />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：个人信息卡片 */}
          <div className="lg:col-span-1">
            <div className="glass rounded-2xl p-6 mb-6 hover-scale">
              <div className="text-center">
                {/* 头像区域 */}
                <div className="relative mb-4">
                  <div 
                    className={`w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto avatar-glow cursor-pointer hover:scale-105 transition-all duration-300 ${isUploading ? 'opacity-75' : ''}`}
                    onClick={handleAvatarClick}
                    title="点击更换头像"
                  >
                    {isUploading ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    ) : (
                      getAvatarContent()
                    )}
                  </div>
                  

                  
                  {user.student_verified && (
                    <>
                      <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        ✓ 已认证
                      </div>
                      <div className="mt-2">
                        <span className="inline-block px-3 py-1 rounded-full bg-green-500 text-white text-sm">{abst.treeStage === 'seedling' ? '幼苗' : abst.treeStage === 'sapling' ? '小树' : abst.treeStage === 'young' ? '中树' : '大树'}</span>
                      </div>
                    </>
                  )}
                  
                  {/* 点击头像更换 - 覆盖层 */}
                  <div 
                    className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-300 cursor-pointer"
                    onClick={handleAvatarClick}
                    title="点击更换头像"
                  >
                    <Camera className="w-6 h-6 text-white font-bold" />
                  </div>
                  
                  {/* 隐藏的文件输入 */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* 用户信息 */}
                <div className="space-y-3">
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editedUser.username}
                        onChange={(e) => setEditedUser({...editedUser, username: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent input-healing-enhanced"
                        placeholder="用户名"
                      />
                      <input
                        type="email"
                        value={editedUser.email}
                        onChange={(e) => setEditedUser({...editedUser, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent input-healing-enhanced"
                        placeholder="邮箱地址"
                      />
                      <input
                        type="text"
                        value={editedUser.studentId}
                        onChange={(e) => setEditedUser({...editedUser, studentId: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent input-healing-enhanced"
                        placeholder="学号（可选）"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-gray-800">{user.username || '用户'}</h3>
                      <p className="text-gray-600 flex items-center justify-center">
                        <Mail className="w-4 h-4 mr-2" />
                        {user.email}
                      </p>
                      {user.studentId && (
                        <p className="text-gray-600 flex items-center justify-center">
                          <GraduationCap className="w-4 h-4 mr-2" />
                          学号: {user.studentId}
                        </p>
                      )}
                      <p className="text-gray-500 text-sm flex items-center justify-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        加入时间: {user.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : new Date().toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="mt-6 space-y-2">
                  {isEditing ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveProfile}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors btn-healing-enhanced"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        保存
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors btn-healing-enhanced"
                      >
                        <X className="w-4 h-4 mr-2" />
                        取消
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors btn-healing-enhanced"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      编辑资料
                    </button>
                  )}
                  
                  <button
                    onClick={handleLogout}
                    className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors btn-healing-enhanced"
                  >
                    退出登录
                  </button>
                </div>
              </div>
            </div>

            {/* 账户状态 */}
            <div className="glass rounded-2xl p-6 hover-scale">
              <h3 className="text-lg font-bold text-gray-800 mb-4">账户状态</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between space-x-4 min-w-0">
                  <span className="text-gray-600">账户类型</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                    {user.isOffline ? '离线账户' : '在线账户'}
                  </span>
                </div>
                <div className="flex items-center justify-between space-x-4 min-w-0">
                  <span className="text-gray-600">认证状态</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                    ✓ 已认证
                  </span>
                </div>
                <div className="flex items-center justify-between space-x-4 min-w-0">
                  <span className="text-gray-600">用户ID</span>
                  <span className="text-gray-800 font-mono text-sm truncate max-w-[60%]">{user.id}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：统计数据和成就 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 统计数据 */}
            <div className="glass rounded-2xl p-6 hover-scale">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <Target className="w-6 h-6 mr-2 text-blue-500" />
                我的数据
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl stat-card hover-scale">
                  <div className="text-2xl font-bold text-green-600 mb-1">{Array.from(new Set(events.map(e => new Date(e.ts_server).toDateString()))).length}</div>
                  <div className="text-sm text-green-700 flex items-center justify-center">
                    <Clock className="w-4 h-4 mr-1" />
                    打卡天数
                  </div>
                  <div className={`mt-2 text-xs font-medium ${hasCheckedInToday ? 'text-green-600' : 'text-gray-500'}`}>{hasCheckedInToday ? '今日已签到' : '今日未签到'}</div>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl stat-card hover-scale">
                  <div className="text-2xl font-bold text-blue-600 mb-1">{coins}</div>
                  <div className="text-sm text-blue-700 flex items-center justify-center">
                    <div className="w-4 h-4 mr-1">🫘</div>
                    织梦豆
                  </div>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl stat-card hover-scale">
                  <div className="text-2xl font-bold text-purple-600 mb-1">{achievementsStats.completed_achievements}</div>
                  <div className="text-sm text-purple-700 flex items-center justify-center">
                    <Award className="w-4 h-4 mr-1" />
                    成就数
                  </div>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl stat-card hover-scale">
                  <div className="text-2xl font-bold text-orange-600 mb-1">{testsCount}</div>
                  <div className="text-sm text-orange-700 flex items-center justify-center">
                    <Target className="w-4 h-4 mr-1" />
                    测试完成
                  </div>
                </div>
              </div>

              {/* 快速打卡 */}
              <div className="mt-4 flex flex-col items-center">
                <button
                  onClick={quickCheckIn}
                  disabled={submittingCheckin || hasCheckedInToday}
                  className={`px-6 py-2 rounded-2xl font-semibold text-white ${hasCheckedInToday ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 hover-scale'}`}
                >
                  {submittingCheckin ? '正在打卡...' : hasCheckedInToday ? '今日已签到' : '立即打卡'}
                </button>
                {checkinMsg && <p className="mt-2 text-sm text-gray-600">{checkinMsg}</p>}
              </div>
            </div>

            <div className="glass rounded-2xl p-6 hover-scale">
              <h3 className="text-xl font-bold text-gray-800 mb-6">最近活动</h3>
              <div className="space-y-4">
                {activityItems.map(item => (
                  <div key={item.key} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className={`w-10 h-10 ${item.iconBg} rounded-full flex items-center justify-center mr-3`}>
                      <div className="text-gray-700">{item.iconText}</div>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{item.title}</div>
                      <div className="text-sm text-gray-500">{item.desc}</div>
                    </div>
                    <div className="text-sm text-gray-400">{item.time}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 设置选项 */}
            <div className="glass rounded-2xl p-6 hover-scale">
              <h3 className="text-xl font-bold text-gray-800 mb-6">设置</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-800">接收通知</div>
                    <div className="text-sm text-gray-500">接收打卡提醒和活动通知</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-800">深色模式</div>
                    <div className="text-sm text-gray-500">使用深色主题</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-800">离线模式</div>
                    <div className="text-sm text-gray-500">在网络不佳时使用离线功能</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked={user.isOffline} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 预设头像选择 */}
        <div className="mt-8 glass rounded-2xl p-6 hover-scale">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center justify-center">
            <Camera className="w-6 h-6 mr-2 text-blue-500" />
            选择预设头像
          </h3>
          
          <div className="flex justify-center">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {defaultAvatars.map((avatar, index) => (
                <button
                  key={index}
                  onClick={() => selectDefaultAvatar(avatar)}
                  disabled={isUploading}
                  className={`relative w-16 h-16 bg-gradient-to-br ${avatar.gradient} rounded-full flex items-center justify-center text-2xl hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl ${
                    isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-2xl'
                  }`}
                  title={avatar.name}
                >
                  {avatar.emoji}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          <p className="text-sm text-gray-500 mt-4 text-center">
            点击上方头像快速更换，或点击大头像上传自定义图片
          </p>
        </div>
      </div>
    </div>
  )
}

export default Profile