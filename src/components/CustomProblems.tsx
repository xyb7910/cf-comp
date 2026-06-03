import React, { useState, useMemo } from "react";
import { Search, Plus, Trash2, Edit3, Save, X, Tag, Star, Calendar, CheckCircle2, Link, Loader2 } from "lucide-react";

interface CustomProblem {
  id: string;
  title: string;
  index: string;
  contestId?: number;
  tags: string[];
  rating?: number;
  difficulty: "入门" | "基础" | "进阶" | "困难";
  notes?: string;
  createdAt: number;
  solvedAt?: number;
  solved: boolean;
}

const ALGORITHM_TAGS = [
  "动态规划", "贪心", "搜索", "图论", "数据结构",
  "字符串", "数学", "计算几何", "模拟", "递归",
  "二分", "分治", "哈希", "堆", "队列"
];

const DIFFICULTY_OPTIONS = [
  { value: "入门", color: "bg-emerald-100 text-emerald-700", border: "border-emerald-200" },
  { value: "基础", color: "bg-blue-100 text-blue-700", border: "border-blue-200" },
  { value: "进阶", color: "bg-amber-100 text-amber-700", border: "border-amber-200" },
  { value: "困难", color: "bg-rose-100 text-rose-700", border: "border-rose-200" },
];

export default function CustomProblems({ onProblemsChange }: { onProblemsChange?: (problems: any[]) => void }) {
  const [problems, setProblems] = useState<CustomProblem[]>(() => {
    const saved = localStorage.getItem("cf_custom_problems");
    return saved ? JSON.parse(saved) : [];
  });
  
  const [customTags, setCustomTags] = useState<string[]>(() => {
    const saved = localStorage.getItem("cf_custom_tags");
    return saved ? JSON.parse(saved) : [];
  });
  
  const allTags = useMemo(() => {
    return [...new Set([...ALGORITHM_TAGS, ...customTags])];
  }, [customTags]);
  
  const [newCustomTag, setNewCustomTag] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("全部");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("全部");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [problemUrl, setProblemUrl] = useState("");
  const [parsingUrl, setParsingUrl] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newIndex, setNewIndex] = useState("");
  const [newTags, setNewTags] = useState<string[]>([]);
  const [newRating, setNewRating] = useState<string>("");
  const [newDifficulty, setNewDifficulty] = useState<"入门" | "基础" | "进阶" | "困难">("基础");
  const [newNotes, setNewNotes] = useState("");

  const [editTitle, setEditTitle] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editDifficulty, setEditDifficulty] = useState<"入门" | "基础" | "进阶" | "困难">("基础");
  const [editNotes, setEditNotes] = useState("");
  const [editRating, setEditRating] = useState<string>("");

  const parseProblemUrl = async () => {
    if (!problemUrl.trim()) {
      setParseError("请输入题目链接");
      return;
    }

    setParsingUrl(true);
    setParseError(null);

    try {
      let contestId: number | undefined;
      let index: string = "";

      const codeforcesMatch = problemUrl.match(/codeforces\.com\/contest\/(\d+)\/problem\/([A-Za-z0-9]+)/);
      if (codeforcesMatch) {
        contestId = parseInt(codeforcesMatch[1]);
        index = codeforcesMatch[2];
      }

      const codeforcesProblemsetMatch = problemUrl.match(/codeforces\.com\/problemset\/problem\/(\d+)\/([A-Za-z0-9]+)/);
      if (codeforcesProblemsetMatch) {
        contestId = parseInt(codeforcesProblemsetMatch[1]);
        index = codeforcesProblemsetMatch[2];
      }

      const atcoderMatch = problemUrl.match(/atcoder\.jp\/contests\/([a-z0-9]+)\/tasks\/([a-z0-9_]+)/);
      if (atcoderMatch) {
        index = atcoderMatch[2].toUpperCase();
      }

      if (!index) {
        setParseError("无法识别的题目链接，请输入有效的 Codeforces 或 AtCoder 链接");
        setParsingUrl(false);
        return;
      }

      if (contestId) {
        setNewIndex(`${contestId}${index}`);
      } else {
        setNewIndex(index);
      }

      if (contestId) {
        if (index === "A" || index === "A1" || index === "A2") {
          setNewDifficulty("入门");
        } else if (index === "B" || index === "B1" || index === "B2") {
          setNewDifficulty("基础");
        } else if (index === "C" || index === "C1" || index === "C2" || index === "D" || index === "D1" || index === "D2") {
          setNewDifficulty("进阶");
        } else {
          setNewDifficulty("困难");
        }
      }

      if (contestId) {
        try {
          const response = await fetch(`/api/problemset-problems?platform=codeforces`);
          if (response.ok) {
            const data = await response.json();
            if (data.result?.problems) {
              const problem = data.result.problems.find(
                (p: any) => p.contestId === contestId && p.index === index
              );
              if (problem) {
                setNewTitle(problem.name);
                if (problem.rating) {
                  setNewRating(problem.rating.toString());
                  if (problem.rating <= 1200) {
                    setNewDifficulty("入门");
                  } else if (problem.rating <= 1600) {
                    setNewDifficulty("基础");
                  } else if (problem.rating <= 2000) {
                    setNewDifficulty("进阶");
                  } else {
                    setNewDifficulty("困难");
                  }
                }
                if (problem.tags) {
                  const translatedTags = problem.tags.map((t: string) => translateTag(t));
                  setNewTags(translatedTags.filter((t: string) => ALGORITHM_TAGS.includes(t)));
                }
              }
            }
          }
        } catch (err) {
        }
      }

      if (!newTitle) {
        setNewTitle(`题目 ${newIndex}`);
      }

    } catch (err) {
      setParseError("解析链接时出错，请检查链接格式");
    } finally {
      setParsingUrl(false);
    }
  };

  const translateTag = (tag: string): string => {
    const tagMap: Record<string, string> = {
      "dp": "动态规划",
      "greedy": "贪心",
      "search": "搜索",
      "graphs": "图论",
      "data structures": "数据结构",
      "strings": "字符串",
      "math": "数学",
      "geometry": "计算几何",
      "implementation": "模拟",
      "recursion": "递归",
      "binary search": "二分",
      "divide and conquer": "分治",
      "hashing": "哈希",
      "heap": "堆",
      "queues": "队列",
    };
    return tagMap[tag] || tag;
  };

  const saveToStorage = (newProblems: CustomProblem[]) => {
    setProblems(newProblems);
    localStorage.setItem("cf_custom_problems", JSON.stringify(newProblems));
    if (onProblemsChange) {
      onProblemsChange(newProblems);
    }
  };

  const filteredProblems = useMemo(() => {
    return problems.filter(p => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!p.title.toLowerCase().includes(term) &&
            !p.index.toLowerCase().includes(term) &&
            !p.tags.some(t => t.toLowerCase().includes(term))) {
          return false;
        }
      }
      if (selectedTag !== "全部" && !p.tags.includes(selectedTag)) {
        return false;
      }
      if (selectedDifficulty !== "全部" && p.difficulty !== selectedDifficulty) {
        return false;
      }
      return true;
    });
  }, [problems, searchTerm, selectedTag, selectedDifficulty]);

  const handleAddTag = (tag: string) => {
    if (!newTags.includes(tag)) {
      setNewTags([...newTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    const trimmedTag = newCustomTag.trim();
    if (!trimmedTag) return;
    
    if (customTags.includes(trimmedTag)) {
      alert("该标签已存在");
      return;
    }
    
    const updatedCustomTags = [...customTags, trimmedTag];
    setCustomTags(updatedCustomTags);
    localStorage.setItem("cf_custom_tags", JSON.stringify(updatedCustomTags));
    
    handleAddTag(trimmedTag);
    setNewCustomTag("");
  };

  const handleRemoveTag = (tag: string) => {
    setNewTags(newTags.filter(t => t !== tag));
  };

  const handleAddProblem = () => {
    if (!newTitle.trim() || !newIndex.trim()) return;

    const newProblem: CustomProblem = {
      id: `custom-${Date.now()}`,
      title: newTitle.trim(),
      index: newIndex.trim(),
      tags: newTags,
      rating: newRating ? parseInt(newRating) : undefined,
      difficulty: newDifficulty,
      notes: newNotes.trim(),
      createdAt: Date.now(),
      solved: false,
    };

    saveToStorage([newProblem, ...problems]);
    resetForm();
  };

  const resetForm = () => {
    setNewTitle("");
    setNewIndex("");
    setNewTags([]);
    setNewRating("");
    setNewDifficulty("基础");
    setNewNotes("");
    setShowAddForm(false);
    setProblemUrl("");
    setParseError(null);
    setNewCustomTag("");
  };

  const handleDelete = (id: string) => {
    if (confirm("确定删除这道题目吗？")) {
      saveToStorage(problems.filter(p => p.id !== id));
    }
  };

  const handleToggleSolved = (id: string) => {
    saveToStorage(problems.map(p => {
      if (p.id === id) {
        return {
          ...p,
          solved: !p.solved,
          solvedAt: !p.solved ? Date.now() : undefined,
        };
      }
      return p;
    }));
  };

  const startEditing = (p: CustomProblem) => {
    setEditingId(p.id);
    setEditTitle(p.title);
    setEditTags(p.tags);
    setEditDifficulty(p.difficulty);
    setEditNotes(p.notes || "");
    setEditRating(p.rating?.toString() || "");
  };

  const handleSaveEdit = () => {
    if (!editingId) return;

    saveToStorage(problems.map(p => {
      if (p.id === editingId) {
        return {
          ...p,
          title: editTitle.trim(),
          tags: editTags,
          rating: editRating ? parseInt(editRating) : undefined,
          difficulty: editDifficulty,
          notes: editNotes.trim(),
        };
      }
      return p;
    }));

    setEditingId(null);
  };

  const getDifficultyStyle = (difficulty: string) => {
    const found = DIFFICULTY_OPTIONS.find(d => d.value === difficulty);
    return found ? { bg: found.color, border: found.border } : { bg: "bg-slate-100", border: "border-slate-200" };
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              我的自定义题库
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              共 <strong className="text-slate-700">{problems.length}</strong> 道自定义题目，
              已完成 <strong className="text-emerald-600">{problems.filter(p => p.solved).length}</strong> 道
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              {showAddForm ? "取消添加" : "添加新题目"}
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6">
            <h3 className="text-sm font-bold text-slate-800 mb-4">添加新题目</h3>

            <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200">
              <label className="block text-xs font-medium text-slate-600 mb-2 flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5" />
                通过题目链接自动获取（可选）
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={problemUrl}
                  onChange={(e) => {
                    setProblemUrl(e.target.value);
                    setParseError(null);
                  }}
                  placeholder="粘贴 Codeforces 或 AtCoder 题目链接..."
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={parseProblemUrl}
                  disabled={parsingUrl}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-sm font-medium rounded-lg flex items-center gap-1.5 transition"
                >
                  {parsingUrl ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Link className="w-3.5 h-3.5" />
                  )}
                  {parsingUrl ? "解析中..." : "解析链接"}
                </button>
              </div>
              {parseError && (
                <p className="text-xs text-rose-600 mt-2 flex items-center gap-1">
                  <X className="w-3 h-3" />
                  {parseError}
                </p>
              )}
              <p className="text-[10px] text-slate-400 mt-2">
                支持链接示例: 
                https://codeforces.com/contest/1923/problem/C · 
                https://atcoder.jp/contests/abc342/tasks/abc342_a
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">题目名称 *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="例如: 最长递增子序列"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">题目编号</label>
                <input
                  type="text"
                  value={newIndex}
                  onChange={(e) => setNewIndex(e.target.value)}
                  placeholder="例如: 1923C"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">难度等级</label>
                <select
                  value={newDifficulty}
                  onChange={(e) => setNewDifficulty(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                >
                  <option value="入门">入门</option>
                  <option value="基础">基础</option>
                  <option value="进阶">进阶</option>
                  <option value="困难">困难</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">难度评分 (可选)</label>
                <input
                  type="number"
                  value={newRating}
                  onChange={(e) => setNewRating(e.target.value)}
                  placeholder="例如: 1200"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-600 mb-2">算法标签 (点击添加)</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddTag(tag)}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition ${
                      newTags.includes(tag)
                        ? "bg-amber-100 text-amber-700 border-amber-300"
                        : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCustomTag}
                  onChange={(e) => setNewCustomTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCustomTag()}
                  placeholder="输入自定义标签后按回车..."
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  disabled={!newCustomTag.trim()}
                  className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  添加
                </button>
              </div>
              {newTags.length > 0 && (
                <div className="mt-2 text-xs text-slate-500">
                  已选: {newTags.join(", ")}
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-600 mb-1">备注说明</label>
              <textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="记录解题思路或关键点..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 h-20"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleAddProblem}
                disabled={!newTitle.trim() || !newIndex.trim()}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg text-xs transition disabled:opacity-50 flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                保存题目
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索题目名称或编号..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
            />
          </div>

          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
          >
            <option value="全部">全部标签</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
          >
            <option value="全部">全部难度</option>
            <option value="入门">入门</option>
            <option value="基础">基础</option>
            <option value="进阶">进阶</option>
            <option value="困难">困难</option>
          </select>
        </div>

        {filteredProblems.length > 0 ? (
          <div className="space-y-3">
            {filteredProblems.map(prob => {
              const difficultyStyle = getDifficultyStyle(prob.difficulty);
              const isEditing = editingId === prob.id;

              return (
                <div
                  key={prob.id}
                  className={`border rounded-xl p-4 transition ${
                    prob.solved
                      ? "bg-emerald-50/50 border-emerald-200"
                      : "bg-white border-slate-100 hover:border-slate-200"
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                      />
                      <div className="flex gap-2">
                        <select
                          value={editDifficulty}
                          onChange={(e) => setEditDifficulty(e.target.value as any)}
                          className="px-2 py-1 text-xs border border-slate-200 rounded"
                        >
                          <option value="入门">入门</option>
                          <option value="基础">基础</option>
                          <option value="进阶">进阶</option>
                          <option value="困难">困难</option>
                        </select>
                        <input
                          type="number"
                          value={editRating}
                          onChange={(e) => setEditRating(e.target.value)}
                          placeholder="评分"
                          className="px-2 py-1 text-xs border border-slate-200 rounded w-20"
                        />
                      </div>
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg h-16"
                        placeholder="备注"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded"
                        >
                          取消
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1 text-xs bg-emerald-500 text-white rounded"
                        >
                          保存
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {prob.index && (
                            <span className="font-mono text-xs font-bold bg-slate-150 text-slate-600 px-2 py-0.5 rounded">
                              {prob.index}
                            </span>
                          )}
                          {prob.rating && (
                            <span className="text-[10px] font-bold text-amber-600">
                              ★ {prob.rating}
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${difficultyStyle.bg} ${difficultyStyle.border}`}>
                            {prob.difficulty}
                          </span>
                          {prob.solved && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">
                              ✓ 已完成
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleSolved(prob.id)}
                            className={`p-1.5 rounded-lg transition ${
                              prob.solved
                                ? "text-emerald-600 hover:bg-emerald-50"
                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                            }`}
                            title={prob.solved ? "标记为未完成" : "标记为已完成"}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => startEditing(prob)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(prob.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <h3 className="font-bold text-slate-800 text-sm mb-2">{prob.title}</h3>

                      {prob.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {prob.tags.map(tag => (
                            <span key={tag} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Tag className="w-2.5 h-2.5" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {prob.notes && (
                        <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded mt-2">
                          {prob.notes}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          创建于 {new Date(prob.createdAt).toLocaleDateString("zh-CN")}
                        </span>
                        {prob.solvedAt && (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 className="w-3 h-3" />
                            完成于 {new Date(prob.solvedAt).toLocaleDateString("zh-CN")}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Star className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">还没有自定义题目</h4>
            <p className="text-xs text-slate-400 mt-1">
              点击上方"添加新题目"开始创建你的专属题库！
            </p>
          </div>
        )}
      </div>
    </div>
  );
}