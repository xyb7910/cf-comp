import React, { useMemo, useState } from "react";
import { CFSubmission } from "../types";
import { translateTag, TAG_TRANSLATIONS, getProblemUrl } from "../utils";
import { renderTextWithMath } from "./MathRenderer";
import { PieChart, ListFilter, Target, Flame, BarChart4, TrendingUp, AlertTriangle, BookOpen, CalendarRange, Compass, X, Award, FileDown, Sparkles, Search, ExternalLink, Loader2 } from "lucide-react";

interface StatsAnalysisProps {
  submissions: CFSubmission[];
  username: string;
  platform?: "codeforces" | "atcoder" | "luogu" | "nowcoder";
}

interface HeatmapCell {
  dateStr: string;
  count: number;
  acCount: number;
  dayOfWeek: number;
}

export default function StatsAnalysis({ submissions, username, platform = "codeforces" }: StatsAnalysisProps) {
  const [showReportModal, setShowReportModal] = useState(false);

  // Problems portfolio filter states
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "AC" | "WA" | "Attempted">("all");
  const [probSearchQuery, setProbSearchQuery] = useState("");
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [activeExplainProblem, setActiveExplainProblem] = useState<any | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [explainLanguage, setExplainLanguage] = useState("C++");

  // 1.8 Compute unique problems and statuses from submissions list
  const uniqueProblems = useMemo(() => {
    if (!submissions || submissions.length === 0) return [];

    const problemMap = new Map<string, {
      id: string;
      contestId?: string | number;
      index: string;
      name: string;
      rating?: number;
      tags: string[];
      submissionsCount: number;
      lastSubmittedTime: number;
      verdicts: Set<string>;
    }>();

    submissions.forEach((sub) => {
      if (!sub.problem || !sub.problem.index) return;
      const contestIdStr = sub.problem.contestId !== undefined ? String(sub.problem.contestId) : "";
      const indexStr = String(sub.problem.index);
      
      const key = contestIdStr ? `${contestIdStr}-${indexStr}` : indexStr;
      
      const existing = problemMap.get(key);
      if (existing) {
        existing.submissionsCount += 1;
        existing.lastSubmittedTime = Math.max(existing.lastSubmittedTime, sub.creationTimeSeconds || 0);
        existing.verdicts.add(sub.verdict || "UNKNOWN");
        if (sub.problem.rating && !existing.rating) {
          existing.rating = sub.problem.rating;
        }
      } else {
        const verdictsSet = new Set<string>();
        verdictsSet.add(sub.verdict || "UNKNOWN");
        problemMap.set(key, {
          id: key,
          contestId: sub.problem.contestId,
          index: sub.problem.index,
          name: sub.problem.name || "未命名题目",
          rating: sub.problem.rating,
          tags: sub.problem.tags || [],
          submissionsCount: 1,
          lastSubmittedTime: sub.creationTimeSeconds || 0,
          verdicts: verdictsSet,
        });
      }
    });

    return Array.from(problemMap.values()).map(p => {
      let status: "AC" | "WA" | "Attempted" = "Attempted";
      if (p.verdicts.has("OK")) {
        status = "AC";
      } else if (p.verdicts.has("WRONG_ANSWER")) {
        status = "WA";
      }
      return {
        ...p,
        status,
        verdicts: Array.from(p.verdicts)
      };
    });
  }, [submissions]);

  // Tag grouping statistics for sidebar list
  const tagsStats = useMemo(() => {
    const stats: Record<string, { total: number; ac: number; wa: number; attempted: number }> = {};
    
    // Virtual tag: "all"
    stats["all"] = { total: 0, ac: 0, wa: 0, attempted: 0 };

    uniqueProblems.forEach(p => {
      stats["all"].total++;
      if (p.status === "AC") stats["all"].ac++;
      else if (p.status === "WA") stats["all"].wa++;
      else stats["all"].attempted++;

      if (p.tags && p.tags.length > 0) {
        p.tags.forEach(t => {
          const cleanTag = t.toLowerCase();
          if (!stats[cleanTag]) {
            stats[cleanTag] = { total: 0, ac: 0, wa: 0, attempted: 0 };
          }
          stats[cleanTag].total++;
          if (p.status === "AC") stats[cleanTag].ac++;
          else if (p.status === "WA") stats[cleanTag].wa++;
          else stats[cleanTag].attempted++;
        });
      } else {
        const uncategorized = "uncategorized";
        if (!stats[uncategorized]) {
          stats[uncategorized] = { total: 0, ac: 0, wa: 0, attempted: 0 };
        }
        stats[uncategorized].total++;
        if (p.status === "AC") stats[uncategorized].ac++;
        else if (p.status === "WA") stats[uncategorized].wa++;
        else stats[uncategorized].attempted++;
      }
    });

    return stats;
  }, [uniqueProblems]);

  const distinctTagsSorted = useMemo(() => {
    return Object.keys(tagsStats)
      .filter(t => t !== "all" && t !== "uncategorized")
      .sort((a, b) => tagsStats[b].total - tagsStats[a].total);
  }, [tagsStats]);

  const portfolioProblemsFiltered = useMemo(() => {
    return uniqueProblems.filter(p => {
      // 1. Tag filter
      if (selectedTag !== "all") {
        if (selectedTag === "uncategorized") {
          if (p.tags && p.tags.length > 0) return false;
        } else {
          if (!p.tags.map(t => t.toLowerCase()).includes(selectedTag.toLowerCase())) {
            return false;
          }
        }
      }

      // 2. Status filter
      if (selectedStatus !== "all" && p.status !== selectedStatus) {
        return false;
      }

      // 3. Text search
      if (probSearchQuery) {
        const query = probSearchQuery.toLowerCase();
        const codeStr = `${p.contestId || ""}${p.index}`.toLowerCase();
        const nameStr = p.name.toLowerCase();
        if (!codeStr.includes(query) && !nameStr.includes(query)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => b.lastSubmittedTime - a.lastSubmittedTime);
  }, [uniqueProblems, selectedTag, selectedStatus, probSearchQuery]);

  const triggerExplanationWithLanguage = async (p: any, lang: string) => {
    setAiLoading(true);
    setAiExplanation(null);
    setActiveExplainProblem(p);
    setExplainLanguage(lang);
    
    const pCode = p.contestId ? `${p.contestId}${p.index}` : p.index;
    
    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemCode: pCode,
          name: p.name,
          rating: p.rating,
          tags: p.tags,
          language: lang,
          platform: platform,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setAiExplanation(data.text);
      } else {
        setAiExplanation(`### ❌ 获取AI思路出错\n${data.error || "网络波动，请稍后再试"}`);
      }
    } catch (err: any) {
      setAiExplanation(`### ❌ 网络连接异常\n${err.message || "无法连接至大模型服务"}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleGetAIExplanation = async (p: any) => {
    await triggerExplanationWithLanguage(p, explainLanguage);
  };

  const renderMarkdownText = (text: string) => {
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
                  <div className="bg-slate-850 px-4 py-1 flex items-center justify-between border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase font-bold">
                    <span>{languageLabel}</span>
                  </div>
                )}
                <pre className="p-4 overflow-x-auto text-xs text-slate-200 font-mono leading-relaxed text-left">
                  <code>{rawCode.trim()}</code>
                </pre>
              </div>
            );
          } else { // Regular paragraph text
            const paragraphs = sec.split("\n\n");
            return paragraphs.map((p, pIdx) => {
              const trimmed = p.trim();
              if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                const listItems = trimmed.split(/\n[-*]\s+/).filter(Boolean);
                return (
                  <ul key={pIdx} className="list-disc pl-5 space-y-1.5 my-2 text-left">
                    {listItems.map((item, itemIdx) => {
                      const cleanItem = item.replace(/^[-*]\s+/, "").trim();
                      return (
                        <li key={itemIdx} className="text-slate-650">
                          {renderTextWithMath(cleanItem)}
                        </li>
                      );
                    })}
                  </ul>
                );
              }
              if (trimmed.startsWith("#")) {
                const level = (trimmed.match(/^#+/) || ["#"])[0].length;
                const cleanHeader = trimmed.replace(/^#+\s+/, "");
                const headerStyle = level === 1 ? "text-base font-extrabold text-slate-900 border-b border-slate-100 pb-1 mt-5 text-left" :
                                    level === 2 ? "text-sm font-bold text-slate-800 mt-4 text-left" : 
                                    "text-xs font-semibold text-slate-700 mt-3 text-left";
                return <h4 key={pIdx} className={headerStyle}>{renderTextWithMath(cleanHeader)}</h4>;
              }
              let content = trimmed;
              if (!content) return null;
              
              return (
                <p key={pIdx} className="text-slate-650 my-2 text-left">
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

  // 1. Calculate general numbers
  const stats = useMemo(() => {
    if (!submissions || submissions.length === 0) {
      return {
        total: 0,
        acCount: 0,
        uniqueACs: [] as string[],
        verdicts: {} as Record<string, number>,
        tags: {} as Record<string, number>,
        ratings: {} as Record<string, number>,
        avgACRating: 0
      };
    }

    const verdicts: Record<string, number> = {};
    const tags: Record<string, number> = {};
    const ratings: Record<string, number> = {};
    const solvedProblemKeys = new Set<string>();
    let acCount = 0;
    let totalACRatingSum = 0;
    let ratingSolvedCount = 0;

    submissions.forEach((sub) => {
      const v = sub.verdict || "UNKNOWN";
      verdicts[v] = (verdicts[v] || 0) + 1;

      if (v === "OK" && sub.problem && sub.problem.index) {
        acCount++;
        const probId = `${sub.problem.contestId || ""}-${sub.problem.index}`;
        
        // Count unique problems solved
        if (!solvedProblemKeys.has(probId)) {
          solvedProblemKeys.add(probId);

          // Tags aggregation
          if (sub.problem.tags && Array.isArray(sub.problem.tags)) {
            sub.problem.tags.forEach((tag) => {
              tags[tag] = (tags[tag] || 0) + 1;
            });
          }

          // Ratings aggregation
          if (sub.problem.rating !== undefined) {
            const r = sub.problem.rating;
            ratings[r] = (ratings[r] || 0) + 1;
            totalACRatingSum += r;
            ratingSolvedCount++;
          }
        }
      }
    });

    const avgACRating = ratingSolvedCount > 0 ? Math.round(totalACRatingSum / ratingSolvedCount) : 0;

    return {
      total: submissions.length,
      acCount,
      uniqueACs: Array.from(solvedProblemKeys),
      verdicts,
      tags,
      ratings,
      avgACRating
    };
  }, [submissions]);

  // Generates complete weeks with cells representing last year's activity
  const heatmapWeeks = useMemo(() => {
    if (!submissions || submissions.length === 0) return [];
    
    const data: Record<string, { count: number; acCount: number }> = {};
    
    submissions.forEach((sub) => {
      if (!sub.creationTimeSeconds) return;
      const date = new Date(sub.creationTimeSeconds * 1000);
      const yr = date.getFullYear();
      const mo = String(date.getMonth() + 1).padStart(2, '0');
      const dy = String(date.getDate()).padStart(2, '0');
      const key = `${yr}-${mo}-${dy}`;
      
      if (!data[key]) {
        data[key] = { count: 0, acCount: 0 };
      }
      data[key].count++;
      if (sub.verdict === "OK") {
        data[key].acCount++;
      }
    });

    const weeks: HeatmapCell[][] = [];
    const today = new Date();
    
    // Aligns to 53 complete Sunday-Saturday weeks
    const totalDaysNeeded = 53 * 7;
    const startDate = new Date();
    startDate.setDate(today.getDate() - totalDaysNeeded + 1);
    
    // Go backward to first Sunday
    const currentDay = startDate.getDay();
    startDate.setDate(startDate.getDate() - currentDay);

    for (let w = 0; w < 53; w++) {
      const week: HeatmapCell[] = [];
      for (let d = 0; d < 7; d++) {
        const current = new Date(startDate);
        current.setDate(startDate.getDate() + (w * 7 + d));
        
        const yr = current.getFullYear();
        const mo = String(current.getMonth() + 1).padStart(2, "0");
        const dy = String(current.getDate()).padStart(2, "0");
        const key = `${yr}-${mo}-${dy}`;
        
        week.push({
          dateStr: key,
          count: data[key]?.count || 0,
          acCount: data[key]?.acCount || 0,
          dayOfWeek: current.getDay()
        });
      }
      weeks.push(week);
    }
    return weeks;
  }, [submissions]);

  // Helper determining cell styling
  const getCellBg = (cell: HeatmapCell) => {
    if (cell.count === 0) return "bg-slate-100 hover:bg-slate-200 border border-slate-200/20";
    
    if (cell.acCount > 0) {
      if (cell.acCount === 1) return "bg-emerald-100 hover:bg-emerald-200 border border-emerald-300/30";
      if (cell.acCount <= 3) return "bg-emerald-300 hover:bg-emerald-400 border border-emerald-400/40";
      if (cell.acCount <= 5) return "bg-emerald-500 hover:bg-emerald-600 border border-emerald-500/40";
      return "bg-emerald-700 hover:bg-emerald-800 border border-emerald-700/40";
    } else {
      // Tried but not solved on this day
      if (cell.count <= 2) return "bg-amber-100/80 hover:bg-amber-200 border border-amber-200/30";
      return "bg-amber-300 hover:bg-amber-400 border border-amber-300/40";
    }
  };

  // Sort tags descending
  const sortedTags = useMemo(() => {
    return (Object.entries(stats.tags) as [string, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // Look at top 10 tags
  }, [stats.tags]);

  // Group solved difficulty ratings into simple bins
  const ratingDifficultyBins = useMemo(() => {
    // bins: Newbie (800-1100), Pupil (1200-1399), Specialist (1400-1599), Expert (1600-1899), Master+ (1900+)
    const bins = [
      { name: "入门 (800-1100)", count: 0, color: "bg-gray-400", hex: "#808080" },
      { name: "晋级 (1200-1399)", count: 0, color: "bg-green-500", hex: "#008000" },
      { name: "熟练 (1400-1599)", count: 0, color: "bg-cyan-500", hex: "#03A89E" },
      { name: "卓越 (1600-1899)", count: 0, color: "bg-blue-500", hex: "#0000FF" },
      { name: "硬核 (1900-2199)", count: 0, color: "bg-orange-500", hex: "#FF8C00" },
      { name: "至尊 (2200+)", count: 0, color: "bg-red-500", hex: "#FF0000" },
    ];

    (Object.entries(stats.ratings) as [string, number][]).forEach(([ratingStr, count]) => {
      const r = parseInt(ratingStr, 10);
      if (r < 1200) bins[0].count += count;
      else if (r < 1400) bins[1].count += count;
      else if (r < 1600) bins[2].count += count;
      else if (r < 1900) bins[3].count += count;
      else if (r < 2200) bins[4].count += count;
      else bins[5].count += count;
    });

    return bins;
  }, [stats.ratings]);

  // Render Verdict list percentages mapping
  const verdictMetaData = useMemo(() => {
    const list = [
      { key: "OK", label: "通过 (AC)", bg: "bg-emerald-500", text: "text-emerald-600" },
      { key: "WRONG_ANSWER", label: "答案错误 (WA)", bg: "bg-rose-500", text: "text-rose-600" },
      { key: "TIME_LIMIT_EXCEEDED", label: "超时 (TLE)", bg: "bg-amber-500", text: "text-amber-600" },
      { key: "MEMORY_LIMIT_EXCEEDED", label: "超内存 (MLE)", bg: "bg-purple-500", text: "text-purple-600" },
      { key: "COMPILATION_ERROR", label: "编译错误 (CE)", bg: "bg-gray-400", text: "text-gray-600" },
      { key: "RUNTIME_ERROR", label: "运行错误 (RE)", bg: "bg-indigo-500", text: "text-indigo-600" },
    ];

    const totalCount = stats.total || 1;
    let mapped = list.map((item) => {
      const count = stats.verdicts[item.key] || 0;
      const pct = Math.round((count / totalCount) * 100);
      return { ...item, count, pct };
    }).filter(x => x.count > 0);

    // Any other verdicts
    const groupedKeys = new Set(list.map(l => l.key));
    let otherCount = 0;
    (Object.entries(stats.verdicts) as [string, number][]).forEach(([k, c]) => {
      if (!groupedKeys.has(k)) {
        otherCount += c;
      }
    });

    if (otherCount > 0) {
      mapped.push({
        key: "OTHER",
        label: "其他状态",
        bg: "bg-slate-400",
        text: "text-slate-500",
        count: otherCount,
        pct: Math.round((otherCount / totalCount) * 100)
      });
    }

    return mapped;
  }, [stats]);

  if (!submissions || submissions.length === 0) {
    const platformLabel = {
      codeforces: "Codeforces",
      atcoder: "AtCoder",
      luogu: "洛谷",
      nowcoder: "牛客"
    }[platform];
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400">
        <PieChart className="w-10 h-10 mx-auto text-slate-300 mb-3" />
        <h3 className="font-bold text-slate-700 text-sm mb-1">暂无统计报告</h3>
        <p className="text-xs">请输入您的 {platformLabel} 句柄进行探索，我们将自动生成相应训练诊断图表！</p>
      </div>
    );
  }

  // Calculate difficulty dynamic peak inside the bins to scale the SVG Chart heights
  const maxBinCount = Math.max(...ratingDifficultyBins.map(b => b.count), 1);
  const maxTagCount = sortedTags.length > 0 ? sortedTags[0][1] : 1;

  // Retrieve Month names along the top of the heatmap
  const monthLabels = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

  // 1.5 Calculate 8 CP dimensions
  const radarData = useMemo(() => {
    const dimensions = [
      {
        key: "basic",
        name: "基础与模拟 (Basic)",
        tags: ["implementation", "brute force", "sortings", "sorting", "constructive algorithms", "expression parsing"],
        icon: "💻",
      },
      {
        key: "greedy",
        name: "贪心与构造 (Greedy)",
        tags: ["greedy", "constructive algorithms", "sortings", "sorting"],
        icon: "🎯",
      },
      {
        key: "dp",
        name: "动态规划 (DP)",
        tags: ["dp", "combinatorics", "probabilities", "matrices"],
        icon: "📈",
      },
      {
        key: "ds",
        name: "数据结构 (Structures)",
        tags: ["data structures", "dsu", "trees"],
        icon: "📦",
      },
      {
        key: "graph",
        name: "图论算法 (Graphs)",
        tags: ["graphs", "shortest paths", "flows", "graph matchings", "trees"],
        icon: "🌐",
      },
      {
        key: "math",
        name: "数学与数论 (Math)",
        tags: ["math", "number theory", "combinatorics", "probabilities", "matrices", "fft"],
        icon: "🔢",
      },
      {
        key: "search",
        name: "高效搜索 (Search)",
        tags: ["binary search", "ternary search", "dfs and similar", "two pointers", "divide and conquer", "meet-in-the-middle"],
        icon: "🔍",
      },
      {
        key: "advanced",
        name: "高阶算法 (Advanced)",
        tags: ["strings", "geometry", "string suffix structures", "expression parsing", "hashing", "fft", "bitmasks", "games"],
        icon: "🔮",
      },
    ];

    if (!submissions || submissions.length === 0) {
      return dimensions.map(d => ({ ...d, score: 35, count: 0 }));
    }

    // Match tags using Chinese translation mapping we got from TAG_TRANSLATIONS in utils
    const matchTag = (problemTag: string, dimensionTags: string[]) => {
      const pTag = problemTag.toLowerCase().trim();
      return dimensionTags.some(dt => {
        const dtTranslated = TAG_TRANSLATIONS[dt] || "";
        return (
          dt === pTag ||
          dtTranslated.toLowerCase() === pTag ||
          pTag.includes(dt) ||
          pTag.includes(dtTranslated.toLowerCase())
        );
      });
    };

    const dimensionStats = dimensions.map(d => {
      // Find all unique AC problems matching this dimension
      const solvedProblems = stats.uniqueACs.filter(probKey => {
        // Retrieve the problem's detail from submissions
        const sub = submissions.find(x => {
          if (x.verdict !== "OK" || !x.problem || !x.problem.index) return false;
          const k = `${x.problem.contestId || ""}-${x.problem.index}`;
          return k === probKey;
        });
        if (!sub || !sub.problem || !sub.problem.tags) return false;
        return sub.problem.tags.some(tag => matchTag(tag, d.tags));
      });

      // Calculate difficulty weighting sum for bonus
      let scoreSum = 0;
      solvedProblems.forEach(probKey => {
        const sub = submissions.find(x => {
          if (x.verdict !== "OK" || !x.problem || !x.problem.index) return false;
          const k = `${x.problem.contestId || ""}-${x.problem.index}`;
          return k === probKey;
        });
        if (sub && sub.problem) {
          const rating = sub.problem.rating || 1000;
          scoreSum += Math.max(rating, 800);
        }
      });

      return {
        ...d,
        count: solvedProblems.length,
        difficultyWeight: scoreSum,
      };
    });

    const maxCount = Math.max(...dimensionStats.map(d => d.count), 1);

    return dimensionStats.map(d => {
      let score = 20; // Beautiful baseline so that there's always a sleek profile shape
      if (d.count > 0) {
        // Combined progress: quantity contribution (60%) + average difficulty level (40%)
        const quantityRatio = d.count / maxCount;
        const avgDifficulty = d.difficultyWeight / d.count;
        // Map average difficulty (usually 800-2400+) into a 0.2 to 1.0 factor
        const difficultyFactor = Math.min(Math.max((avgDifficulty - 600) / 1800, 0.2), 1);
        
        score = Math.round(20 + (quantityRatio * 50 + difficultyFactor * 30));
      }
      return {
        ...d,
        score: Math.min(Math.max(score, 15), 100)
      };
    });
  }, [submissions, stats.uniqueACs]);

  // Radar graph configuration
  const cx = 180;
  const cy = 150;
  const rMax = 85;

  // Compute positions of each dimension index (0 to 7)
  const radarPoints = useMemo(() => {
    return radarData.map((d, i) => {
      const angle = (i * Math.PI) / 4 - Math.PI / 2;
      
      // Coordinate at score% radius
      const rVal = (d.score / 100) * rMax;
      const x = cx + rVal * Math.cos(angle);
      const y = cy + rVal * Math.sin(angle);
      
      // Label position
      const labelDist = rMax + 24;
      const xLabel = cx + labelDist * Math.cos(angle);
      const yLabel = cy + labelDist * Math.sin(angle);
      
      // Outer border intersection coordinate (100% boundary)
      const xMax = cx + rMax * Math.cos(angle);
      const yMax = cy + rMax * Math.sin(angle);

      // Determine text anchor based on angle
      let textAnchor = "middle";
      if (Math.cos(angle) > 0.2) {
        textAnchor = "start";
      } else if (Math.cos(angle) < -0.2) {
        textAnchor = "end";
      }

      return {
        ...d,
        x,
        y,
        xMax,
        yMax,
        xLabel,
        yLabel,
        textAnchor,
        angle
      };
    });
  }, [radarData]);

  // SVG Polygon path for the filled score region
  const polygonPointsStr = useMemo(() => {
    return radarPoints.map(p => `${p.x},${p.y}`).join(" ");
  }, [radarPoints]);

  const referenceOctagons = useMemo(() => {
    return [20, 40, 60, 80, 100].map(level => {
      const points = radarPoints.map((p, i) => {
        const angle = (i * Math.PI) / 4 - Math.PI / 2;
        const curR = (level / 100) * rMax;
        const x = cx + curR * Math.cos(angle);
        const y = cy + curR * Math.sin(angle);
        return `${x},${y}`;
      }).join(" ");
      return { level, points };
    });
  }, [radarPoints]);

  const platformLabel = {
    codeforces: "Codeforces",
    atcoder: "AtCoder",
    luogu: "洛谷",
    nowcoder: "牛客"
  }[platform];

  const getCoachAdvice = () => {
    const avg = stats.avgACRating || 0;
    const waCount = stats.verdicts["WRONG_ANSWER"] || 0;
    const acCount = stats.acCount || 0;
    const tCount = stats.total || 1;
    const waPct = Math.round((waCount / tCount) * 100);

    let bulletPoints: string[] = [];

    if (avg < 1100) {
      bulletPoints.push("【筑基起跑】当前出题难度段主要分布在语法及入门模拟。此阶段重在提升「手速与编码无Bug率」，推荐多写简单模拟题及循环分支练习。");
      bulletPoints.push("【建议方法】在动手敲键盘前，务必在纸上列举一两组典型数组输入，手推每一步变量变化，不要依赖提交OJ来充当测试平台。");
    } else if (avg < 1400) {
      bulletPoints.push("【思维进阶】已掌握较为扎实的基本数据结构（如栈、队列、基本排序）。当前瓶颈往往是数论性质发现、二分单调性构建与基础贪心策略。");
      bulletPoints.push("【建议方法】训练计划建议锁定在 (★1200 - ★1400) 难度，每道思维题可以给自己 20-30 分钟独立思考时间，如果完全无解，需重点精读题解中“为何能这样构造”的灵感来源。");
    } else if (avg < 1700) {
      bulletPoints.push("【黄金跃升】具备基础动态规划（背包、线性DP）和基础图论（DFS/BFS拓扑排序）的编写功底。此分段需向 Expert 专业段发起主攻，突破中阶区间DP、树状数组及线段树等重要框架。");
      bulletPoints.push("【建议方法】多归纳相似题型的状态转移方程，尤其是边界初始化（如负无穷、第零状态）。同时，尝试在比赛中锻炼一遍写对连通分量等高级模板的能力。");
    } else {
      bulletPoints.push("【硬核突破】非常出色的算法攻坚硬核玩家！已对高级时空复杂度压缩、重心和多源最短路径有敏锐触觉。后续应进阶高级期望概率DP、网络最大流、后缀自动机、几何计算等。");
      bulletPoints.push("【建议方法】可以着手接触整场 ABC 或 Codeforces Div.2 的 D/E/F 档。对于已AC的科学题，重点观察更高级高手的运行时间与内存开销，吸纳其函数写法与指针优化设计。");
    }

    if (waPct > 35) {
      bulletPoints.push(`【注意提交规范】您的答案错误 (WA) 占比达到 ${waPct}%，偏离安全指标。建议坚持“编写前纸推、提交前自选自编 5 组边界极值极验”习惯。`);
    }
    if (stats.verdicts["TIME_LIMIT_EXCEEDED"] && stats.verdicts["TIME_LIMIT_EXCEEDED"] > 3) {
      bulletPoints.push("【优化复杂度】诊断发现超时(TLE)超限频发。简易算法 1秒运算约为 10^8 次级别，要提升通过剪枝、双指针或散列表代替嵌套循环的优化敏感度。");
    }

    return bulletPoints;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Interactive PDF report download Banner */}
      <div className="md:col-span-2 bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 border border-slate-800 rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -z-10 group-hover:bg-indigo-500/15 transition-all duration-500"></div>
        <div className="absolute left-1/3 bottom-0 w-60 h-60 bg-emerald-500/5 rounded-full blur-2xl -z-10"></div>
        
        <div className="space-y-1 relative z-10 text-left">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md">
              REPORT ENGINE 🚀
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">排位战力透视与训练白皮书</span>
          </div>
          <h2 className="text-base font-black text-slate-100 tracking-tight flex items-center gap-1.5 pt-1">
            <Award className="w-5 h-5 text-amber-500 fill-current animate-pulse" />
            算法战力诊断及 A4 PDF 报告导出
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed font-medium">
            基于当前获取到的 {stats.uniqueACs.length} 道排位 AC 题目，算法功底八维雷达及提交状态诊断模型已生成完毕。您可以一键渲染高分辨率矢量报告，用于复盘、离线另存为 PDF 或本地留档打卡。
          </p>
        </div>

        <button
          onClick={() => setShowReportModal(true)}
          className="relative z-10 flex-shrink-0 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-5 py-3 rounded-xl transition duration-150 active:scale-95 flex items-center justify-center gap-2 shadow-md cursor-pointer"
        >
          <FileDown className="w-4 h-4 text-slate-950" />
          <span>生成 PDF 训练报告</span>
        </button>
      </div>

      {/* 1. Quick Stats overview grids */}
      <div className="md:col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-lg">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AC 通过题数</div>
            <div className="text-lg font-black text-slate-800 font-mono">
              {stats.uniqueACs.length} <span className="text-[10px] text-slate-400 font-normal">题</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-lg">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AC 平均分 (估)</div>
            <div className="text-lg font-black text-slate-800 font-mono">
              {stats.avgACRating || "N/A"} <span className="text-[10px] text-slate-400 font-normal">★</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 text-blue-600 rounded-lg">
            <ListFilter className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">累计提交数</div>
            <div className="text-lg font-black text-slate-800 font-mono">
              {stats.total} <span className="text-[10px] text-slate-400 font-normal">次</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-3">
          <div className="p-3 bg-rose-500/10 text-rose-500 rounded-lg">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">提交 AC 率</div>
            <div className="text-lg font-black text-slate-800 font-mono">
              {Math.round((stats.acCount / (stats.total || 1)) * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* 1.5 Real-Time Activity Grid Heatmap - Occupying Full Width */}
      {platform === "codeforces" && (
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-bold text-slate-850 text-sm flex items-center gap-1.5">
                <CalendarRange className="w-4 h-4 text-emerald-500" />
                Codeforces 活跃度刷题热力图 (近一年)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                记录了该用户近期高频尝试与成功 AC 的排位足迹。绿色色阶代表通过题，橙色色阶代表挣扎与调试。
              </p>
            </div>

            {/* Color Guides Legend */}
            <div className="flex items-center gap-2.5 text-[10px] text-slate-450 font-semibold self-end">
              <span>待沉淀</span>
              <span className="w-2.5 h-2.5 bg-slate-100 rounded-sm inline-block"></span>
              <span className="w-2.5 h-2.5 bg-amber-100 rounded-sm inline-block" title="调试有提交但未AC"></span>
              <span className="w-2.5 h-2.5 bg-emerald-100 rounded-sm inline-block" title="少量AC"></span>
              <span className="w-2.5 h-2.5 bg-emerald-300 rounded-sm inline-block"></span>
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm inline-block"></span>
              <span className="w-2.5 h-2.5 bg-emerald-700 rounded-sm inline-block"></span>
              <span>大捷</span>
            </div>
          </div>

          {/* Heatmap Visual Matrix container */}
          <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
            <div className="min-w-[700px] flex gap-1">
              {/* Day indices column */}
              <div className="flex flex-col justify-between pr-2 text-[9px] font-bold text-slate-400 font-mono select-none h-24 pt-4 leading-none">
                <span>日</span>
                <span>二</span>
                <span>四</span>
                <span>六</span>
              </div>

              {/* Main grid */}
              <div className="flex-1 flex gap-[3px]">
                {heatmapWeeks.map((week, wIdx) => {
                  // Find if a month name should be placed at the top coordinate
                  const firstDayStr = week[0].dateStr;
                  const d = new Date(firstDayStr);
                  const dayOfMonth = d.getDate();
                  const showMonthLabel = dayOfMonth <= 7;
                  const monthLabel = showMonthLabel ? monthLabels[d.getMonth()] : "";

                  return (
                    <div key={wIdx} className="flex-1 flex flex-col gap-[3.5px] items-center relative">
                      {/* Month Label placement floating top */}
                      {showMonthLabel && (
                        <span className="absolute -top-4 left-0 text-[8.5px] font-black text-slate-400 whitespace-nowrap leading-none select-none">
                          {monthLabel}
                        </span>
                      )}

                      <div className="h-4"></div> {/* spacer for float label */}
                      
                      {week.map((cell) => {
                        const formattedDate = new Date(cell.dateStr).toLocaleDateString("zh-CN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        });
                        const tooltipMsg = `${formattedDate} :\n• 总计提交 ${cell.count} 次\n• 成功攻克 AC ${cell.acCount} 题`;

                        return (
                          <div
                            key={cell.dateStr}
                            title={tooltipMsg}
                            className={`w-[11px] h-[11px] sm:w-3 sm:h-3 rounded-[2.5px] transition-all duration-150 cursor-pointer ${getCellBg(cell)}`}
                          ></div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Verdict Status Breakdown Panel */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 mb-4">
            <PieChart className="w-4 h-4 text-emerald-500" />
            提交状态分布 (Verdict)
          </h3>
          
          <div className="space-y-3.5">
            {verdictMetaData.map((v) => (
              <div key={v.key} className="text-xs">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-semibold text-slate-700">{v.label}</span>
                  <span className="text-slate-400 font-mono">
                    <strong className="text-slate-700 font-semibold">{v.count}</strong> 次 ({v.pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className={`${v.bg} h-full rounded-full`} style={{ width: `${v.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {stats.total > 0 && (stats.verdicts["WRONG_ANSWER"] || 0) > (stats.verdicts["OK"] || 0) && (
          <div className="mt-6 p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-[11px] text-amber-700 flex gap-2 items-start leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>
              检测到您的 **答案错误 (WA)** 占比偏高。建议在写代码前使用纸笔列出更详尽的样例推导，并重视边界极值条件的自测。
            </span>
          </div>
        )}
      </div>

      {/* 3. Difficulty ratings (Vertical SVG Bar Chart) */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 mb-4">
          <BarChart4 className="w-4 h-4 text-blue-500" />
          AC 题目难度段阶梯
        </h3>

        {/* Pure SVG Bar Chart */}
        <div className="mt-4 flex flex-col justify-between h-[280px]">
          <svg viewBox="0 0 300 220" className="w-full overflow-visible">
            {/* Draw standard grid lines */}
            <line x1="20" y1="180" x2="290" y2="180" stroke="#e2e8f0" strokeWidth="1.5" />
            <line x1="20" y1="130" x2="290" y2="130" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="20" y1="80" x2="290" y2="80" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="20" y1="30" x2="290" y2="30" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />

            {/* Draw bars loop */}
            {ratingDifficultyBins.map((bin, index) => {
              const barWidth = 28;
              const barGap = 15;
              const x = 30 + index * (barWidth + barGap);
              
              // Scale height based on maximum value
              const barHeight = bin.count > 0 ? (bin.count / maxBinCount) * 140 : 0;
              const y = 180 - barHeight;

              return (
                <g key={bin.name}>
                  {/* Rounded bar elements */}
                  {bin.count > 0 && (
                    <>
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill={bin.hex}
                        fillOpacity="0.85"
                        rx="4"
                        className="transition-all duration-300 hover:fill-opacity-100"
                      />
                      <text
                        x={x + barWidth / 2}
                        y={y - 6}
                        textAnchor="middle"
                        className="font-mono text-[10px] font-bold fill-slate-700"
                      >
                        {bin.count}
                      </text>
                    </>
                  )}

                  {/* Horizontal index dots in bottom */}
                  <circle cx={x + barWidth / 2} cy="180" r="2.5" fill={bin.hex} />
                </g>
              );
            })}
          </svg>

          {/* Table index descriptors */}
          <div className="grid grid-cols-6 gap-0.5 text-center text-[9px] font-medium text-slate-500 mt-2">
            {ratingDifficultyBins.map((bin) => {
              const label = bin.name.split(" ")[0];
              return (
                <div key={bin.name} className="truncate">
                  <div className={`w-1.5 h-1.5 rounded-full inline-block mr-1 ${bin.color}`}></div>
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Eight-Dimensional Competitive Programming Radar Chart */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 mb-1">
            <Compass className="w-4 h-4 text-indigo-500" />
            算法功底八维诊断图 (CP Radar)
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5 mb-4">
            测量通过大题的「数量分布」与「平均难度阶梯」双向拟合，实时绘出您的多维算法竞争力。
          </p>
        </div>

        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <svg viewBox="0 0 380 340" className="w-full overflow-visible max-w-[350px]">
            <defs>
              <linearGradient id="radarIndigoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* Render concentric octagon grid levels */}
            {referenceOctagons.map(oct => (
              <polygon
                key={oct.level}
                points={oct.points}
                fill="none"
                stroke={oct.level === 100 ? "#94a3b8" : "#e2e8f0"}
                strokeWidth={oct.level === 100 ? "1.5" : "0.75"}
                strokeDasharray={oct.level === 100 ? "none" : "3 3"}
              />
            ))}

            {/* Show grid division radar lines */}
            {radarPoints.map((p, i) => (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={p.xMax}
                y2={p.yMax}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
            ))}

            {/* Filled player ability polygon */}
            {polygonPointsStr.trim() !== "" && (
              <polygon
                points={polygonPointsStr}
                fill="url(#radarIndigoGrad)"
                stroke="#4f46e5"
                strokeWidth="2.5"
                strokeLinejoin="round"
                className="transition-all duration-300 hover:fill-opacity-90"
              />
            )}

            {/* Interaction checkpoints and label text */}
            {radarPoints.map((p, i) => (
              <g key={i} className="group/node">
                {/* Score indicators at the point */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill="#4f46e5"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className="transition-all duration-150 cursor-pointer group-hover/node:r-[5.5] group-hover/node:fill-amber-500"
                />

                {/* Score hover badge inside SVG */}
                <title>{`${p.name}\n水平得分: ${p.score}分\nAC数量: ${p.count}题`}</title>

                {/* Outer labels */}
                <text
                  x={p.xLabel}
                  y={p.yLabel - 2}
                  textAnchor={p.textAnchor}
                  className="font-bold text-[11px] fill-slate-700 select-none group-hover/node:fill-indigo-600 transition duration-150"
                >
                  {p.name}
                </text>
                <text
                  x={p.xLabel}
                  y={p.yLabel + 10}
                  textAnchor={p.textAnchor}
                  className="font-mono font-medium text-[9px] fill-slate-400 group-hover/node:fill-indigo-500 select-none"
                >
                  已过 {p.count} 题 / {p.score} pts
                </text>
              </g>
            ))}

            {/* Center dot */}
            <circle cx={cx} cy={cy} r="3" fill="#94a3b8" />
          </svg>
        </div>
      </div>

      {/* 4. Solved Tags Affinity list */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 mb-4">
          <BookOpen className="w-4 h-4 text-purple-500" />
          知识偏好深度榜 (Problem Tag Affinities)
        </h3>

        {sortedTags.length > 0 ? (
          <div className="space-y-3">
            {sortedTags.map(([tag, count]) => {
              const percent = Math.round((count / maxTagCount) * 100);
              return (
                <div key={tag} className="text-xs">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-medium text-slate-700">{translateTag(tag)}</span>
                    <span className="text-slate-400 font-mono text-[10.5px]">
                      已AC <strong className="text-purple-600 font-bold">{count}</strong> 题
                    </span>
                  </div>
                  <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden border border-slate-100">
                    <div
                      className="bg-linear-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center text-slate-300 font-mono text-xs">
            暂无通过题目，尚未形成 algorithm 知识图谱 🧩
          </div>
        )}
      </div>

      {/* 5. Complete Personal Problem Portfolio Panel with Algorithm Tag Categorizer */}
      <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-4 text-left">
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-505" />
              个人刷题履历与智能归纳 (Problem Portfolio & Diagnoses)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              追踪您练习过的每一道题目，并按 **通过 (AC)**、**解答错误 (WA)**、**其他尝试 (Attempted)** 状态与 **算法分类** 细化展示。
            </p>
          </div>
          
          {/* Quick Stats overview of Active Category */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-600 font-bold">
              分类: {selectedTag === "all" ? "全部算法" : selectedTag === "uncategorized" ? "未分类" : translateTag(selectedTag)}
            </span>
            <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 font-bold">
              已通过: {tagsStats[selectedTag]?.ac || 0}
            </span>
            <span className="px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 font-bold">
              解答错误: {tagsStats[selectedTag]?.wa || 0}
            </span>
            <span className="px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg text-amber-700 font-bold">
              尝试中: {tagsStats[selectedTag]?.attempted || 0}
            </span>
          </div>
        </div>

        {/* Dynamic Inner Layout splits */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT RAIL: Algorithm Tag list with search */}
          <div className="lg:col-span-4 bg-slate-50/50 border border-slate-100 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-1.5 mb-1 px-1 text-left">
              <span className="font-bold text-xs text-slate-700">算法分类筛选</span>
              <span className="text-[10px] text-slate-400">({distinctTagsSorted.length + (tagsStats["uncategorized"] ? 2 : 1)} 个分类)</span>
            </div>
            
            {/* Tag Search Input */}
            <div className="relative">
              <input
                type="text"
                value={tagSearchQuery}
                onChange={(e) => setTagSearchQuery(e.target.value)}
                placeholder="搜索算法知识分类 (e.g. 贪心)..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-slate-400 text-slate-850"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              {tagSearchQuery && (
                <button
                  type="button"
                  onClick={() => setTagSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* List scrollbox */}
            <div className="max-h-[380px] overflow-y-auto space-y-1.5 pr-1.5 scrollbar-thin scrollbar-thumb-slate-200">
              {/* Virtual Tag: All */}
              <button
                type="button"
                onClick={() => {
                  setSelectedTag("all");
                  setSelectedStatus("all");
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                  selectedTag === "all"
                    ? "bg-indigo-650 border-indigo-650 text-white shadow-xs"
                    : "bg-white hover:bg-slate-50 border-slate-200/60 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">🌐 所有算法大类 (All)</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${selectedTag === "all" ? "bg-indigo-500/80 text-white" : "bg-slate-100 text-slate-500"}`}>
                    {tagsStats["all"]?.total || 0}
                  </span>
                </div>
                <div className="flex gap-2 text-[9px] font-mono font-semibold">
                  <span className={selectedTag === "all" ? "text-indigo-100" : "text-emerald-600"}>AC: {tagsStats["all"]?.ac || 0}</span>
                  <span className={selectedTag === "all" ? "text-indigo-100" : "text-rose-600"}>WA: {tagsStats["all"]?.wa || 0}</span>
                  <span className={selectedTag === "all" ? "text-indigo-100" : "text-amber-600"}>尝试: {tagsStats["all"]?.attempted || 0}</span>
                </div>
              </button>

              {/* Unique computed tags list filtered by tagSearchQuery */}
              {distinctTagsSorted
                .filter(tag => {
                  if (!tagSearchQuery) return true;
                  const query = tagSearchQuery.toLowerCase();
                  const trans = translateTag(tag).toLowerCase();
                  return tag.includes(query) || trans.includes(query);
                })
                .map(tag => {
                  const s = tagsStats[tag];
                  const tagLabel = translateTag(tag);
                  const isSelected = selectedTag === tag;
                  
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setSelectedTag(tag);
                        setSelectedStatus("all");
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                          : "bg-white hover:bg-slate-50 border-slate-200/60 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-bold text-xs truncate" title={tagLabel}>
                          🧩 {tagLabel} <span className={`text-[9.5px] font-mono capitalize opacity-65 ${isSelected ? "text-slate-200" : "text-slate-400"}`}>({tag})</span>
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${isSelected ? "bg-indigo-500/80 text-white" : "bg-slate-100 text-slate-500"}`}>
                          {s.total}
                        </span>
                      </div>
                      <div className="flex gap-2 text-[9px] font-mono font-semibold text-left">
                        <span className={isSelected ? "text-indigo-100" : "text-emerald-655"}>AC: {s.ac}</span>
                        <span className={isSelected ? "text-indigo-100" : "text-rose-655"}>WA: {s.wa}</span>
                        <span className={isSelected ? "text-indigo-100" : "text-amber-655"}>尝试: {s.attempted}</span>
                      </div>
                    </button>
                  );
                })}
              
              {/* Virtual Tag: Uncategorized */}
              {tagsStats["uncategorized"] && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTag("uncategorized");
                    setSelectedStatus("all");
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                    selectedTag === "uncategorized"
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                      : "bg-white hover:bg-slate-50 border-slate-200/60 text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">❔ 独立题目 (未分类)</span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${selectedTag === "uncategorized" ? "bg-indigo-500/80 text-white" : "bg-slate-100 text-slate-500"}`}>
                      {tagsStats["uncategorized"]?.total || 0}
                    </span>
                  </div>
                  <div className="flex gap-2 text-[9px] font-mono font-semibold">
                    <span className={selectedTag === "uncategorized" ? "text-indigo-100" : "text-emerald-655"}>AC: {tagsStats["uncategorized"]?.ac || 0}</span>
                    <span className={selectedTag === "uncategorized" ? "text-indigo-100" : "text-rose-655"}>WA: {tagsStats["uncategorized"]?.wa || 0}</span>
                    <span className={selectedTag === "uncategorized" ? "text-indigo-100" : "text-amber-655"}>尝试: {tagsStats["uncategorized"]?.attempted || 0}</span>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* RIGHT DETAILED WORKSPACE: Filterable table list */}
          <div className="lg:col-span-8 flex flex-col gap-4 w-full overflow-hidden text-left">
            
            {/* Top workspace filter controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
              {/* Status Tab buttons */}
              <div className="flex bg-slate-200/60 p-1 rounded-lg border border-slate-200/40 w-fit flex-wrap gap-1">
                {([
                  { id: "all", label: "全部", count: tagsStats[selectedTag]?.total || 0 },
                  { id: "AC", label: "通过", count: tagsStats[selectedTag]?.ac || 0 },
                  { id: "WA", label: "解答错误", count: tagsStats[selectedTag]?.wa || 0 },
                  { id: "Attempted", label: "其他尝试", count: tagsStats[selectedTag]?.attempted || 0 }
                ] as const).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedStatus(opt.id as any)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all duration-150 cursor-pointer ${
                      selectedStatus === opt.id
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-850"
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className="font-mono text-[10px] ml-1 opacity-70">({opt.count})</span>
                  </button>
                ))}
              </div>

              {/* Text search input inside portfolio */}
              <div className="relative max-w-sm w-full">
                <input
                  type="text"
                  value={probSearchQuery}
                  onChange={(e) => setProbSearchQuery(e.target.value)}
                  placeholder="检索本分类题目编号 or 标题..."
                  className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-4 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-slate-400 text-slate-850"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search className="w-3.5 h-3.5" />
                </span>
                {probSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setProbSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Main problems presentation listing */}
            <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-xs">
              {portfolioProblemsFiltered.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-extrabold select-none">
                        <th className="py-3 px-4 w-20">状态</th>
                        <th className="py-3 px-3 w-28">题目代码</th>
                        <th className="py-3 px-3">题目名称</th>
                        <th className="py-3 px-3 w-24">难度</th>
                        <th className="py-3 px-3">对应算法</th>
                        <th className="py-3 px-4 text-right w-28 font-bold">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {portfolioProblemsFiltered.map((p) => {
                        const probIdStr = p.id;
                        const ratingVal = p.rating;
                        const actualProbUrl = getProblemUrl(platform, p.contestId, p.index);
                        
                        let starColor = "text-slate-400";
                        if (ratingVal) {
                          if (ratingVal >= 1900) starColor = "text-orange-500 fill-orange-500";
                          else if (ratingVal >= 1600) starColor = "text-blue-500 fill-blue-500";
                          else if (ratingVal >= 1400) starColor = "text-cyan-500 fill-cyan-500";
                          else if (ratingVal >= 1200) starColor = "text-green-500 fill-green-500";
                        }

                        let statusBadge = (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            尝试
                          </span>
                        );
                        if (p.status === "AC") {
                          statusBadge = (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              通过 (AC)
                            </span>
                          );
                        } else if (p.status === "WA") {
                          statusBadge = (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100 inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              错误 (WA)
                            </span>
                          );
                        }

                        return (
                          <tr key={probIdStr} className="hover:bg-slate-50/50 transition">
                            <td className="py-3 px-4 font-semibold">{statusBadge}</td>
                            
                            <td className="py-3 px-3 font-mono font-bold text-slate-750">
                              {p.contestId ? `${p.contestId}${p.index}` : p.index}
                            </td>

                            <td className="py-3 px-3 font-bold text-slate-800 hover:text-indigo-600 transition truncate max-w-[180px]" title={p.name}>
                              <a href={actualProbUrl} target="_blank" rel="noreferrer" className="hover:underline">
                                {p.name}
                              </a>
                            </td>

                            <td className="py-3 px-3 font-semibold">
                              {ratingVal ? (
                                <span className="font-mono text-slate-750 flex items-center gap-0.5" title={`难度段分值: ${ratingVal}`}>
                                  <span className={`text-[10px] ${starColor}`}>★</span>
                                  {ratingVal}
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>

                            <td className="py-3 px-3">
                              <div className="flex flex-wrap gap-1 max-w-[210px]">
                                {p.tags && p.tags.length > 0 ? (
                                  p.tags.slice(0, 3).map((tag: string) => (
                                    <button
                                      key={tag}
                                      type="button"
                                      onClick={() => setSelectedTag(tag.toLowerCase())}
                                      className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-550 hover:bg-indigo-50 hover:text-indigo-600 transition font-extrabold cursor-pointer"
                                      title="点击筛选以此分类"
                                    >
                                      {translateTag(tag)}
                                    </button>
                                  ))
                                ) : (
                                  <span className="text-slate-300 text-[10px]">独立测试</span>
                                )}
                                {p.tags && p.tags.length > 3 && (
                                  <span className="text-[10px] text-slate-450 font-bold">+{p.tags.length - 3}</span>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <a
                                  href={actualProbUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="在OJ官网中打开"
                                  className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                                
                                <button
                                  type="button"
                                  onClick={() => handleGetAIExplanation(p)}
                                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold tracking-wide transition flex items-center gap-1 cursor-pointer animate-pulse"
                                  title="呼叫大模型竞赛助手进行深度思路诊断、代码剖析与Bug指引"
                                >
                                  <Sparkles className="w-3 h-3 text-indigo-600 fill-current" />
                                  <span>智能诊断</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <div className="p-3 bg-slate-50 text-slate-300 rounded-full border border-slate-100">
                    <ListFilter className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-750 text-xs">没有匹配的题目目录</h4>
                  <p className="text-[10px] max-w-xs text-slate-400 leading-relaxed">
                    当前分类下暂无已提交记录。您可以选择其他算法分类导航，或者输入不同句柄、更换OJ查看最新刷题状态。
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5.5 Dynamic Interactive AI Diagnosis Overlay Modal Dialog */}
      {activeExplainProblem && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
          id="explain-overlay-modal-backdrop"
          onClick={(e) => {
            if ((e.target as HTMLElement).id === "explain-overlay-modal-backdrop") {
              setActiveExplainProblem(null);
            }
          }}
        >
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden my-4 select-text">
            {/* Modal Header bar */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-left">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Sparkles className="w-5 h-5 animate-pulse fill-current" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800">
                    AI 算法大观 • 智能解题诊断室
                  </h4>
                  <p className="text-[10.5px] text-slate-450 font-bold uppercase tracking-wider block mt-0.5">
                    {platform === "atcoder" ? "AtCoder" : platform === "luogu" ? "洛谷" : platform === "nowcoder" ? "牛客" : "Codeforces"} • {activeExplainProblem.contestId ? `${activeExplainProblem.contestId}${activeExplainProblem.index}` : activeExplainProblem.index}
                  </p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setActiveExplainProblem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                title="关闭"
              >
                <X className="w-4 h-4 font-bold" />
              </button>
            </div>

            {/* Modal Sub title / Tags bar */}
            <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-3 text-left">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-extrabold text-slate-800 text-sm">
                    {activeExplainProblem.name}
                  </span>
                  {activeExplainProblem.rating && (
                    <span className="ml-2 font-mono bg-indigo-100 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded text-[10px]">
                      ★{activeExplainProblem.rating}
                    </span>
                  )}
                </div>

                {/* Inline Programming language Switcher */}
                <div className="flex bg-slate-250 p-0.5 rounded-lg border border-slate-200 items-center">
                  <span className="text-[9px] text-slate-500 font-bold px-1.5 uppercase select-none">代码偏好:</span>
                  {(["C++", "Python", "Java", "Go"] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => triggerExplanationWithLanguage(activeExplainProblem, lang)}
                      className={`px-2.5 py-0.5 text-[10.5px] font-bold rounded transition-all duration-155 cursor-pointer ${
                        explainLanguage === lang
                          ? "bg-white text-indigo-700 shadow-xs font-black"
                          : "text-slate-500 hover:text-slate-850"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Badges of Tags */}
              <div className="flex flex-wrap gap-1 mt-2">
                {activeExplainProblem.tags && activeExplainProblem.tags.map((tag: string) => (
                  <span key={tag} className="px-1.5 py-0.5 text-[10px] bg-indigo-50 text-indigo-650 rounded font-bold border border-indigo-100/45">
                    {translateTag(tag)}
                  </span>
                ))}
              </div>
            </div>

            {/* Modal Body Container with customized scroll */}
            <div className="p-6 overflow-y-auto flex-1 bg-white min-h-[250px] scrollbar-thin scrollbar-thumb-slate-200">
              {aiLoading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  <div className="text-center space-y-1">
                    <p className="text-xs text-slate-800 font-bold">
                      正在呼叫 ACM 教练模型，进行算法诊断与代码重构建议...
                    </p>
                    <p className="text-[10px] text-slate-400">
                      后台正在拉取该语言下本题的核心考点、状态转换思路以及防坑指引
                    </p>
                  </div>
                </div>
              ) : aiExplanation ? (
                <div className="text-slate-705 max-w-none">
                  {renderMarkdownText(aiExplanation)}
                </div>
              ) : (
                <div className="py-16 text-center text-slate-450 flex flex-col items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6 text-indigo-400 animate-bounce" />
                  <p className="text-xs text-slate-650 font-bold">AI 智能教练就绪</p>
                  <p className="text-[10.5px] text-slate-400 max-w-md">
                    点击右侧对话框，或者更改上方“代码偏好”语言，大模型竞赛助教将即刻为你生成精简的核心分析与解题策略！
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer bar */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-semibold text-left select-none">
                💡 提示：可以在对话框中学习并前往 Sandbox 标签页手动提交测试及留档。
              </span>
              
              <div className="flex items-center gap-2">
                <a
                  href={getProblemUrl(platform, activeExplainProblem.contestId, activeExplainProblem.index)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 rounded-lg text-[11px] font-bold tracking-wide transition-all duration-150 flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>跳转原题官网</span>
                </a>
                
                <button
                  type="button"
                  onClick={() => setActiveExplainProblem(null)}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg text-[11px] font-bold tracking-wide shadow-xs transition-all duration-150 cursor-pointer"
                >
                  我知道了
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- PDF Report Preview and Print Container ----------------- */}
      {showReportModal && (
        <>
          {/* Inject Dynamic Print Stylesheet to guarantee pristine print outcomes */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              /* Complete window override */
              html, body {
                background: #ffffff !important;
                color: #0f172a !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: 100% !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              /* Hide all components of the regular SPA interface */
              #root, .no-print, header, footer, nav, button, #report-modal-backdrop-toolbar {
                display: none !important;
                height: 0 !important;
                overflow: hidden !important;
                visibility: hidden !important;
              }
              
              /* Reposition report block at absolute top-left for printable paper alignment */
              .print-report-root {
                display: block !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 1.5cm !important;
                box-shadow: none !important;
                border: none !important;
                background: white !important;
                visibility: visible !important;
              }
              
              .avoid-break {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
            }
          `}} />

          <div 
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 overflow-y-auto no-print flex justify-center p-4 md:p-6"
            id="report-modal-backdrop"
            onClick={(e) => {
              if ((e.target as HTMLElement).id === "report-modal-backdrop") {
                setShowReportModal(false);
              }
            }}
          >
            <div className="bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-800 flex flex-col my-4 md:my-6 overflow-hidden">
              {/* Toolbar Controls Header */}
              <div id="report-modal-backdrop-toolbar" className="bg-slate-950 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500 fill-current" />
                  <div className="text-left">
                    <h4 className="font-extrabold text-sm text-slate-100">算法能力大观诊断报告引擎</h4>
                    <p className="text-[10px] text-slate-400 font-bold tracking-wide">PORTABLE PDF EXPORT ENGINE • VECTOR HIGH PERFORMANCE</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => window.print()}
                    className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition duration-150 flex items-center gap-1.5 shadow cursor-pointer"
                    title="调用系统打印组件，在配置中选择‘另存为 PDF’或打印输出"
                  >
                    <FileDown className="w-4 h-4 text-slate-950" />
                    <span>另存为 PDF / 打印报告</span>
                  </button>
                  
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-850 rounded-xl transition cursor-pointer"
                    title="返回"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Paper Preview Wrap Area */}
              <div className="p-4 md:p-8 bg-slate-950 overflow-y-auto flex-1 flex flex-col items-center">
                <div className="text-xs text-amber-200/95 bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 rounded-xl max-w-2xl text-center mb-6 leading-relaxed">
                  💡 <strong>提示：</strong> 以下为 A4 报告高保真纸面内容预览。点击右上角 <strong>「另存为 PDF / 打印报告」</strong>，在系统打印对话框中将目标打印机设为 <strong>“另存为 PDF” (Save as PDF)</strong> 即可输出清晰、矢量的高清报告。
                </div>
                
                {/* PDF Print Content Document - formatted like a standard A4 Report Card */}
                <div className="print-report-root bg-white w-full max-w-[210mm] text-slate-900 p-8 md:p-12 rounded-xl border border-slate-200 shadow-2xl space-y-8 select-text font-sans text-left">
                  
                  {/* Report Main Header */}
                  <div className="border-b-2 border-slate-900 pb-5 flex justify-between items-end">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white px-2 py-0.5 rounded">
                          Official Diagnostic
                        </span>
                        <span className="text-[10px] text-slate-450 font-mono font-bold">CODE: CP-REP-{username.toUpperCase()}</span>
                      </div>
                      <h1 className="text-xl md:text-2xl font-black text-slate-904 tracking-tight">
                        算法排位竞争力与核心素养诊断书
                      </h1>
                      <p className="text-xs text-slate-500 font-bold">
                        Algorithmic Core Competency & Competitive Programming Report Card
                      </p>
                    </div>
                    
                    {/* Badge */}
                    <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl text-center min-w-[100px] hidden sm:block">
                      <div className="text-[9px] text-indigo-500 font-black uppercase tracking-wider leading-none">OJ PLATFORM</div>
                      <div className="text-sm font-black text-indigo-950 mt-1.5 uppercase leading-none">{platformLabel}</div>
                    </div>
                  </div>

                  {/* Metadata fields */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-450 block font-bold">选手标识符 / ID</span>
                      <strong className="text-slate-800 font-black block mt-0.5 text-sm">{username}</strong>
                    </div>
                    <div>
                      <span className="text-slate-450 block font-bold">评测渠道 / OJ</span>
                      <strong className="text-slate-800 font-extrabold block mt-0.5 text-sm uppercase">{platformLabel}</strong>
                    </div>
                    <div>
                      <span className="text-slate-450 block font-bold">诊断数据源基数</span>
                      <strong className="text-slate-800 font-black block mt-0.5 text-sm">{stats.total} 次提交录入</strong>
                    </div>
                    <div>
                      <span className="text-slate-450 block font-bold">报告出具时间</span>
                      <strong className="text-slate-800 font-bold block mt-0.5 text-xs font-mono">
                        {new Date().toLocaleString("zh-CN", { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </strong>
                    </div>
                  </div>

                  {/* SECTION 1: CORE STATS & SUMMARY */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5 border-b border-slate-205 pb-1.5 tracking-wide/tight">
                      <span className="w-1.5 h-3 bg-indigo-600 rounded-xs"></span>
                      一、 排位核心宏观指标汇总 (Core Statistics Summary)
                    </h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div className="bg-slate-50/50 p-3.5 border border-slate-100 rounded-xl">
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AC 通过题数</div>
                        <div className="text-base font-black text-slate-800 font-mono mt-0.5">
                          {stats.uniqueACs.length} <span className="text-[10px] text-slate-400 font-normal">题</span>
                        </div>
                      </div>
                      <div className="bg-slate-50/50 p-3.5 border border-slate-100 rounded-xl">
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AC 均分 (估算)</div>
                        <div className="text-base font-black text-slate-805 font-mono mt-0.5">
                          ★{stats.avgACRating || "N/A"}
                        </div>
                      </div>
                      <div className="bg-slate-50/50 p-3.5 border border-slate-100 rounded-xl">
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">评测累积提交</div>
                        <div className="text-base font-black text-slate-800 font-mono mt-0.5">
                          {stats.total} <span className="text-[10px] text-slate-400 font-normal">次</span>
                        </div>
                      </div>
                      <div className="bg-slate-50/50 p-3.5 border border-slate-100 rounded-xl">
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">提交 AC 比率</div>
                        <div className="text-base font-black text-slate-800 font-mono mt-0.5">
                          {Math.round((stats.acCount / (stats.total || 1)) * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: THE CRITICAL RADAR AND DIFFICULTIES CHART */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start avoid-break">
                    
                    {/* Eight-Dimensional Radar Map */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center flex flex-col items-center">
                      <h4 className="text-[11px] font-black tracking-wider text-slate-505 uppercase mb-2">
                        🎯 算法功底八维诊断图 (Core Radar Diagnostics)
                      </h4>
                      
                      <div className="w-full max-w-[280px] flex items-center justify-center min-h-[250px]">
                        <svg viewBox="0 0 380 340" className="w-full overflow-visible max-w-[250px] mx-auto">
                          {/* Render concentric octagon grid levels */}
                          {referenceOctagons.map(oct => (
                            <polygon
                              key={oct.level}
                              points={oct.points}
                              fill="none"
                              stroke={oct.level === 100 ? "#64748b" : "#cbd5e1"}
                              strokeWidth={oct.level === 100 ? "1.5" : "0.75"}
                              strokeDasharray={oct.level === 100 ? "none" : "3 3"}
                            />
                          ))}

                          {/* Show grid division radar lines */}
                          {radarPoints.map((p, i) => (
                            <line
                              key={i}
                              x1={cx}
                              y1={cy}
                              x2={p.xMax}
                              y2={p.yMax}
                              stroke="#cbd5e1"
                              strokeWidth="1"
                            />
                          ))}

                          {/* Filled player ability polygon */}
                          {polygonPointsStr.trim() !== "" && (
                            <polygon
                              points={polygonPointsStr}
                              fill="rgba(79, 70, 229, 0.22)"
                              stroke="#4f46e5"
                              strokeWidth="2.5"
                              strokeLinejoin="round"
                            />
                          )}

                          {/* Interaction checkpoints and label text */}
                          {radarPoints.map((p, i) => (
                            <g key={i}>
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r="4"
                                fill="#4f46e5"
                                stroke="#ffffff"
                                strokeWidth="1.5"
                              />

                              {/* Outer labels text */}
                              <text
                                x={p.xLabel}
                                y={p.yLabel - 2}
                                textAnchor={p.textAnchor}
                                className="font-bold text-[12px] fill-slate-800 select-none"
                              >
                                {p.name.split(" ")[0]}
                              </text>
                              <text
                                x={p.xLabel}
                                y={p.yLabel + 11}
                                textAnchor={p.textAnchor}
                                className="font-mono font-black text-[11px] fill-indigo-700"
                              >
                                {p.score}分
                              </text>
                            </g>
                          ))}

                          <circle cx={cx} cy={cy} r="3" fill="#64748b" />
                        </svg>
                      </div>
                    </div>

                    {/* Difficulty Bins Chart */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center flex flex-col items-center">
                      <h4 className="text-[11px] font-black tracking-wider text-slate-505 uppercase mb-2">
                        📊 AC 题目难度段阶梯分布 (AC Ratings Segments)
                      </h4>
                      
                      <div className="w-full max-w-[280px] flex flex-col justify-between h-[250px] pb-2">
                        <svg viewBox="0 0 300 220" className="w-full overflow-visible max-w-[240px] mx-auto">
                          <line x1="20" y1="180" x2="290" y2="180" stroke="#64748b" strokeWidth="1.5" />
                          <line x1="20" y1="130" x2="290" y2="130" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
                          <line x1="20" y1="80" x2="290" y2="80" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
                          <line x1="20" y1="30" x2="290" y2="30" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />

                          {ratingDifficultyBins.map((bin, index) => {
                            const barWidth = 28;
                            const barGap = 15;
                            const x = 30 + index * (barWidth + barGap);
                            const barHeight = bin.count > 0 ? (bin.count / maxBinCount) * 140 : 0;
                            const y = 180 - barHeight;

                            return (
                              <g key={bin.name}>
                                {bin.count > 0 && (
                                  <>
                                    <rect
                                      x={x}
                                      y={y}
                                      width={barWidth}
                                      height={barHeight}
                                      fill={bin.hex}
                                      fillOpacity="0.9"
                                      rx="3"
                                    />
                                    <text
                                      x={x + barWidth / 2}
                                      y={y - 6}
                                      textAnchor="middle"
                                      className="font-mono text-[11px] font-black fill-slate-850"
                                    >
                                      {bin.count}
                                    </text>
                                  </>
                                )}
                                <circle cx={x + barWidth / 2} cy="180" r="2.5" fill={bin.hex} />
                              </g>
                            );
                          })}
                        </svg>

                        <div className="grid grid-cols-6 gap-0.5 text-center text-[9px] font-black text-slate-700">
                          {ratingDifficultyBins.map((bin) => {
                            const label = bin.name.split(" ")[0];
                            return (
                              <div key={bin.name} className="truncate" title={bin.name}>
                                <div>{label}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* SECTION 3: ALGORITHM PREFERNCE AFFINITY & COACHING STRATEGY */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 avoid-break pt-4 border-t border-slate-100">
                    
                    {/* Solver Preference tags */}
                    <div className="md:col-span-5 space-y-3 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs font-black text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-1">
                          <span className="w-1 h-3 bg-indigo-600 inline-block rounded-xs"></span>
                          二、 算法偏好标签 (Top Affinities)
                        </h3>
                        <div className="space-y-3 mt-3">
                          {sortedTags.slice(0, 5).map(([tag, count]) => {
                            const percent = Math.round((count / maxTagCount) * 100);
                            return (
                              <div key={tag} className="text-[11px]">
                                <div className="flex justify-between font-bold text-slate-700">
                                  <span>{translateTag(tag)}</span>
                                  <span className="text-slate-500 font-mono font-bold">AC {count} 题</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1 pb-0">
                                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${percent}%` }}></div>
                                </div>
                              </div>
                            );
                          })}
                          {sortedTags.length === 0 && (
                            <div className="text-center py-6 text-slate-400 text-xs">暂无可用分类偏好</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* AI Coach Report advisory remarks */}
                    <div className="md:col-span-7 bg-slate-50 p-4 border border-slate-100 rounded-xl space-y-2.5 text-left">
                      <div className="flex items-center gap-1.5 text-indigo-950 font-bold text-xs border-b border-indigo-100/60 pb-1">
                        <Sparkles className="w-4 h-4 text-indigo-600 fill-current" />
                        <span>三、 AI 教练成长诊断建言 (Training Strategy)</span>
                      </div>
                      <ul className="text-[11px] text-slate-600 space-y-2.5 leading-relaxed font-semibold">
                        {getCoachAdvice().map((pt, i) => (
                          <li key={i} className="flex gap-1.5 items-start">
                            <span className="text-indigo-600 font-extrabold flex-shrink-0">•</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>

                  {/* Bottom Footer block including signatures */}
                  <div className="border-t border-slate-200 pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-400 font-medium avoid-break">
                    <div className="space-y-0.5 text-center sm:text-left">
                      <div>此报告基于竞赛平台选手真实在线提交行为数据，在系统诊断模型下校准生成。</div>
                      <div>验证凭据 & 构建平台: <span className="font-mono text-slate-500 select-all font-bold">https://ai.studio/build</span></div>
                    </div>
                    
                    {/* Hand-drawn coach stamp component */}
                    <div className="flex items-center gap-3 border border-dashed border-slate-200 px-4 py-2 rounded-xl bg-slate-50/50">
                      <div className="text-right">
                        <div className="text-[9px] text-slate-400 font-bold leading-none">AI DIAGNOSTICS TEAM</div>
                        <div className="text-xs font-serif italic text-indigo-900 font-black mt-1">Algorithm Coach Seal</div>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-serif font-black text-[10px] border border-indigo-200 select-none">
                        诊断
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

