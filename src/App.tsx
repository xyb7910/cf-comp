import React, { useState, useEffect, useRef } from "react";
import { CFUser, CFRatingChange, CFSubmission, CFProblem, SavedProblem } from "./types";
import UserSearch from "./components/UserSearch";
import UserProfile from "./components/UserProfile";
import UserSettings from "./components/UserSettings";
import ProblemsView from "./components/ProblemsView";
import StatsAnalysis from "./components/StatsAnalysis";
import SavedProblems from "./components/SavedProblems";
import TrainingChallenge from "./components/TrainingChallenge";
import CodePlayground from "./components/CodePlayground";
import CustomProblems from "./components/CustomProblems";
import AlgorithmTemplates from "./components/AlgorithmTemplates";
import AuthModal from "./components/AuthModal";
import UserMenu from "./components/UserMenu";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LayoutDashboard, BookOpen, BookMarked, Target, Sparkles, Terminal, Flame, Info, Star, User as UserIcon, ChevronDown, ChevronUp, Code2, CheckCircle } from "lucide-react";

export default function AppWithAuth() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

function App() {
  const { isAuthenticated, loading } = useAuth();
  // Ref for training dropdown
  const trainingDropdownRef = useRef<HTMLDivElement>(null);
  
  // Global States
  const [ojRegion, setOjRegion] = useState<"international" | "domestic">("international");
  const [activePlatform, setActivePlatform] = useState<"codeforces" | "atcoder" | "luogu" | "nowcoder" | "custom">("codeforces");
  const [handles, setHandles] = useState<Record<string, string>>({
    codeforces: "jiangly",
    atcoder: "chokudai",
    luogu: "kkksc03",
    nowcoder: "NowcoderUser",
    custom: "custom",
  });
  
  const [activeHandle, setActiveHandle] = useState("jiangly");
  const [user, setUser] = useState<CFUser | null>(null);
  const [ratingHistory, setRatingHistory] = useState<CFRatingChange[]>([]);
  const [submissions, setSubmissions] = useState<CFSubmission[]>([]);
  
  const [problems, setProblems] = useState<CFProblem[]>([]);
  const [customProblems, setCustomProblems] = useState<any[]>([]); // 自定义题目
  const [loadingUser, setLoadingUser] = useState(false);
  const [loadingProblems, setLoadingProblems] = useState(false);
  
  const [userError, setUserError] = useState<string | null>(null);
  const [problemsError, setProblemsError] = useState<string | null>(null);

  // Tab state: "dashboard", "problems", "notebook", "challenge", "sandbox", "custom", "profile", "templates"
  const [activeTab, setActiveTab] = useState<"dashboard" | "problems" | "notebook" | "challenge" | "sandbox" | "custom" | "profile" | "templates">(() => {
    const saved = localStorage.getItem("cf_active_tab");
    if (saved) {
      try {
        return saved as any;
      } catch (e) {
        // ignore
      }
    }
    return "dashboard";
  });
  
  // 训练中心下拉菜单状态
  const [isTrainingDropdownOpen, setIsTrainingDropdownOpen] = useState(false);
  
  // Click outside to close training dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        trainingDropdownRef.current && 
        !trainingDropdownRef.current.contains(event.target as Node)
      ) {
        setIsTrainingDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // 保存 activeTab 到 localStorage
  useEffect(() => {
    localStorage.setItem("cf_active_tab", activeTab);
  }, [activeTab]);
  
  // 用户配置的平台账号
  const [userPlatformProfiles, setUserPlatformProfiles] = useState<Record<string, { handle: string; rating?: number }>>({});
  const [hasDefaultProfile, setHasDefaultProfile] = useState(false);

  // 未登录时，强制只显示仪表盘（等待认证状态加载完成后执行）
  useEffect(() => {
    if (!loading && !isAuthenticated && activeTab !== "dashboard") {
      setActiveTab("dashboard");
    }
  }, [isAuthenticated, activeTab, loading]);

  // 用户登录后，获取用户配置的平台账号
  useEffect(() => {
    const fetchUserProfiles = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      try {
        const response = await fetch('/api/users/profiles/default/', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const profiles = await response.json();
          setUserPlatformProfiles(profiles);
          
          // 如果用户配置了平台账号，设置为默认搜索目标
          if (Object.keys(profiles).length > 0) {
            setHasDefaultProfile(true);
            // 优先选择有rating的平台，或者默认选择第一个配置的平台
            const platforms = Object.keys(profiles);
            let preferredPlatform = platforms[0];
            for (const platform of platforms) {
              if (profiles[platform].rating) {
                preferredPlatform = platform;
                break;
              }
            }
            
            setActivePlatform(preferredPlatform as any);
            setHandles(prev => ({
              ...prev,
              [preferredPlatform]: profiles[preferredPlatform].handle
            }));
            
            // 如果当前没有选中的handle，自动加载用户的账号信息
            if (!activeHandle || activeHandle === "jiangly") {
              setActiveHandle(profiles[preferredPlatform].handle);
              fetchUserProfileData(profiles[preferredPlatform].handle, preferredPlatform);
            }
          }
        }
      } catch (error) {
        console.error('获取用户平台配置失败:', error);
      }
    };

    if (isAuthenticated && !loading) {
      fetchUserProfiles();
    } else if (!isAuthenticated) {
      setUserPlatformProfiles({});
      setHasDefaultProfile(false);
    }
  }, [isAuthenticated, loading]);

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");
  
  // About modal state
  const [aboutModalOpen, setAboutModalOpen] = useState(false);

  // Local notebooks stored in local localStorage
  const [savedProblems, setSavedProblems] = useState<SavedProblem[]>([]);

  // Selected problem callback for ProblemsView AI workspace integration
  const [problemsViewSelection, setProblemsViewSelection] = useState<CFProblem | null>(null);

  // 1. Initial Load of Saved problem lists from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("cf_notebook_problems");
    if (saved) {
      try {
        setSavedProblems(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
    
    // 加载自定义题目
    const custom = localStorage.getItem("cf_custom_problems");
    if (custom) {
      try {
        setCustomProblems(JSON.parse(custom));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Save changes to localStorage helper
  const handleSaveProblemLocal = (prob: SavedProblem) => {
    let updated: SavedProblem[];
    
    if (prob.savedAt === 0) { // removal flag
      updated = savedProblems.filter(p => p.id !== prob.id);
    } else {
      const idx = savedProblems.findIndex(p => p.id === prob.id);
      if (idx !== -1) {
        updated = [...savedProblems];
        updated[idx] = prob;
      } else {
        updated = [prob, ...savedProblems];
      }
    }

    setSavedProblems(updated);
    localStorage.setItem("cf_notebook_problems", JSON.stringify(updated));
  };

  // 2. Fetch User platform profile parameters
  const fetchUserProfileData = async (handle: string, platform: string = activePlatform) => {
    if (!handle.trim()) return;
    setLoadingUser(true);
    setUserError(null);

    try {
      // 如果是自定义题目平台，不需要加载用户信息
      if (platform === "custom") {
        setLoadingUser(false);
        return;
      }
      
      console.log(`[App] Fetching user profile for: ${handle} on ${platform}`);
      
      // User general details
      const userRes = await fetch(`/api/user-info?platform=${platform}&handle=${encodeURIComponent(handle)}`);
      const userData = await userRes.json();
      
      console.log(`[App] User info response:`, userData);
      
      if (!userRes.ok) {
        throw new Error(userData.error || "获取用户信息失败");
      }
      
      if (userData.status === "OK" && Array.isArray(userData.result) && userData.result.length > 0) {
        const userResult = userData.result[0];
        // 确保必要字段存在，给默认值
        const safeUser = {
          ...userResult,
          rating: userResult.rating || 0,
          maxRating: userResult.maxRating || 0,
          rank: userResult.rank || "",
          maxRank: userResult.maxRank || "",
          handle: userResult.handle || handle,
          registrationTimeSeconds: userResult.registrationTimeSeconds || Math.floor(Date.now() / 1000) - 86400 * 365,
          lastOnlineTimeSeconds: userResult.lastOnlineTimeSeconds || Math.floor(Date.now() / 1000),
          contribution: userResult.contribution || 0,
          friendOfCount: userResult.friendOfCount || 0,
          avatar: userResult.avatar || "https://img.atcoder.jp/assets/icon/avatar.png",
          titlePhoto: userResult.titlePhoto || "https://img.atcoder.jp/assets/icon/avatar.png",
          organization: userResult.organization || "Competitive Programmer"
        };
        
        setUser(safeUser);
        setActiveHandle(safeUser.handle);
        setHandles(prev => ({ ...prev, [platform]: safeUser.handle }));
        console.log(`[App] User profile set successfully`);
      } else {
        throw new Error("用户句柄未找到或数据格式错误");
      }

      // Rating Change timeline proxy
      try {
        const ratingRes = await fetch(`/api/user-rating?platform=${platform}&handle=${encodeURIComponent(handle)}`);
        const ratingData = await ratingRes.json();
        if (ratingRes.ok && ratingData.status === "OK" && Array.isArray(ratingData.result)) {
          setRatingHistory(ratingData.result || []);
        } else {
          setRatingHistory([]);
        }
      } catch (err) {
        console.warn(`[App] Failed to fetch rating history:`, err);
        setRatingHistory([]);
      }

      // Status / submissions proxy
      try {
        const statusRes = await fetch(`/api/user-status?platform=${platform}&handle=${encodeURIComponent(handle)}`);
        const statusData = await statusRes.json();
        if (statusRes.ok && statusData.status === "OK" && Array.isArray(statusData.result)) {
          setSubmissions(statusData.result || []);
        } else {
          setSubmissions([]);
        }
      } catch (err) {
        console.warn(`[App] Failed to fetch submissions:`, err);
        setSubmissions([]);
      }

    } catch (err: any) {
      console.error(`[App] Error fetching user profile:`, err);
      setUserError(err.message || "无法检索该用户句柄。请检查拼写！");
    } finally {
      setLoadingUser(false);
    }
  };

  // 3. Fetch active problemset problems
  const fetchActiveProblemset = async (platform: string = activePlatform) => {
    if (platform === "custom") {
      // 自定义题目不需要API加载
      setLoadingProblems(false);
      return;
    }
    
    setLoadingProblems(true);
    setProblemsError(null);
    try {
      const res = await fetch(`/api/problemset-problems?platform=${platform}`);
      const data = await res.json();
      if (res.ok && data.result?.problems) {
        setProblems(data.result.problems);
      } else {
        throw new Error(data.error || "获取题库失败");
      }
    } catch (err: any) {
      console.error(err);
      setProblemsError(err.message || "题库连接被拒");
    } finally {
      setLoadingProblems(false);
    }
  };
  
  // 将自定义题目转换为CFProblem格式
  const convertCustomToCFProblem = (customProblem: any): CFProblem => {
    // 根据难度映射rating
    let rating: number | undefined;
    if (customProblem.rating) {
      rating = customProblem.rating;
    } else {
      switch (customProblem.difficulty) {
        case "入门": rating = 800; break;
        case "基础": rating = 1200; break;
        case "进阶": rating = 1600; break;
        case "困难": rating = 2000; break;
        default: rating = 1200;
      }
    }
    
    // 将中文标签转换回英文标签，保持兼容性
    const tagMap: Record<string, string> = {
      "动态规划": "dp",
      "贪心": "greedy",
      "搜索": "dfs and similar",
      "图论": "graphs",
      "数据结构": "data structures",
      "字符串": "strings",
      "数学": "math",
      "计算几何": "geometry",
      "模拟": "implementation",
      "二分": "binary search",
      "分治": "divide and conquer",
      "哈希": "hashing",
      "堆": "heap",
      "队列": "queues",
      "树": "trees",
    };
    
    const tags = customProblem.tags?.map((t: string) => tagMap[t] || t) || [];
    
    return {
      contestId: customProblem.contestId,
      index: customProblem.index,
      name: customProblem.title,
      type: "PROGRAMMING",
      rating,
      tags,
      createdAt: customProblem.createdAt, // 添加时间
    };
  };
  
  // 获取当前平台的题目
  const getCurrentProblems = (): CFProblem[] => {
    if (activePlatform === "custom") {
      return customProblems.map(convertCustomToCFProblem);
    }
    return problems;
  };

  // Run on platform change
  useEffect(() => {
    fetchActiveProblemset(activePlatform);
  }, [activePlatform]);

  // Launch quick selection from notebooks
  const handleSelectProblemFromNotebook = (p: { contestId?: number, index: string, name: string, rating?: number, tags: string[] }) => {
    setProblemsViewSelection(p as CFProblem);
    setActiveTab("problems");
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans select-none overflow-y-auto">
      {/* Premium Header - 优化后的导航栏 */}
      <header className="sticky top-0 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-700 text-white shadow-lg z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Logo 区域 */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-500 to-rose-500 rounded-2xl blur-md opacity-30 animate-pulse"></div>
                <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center font-black text-white text-lg shadow-xl">
                  CF
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-amber-200">
                    Codeforces Companion
                  </h1>
                  <span className="text-[10px] bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30 backdrop-blur-sm">
                    辅刷系统 v2.5
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  🚀 智能算法解法研读 • 📊 多维度分类晋级里程碑
                </p>
              </div>
            </div>

            {/* Navigation Controls - 仅登录后显示 */}
            {isAuthenticated && (
            <nav className="flex-1 w-full lg:w-auto">
                <div className="flex items-center gap-1 bg-slate-900/70 p-1.5 rounded-2xl border border-slate-700/50 backdrop-blur-xl">
                  <button
                    id="tabDashboard"
                    type="button"
                    onClick={() => setActiveTab("dashboard")}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${
                      activeTab === "dashboard" 
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/25 scale-[1.02]" 
                        : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <LayoutDashboard className="w-4.5 h-4.5" />
                    <span>仪表盘</span>
                  </button>
                  {isAuthenticated && (
                    <>
                  <button
                    id="tabProblems"
                    type="button"
                    onClick={() => setActiveTab("problems")}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${
                      activeTab === "problems" 
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/25 scale-[1.02]" 
                        : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <BookOpen className="w-4.5 h-4.5" />
                    <span>分类题库</span>
                  </button>
                  
                  {/* 训练中心下拉菜单 */}
                  <div className="relative" ref={trainingDropdownRef}>
                    <button
                      id="tabTraining"
                      type="button"
                      onClick={() => setIsTrainingDropdownOpen(!isTrainingDropdownOpen)}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${
                        ["notebook", "challenge", "custom"].includes(activeTab) 
                          ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/25 scale-[1.02]" 
                          : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                    }`}
                    >
                      <Target className="w-4.5 h-4.5" />
                      <span>训练中心</span>
                      {isTrainingDropdownOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                      {savedProblems.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white border-2 border-slate-900 rounded-full font-mono text-[10px] w-5.5 h-5.5 flex items-center justify-center font-bold shadow-md">
                          {savedProblems.length}
                        </span>
                      )}
                    </button>
                    
                    {/* 下拉菜单内容 */}
                    {isTrainingDropdownOpen && (
                      <div className="absolute top-full left-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700 shadow-2xl z-50 py-2">
                        <button
                          onClick={() => {
                            setActiveTab("notebook");
                            setIsTrainingDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-slate-800/70 ${
                            activeTab === "notebook" ? "bg-amber-500/20 text-amber-300" : "text-slate-300"
                          }`}
                        >
                          <BookMarked className="w-4.5 h-4.5" />
                          <div className="flex-1 text-left">
                            <div className="flex items-center justify-between">
                              <span>错题复习夹</span>
                              {savedProblems.length > 0 && (
                                <span className="bg-rose-500/20 text-rose-300 text-xs px-2 py-0.5 rounded-full">
                                  {savedProblems.length} 道
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">整理和复习错题</p>
                          </div>
                        </button>
                        
                        <div className="h-px bg-slate-700/50 my-1"></div>
                        
                        <button
                          onClick={() => {
                            setActiveTab("challenge");
                            setIsTrainingDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-slate-800/70 ${
                            activeTab === "challenge" ? "bg-amber-500/20 text-amber-300" : "text-slate-300"
                          }`}
                        >
                          <Target className="w-4.5 h-4.5" />
                          <div className="flex-1 text-left">
                            <span>排位挑战书</span>
                            <p className="text-xs text-slate-500 mt-0.5">按难度进阶训练</p>
                          </div>
                        </button>
                        
                        <div className="h-px bg-slate-700/50 my-1"></div>
                        
                        <button
                          onClick={() => {
                            setActiveTab("custom");
                            setIsTrainingDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-slate-800/70 ${
                            activeTab === "custom" ? "bg-amber-500/20 text-amber-300" : "text-slate-300"
                          }`}
                        >
                          <Star className="w-4.5 h-4.5" />
                          <div className="flex-1 text-left">
                            <span>我的题库</span>
                            <p className="text-xs text-slate-500 mt-0.5">自定义题目管理</p>
                          </div>
                        </button>
                        
                        <div className="h-px bg-slate-700/50 my-1"></div>
                        
                        <button
                          onClick={() => {
                            setActiveTab("templates");
                            setIsTrainingDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-slate-800/70 ${
                            activeTab === "templates" ? "bg-amber-500/20 text-amber-300" : "text-slate-300"
                          }`}
                        >
                          <Code2 className="w-4.5 h-4.5" />
                          <div className="flex-1 text-left">
                            <span>算法模板</span>
                            <p className="text-xs text-slate-500 mt-0.5">精选常用代码模板库</p>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <button
                    id="tabSandbox"
                    type="button"
                    onClick={() => setActiveTab("sandbox")}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${
                      activeTab === "sandbox" 
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/25 scale-[1.02]" 
                        : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <Terminal className="w-4.5 h-4.5" />
                    <span>代码自测</span>
                  </button>
                  <button
                      id="tabProfile"
                      type="button"
                      onClick={() => setActiveTab("profile")}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${
                        activeTab === "profile" 
                          ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/25 scale-[1.02]" 
                          : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <UserIcon className="w-4.5 h-4.5" />
                      <span>个人中心</span>
                    </button>
                    </>
                  )}
                </div>
            </nav>
            )}
            
            {/* User Menu */}
            <UserMenu onOpenAuthModal={(mode) => {
              setAuthModalMode(mode);
              setAuthModalOpen(true);
            }} onGoToProfile={() => {
              setActiveTab('profile');
            }} />
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Unified Platform Switcher (OJ Selector) - 只在分类题库页面显示 */}
        {activeTab === "problems" && (
          <div className="relative overflow-hidden mb-8">
            {/* 装饰性背景元素 */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-2xl"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/10 to-rose-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-500/10 to-cyan-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 p-6 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-2xl blur-md opacity-30 animate-pulse"></div>
                  <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center font-black text-white text-xl shadow-lg">
                    🎯
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-amber-200">
                    训练星域
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    🌍 四大主流算法评测平台，一键切换，极速同步
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-5">
                {/* Region Selector Tab */}
                <div className="bg-slate-950/60 p-1.5 rounded-2xl border border-slate-700/50 backdrop-blur-sm flex gap-1">
                  <button
                    id="region-intl-btn"
                    type="button"
                    onClick={() => {
                      if (activePlatform !== "custom") {
                        setOjRegion("international");
                        setActivePlatform("codeforces");
                      }
                    }}
                    className={`px-4 py-2 text-sm font-bold rounded-xl transition-all duration-200 ${
                      ojRegion === "international" && activePlatform !== "custom"
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-lg shadow-amber-500/25 scale-[1.02]"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    🌐 国外 OJ
                  </button>
                  <button
                    id="region-dom-btn"
                    type="button"
                    onClick={() => {
                      if (activePlatform !== "custom") {
                        setOjRegion("domestic");
                        setActivePlatform("luogu");
                      }
                    }}
                    className={`px-4 py-2 text-sm font-bold rounded-xl transition-all duration-200 ${
                      ojRegion === "domestic" && activePlatform !== "custom"
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-lg shadow-amber-500/25 scale-[1.02]"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    🇨🇳 国内 OJ
                  </button>
                </div>

                {/* Platform Selector Items */}
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    ...(ojRegion === "international" ? [
                      { id: "codeforces", name: "Codeforces", dot: "bg-rose-500" },
                      { id: "atcoder", name: "AtCoder", dot: "bg-indigo-400" },
                    ] : []),
                    ...(ojRegion === "domestic" ? [
                      { id: "luogu", name: "洛谷", dot: "bg-emerald-400" },
                      { id: "nowcoder", name: "牛客", dot: "bg-cyan-400" },
                    ] : []),
                    { id: "custom", name: "我的题目", dot: "bg-amber-400" },
                  ].map((plat) => {
                    const isSelected = activePlatform === plat.id;
                    return (
                      <button
                        key={plat.id}
                        id={`platform-btn-${plat.id}`}
                        onClick={() => setActivePlatform(plat.id as any)}
                        className={`px-5 py-3 text-sm font-bold rounded-xl transition-all duration-200 border flex items-center justify-center gap-3 active:scale-95 ${
                          isSelected
                            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 border-transparent shadow-lg shadow-amber-500/25 scale-[1.02]"
                            : "bg-slate-950/60 text-slate-300 border-slate-700/50 hover:bg-slate-800/70 hover:border-slate-600"
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full ${isSelected ? "bg-slate-950 animate-ping" : plat.dot}`}></div>
                        <span className="font-medium">{plat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Render respective tab contents */}
        {activeTab === "dashboard" && (
          <div className="flex flex-col gap-8">
            {/* 用户已配置平台账号提示 */}
            {isAuthenticated && hasDefaultProfile && userPlatformProfiles[activePlatform] && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-emerald-800">已配置平台账号</div>
                  <div className="text-xs text-emerald-600">
                    当前默认展示您的 {activePlatform === 'codeforces' ? 'Codeforces' : 
                      activePlatform === 'atcoder' ? 'AtCoder' : 
                      activePlatform === 'luogu' ? '洛谷' : '牛客'} 账号: {userPlatformProfiles[activePlatform].handle}
                    {userPlatformProfiles[activePlatform].rating && ` (Rating: ${userPlatformProfiles[activePlatform].rating})`}
                  </div>
                </div>
                <button
                  onClick={() => fetchUserProfileData(userPlatformProfiles[activePlatform].handle, activePlatform)}
                  className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                >
                  刷新数据
                </button>
              </div>
            )}

            {/* 仪表盘页面平台选择器 */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-800">选择查询平台</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setOjRegion("international");
                    setActivePlatform("codeforces");
                  }}
                  className={`flex-1 px-4 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 border flex items-center justify-center gap-2 ${
                    activePlatform === "codeforces"
                      ? "bg-gradient-to-r from-rose-500 to-orange-500 text-white border-transparent shadow-md"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${activePlatform === "codeforces" ? "bg-white" : "bg-rose-500"}`}></div>
                  <span>Codeforces</span>
                  {userPlatformProfiles['codeforces'] && (
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">✓</span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setOjRegion("international");
                    setActivePlatform("atcoder");
                  }}
                  className={`flex-1 px-4 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 border flex items-center justify-center gap-2 ${
                    activePlatform === "atcoder"
                      ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white border-transparent shadow-md"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${activePlatform === "atcoder" ? "bg-white" : "bg-indigo-400"}`}></div>
                  <span>AtCoder</span>
                  {userPlatformProfiles['atcoder'] && (
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">✓</span>
                  )}
                </button>
              </div>
            </div>
            
            {/* Search handler */}
            <UserSearch
              onSearch={fetchUserProfileData}
              loading={loadingUser}
              error={userError}
              activeHandle={activeHandle}
              activePlatform={activePlatform}
            />

            {/* Profile display details */}
            {user && (
              <UserProfile
                user={user}
                ratingHistory={ratingHistory}
                platform={activePlatform}
              />
            )}

            {/* Submissions detailed statistics graph dashboard */}
            {submissions.length > 0 && (
              <StatsAnalysis
                submissions={submissions}
                username={activeHandle}
                platform={activePlatform}
              />
            )}
          </div>
        )}

        {activeTab === "problems" && (
          <ProblemsView
            problems={getCurrentProblems()}
            submissions={submissions}
            loadingProblems={loadingProblems}
            username={activeHandle}
            onRefreshProblems={fetchActiveProblemset}
            onSaveProblemLocal={handleSaveProblemLocal}
            savedProblems={savedProblems}
            platform={activePlatform}
            onPlatformChange={setActivePlatform}
            ojRegion={ojRegion}
          />
        )}

        {activeTab === "notebook" && (
          <SavedProblems
            savedProblems={savedProblems}
            submissions={submissions}
            onRemoveSavedProblem={(id) => handleSaveProblemLocal({ id, index: "", name: "", tags: [], savedAt: 0, status: "todo" })}
            onUpdateSavedProblem={handleSaveProblemLocal}
            onSelectProblem={handleSelectProblemFromNotebook}
          />
        )}

        {activeTab === "challenge" && (
          <TrainingChallenge
            submissions={submissions}
            problems={problems}
            platform={activePlatform}
          />
        )}

        {activeTab === "custom" && (
          <CustomProblems onProblemsChange={(newProblems) => setCustomProblems(newProblems)} />
        )}

        {activeTab === "sandbox" && (
          <CodePlayground />
        )}
        {activeTab === "templates" && (
          <AlgorithmTemplates />
        )}
        {activeTab === "profile" && (
          <UserSettings />
        )}
      </main>

      {/* Sticky footer */}
      <footer className="bg-gradient-to-b from-slate-900 to-slate-950 border-t border-slate-800 py-8 mt-auto relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* 左侧 - 关于 */}
            <div className="flex flex-col gap-2 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Codeforces Companion
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-md">
                专注于算法竞赛的训练平台，助力每一位选手登顶巅峰 🏆
              </p>
            </div>

            {/* 中间 - 支持的平台 */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-slate-500 font-medium">支持平台</p>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-blue-400 font-medium border border-slate-700">
                  Codeforces
                </span>
                <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-orange-400 font-medium border border-slate-700">
                  AtCoder
                </span>
                <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-red-400 font-medium border border-slate-700">
                  洛谷
                </span>
                <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-green-400 font-medium border border-slate-700">
                  牛客
                </span>
              </div>
            </div>

            {/* 右侧 - 技术支持 */}
            <div className="flex flex-col items-center md:items-end gap-2">
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  API 直连
                </span>
                <span className="text-slate-600">·</span>
                <span>AI 辅助</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-0.5 text-slate-500">
                  <Flame className="w-3 h-3 text-amber-500 fill-current" />
                  祝大家一路 AC，Rating 步步高升！
                </span>
              </div>
            </div>
          </div>

          {/* 底部版权 */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-slate-600">
              © 2024 Codeforces Companion. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs">
              <button 
                onClick={() => setAboutModalOpen(true)}
                className="text-slate-500 hover:text-blue-400 transition-colors cursor-pointer"
              >
                关于我们
              </button>
              <span className="text-slate-600">Made with ❤️ by Competitive Programmers</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* About Modal */}
      {aboutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setAboutModalOpen(false)}>
          <div 
            className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">关于我们</h2>
              </div>
              <button 
                onClick={() => setAboutModalOpen(false)} className="text-white/80 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6">
              <div className="space-y-6">
                {/* Intro */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-200 mb-2">🌟 Codeforces Companion</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    一个专为算法竞赛爱好者打造的全方位训练平台，汇聚了强大的数据分析、AI辅助解题、错题本管理等功能。
                  </p>
                </div>

                {/* Features */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-3">主要功能</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <LayoutDashboard className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">用户数据分析</p>
                        <p className="text-xs text-slate-500">查看个人比赛历程和战绩</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">分类题库练习</p>
                        <p className="text-xs text-slate-500">按算法标签和难度分类</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookMarked className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">错题本管理</p>
                        <p className="text-xs text-slate-500">追踪和复习做错的题目</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Target className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">排位挑战</p>
                        <p className="text-xs text-slate-500">系统性训练计划</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-pink-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">AI 辅助</p>
                        <p className="text-xs text-slate-500">智能解题思路点拨</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Supported Platforms */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-3">支持平台</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-blue-400 font-medium border border-slate-700">Codeforces</span>
                    <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-orange-400 font-medium border border-slate-700">AtCoder</span>
                    <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-red-400 font-medium border border-slate-700">洛谷</span>
                    <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-green-400 font-medium border border-slate-700">牛客</span>
                  </div>
                </div>

                {/* Closing */}
                <div className="pt-4 border-t border-slate-700">
                  <p className="text-sm text-slate-400 text-center">
                    🚀 祝大家一路 AC，Rating 步步高升！
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

