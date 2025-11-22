// 本地CORS代理配置
// 使用方法：
// 1. 安装代理工具：npm install -g local-cors-proxy
// 2. 启动代理：lcp --proxyUrl https://wbsghqffkqmwvfqjnqjg.supabase.co --port 8010
// 3. 修改应用配置，使用代理地址

const PROXY_CONFIG = {
  // 本地代理配置
  local: {
    enabled: true,
    url: 'http://localhost:8010/proxy',
    target: 'https://wbsghqffkqmwvfqjnqjg.supabase.co',
    port: 8010
  },
  
  // 替代代理服务（如果本地代理不可用）
  alternatives: [
    'https://api.allorigins.win/get?url=',
    'https://cors-anywhere.herokuapp.com/',
    'https://cors-proxy.htmldriven.com/'
  ],
  
  // 网络修复配置
  networkFixes: {
    // 超时设置
    timeout: {
      connection: 8000,      // 连接超时：8秒
      request: 15000,        // 请求超时：15秒
      response: 10000        // 响应超时：10秒
    },
    
    // 重试配置
    retry: {
      maxAttempts: 3,
      delay: 1000,           // 重试延迟：1秒
      backoff: 2             // 退避倍数：2倍
    },
    
    // 错误处理
    errorHandling: {
      ERR_CONNECTION_CLOSED: '连接被关闭，建议启用离线模式',
      ERR_ABORTED: '请求被中止，可能是网络问题',
      ERR_FAILED: '网络请求失败，检查网络连接',
      'Failed to fetch': '无法获取数据，可能是CORS或网络问题'
    }
  }
};

// 网络连接测试函数
export async function testNetworkConnection() {
  const testUrls = [
    'https://www.baidu.com', // 百度主页（更稳定）
    'https://cloudflare.com', // Cloudflare主页（更稳定）
    'https://httpbin.org/get' // 测试API
  ];
  
  for (const url of testUrls) {
    try {
      await fetchWithTimeout(url, { method: 'HEAD' }, 5000);
      return { success: true, message: '网络连接正常' };
    } catch (error) {
      console.debug(`📝 网络测试失败: ${url}`, error.message);
      
      // 特殊处理ERR_ABORTED错误
      if (error.name === 'AbortError' || error.message.includes('aborted')) {
        console.debug(`📝 请求被中止 (${url})，尝试下一个测试地址`);
        continue; // 尝试下一个URL
      }
    }
  }
  
  return { success: false, message: '网络连接失败，建议启用离线模式' };
}

// 带超时的fetch函数
export async function fetchWithTimeout(url, options = {}, timeout = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      mode: 'cors',
      cache: 'no-cache'
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('请求超时，请检查网络连接');
    }
    throw error;
  }
}

// 智能代理选择器
export function getProxyUrl(originalUrl) {
  if (PROXY_CONFIG.local.enabled) {
    // 使用本地代理
    return originalUrl.replace(PROXY_CONFIG.local.target, PROXY_CONFIG.local.url);
  }
  
  // 使用替代代理服务
  const proxyService = PROXY_CONFIG.alternatives[0];
  return `${proxyService}${encodeURIComponent(originalUrl)}`;
}

// 增强的网络错误处理
export function handleNetworkError(error) {
  const errorMessages = {
    'ERR_CONNECTION_CLOSED': '连接被远程服务器关闭，建议：\n1. 启用离线模式\n2. 使用VPN\n3. 检查防火墙设置',
    'ERR_ABORTED': '请求被中止，建议：\n1. 刷新页面重试\n2. 检查网络稳定性\n3. 使用离线模式',
    'ERR_FAILED': '网络请求失败，建议：\n1. 检查网络连接\n2. 重启路由器\n3. 使用移动热点',
    'Failed to fetch': '无法获取数据，建议：\n1. 启用CORS代理\n2. 使用VPN服务\n3. 切换到离线模式'
  };
  
  for (const [key, message] of Object.entries(errorMessages)) {
    if (error.message.includes(key)) {
      return {
        type: key,
        message: message,
        solution: '建议使用离线模式或网络代理'
      };
    }
  }
  
  return {
    type: 'UNKNOWN',
    message: `未知网络错误: ${error.message}`,
    solution: '建议启用离线模式进行注册'
  };
}

// 离线模式数据管理
export class OfflineDataManager {
  constructor() {
    this.storageKey = 'dreweave-offline-data';
    this.data = this.loadData();
  }
  
  loadData() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {
        users: [],
        registrations: [],
        settings: {
          offlineMode: false,
          autoSync: true,
          lastSync: null
        }
      };
    } catch (error) {
      return { users: [], registrations: [], settings: {} };
    }
  }
  
  saveData() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
  }
  
  addOfflineUser(userData) {
    const user = {
      id: Date.now().toString(),
      username: userData.username,
      email: userData.email || `${userData.username}@dreweave.local`,
      createdAt: new Date().toISOString(),
      studentId: userData.studentId,
      synced: false
    };
    
    this.data.users.push(user);
    this.data.registrations.push({
      id: user.id,
      timestamp: user.createdAt,
      data: userData,
      synced: false
    });
    
    this.saveData();
    return user;
  }
  
  getOfflineUsers() {
    return this.data.users.filter(user => !user.synced);
  }
  
  markAsSynced(userId) {
    const user = this.data.users.find(u => u.id === userId);
    if (user) {
      user.synced = true;
      this.saveData();
    }
  }
  
  enableOfflineMode() {
    this.data.settings.offlineMode = true;
    this.data.settings.lastSync = new Date().toISOString();
    this.saveData();
  }
  
  disableOfflineMode() {
    this.data.settings.offlineMode = false;
    this.saveData();
  }
  
  isOfflineModeEnabled() {
    return this.data.settings.offlineMode;
  }
}

// 导出配置和工具
export { PROXY_CONFIG };
