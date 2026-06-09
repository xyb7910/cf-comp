import React, { useState, useEffect } from "react";
import { Search, UserCheck, Flame, History, ChevronRight } from "lucide-react";

interface UserSearchProps {
  onSearch: (handle: string) => void;
  loading: boolean;
  error: string | null;
  activeHandle: string;
  activePlatform?: "codeforces" | "atcoder" | "luogu" | "nowcoder" | "custom";
}

const PLATFORM_FAMOUS: Record<string, { handle: string; name: string }[]> = {
  codeforces: [
    { handle: "jiangly", name: "jiangly (中国传奇第一)" },
    { handle: "tourist", name: "tourist (CF终极魔王)" },
    { handle: "Benq", name: "Benq (美国级大师)" },
    { handle: "Um_nik", name: "Um_nik (切题机器)" }
  ],
  atcoder: [
    { handle: "chokudai", name: "chokudai (AtCoder站长)" },
    { handle: "tourist", name: "tourist (双端神牛)" },
    { handle: "mnbvmar", name: "mnbvmar (波兰传奇学者)" },
    { handle: "rng_58", name: "rng_58 (前命题总监)" }
  ],
  luogu: [
    { handle: "kkksc03", name: "kkksc03 (洛谷一号站长)" },
    { handle: "chen_zhe", name: "chen_zhe (著名超级管理)" },
    { handle: "ywwyww", name: "ywwyww (多项式大师)" },
    { handle: "1000", name: "1000 (经典元老UID)" }
  ],
  nowcoder: [
    { handle: "NowcoderUser", name: "牛客老铁 (测试句柄)" },
    { handle: "Wannafly", name: "牛客练习赛官方" },
    { handle: "NowcoderStar", name: "小白赛首席导师" },
    { handle: "ACM_Master", name: "牛客殿堂级金牌" }
  ]
};

export default function UserSearch({ onSearch, loading, error, activeHandle, activePlatform = "codeforces" }: UserSearchProps) {
  const [inputHandle, setInputHandle] = useState("");
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(`cf_search_history_${activePlatform}`);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    } else {
      setHistory([]);
    }
  }, [activePlatform]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const handle = inputHandle.trim();
    if (!handle) return;
    triggerSearch(handle);
  };

  const triggerSearch = (handle: string) => {
    onSearch(handle);
    setInputHandle("");
    
    // Save to history corresponding to platform
    setHistory((prev) => {
      const filtered = prev.filter((h) => h.toLowerCase() !== handle.toLowerCase());
      const updated = [handle, ...filtered].slice(0, 6);
      localStorage.setItem(`cf_search_history_${activePlatform}`, JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(`cf_search_history_${activePlatform}`);
  };

  const famousPlayers = PLATFORM_FAMOUS[activePlatform] || PLATFORM_FAMOUS.codeforces;

  // Render text based on Platform
  const getContextMeta = () => {
    switch (activePlatform) {
      case "atcoder":
        return {
          title: "🌌 进入 AtCoder 刷题太空舱",
          desc: "请输入您的 AtCoder 用户句柄，我们将一键获取您的 Rated 赛历史成长曲线、AC 过的各色级别（Gray 至 Red）任务列表与多维度实力雷达图。",
          placeholder: "输入 AtCoder ID (例如: chokudai, tourist)"
        };
      case "luogu":
        return {
          title: "🪵 进入 洛谷(Luogu) 极速雷达舱",
          desc: "请输入您的 洛谷 昵称或数字 UID（如 1）。我们将一键测定您的段位名色等级（灰/蓝/绿/橙/红/紫）、解析您 AC 过的 CSP-J/S 与省选级难易题。",
          placeholder: "输入 洛谷昵称/UID (例如: kkksc03, chen_zhe)"
        };
      case "nowcoder":
        return {
          title: "💻 进入 牛客(Nowcoder) 冲刺控制塔",
          desc: "请输入您的 牛客 句柄名称。我们将读取您的排位段位积分、牛客大奖赛与小白训练赛打卡勋章、全能型竞赛思维 AC 热图。",
          placeholder: "输入 牛客 ID (例如: NowcoderUser)"
        };
      default:
        return {
          title: "🚀 进入 Codeforces 刷题太空舱",
          desc: "请输入您的 Codeforces 句柄 (Handle)，我们将一键读取您的 Rating、排位变动、AC 的题目及难易度。您可以跟偶像或同伴作对比，辅助制定个人刷题里程碑！",
          placeholder: "输入 CF ID (例如: jiangly, tourist)"
        };
    }
  };

  const meta = getContextMeta();

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm">
      <div className="max-w-2xl mx-auto text-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-2">{meta.title}</h2>
        <p className="text-sm text-slate-500">
          {meta.desc}
        </p>
      </div>

      <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto flex gap-2">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            id="handleInput"
            type="text"
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 focus:bg-white text-base transition duration-200"
            placeholder={meta.placeholder}
            value={inputHandle}
            onChange={(e) => setInputHandle(e.target.value)}
            disabled={loading}
          />
        </div>
        <button
          id="searchBtn"
          type="submit"
          className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition duration-150 shadow-sm whitespace-nowrap active:scale-95 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <span>探寻</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="max-w-xl mx-auto mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm flex gap-2 items-center">
          <div className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0 animate-ping"></div>
          <span>{error}</span>
        </div>
      )}

      {/* Preset Suggestions */}
      <div className="max-w-xl mx-auto mt-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          <Flame className="w-4 h-4 text-orange-500" />
          <span>顶级神之手对照</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {famousPlayers.map((p) => (
            <button
              id={`preset-${p.handle}`}
              key={p.handle}
              type="button"
              onClick={() => triggerSearch(p.handle)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition duration-150 flex items-center gap-1 ${
                activeHandle.toLowerCase() === p.handle.toLowerCase()
                  ? "bg-amber-100 text-amber-800 border-amber-200"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <UserCheck className="w-3 h-3 flex-shrink-0" />
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search History */}
      {history.length > 0 && (
        <div className="max-w-xl mx-auto mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <History className="w-3.5 h-3.5 text-slate-400" />
              最近查询
            </span>
            <button
              id="clearHistoryBtn"
              type="button"
              onClick={clearHistory}
              className="text-xs text-slate-400 hover:text-slate-600 underline"
            >
              清空
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.map((h) => (
              <button
                id={`history-${h}`}
                key={h}
                type="button"
                onClick={() => triggerSearch(h)}
                className={`px-3 py-1.5 text-xs rounded-lg transition duration-150 ${
                  activeHandle.toLowerCase() === h.toLowerCase()
                    ? "bg-slate-900 text-white font-medium shadow-xs"
                    : "bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100"
                }`}
              >
                {h}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
