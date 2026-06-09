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
      background: "#282c34",
      borderRadius: "8px",
      margin: "0",
      padding: "1rem",
      fontSize: "13px",
      lineHeight: "1.7",
      overflowX: "auto",
    },
    'code[class*="language-"]': {
      ...oneDark['code[class*="language-"]'],
      background: "transparent",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
      color: "#abb2bf",
    },
    '.token.comment': {
      color: "#5c6370",
      fontStyle: "italic",
    },
    '.token.keyword': {
      color: "#c678dd",
    },
    '.token.string': {
      color: "#98c379",
    },
    '.token.number': {
      color: "#d19a66",
    },
    '.token.operator': {
      color: "#abb2bf",
    },
    '.token.function': {
      color: "#61afef",
    },
    '.token.class-name': {
      color: "#e5c07b",
    },
    '.token.variable': {
      color: "#abb2bf",
    },
    '.token.parameter': {
      color: "#abb2bf",
    },
    '.token.punctuation': {
      color: "#abb2bf",
    },
    '.token.tag': {
      color: "#e06c75",
    },
    '.token.attr-name': {
      color: "#d19a66",
    },
    '.token.attr-value': {
      color: "#98c379",
    },
    '.token.builtin': {
      color: "#56b6c2",
    },
    '.token.type': {
      color: "#e5c07b",
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
            if (React.isValidElement(child)) {
              const props = child.props as { children?: string };
              if (typeof props.children === 'string') {
                return props.children;
              }
            }
            return '';
          }).join('');
          
          codeRefs.current[currentIndex] = textContent;
          
          const match = textContent.match(/^(\w+)\n/);
          const language = match ? match[1].toLowerCase() : 'cpp';
          const code = match ? textContent.slice(match[0].length) : textContent;
          
          return (
            <div className="my-4">
              <SyntaxHighlighter
                language="cpp"
                style={customStyle}
                showLineNumbers={true}
                wrapLines={true}
                lineNumberStyle={{
                  minWidth: "2.5rem",
                  paddingRight: "0.75rem",
                  textAlign: "right",
                  userSelect: "none",
                  color: "#5c6370",
                  background: "#21252b",
                  fontSize: "11px",
                  borderRight: "1px solid #181a1f",
                }}
                customStyle={{
                  background: "#21252b",
                  borderRadius: "8px",
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