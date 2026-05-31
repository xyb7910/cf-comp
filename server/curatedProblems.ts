// Curated Problem Sets for AtCoder, Luogu and Nowcoder Fallbacks
export interface CoreProblem {
  contestId?: string | number;
  index: string;
  name: string;
  rating?: number;
  tags: string[];
  type?: string;
}

// 1. Curated Fallback AtCoder Problems (ABC300 through ABC340 classic tasks)
export const ATCODER_FALLBACK_PROBLEMS: CoreProblem[] = [
  { contestId: "abc300", index: "A", name: "abc300_a N-choice Question", rating: 120, tags: ["implementation"] },
  { contestId: "abc300", index: "B", name: "abc300_b Same Map in the Same Way", rating: 410, tags: ["brute force", "implementation"] },
  { contestId: "abc300", index: "C", name: "abc300_c Cross", rating: 715, tags: ["implementation", "search"] },
  { contestId: "abc300", index: "D", name: "abc300_d AABCC", rating: 1105, tags: ["math", "binary search", "number theory"] },
  { contestId: "abc300", index: "E", name: "abc300_e Dice Product 3", rating: 1530, tags: ["dp", "math", "probabilities"] },
  { contestId: "abc300", index: "F", name: "abc300_f More Holidays", rating: 1980, tags: ["binary search", "two pointers", "strings"] },
  
  { contestId: "abc305", index: "A", name: "abc305_a Water Station", rating: 110, tags: ["math", "implementation"] },
  { contestId: "abc305", index: "B", name: "abc305_b ABC Distance", rating: 250, tags: ["implementation"] },
  { contestId: "abc305", index: "C", name: "abc305_c Snuke the Cookie Picker", rating: 530, tags: ["implementation", "brute force"] },
  { contestId: "abc305", index: "D", name: "abc305_d Sleep Log", rating: 1150, tags: ["binary search", "two pointers", "data structures"] },
  { contestId: "abc305", index: "E", name: "abc305_e Art Gallery", rating: 1512, tags: ["graphs", "shortest paths", "shortest paths"] },
  { contestId: "abc305", index: "F", name: "abc305_f Dungeon Explore", rating: 1720, tags: ["graphs", "dfs and similar"] },

  { contestId: "abc310", index: "A", name: "abc310_a Order Something Else", rating: 95, tags: ["implementation"] },
  { contestId: "abc310", index: "B", name: "abc310_b Strictly Superior", rating: 480, tags: ["brute force", "implementation"] },
  { contestId: "abc310", index: "C", name: "abc310_c Reversible", rating: 690, tags: ["strings", "data structures", "dsu"] },
  { contestId: "abc310", index: "D", name: "abc310_d Peaceful Teams", rating: 1250, tags: ["dfs and similar", "bitmasks", "brute force"] },
  { contestId: "abc310", index: "E", name: "abc310_e NAND repeatedly", rating: 1550, tags: ["dp", "math", "bitmasks"] },
  
  { contestId: "abc315", index: "A", name: "abc315_a tld", rating: 70, tags: ["strings", "implementation"] },
  { contestId: "abc315", index: "B", name: "abc315_b The Middle Day", rating: 220, tags: ["implementation", "math"] },
  { contestId: "abc315", index: "C", name: "abc315_c Flavors", rating: 490, tags: ["greedy", "sorting"] },
  { contestId: "abc315", index: "D", name: "abc315_d Magical Cookies", rating: 1310, tags: ["implementation", "greedy"] },
  { contestId: "abc315", index: "E", name: "abc315_e Prerequisites", rating: 1480, tags: ["graphs", "dfs and similar", "sorting"] },
  { contestId: "abc315", index: "F", name: "abc315_f Shortcuts", rating: 1910, tags: ["dp", "geometry"] },

  { contestId: "abc320", index: "A", name: "abc320_a Leyland Number", rating: 85, tags: ["math"] },
  { contestId: "abc320", index: "B", name: "abc320_b Longest Palindromic Substring", rating: 390, tags: ["strings", "brute force"] },
  { contestId: "abc320", index: "C", name: "abc320_c Slot Strategy 2", rating: 810, tags: ["brute force", "implementation", "permutations"] },
  { contestId: "abc320", index: "D", name: "abc320_d Relative Position", rating: 1080, tags: ["graphs", "dfs and similar", "dsu"] },
  { contestId: "abc320", index: "E", name: "abc320_e Somen Nagashi", rating: 1450, tags: ["data structures", "sorting"] },
  { contestId: "abc320", index: "F", name: "abc320_f Fuel Round Trip", rating: 2150, tags: ["dp"] },

  { contestId: "abc325", index: "A", name: "abc325_a Takahashi-san", rating: 50, tags: ["implementation"] },
  { contestId: "abc325", index: "B", name: "abc325_b World Meeting", rating: 320, tags: ["brute force", "implementation"] },
  { contestId: "abc325", index: "C", name: "abc325_c Sensors", rating: 780, tags: ["graphs", "dfs and similar", "dsu"] },
  { contestId: "abc325", index: "D", name: "abc325_d Printing Machine", rating: 1390, tags: ["greedy", "data structures"] },
  { contestId: "abc325", index: "E", name: "abc325_e Our Road Project", rating: 1560, tags: ["graphs", "shortest paths"] },

  { contestId: "abc330", index: "A", name: "abc330_a Sorted Points", rating: 60, tags: ["implementation"] },
  { contestId: "abc330", index: "B", name: "abc330_b Minimize Abs 1", rating: 310, tags: ["math", "binary search"] },
  { contestId: "abc330", index: "C", name: "abc330_c Minimize Abs 2", rating: 650, tags: ["math", "binary search", "two pointers"] },
  { contestId: "abc330", index: "D", name: "abc330_d Counting Ls", rating: 980, tags: ["math", "combinatorics"] },
  { contestId: "abc330", index: "E", name: "abc330_e Mex and Update", rating: 1420, tags: ["data structures", "greedy"] },
  { contestId: "abc330", index: "F", name: "abc330_f Minimize Bounding Square", rating: 1890, tags: ["binary search", "two pointers"] },

  { contestId: "abc335", index: "A", name: "abc335_a 2023", rating: 50, tags: ["strings"] },
  { contestId: "abc335", index: "B", name: "abc335_b Tetrahedral Number", rating: 280, tags: ["brute force", "implementation"] },
  { contestId: "abc335", index: "C", name: "abc335_c Map Monster", rating: 620, tags: ["data structures", "implementation"] },
  { contestId: "abc335", index: "D", name: "abc335_d Loong Grid", rating: 1050, tags: ["implementation"] },
  { contestId: "abc335", index: "E", name: "abc335_e Non-decreasing Colorful Path", rating: 1610, tags: ["dp", "graphs", "shortest paths"] },

  { contestId: "abc340", index: "A", name: "abc340_a Arithmetic Progression", rating: 40, tags: ["math"] },
  { contestId: "abc340", index: "B", name: "abc340_b Append and Query", rating: 190, tags: ["data structures"] },
  { contestId: "abc340", index: "C", name: "abc340_c Divide and Divide", rating: 580, tags: ["dp", "math", "divide and conquer"] },
  { contestId: "abc340", index: "D", name: "abc340_d Super Takahashi Game", rating: 1110, tags: ["graphs", "shortest paths"] },
  { contestId: "abc340", index: "E", name: "abc340_e Mancala 2", rating: 1540, tags: ["data structures", "lazy propagation"] },
  { contestId: "abc340", index: "F", name: "abc340_f SXYZ Multiply", rating: 2010, tags: ["math", "number theory", "geometry"] }
];

