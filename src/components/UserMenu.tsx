import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, Settings, ChevronDown, LogIn, UserPlus } from 'lucide-react';

interface UserMenuProps {
  onOpenAuthModal: (mode: 'login' | 'register') => void;
  onGoToProfile?: () => void;
}

export default function UserMenu({ onOpenAuthModal, onGoToProfile }: UserMenuProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => onOpenAuthModal('login')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
        >
          <LogIn className="w-4 h-4" />
          <span>登录</span>
        </button>
        <button
          onClick={() => onOpenAuthModal('register')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>注册</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center">
          <User className="w-4 h-4 text-slate-950" />
        </div>
        <span className="text-xs font-bold text-white max-w-[100px] truncate">
          {user?.username}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
          {/* User Info */}
          <div className="p-3 bg-slate-950 border-b border-slate-700">
            <p className="text-xs font-bold text-white">{user?.username}</p>
            {user?.email && (
              <p className="text-xs text-slate-400">{user?.email}</p>
            )}
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <button
              onClick={() => {
                setShowDropdown(false);
                onGoToProfile && onGoToProfile();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <Settings className="w-4 h-4" />
              <span>账户设置</span>
            </button>
            <button
              onClick={() => {
                setShowDropdown(false);
                logout();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              <span>退出登录</span>
            </button>
          </div>
        </div>
      )}

      {/* 点击外部关闭下拉菜单 */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}