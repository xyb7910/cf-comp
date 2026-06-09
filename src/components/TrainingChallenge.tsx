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
  platform?: "codeforces" | "atcoder" | "luogu" | "nowcoder" | "custom";
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
    targetCount: 30
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
    targetCount: 25
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
    targetCount: 20
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
    targetCount: 40
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

  // Domestic contest plans from backend
  const [domesticPlans, setDomesticPlans] = useState<typeof DOMESTIC_CONTEST_PLANS>([]);
  const [domesticPlansLoading, setDomesticPlansLoading] = useState(true);

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

  // Fetch domestic contest plans from backend templates
  const fetchDomesticPlans = async () => {
    try {
      setDomesticPlansLoading(true);
      const response = await fetch('/api/training-plans/templates/');
      
      if (response.ok) {
        const data = await response.json();
        const plans = data.map((p: any) => ({
          id: p.id,
          title: p.title,
          subtitle: p.subtitle || '',
          description: p.description || '',
          badgeColor: p.badge_color || '',
          gradient: p.gradient || '',
          targetRating: p.target_rating || 0,
          tags: p.tags || [],
          targetCount: p.target_count || 0
        }));
        setDomesticPlans(plans);
      }
    } catch (error) {
      console.error('Failed to fetch domestic plans:', error);
      setDomesticPlans(DOMESTIC_CONTEST_PLANS);
    } finally {
      setDomesticPlansLoading(false);
    }
  };

  // Fetch domestic plans on mount
  useEffect(() => {
    fetchDomesticPlans();
  }, []);

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
      const assignedProblems = new Set<string>();
      
      // Add an "全部" group that contains all problems
      grouped["全部"] = [...probs];
      
      // Group problems by each tag, ensuring each problem only appears once
      probs.forEach(prob => {
        const probKey = `${prob.contestId || ""}-${prob.index}`;
        const probTags = prob.tags || [];
        // Use plan's tags as priority if available
        const relevantTags = plan?.tags.length ? plan.tags : probTags;
        
        // Find the first matching tag
        const matchedTag = relevantTags.find(tag => probTags.includes(tag));
        
        if (matchedTag && !assignedProblems.has(probKey)) {
          if (!grouped[matchedTag]) grouped[matchedTag] = [];
          grouped[matchedTag].push(prob);
          assignedProblems.add(probKey);
        } else if (!assignedProblems.has(probKey)) {
          // If no matching tag found, use the first tag of the problem
          if (probTags.length > 0) {
            const firstTag = probTags[0];
            if (!grouped[firstTag]) grouped[firstTag] = [];
            grouped[firstTag].push(prob);
            assignedProblems.add(probKey);
          }
        }
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
  const handleRegisterDomesticPlan = async (plan: typeof DOMESTIC_CONTEST_PLANS[number]) => {
    const title = `🏆 [国内赛事] ${plan.title}`;
    
    if (plans.some(p => p.title === title)) {
      showTimedSuccess(`【${plan.title}】早已加载！请在下方控制台冲刺！🚀`);
      return;
    }

    try {
      const response = await fetch('/api/training-plans/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          id: `${plan.id}-${Date.now()}`,
          title,
          target_rating: plan.targetRating,
          tags: plan.tags,
          description: plan.description
        })
      });

      if (response.ok) {
        const createdPlan = await response.json();
        const newPlan: TrainingPlan = {
          id: createdPlan.id,
          title: createdPlan.title,
          targetRating: createdPlan.target_rating,
          tags: createdPlan.tags,
          createdAt: new Date(createdPlan.created_at).getTime(),
          completed: false
        };

        const updated = [newPlan, ...plans];
        setPlans(updated);
        localStorage.setItem("cf_training_plans", JSON.stringify(updated));
        showTimedSuccess(`🎉 成功同步！【${plan.title}】已经载入下方挑战面板！`);
      } else {
        showTimedSuccess(`⚠️ 创建失败，请稍后重试`);
      }
    } catch (error) {
      console.error('Failed to create training plan:', error);
      showTimedSuccess(`⚠️ 创建失败，请稍后重试`);
    }
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
  const handleDeletePlan = async (id: string) => {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`/api/training-plans/${id}/`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) {
        console.error('Failed to delete plan:', response.status);
      }
    } catch (error) {
      console.error('Failed to delete plan:', error);
    }
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
          {domesticPlansLoading ? (
            <div className="col-span-2 flex justify-center items-center py-12">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            domesticPlans.map((plan) => {
            return (
              <div key={plan.id} className="relative group/card">
                {/* Main Card */}
                <div className={`bg-slate-50 border border-slate-150/60 rounded-2xl p-5 transition-all duration-300 hover:bg-white hover:shadow-xl hover:border-slate-200 flex flex-col gap-5`}>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border ${plan.badgeColor}`}>
                        {plan.title}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-800 text-sm md:text-base group-hover/card:text-indigo-600 transition">
                        {plan.subtitle}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                        {plan.description}
                      </p>
                    </div>

                    </div>

                  {/* Actions */}
                  <div className="border-t border-slate-200/80 pt-4 flex flex-col gap-4">
                    <div className="space-y-2">
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
            }))}
        </div>
      </div>

      {/* 3. Personalized Subscriptions & Milestone Checkpoints */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Active Challenges panel (Full Width) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
                  <Target className="text-indigo-500 w-4 h-4 animate-spin-slow" />
                  我订制的排位特训挑战书 (Active Goals)
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  自研高频攻坚武器。支持添加各级专项特训、系统可全自动追溯检索对应大题。
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="bg-slate-100 px-2 py-1 rounded-lg font-medium">
                  共 {evaluatedPlans.length} 个挑战书
                </span>
              </div>
            </div>

            

            {/* List of imported or customized challenges */}
            {evaluatedPlans.length > 0 ? (
              <div className="space-y-4">
                {evaluatedPlans.map((plan) => {
                  const dateStr = new Date(plan.createdAt).toLocaleDateString("zh-CN");
                  const matchedProbs = matchingProblemsByPlan[plan.id] || [];
                  const progressWidth = Math.min(100, plan.progress);

                  return (
                    <div
                      id={`challenge-box-${plan.id}`}
                      key={plan.id}
                      className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      {/* Card Header Top Row */}
                      <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-100">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md">
                                ★{plan.targetRating}
                              </span>
                              {plan.tags.length > 0 && (
                                <span className="text-[10px] font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md">
                                  {plan.tags.map(translateTag).join(", ")}
                                </span>
                              )}
                              {plan.completed && (
                                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                                  <CheckCircle className="w-3 h-3" />
                                  已通关
                                </span>
                              )}
                            </div>

                            <h4 className="font-bold text-slate-800 text-sm mb-1">
                              {plan.title}
                            </h4>
                            <span className="text-[10px] text-slate-450">
                              建档日: {dateStr} · 目标 AC {plan.goal} 道
                            </span>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Progress */}
                            <div className="flex items-center gap-3">
                              <div className="w-32 bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    progressWidth >= 100 ? "bg-emerald-500" : "bg-indigo-500"
                                  }`}
                                  style={{ width: `${progressWidth}%` }}
                                ></div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-black text-slate-800 font-mono">
                                  {plan.count}/{plan.goal}
                                </div>
                                <span className="text-[10px] text-slate-450 font-medium">{progressWidth}%</span>
                              </div>
                            </div>

                            {/* Delete Plan Button */}
                            <button
                              id={`delete-challenge-${plan.id}`}
                              type="button"
                              onClick={() => handleDeletePlan(plan.id)}
                              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                              title="删除特训"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Accordion (Blinds) style tag-based problem display */}
                      <div className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                          <label 
                            className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5"
                          >
                            <Layers className="w-3.5 h-3.5 text-indigo-500" />
                            分类题单 (按算法标签折叠展开)
                          </label>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">
                            {platform.toUpperCase()} · {matchedProbs.length} 题
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
                                              <div
                                                key={probKey}
                                                className="block p-2 rounded-lg border transition-all duration-150 bg-slate-50 border-slate-150 hover:bg-slate-100 hover:border-indigo-200"
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
                                                    </div>
                                                    <div className="text-[11px] font-semibold text-slate-750 truncate leading-tight">
                                                      {prob.name}
                                                    </div>
                                                    <div className="flex gap-0.5 mt-0.5 flex-wrap">
                                                      {prob.tags?.slice(0, 2).map((t: string, i: number) => (
                                                        <span key={i} className="text-[8px] text-slate-500 bg-slate-100 px-1 py-0.5 rounded">
                                                          {translateTag(t)}
                                                        </span>
                                                      ))}
                                                    </div>
                                                  </div>
                                                  <a
                                                    href={externalUrl}
                                                    target="_blank"
                                                    rel="noreferrer noopener"
                                                    className="flex-shrink-0 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                    title="跳转到题目"
                                                  >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                  </a>
                                                </div>
                                              </div>
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
                                        <ChevronDown
                                          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                                            isExpanded ? "rotate-180" : ""
                                          }`}
                                        />
                                      </div>
                                    </button>
                                    
                                    {/* Expandable problem list */}
                                    {isExpanded && (
                                      <div className="p-3 space-y-2 bg-white">
                                        {tagProbs.map((prob) => {
                                          const probKey = `${prob.contestId || ""}-${prob.index}`;
                                          
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
                                            <div
                                              key={probKey}
                                              className="block p-3 rounded-xl border transition-all duration-200 bg-slate-50 border-slate-150 hover:bg-slate-100 hover:border-indigo-200"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                  <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                      <span className="text-[10px] font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm">
                                                        {prob.contestId ? `${prob.contestId}${prob.index}` : prob.index}
                                                      </span>
                                                      <span className="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                                                        ★ {prob.rating !== undefined ? prob.rating : "N/A"}
                                                      </span>
                                                    </div>
                                                    <div className="text-[12px] font-semibold text-slate-800 truncate leading-tight">
                                                      {prob.name}
                                                    </div>
                                                    <div className="flex gap-1 mt-1 flex-wrap">
                                                      {prob.tags?.slice(0, 3).map((t, i) => (
                                                        <span key={i} className="text-[8px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                          {translateTag(t)}
                                                        </span>
                                                      ))}
                                                    </div>
                                                  </div>
                                                  <a
                                                    href={externalUrl}
                                                    target="_blank"
                                                    rel="noreferrer noopener"
                                                    className="flex-shrink-0 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                    title="跳转到题目"
                                                  >
                                                    <ExternalLink className="w-4 h-4" />
                                                  </a>
                                                </div>
                                              </div>
                                          );
                                        })}
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

        
      </div>
    </div>
  );
}
