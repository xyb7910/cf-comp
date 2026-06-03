import React, { useState, useEffect, useMemo } from "react";
import { CFProblem, CFSubmission, SavedProblem } from "../types";
import { translateTag, TAG_TRANSLATIONS, getProblemUrl } from "../utils";
import { renderTextWithMath } from "./MathRenderer";
import AIMarkdownRenderer from "./AIMarkdownRenderer";
import { Search, Filter, BookOpen, Star, HelpCircle, Loader2, Sparkles, AlertCircle, ExternalLink, RefreshCw, ChevronLeft, ChevronRight, CheckCircle2, Bookmark, Save, Pencil, Trash, Calendar } from "lucide-react";

interface ProblemsViewProps {
  problems: CFProblem[];
  submissions: CFSubmission[];
  loadingProblems: boolean;
  username: string;
  onRefreshProblems: (platform?: string) => void;
  onSaveProblemLocal: (prob: SavedProblem) => void;
  savedProblems: SavedProblem[];
  platform: string;
  onPlatformChange: (platform: "codeforces" | "atcoder" | "luogu" | "nowcoder" | "custom") => void;
  ojRegion: "international" | "domestic";
}

export default function ProblemsView({
  problems,
  submissions,
  loadingProblems,
  username,
  onRefreshProblems,
  onSaveProblemLocal,
  savedProblems,
  platform,
  onPlatformChange,
  ojRegion,
}: ProblemsViewProps) {
  const platformName = useMemo(() => {
    switch (platform) {
      case "codeforces": return "Codeforces";
      case "atcoder": return "AtCoder";
      case "luogu": return "洛谷 (Luogu)";
      case "nowcoder": return "牛客 (Nowcoder)";
      case "custom": return "我的题目";
      default: return "Codeforces";
    }
  }, [platform]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRating, setSelectedRating] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all"); // "all", "ac", "attempted", "unattempted"
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Selected problem detail for AI explanations / Notes
  const [activeExplainProblem, setActiveExplainProblem] = useState<CFProblem | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [explainLanguage, setExplainLanguage] = useState("C++");

  // Local note writing state
  const [writingNoteText, setWritingNoteText] = useState("");
  const [noteStatus, setNoteStatus] = useState<"todo" | "attempting" | "solved">("todo");

  // Map submissions to a handy key object
  // key: "contestId-index" -> verdict
  const userSolutionsMap = useMemo(() => {
    const map = new Map<string, { status: "solved" | "attempted", count: number }>();
    if (!submissions || submissions.length === 0) return map;

    submissions.forEach(sub => {
      if (!sub.problem || !sub.problem.index) return;
      const key = `${sub.problem.contestId || ""}-${sub.problem.index}`;
      const isOK = sub.verdict === "OK";
      const existing = map.get(key);

      if (isOK) {
        map.set(key, { status: "solved", count: (existing?.count || 0) + 1 });
      } else if (!existing || existing.status !== "solved") {
        map.set(key, { status: "attempted", count: (existing?.count || 0) + 1 });
      }
    });

    return map;
  }, [submissions]);

  // Calculate dynamic statistics for core tags/categories
  const categoryACStats = useMemo(() => {
    const stats: Record<string, { total: number; ac: number }> = {};
    const coreTags = ["greedy", "dp", "math", "graphs", "data structures", "dfs and similar", "trees", "binary search", "strings", "implementation"];
    
    coreTags.forEach(t => {
      stats[t] = { total: 0, ac: 0 };
    });

    problems.forEach(p => {
      if (!p.tags) return;
      p.tags.forEach(t => {
        if (stats[t] !== undefined) {
          stats[t].total++;
          const pKey = `${p.contestId || ""}-${p.index}`;
          const solved = userSolutionsMap.get(pKey);
          if (solved && solved.status === "solved") {
            stats[t].ac++;
          }
        }
      });
    });

    return Object.entries(stats).map(([tag, data]) => ({
      tag,
      name: translateTag(tag),
      totalCount: data.total,
      acCount: data.ac,
      percent: data.total > 0 ? Math.round((data.ac / data.total) * 100) : 0
    }));
  }, [problems, userSolutionsMap]);

  // Aggregate tags for filters
  const tagList = useMemo(() => {
    if (!problems || problems.length === 0) return [];
    const countMap: Record<string, number> = {};
    problems.forEach((p) => {
      p.tags.forEach((t) => {
        countMap[t] = (countMap[t] || 0) + 1;
      });
    });
    return Object.entries(countMap)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => ({ id: tag, name: translateTag(tag) }))
      .slice(0, 30); // Top 30 tags to keep ui clean
  }, [problems]);

  // Ratings List
  const ratingTiers = [800, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000];

  // Filtering Logic
  const filteredProblems = useMemo(() => {
    if (!problems || problems.length === 0) return [];
    
    return problems.filter((prob) => {
      const pKey = `${prob.contestId || ""}-${prob.index}`;
      const hasSolvedStatus = userSolutionsMap.get(pKey);

      // Search term
      const combinedName = `${prob.contestId || ""}${prob.index} ${prob.name}`.toLowerCase();
      if (searchTerm && !combinedName.includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Rating difficulty
      if (selectedRating !== "all") {
        if (selectedRating === "none") {
          if (prob.rating !== undefined) return false;
        } else {
          const r = parseInt(selectedRating, 10);
          if (prob.rating !== r) return false;
        }
      }

      // Tag type
      if (selectedTag !== "all" && !prob.tags.includes(selectedTag)) {
        return false;
      }

      // Submission status
      if (selectedStatus !== "all") {
        if (selectedStatus === "ac" && hasSolvedStatus?.status !== "solved") {
          return false;
        }
        if (selectedStatus === "attempted" && hasSolvedStatus?.status !== "attempted") {
          return false;
        }
        if (selectedStatus === "unattempted" && hasSolvedStatus !== undefined) {
          return false;
        }
      }

      return true;
    });
  }, [problems, searchTerm, selectedRating, selectedTag, selectedStatus, userSolutionsMap]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRating, selectedTag, selectedStatus]);

  // Paginated Problems
  const paginatedProblems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProblems.slice(start, start + itemsPerPage);
  }, [filteredProblems, currentPage]);

  const totalPages = Math.ceil(filteredProblems.length / itemsPerPage) || 1;

  // Track if active explain problem notes are already saved
  const problemLocalSavedState = useMemo(() => {
    if (!activeExplainProblem) return null;
    const pid = `${activeExplainProblem.contestId || ""}-${activeExplainProblem.index}`;
    return savedProblems.find(item => item.id === pid);
  }, [activeExplainProblem, savedProblems]);

  // Edit fields sync with selected problem notes
  useEffect(() => {
    if (activeExplainProblem) {
      if (problemLocalSavedState) {
        setWritingNoteText(problemLocalSavedState.notes || "");
        setNoteStatus(problemLocalSavedState.status);
      } else {
        setWritingNoteText("");
        const pKey = `${activeExplainProblem.contestId || ""}-${activeExplainProblem.index}`;
        const hasAc = userSolutionsMap.get(pKey);
        if (hasAc?.status === "solved") setNoteStatus("solved");
        else if (hasAc?.status === "attempted") setNoteStatus("attempting");
        else setNoteStatus("todo");
      }
      setAiExplanation(null);
    }
  }, [activeExplainProblem, problemLocalSavedState, userSolutionsMap]);

  // Call API for Gemini Explanation
  const getAIExplanation = async (p: CFProblem) => {
    setAiLoading(true);
    setAiExplanation(null);
    const pCode = `${p.contestId || ""}${p.index}`;
    
    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemCode: pCode,
          name: p.name,
          rating: p.rating,
          tags: p.tags,
          language: explainLanguage,
          platform: platform,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setAiExplanation(data.text);
      } else {
        setAiExplanation(`### ❌ 获取AI思路超时或出错\n${data.error || "网络波动，请稍后再试"}`);
      }
    } catch (err: any) {
      setAiExplanation(`### ❌ 网络异常\n${err.message || "无法连接服务端辅助解析"}`);
    } finally {
      setAiLoading(false);
    }
  };

  // Format created time for custom problems
  const formatCreatedAt = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };
  
  // Sync / AutoSave Notes to standard storage
  const handleSaveNotes = () => {
    if (!activeExplainProblem) return;
    const pid = `${activeExplainProblem.contestId || ""}-${activeExplainProblem.index}`;
    
    onSaveProblemLocal({
      id: pid,
      contestId: activeExplainProblem.contestId,
      index: activeExplainProblem.index,
      name: activeExplainProblem.name,
      rating: activeExplainProblem.rating,
      tags: activeExplainProblem.tags,
      notes: writingNoteText,
      status: noteStatus,
      savedAt: problemLocalSavedState?.savedAt || Date.now(),
    });
  };

  // Micro Markdown text component
  // Formats code segments like ```cpp and paragraphs, supporting minor math structures
  const renderMarkdown = (text: string) => {
    if (!text) return null;

    const sections = text.split("```");
    return (
      <div className="space-y-4 text-sm leading-relaxed text-slate-700">
        {sections.map((sec, idx) => {
          if (idx % 2 === 1) { // Code block
            const lines = sec.split("\n");
            const firstLine = lines[0].toLowerCase();
            const languageLabel = ["cpp", "c++", "py", "python", "java", "rust"].includes(firstLine) ? lines[0] : "";
            const rawCode = languageLabel ? lines.slice(1).join("\n") : sec;

            return (
              <div key={idx} className="relative group my-4 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-md">
                {languageLabel && (
                  <div className="bg-slate-850 px-4 py-1 flex items-center justify-between border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                    <span>{languageLabel}</span>
                  </div>
                )}
                <pre className="p-4 overflow-x-auto text-xs text-slate-200 font-mono leading-relaxed">
                  <code>{rawCode.trim()}</code>
                </pre>
              </div>
            );
          } else { // Regular Paragraph text
            const paragraphs = sec.split("\n\n");
            return paragraphs.map((p, pIdx) => {
              if (p.trim().startsWith("- ") || p.trim().startsWith("* ")) {
                // Render List
                const listItems = p.split(/\n[-*]\s+/).filter(Boolean);
                return (
                  <ul key={pIdx} className="list-disc pl-5 space-y-1.5 my-2">
                    {listItems.map((item, itemIdx) => {
                      const cleanItem = item.replace(/^[-*]\s+/, "").trim();
                      return (
                        <li key={itemIdx} className="text-slate-600">
                          {renderTextWithMath(cleanItem)}
                        </li>
                      );
                    })}
                  </ul>
                );
              }
              if (p.trim().startsWith("#")) {
                const level = (p.match(/^#+/) || ["#"])[0].length;
                const cleanHeader = p.replace(/^#+\s+/, "");
                const headerStyle = level === 1 ? "text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-1 mt-6" :
                                    level === 2 ? "text-md font-bold text-slate-800 mt-4" : 
                                    "text-sm font-semibold text-slate-700 mt-3";
                return <h4 key={pIdx} className={headerStyle}>{renderTextWithMath(cleanHeader)}</h4>;
              }
              // Normal inline bold/italic transformations
              let content = p.trim();
              if (!content) return null;
              
              return (
                <p key={pIdx} className="text-slate-600 my-2">
                  {content.split("**").map((chunk, chunkIdx) => {
                    const parsed = renderTextWithMath(chunk);
                    if (chunkIdx % 2 === 1) {
                      return <strong key={chunkIdx} className="text-slate-950 font-bold">{parsed}</strong>;
                    }
                    return <span key={chunkIdx}>{parsed}</span>;
                  })}
                </p>
              );
            });
          }
        })}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      {/* Search Grid / Table List */}
      <div className="lg:col-span-3 flex flex-col gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                题库深度分类筛选
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                已检索到累计 <strong className="text-slate-700">{problems?.length || 0}</strong> 道活跃 {platformName} 题目
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Inline OJ Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                {([
                  ...(ojRegion === "international" ? [
                    { id: "codeforces", label: "CF" },
                    { id: "atcoder", label: "ATC" }
                  ] : [
                    { id: "luogu", label: "洛谷" },
                    { id: "nowcoder", label: "牛客" }
                  ]),
                  { id: "custom", label: "我的" }
                ] as const).map((oj) => (
                  <button
                    key={oj.id}
                    type="button"
                    onClick={() => onPlatformChange(oj.id)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer ${
                      platform === oj.id
                        ? "bg-amber-500 text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {oj.label}
                  </button>
                ))}
              </div>

              {platform !== "custom" && (
                <button
                  id="refreshProblemsBtn"
                  type="button"
                  onClick={() => onRefreshProblems(platform)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 font-medium bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
                  disabled={loadingProblems}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingProblems ? 'animate-spin' : ''}`} />
                  更新题库
                </button>
              )}
            </div>
          </div>

          {/* Tag Category Cards to show ACed problems count and category stats */}
          <div className="mb-6 p-4 rounded-xl border border-slate-105 bg-slate-50/50">
            <h3 className="text-[10.5px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 select-none">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-100" />
              🎯 核心算法大类通关雷达 (点击名牌锁定关联专题)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {categoryACStats.map((stat) => {
                const isActive = selectedTag === stat.tag;
                return (
                  <div
                    id={`stat-category-card-${stat.tag}`}
                    key={stat.tag}
                    onClick={() => {
                      if (isActive) {
                        setSelectedTag("all"); // Toggle off
                      } else {
                        setSelectedTag(stat.tag);
                      }
                    }}
                    className={`p-3 rounded-xl border cursor-pointer select-none transition-all duration-150 flex flex-col justify-between hover:-translate-y-0.5 active:translate-y-0 ${
                      isActive
                        ? "bg-slate-900 border-slate-950 text-white shadow-xs"
                        : "bg-white hover:border-slate-300 border-slate-200/60 text-slate-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-[11px] font-black truncate ${isActive ? "text-amber-400" : "text-slate-700"}`}>
                          {stat.name}
                        </span>
                      </div>
                      
                      <div className="flex items-baseline gap-0.5 mb-2">
                        <span className={`text-sm font-black font-mono leading-none ${isActive ? "text-white" : "text-slate-900"}`}>
                          {stat.acCount}
                        </span>
                        <span className={`text-[9.5px] font-mono ${isActive ? "text-slate-400" : "text-slate-400"}`}>
                          /{stat.totalCount} AC
                        </span>
                      </div>
                    </div>

                    {/* Simple progress pill bar */}
                    <div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/30">
                        <div
                          className={`h-full rounded-full transition-all duration-355 ${isActive ? "bg-amber-400" : "bg-emerald-500"}`}
                          style={{ width: `${stat.percent}%` }}
                        ></div>
                      </div>
                      <span className={`text-[8.5px] font-bold font-mono block text-right mt-1 ${isActive ? "text-amber-200" : "text-slate-450"}`}>
                        {stat.percent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 col-span-full">
            {/* Search inputs */}
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                id="probSearchInput"
                type="text"
                className="w-full bg-white text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-amber-500"
                placeholder="编号或题名 (如: 1923C)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Rating select */}
            <div>
              <select
                id="ratingFilter"
                className="w-full bg-white text-xs px-2.5 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-amber-500"
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
              >
                <option value="all">难度系数 (全部)</option>
                <option value="none">暂无/未标星</option>
                {ratingTiers.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Tag select */}
            <div>
              <select
                id="tagFilter"
                className="w-full bg-white text-xs px-2.5 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-amber-500"
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
              >
                <option value="all">知识分类 (全部)</option>
                {tagList.map(tag => (
                  <option key={tag.id} value={tag.id}>{tag.name}</option>
                ))}
              </select>
            </div>

            {/* Verdict status select */}
            <div>
              <select
                id="statusFilter"
                className="w-full bg-white text-xs px-2.5 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-amber-500"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                disabled={!username}
              >
                <option value="all">解题状态 (全部)</option>
                <option value="ac" disabled={!username}>✅ 已AC (通过)</option>
                <option value="attempted" disabled={!username}>❌ 尝试中 (未AC)</option>
                <option value="unattempted" disabled={!username}>💤 尚未挑战</option>
              </select>
            </div>
          </div>

          {/* List display */}
          {loadingProblems ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-sm">正在加载 {platformName} 题库，请保持航行...</p>
            </div>
          ) : filteredProblems.length > 0 ? (
            <div className="space-y-2 mt-4">
              {paginatedProblems.map((prob) => {
                const probId = `${prob.contestId || ""}-${prob.index}`;
                const pidString = `${prob.contestId || ""}${prob.index}`;
                const actualUrl = getProblemUrl(platform, prob.contestId, prob.index);
                
                const hasStatus = userSolutionsMap.get(probId);
                const localStatus = savedProblems.find(item => item.id === probId);

                return (
                  <div
                    id={`problem-row-${probId}`}
                    key={probId}
                    onClick={() => setActiveExplainProblem(prob)}
                    className={`flex items-center justify-between gap-4 p-3 rounded-xl border transition duration-150 cursor-pointer ${
                      activeExplainProblem?.contestId === prob.contestId && activeExplainProblem?.index === prob.index
                        ? "bg-amber-50/50 border-amber-300 shadow-xs"
                        : "bg-white border-slate-100 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="font-mono text-xs font-semibold bg-slate-150 text-slate-600 px-2 py-0.5 rounded-md flex-shrink-0">
                          {pidString}
                        </span>
                        
                        {/* Dynamic rating complexity */}
                        {prob.rating && (
                          <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                            prob.rating >= 2100 ? "bg-rose-50 text-rose-500 border border-rose-100" :
                            prob.rating >= 1600 ? "bg-blue-50 text-blue-500 border border-blue-100" :
                            prob.rating >= 1200 ? "bg-emerald-50 text-emerald-555 border border-emerald-100" :
                            "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}>
                            ★ {prob.rating}
                          </span>
                        )}

                        {/* Status indicators */}
                        {hasStatus && (
                          <span className={`text-[10px] flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-semibold ${
                            hasStatus.status === "solved" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          }`}>
                            {hasStatus.status === "solved" ? "✓ AC" : "✗ Attempted"}
                          </span>
                        )}

                        {localStatus && (
                          <span className="text-[10px] bg-slate-900 text-amber-400 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5">
                            <Bookmark className="w-2.5 h-2.5 fill-current" />
                            错题本 ({localStatus.status === "solved" ? "已击破" : localStatus.status === "attempting" ? "挣扎底" : "TODO"})
                          </span>
                        )}
                        
                        {/* Created time for custom problems */}
                        {platform === "custom" && prob.createdAt && (
                          <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                            <Calendar className="w-2.5 h-2.5" />
                            {formatCreatedAt(prob.createdAt)}
                          </span>
                        )}
                      </div>
                      
                      <h4 className="text-sm font-semibold text-slate-800 truncate">{prob.name}</h4>
                      
                      {/* Short Tag Pill badges */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {prob.tags.slice(0, 3).map((t) => (
                          <span key={t} className="text-[10px] bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded-md">
                            {translateTag(t)}
                          </span>
                        ))}
                        {prob.tags.length > 3 && (
                          <span className="text-[9px] text-slate-300">+{prob.tags.length - 3}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <a
                        id={`link-prob-${probId}`}
                        href={actualUrl}
                        target="_blank"
                        rel="noreferrer"
                        title={`在 ${platformName} 官网中打开`}
                        className="p-1.5 text-slate-400 hover:text-slate-950 rounded-lg hover:bg-slate-100 transition"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                );
              })}

              {/* Pagination controls */}
              <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-400">
                  筛选出共 <strong>{filteredProblems.length}</strong> 道 / 第 <strong>{currentPage}</strong> 之 <strong>{totalPages}</strong> 页
                </span>
                
                <div className="flex items-center gap-1">
                  <button
                    id="prevPageBtn"
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    id="nextPageBtn"
                    type="button"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center bg-slate-50 border border-dashed border-slate-100 rounded-xl text-slate-400 text-xs">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              未找到匹配筛选的题目。建议放宽评级或标签筛选！
            </div>
          )}
        </div>
      </div>

      {/* Target Problem Workspace Detail Panels (Explain block, local notes) */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        {activeExplainProblem ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col gap-5 sticky top-4">
            {/* Header info */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-amber-500 font-bold uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded-md">
                  当前选中辅导题
                </span>
                <button
                  id="closeExplainBtn"
                  type="button"
                  onClick={() => setActiveExplainProblem(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-medium"
                >
                  清除
                </button>
              </div>
              <h3 className="text-base font-bold text-slate-800 line-clamp-2">
                {activeExplainProblem.contestId}{activeExplainProblem.index} - {activeExplainProblem.name}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs font-mono text-slate-400 font-medium my-0.5">
                  Rating: <strong>{activeExplainProblem.rating || "暂无难度标星"}</strong>
                </span>
                <span className="h-3 w-px bg-slate-200 my-0.5"></span>
                <span className="text-xs text-slate-400 my-0.5">
                  分类: <strong className="text-slate-600">{activeExplainProblem.tags.map(translateTag).slice(0, 3).join(", ")}</strong>
                </span>
              </div>
            </div>

            {/* Local Notes Writing Block */}
            <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Pencil className="w-3.5 h-3.5 text-indigo-500" />
                  个人刷题便签 (本地存储)
                </span>
                {problemLocalSavedState && (
                  <span className="text-[10px] text-indigo-600 font-medium flex items-center gap-1 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100">
                    <CheckCircle2 className="w-3 h-3" />
                    已保存在错题本
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-slate-500">分类标记:</span>
                <select
                  id="noteStatusSelect"
                  className="text-xs bg-white py-1 px-1.5 border border-slate-200 rounded-md text-slate-700 focus:outline-none"
                  value={noteStatus}
                  onChange={(e) => setNoteStatus(e.target.value as any)}
                >
                  <option value="todo">💤 将来再刷 (Todo)</option>
                  <option value="attempting">⚡ 正在死磕 (Attempting)</option>
                  <option value="solved">🎉 已胜利AC (Solved)</option>
                </select>
              </div>

              <textarea
                id="noteTextarea"
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-amber-500 transition h-20 placeholder-slate-400"
                placeholder="记录解本题的卡点、反思或者关键转换方程式..."
                value={writingNoteText}
                onChange={(e) => setWritingNoteText(e.target.value)}
              />
              
              <div className="flex justify-end gap-2 mt-2">
                {problemLocalSavedState && (
                  <button
                    id="deleteNotebookBtn"
                    type="button"
                    onClick={() => {
                      if (window.confirm("确定从错题本/便签夹中移除本题吗？")) {
                        onSaveProblemLocal({
                          id: `${activeExplainProblem.contestId}-${activeExplainProblem.index}`,
                          index: activeExplainProblem.index,
                          name: activeExplainProblem.name,
                          tags: activeExplainProblem.tags,
                          status: "todo",
                          savedAt: 0 // flag to remove
                        });
                        setWritingNoteText("");
                      }
                    }}
                    className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent transition inline-flex items-center gap-1"
                  >
                    <Trash className="w-3.5 h-3.5" />
                    移除
                  </button>
                )}
                <button
                  id="saveLocalNotesBtn"
                  type="button"
                  onClick={handleSaveNotes}
                  className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition inline-flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  {problemLocalSavedState ? "更新标记与笔记" : "加入我的错题本"}
                </button>
              </div>
            </div>

            {/* AI Coaching Panel */}
            <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500 fill-current animate-pulse" />
                  Gemini AI 教练解题思路提示 ( LaTeX+解题路径 )
                </span>
                
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <label htmlFor="languageSelect" className="text-[10px] text-slate-400 whitespace-nowrap">代码演示语言:</label>
                  <select
                    id="languageSelect"
                    className="text-[10px] bg-slate-100 border border-slate-200 rounded-md py-0.5 px-1.5 text-slate-600"
                    value={explainLanguage}
                    onChange={(e) => setExplainLanguage(e.target.value)}
                  >
                    <option value="C++">C++</option>
                    <option value="Python">Python</option>
                    <option value="Java">Java</option>
                  </select>
                </div>
              </div>

              {aiExplanation ? (
                <div className="p-4 bg-gradient-to-br from-amber-50/30 to-orange-50/20 border border-amber-200/50 rounded-xl overflow-y-auto max-h-[420px] custom-scrollbar">
                  <AIMarkdownRenderer content={aiExplanation} />
                  <button
                    id="reExplainBtn"
                    type="button"
                    onClick={() => getAIExplanation(activeExplainProblem)}
                    className="mt-4 w-full py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-xs text-slate-600 rounded-lg text-center font-medium transition"
                  >
                    🔄 重新解析
                  </button>
                </div>
              ) : (
                <div className="py-12 px-6 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mb-3 select-none">
                    <Sparkles className="w-5 h-5 fill-current animate-pulse" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-700 mb-1">卡住没有思路？</h4>
                  <p className="text-[11px] text-slate-400 max-w-[240px] mb-4">
                    让 AI 导师给你揭示 **黄金观察切入点** 吧，提供定制代码框架！不直接剧透具体代码更利于竞赛成长。
                  </p>
                  <button
                    id="aiExplainBtn"
                    type="button"
                    onClick={() => getAIExplanation(activeExplainProblem)}
                    disabled={aiLoading}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>AI 教练思考中...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 fill-current" />
                        <span>一键开启思路提示</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-50/60 border border-dashed border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[440px] text-slate-400">
            <div className="w-12 h-12 bg-white border border-slate-100 text-amber-400 rounded-full flex items-center justify-center shadow-xs mb-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-700 mb-1">选中一道题目</h3>
            <p className="text-xs text-slate-400 max-w-[280px]">
              在左侧列表中点击选择任意题目，解锁 **错题本标签**、**学习随手记**，并获取由 **Gemini AI** Coach 实时的解题思路辅导卡！
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
