import React, { useState, useEffect } from 'react';
import { User, Mail, Edit2, Check, Lock, Key, AlertCircle, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface UserProfileData {
  user: {
    id: number;
    username: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  };
  profiles: any[];
}

export default function UserSettings() {
  const { user, token } = useAuth();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // 基本信息编辑表单
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
  });
  
  // 密码修改表单
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    new_password2: '',
  });

  // 获取用户信息
  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/auth/user/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
        setEditForm({
          first_name: data.user.first_name || '',
          last_name: data.user.last_name || '',
          email: data.user.email || '',
        });
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token]);

  // 保存基本信息
  const handleSaveProfile = async () => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      
      const response = await fetch('/api/auth/user/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });
      
      if (response.ok) {
        await fetchUserProfile();
        setIsEditing(false);
        setSuccessMessage('个人信息更新成功！');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const data = await response.json();
        setErrorMessage(data.error || '更新失败');
      }
    } catch (error) {
      setErrorMessage('网络错误，请稍后重试');
    }
  };

  // 修改密码
  const handleChangePassword = async () => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      
      const response = await fetch('/api/auth/change-password/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(passwordForm),
      });
      
      if (response.ok) {
        setIsChangingPassword(false);
        setPasswordForm({ old_password: '', new_password: '', new_password2: '' });
        setSuccessMessage('密码修改成功！');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const data = await response.json();
        setErrorMessage(data.error || '密码修改失败');
      }
    } catch (error) {
      setErrorMessage('网络错误，请稍后重试');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h2 className="text-2xl font-bold text-slate-900 mb-8">个人中心</h2>
      
      {/* 消息提示 */}
      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-700">
          <Check className="w-5 h-5" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700">
          <AlertCircle className="w-5 h-5" />
          <span>{errorMessage}</span>
        </div>
      )}
      
      <div className="space-y-6">
        {/* 基本信息卡片 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5" />
              基本信息
            </h3>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition"
              >
                <Edit2 className="w-4 h-4" />
                编辑
              </button>
            )}
          </div>
          
          <div className="p-6">
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">用户名</label>
                    <div className="px-4 py-2.5 bg-slate-50 text-slate-700 rounded-lg border border-slate-200 font-medium">
                      {profileData?.user.username}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">邮箱</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white text-slate-900 rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">姓</label>
                    <input
                      type="text"
                      value={editForm.last_name}
                      onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white text-slate-900 rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">名</label>
                    <input
                      type="text"
                      value={editForm.first_name}
                      onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white text-slate-900 rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-600 transition"
                  >
                    <Save className="w-4 h-4" />
                    保存
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm({
                        first_name: profileData?.user.first_name || '',
                        last_name: profileData?.user.last_name || '',
                        email: profileData?.user.email || '',
                      });
                    }}
                    className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">用户名</label>
                    <div className="text-slate-900 font-medium">{profileData?.user.username}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">邮箱</label>
                    <div className="flex items-center gap-2 text-slate-900">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span>{profileData?.user.email || '未设置'}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">姓名</label>
                    <div className="text-slate-900">
                      {profileData?.user.last_name || profileData?.user.first_name 
                        ? `${profileData?.user.last_name || ''}${profileData?.user.first_name || ''}`
                        : '未设置'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* 修改密码卡片 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              安全设置
            </h3>
            {!isChangingPassword && (
              <button
                onClick={() => setIsChangingPassword(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition"
              >
                <Key className="w-4 h-4" />
                修改密码
              </button>
            )}
          </div>
          
          <div className="p-6">
            {isChangingPassword ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">当前密码</label>
                  <input
                    type="password"
                    value={passwordForm.old_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white text-slate-900 rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition"
                    placeholder="请输入当前密码"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">新密码</label>
                  <input
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white text-slate-900 rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition"
                    placeholder="请输入新密码"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">确认新密码</label>
                  <input
                    type="password"
                    value={passwordForm.new_password2}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password2: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white text-slate-900 rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition"
                    placeholder="请再次输入新密码"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleChangePassword}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
                  >
                    <Lock className="w-4 h-4" />
                    修改密码
                  </button>
                  <button
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordForm({ old_password: '', new_password: '', new_password2: '' });
                    }}
                    className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-sm">
                点击右上角按钮可以修改您的登录密码
              </div>
            )}
          </div>
        </div>
        
        {/* 平台配置 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">平台配置</h3>
          </div>
          
          <div className="p-6">
            {profileData?.profiles.length > 0 ? (
              <div className="space-y-4">
                {profileData.profiles.map((profile) => (
                  <div key={profile.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <div className="font-bold text-slate-900">{profile.platform}</div>
                      <div className="text-sm text-slate-600">ID: {profile.handle}</div>
                      {profile.rating && (
                        <div className="text-xs text-slate-500">Rating: {profile.rating}</div>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      最后更新: {new Date(profile.last_updated).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                暂无平台配置，后续可以添加您的竞赛平台账号
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
