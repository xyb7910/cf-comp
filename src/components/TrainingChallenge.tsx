import React, { useState, useEffect, useMemo } from "react";
import { RECOMMEND_LEVELS, translateTag } from "../utils";
import { CFProblem, CFSubmission, TrainingPlan } from "../types";
import { useAuth } from "../context/AuthContext";
import { 
  Sparkles, 
  Trophy, 
  Plus, 
  Target, 
  CheckCircle, 
  Flame, 
  Calendar, 
  Trash2, 
  GraduationCap, 
  Award, 
  Layers, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BookOpen,
  Zap, 
  Compass, 
  CheckCircle2, 
  BookmarkCheck,
  TrendingUp,
  Inbox,
  Star,
  Tag
} from "lucide-react";

interface TrainingChallengeProps {
  submissions: CFSubmission[];
  problems: CFProblem[];
  platform?: "codeforces" | "atcoder" | "luogu" | "nowcoder";
}

// 国内信息学竞赛训练题单配置
const DOMESTIC_CONTEST_PLANS = [
  {
    id: "csp-j",
    title: "CSP-J 入门级训练题单",
    subtitle: "面向初中级选手的入门竞赛训练",
    description: "CSP-J（普及组）是面向初中生的入门级信息学竞赛，重点训练基础算法与程序设计能力。",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    gradient: "from-blue-400 to-blue-600",
    targetRating: 1400,
    tags: ["implementation", "brute force", "sorting", "binary search", "greedy", "math"],
    targetCount: 30,
    topics: ["基础模拟", "暴力搜索", "排序算法", "二分查找", "贪心算法", "初等数论"]
  },
  {
    id: "csp-s",
    title: "CSP-S 提高级训练题单",
    subtitle: "面向高中级选手的提高竞赛训练",
    description: "CSP-S（提高组）是面向高中生的提高级竞赛，重点训练树图算法、动态规划等核心能力。",
    badgeColor: "bg-green-50 text-green-700 border-green-200",
    gradient: "from-green-400 to-emerald-600",
    targetRating: 1800,
    tags: ["dp", "dfs and similar", "graphs", "data structures", "trees"],
    targetCount: 25,
    topics: ["动态规划", "深广搜索", "图论基础", "基础数据结构", "树结构"]
  },
  {
    id: "noip",
    title: "NOIP 全国联赛训练题单",
    subtitle: "NOIP 全国青少年信息学奥林匹克联赛冲刺训练",
    description: "NOIP 是全国性信息学奥赛，需要全面的算法知识与解题技巧，适合省赛及更高水平选手。",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    gradient: "from-amber-400 to-orange-600",
    targetRating: 2100,
    tags: ["dp", "graphs", "trees", "data structures", "combinatorics", "flows"],
    targetCount: 20,
    topics: ["高级动态规划", "复杂图论", "高级数据结构", "组合数学", "网络流基础"]
  },
  {
    id: "domestic-training",
    title: "国内赛事综合训练题单",
    subtitle: "全面覆盖国内信息学竞赛常考题型",
    description: "针对 CSP、NOIP 等国内赛事的综合训练计划，涵盖各类高频考点与经典题型。",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    gradient: "from-purple-400 to-indigo-600",
    targetRating: 1600,
    tags: ["implementation", "dp", "greedy", "math", "graphs", "data structures"],
    targetCount: 40,
    topics: ["全算法体系", "经典题型", "高频考点", "赛前冲刺"]
  }
];

