import React, { useState, useEffect } from "react";
import InteractiveCodeEditor from "./InteractiveCodeEditor";
import { 
  Terminal, 
  Code, 
  Play, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Sparkles, 
  RotateCcw, 
  Cpu, 
  Copy, 
  Check, 
  Zap,
  Info,
  Shuffle,
  Shield,
  Binary,
  Layers,
  Bug,
  ListOrdered,
  HelpCircle
} from "lucide-react";

// Code Templates for popular competitive programming languages
const TEMPLATES: Record<string, string> = {
  cpp20: `#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>

using namespace std;

// C++20 快速自测模板
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    int n;
    if (cin >> n) {
        vector<int> a(n);
        for (int i = 0; i < n; i++) {
            cin >> a[i];
        }
        
        // 计算总和
        long long sum = accumulate(a.begin(), a.end(), 0LL);
        cout << "元素总数: " << n << endl;
        cout << "求和结果: " << sum << endl;
    }
    return 0;
}`,
  cpp17: `#include <iostream>
#include <vector>
#include <numeric>
#include <algorithm>

using namespace std;

// C++17 结构化绑定与快速自测
int main() {
    int a = 5, b = 10;
    auto swap_add = [](int x, int y) {
        return pair{y, x + y};
    };
    
    auto [swapped, summed] = swap_add(a, b);
    cout << "交换后: " << swapped << ", 相加和: " << summed << "\\n";
    return 0;
}`,
  cpp14: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

// C++14 泛型 Lambda 表达式自测
int main() {
    auto print_val = [](auto x) {
        cout << "值: " << x << endl;
    };
    
    print_val(42);
    print_val("Hello C++14");
    return 0;
}`,
  python3: `# Python 3 快速自测模板
import sys

def solve():
    # 从标准输入读取所有数据
    input_data = sys.stdin.read().split()
    if not input_data:
        print("未读到输入数据")
        return
        
    try:
        # 解读第一个整数为元素总数
        n = int(input_data[0])
        numbers = [int(x) for x in input_data[1:n+1]]
        
        print(f"数据总数 N: {n}")
        print(f"列表元素: {numbers}")
        print(f"总和: {sum(numbers)}")
        print(f"最大值: {max(numbers) if numbers else 0}")
    except ValueError as e:
        print(f"发生输入解析错误: {e}")

if __name__ == '__main__':
    solve()`
};

const SAMPLE_INPUTS: Record<string, string> = {
  sum: "5\n10 20 30 40 50",
  matrix: "3\n1 2 3\n4 5 6\n7 8 9",
  blank: ""
};

// Data templates for interactive Duipai
const DUIPAI_INITIAL_TEMPLATES = {
  myCode: `#include <iostream>
using namespace std;

// 【待测优化解法】
// （这里故意包含一个整形溢出的逻辑 bug：当输入过大时 a * b 超过 int 上限）
int main() {
    long long a, b;
    if (cin >> a >> b) {
        // ❌ 差错演示：使用 int 接收承载乘积，溢出爆负数或产生错误答案
        int ans = a * b; 
        cout << ans << endl;
    }
    return 0;
}`,
  answerCode: `#include <iostream>
using namespace std;

// 【正确暴力/保底对照解法】
// （使用 long long 防止任何可能的数据溢出，用作标准对拍）
int main() {
    long long a, b;
    if (cin >> a >> b) {
        // ✔ 正确解法
        long long ans = a * b;
        cout << ans << endl;
    }
    return 0;
}`,
  genCode: `# 【Python3 随机测试用例生成器】
# 每次被调用时需向 stdout 打印一组测试输入
import random

def generate():
    # 生成可能引起 int32 溢出的两组大随机数
    a = random.randint(300000, 1500000)
    b = random.randint(300000, 1500000)
    print(f"{a} {b}")

if __name__ == "__main__":
    generate()`
};

interface RunResult {
  compiled: boolean;
  compileError: string;
  stdout: string;
  stderr: string;
  status: "SUCCESS" | "COMPILE_ERROR" | "RUN_TIME_ERROR" | "TIME_LIMIT_EXCEEDED" | "UNKNOWN";
  execTime: number;
  aiAnalysis: string;
  mode: string;
}

interface DuipaiLog {
  round: number;
  status: "SUCCESS" | "WA" | "RTE";
  stdin: string;
  myOutput?: string;
  ansOutput?: string;
}

interface DuipaiResult {
  success: boolean;
  mode: string;
  totalRounds: number;
  completedRounds: number;
  hasDifference: boolean;
  compileError?: string;
  error?: string;
  hackCase?: {
    round: number;
    stdin: string;
    myOutput: string;
    ansOutput: string;
    reason: string;
  };
  roundsLog?: DuipaiLog[];
  aiAnalysis?: string;
}

export default function CodePlayground() {
  // Main modes: "sandbox" (常规单文件自测) | "duipai" (智能数据对拍)
  const [activeTab, setActiveTab] = useState<"sandbox" | "duipai">("sandbox");

  // State for Sandbox
  const [language, setLanguage] = useState<"cpp20" | "cpp17" | "cpp14" | "python3">("cpp20");
  const [code, setCode] = useState<string>("");
  const [input, setInput] = useState<string>("5\n10 20 30 40 50");
  const [mode, setMode] = useState<"auto" | "ai" | "local">("auto");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // States for Duipai (对拍)
  const [duipaiMyCode, setDuipaiMyCode] = useState<string>(DUIPAI_INITIAL_TEMPLATES.myCode);
  const [duipaiAnswerCode, setDuipaiAnswerCode] = useState<string>(DUIPAI_INITIAL_TEMPLATES.answerCode);
  const [duipaiGenCode, setDuipaiGenCode] = useState<string>(DUIPAI_INITIAL_TEMPLATES.genCode);
  
  const [duipaiMyLang, setDuipaiMyLang] = useState<string>("cpp20");
  const [duipaiAnsLang, setDuipaiAnsLang] = useState<string>("cpp20");
  const [duipaiGenLang, setDuipaiGenLang] = useState<string>("python3");

  // Editor current active file in duipai layout: "my" | "ans" | "gen"
  const [duipaiActiveEditor, setDuipaiActiveEditor] = useState<"my" | "ans" | "gen">("my");
  const [duipaiRounds, setDuipaiRounds] = useState<number>(10);
  const [duipaiMode, setDuipaiMode] = useState<"auto" | "ai" | "local">("auto");
  const [duipaiIsRunning, setDuipaiIsRunning] = useState<boolean>(false);
  const [duipaiResult, setDuipaiResult] = useState<DuipaiResult | null>(null);
  const [duipaiError, setDuipaiError] = useState<string | null>(null);
  const [duipaiCopied, setDuipaiCopied] = useState<boolean>(false);

  // Monaco-styled lines helper
  const linesCount = code.split("\n").length;
  
  const duipaiCurrentCode = duipaiActiveEditor === "my" 
    ? duipaiMyCode 
    : duipaiActiveEditor === "ans"
      ? duipaiAnswerCode
      : duipaiGenCode;

  const duipaiLinesCount = duipaiCurrentCode.split("\n").length;

  // Sync templates on Sandbox initialization or language change
  useEffect(() => {
    setCode(TEMPLATES[language]);
  }, [language]);

  const handleReset = () => {
    if (window.confirm("确定要恢复当前语言的初始自测模板吗？你编写的代码将会被覆盖。")) {
      setCode(TEMPLATES[language]);
      setResult(null);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyDuipaiCode = () => {
    navigator.clipboard.writeText(duipaiCurrentCode);
    setDuipaiCopied(true);
    setTimeout(() => setDuipaiCopied(false), 2000);
  };

  const handleResetDuipaiAllList = () => {
    if (window.confirm("确定要把对拍面板的所有三个代码重置为默认演示模板吗？")) {
      setDuipaiMyCode(DUIPAI_INITIAL_TEMPLATES.myCode);
      setDuipaiAnswerCode(DUIPAI_INITIAL_TEMPLATES.answerCode);
      setDuipaiGenCode(DUIPAI_INITIAL_TEMPLATES.genCode);
      setDuipaiActiveEditor("my");
      setDuipaiResult(null);
    }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setResult(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language,
          input,
          mode
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "请求代码执行失败");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "自测网络异常，请尝试在 [Settings > Secrets] 配置 GEMINI_API_KEY 作为备用编译器支持。");
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunDuipai = async () => {
    setDuipaiIsRunning(true);
    setDuipaiResult(null);
    setDuipaiError(null);

    try {
      const res = await fetch("/api/duipai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          myCode: duipaiMyCode,
          myLanguage: duipaiMyLang,
          answerCode: duipaiAnswerCode,
          answerLanguage: duipaiAnsLang,
          genCode: duipaiGenCode,
          genLanguage: duipaiGenLang,
          rounds: duipaiRounds,
          mode: duipaiMode
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "请求数据对拍执行失败");
      }

      const data = await res.json();
      if (data.success === false) {
        throw new Error(data.error || data.compileError || "对拍内核挂载发生严重异常");
      }
      setDuipaiResult(data);
    } catch (err: any) {
      console.error(err);
      setDuipaiError(err.message || "数据对拍请求异常，请验证网络连通性或前往 Secrets 添加 GEMINI_API_KEY 以便调用大模型拟。");
    } finally {
      setDuipaiIsRunning(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 animate-fadeIn transition-all duration-300">
      
      {/* Upper Navigation Tabs (Mac Styled Header) */}
      <div className="bg-[#1e1e2e] border-b border-slate-800 px-6 py-2.5 flex items-center justify-between select-none">
        <div className="flex items-center gap-4">
          {/* macOS window control traffic lights */}
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] hover:opacity-90 active:scale-90 transition block" title="Close" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] hover:opacity-90 active:scale-90 transition block" title="Minimize" />
            <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] hover:opacity-90 active:scale-90 transition block" title="Maximize" />
          </div>

          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("sandbox")}
              className={`py-1.5 px-3.5 text-xs font-bold tracking-wide rounded-lg flex items-center gap-2 transition cursor-pointer ${
                activeTab === "sandbox" 
                  ? "bg-slate-800 text-amber-400 font-extrabold shadow-sm border border-slate-700/50" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/45"
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-amber-500" />
              常规单文件自测
            </button>
            
            <button
              type="button"
              id="playground-duipai-tab"
              onClick={() => setActiveTab("duipai")}
              className={`py-1.5 px-3.5 text-xs font-bold tracking-wide rounded-lg flex items-center gap-2 transition cursor-pointer ${
                activeTab === "duipai" 
                  ? "bg-slate-800 text-cyan-400 font-extrabold shadow-sm border border-slate-700/50" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/45"
              }`}
            >
              <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
              智能数据对拍
              <span className="bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 text-[8px] px-1 py-0.2 rounded uppercase font-bold tracking-normal animate-pulse">
                PRO
              </span>
            </button>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <Zap className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/20" />
          <span>macOS Dev Console v1.2</span>
        </div>
      </div>

      {/* 1. REGULAR SINGLE SANDBOX MODE */}
      {activeTab === "sandbox" && (
        <div className="flex flex-col">
          {/* Controls header */}
          <div className="bg-slate-950 px-6 py-3.5 border-b border-slate-850 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-extrabold px-2 py-1 rounded border border-emerald-500/20 tracking-wider">
                SANDBOX
              </span>
              <p className="text-xs font-extrabold text-slate-200">支持独立标准输入读入 (stdin 调试环境)</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap text-xs text-slate-300">
              {/* Language Selection */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">语言:</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="bg-slate-900 border border-slate-850 text-slate-200 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer transition hover:bg-slate-850"
                >
                  <option value="cpp20">C++20 (GCC) ★推荐</option>
                  <option value="cpp17">C++17 (GCC)</option>
                  <option value="cpp14">C++14 (GCC)</option>
                  <option value="python3">Python 3 (CPython)</option>
                </select>
              </div>

              {/* Core selection */}
              <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-slate-850">
                <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">编译器:</span>
                {[
                  { id: "auto", label: "自动" },
                  { id: "ai", label: "AI 编译" },
                  { id: "local", label: "物理" }
                ].map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setMode(v.id as any)}
                    className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md transition ${
                      mode === v.id
                        ? "bg-amber-550 text-slate-950 font-black shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main workspace splits */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[550px]">
            {/* Editor column */}
            <div className="lg:col-span-7 flex flex-col border-r border-[#181a1f] bg-[#282c34] relative">
              
              <div className="bg-[#21252b] border-b border-[#181a1f] px-4 py-2.5 flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-[10px] flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block mr-0.5 animate-pulse" />
                  <Code className="w-3.5 h-3.5 text-[#61afef]" />
                  main.{language.startsWith("cpp") ? "cpp" : "py"} ({linesCount} 行)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="p-1 px-2 hover:bg-slate-800/60 text-slate-400 hover:text-white transition duration-150 rounded flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-450" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? "已复制!" : "复制代码"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="p-1 px-2 hover:bg-slate-800/60 text-slate-400 hover:text-rose-450 transition duration-150 rounded flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>重置</span>
                  </button>
                </div>
              </div>

              {/* Textarea Editor */}
              <div className="flex flex-1 relative min-h-[400px]">
                <InteractiveCodeEditor
                  id="playground-textarea"
                  value={code}
                  onChange={setCode}
                  language={language}
                  placeholder="在这里编写您的单文件自测代码..."
                  className="w-full h-full min-h-[460px]"
                />
              </div>

              {/* Insertion hints */}
              <div className="bg-slate-900/60 border-t border-slate-850 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
                <span className="font-semibold text-slate-400">💡 提示: 代码需读取 stdin 输入格式，支持标准头文件，支持 {"#include <bits/stdc++.h>"}。</span>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 font-bold mr-1">快捷示例:</span>
                  <button
                    type="button"
                    onClick={() => setCode(prev => prev + "\n// 递归二分折半查找\nint binary_search(int val[], int len, int target) {\n    int l = 0, r = len - 1;\n    while(l <= r) {\n        int mid = l + (r - l) / 2;\n        if(val[mid] == target) return mid;\n        else if(val[mid] < target) l = mid + 1;\n        else r = mid - 1;\n    }\n    return -1;\n}\n")}
                    className="hover:bg-slate-800 border border-slate-800 text-slate-400 px-2 py-0.5 rounded transition"
                  >
                    + 二分检索
                  </button>
                  <button
                    type="button"
                    onClick={() => setCode(prev => prev + "\n# BFS 广度搜索队列模板\nfrom collections import deque\ndef bfs(graph, start):\n    visited = set([start])\n    queue = deque([start])\n    while queue:\n        vertex = queue.popleft()\n        print(vertex, end=' ')\n        for neighbor in graph[vertex]:\n            if neighbor not in visited:\n                visited.add(neighbor)\n                queue.append(neighbor)\n")}
                    className="hover:bg-slate-800 border border-slate-800 text-slate-400 px-2 py-0.5 rounded transition"
                  >
                    + Python BFS
                  </button>
                </div>
              </div>
            </div>

            {/* Sandbox inputs and outputs */}
            <div className="lg:col-span-5 flex flex-col bg-slate-50/50">
              
              <div className="p-4 border-b border-slate-150 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="playground-stdin" className="text-xs font-black text-slate-600 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                    标准命令行参数/输入 (Stdin):
                  </label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setInput(SAMPLE_INPUTS.sum)}
                      className="px-2 py-0.5 text-[9px] bg-slate-100 text-slate-600 border border-slate-200 rounded hover:bg-slate-200 font-bold transition"
                    >
                      序列数据
                    </button>
                    <button
                      type="button"
                      onClick={() => setInput(SAMPLE_INPUTS.matrix)}
                      className="px-2 py-0.5 text-[9px] bg-slate-100 text-slate-600 border border-slate-200 rounded hover:bg-slate-200 font-bold transition"
                    >
                      3x3 矩阵
                    </button>
                  </div>
                </div>
                <textarea
                  id="playground-stdin"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full bg-slate-55 border border-slate-200 rounded-xl p-3 text-slate-800 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 h-24 shadow-inner"
                  placeholder="提供给程序的标准控制台输入 (cin / input) ..."
                />
              </div>

              {/* Execution Run controller */}
              <div className="p-4 bg-slate-100/60 border-b border-slate-150 flex items-center justify-between">
                <span className="text-[10px] text-slate-450 font-bold leading-none flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  限制超时: 2.5s | 最大缓冲区 2MB
                </span>

                <button
                  id="playground-run-btn"
                  type="button"
                  disabled={isRunning}
                  onClick={handleRunCode}
                  className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all text-white cursor-pointer ${
                    isRunning 
                      ? "bg-slate-400 cursor-not-allowed" 
                      : "bg-indigo-600 hover:bg-indigo-700 hover:shadow"
                  }`}
                >
                  {isRunning ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>正在测试...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      <span>立即编译并运行</span>
                    </>
                  )}
                </button>
              </div>

              {/* Outputs panel */}
              <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl flex items-start gap-2 animate-shake">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold mb-0.5">自测网络链路异常</h4>
                      <p className="text-[10px] text-rose-600 leading-normal">{errorMsg}</p>
                    </div>
                  </div>
                )}

                {!result && !isRunning && !errorMsg && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-10 px-4 bg-white/75 rounded-xl border border-dashed border-slate-200">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-450 flex items-center justify-center mb-3">
                      <Terminal className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-xs text-slate-650 mb-1">等待执行命令</h4>
                    <p className="text-[10px] text-slate-400 max-w-xs">
                      点击“立即编译并运行”，评测结果将立刻在这个窗口生成。
                    </p>
                  </div>
                )}

                {isRunning && (
                  <div className="space-y-3 animate-pulse">
                    <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-2">
                      <div className="h-3.5 w-1/4 bg-slate-100 rounded" />
                      <div className="h-3 w-1/2 bg-slate-100 rounded" />
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl h-24 space-y-2">
                      <div className="h-3 w-3/4 bg-slate-800 rounded" />
                      <div className="h-3 w-1/2 bg-slate-800 rounded" />
                    </div>
                  </div>
                )}

                {/* Result output */}
                {result && (
                  <div className="space-y-4 text-left animate-fadeIn">
                    
                    <div className="p-3.5 bg-white border border-slate-200/85 rounded-2xl flex items-center justify-between shadow-xs">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5 text-[10px]">
                          <span className="text-slate-400 font-bold uppercase">引擎:</span>
                          <span className="bg-slate-100 border border-slate-200 font-black px-2 py-0.5 rounded text-indigo-700">
                            {result.mode}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-black text-slate-800">状态码:</span>
                          {result.status === "SUCCESS" && (
                            <span className="font-black bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              SUCCESS (通过)
                            </span>
                          )}
                          {result.status === "COMPILE_ERROR" && (
                            <span className="font-black bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px]">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              COMPILE_ERROR (编译报错)
                            </span>
                          )}
                          {result.status === "RUN_TIME_ERROR" && (
                            <span className="font-black bg-rose-50 text-rose-600 border border-rose-100 px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px]">
                              <XCircle className="w-3.5 h-3.5" />
                              RUN_TIME_ERROR (运行时异常)
                            </span>
                          )}
                          {result.status === "TIME_LIMIT_EXCEEDED" && (
                            <span className="font-black bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px]">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              TIME_LIMIT_EXCEEDED
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right border-l border-slate-100 pl-4">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">运行耗时</span>
                        <span className="text-xs font-mono font-bold text-slate-700 block">
                          {result.execTime} <span className="text-[9px] text-slate-400">ms</span>
                        </span>
                      </div>
                    </div>

                    {/* Stderr logs for Compile Error */}
                    {!result.compiled && result.compileError && (
                      <div className="space-y-1">
                        <h5 className="text-[10px] font-black text-rose-600 uppercase flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          错误堆栈 (Compile Fail logs):
                        </h5>
                        <pre className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-rose-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap select-text">
                          {result.compileError}
                        </pre>
                      </div>
                    )}

                    {/* Success outputs */}
                    {result.compiled && (
                      <div className="space-y-4">
                        <div>
                          <h5 className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1 mb-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            控制台标准输出 (stdout):
                          </h5>
                          <pre className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-emerald-400 font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-pre min-h-[70px] shadow-inner select-text">
                            {result.stdout || "（程序执行成功，但没有往控制台 stdout 打印任何输出）"}
                          </pre>
                        </div>

                        {result.stderr && (
                          <div>
                            <h5 className="text-[10px] font-black text-rose-500 uppercase flex items-center gap-1 mb-1">
                              <XCircle className="w-3.5 h-3.5" />
                              程序报错/警告流 (stderr):
                            </h5>
                            <pre className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-rose-400 font-mono text-xs overflow-x-auto select-text">
                              {result.stderr}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}

                    {/* AI Guide suggestion card */}
                    {result.aiAnalysis && (
                      <div className="bg-gradient-to-br from-indigo-50/70 to-purple-50/60 border border-indigo-100 rounded-2xl p-4 shadow-xs">
                        <h5 className="text-[11px] font-black text-indigo-900 flex items-center gap-1.5 mb-1.5">
                          <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                          AI 复杂度评级及程序诊断
                        </h5>
                        <div className="text-[11px] text-indigo-950 leading-relaxed font-semibold whitespace-pre-line">
                          {result.aiAnalysis}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* 2. ADVANCED INTERACTIVE DUIPAI (数据对拍) */}
      {activeTab === "duipai" && (
        <div className="flex flex-col animate-fadeIn">
          {/* Header instructions info panel */}
          <div className="bg-slate-950 p-6 border-b border-slate-850 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 font-extrabold px-2 py-1 rounded border border-cyan-505/20 tracking-wider">
                  DIFF CHECKER (对拍机)
                </span>
                <p className="text-xs font-extrabold text-slate-100">高阶双流对拍评测：1个测试用例生成器 + 2个待比对算法</p>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                对拍是检查算法逻辑漏洞的神技。我们将由随机数据生成器输入，对两个算法进行比对，直到找出截然不同的结果 (Hack) 或完成对拍轮次！
              </p>
            </div>

            {/* General Configurations */}
            <div className="flex items-center gap-3 flex-wrap text-xs text-slate-300">
              {/* Core Engine Select */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">对拍内核:</span>
                <select
                  value={duipaiMode}
                  onChange={(e) => setDuipaiMode(e.target.value as any)}
                  className="bg-slate-900 border border-slate-850 text-slate-200 text-xs font-bold rounded-xl px-2.5 py-1.5 cursor-pointer hover:bg-slate-850 focus:outline-none"
                >
                  <option value="auto">自动探寻 (物理优先)</option>
                  <option value="ai">AI 逻辑模拟 (无环境限制)</option>
                  <option value="local">硬件物理沙盒 (极速稳定)</option>
                </select>
              </div>

              {/* Rounds Select */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">测试轮数:</span>
                <select
                  value={duipaiRounds}
                  onChange={(e) => setDuipaiRounds(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-850 text-slate-200 text-xs font-bold rounded-xl px-2.5 py-1.5 cursor-pointer hover:bg-slate-850 focus:outline-none"
                >
                  <option value={5}>5 轮</option>
                  <option value={10}>10 轮 (推荐)</option>
                  <option value={15}>15 轮</option>
                  <option value={20}>20 轮 (深度极限)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
            {/* Left Box: Three-file Tabbed Editors */}
            <div className="lg:col-span-7 flex flex-col border-r border-[#181a1f] bg-[#282c34] relative">
              
              {/* Selector file tabs */}
              <div className="bg-[#21252b] px-4 py-2 border-b border-[#181a1f] flex items-center justify-between text-xs">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDuipaiActiveEditor("my")}
                    className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      duipaiActiveEditor === "my"
                        ? "bg-[#252538] text-amber-400 border-slate-700/60 shadow-sm"
                        : "bg-slate-900/20 text-slate-400 border-transparent hover:text-slate-200"
                    }`}
                  >
                    <Binary className="w-3.5 h-3.5 text-amber-400" />
                    <span>待测代码.cpp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDuipaiActiveEditor("ans")}
                    className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      duipaiActiveEditor === "ans"
                        ? "bg-[#252538] text-emerald-400 border-slate-700/60 shadow-sm"
                        : "bg-slate-900/20 text-slate-400 border-transparent hover:text-slate-200"
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>正确暴力代码.cpp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDuipaiActiveEditor("gen")}
                    className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      duipaiActiveEditor === "gen"
                        ? "bg-[#252538] text-cyan-400 border-slate-700/60 shadow-sm"
                        : "bg-slate-900/20 text-slate-400 border-transparent hover:text-slate-200"
                    }`}
                  >
                    <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
                    <span>测试生成器.py</span>
                  </button>
                </div>

                <div className="flex gap-2 text-slate-450">
                  <button
                    type="button"
                    onClick={handleCopyDuipaiCode}
                    className="p-1 px-1.5 hover:bg-slate-800 text-slate-400 hover:text-white transition rounded flex items-center gap-1 text-[10px] font-bold"
                  >
                    {duipaiCopied ? <Check className="w-3 h-3 text-emerald-450" /> : <Copy className="w-3 h-3" />}
                    <span>{duipaiCopied ? "复制成功" : "复制此文件"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetDuipaiAllList}
                    className="p-1 px-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition rounded flex items-center gap-1 text-[10px] font-bold"
                    title="重置三个模板代码"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Lang selector for specific subfiles */}
              <div className="bg-[#21252b] px-4 py-1.5 border-b border-[#181a1f] flex items-center justify-between text-[11px] text-slate-400 font-bold">
                {duipaiActiveEditor === "my" && (
                  <>
                    <span className="text-slate-350">📌 待测代码 (你要检查是否存在逻辑/运算越界Bug的高能算法代码)</span>
                    <select
                      value={duipaiMyLang}
                      onChange={(e) => setDuipaiMyLang(e.target.value)}
                      className="bg-slate-900 text-slate-300 rounded border border-slate-800 text-[10px] font-bold min-w-[100px] py-0.5 focus:outline-none"
                    >
                      <option value="cpp20">C++20 (GCC)</option>
                      <option value="cpp17">C++17 (GCC)</option>
                      <option value="cpp14">C++14 (GCC)</option>
                      <option value="python3">Python 3</option>
                    </select>
                  </>
                )}
                {duipaiActiveEditor === "ans" && (
                  <>
                    <span className="text-slate-350">🛡 参照解法 (已经验证 100% 运行结果正确但较慢/常数大的保底暴力代码)</span>
                    <select
                      value={duipaiAnsLang}
                      onChange={(e) => setDuipaiAnsLang(e.target.value)}
                      className="bg-slate-900 text-slate-300 rounded border border-slate-800 text-[10px] font-bold min-w-[100px] py-0.5 focus:outline-none"
                    >
                      <option value="cpp20">C++20 (GCC)</option>
                      <option value="cpp17">C++17 (GCC)</option>
                      <option value="cpp14">C++14 (GCC)</option>
                      <option value="python3">Python 3</option>
                    </select>
                  </>
                )}
                {duipaiActiveEditor === "gen" && (
                  <>
                    <span className="text-slate-350">🎲 数据发生器 (用来生成一组随机 stdin 数据的 Python/C++ 代码)</span>
                    <select
                      value={duipaiGenLang}
                      onChange={(e) => setDuipaiGenLang(e.target.value)}
                      className="bg-slate-900 text-slate-300 rounded border border-slate-800 text-[10px] font-bold min-w-[100px] py-0.5 focus:outline-none"
                    >
                      <option value="python3">Python 3 (极力推荐)</option>
                      <option value="cpp20">C++20 (GCC)</option>
                      <option value="cpp17">C++17 (GCC)</option>
                    </select>
                  </>
                )}
              </div>

              {/* Editor Workspace for active document */}
              <div className="flex flex-1 relative min-h-[440px]">
                <InteractiveCodeEditor
                  id="duipai-textarea"
                  value={duipaiCurrentCode}
                  onChange={(txt) => {
                    if (duipaiActiveEditor === "my") setDuipaiMyCode(txt);
                    else if (duipaiActiveEditor === "ans") setDuipaiAnswerCode(txt);
                    else setDuipaiGenCode(txt);
                  }}
                  language={
                    duipaiActiveEditor === "my"
                      ? duipaiMyLang
                      : duipaiActiveEditor === "ans"
                        ? duipaiAnsLang
                        : duipaiGenLang
                  }
                  placeholder="在这里修改这个文件的代码逻辑..."
                  className="w-full h-full min-h-[440px]"
                />
              </div>

              {/* Snippet insertion */}
              <div className="bg-slate-900/60 border-t border-slate-850 px-4 py-3 flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-semibold text-slate-400">
                  ⚡ 体验自带的模板: 已内置一个在输入大数时引起 \`int32\` 溢出的乘法差错案例。直接点击对拍，看是否有 HackCase！
                </span>
                <button
                  type="button"
                  onClick={handleResetDuipaiAllList}
                  className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-355 rounded hover:bg-slate-700 transition"
                >
                  重置演示模版
                </button>
              </div>
            </div>

            {/* Right Box: Action Card and outcomes output */}
            <div className="lg:col-span-5 flex flex-col bg-slate-50/50">
              
              {/* Trigger panel action */}
              <div className="p-4 bg-white border-b border-slate-150 shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ListOrdered className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-black text-slate-700">对拍测试运行控制:</span>
                  </div>
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 font-bold rounded">
                    设定进行 {duipaiRounds} 组循环比对
                  </span>
                </div>

                <button
                  id="duipai-run-btn"
                  type="button"
                  disabled={duipaiIsRunning}
                  onClick={handleRunDuipai}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-xs shadow-md transition-all text-white cursor-pointer ${
                    duipaiIsRunning
                      ? "bg-slate-400 cursor-not-allowed animate-pulse"
                      : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg"
                  }`}
                >
                  {duipaiIsRunning ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/35 border-t-white rounded-full animate-spin" />
                      <span>沙盒虚拟机轮巡对拍中...</span>
                    </>
                  ) : (
                    <>
                      <Shuffle className="w-4 h-4 text-amber-300" />
                      <span>开启对拍・数据找错测试</span>
                    </>
                  )}
                </button>
              </div>

              {/* Outcomes panel scroll container */}
              <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto max-h-[580px]">
                {duipaiError && (
                  <div className="p-3 bg-rose-50 border border-rose-100/80 text-rose-700 text-xs rounded-xl flex items-start gap-2 animate-shake">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold mb-0.5">数据对拍引擎发生错误</h4>
                      <p className="text-[10px] text-rose-650 leading-relaxed">{duipaiError}</p>
                    </div>
                  </div>
                )}

                {/* Empty hint */}
                {!duipaiResult && !duipaiIsRunning && !duipaiError && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4 bg-white rounded-2xl border border-dashed border-slate-200">
                    <div className="w-12 h-12 rounded-full bg-cyan-50 text-cyan-500 border border-cyan-100 flex items-center justify-center mb-3">
                      <Shuffle className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-xs text-slate-700 mb-1">对拍就绪</h4>
                    <p className="text-[10px] text-slate-450 max-w-xs leading-normal">
                      点击“开启对拍・数据找错测试”。生成器将生成随机数据，分别喂给两个算法，进行高速差值比对！
                    </p>
                  </div>
                )}

                {/* Loading skeleton */}
                {duipaiIsRunning && (
                  <div className="space-y-3.5 animate-pulse">
                    <div className="p-3 bg-white border border-slate-150 rounded-2xl space-y-2">
                      <div className="h-4 w-1/3 bg-slate-100 rounded" />
                      <div className="h-3 w-3/4 bg-slate-100 rounded" />
                    </div>
                    <div className="p-3.5 bg-slate-900 rounded-2xl h-36 border border-slate-800 space-y-2">
                      <div className="h-3 w-5/6 bg-slate-800 rounded" />
                      <div className="h-3 w-2/3 bg-slate-800 rounded" />
                      <div className="h-3 w-3/4 bg-slate-800 rounded" />
                    </div>
                  </div>
                )}

                {/* Duipai outputs displays */}
                {duipaiResult && (
                  <div className="space-y-4 animate-fadeIn">
                    
                    {/* 1. Compile Error Check if CE happens */}
                    {duipaiResult.compileError && (
                      <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl space-y-1.5 text-left">
                        <h4 className="text-xs font-black text-amber-700 uppercase flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          对拍编译故障:
                        </h4>
                        <pre className="text-[10px] text-amber-800 font-mono overflow-x-auto bg-white/80 p-2 rounded border border-amber-100 leading-normal max-h-48 select-text">
                          {duipaiResult.compileError}
                        </pre>
                      </div>
                    )}

                    {/* 2. Main success summary banner */}
                    {!duipaiResult.compileError && (
                      <div className={`p-4 rounded-2xl border text-left shadow-xs ${
                        duipaiResult.hasDifference 
                          ? "bg-rose-50/70 border-rose-150 text-rose-950" 
                          : "bg-emerald-50/70 border-emerald-150 text-emerald-950"
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase font-black tracking-wider flex items-center gap-1">
                            {duipaiResult.hasDifference ? (
                              <Bug className="w-3.5 h-3.5 text-rose-550 animate-bounce" />
                            ) : (
                              <Shield className="w-3.5 h-3.5 text-emerald-550" />
                            )}
                            对拍测评结论:
                          </span>
                          <span className="text-[10px] bg-white/80 border px-2 py-0.5 font-bold rounded">
                            {duipaiResult.mode}
                          </span>
                        </div>

                        <div className="text-xs font-black mb-1">
                          {duipaiResult.hasDifference ? (
                            <span className="text-rose-600 flex items-center gap-1 font-black">
                              ❌ 发现对拍 Hack 错点（第 {duipaiResult.hackCase?.round} 轮爆出不一致的结果）！
                            </span>
                          ) : (
                            <span className="text-emerald-600 flex items-center gap-1 font-black">
                              ✔ 完美无漏！测试顺利完成（共 {duipaiResult.completedRounds} 轮对拍一致）
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                          {duipaiResult.hasDifference 
                            ? "优化算法在处理随机极端用例时，得出了不同于暴力保证正确解法的数值，请立刻查看下方分立比对。"
                            : "本测试包含了多组大数值与极端情况输入轮巡。两套代码打印出的 stdout 数据在字符字节对比上完美交融。"}
                        </p>
                      </div>
                    )}

                    {/* 3. Detail Case analysis if Hack Found */}
                    {duipaiResult.hasDifference && duipaiResult.hackCase && (
                      <div className="space-y-3.5 text-left">
                        
                        {/* THE INPUT stdin that produced difference */}
                        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden text-xs">
                          <div className="bg-slate-850 px-3 py-1.5 font-bold text-slate-350 flex items-center justify-between">
                            <span className="text-[10.5px] font-mono text-cyan-400">🚨 导致差异的 Stdin 调试输入:</span>
                            <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">复制可自行重测</span>
                          </div>
                          <pre className="p-3 text-slate-200 font-mono text-[11px] overflow-x-auto whitespace-pre selection:bg-slate-700 min-h-[45px] select-text">
                            {duipaiResult.hackCase.stdin}
                          </pre>
                        </div>

                        {/* Split comparing diff outputs side-by-side */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-rose-950/20 border border-rose-200/40 rounded-2xl p-3 text-left">
                            <span className="text-[10px] text-rose-650 font-black uppercase tracking-wider block mb-1">
                              ❌ 你的优化待测输出 (My):
                            </span>
                            <pre className="font-mono text-rose-700 font-bold bg-white/70 p-2 border border-rose-100 rounded-xl max-h-24 overflow-y-auto selection:bg-rose-200 text-[11px]">
                              {duipaiResult.hackCase.myOutput}
                            </pre>
                          </div>

                          <div className="bg-emerald-950/20 border border-emerald-200/40 rounded-2xl p-3 text-left">
                            <span className="text-[10px] text-emerald-650 font-black uppercase tracking-wider block mb-1">
                              ✔ 正确暴力参照输出 (Ans):
                            </span>
                            <pre className="font-mono text-emerald-700 font-bold bg-white/70 p-2 border border-emerald-100 rounded-xl max-h-24 overflow-y-auto selection:bg-emerald-200 text-[11px]">
                              {duipaiResult.hackCase.ansOutput}
                            </pre>
                          </div>
                        </div>

                        {/* Explaining reason */}
                        {duipaiResult.hackCase.reason && (
                          <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl text-left">
                            <span className="text-[10px] text-amber-700 font-black block mb-0.5 uppercase tracking-wide">
                              🤖 差错特征分析:
                            </span>
                            <p className="text-[11px] font-medium leading-relaxed text-amber-900">
                              {duipaiResult.hackCase.reason}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 4. Rounds Run Log checklist */}
                    {duipaiResult.roundsLog && duipaiResult.roundsLog.length > 0 && (
                      <div className="text-left">
                        <span className="text-[10px] font-black tracking-wider uppercase text-slate-450 block mb-2">
                          对拍轮次测试详细记录:
                        </span>
                        
                        <div className="space-y-1.5 max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2.5 bg-white shadow-inner">
                          {duipaiResult.roundsLog.map((log) => (
                            <div 
                              key={log.round} 
                              className="text-[10.5px] font-mono py-1 border-b border-slate-50/80 last:border-0 flex items-center justify-between"
                            >
                              <span className="text-slate-500">
                                轮次 #{log.round} 输入: <span className="text-slate-450 text-[9px] italic ml-1">{log.stdin}</span>
                              </span>
                              
                              <div>
                                {log.status === "SUCCESS" && (
                                  <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 text-[9px] font-black">
                                    一致 (PASSED)
                                  </span>
                                )}
                                {log.status === "WA" && (
                                  <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 text-[9px] font-black">
                                    不一致 (WA)
                                  </span>
                                )}
                                {log.status === "RTE" && (
                                  <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 text-[9px] font-black">
                                    崩溃 (RTE)
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI intelligence review report */}
                    {duipaiResult.aiAnalysis && (
                      <div className="bg-gradient-to-br from-indigo-50/60 to-violet-50/50 border border-indigo-100 p-4 rounded-2xl relative overflow-hidden text-left shadow-xs">
                        <div className="absolute right-0 top-0 w-20 h-20 bg-indigo-200/10 rounded-full -mr-6 -mt-6" />
                        <h5 className="text-[11px] font-black text-indigo-900 flex items-center gap-1.5 mb-1.5 relative">
                          <Sparkles className="w-4 h-4 text-violet-500" />
                          对拍诊断及 Hack 根因研判书
                        </h5>
                        <p className="text-[11px] leading-relaxed text-indigo-950 font-semibold whitespace-pre-line relative select-text">
                          {duipaiResult.aiAnalysis}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer statistics */}
      <div className="bg-slate-100 px-6 py-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between text-[11px] text-slate-450 gap-2 font-bold select-none">
        <span>🔒 物理沙盒与 AI 解释器均搭载常驻，支持在 Settings / Secrets 完美配置备用 API 发送。</span>
        <span className="flex items-center gap-1 text-slate-500 font-extrabold">
          <Layers className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500/20" />
          多维数据比对测试
        </span>
      </div>
    </div>
  );
}
