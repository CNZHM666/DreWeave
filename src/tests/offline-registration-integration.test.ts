// 离线注册系统集成测试
// 这个文件用于验证离线注册系统是否正确集成到主应用中

import { describe, test, expect, vi } from 'vitest'
import { OfflineRegistrationSystem } from '../utils/offline-registration'
import { useAuthStore } from '../stores/authStore-offline'

describe('离线注册系统集成测试', () => {
  let offlineSystem: OfflineRegistrationSystem
  let authStore: any

  beforeEach(() => {
    // 清除本地存储
    localStorage.clear()
    
    // 初始化系统
    offlineSystem = OfflineRegistrationSystem.getInstance()
    
    // 获取认证存储
    authStore = useAuthStore.getState() as any
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('离线注册功能', () => {
    test('应该能够成功注册离线用户', async () => {
      const result = await offlineSystem.registerOffline(
        'testuser',
        'TestPassword123',
        'TestPassword123',
        '1234567890'
      )

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user.username).toBe('testuser')
      expect(result.isOffline).toBe(true)
    })

    test('应该验证密码强度', async () => {
      const result = await offlineSystem.registerOffline(
        'testuser',
        'weak',
        'weak',
        '1234567890'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('密码长度')
    })

    test('应该验证密码一致性', async () => {
      const result = await offlineSystem.registerOffline(
        'testuser',
        'TestPassword123',
        'DifferentPassword123',
        '1234567890'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('不一致')
    })

    test('应该防止重复用户名', async () => {
      // 第一次注册
      await offlineSystem.registerOffline(
        'testuser',
        'TestPassword123',
        'TestPassword123'
      )

      // 第二次注册相同用户名
      const result = await offlineSystem.registerOffline(
        'testuser',
        'TestPassword123',
        'TestPassword123'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('已存在')
    })
  })

  describe('离线登录功能', () => {
    beforeEach(async () => {
      // 先注册一个用户用于登录测试
      await offlineSystem.registerOffline(
        'testuser',
        'TestPassword123',
        'TestPassword123',
        '1234567890'
      )
    })

    test('应该能够成功登录离线用户', async () => {
      const result = await offlineSystem.loginOffline('testuser', 'TestPassword123')

      expect(result.success).toBe(true)
      expect(result.user.username).toBe('testuser')
      expect(result.isOffline).toBe(true)
    })

    test('应该拒绝错误的密码', async () => {
      const result = await offlineSystem.loginOffline('testuser', 'WrongPassword123')

      expect(result.success).toBe(false)
      expect(result.error).toContain('错误')
    })

    test('应该拒绝不存在的用户', async () => {
      const result = await offlineSystem.loginOffline('nonexistent', 'TestPassword123')

      expect(result.success).toBe(false)
      expect(result.error).toContain('错误')
    })
  })

  describe('认证存储集成', () => {
    test('应该能够通过认证存储进行离线注册', async () => {
      // 模拟网络离线状态
      vi.spyOn(authStore, 'checkNetworkStatus').mockResolvedValue('offline')
      
      await authStore.register(
        'testuser',
        'TestPassword123',
        'TestPassword123',
        '1234567890'
      )

      expect(authStore.isAuthenticated).toBe(true)
      expect(authStore.isOfflineMode).toBe(true)
      expect(authStore.user?.username).toBe('testuser')
    })

    test('应该能够通过认证存储进行离线登录', async () => {
      // 先注册一个用户
      await offlineSystem.registerOffline(
        'testuser',
        'TestPassword123',
        'TestPassword123'
      )

      // 模拟网络离线状态
      vi.spyOn(authStore, 'checkNetworkStatus').mockResolvedValue('offline')
      
      // 使用用户名作为邮箱（离线模式的约定）
      await authStore.login('testuser@dreweave.local', 'TestPassword123')

      expect(authStore.isAuthenticated).toBe(true)
      expect(authStore.isOfflineMode).toBe(true)
      expect(authStore.user?.username).toBe('testuser')
    })

    test('应该能够切换离线模式', () => {
      authStore.switchToOfflineMode()

      expect(authStore.isOfflineMode).toBe(true)
      expect(authStore.networkStatus).toBe('offline')
    })
  })

  describe('数据持久化', () => {
    test('用户数据应该持久化到本地存储', async () => {
      await offlineSystem.registerOffline(
        'testuser',
        'TestPassword123',
        'TestPassword123'
      )

      const users = (offlineSystem as any).getAllUsers?.() || []
      expect(users.length).toBe(1)
      expect(users[0].username).toBe('testuser')

      // 验证本地存储
      const storedData = localStorage.getItem('dreweave_offline_users')
      expect(storedData).toBeTruthy()
      
      const parsedData = JSON.parse(storedData!)
      expect(parsedData.length).toBe(1)
      expect(parsedData[0].username).toBe('testuser')
    })

    test('会话数据应该持久化到本地存储', async () => {
      await offlineSystem.registerOffline(
        'testuser',
        'TestPassword123',
        'TestPassword123'
      )

      const session = (offlineSystem as any).getCurrentSession?.()
      expect(session).toBeDefined()
      expect(session.user.username).toBe('testuser')

      // 验证本地存储
      const storedSession = localStorage.getItem('dreweave_offline_session')
      expect(storedSession).toBeTruthy()
    })
  })

  describe('错误处理', () => {
    test('应该处理本地存储错误', async () => {
      // 模拟本地存储错误
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error')
      })

      const result = await offlineSystem.registerOffline(
        'testuser',
        'TestPassword123',
        'TestPassword123'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('失败')
    })

    test('应该处理网络状态检查错误', async () => {
      // 模拟网络状态检查错误
      vi.spyOn(authStore, 'checkNetworkStatus').mockRejectedValue(new Error('Network error'))
      
      // 应该降级到离线模式
      await authStore.register(
        'testuser',
        'TestPassword123',
        'TestPassword123'
      )

      expect(authStore.isAuthenticated).toBe(true)
      expect(authStore.isOfflineMode).toBe(true)
    })
  })
})

// 导出测试用例供其他测试文件使用
export const offlineRegistrationTestCases = {
  validRegistration: {
    username: 'testuser',
    password: 'TestPassword123',
    confirmPassword: 'TestPassword123',
    studentId: '1234567890'
  },
  
  weakPassword: {
    username: 'testuser',
    password: 'weak',
    confirmPassword: 'weak',
    studentId: '1234567890'
  },
  
  passwordMismatch: {
    username: 'testuser',
    password: 'TestPassword123',
    confirmPassword: 'DifferentPassword123',
    studentId: '1234567890'
  }
}