// Global static syllabus data representation of Novice-To-Master System (从新手到大师的算法体系大纲)
const SYLLABUS_STAGES = [
  {
    id: "stage-1",
    stageNum: 1,
    levelName: "Stage 1: 筑基起步 (Beginner)",
    subtitle: "语法基础与工程模拟专项突破",
    badgeColor: "bg-slate-50 text-slate-700 border-slate-205",
    gradient: "from-slate-500 to-slate-700",
    glowColor: "group-hover:shadow-slate-300/30",
    desc: "算法底层基石。重点在快速且无疏漏地把头脑中的模拟思路翻译为高品质的代码，摆脱「脑子懂逻辑、一写就报错」的实战瓶颈。",
    topics: ["高频模拟 (implementation)", "暴力穷举 (brute force)", "基础排序/哈希 (sorting)", "表达式解析 (expression parsing)"],
    platforms: {
      codeforces: "★ 800 - 1100 (Newbie级)",
      atcoder: "ABC A / B (Gray 灰名)",
      luogu: "洛谷 入门 / 普及- 题阶",
      nowcoder: "牛客 青铜到白银级"
    },
    // Filter to count actual user submissions falling inside this Stage
    filter: (prob: any) => {
      const r = prob.rating;
      if (r !== undefined && r >= 800 && r <= 1199) return true;
      const tags = prob.tags || [];
      return tags.some((t: string) => ["implementation", "brute force", "sorting"].includes(t.toLowerCase()));
    },
    targetCount: 15,
    suggestedRating: 1000,
    suggestedTag: "implementation"
  },
  {
    id: "stage-2",
    stageNum: 2,
    levelName: "Stage 2: 渐入佳境 (Novice)",
    subtitle: "高频竞赛思维与策略构造",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    gradient: "from-emerald-500 to-teal-605",
    glowColor: "group-hover:shadow-emerald-300/30",
    desc: "初学与中阶分水岭。重点在于摆脱公式教条，培养对最优决策问题的贪心直觉，学会推导精妙的数学性质并利用二分查找快速收敛解空间。",
    topics: ["高效贪心 (greedy)", "构造性质 (constructive algorithms)", "二分答案 (binary search)", "初等数论 (number theory)"],
    platforms: {
      codeforces: "★ 1200 - 1399 (Pupil级)",
      atcoder: "ABC C (Brown 褐名)",
      luogu: "洛谷 普及 / 提高- 题阶",
      nowcoder: "牛客 黄金专家级"
    },
    filter: (prob: any) => {
      const r = prob.rating;
      if (r !== undefined && r >= 1200 && r <= 1399) return true;
      const tags = prob.tags || [];
      return tags.some((t: string) => ["greedy", "constructive algorithms", "binary search", "number theory"].includes(t.toLowerCase()));
    },
    targetCount: 25,
    suggestedRating: 1200,
    suggestedTag: "greedy"
  },
  {
    id: "stage-3",
    stageNum: 3,
    levelName: "Stage 3: 登堂入室 (Specialist)",
    subtitle: "经典算法、深度状态空间与树图基础",
    badgeColor: "bg-cyan-50 text-cyan-750 border-cyan-200",
    gradient: "from-cyan-500 to-blue-600",
    glowColor: "group-hover:shadow-cyan-300/30",
    desc: "核心中级算法。攻克树与图的深度优先 (DFS)/广度优先 (BFS) 基础遍历，深入探索状态转移空间 DP，并熟练运用并查集进行动态合并规划。",
    topics: ["状态动态规划 (dp)", "深广度优先遍历 (dfs and similar)", "基础并查集/树 (data structures)", "树图结构 (graphs)"],
    platforms: {
      codeforces: "★ 1400 - 1599 (Specialist)",
      atcoder: "ABC D (Cyan 青名)",
      luogu: "洛谷 普及+ / 提高 题阶",
      nowcoder: "牛客 白金专家级"
    },
    filter: (prob: any) => {
      const r = prob.rating;
      if (r !== undefined && r >= 1400 && r <= 1599) return true;
      const tags = prob.tags || [];
      return tags.some((t: string) => ["dp", "dfs and similar", "data structures", "graphs"].includes(t.toLowerCase()));
    },
    targetCount: 35,
    suggestedRating: 1400,
    suggestedTag: "dp"
  },
  {
    id: "stage-4",
    stageNum: 4,
    levelName: "Stage 4: 破壁跃迁 (Expert)",
    subtitle: "高维树图结构、复杂优化与区间动态规划",
    badgeColor: "bg-indigo-50 text-indigo-705 border-indigo-200",
    gradient: "from-indigo-500 to-violet-600",
    glowColor: "group-hover:shadow-indigo-300/30",
    desc: "破壁跨越核心。掌握图论拓扑与连通分量，在高级区间/树形/状压 DP 中游刃有余。熟练使用线段树/树状数组进行动态极速维护。",
    topics: ["高阶树结构 (trees)", "线段树/树状数组 (data structures)", "组合数学 (combinatorics)", "连通最短路 (shortest paths)"],
    platforms: {
      codeforces: "★ 1600 - 1899 (Expert级)",
      atcoder: "ABC E / F (Blue 蓝名)",
      luogu: "洛谷 提高+ / 省选- 题阶",
      nowcoder: "牛客 钻石段位"
    },
    filter: (prob: any) => {
      const r = prob.rating;
      if (r !== undefined && r >= 1600 && r <= 1899) return true;
      const tags = prob.tags || [];
      return tags.some((t: string) => ["trees", "strings", "combinatorics", "shortest paths", "bitmasks"].includes(t.toLowerCase()));
    },
    targetCount: 40,
    suggestedRating: 1700,
    suggestedTag: "trees"
  },
  {
    id: "stage-5",
    stageNum: 5,
    levelName: "Stage 5: 登峰造极 (Master)",
    subtitle: "极限匹配流、分治莫队与后缀精妙结构",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-250",
    gradient: "from-rose-500 to-pink-600",
    glowColor: "group-hover:shadow-rose-300/30",
    desc: "神魔顶峰极难课。探索国家队与ICPC高频极限界，囊括网络大流、后缀自动机(SAM)、复杂的期望概率递推、高级博弈推论与计算几何。",
    topics: ["网络最大流/割 (flows)", "后缀结构 (string suffix structures)", "计算几何 (geometry)", "概率期望DP (probabilities)"],
    platforms: {
      codeforces: "★ 1900 - 2400 (Master级)",
      atcoder: "AGC / Yellow / Orange",
      luogu: "洛谷 省选 / NOI 题阶",
      nowcoder: "牛客 钻石大师及以上"
    },
    filter: (prob: any) => {
      const r = prob.rating;
      if (r !== undefined && r >= 1900 && r <= 2400) return true;
      const tags = prob.tags || [];
      return tags.some((t: string) => ["flows", "string suffix structures", "geometry", "probabilities", "games"].includes(t.toLowerCase()));
    },
    targetCount: 15,
    suggestedRating: 2000,
    suggestedTag: "flows"
  }
];

