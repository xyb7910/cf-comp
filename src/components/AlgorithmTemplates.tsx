import React, { useState, useEffect } from 'react';
import { Copy, Check, Search, BookOpen, Code2, Zap, Clock, Braces, FileCode } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAuth } from '../context/AuthContext';

// 算法模板数据类型
interface AlgorithmTemplate {
  id: string;
  category: string;
  name: string;
  difficulty: '基础' | '进阶' | '高级';
  description: string;
  detailed_description: string;
  time_complexity: string;
  space_complexity: string;
  code: string;
  tags: string[];
  usage: string;
  example_input?: string;
  example_output?: string;
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
}

// 用于前端展示的数据转换
function mapTemplateToFrontend(template: any): AlgorithmTemplate {
  return {
    id: template.id,
    category: template.category,
    name: template.name,
    difficulty: template.difficulty,
    description: template.description,
    detailed_description: template.detailed_description,
    time_complexity: template.time_complexity,
    space_complexity: template.space_complexity,
    code: template.code,
    tags: template.tags || [],
    usage: template.usage,
    example_input: template.example_input,
    example_output: template.example_output,
    is_public: template.is_public,
    created_at: template.created_at,
    updated_at: template.updated_at
  };
}

// Custom one dark style matching the code playground
const customOneDark = {
  ...oneDark,
  'pre[class*="language-"]': {
    ...oneDark['pre[class*="language-"]'],
    background: '#21252b',
    borderRadius: '0.5rem',
    margin: '0',
    padding: '1rem',
    fontSize: '0.875rem',
    lineHeight: '1.7',
    overflowX: 'auto',
  },
  'code[class*="language-"]': {
    ...oneDark['code[class*="language-"]'],
    background: 'transparent',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    color: '#abb2bf',
  },
  '.token.comment': {
    color: '#5c6370',
    fontStyle: 'italic',
  },
  '.token.keyword': {
    color: '#c678dd',
  },
  '.token.string': {
    color: '#98c379',
  },
  '.token.number': {
    color: '#d19a66',
  },
  '.token.operator': {
    color: '#abb2bf',
  },
  '.token.function': {
    color: '#61afef',
  },
  '.token.class-name': {
    color: '#e5c07b',
  },
  '.token.variable': {
    color: '#abb2bf',
  },
  '.token.parameter': {
    color: '#abb2bf',
  },
  '.token.punctuation': {
    color: '#abb2bf',
  },
  '.token.tag': {
    color: '#e06c75',
  },
  '.token.attr-name': {
    color: '#d19a66',
  },
  '.token.attr-value': {
    color: '#98c379',
  },
  '.token.builtin': {
    color: '#56b6c2',
  },
  '.token.type': {
    color: '#e5c07b',
  },
};

