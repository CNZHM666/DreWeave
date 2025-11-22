// 完全离线注册系统 - 绕过所有网络问题
// 完全离线注册系统 - 绕过所有网络问题

interface OfflineUser {
  id: string;
  username: string;
  email: string;
  password?: string;
  studentId: string | null;
  student_verified: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  authToken: string;
  isOffline: boolean;
  offlineRegistered: boolean;
}

interface OfflineSession {
  userId: string;
  username: string;
  email: string;
  authToken: string;
  loginTime: string;
  isOffline: boolean;
  sessionId: string;
}

export class OfflineRegistrationSystem {
  private static instance: OfflineRegistrationSystem;
  private storageKey = 'dreweave-offline-users';
  private sessionKey = 'dreweave-current-session';
  private usersKey = 'dreweave-users-data';
  
  // 私有构造函数 - 单例模式
  private constructor() {
    console.log('🏠 离线注册系统已初始化');
  }
  
  // 获取单例实例
  public static getInstance(): OfflineRegistrationSystem {
    if (!OfflineRegistrationSystem.instance) {
      OfflineRegistrationSystem.instance = new OfflineRegistrationSystem();
    }
    return OfflineRegistrationSystem.instance;
  }
  
  // 生成唯一用户ID
  private generateUserId(): string {
    return `offline_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // 生成模拟的认证令牌
  private generateAuthToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }
  
  // 创建哈希密码（简单的模拟）
  private hashPassword(password: string): string {
    // 简单的哈希函数 - 实际应用中应该使用更安全的算法
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36);
  }
  
  // 验证密码强度
  private validatePassword(password: string): { isValid: boolean; message: string } {
    if (password.length < 6) {
      return { isValid: false, message: '密码长度至少为6位' };
    }
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    let strength = 0;
    if (hasUpperCase) strength++;
    if (hasLowerCase) strength++;
    if (hasNumbers) strength++;
    if (hasSpecialChar) strength++;
    
    if (strength < 2) {
      return { isValid: false, message: '密码必须包含大小写字母、数字或特殊字符中的至少两种' };
    }
    
    return { isValid: true, message: '密码验证通过' };
  }
  
  // 验证用户名
  private validateUsername(username: string): { isValid: boolean; message: string } {
    if (!username || username.length < 3) {
      return { isValid: false, message: '用户名长度至少为3个字符' };
    }
    
    if (username.length > 20) {
      return { isValid: false, message: '用户名长度不能超过20个字符' };
    }
    
    if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
      return { isValid: false, message: '用户名只能包含字母、数字、下划线和中文' };
    }
    
    return { isValid: true, message: '用户名验证通过' };
  }
  
  // 检查用户名是否已存在
  private isUsernameExists(username: string): boolean {
    try {
      const users = this.getAllUsers();
      return users.some(user => user.username === username);
    } catch (error: any) {
      console.debug('🏠 检查用户名失败:', error);
      return false; // 如果检查失败，允许注册
    }
  }
  
  // 获取所有用户
  public getAllUsers(): OfflineUser[] {
    try {
      const usersData = localStorage.getItem(this.usersKey);
      return usersData ? JSON.parse(usersData) : [];
    } catch (error: any) {
      console.debug('🏠 获取用户列表失败:', error);
      return [];
    }
  }
  
  // 保存用户到本地存储
  private saveUser(user: OfflineUser): void {
    try {
      const users = this.getAllUsers();
      users.push(user);
      localStorage.setItem(this.usersKey, JSON.stringify(users));
      console.log('🏠 用户已保存到本地存储:', user.username);
    } catch (error: any) {
      console.debug('🏠 保存用户失败:', error);
      throw new Error('保存用户数据失败');
    }
  }
  
  // 创建用户会话
  private createSession(user: OfflineUser): void {
    try {
      const session = {
        userId: user.id,
        username: user.username,
        email: user.email,
        authToken: user.authToken,
        loginTime: new Date().toISOString(),
        isOffline: true,
        sessionId: `session_${Date.now()}`
      };
      
      localStorage.setItem(this.sessionKey, JSON.stringify(session));
      console.log('🏠 会话已创建:', user.username);
    } catch (error: any) {
      console.debug('🏠 创建会话失败:', error);
    }
  }
  
  // 完全离线注册方法
  public async registerOffline(username: string, password: string, confirmPassword: string, studentId?: string): Promise<{
    success: boolean;
    user?: Partial<OfflineUser>;
    error?: string;
    isOffline: boolean;
  }> {
    console.log('🏠 开始离线注册流程:', { username, passwordLength: password?.length, confirmPasswordLength: confirmPassword?.length, studentId });
    
    try {
      // 1. 验证输入参数
      if (!username || !password || !confirmPassword) {
        return { success: false, error: '请填写所有必填字段', isOffline: true };
      }
      
      // 2. 验证密码匹配
      if (password !== confirmPassword) {
        return { success: false, error: '两次输入的密码不一致', isOffline: true };
      }
      
      // 3. 验证密码强度
      const passwordValidation = this.validatePassword(password);
      if (!passwordValidation.isValid) {
        return { success: false, error: passwordValidation.message, isOffline: true };
      }
      
      // 4. 验证用户名
      const usernameValidation = this.validateUsername(username);
      if (!usernameValidation.isValid) {
        return { success: false, error: usernameValidation.message, isOffline: true };
      }
      
      // 5. 检查用户名是否已存在
      if (this.isUsernameExists(username)) {
        return { success: false, error: '用户名已存在，请选择其他用户名', isOffline: true };
      }
      
      // 6. 创建用户对象
      const userId = this.generateUserId();
      const authToken = this.generateAuthToken();
      const passwordHash = this.hashPassword(password);
      
      const user = {
        id: userId,
        username: username,
        email: `${username}@dreweave.offline`, // 离线邮箱格式
        password: passwordHash, // 注意：实际应用中应该使用更安全的哈希
        studentId: studentId || null,
        student_verified: false,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        authToken: authToken,
        isOffline: true,
        offlineRegistered: true
      };
      
      // 7. 保存用户到本地存储
      this.saveUser(user);
      
      // 8. 创建用户会话
      this.createSession(user);
      
      console.log('🏠 离线注册成功:', username);
      
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          student_verified: user.student_verified,
          created_at: user.created_at,
          isOffline: true,
          offlineRegistered: true
        },
        isOffline: true
      };
      
    } catch (error: any) {
      console.debug('🏠 离线注册失败:', error);
      return {
        success: false,
        error: error.message || '离线注册失败，请重试',
        isOffline: true
      };
    }
  }
  
  // 完全离线登录方法
  public async loginOffline(username: string, password: string): Promise<{
    success: boolean;
    user?: any;
    error?: string;
    isOffline: boolean;
  }> {
    console.log('🏠 开始离线登录流程:', username);
    
    try {
      // 1. 验证输入参数
      if (!username || !password) {
        return { success: false, error: '请填写用户名和密码', isOffline: true };
      }
      
      // 2. 获取所有用户
      const users = this.getAllUsers();
      
      // 3. 查找用户
      const user = users.find(u => u.username === username);
      if (!user) {
        return { success: false, error: '用户名或密码错误', isOffline: true };
      }
      
      // 4. 验证密码
      const passwordHash = this.hashPassword(password);
      if (user.password !== passwordHash) {
        return { success: false, error: '用户名或密码错误', isOffline: true };
      }
      
      // 5. 创建会话
      this.createSession(user);
      
      console.log('🏠 离线登录成功:', username);
      
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          student_verified: user.student_verified,
          created_at: user.created_at,
          isOffline: true
        },
        isOffline: true
      };
      
    } catch (error: any) {
      console.debug('🏠 离线登录失败:', error);
      return {
        success: false,
        error: error.message || '离线登录失败，请重试',
        isOffline: true
      };
    }
  }
  
  // 获取当前登录用户
  public getCurrentUser(): Partial<OfflineUser> | null {
    try {
      const sessionData = localStorage.getItem(this.sessionKey);
      if (!sessionData) return null;
      
      const session = JSON.parse(sessionData);
      
      // 获取用户详细信息
      const users = this.getAllUsers();
      const user = users.find(u => u.id === session.userId);
      
      return user ? {
        id: user.id,
        email: user.email,
        username: user.username,
        student_verified: user.student_verified,
        created_at: user.created_at,
        isOffline: true
      } : null;
      
    } catch (error: any) {
      console.debug('🏠 获取当前用户失败:', error);
      return null;
    }
  }
  
  public getCurrentSession(): OfflineSession | null {
    try {
      const sessionData = localStorage.getItem(this.sessionKey)
      return sessionData ? JSON.parse(sessionData) : null
    } catch (error: any) {
      console.debug('🏠 获取会话失败:', error)
      return null
    }
  }
  
  // 退出登录
  public logout(): void {
    try {
      localStorage.removeItem(this.sessionKey);
      console.log('🏠 用户已退出登录');
    } catch (error: any) {
      console.debug('🏠 退出登录失败:', error);
    }
  }

  // 离线退出登录
  public logoutOffline(): void {
    try {
      localStorage.removeItem(this.sessionKey);
      console.log('🏠 用户已离线退出登录');
    } catch (error: any) {
      console.debug('🏠 离线退出登录失败:', error);
    }
  }
  
  // 检查是否已登录
  public isAuthenticated(): boolean {
    try {
      const sessionData = localStorage.getItem(this.sessionKey);
      return !!sessionData;
    } catch (error: any) {
      console.debug('🏠 检查登录状态失败:', error);
      return false;
    }
  }
  
  // 获取离线统计信息
  public getOfflineStats(): {
    totalUsers: number;
    currentSession: Partial<OfflineUser> | null;
    isAuthenticated: boolean;
  } {
    try {
      const users = this.getAllUsers();
      const currentUser = this.getCurrentUser();
      const isAuthenticated = this.isAuthenticated();
      
      return {
        totalUsers: users.length,
        currentSession: currentUser,
        isAuthenticated: isAuthenticated
      };
    } catch (error: any) {
      console.debug('🏠 获取离线统计失败:', error);
      return {
        totalUsers: 0,
        currentSession: null,
        isAuthenticated: false
      };
    }
  }
  
  // 清除所有离线数据（用于测试）
  public clearAllData(): void {
    try {
      localStorage.removeItem(this.usersKey);
      localStorage.removeItem(this.sessionKey);
      console.log('🏠 所有离线数据已清除');
    } catch (error: any) {
      console.debug('🏠 清除数据失败:', error);
    }
  }
}

// 导出单例实例
export const offlineRegistration = OfflineRegistrationSystem.getInstance();

// 兼容Supabase响应格式的包装器
export const createOfflineAuthResponse = (result: { success: boolean; user?: Partial<OfflineUser>; error?: string }) => {
  return {
    data: result.success ? {
      user: result.user ? {
        id: result.user.id,
        email: result.user.email,
        created_at: result.user.created_at,
        user_metadata: {
          username: result.user.username,
          student_id: result.user.studentId
        }
      } : null,
      session: result.success ? {
        access_token: result.user?.authToken || 'offline_token',
        refresh_token: 'offline_refresh_token',
        expires_in: 3600,
        expires_at: Date.now() + 3600 * 1000,
        token_type: 'bearer',
        user: result.user
      } : null
    } : null,
    error: result.error ? {
      message: result.error,
      status: 400,
      name: 'AuthError'
    } : null
  };
};

// 模拟Supabase客户端的离线版本
export const offlineSupabaseClient = {
  auth: {
    signUp: async (credentials: { email?: string; password?: string; options?: { data?: { username?: string; student_id?: string; }; }; }) => {
      console.log('🏠 离线注册模拟:', credentials);
      
      const { email, password, options } = credentials;
      const username = options?.data?.username || email?.split('@')[0] || 'user';
      const studentId = options?.data?.student_id;
      
      // 由于这是离线模式，我们需要confirmPassword
      // 在实际使用中，这个值应该从前端传入
      const result = await offlineRegistration.registerOffline(
        username,
        password,
        password, // confirmPassword
        studentId
      );
      
      return createOfflineAuthResponse(result);
    },
    
    signInWithPassword: async (credentials: { email?: string; password?: string; }) => {
      console.log('🏠 离线登录模拟:', credentials);
      
      const { email, password } = credentials;
      const username = email?.split('@')[0] || email;
      
      const result = await offlineRegistration.loginOffline(username, password);
      
      return createOfflineAuthResponse(result);
    },
    
    signOut: async () => {
      console.log('🏠 离线退出登录');
      offlineRegistration.logout();
      return { data: null, error: null };
    },
    
    getUser: async () => {
      const user = offlineRegistration.getCurrentUser();
      return {
        data: { user: user },
        error: null
      };
    },
    
    getSession: async () => {
      const user = offlineRegistration.getCurrentUser();
      return {
        data: { 
          session: user ? {
            access_token: 'offline_token',
            refresh_token: 'offline_refresh_token',
            expires_in: 3600,
            expires_at: Date.now() + 3600 * 1000,
            token_type: 'bearer',
            user: user
          } : null 
        },
        error: null
      };
    }
  },
  
  from: (table: string) => ({
    select: () => ({
      eq: () => ({
        single: async () => {
          console.log(`🏠 离线查询模拟: ${table}`);
          
          if (table === 'users') {
            const users = offlineRegistration.getOfflineStats();
            return {
              data: users.currentSession,
              error: null
            };
          }
          
          return { data: null, error: null };
        }
      })
    }),
    upsert: () => ({
      select: () => ({
        single: async () => {
          console.log(`🏠 离线插入模拟: ${table}`);
          return { data: null, error: null };
        }
      })
    })
  })
};

export default offlineRegistration;
