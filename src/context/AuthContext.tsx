import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string, password2: string, email?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = '/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始化时检查本地存储的 token
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        
        // 验证 token 是否有效
        fetchUserInfo(storedToken);
      } catch (e) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_refresh');
      }
    }
    setLoading(false);
  }, []);

  // 获取用户信息
  const fetchUserInfo = async (accessToken: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/user/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('auth_user', JSON.stringify(userData));
      } else {
        // Token 无效，清除
        logout();
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  };

  // 登录
  const login = async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setToken(data.access);
        setUser(data.user);
        localStorage.setItem('auth_token', data.access);
        localStorage.setItem('auth_refresh', data.refresh);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        return { success: true };
      } else {
        return { success: false, error: data.error || '登录失败' };
      }
    } catch (error) {
      return { success: false, error: '网络错误，请稍后重试' };
    }
  };

  // 注册
  const register = async (username: string, password: string, password2: string, email?: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, password2, email }),
      });

      const data = await response.json();

      if (response.ok) {
        setToken(data.access);
        setUser(data.user);
        localStorage.setItem('auth_token', data.access);
        localStorage.setItem('auth_refresh', data.refresh);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        return { success: true };
      } else {
        // 处理验证错误
        const errorMsg = Object.values(data).flat().join(', ') || '注册失败';
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      return { success: false, error: '网络错误，请稍后重试' };
    }
  };

  // 登出
  const logout = () => {
    const refreshToken = localStorage.getItem('auth_refresh');
    
    // 尝试通知后端登出
    if (token && refreshToken) {
      fetch(`${API_BASE}/auth/logout/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      }).catch(() => {});
    }
    
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_refresh');
    localStorage.removeItem('auth_user');
  };

  // 更新用户信息
  const updateUser = async (data: Partial<User>) => {
    if (!token) return { success: false, error: '未登录' };
    
    try {
      const response = await fetch(`${API_BASE}/auth/user/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (response.ok) {
        setUser(responseData);
        localStorage.setItem('auth_user', JSON.stringify(responseData));
        return { success: true };
      } else {
        return { success: false, error: responseData.error || '更新失败' };
      }
    } catch (error) {
      return { success: false, error: '网络错误' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        loading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// 获取带认证的 fetch 函数
export function useAuthFetch() {
  const { token } = useAuth();
  
  return async (url: string, options: RequestInit = {}) => {
    const headers = {
      ...options.headers,
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return fetch(url, {
      ...options,
      headers,
    });
  };
}