export default function TrainingChallenge({ submissions, problems = [], platform = "codeforces" }: TrainingChallengeProps) {
  const { token, isAuthenticated } = useAuth();
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [targetRating, setTargetRating] = useState<number>(1400);
  const [targetTag, setTargetTag] = useState<string>("greedy");
  const [customTitle, setCustomTitle] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selected Problem Keys for each training plan, matching user's dropdown display requirement
  const [selectedProblemKeys, setSelectedProblemKeys] = useState<Record<string, string>>({});

  // Expanded Active Goal ID to show recommendations (retained for backward compatibility or general navigation)
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  // Expanded tags for accordion (blinds) style display
  const [expandedTags, setExpandedTags] = useState<Record<string, Set<string>>>({});

  // Backend problems data (按标签分类的题目数据)
  const [backendProblemsByPlan, setBackendProblemsByPlan] = useState<Record<string, {
    plan_id: string;
    plan_title: string;
    target_rating: number;
    total_problems: number;
    completed_count: number;
    tags_order: string[];
    problems_by_tag: Record<string, any[]>;
  }>>({});

  // Fetch problems from backend for a specific plan
  const fetchBackendProblems = async (planId: string) => {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/training-plans/${planId}/problems_by_tag/`, {
        headers,
      });
      
      if (response.ok) {
        const data = await response.json();
        setBackendProblemsByPlan(prev => ({
          ...prev,
          [planId]: data
        }));
      }
    } catch (error) {
      console.error('Failed to fetch backend problems:', error);
    }
  };

  // Fetch problems for all backend plans
  useEffect(() => {
    // Fetch problems for ALL plans from backend (both presets and user-created)
    plans.forEach(plan => {
      // For user-created plans or preset plans, try to fetch problems from backend
      // We'll let the backend return 404 if it doesn't exist, which is fine
      fetchBackendProblems(plan.id);
    });
  }, [plans, token]);

  // Fetch training plans from backend
  const fetchBackendPlans = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/training-plans/', {
        headers,
      });
      
      if (response.ok) {
        const data = await response.json();
        // Handle both cases: direct array or paginated response
        const plansData = Array.isArray(data) ? data : (data.results || []);
        
        // Convert backend format to frontend format
        const backendPlans: TrainingPlan[] = plansData.map((p: any) => ({
          id: p.id,
          title: p.title,
          targetRating: p.target_rating,
          tags: p.tags || [],
          createdAt: new Date(p.created_at).getTime(),
          completed: p.completed
        }));
        
        // Merge with local plans (keep user-created plans)
        setPlans(prevPlans => {
          // Keep plans that have user-created tag (not from backend)
          const userPlans = prevPlans.filter(p => !p.id.startsWith('csp-') && !p.id.startsWith('noip') && !p.id.startsWith('domestic') && !p.id.startsWith('stage-'));
          
          // Merge: backend plans + user plans
          const merged = [...backendPlans];
          userPlans.forEach(up => {
            if (!merged.some(mp => mp.id === up.id)) {
              merged.push(up);
            }
          });
          
          return merged;
        });
      }
    } catch (error) {
      console.error('Failed to fetch backend plans:', error);
    }
  };

  // Load plans from local storage and backend
  useEffect(() => {
    const saved = localStorage.getItem("cf_training_plans");
    if (saved) {
      try {
        setPlans(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    } else {
      // Default initial booster plans
      const initial: TrainingPlan[] = [
        { id: "1", title: "初级算法突围：贪心专项突破", targetRating: 1200, tags: ["greedy"], createdAt: Date.now(), completed: false },
        { id: "2", title: "中级跃迁：动态规划核心强化", targetRating: 1500, tags: ["dp"], createdAt: Date.now() - 3600000, completed: false }
      ];
      setPlans(initial);
      localStorage.setItem("cf_training_plans", JSON.stringify(initial));
    }
  }, []);
  
  // Fetch from backend when token changes
  useEffect(() => {
    if (token || isAuthenticated === false) {
      fetchBackendPlans();
    }
  }, [token, isAuthenticated]);

  // Saved AC problems key identifiers helper
  const solvedProblemSet = useMemo(() => {
    const solved = new Set<string>();
    submissions.forEach(sub => {
      if (sub.verdict === "OK" && sub.problem) {
        const probId = `${sub.problem.contestId || ""}-${sub.problem.index}`;
        solved.add(probId);
      }
    });
    return solved;
  }, [submissions]);
  const attemptedProblemSet = useMemo(() => {
    const attempted = new Set<string>();
    submissions.forEach(sub => {
      if (sub.problem) {
        const probId = `${sub.problem.contestId || ""}-${sub.problem.index}`;
        if (!solvedProblemSet.has(probId)) {
          attempted.add(probId);
        }
      }
    });
    return attempted;
  }, [submissions, solvedProblemSet]);

  // Derive matching problems for each subscription plan, sorting unsolved ones on top!
  const matchingProblemsByPlan = useMemo(() => {
    if (!problems || problems.length === 0) return {};

    const res: Record<string, CFProblem[]> = {};
    plans.forEach(plan => {
      const filtered = problems.filter(prob => {
        // Rating matches targetRange: plan.targetRating +/- 200
        const matchesRating = prob.rating !== undefined && 
          prob.rating >= (plan.targetRating - 200) && 
          prob.rating <= (plan.targetRating + 100);

        // Tags match: either no tags requested, or contains any of the plan tags
        const matchesTags = plan.tags.length === 0 || plan.tags.some(t => prob.tags?.includes(t));

        return matchesRating && matchesTags;
      });

      // Sort problems: Unsolved/Attempted first, then solved, then sorted by rating ascending or index
      const sorted = [...filtered].sort((a, b) => {
        const aKey = `${a.contestId || ""}-${a.index}`;
        const bKey = `${b.contestId || ""}-${b.index}`;
        const aSolved = solvedProblemSet.has(aKey) ? 1 : 0;
        const bSolved = solvedProblemSet.has(bKey) ? 1 : 0;

        if (aSolved !== bSolved) {
          return aSolved - bSolved; // Unsolved (0) comes before Solved (1)
        }

        const aAttempted = attemptedProblemSet.has(aKey) ? 1 : 0;
        const bAttempted = attemptedProblemSet.has(bKey) ? 1 : 0;

        if (aAttempted !== bAttempted) {
          return bAttempted - aAttempted; // Attempted (1) comes before Not Started (0)
        }

        return (a.rating || 0) - (b.rating || 0); // Easier first
      });

      res[plan.id] = sorted.slice(0, 16); // Increase to 16 for better grouping
    });

    return res;
  }, [plans, problems, solvedProblemSet, attemptedProblemSet]);

  // Group problems by tags for accordion (blinds) display
  const problemsGroupedByTag = useMemo(() => {
    const res: Record<string, Record<string, CFProblem[]>> = {};
    
    Object.entries(matchingProblemsByPlan).forEach(([planId, probs]) => {
      const plan = plans.find(p => p.id === planId);
      const grouped: Record<string, CFProblem[]> = {};
      
      // Add an "全部" group that contains all problems
      grouped["全部"] = [...probs];
      
      // Group problems by each tag
      probs.forEach(prob => {
        const probTags = prob.tags || [];
        // Use plan's tags as priority if available
        const relevantTags = plan?.tags.length ? plan.tags : probTags;
        
        relevantTags.forEach(tag => {
          if (!grouped[tag]) grouped[tag] = [];
          // Only add if not already in this group
          const key = `${prob.contestId || ""}-${prob.index}`;
          const alreadyExists = grouped[tag].some(p => `${p.contestId || ""}-${p.index}` === key);
          if (!alreadyExists) grouped[tag].push(prob);
        });
        
        // Also add to original tag groups
        probTags.forEach(tag => {
          if (!grouped[tag]) grouped[tag] = [];
          const key = `${prob.contestId || ""}-${prob.index}`;
          const alreadyExists = grouped[tag].some(p => `${p.contestId || ""}-${p.index}` === key);
          if (!alreadyExists) grouped[tag].push(prob);
        });
      });
      
      res[planId] = grouped;
    });
    
    return res;
  }, [matchingProblemsByPlan, plans]);

  // Map progress counters to each plan dynamically from user submissions list!
  // Checks how many ACed problems match the plan's criteria (rating bounds and tag)
  const evaluatedPlans = useMemo(() => {
    return plans.map(p => {
      let matchingACsCount = 0;
      const seenGroup = new Set<string>();
      
      submissions.forEach(sub => {
        if (sub.verdict === "OK" && sub.problem) {
          const prob = sub.problem;
          const key = `${prob.contestId || ""}-${prob.index}`;
          if (seenGroup.has(key)) return;
          
          // Match rating filter
          // We define a target range: rating should be within [targetRating - 200, targetRating + 100]
          const matchesRating = prob.rating !== undefined && 
            prob.rating >= (p.targetRating - 200) && 
            prob.rating <= (p.targetRating + 100);
          
          // Match tag filter if exists
          const matchesTags = p.tags.length === 0 || p.tags.some(t => prob.tags?.includes(t));

          if (matchesRating && matchesTags) {
            seenGroup.add(key);
            matchingACsCount++;
          }
        }
      });

      // Simple relative goal thresholds
      const targetCount = p.targetRating >= 1900 ? 5 : p.targetRating >= 1600 ? 8 : 10;
      const progressPercent = Math.min(100, Math.round((matchingACsCount / targetCount) * 100));

      return {
        ...p,
        count: matchingACsCount,
        goal: targetCount,
        progress: progressPercent,
        completed: matchingACsCount >= targetCount
      };
    });
  }, [plans, submissions]);

  // Real-time Stage Syllabus progression calculation
  const stageStats = useMemo(() => {
    // Collect all unique solved problems
    const solvedMap = new Map<string, any>();
    submissions.forEach(sub => {
      if (sub.verdict === "OK" && sub.problem) {
        const probId = `${sub.problem.contestId || ""}-${sub.problem.index}`;
        solvedMap.set(probId, sub.problem);
      }
    });

    return SYLLABUS_STAGES.map(stage => {
      let solvedCount = 0;
      solvedMap.forEach(prob => {
        if (stage.filter(prob)) {
          solvedCount++;
        }
      });
      const progressPct = Math.min(100, Math.round((solvedCount / stage.targetCount) * 100));
      return {
        ...stage,
        solvedCount,
        progressPct,
        completed: solvedCount >= stage.targetCount
      };
    });
  }, [submissions]);

  // Handle plan creation
  const handleAddPlan = (e: React.FormEvent) => {
    e.preventDefault();
    const title = customTitle.trim() || `我的训练：★${targetRating}分段 [${translateTag(targetTag)}]`;
    
    // Check duplication
    if (plans.some(p => p.title === title)) {
      setSuccessMsg("该训练主题已在您的计划单中 🎯");
      setTimeout(() => setSuccessMsg(null), 3000);
      return;
    }

    const newPlan: TrainingPlan = {
      id: Date.now().toString(),
      title,
      targetRating,
      tags: targetTag === "all" ? [] : [targetTag],
      createdAt: Date.now(),
      completed: false
    };

    const updated = [newPlan, ...plans];
    setPlans(updated);
    setCustomTitle("");
    localStorage.setItem("cf_training_plans", JSON.stringify(updated));
    showTimedSuccess(`已自拟并订阅副本「★${targetRating}级：${translateTag(targetTag)}」！`);
  };

  // One-click register Stage Core curriculum to personal subscribed plans
  const handleRegisterStagePlan = (stage: typeof SYLLABUS_STAGES[number]) => {
    const title = `📖 [L${stage.stageNum}特训] ${stage.subtitle}`;
    
    if (plans.some(p => p.title === title)) {
      showTimedSuccess(`【Stage ${stage.stageNum} 大纲副本】早已加载！请在下方控制台冲刺！🚀`);
      return;
    }

    const newPlan: TrainingPlan = {
      id: `stage-curriculum-${stage.id}-${Date.now().toString()}`,
      title,
      targetRating: stage.suggestedRating,
      tags: [stage.suggestedTag],
      createdAt: Date.now(),
      completed: false
    };

    const updated = [newPlan, ...plans];
    setPlans(updated);
    localStorage.setItem("cf_training_plans", JSON.stringify(updated));
    showTimedSuccess(`🎉 成功同步！大纲副本 【L${stage.stageNum}: ${translateTag(stage.suggestedTag)}】 已经载入下方挑战面板！`);
  };

  // One-click register domestic contest training plan
  const handleRegisterDomesticPlan = (plan: typeof DOMESTIC_CONTEST_PLANS[number]) => {
    const title = `🏆 [国内赛事] ${plan.title}`;
    
    if (plans.some(p => p.title === title)) {
      showTimedSuccess(`【${plan.title}】早已加载！请在下方控制台冲刺！🚀`);
      return;
    }

    const newPlan: TrainingPlan = {
      id: `domestic-plan-${plan.id}-${Date.now().toString()}`,
      title,
      targetRating: plan.targetRating,
      tags: plan.tags,
      createdAt: Date.now(),
      completed: false
    };

    const updated = [newPlan, ...plans];
    setPlans(updated);
    localStorage.setItem("cf_training_plans", JSON.stringify(updated));
    showTimedSuccess(`🎉 成功同步！【${plan.title}】已经载入下方挑战面板！`);
  };

  // Toggle tag expansion for accordion (blinds) effect
  const toggleTagExpansion = (planId: string, tag: string) => {
    setExpandedTags(prev => {
      const current = new Set(prev[planId] || []);
      if (current.has(tag)) {
        current.delete(tag);
      } else {
        current.add(tag);
      }
      return { ...prev, [planId]: current };
    });
  };

  // Initialize expanded tags when plans load (default expand "全部")
  useEffect(() => {
    if (plans.length > 0) {
      const newExpandedTags: Record<string, Set<string>> = { ...expandedTags };
      let hasNewPlan = false;
      
      plans.forEach(plan => {
        if (!newExpandedTags[plan.id]) {
          newExpandedTags[plan.id] = new Set(["全部"]);
          hasNewPlan = true;
        }
      });
      
      if (hasNewPlan || Object.keys(expandedTags).length === 0) {
        setExpandedTags(newExpandedTags);
      }
    }
  }, [plans]);

  const showTimedSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg(null);
    }, 4000);
  };

  // Handle plan deletion
  const handleDeletePlan = (id: string) => {
    const updated = plans.filter(p => p.id !== id);
    setPlans(updated);
    localStorage.setItem("cf_training_plans", JSON.stringify(updated));
  };

  // Pre-configured Level packages checkpoint diagnostic
  const levelProgresses = useMemo(() => {
    return RECOMMEND_LEVELS.map(level => {
      let solvedNum = 0;
      submissions.forEach((sub) => {
        if (sub.verdict === "OK" && sub.problem && sub.problem.rating !== undefined) {
          const r = sub.problem.rating;
          if (r >= level.min && r <= level.max) {
            solvedNum++;
          }
        }
      });
      return {
        ...level,
        solved: solvedNum,
        // Suggested milestone benchmark counts
        targetSolved: level.min >= 1900 ? 10 : level.min >= 1600 ? 25 : 50
      };
    });
  }, [submissions]);

  return (
    <div className="space-y-8">
      {/* 1. Header Hero Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-12 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-black uppercase tracking-widest bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 px-2.5 py-1 rounded-md shadow-sm">
                Syllabus Control
              </span>
              <span className="text-xs font-medium text-indigo-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                国内外数据多端智能对齐体系
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-50 tracking-tight">
              从新手到大师的算法阶梯体系 (The Master's Path)
            </h1>
            <p className="text-xs text-slate-400 mt-2 max-w-3xl leading-relaxed">
              这里是涵盖国内外顶级 OJ 的五阶段全生命周期训练大纲。系统将智能扫描当前拉取的用户 AC 数据（
              <span className="text-amber-400 font-semibold uppercase">{platform}</span>
              ），自动为您检测各项训练大纲的绝对通过指标。完成推荐 Benchmark 题数，即可点亮徽章甚至点击
              <strong className="text-slate-200">「载入特训」</strong>在个性挑战卡中追踪！
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-950 px-5 py-3 rounded-2xl border border-slate-800 shadow-inner flex-shrink-0">
            <GraduationCap className="w-8 h-8 text-amber-500" />
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">当前选手 AC 总纲</div>
              <div className="text-base font-black text-slate-100 font-mono flex items-baseline gap-1">
                {submissions.filter(s => s.verdict === "OK").length} <span className="text-[11px] font-normal text-slate-400">题 AC</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Success Notification strip */}
        {successMsg && (
          <div className="mt-4 bg-amber-500 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl border border-amber-400 shadow-lg animate-fade-in flex items-center gap-2">
            <Zap className="w-4 h-4 fill-current animate-bounce" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* 2. 国内信息学竞赛训练题单 */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-1.5">
          <Award className="text-red-500 w-4 h-4" />
          国内信息学竞赛：CSP-J / CSP-S / NOIP 训练题单
        </h2>
        <p className="text-xs text-slate-400 mb-8">
          针对国内 CSP-J、CSP-S、NOIP 等赛事的专项训练题单，点击「一键载入」可将训练计划加入下方的挑战书。
        </p>

        {/* Domestic Contest Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {DOMESTIC_CONTEST_PLANS.map((plan) => {
            // Calculate current progress for this domestic plan
            let solvedCount = 0;
            const seenProbs = new Set<string>();
            submissions.forEach(sub => {
              if (sub.verdict === "OK" && sub.problem) {
                const key = `${sub.problem.contestId || ""}-${sub.problem.index}`;
                if (!seenProbs.has(key) && 
                    sub.problem.rating !== undefined && 
                    sub.problem.rating >= plan.targetRating - 300 && 
                    sub.problem.rating <= plan.targetRating + 200) {
                  seenProbs.add(key);
                  solvedCount++;
                }
              }
            });
            const progressPct = Math.min(100, Math.round((solvedCount / plan.targetCount) * 100));
            const isCompleted = solvedCount >= plan.targetCount;
            
            return (
              <div key={plan.id} className="relative group/card">
                {/* Main Card */}
                <div className={`bg-slate-50 border border-slate-150/60 rounded-2xl p-5 transition-all duration-300 hover:bg-white hover:shadow-xl hover:border-slate-200 flex flex-col gap-5 ${isCompleted ? "ring-2 ring-emerald-400" : ""}`}>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border ${plan.badgeColor}`}>
                        {plan.title}
                      </span>
                      {isCompleted && (
                        <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                          🎖️ 已完成
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-800 text-sm md:text-base group-hover/card:text-indigo-600 transition">
                        {plan.subtitle}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                        {plan.description}
                      </p>
                    </div>

                    {/* Topics Row */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">重点训练:</span>
                      {plan.topics.map(t => (
                        <span key={t} className="text-[10.5px] font-medium text-slate-600 bg-white border border-slate-150 rounded-lg px-2 py-0.5">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Progress & Actions */}
                  <div className="border-t border-slate-200/80 pt-4 flex flex-col gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline text-xs text-slate-505 font-medium">
                        <span>当前完成进度</span>
                        <span className="font-mono font-bold text-slate-800">
                          {solvedCount} / {plan.targetCount} <span className="text-[10px] font-normal text-slate-400">题</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${plan.gradient}`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] font-black text-slate-600 md:inline-block w-8 text-right">
                          {progressPct}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span>目标难度</span>
                        <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">★ {plan.targetRating}</span>
                      </div>
                    </div>

                    <button
                      id={`load-domestic-plan-${plan.id}`}
                      type="button"
                      onClick={() => handleRegisterDomesticPlan(plan)}
                      className="w-full bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-750 hover:to-slate-850 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition duration-150 flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      一键载入此训练计划
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. FIVE-STAGE TIMELINE SYLLABUS ROADMAP */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-1.5">
          <Compass className="text-indigo-500 w-4 h-4" />
          全景训练征途：Stage 1 至 Stage 5 从新星到神魔
        </h2>
        <p className="text-xs text-slate-400 mb-8">
          点击每项大纲卡片右侧的「一键载入」可将核心专项指标载入至下方的「挑战书」，方便在个人控制塔中进行离线与日常训练。
        </p>

        {/* Vertical Connected Stage List */}
        <div className="relative border-l-2 border-dashed border-slate-150 pl-4 md:pl-8 ml-3 md:ml-6 space-y-12">
          {stageStats.map((st, index) => {
            const isActivePlatTarget = st.platforms[platform as keyof typeof st.platforms];
            
            return (
              <div key={st.id} className="relative group/card">
                {/* Visual timeline node marker circle */}
                <div className={`absolute -left-[27px] md:-left-[43px] top-4 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                  st.completed 
                    ? "bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-200 ring-4 ring-emerald-50"
                    : st.solvedCount > 0
                    ? "bg-amber-400 text-slate-900 border-amber-300 ring-4 ring-amber-50"
                    : "bg-slate-100 text-slate-400 border-slate-200"
                }`}>
                  {st.completed ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <span className="text-[10px] font-black font-mono">{st.stageNum}</span>
                  )}
                </div>

                {/* Main Card */}
                <div className="bg-slate-50 border border-slate-150/60 rounded-2xl p-5 md:p-6 transition-all duration-300 hover:bg-white hover:shadow-xl hover:border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                  {/* Detailed specs */}
                  <div className="flex-1 space-y-3.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border ${st.badgeColor}`}>
                        {st.levelName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold bg-slate-150/50 px-2 py-0.5 rounded-md flex items-center gap-1">
                        🔒 核心题量指标: AC {st.targetCount} 道特训题
                      </span>
                      {st.completed && (
                        <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                          🎖️ 段位已打通
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-800 text-sm md:text-md group-hover/card:text-indigo-600 transition">
                        {st.subtitle}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-4xl">
                        {st.desc}
                      </p>
                    </div>

                    {/* Topics Row */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">重点技术:</span>
                      {st.topics.map(t => (
                        <span key={t} className="text-[10.5px] font-medium text-slate-600 bg-white border border-slate-150 rounded-lg px-2 py-0.5">
                          {t}
                        </span>
                      ))}
                    </div>

                    {/* Dynamic Multi-Platform Rating Conversion */}
                    <div className="bg-slate-200/50 p-2.5 rounded-xl border border-slate-150/40 grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(st.platforms).map(([platKey, platValue]) => {
                        const isCurrentActive = platKey === platform;
                        return (
                          <div 
                            key={platKey} 
                            className={`p-1.5 rounded-lg transition-all ${
                              isCurrentActive 
                                ? "bg-amber-400 text-slate-950 font-black shadow-sm scale-[1.02]" 
                                : "text-slate-600 bg-slate-100 text-[11px]"
                            }`}
                          >
                            <div className="text-[9px] uppercase font-bold opacity-60 tracking-wider">
                              {{
                                codeforces: "Codeforces",
                                atcoder: "AtCoder",
                                luogu: "洛谷 (Luogu)",
                                nowcoder: "牛客 (Nowcoder)"
                              }[platKey]}
                            </div>
                            <div className="text-[10.5px] truncate mt-0.5 whitespace-nowrap">
                              {platValue}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions & Progress visualizer */}
                  <div className="w-full xl:w-56 flex-shrink-0 flex flex-col gap-4 self-stretch justify-between xl:justify-center border-t xl:border-t-0 xl:border-l border-slate-200/80 pt-4 xl:pt-0 xl:pl-6">
                    <div className="space-y-1">
                      <div className="flex justify-between items-baseline text-xs text-slate-505 font-medium">
                        <span>选手本大纲进度</span>
                        <span className="font-mono font-bold text-slate-800">
                          {st.solvedCount} / {st.targetCount} <span className="text-[10px] font-normal text-slate-400">题</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${st.gradient}`}
                            style={{ width: `${st.progressPct}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] font-black text-slate-600 md:inline-block w-8 text-right">
                          {st.progressPct}%
                        </span>
                      </div>
                    </div>

                    <button
                      id={`load-stage-plan-${st.id}`}
                      type="button"
                      onClick={() => handleRegisterStagePlan(st)}
                      className="w-full bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs py-2 px-3 rounded-xl transition duration-150 flex items-center justify-center gap-1 active:scale-95 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      我要载入此纲特训
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Personalized Subscriptions & Milestone Checkpoints */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Active Challenges panel (Left Column, lg:col-span-3) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
              <Target className="text-indigo-500 w-4 h-4 animate-spin-slow" />
              我订制的排位特训挑战书 (Active Goals)
            </h2>
            <p className="text-xs text-slate-400 mb-6 font-medium">
              自研高频攻坚武器。支持添加各级专项特训、系统可全自动追溯检索对应大题。
            </p>

            {/* Plan Creator Form */}
            <form onSubmit={handleAddPlan} className="bg-slate-50 p-4 rounded-2xl border border-slate-150/60 flex flex-col gap-3.5 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Challenge Target Rating option */}
                <div>
                  <label htmlFor="challengeRating" className="text-[10px] uppercase font-bold text-slate-400 block mb-1">挑战难度:</label>
                  <select
                    id="challengeRating"
                    className="w-full bg-white text-xs border border-slate-200 rounded-lg p-2 focus:outline-none"
                    value={targetRating}
                    onChange={(e) => setTargetRating(parseInt(e.target.value, 10))}
                  >
                    <option value={800}>800 (Newbie基础)</option>
                    <option value={1000}>1000 (Newbie中阶)</option>
                    <option value={1200}>1200 (Pupil起步)</option>
                    <option value={1400}>1400 (Specialist突破)</option>
                    <option value={1600}>1600 (Expert前哨)</option>
                    <option value={1800}>1800 (Expert登峰)</option>
                    <option value={2000}>2000 (Master大关)</option>
                    <option value={2200}>2200 (G-Master巅峰)</option>
                  </select>
                </div>

                {/* Challenge Tag select */}
                <div>
                  <label htmlFor="challengeTag" className="text-[10px] uppercase font-bold text-slate-400 block mb-1">选择分类专项:</label>
                  <select
                    id="challengeTag"
                    className="w-full bg-white text-xs border border-slate-200 rounded-lg p-2 focus:outline-none"
                    value={targetTag}
                    onChange={(e) => setTargetTag(e.target.value)}
                  >
                    <option value="greedy">贪心 (greedy)</option>
                    <option value="dp">动态规划 (dp)</option>
                    <option value="math">数学 (math)</option>
                    <option value="graphs">图论 (graphs)</option>
                    <option value="data structures">数据结构 (data structures)</option>
                    <option value="dfs and similar">DFS及类似 (dfs and similar)</option>
                    <option value="brute force">暴力 (brute force)</option>
                    <option value="binary search">二分查找 (binary search)</option>
                    <option value="trees">树结构 (trees)</option>
                    <option value="sorting">排序 (sorting)</option>
                    <option value="number theory">数论 (number theory)</option>
                    <option value="flows">网络流 (flows)</option>
                    <option value="implementation">模拟工程 (implementation)</option>
                  </select>
                </div>

                {/* Submitting button trigger */}
                <div className="flex items-end">
                  <button
                    id="addChallengeBtn"
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold py-2.5 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-1 active:scale-95 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    开启自设特训副本
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="challengeTitle" className="text-[10px] uppercase font-bold text-slate-400 block mb-1">自定义副本别称 (选填):</label>
                <input
                  id="challengeTitle"
                  type="text"
                  className="w-full bg-white text-xs border border-slate-200 rounded-lg p-2 focus:outline-none"
                  placeholder="例如：红名攻坚：六月克制图论大限"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                />
              </div>
            </form>

            {/* List of imported or customized challenges */}
            {evaluatedPlans.length > 0 ? (
              <div className="space-y-4">
                {evaluatedPlans.map((plan) => {
                  const dateStr = new Date(plan.createdAt).toLocaleDateString("zh-CN");
                  const matchedProbs = matchingProblemsByPlan[plan.id] || [];

                  return (
                    <div
                      id={`challenge-box-${plan.id}`}
                      key={plan.id}
                      className="bg-slate-50/70 border border-slate-100 rounded-2xl overflow-hidden shadow-sm transition hover:bg-slate-50 p-4"
                    >
                      {/* Card Header Top Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100/40">
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-[10px] font-mono font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md">
                              目标 ★{plan.targetRating}分
                            </span>
                            {plan.tags.length > 0 && (
                              <span className="text-[10px] font-medium bg-purple-50 text-purple-750 px-2 py-0.5 rounded-md border border-purple-100 font-semibold">
                                分类: {plan.tags.map(translateTag).join(", ")}
                              </span>
                            )}
                            {plan.completed && (
                              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-0.5 border border-emerald-100 shadow-sm">
                                <CheckCircle className="w-3 h-3 text-emerald-500 fill-current" />
                                已达成通关
                              </span>
                            )}
                          </div>

                          <h4 className="font-bold text-slate-850 text-sm">
                            {plan.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 block mt-1">
                            建档日: {dateStr} (期间 AC 同阶题达到 {plan.goal} 道即标志通关)
                          </span>
                        </div>

                        <div className="flex items-center gap-3.5 flex-shrink-0 justify-between sm:justify-end">
                          {/* Progress */}
                          <div className="text-right">
                            <div className="text-xs font-black text-slate-800 font-mono">
                              {plan.count} / {plan.goal} <span className="text-[10px] text-slate-400 font-normal">题</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block font-semibold">{plan.progress}% 通关率</span>
                          </div>

                          {/* Delete Plan Button */}
                          <button
                            id={`delete-challenge-${plan.id}`}
                            type="button"
                            onClick={() => handleDeletePlan(plan.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="删除特训"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Accordion (Blinds) style tag-based problem display */}
                      <div className="pt-3 text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-3">
                          <label 
                            className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5"
                          >
                            <Layers className="w-3.5 h-3.5 text-indigo-500" />
                            🎯 分类题单 (按算法标签折叠展开):
                          </label>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                            当前平台: {platform.toUpperCase()}
                          </span>
                        </div>

                        {problems.length === 0 ? (
                          <div className="py-4 text-center text-xs text-slate-400 bg-white/50 rounded-xl border border-dashed border-slate-200">
                            🕒 线上题库正在同步，题目载入后将实时在此计算并呈现个性化特训题单...
                          </div>
                        ) : (() => {
                          // 优先使用后端数据
                          const backendData = backendProblemsByPlan[plan.id];
                          if (backendData && backendData.total_problems > 0) {
                            // 使用后端按标签分类的题目数据
                            const expandedPlanTags = expandedTags[plan.id] || new Set(["全部"]);
                            
                            return (
                              <div className="space-y-2">
                                {backendData.tags_order.filter(tag => backendData.problems_by_tag[tag]?.length > 0).map((tag) => {
                                  const tagProbs = backendData.problems_by_tag[tag] || [];
                                  const isExpanded = expandedPlanTags.has(tag);
                                  const tagDisplayName = tag === "全部" ? "全部题目" : translateTag(tag);
                                  const acCount = tagProbs.filter(p => solvedProblemSet.has(p.id)).length;
                                  const backendCompletedCount = tagProbs.filter(p => p.completed).length;
                                  
                                  return (
                                    <div key={tag} className="border border-slate-150 rounded-xl overflow-hidden bg-white">
                                      {/* Tag header toggle */}
                                      <button
                                        type="button"
                                        onClick={() => toggleTagExpansion(plan.id, tag)}
                                        className={`w-full px-3 py-2.5 flex items-center justify-between text-left transition-all duration-200 ${
                                          isExpanded 
                                            ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-100" 
                                            : "bg-slate-50 hover:bg-slate-100"
                                        }`}
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className={`p-1.5 rounded-lg ${tag === "全部" ? "bg-amber-100" : "bg-slate-100"}`}>
                                            {tag === "全部" ? (
                                              <Star className="w-3.5 h-3.5 text-amber-600" />
                                            ) : (
                                              <Tag className="w-3.5 h-3.5 text-slate-600" />
                                            )}
                                          </div>
                                          <div>
                                            <span className="text-xs font-bold text-slate-700">{tagDisplayName}</span>
                                            <span className="text-[9px] text-slate-400 ml-1.5 font-mono">({tagProbs.length}题)</span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          {acCount > 0 && (
                                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                              ✓ {acCount} AC
                                            </span>
                                          )}
                                          {backendCompletedCount > 0 && (
                                            <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                                              ☑ {backendCompletedCount} 完成
                                            </span>
                                          )}
                                          <ChevronDown
                                            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                                              isExpanded ? "rotate-180" : ""
                                            }`}
                                          />
                                        </div>
                                      </button>
                                      
                                      {/* Expandable problem list */}
                                      {isExpanded && (
                                        <div className="p-2.5 space-y-2 bg-white">
                                          {tagProbs.slice(0, 6).map((prob) => {
                                            const probKey = prob.id;
                                            const isAC = solvedProblemSet.has(probKey);
                                            const isAttempted = attemptedProblemSet.has(probKey);
                                            const isBackendCompleted = prob.completed;
                                            
                                            // Construct deep link
                                            let externalUrl = "";
                                            if (platform === "atcoder") {
                                              externalUrl = `https://atcoder.jp/contests/abc/tasks/abc${prob.contest_id || ""}_${prob.index?.toLowerCase()}`;
                                            } else if (platform === "luogu") {
                                              externalUrl = `https://www.luogu.com.cn/problem/${prob.index}`;
                                            } else if (platform === "nowcoder") {
                                              externalUrl = `https://ac.nowcoder.com/acm/problem/${prob.index}`;
                                            } else {
                                              externalUrl = `https://codeforces.com/problemset/problem/${prob.contest_id}/${prob.index}`;
                                            }
                                            
                                            return (
                                              <a
                                                key={probKey}
                                                href={externalUrl}
                                                target="_blank"
                                                rel="noreferrer noopener"
                                                className={`block p-2 rounded-lg border transition-all duration-150 cursor-pointer ${
                                                  isAC 
                                                    ? "bg-emerald-50 border-emerald-150 hover:bg-emerald-100" 
                                                    : isBackendCompleted 
                                                      ? "bg-blue-50 border-blue-150 hover:bg-blue-100"
                                                      : isAttempted 
                                                        ? "bg-rose-50 border-rose-150 hover:bg-rose-100"
                                                        : "bg-slate-50 border-slate-150 hover:bg-slate-100 hover:border-indigo-200"
                                                }`}
                                              >
                                                <div className="flex items-start justify-between gap-2">
                                                  <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                                      <span className="text-[10px] font-mono font-bold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                                        {prob.contest_id ? `${prob.contest_id}${prob.index}` : prob.index}
                                                      </span>
                                                      <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                                                        ★ {prob.rating !== undefined ? prob.rating : "N/A"}
                                                      </span>
                                                      {/* Status badge */}
                                                      {isAC ? (
                                                        <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5">
                                                          <CheckCircle className="w-3 h-3" />
                                                          已 AC
                                                        </span>
                                                      ) : isBackendCompleted ? (
                                                        <span className="text-[9px] font-bold text-blue-600 flex items-center gap-0.5">
                                                          <CheckCircle2 className="w-3 h-3" />
                                                          已完成
                                                        </span>
                                                      ) : isAttempted ? (
                                                        <span className="text-[9px] font-bold text-rose-500 flex items-center gap-0.5 animate-pulse">
                                                          <Zap className="w-3 h-3" />
                                                          待重做
                                                        </span>
                                                      ) : null}
                                                    </div>
                                                    <div className="text-[11px] font-semibold text-slate-750 truncate leading-tight">
                                                      {prob.name}
                                                    </div>
                                                  </div>
                                                  <div className="flex-shrink-0 text-right">
                                                    <div className="flex items-center gap-1 text-[9px] text-slate-400 mb-1">
                                                      <ExternalLink className="w-3 h-3" />
                                                      挑战
                                                    </div>
                                                    <div className="flex gap-0.5 flex-wrap justify-end">
                                                      {prob.tags?.slice(0, 2).map((t: string, i: number) => (
                                                        <span key={i} className="text-[8px] text-slate-500 bg-slate-100 px-1 py-0.5 rounded">
                                                          {translateTag(t)}
                                                        </span>
                                                      ))}
                                                    </div>
                                                  </div>
                                                </div>
                                              </a>
                                            );
                                          })}
                                          {tagProbs.length > 6 && (
                                            <div className="pt-1 text-center text-[10px] text-slate-400">
                                              ...还有 {tagProbs.length - 6} 道更多题目
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          }
                          
                          // 使用本地数据（原有逻辑）
                          const matchedProbs = matchingProblemsByPlan[plan.id] || [];
                          if (matchedProbs.length === 0) {
                            return (
                              <div className="py-4 text-center text-xs text-slate-400 bg-white/50 rounded-xl border border-dashed border-slate-200">
                                ℹ️ 暂无匹配 (★{plan.targetRating}分 难度) 的 "{plan.tags.map(translateTag).join(", ")}" 练习好题。
                              </div>
                            );
                          }
                          
                          const groupedProbs = problemsGroupedByTag[plan.id] || { "全部": matchedProbs };
                          const expandedPlanTags = expandedTags[plan.id] || new Set(["全部"]);
                          
                          return (
                            <div className="space-y-2">
                              {Object.entries(groupedProbs).filter(([_, probs]) => probs.length > 0).map(([tag, tagProbs]) => {
                                const isExpanded = expandedPlanTags.has(tag);
                                const tagDisplayName = tag === "全部" ? "全部题目" : translateTag(tag);
                                
                                return (
                                  <div key={tag} className="border border-slate-150 rounded-xl overflow-hidden bg-white">
                                    {/* Tag header toggle */}
                                    <button
                                      type="button"
                                      onClick={() => toggleTagExpansion(plan.id, tag)}
                                      className={`w-full px-3 py-2.5 flex items-center justify-between text-left transition-all duration-200 ${
                                        isExpanded 
                                          ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-100" 
                                          : "bg-slate-50 hover:bg-slate-100"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg ${tag === "全部" ? "bg-amber-100" : "bg-slate-100"}`}>
                                          {tag === "全部" ? (
                                            <Star className="w-3.5 h-3.5 text-amber-600" />
                                          ) : (
                                            <Tag className="w-3.5 h-3.5 text-slate-600" />
                                          )}
                                        </div>
                                        <div>
                                          <span className="text-xs font-bold text-slate-700">{tagDisplayName}</span>
                                          <span className="text-[9px] text-slate-400 ml-1.5 font-mono">({tagProbs.length}题)</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        {(() => {
                                          const acCount = tagProbs.filter(p => solvedProblemSet.has(`${p.contestId || ""}-${p.index}`)).length;
                                          if (acCount > 0) {
                                            return (
                                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                                ✓ {acCount} AC
                                              </span>
                                            );
                                          }
                                          return null;
                                        })()}
                                        <ChevronDown
                                          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                                            isExpanded ? "rotate-180" : ""
                                          }`}
                                        />
                                      </div>
                                    </button>
                                    
                                    {/* Expandable problem list */}
                                    {isExpanded && (
                                      <div className="p-2.5 space-y-2 bg-white">
                                        {tagProbs.slice(0, 6).map((prob) => {
                                          const probKey = `${prob.contestId || ""}-${prob.index}`;
                                          const isAC = solvedProblemSet.has(probKey);
                                          const isAttempted = attemptedProblemSet.has(probKey);
                                          
                                          let externalUrl = "";
                                          if (platform === "atcoder") {
                                            externalUrl = `https://atcoder.jp/contests/abc/tasks/abc${prob.contestId || ""}_${prob.index?.toLowerCase()}`;
                                          } else if (platform === "luogu") {
                                            externalUrl = `https://www.luogu.com.cn/problem/${prob.index}`;
                                          } else if (platform === "nowcoder") {
                                            externalUrl = `https://ac.nowcoder.com/acm/problem/${prob.index}`;
                                          } else {
                                            externalUrl = `https://codeforces.com/problemset/problem/${prob.contestId}/${prob.index}`;
                                          }
                                          
                                          return (
                                            <a
                                              key={probKey}
                                              href={externalUrl}
                                              target="_blank"
                                              rel="noreferrer noopener"
                                              className={`block p-2 rounded-lg border transition-all duration-150 cursor-pointer ${
                                                isAC 
                                                  ? "bg-emerald-50 border-emerald-150 hover:bg-emerald-100" 
                                                  : isAttempted 
                                                    ? "bg-rose-50 border-rose-150 hover:bg-rose-100"
                                                    : "bg-slate-50 border-slate-150 hover:bg-slate-100 hover:border-indigo-200"
                                              }`}
                                            >
                                              <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                                    <span className="text-[10px] font-mono font-bold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                                      {prob.contestId ? `${prob.contestId}${prob.index}` : prob.index}
                                                    </span>
                                                    <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                                                      ★ {prob.rating !== undefined ? prob.rating : "N/A"}
                                                    </span>
                                                    {isAC ? (
                                                      <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5">
                                                        <CheckCircle className="w-3 h-3" />
                                                        已 AC
                                                      </span>
                                                    ) : isAttempted ? (
                                                      <span className="text-[9px] font-bold text-rose-500 flex items-center gap-0.5 animate-pulse">
                                                        <Zap className="w-3 h-3" />
                                                        待重做
                                                      </span>
                                                    ) : null}
                                                  </div>
                                                  <div className="text-[11px] font-semibold text-slate-750 truncate leading-tight">
                                                    {prob.name}
                                                  </div>
                                                </div>
                                                <div className="flex-shrink-0 text-right">
                                                  <div className="flex items-center gap-1 text-[9px] text-slate-400 mb-1">
                                                    <ExternalLink className="w-3 h-3" />
                                                    挑战
                                                  </div>
                                                  <div className="flex gap-0.5 flex-wrap justify-end">
                                                    {prob.tags?.slice(0, 2).map((t, i) => (
                                                      <span key={i} className="text-[8px] text-slate-500 bg-slate-100 px-1 py-0.5 rounded">
                                                        {translateTag(t)}
                                                      </span>
                                                    ))}
                                                  </div>
                                                </div>
                                              </div>
                                            </a>
                                          );
                                        })}
                                        {tagProbs.length > 6 && (
                                          <div className="pt-1 text-center text-[10px] text-slate-400">
                                            ...还有 {tagProbs.length - 6} 道更多题目
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 border-2 border-dashed border-slate-150 bg-slate-50 text-center rounded-2xl text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <Inbox className="w-8 h-8 text-slate-300" />
                <span>当前特训挑战书空空如也。点击上方 Stage 的「加入特训」或自创一个副本开始斩将夺隘！</span>
              </div>
            )}
          </div>
        </div>

        {/* Milestone milestones (Right Column, lg:col-span-2) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
              <Trophy className="text-amber-500 w-4 h-4 fill-current animate-bounce" />
              排位晋级核心里程碑 (CF Standards)
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              根据主流 CF 分值标尺，实时验证在各大难度分水岭累积解决的任务配额（含历史所有 AC）。
            </p>

            <div className="space-y-4">
              {levelProgresses.map((level) => {
                const activeProgressPct = Math.min(100, Math.round((level.solved / level.targetSolved) * 100));
                
                return (
                  <div key={level.id} className="p-4 bg-slate-50 border border-slate-150/60 rounded-2xl relative overflow-hidden group hover:bg-white hover:shadow-md transition duration-200">
                    {activeProgressPct >= 100 && (
                      <div className="absolute right-0 top-0 bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded-bl-md font-bold uppercase tracking-wider scale-90">
                        达标 (Reached)
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-bold text-slate-850 text-xs sm:text-sm">{level.name}</span>
                      <span className="font-mono text-[11px] text-slate-440 font-semibold">
                        已克 <strong className="text-slate-800 font-extrabold">{level.solved}</strong> / {level.targetSolved} 题
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-400 mb-3">{level.desc}</p>
                    
                    {/* Linear slider metrics bar color matches status */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-501 ${
                            activeProgressPct >= 100 ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${activeProgressPct}%` }}
                        ></div>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-slate-600">
                        {activeProgressPct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
