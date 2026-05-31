export const TAG_TRANSLATIONS: Record<string, string> = {
  "greedy": "贪心",
  "dp": "动态规划",
  "math": "数学",
  "graphs": "图论",
  "data structures": "数据结构",
  "dfs and similar": "DFS与类似",
  "brute force": "暴力/穷举",
  "strings": "字符串",
  "constructive algorithms": "构造算法",
  "binary search": "二分查找",
  "trees": "树形结构",
  "sorting": "排序",
  "number theory": "数论",
  "geometry": "几何",
  "flows": "网络流",
  "combinatorics": "排列组合",
  "bitmasks": "位运算",
  "probabilities": "概率与期望",
  "shortest paths": "最短路",
  "two pointers": "双指针",
  "divide and conquer": "分治",
  "implementation": "模拟/实现",
  "matrices": "矩阵",
  "games": "博弈论",
  "dsu": "并查集",
  "meet-in-the-middle": "折半搜索",
  "ternary search": "三分查找",
  "string suffix structures": "后缀结构",
  "expression parsing": "表达式学析",
  "fft": "快速傅里叶变换",
  "graph matchings": "图匹配"
};

export interface CFRankTier {
  name: string;
  className: string;
  color: string;
  bgClass: string;
}

export function getRankTier(rating: number, rank: string = "", platform: string = "codeforces"): CFRankTier {
  const r = rank.toLowerCase();
  const pf = String(platform).toLowerCase();

  // 1. ATCODER
  if (pf === "atcoder") {
    if (rating >= 2800 || r.includes("red")) {
      return { name: rank || "Red (红名)", className: "text-rose-600 font-bold", color: "#E11D48", bgClass: "bg-rose-100 text-rose-800 border-rose-200" };
    }
    if (rating >= 2400 || r.includes("orange")) {
      return { name: rank || "Orange (橙名)", className: "text-orange-500 font-bold", color: "#F97316", bgClass: "bg-orange-100 text-orange-850 border-orange-200" };
    }
    if (rating >= 2000 || r.includes("yellow")) {
      return { name: rank || "Yellow (黄名)", className: "text-yellow-600 font-bold", color: "#CA8A04", bgClass: "bg-yellow-50 text-yellow-850 border-yellow-200" };
    }
    if (rating >= 1600 || r.includes("blue")) {
      return { name: rank || "Blue (蓝名)", className: "text-blue-600 font-bold", color: "#2563EB", bgClass: "bg-blue-105 text-blue-800 border-blue-200" };
    }
    if (rating >= 1200 || r.includes("cyan")) {
      return { name: rank || "Cyan (青名)", className: "text-cyan-600 font-bold", color: "#0891B2", bgClass: "bg-cyan-100 text-cyan-850 border-cyan-200" };
    }
    if (rating >= 800 || r.includes("green")) {
      return { name: rank || "Green (绿名)", className: "text-emerald-600 font-bold", color: "#059669", bgClass: "bg-emerald-100 text-emerald-850 border-emerald-200" };
    }
    if (rating >= 400 || r.includes("brown")) {
      return { name: rank || "Brown (褐名)", className: "text-amber-800 font-bold", color: "#78350F", bgClass: "bg-amber-100 text-amber-900 border-amber-200" };
    }
    return { name: rank || "Gray (灰名)", className: "text-slate-400 font-bold", color: "#64748B", bgClass: "bg-slate-100 text-slate-600 border-slate-200" };
  }

  // 2. LUOGU
  if (pf === "luogu") {
    if (rating >= 2100 || r.includes("红") || r.includes("red") || r.includes("purple") || r.includes("紫")) {
      return { name: rank || "神犇级大师", className: "text-rose-600 font-bold", color: "#E11D48", bgClass: "bg-rose-100 text-rose-800 border-rose-200" };
    }
    if (rating >= 1700 || r.includes("橙") || r.includes("orange")) {
      return { name: rank || "大牛级精英", className: "text-orange-500 font-bold", color: "#F97316", bgClass: "bg-orange-100 text-orange-850 border-orange-200" };
    }
    if (rating >= 1400 || r.includes("绿") || r.includes("green")) {
      return { name: rank || "大犇级大师", className: "text-emerald-600 font-bold", color: "#059669", bgClass: "bg-emerald-100 text-emerald-850 border-emerald-250" };
    }
    if (rating >= 1100 || r.includes("蓝") || r.includes("blue")) {
      return { name: rank || "资深大犇", className: "text-blue-500 font-bold", color: "#3B82F6", bgClass: "bg-blue-100 text-blue-800 border-blue-200" };
    }
    return { name: rank || "咸鱼玩家", className: "text-slate-400 font-bold", color: "#64748B", bgClass: "bg-slate-100 text-slate-600 border-slate-200" };
  }

  // 3. NOWCODER
  if (pf === "nowcoder") {
    if (rating >= 2200 || r.includes("钻石")) {
      return { name: rank || "钻石大师", className: "text-fuchsia-600 font-bold", color: "#C026D3", bgClass: "bg-fuchsia-100 text-fuchsia-850 border-fuchsia-200" };
    }
    if (rating >= 1900 || r.includes("白金")) {
      return { name: rank || "白金大师", className: "text-indigo-600 font-bold", color: "#4F46E5", bgClass: "bg-indigo-100 text-indigo-850 border-indigo-200" };
    }
    if (rating >= 1600 || r.includes("黄金")) {
      return { name: rank || "黄金专家", className: "text-amber-600 font-bold", color: "#D97706", bgClass: "bg-amber-105 text-amber-850 border-amber-200" };
    }
    if (rating >= 1300 || r.includes("白银")) {
      return { name: rank || "白银游侠", className: "text-slate-600 font-bold", color: "#475569", bgClass: "bg-slate-100 text-slate-800 border-slate-250" };
    }
    if (rating >= 1000 || r.includes("青铜")) {
      return { name: rank || "青铜先锋", className: "text-amber-800 font-bold", color: "#92400E", bgClass: "bg-amber-100 text-amber-900 border-amber-200" };
    }
    return { name: rank || "萌新学员", className: "text-slate-400 font-bold", color: "#64748B", bgClass: "bg-slate-100 text-slate-600 border-slate-200" };
  }

  // 4. CODEFORCES (Default)
  if (rating >= 2400 || r.includes("grandmaster")) {
    return { name: "Grandmaster (红魔)", className: "text-red-500 font-bold", color: "#FF0000", bgClass: "bg-red-500/10 text-red-500 border-red-500/20" };
  }
  if (rating >= 2100 || r.includes("master")) {
    return { name: "Master (大师)", className: "text-orange-500 font-bold", color: "#FF8C00", bgClass: "bg-orange-500/10 text-orange-500 border-orange-500/20" };
  }
  if (rating >= 1900 || r.includes("candidate master")) {
    return { name: "Candidate Master (候补大师)", className: "text-purple-500 font-bold", color: "#AA00AA", bgClass: "bg-purple-500/10 text-purple-500 border-purple-500/20" };
  }
  if (rating >= 1600 || r.includes("expert")) {
    return { name: "Expert (专家)", className: "text-blue-500 font-bold", color: "#0000FF", bgClass: "bg-blue-500/10 text-blue-500 border-blue-500/20" };
  }
  if (rating >= 1400 || r.includes("specialist")) {
    return { name: "Specialist (专家助理)", className: "text-cyan-500 font-bold", color: "#03A89E", bgClass: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20" };
  }
  if (rating >= 1200 || r.includes("pupil")) {
    return { name: "Pupil (学生)", className: "text-green-500 font-bold", color: "#008000", bgClass: "bg-green-500/10 text-green-500 border-green-500/20" };
  }
  return { name: "Newbie (新手)", className: "text-gray-400 font-bold", color: "#808080", bgClass: "bg-gray-400/10 text-gray-400 border-gray-400/20" };
}

// Map Codeforces API raw tag list into sorted array
export function translateTag(tag: string): string {
  return TAG_TRANSLATIONS[tag.toLowerCase()] || tag;
}

// Build standard list fields for rating suggestions
export const RECOMMEND_LEVELS = [
  { id: "newbie", name: "Newbie 刷题包", min: 800, max: 1199, desc: "初学者必刷，熟悉基本语法与模拟逻辑" },
  { id: "pupil", name: "Pupil 晋级包", min: 1200, max: 1399, desc: "基础贪心、排序、二分与简单数论" },
  { id: "specialist", name: "Specialist 大礼包", min: 1400, max: 1599, desc: "DFS/BFS、简单动态规划、常用数据结构" },
  { id: "expert", name: "Expert 突破包", min: 1600, max: 1899, desc: "树状DP、区间DP、中级图论、哈希与字符串" },
  { id: "master", name: "Master 巅峰挑战", min: 1900, max: 2400, desc: "高级数论、复杂图匹配、网络流以及重构树" },
];

export function getProblemUrl(platform: string, contestId?: string | number, index?: string): string {
  const pf = String(platform).toLowerCase();
  const cid = contestId ? String(contestId) : "";
  const idx = index ? String(index) : "";

  if (pf === "atcoder") {
    return `https://atcoder.jp/contests/${cid}/tasks/${cid}_${idx.toLowerCase()}`;
  }
  if (pf === "luogu") {
    return `https://www.luogu.com.cn/problem/${idx}`;
  }
  if (pf === "nowcoder") {
    const cleanIdx = idx.replace(/^NC/i, "");
    return `https://ac.nowcoder.com/acm/problem/${cleanIdx}`;
  }
  return `https://codeforces.com/problemset/problem/${cid}/${idx}`;
}