const AlgorithmTemplates = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<AlgorithmTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>(['全部']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  // 从后端获取算法模板
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 构建查询参数
        const params = new URLSearchParams();
        if (selectedCategory !== '全部') {
          params.append('category', selectedCategory);
        }
        
        const url = `/api/algorithm-templates/?${params.toString()}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('获取算法模板失败');
        }
        
        const data = await response.json();
        // API 返回分页结构，实际数据在 results 字段中
        const templatesData = data.results || data || [];
        const mappedTemplates = Array.isArray(templatesData) 
          ? templatesData.map(mapTemplateToFrontend) 
          : [];
        setTemplates(mappedTemplates);
      } catch (err) {
        console.error('Error fetching templates:', err);
        setError(err instanceof Error ? err.message : '获取算法模板失败');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [selectedCategory]);

  // 获取所有分类
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/algorithm-templates/categories/');
        if (response.ok) {
          const data = await response.json();
          setCategories(['全部', ...data]);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, []);

  // 前端搜索过滤
  const filteredTemplates = templates.filter(template => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      template.name.toLowerCase().includes(searchLower) ||
      template.description.toLowerCase().includes(searchLower) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
      template.time_complexity.toLowerCase().includes(searchLower)
    );
  });

  const handleCopyCode = (template: AlgorithmTemplate) => {
    navigator.clipboard.writeText(template.code);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getDifficultyColor = (diff: string) => {
    switch(diff) {
      case '基础': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case '进阶': return 'bg-amber-50 text-amber-700 border-amber-200';
      case '高级': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getDifficultyBg = (diff: string) => {
    switch(diff) {
      case '基础': return 'from-emerald-500 to-emerald-600';
      case '进阶': return 'from-amber-500 to-amber-600';
      case '高级': return 'from-rose-500 to-rose-600';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-900">算法模板库</h1>
          </div>
          <p className="text-slate-600 text-lg">
            精选算法竞赛常用模板 · 包含详细说明和复杂度分析
          </p>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-6 mb-8 border border-slate-200">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="搜索模板、描述、标签或时间复杂度..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all text-slate-800 font-medium"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-600">加载算法模板中...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-20">
            <p className="text-rose-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              重试
            </button>
          </div>
        )}

        {/* Templates Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-slate-300/60 transition-all"
              >
                {/* Card Header */}
                <div className="p-6 border-b border-slate-100">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    {/* Left side - Title & basic info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 bg-gradient-to-br ${getDifficultyBg(template.difficulty)} rounded-xl flex items-center justify-center shadow-md`}>
                          <Code2 className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-bold text-slate-900">
                              {template.name}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getDifficultyColor(template.difficulty)}`}>
                              {template.difficulty}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="text-xs font-medium px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100 flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5" />
                              {template.category}
                            </span>
                            {template.tags.map(tag => (
                              <span key={tag} className="text-xs font-medium px-3 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-slate-600 mb-4 leading-relaxed">
                        {template.detailed_description}
                      </p>
                      
                      <p className="text-sm text-slate-500 flex items-center gap-2 mb-4">
                        <Zap className="w-4 h-4 text-amber-500" />
                        📌 {template.usage}
                      </p>
                      
                      {/* Complexity info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-blue-500" />
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">时间复杂度</span>
                          </div>
                          <p className="text-sm font-bold text-slate-800">{template.time_complexity}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <div className="flex items-center gap-2 mb-1">
                            <Braces className="w-4 h-4 text-purple-500" />
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">空间复杂度</span>
                          </div>
                          <p className="text-sm font-bold text-slate-800">{template.space_complexity}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              {/* Code Section */}
              <div className="relative">
                <div className="bg-[#282c34]">
                  {/* Terminal Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#3e4451]">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#e06c75]"></div>
                        <div className="w-3 h-3 rounded-full bg-[#d19a66]"></div>
                        <div className="w-3 h-3 rounded-full bg-[#98c379]"></div>
                      </div>
                      <span className="text-xs text-[#5c6370] font-mono ml-4">algorithm.cpp</span>
                    </div>
                    <button
                      onClick={() => handleCopyCode(template)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-[#21252b] hover:bg-[#1e2127] rounded-lg transition-all text-xs font-bold border border-[#3e4451]"
                    >
                      {copiedId === template.id ? (
                        <>
                          <Check className="w-4 h-4 text-[#98c379]" />
                          <span className="text-[#98c379]">已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-[#abb2bf]" />
                          <span className="text-[#abb2bf]">复制代码</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Code with Syntax Highlighter */}
                  <div className="overflow-x-auto">
                    <SyntaxHighlighter
                      language="cpp"
                      style={customOneDark}
                      showLineNumbers={true}
                      wrapLines={true}
                      lineNumberStyle={{
                        minWidth: '2.5rem',
                        paddingRight: '0.75rem',
                        textAlign: 'right',
                        userSelect: 'none',
                        color: '#5c6370',
                        background: '#21252b',
                        fontSize: '11px',
                        borderRight: '1px solid #3e4451',
                      }}
                    >
                      {template.code}
                    </SyntaxHighlighter>
                  </div>
                </div>
                
                {/* Example input/output if available */}
                {template.example_input && template.example_output && (
                  <div className="bg-slate-50 p-5 border-t border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-600">
                          <FileCode className="w-3.5 h-3.5 text-blue-500" />
                          <span>输入示例</span>
                        </div>
                        <div className="bg-slate-100 rounded-lg p-3 font-mono text-sm text-slate-700 border border-slate-200">
                          {template.example_input}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-600">
                          <FileCode className="w-3.5 h-3.5 text-emerald-500" />
                          <span>输出示例</span>
                        </div>
                        <div className="bg-slate-100 rounded-lg p-3 font-mono text-sm text-slate-700 border border-slate-200">
                          {template.example_output}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Empty State */}
          {filteredTemplates.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">未找到匹配的模板</h3>
              <p className="text-slate-500">试试调整搜索条件或分类</p>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default AlgorithmTemplates;
