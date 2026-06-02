import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import { Copy, Check } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import "katex/dist/katex.min.css";

interface AIMarkdownRendererProps {
  content: string;
}

export default function AIMarkdownRenderer({ content }: AIMarkdownRendererProps) {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const codeRefs = useRef<{ [key: number]: string }>({});

  const handleCopy = async (index: number) => {
    const codeText = codeRefs.current[index];
    if (codeText) {
      await navigator.clipboard.writeText(codeText);
      setCopiedId(index);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const codeBlockIndex = useRef(0);

  const customStyle = {
    ...oneDark,
    'pre[class*="language-"]': {
      ...oneDark['pre[class*="language-"]'],
      background: "linear-gradient(135deg, #2d3748 0%, #1a202c 100%)",
      borderRadius: "0",
      margin: "0",
      padding: "1rem",
      fontSize: "12px",
      lineHeight: "1.6",
      overflowX: "auto",
    },
    'code[class*="language-"]': {
      ...oneDark['code[class*="language-"]'],
      background: "transparent",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    },
    '.token.comment': {
      color: "#6a9955",
      fontStyle: "italic",
    },
    '.token.keyword': {
      color: "#c586c0",
    },
    '.token.string': {
      color: "#ce9178",
    },
    '.token.number': {
      color: "#b5cea8",
    },
    '.token.operator': {
      color: "#d4d4d4",
    },
    '.token.function': {
      color: "#dcdcaa",
    },
    '.token.class-name': {
      color: "#4ec9b0",
    },
    '.token.variable': {
      color: "#9cdcfe",
    },
    '.token.parameter': {
      color: "#9cdcfe",
    },
    '.token.punctuation': {
      color: "#d4d4d4",
    },
    '.token.tag': {
      color: "#569cd6",
    },
    '.token.attr-name': {
      color: "#9cdcfe",
    },
    '.token.attr-value': {
      color: "#ce9178",
    },
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath, remarkGfm]}
      rehypePlugins={[rehypeKatex]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-xl font-extrabold text-slate-900 border-b border-slate-200 pb-2 mt-6 mb-4">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-bold text-slate-800 mt-5 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-amber-500 rounded-full"></span>
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-semibold text-slate-700 mt-4 mb-2 flex items-center gap-2">
            <span className="w-1 h-4 bg-amber-400 rounded-full"></span>
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-sm font-semibold text-slate-600 mt-3 mb-1.5">
            {children}
          </h4>
        ),
        p: ({ children }) => (
          <p className="text-sm text-slate-700 leading-relaxed my-2.5">
            {children}
          </p>
        ),
        strong: ({ children }) => (
          <strong className="font-bold text-slate-900">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="text-slate-600 italic">{children}</em>
        ),
        ul: ({ children }) => (
          <ul className="list-disc list-inside space-y-1.5 my-3 pl-2">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside space-y-1.5 my-3 pl-2">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="text-sm text-slate-700 leading-relaxed py-1">
            {children}
          </li>
        ),
        code: ({ className, children }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code className="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded text-xs font-mono border border-amber-100">
                {children}
              </code>
            );
          }
          return (
            <code className="block text-xs font-mono">{children}</code>
          );
        },
        pre: ({ children }) => {
          const currentIndex = codeBlockIndex.current++;
          const textContent = React.Children.toArray(children).map(child => {
            if (typeof child === 'string') return child;
            if (React.isValidElement(child) && typeof child.props.children === 'string') {
              return child.props.children;
            }
            return '';
          }).join('');
          
          codeRefs.current[currentIndex] = textContent;
          
          const match = textContent.match(/^(\w+)\n/);
          const language = match ? match[1].toLowerCase() : 'cpp';
          const code = match ? textContent.slice(match[0].length) : textContent;
          
          return (
            <div className="my-4 rounded-xl overflow-hidden border border-slate-700/50 bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg">
              <div className="bg-slate-900/80 px-4 py-2 flex items-center justify-between border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80 hover:bg-rose-500 transition-colors cursor-pointer"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 hover:bg-amber-500 transition-colors cursor-pointer"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 transition-colors cursor-pointer"></span>
                  </div>
                  <span className="text-xs font-mono text-slate-400 ml-2 uppercase">{language}</span>
                </div>
                <button
                  onClick={() => handleCopy(currentIndex)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all duration-150 border border-transparent hover:border-slate-600"
                  title="复制代码"
                >
                  {copiedId === currentIndex ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">已复制</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>复制</span>
                    </>
                  )}
                </button>
              </div>
              <SyntaxHighlighter
                language={language}
                style={customStyle}
                showLineNumbers={true}
                wrapLines={true}
                lineNumberStyle={{
                  minWidth: "2.5rem",
                  paddingRight: "1rem",
                  textAlign: "right",
                  userSelect: "none",
                  opacity: 0.5,
                  color: "#858585",
                }}
              >
                {code}
              </SyntaxHighlighter>
            </div>
          );
        },
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-amber-500 bg-amber-50/50 pl-4 py-3 my-3 rounded-r-lg">
            <p className="text-sm text-slate-700 italic">{children}</p>
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="my-4 overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="bg-slate-100 text-slate-800 font-semibold px-3 py-2 text-left border border-slate-200">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 border border-slate-200 text-slate-700">
            {children}
          </td>
        ),
        hr: () => (
          <hr className="my-6 border-slate-200" />
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2"
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}