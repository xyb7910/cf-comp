import React, { useState, useMemo } from "react";
import { SavedProblem, CFSubmission } from "../types";
import { translateTag } from "../utils";
import { BookMarked, Bookmark, Calendar, AlertCircle, ChevronRight, CheckCircle2, Flame, Trash2, Edit3, Save, ExternalLink, RefreshCw, Sparkles, HelpCircle } from "lucide-react";

interface SavedProblemsProps {
  savedProblems: SavedProblem[];
  submissions: CFSubmission[];
  onRemoveSavedProblem: (id: string) => void;
  onUpdateSavedProblem: (prob: SavedProblem) => void;
  onSelectProblem: (pid: { contestId?: number, index: string, name: string, rating?: number, tags: string[] }) => void;
}

interface AutoCapturedProblem {
  id: string;
  contestId?: number;
  index: string;
  name: string;
  rating?: number;
  tags: string[];
  totalAttempts: number;
  failedAttempts: number;
  firstTryAC: boolean;
  solved: boolean;
}

export default function SavedProblems({
  savedProblems,
  submissions,
  onRemoveSavedProblem,
  onUpdateSavedProblem,
  onSelectProblem,
}: SavedProblemsProps) {
  // Source switch: "manual" (错题笔记本) vs "auto" (自动捕获)
  const [activeSource, setActiveSource] = useState<"manual" | "auto">("manual");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editingStatus, setEditingStatus] = useState<"todo" | "attempting" | "solved">("todo");

  // Filtering for manual notepad
  const filteredManual = savedProblems.filter((p) => {
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    return true;
  });

  // 1. Core Logic to Auto-Capture Failed or multiple-trial problems from user submissions
  const autoCapturedProblems = useMemo(() => {
    if (!submissions || submissions.length === 0) return [];

    // Group submission instances by problem key "contestId-index"
    const grouped: Record<string, CFSubmission[]> = {};
    submissions.forEach((sub) => {
      if (!sub.problem || !sub.problem.index) return;
      const key = `${sub.problem.contestId || ""}-${sub.problem.index}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(sub);
    });

    const list: AutoCapturedProblem[] = [];

    Object.entries(grouped).forEach(([key, subs]) => {
      // Sort oldest first (chronological order)
      const sorted = [...subs].sort((a, b) => (a.creationTimeSeconds || 0) - (b.creationTimeSeconds || 0));
      
      const prob = sorted[0].problem!;
      const solved = subs.some(s => s.verdict === "OK");
      const totalAttempts = subs.length;

      // Find first AC point
      const firstOkIndex = sorted.findIndex(s => s.verdict === "OK");
      let failedAttempts = 0;
      if (firstOkIndex === -1) {
        failedAttempts = totalAttempts;
      } else {
        // Count errors occurred strictly BEFORE the first OK instance
        failedAttempts = firstOkIndex;
      }

      const firstTryAC = firstOkIndex === 0;

      // The problem fits the "一次没有AC" OR "之前存在WA" criterion if failedAttempts > 0
      if (failedAttempts > 0) {
        list.push({
          id: key,
          contestId: prob.contestId,
          index: prob.index,
          name: prob.name,
          rating: prob.rating,
          tags: prob.tags || [],
          totalAttempts,
          failedAttempts,
          firstTryAC,
          solved
        });
      }
    });

    // Sort by rating or heaviest failure count to show high-leverage challenges first
    return list.sort((a, b) => b.failedAttempts - a.failedAttempts);
  }, [submissions]);

  // Filters for Auto Captured
  const [autoFilterSolved, setAutoFilterSolved] = useState<"all" | "solved" | "unsolved">("all");
  const filteredAuto = useMemo(() => {
    return autoCapturedProblems.filter(p => {
      if (autoFilterSolved === "solved" && !p.solved) return false;
      if (autoFilterSolved === "unsolved" && p.solved) return false;
      return true;
    });
  }, [autoCapturedProblems, autoFilterSolved]);

  const handleStartEdit = (p: SavedProblem) => {
    setEditingId(p.id);
    setEditingText(p.notes || "");
    setEditingStatus(p.status);
  };

  const handleSaveEdit = (p: SavedProblem) => {
    onUpdateSavedProblem({
      ...p,
      notes: editingText,
      status: editingStatus,
    });
    setEditingId(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "solved":
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-md">✓ 已攻克</span>;
      case "attempting":
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-md animate-pulse">⚡ 死磕中</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-500 rounded-md">🛌 待复习</span>;
    }
  };

  // Quick Action to move an auto-captured error into the manual notepad
  const handleArchiveToNotepad = (p: AutoCapturedProblem) => {
    // Check if already in savedProblems
    if (savedProblems.some(x => x.id === p.id)) {
      alert("该题目已经归类在您的笔记本中啦！");
      return;
    }

    onUpdateSavedProblem({
      id: p.id,
      contestId: p.contestId,
      index: p.index,
      name: p.name,
      rating: p.rating,
      tags: p.tags,
      notes: `【智能捕获】曾遭遇 ${p.failedAttempts} 次调试阻碍。`,
      status: p.solved ? "solved" : "attempting",
      savedAt: Date.now()
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 2-layered Tab header switcher */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
          <div>
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-indigo-500" />
              错题复习夹 & 智能捕捉舱
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              通过 Codeforces 提交记录进行智能错题筛查，找出一次未通过或曾经遭遇 WA 的典型卡点！
            </p>
          </div>

          <div className="flex bg-slate-100/80 p-1 rounded-xl items-center gap-1 self-start md:self-auto border border-slate-200/50">
            <button
              id="btnSourceManual"
              type="button"
              onClick={() => setActiveSource("manual")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition duration-200 flex items-center gap-1.5 ${
                activeSource === "manual" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>📓 我的归纳反思本</span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">
                {savedProblems.length}
              </span>
            </button>
            <button
              id="btnSourceAuto"
              type="button"
              onClick={() => setActiveSource("auto")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition duration-200 flex items-center gap-1.5 ${
                activeSource === "auto" ? "bg-white text-amber-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>🤖 智能自动捕获袋</span>
              {autoCapturedProblems.length > 0 && (
                <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">
                  {autoCapturedProblems.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 1. RENDER MANUAL NOTEBOOK */}
        {activeSource === "manual" ? (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800">当前筛选归纳</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">您在此处手动编辑和打卡难题的反思心得。</p>
              </div>

              {/* Status subfilters */}
              <div className="flex bg-slate-100 p-1 rounded-xl items-center gap-1 self-start">
                <button
                  id="tabAllSaved"
                  type="button"
                  onClick={() => setFilterStatus("all")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                    filterStatus === "all" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  全部 ({savedProblems.length})
                </button>
                <button
                  id="tabTodoSaved"
                  type="button"
                  onClick={() => setFilterStatus("todo")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                    filterStatus === "todo" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  待重刷 ({savedProblems.filter(x => x.status === "todo").length})
                </button>
                <button
                  id="tabAttemptingSaved"
                  type="button"
                  onClick={() => setFilterStatus("attempting")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                    filterStatus === "attempting" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  死磕中 ({savedProblems.filter(x => x.status === "attempting").length})
                </button>
                <button
                  id="tabSolvedSaved"
                  type="button"
                  onClick={() => setFilterStatus("solved")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                    filterStatus === "solved" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  已击破 ({savedProblems.filter(x => x.status === "solved").length})
                </button>
              </div>
            </div>

            {filteredManual.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredManual.map((prob) => {
                  const dateStr = new Date(prob.savedAt).toLocaleDateString("zh-CN");
                  const probCode = prob.id.replace("-", "");

                  return (
                    <div
                      id={`saved-problem-item-${prob.id}`}
                      key={prob.id}
                      className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl p-5 transition duration-150 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-xs font-bold text-slate-700 bg-slate-250 px-2 py-0.5 rounded-md">
                              {probCode}
                            </span>
                            {prob.rating && (
                              <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full border border-amber-100">
                                ★ {prob.rating}
                              </span>
                            )}
                            {getStatusBadge(prob.status)}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <button
                              id={`delete-saved-${prob.id}`}
                              type="button"
                              onClick={() => {
                                if (window.confirm("确定从错题本中移除该题吗？")) {
                                  onRemoveSavedProblem(prob.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition"
                              title="删除该题"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <h3 className="font-bold text-slate-800 text-sm mb-2 hover:text-indigo-600 cursor-pointer line-clamp-1" onClick={() => onSelectProblem({
                          contestId: prob.contestId,
                          index: prob.index,
                          name: prob.name,
                          rating: prob.rating,
                          tags: prob.tags
                        })}>
                          {prob.name}
                        </h3>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mb-4">
                          {prob.tags.slice(0, 3).map((t) => (
                            <span key={t} className="text-[9px] text-slate-400 font-medium bg-white px-1.5 py-0.5 rounded-md border border-slate-100">
                              {translateTag(t)}
                            </span>
                          ))}
                        </div>

                        {/* Edit form vs display block */}
                        {editingId === prob.id ? (
                          <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-2 mt-2 shadow-xs">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold text-slate-400">编辑学习标记与随笔</span>
                              <select
                                id={`edit-notes-status-${prob.id}`}
                                className="text-[10px] border border-slate-200 rounded-md p-0.5 text-slate-700"
                                value={editingStatus}
                                onChange={(e) => setEditingStatus(e.target.value as any)}
                              >
                                <option value="todo">💤 待重刷 (Todo)</option>
                                <option value="attempting">⚡ 死磕中 (Attempting)</option>
                                <option value="solved">🎉 已攻克 (Solved)</option>
                              </select>
                            </div>
                            <textarea
                              id={`edit-notes-textarea-${prob.id}`}
                              className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg w-full h-16 text-slate-700 focus:outline-none focus:border-amber-500"
                              placeholder="在此处补充或编辑反思日记..."
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                            />
                            <div className="flex justify-end gap-1.5 mt-1">
                              <button
                                id={`cancel-edit-${prob.id}`}
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="px-2 py-1 text-[10px] text-slate-500 hover:bg-slate-100 rounded-md"
                              >
                                取消
                              </button>
                              <button
                                id={`save-edit-${prob.id}`}
                                type="button"
                                onClick={() => handleSaveEdit(prob)}
                                className="px-2.5 py-1 text-[10px] bg-slate-900 text-white font-semibold rounded-md flex items-center gap-0.5"
                              >
                                <Save className="w-3 h-3" />
                                保存
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 text-xs bg-white/70 border border-slate-100 rounded-xl p-3 min-h-[60px] flex flex-col justify-between group">
                            <div className="text-slate-600 italic line-clamp-2">
                              {prob.notes ? `“${prob.notes}”` : "暂无卡点反思记录.. 点击下方按钮撰写备备忘。"}
                            </div>
                            <div className="flex justify-end gap-2 mt-2 opacity-60 group-hover:opacity-100 transition duration-150">
                              <button
                                id={`start-edit-${prob.id}`}
                                type="button"
                                onClick={() => handleStartEdit(prob)}
                                className="text-[10px] text-slate-400 hover:text-slate-800 flex items-center gap-0.5 font-medium"
                              >
                                <Edit3 className="w-3 h-3" />
                                编辑
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-slate-100/60 pt-3 mt-4 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-350" />
                          归纳于 {dateStr}
                        </span>

                        <button
                          id={`action-saved-${prob.id}`}
                          type="button"
                          onClick={() => onSelectProblem({
                            contestId: prob.contestId,
                            index: prob.index,
                            name: prob.name,
                            rating: prob.rating,
                            tags: prob.tags
                          })}
                          className="text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center gap-0.5 transition"
                        >
                          <span>智能唤醒</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-250 text-slate-405">
                <Bookmark className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-700">重刷卡片夹空空如也</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  您还没有在此处归正错题。请在前方的**【分类题库】**过滤难题，并点击右侧栏便签的 **“加入我的错题本”** 来进行科学重温！
                </p>
              </div>
            )}
          </div>
        ) : (
          /* 2. RENDER INTELLIGENT AUTO-CAPTURED WA SECTION */
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-amber-500 fill-amber-50" />
                  智能错误扫描仪 (自动捕获)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  自动为您扫描该搜索用户的排位提交史，快速筛选出**一次未通过(即多轮尝试才AC)**以及**目前仍带有WA错误且未被攻克的经典战役**。
                </p>
              </div>

              {/* Solved Filter Swithes */}
              <div className="flex bg-slate-100 p-1 rounded-xl items-center gap-1 self-start">
                <button
                  id="tabAutoAll"
                  type="button"
                  onClick={() => setAutoFilterSolved("all")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                    autoFilterSolved === "all" ? "bg-white text-slate-800 shadow-xs animate-fade-in" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  全部捕获 ({autoCapturedProblems.length})
                </button>
                <button
                  id="tabAutoUnsolved"
                  type="button"
                  onClick={() => setAutoFilterSolved("unsolved")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                    autoFilterSolved === "unsolved" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  ⚠️ 仍未攻克 ({autoCapturedProblems.filter(x => !x.solved).length})
                </button>
                <button
                  id="tabAutoSolved"
                  type="button"
                  onClick={() => setAutoFilterSolved("solved")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                    autoFilterSolved === "solved" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  🎉 艰难AC ({autoCapturedProblems.filter(x => x.solved).length})
                </button>
              </div>
            </div>

            {filteredAuto.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAuto.map((prob) => {
                  const alreadySaved = savedProblems.some(x => x.id === prob.id);

                  return (
                    <div
                      id={`auto-problem-item-${prob.id}`}
                      key={prob.id}
                      className="bg-slate-50/40 hover:bg-slate-50 border border-slate-150/65 rounded-2xl p-5 transition duration-150 flex flex-col justify-between hover:shadow-xs"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-xs font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-md">
                              {prob.id.replace("-", "")}
                            </span>
                            {prob.rating && (
                              <span className="text-[10px] font-mono font-bold bg-amber-55 text-amber-700 px-1.5 py-0.5 rounded-full border border-amber-100">
                                ★ {prob.rating}
                              </span>
                            )}
                            {prob.solved ? (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-md">
                                艰难AC (多轮OK)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 rounded-md animate-pulse">
                                ⚠️ 未破解 (WA残留)
                              </span>
                            )}
                          </div>

                          <div className="text-[10.5px] font-bold text-slate-400">
                            此前积挫 {prob.failedAttempts} 次
                          </div>
                        </div>

                        <h3
                          className="font-bold text-slate-800 text-sm mb-2 hover:text-amber-600 cursor-pointer line-clamp-1"
                          onClick={() => onSelectProblem({
                            contestId: prob.contestId,
                            index: prob.index,
                            name: prob.name,
                            rating: prob.rating,
                            tags: prob.tags
                          })}
                        >
                          {prob.name}
                        </h3>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mb-4">
                          {prob.tags.slice(0, 3).map((t) => (
                            <span key={t} className="text-[9px] text-slate-400 font-medium bg-white px-1.5 py-0.5 rounded-md border border-slate-100">
                              {translateTag(t)}
                            </span>
                          ))}
                        </div>

                        <div className="mt-2 text-xs bg-amber-50/50 border border-amber-100/50 rounded-xl p-3">
                          <span className="text-slate-600 block text-[11px] leading-relaxed">
                            {prob.solved ? (
                              <>
                                🎉 <strong>该用户在第 {prob.failedAttempts + 1} 次尝试</strong> 终于拿到 AC。建议在此归纳那次最终顿悟的核心解题模型，打牢基本功。
                              </>
                            ) : (
                              <>
                                ❌ <strong>该用户累计提交了 {prob.failedAttempts} 次</strong> 但仍全部报错 (WA/TLE等)。这通常代表思路有明显死角或代码边界存在严重不自洽，极其适合开启 AI 智能伴读。
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between text-[11px]">
                        <button
                          id={`archive-btn-${prob.id}`}
                          type="button"
                          onClick={() => handleArchiveToNotepad(prob)}
                          className={`px-2 py-1.5 font-bold rounded-lg transition duration-200 flex items-center gap-1 ${
                            alreadySaved 
                              ? "text-slate-450 bg-slate-100 cursor-not-allowed" 
                              : "text-indigo-600 hover:bg-indigo-50/60 bg-indigo-50/30 border border-indigo-100"
                          }`}
                          disabled={alreadySaved}
                        >
                          <BookMarked className="w-3.5 h-3.5" />
                          <span>{alreadySaved ? "已归纳在笔记本" : "一键加入归纳反思本"}</span>
                        </button>

                        <button
                          id={`action-auto-${prob.id}`}
                          type="button"
                          onClick={() => onSelectProblem({
                            contestId: prob.contestId,
                            index: prob.index,
                            name: prob.name,
                            rating: prob.rating,
                            tags: prob.tags
                          })}
                          className="text-amber-600 hover:text-amber-800 font-black inline-flex items-center gap-0.5 transition"
                        >
                          <span>思路辅读</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200/60 text-slate-400">
                <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-700">没有在此用户的提交历史中捕获到错题</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  这极其罕见！通常意味着该句柄在所有目前加载出的提交里全部都是一遍秒杀通关！或者您还没有执行任何用户句柄的搜索。
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