// 2. Curated Luogu Problems (Chinese tags, CSP-J/S & NOIP level classics)
export const LUOGU_PROBLEMS: CoreProblem[] = [
  { index: "P1000", name: "P1000 超级玛丽游戏", rating: 800, tags: ["implementation"] },
  { index: "P1001", name: "P1001 A+B Problem", rating: 800, tags: ["math", "implementation"] },
  { index: "P1002", name: "P1002 过河卒", rating: 1100, tags: ["dp"] },
  { index: "P1003", name: "P1003 铺地毯", rating: 950, tags: ["implementation", "brute force"] },
  { index: "P1004", name: "P1004 方格取数", rating: 1450, tags: ["dp"] },
  { index: "P1005", name: "P1005 矩阵取数游戏", rating: 1750, tags: ["dp", "math"] },
  { index: "P1008", name: "P1008 三连击", rating: 850, tags: ["brute force", "math"] },
  { index: "P1009", name: "P1009 [NOIP2003 普及组] 阶乘之和", rating: 1000, tags: ["math", "implementation"] },
  { index: "P1014", name: "P1014 [NOIP1999 普及组] Cantor表", rating: 900, tags: ["math", "implementation"] },
  { index: "P1020", name: "P1020 [NOIP1999 普及组] 导弹拦截", rating: 1350, tags: ["dp", "data structures", "binary search"] },
  { index: "P1024", name: "P1024 [NOIP2001 提高组] 一元三次方程求解", rating: 1150, tags: ["math", "binary search"] },
  { index: "P1035", name: "P1035 [NOIP2002 普及组] 级数求和", rating: 820, tags: ["math", "implementation"] },
  { index: "P1036", name: "P1036 [NOIP2002 普及组] 选数", rating: 1050, tags: ["dfs and similar", "math"] },
  { index: "P1044", name: "P1044 [NOIP2003 普及组] 栈", rating: 1100, tags: ["math", "dp", "combinatorics"] },
  { index: "P1046", name: "P1046 [NOIP2005 普及组] 陶陶摘苹果", rating: 800, tags: ["implementation", "brute force"] },
  { index: "P1047", name: "P1047 [NOIP2005 普及组] 校门外的树", rating: 880, tags: ["implementation", "geometry"] },
  { index: "P1048", name: "P1048 [NOIP2005 普及组] 采药 (0/1背包)", rating: 1000, tags: ["dp"] },
  { index: "P1049", name: "P1049 [NOIP2001 普及组] 装箱问题", rating: 1020, tags: ["dp"] },
  { index: "P1067", name: "P1067 [NOIP2009 普及组] 多项式输出", rating: 980, tags: ["strings", "implementation"] },
  { index: "P1090", name: "P1090 [NOIP2004 普及组] 合并果子", rating: 1120, tags: ["greedy", "data structures"] },
  { index: "P1149", name: "P1149 [NOIP2008 普及组] 火柴棒等式", rating: 1050, tags: ["brute force", "search"] },
  { index: "P1177", name: "P1177 【模板】快速排序", rating: 900, tags: ["sorting"] },
  { index: "P1216", name: "P1216 [USACO1.5] 数字三角形 Number Triangles", rating: 920, tags: ["dp"] },
  { index: "P1219", name: "P1219 [USACO1.5] 八皇后 Checker Challenge", rating: 1220, tags: ["dfs and similar", "bitmasks"] },
  { index: "P1308", name: "P1308 [NOIP2011 普及组] 统计单词数", rating: 950, tags: ["strings", "implementation"] },
  { index: "P1425", name: "P1425 小鱼的游泳时间", rating: 800, tags: ["math", "implementation"] },
  { index: "P1880", name: "P1880 [NOI1995] 石子合并 (区间DP)", rating: 1400, tags: ["dp"] },
  { index: "P1908", name: "P1908 逆序对 (归并排序/树状数组)", rating: 1300, tags: ["sorting", "data structures", "divide and conquer"] },
  { index: "P2240", name: "P2240 【模板】部分背包问题", rating: 950, tags: ["greedy"] },
  { index: "P3366", name: "P3366 【模板】最小生成树", rating: 1250, tags: ["graphs", "dsu"] },
  { index: "P3367", name: "P3367 【模板】并查集", rating: 1050, tags: ["dsu", "data structures"] },
  { index: "P3371", name: "P3371 【模板】单源最短路径（弱化版）", rating: 1260, tags: ["graphs", "shortest paths"] },
  { index: "P3372", name: "P3372 【模板】线段树 1", rating: 1480, tags: ["data structures", "lazy propagation"] },
  { index: "P3373", name: "P3373 【模板】线段树 2", rating: 1650, tags: ["data structures", "lazy propagation"] },
  { index: "P3374", name: "P3374 【模板】树状数组 1", rating: 1200, tags: ["data structures"] },
  { index: "P3375", name: "P3375 【模板】KMP", rating: 1300, tags: ["strings"] },
  { index: "P3378", name: "P3378 【模板】堆", rating: 1050, tags: ["data structures"] },
  { index: "P3379", name: "P3379 【模板】最近公共祖先 (LCA)", rating: 1400, tags: ["trees", "graphs"] },
  { index: "P3383", name: "P3383 【模板】线性筛素数", rating: 1100, tags: ["math", "number theory"] },
  { index: "P3811", name: "P3811 【模板】乘法逆元", rating: 1500, tags: ["math", "number theory"] }
];

