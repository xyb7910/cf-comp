import React, { useState, useEffect, useRef } from "react";
import { CFUser, CFRatingChange, CFSubmission, CFProblem, SavedProblem } from "./types";
import UserSearch from "./components/UserSearch";
import UserProfile from "./components/UserProfile";
import ProblemsView from "./components/ProblemsView";
import StatsAnalysis from "./components/StatsAnalysis";
import SavedProblems from "./components/SavedProblems";
import TrainingChallenge from "./components/TrainingChallenge";
import CodePlayground from "./components/CodePlayground";
import { LayoutDashboard, BookOpen, BookMarked, Target, Sparkles, Terminal, Flame, Info } from "lucide-react";

export default function App() {
  // Global States
  const [ojRegion, setOjRegion] = useState<"international" | "domestic">("international");
  const [activePlatform, setActivePlatform] = useState<"codeforces" | "atcoder" | "luogu" | "nowcoder">("codeforces");
  const [handles, setHandles] = useState<Record<string, string>>({
    codeforces: "jiangly",
    atcoder: "chokudai",
    luogu: "kkksc03",
    nowcoder: "NowcoderUser",
  });
  
  const [activeHandle, setActiveHandle] = useState("jiangly");
  const [user, setUser] = useState<CFUser | null>(null);
  const [ratingHistory, setRatingHistory] = useState<CFRatingChange[]>([]);
  const [submissions, setSubmissions] = useState<CFSubmission[]>([]);
  
  const [problems, setProblems] = useState<CFProblem[]>([]);
  const [loadingUser, setLoadingUser] = useState(false);
  const [loadingProblems, setLoadingProblems] = useState(false);
  
  const [userError, setUserError] = useState<string | null>(null);
  const [problemsError, setProblemsError] = useState<string | null>(null);

  // Tab state: "dashboard", "problems", "notebook", "challenge", "sandbox"
  const [activeTab, setActiveTab] = useState<"dashboard" | "problems" | "notebook" | "challenge" | "sandbox">("dashboard");

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
      // User general details
      const userRes = await fetch(`/api/user-info?platform=${platform}&handle=${encodeURIComponent(handle)}`);
      const userData = await userRes.json();
      if (!userRes.ok) {
        throw new Error(userData.error || "获取用户信息失败");
      }
      
      if (userData.status === "OK" && userData.result?.[0]) {
        setUser(userData.result[0]);
        setActiveHandle(userData.result[0].handle);
        setHandles(prev => ({ ...prev, [platform]: userData.result[0].handle }));
      } else {
        throw new Error("用户句柄未找到");
      }

      // Rating Change timeline proxy
      try {
        const ratingRes = await fetch(`/api/user-rating?platform=${platform}&handle=${encodeURIComponent(handle)}`);
        const ratingData = await ratingRes.json();
        if (ratingRes.ok && ratingData.status === "OK") {
          setRatingHistory(ratingData.result || []);
        } else {
          setRatingHistory([]);
        }
      } catch (err) {
        setRatingHistory([]);
      }

      // Status / submissions proxy
      try {
        const statusRes = await fetch(`/api/user-status?platform=${platform}&handle=${encodeURIComponent(handle)}`);
        const statusData = await statusRes.json();
        if (statusRes.ok && statusData.status === "OK") {
          setSubmissions(statusData.result || []);
        } else {
          setSubmissions([]);
        }
      } catch (err) {
        setSubmissions([]);
      }

    } catch (err: any) {
      console.error(err);
      setUserError(err.message || "无法检索该用户句柄。请检查拼写！");
    } finally {
      setLoadingUser(false);
    }
  };

  // 3. Fetch active problemset problems
  const fetchActiveProblemset = async (platform: string = activePlatform) => {
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

  // Run on platform/handle change
  useEffect(() => {
    const defaultHandle = handles[activePlatform] || "jiangly";
    fetchUserProfileData(defaultHandle, activePlatform);
    fetchActiveProblemset(activePlatform);
  }, [activePlatform]);

  // Launch quick selection from notebooks
  const handleSelectProblemFromNotebook = (p: { contestId?: number, index: string, name: string, rating?: number, tags: string[] }) => {
    setProblemsViewSelection(p as CFProblem);
    setActiveTab("problems");
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans select-none overflow-y-auto">
      {/* Premium Header */}
      <header className="sticky top-0 bg-slate-900 border-b border-slate-800 text-white shadow-md z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center font-black text-white text-base shadow-lg animate-pulse">
              CF
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-md font-black tracking-tight uppercase">Codeforces Companion</h1>
                <span className="text-[9px] bg-amber-500/10 text-amber-400 font-bold px-1.5 py-0.5 rounded-full border border-amber-500/25">辅刷系统 v2.5</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">智能算法解法研读 • 多维度分类晋级里程碑</p>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              id="tabDashboard"
              type="button"
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition duration-150 ${
                activeTab === "dashboard" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-350 hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>仪表盘盘</span>
            </button>
            <button
              id="tabProblems"
              type="button"
              onClick={() => setActiveTab("problems")}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition duration-150 ${
                activeTab === "problems" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-350 hover:text-white"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>分类题库</span>
            </button>
            <button
              id="tabNotebook"
              type="button"
              onClick={() => setActiveTab("notebook")}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition duration-150 relative ${
                activeTab === "notebook" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-350 hover:text-white"
              }`}
            >
              <BookMarked className="w-4 h-4" />
              <span>错题复习夹</span>
              {savedProblems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white border-2 border-slate-900 rounded-full font-mono text-[9px] w-5 h-5 flex items-center justify-center font-bold">
                  {savedProblems.length}
                </span>
              )}
            </button>
            <button
              id="tabChallenge"
              type="button"
              onClick={() => setActiveTab("challenge")}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition duration-150 ${
                activeTab === "challenge" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-350 hover:text-white"
              }`}
            >
              <Target className="w-4 h-4" />
              <span>排位挑战书</span>
            </button>
            <button
              id="tabSandbox"
              type="button"
              onClick={() => setActiveTab("sandbox")}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition duration-150 ${
                activeTab === "sandbox" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-350 hover:text-white"
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>代码自测</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Unified Platform Switcher (OJ Selector) */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 mb-8 bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center font-bold text-slate-950 text-base shadow-sm">
              🎯
            </div>
            <div>
              <h3 className="text-sm font-black tracking-wide text-slate-100">训练星域 (Online Judge)</h3>
              <p className="text-[10px] text-slate-400">一键在这四大主流算法评测端极速同步、跨平台追踪选手成长战绩</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {/* Region Selector Tab */}
            <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-800 flex gap-1">
              <button
                id="region-intl-btn"
                type="button"
                onClick={() => {
                  setOjRegion("international");
                  setActivePlatform("codeforces");
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 ${
                  ojRegion === "international"
                    ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                国外 OJ
              </button>
              <button
                id="region-dom-btn"
                type="button"
                onClick={() => {
                  setOjRegion("domestic");
                  setActivePlatform("luogu");
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 ${
                  ojRegion === "domestic"
                    ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                国内 OJ
              </button>
            </div>

            {/* Platform Selector Items */}
            <div className="flex items-center gap-2 flex-wrap">
              {(ojRegion === "international" ? [
                { id: "codeforces", name: "Codeforces", dot: "bg-rose-500" },
                { id: "atcoder", name: "AtCoder", dot: "bg-indigo-400" },
              ] : [
                { id: "luogu", name: "洛谷 (Luogu)", dot: "bg-emerald-400" },
                { id: "nowcoder", name: "牛客 (Nowcoder)", dot: "bg-cyan-400" },
              ]).map((plat) => {
                const isSelected = activePlatform === plat.id;
                return (
                  <button
                    key={plat.id}
                    id={`platform-btn-${plat.id}`}
                    onClick={() => setActivePlatform(plat.id as any)}
                    className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-xl transition duration-150 border flex items-center justify-center gap-2 active:scale-95 ${
                      isSelected
                        ? "bg-amber-500 text-slate-950 border-transparent shadow-sm"
                        : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-850"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-slate-950 animate-ping" : plat.dot}`} />
                    <span>{plat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Render respective tab contents */}
        {activeTab === "dashboard" && (
          <div className="flex flex-col gap-8">
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
            problems={problems}
            submissions={submissions}
            loadingProblems={loadingProblems}
            username={activeHandle}
            onRefreshProblems={fetchActiveProblemset}
            onSaveProblemLocal={handleSaveProblemLocal}
            savedProblems={savedProblems}
            platform={activePlatform}
            onPlatformChange={setActivePlatform}
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

        {activeTab === "sandbox" && (
          <CodePlayground />
        )}
      </main>

      {/* Sticky footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-center text-xs text-slate-500 text-medium mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>
            本工具数据直连 🌐 <strong className="text-slate-300">Codeforces API</strong>，解题算法与思路卡片由 🧠 <strong className="text-amber-400">Gemini 3.5 AI</strong> 启发式辅导支撑。
          </span>
          <span className="flex items-center gap-0.5">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-current" />
            祝大家排位一路 AC，Rating 大放异彩！
          </span>
        </div>
      </footer>
    </div>
  );
}