// 3. Curated Nowcoder Problems (Nowcoder ACM Trainer style classics)
export const NOWCODER_PROBLEMS: CoreProblem[] = [
  { index: "NC10001", name: "NC10001 A+B问题 极致入门版", rating: 800, tags: ["math", "implementation"] },
  { index: "NC10002", name: "NC10002 [NOIP2004] 考试打地鼠球", rating: 1050, tags: ["greedy", "dp"] },
  { index: "NC10003", name: "NC10003 完美括号序列的匹配", rating: 920, tags: ["data structures", "strings"] },
  { index: "NC15001", name: "NC15001 抢杠胡与多米诺对决", rating: 1280, tags: ["dp", "brute force"] },
  { index: "NC15005", name: "NC15005 树形结构上的最大独立集", rating: 1530, tags: ["trees", "dp"] },
  { index: "NC16010", name: "NC16010 汉诺塔的数学狂想曲", rating: 1100, tags: ["math", "recursion"] },
  { index: "NC17002", name: "NC17002 给定集合的子集和", rating: 1320, tags: ["dp", "bitmasks"] },
  { index: "NC18204", name: "NC18204 牛牛的城市环路连通性", rating: 1410, tags: ["graphs", "dfs and similar"] },
  { index: "NC20005", name: "NC20005 矩阵乘法之极速挑战", rating: 1250, tags: ["math", "matrices"] },
  { index: "NC21008", name: "NC21008 多项式极速傅里叶变换", rating: 2200, tags: ["math", "fft"] },
  { index: "NC22046", name: "NC22046 完美的二分图染色匹配", rating: 1680, tags: ["graphs", "graph matchings"] },
  { index: "NC23001", name: "NC23001 树上节点距离之最", rating: 1390, tags: ["trees", "shortest paths"] },
  { index: "NC24011", name: "NC24011 模板并查集的高级演化", rating: 1150, tags: ["dsu", "data structures"] },
  { index: "NC25120", name: "NC25120 字符前缀匹配哈希", rating: 1210, tags: ["strings", "data structures"] },
  { index: "NC26034", name: "NC26034 逆序对计算的离散手法", rating: 1350, tags: ["sorting", "data structures"] },
  { index: "NC28001", name: "NC28001 数组极值二分探测器", rating: 950, tags: ["binary search"] },
  { index: "NC30012", name: "NC30012 最长上升子序列最速版", rating: 1180, tags: ["dp", "binary search"] }
];
