import React, { useRef, useEffect } from "react";

interface Token {
  type: string;
  text: string;
}

export function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  
  // Master regex to scan comments, strings, preprocessor lines, numbers, word identifiers, and symbols
  const regex = new RegExp([
    // 1. Comments: C++: //... or /*...*/  Python: #...
    `(\\/\\/.*|#.*|\\/\\*[\\s\\S]*?\\*\\/)`,
    // 2. Strings: double-quoted or single-quoted, supporting escape characters
    `("(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*')`,
    // 3. Preprocessor directives: e.g. #include, #define
    `(#\\s*\\w+)`,
    // 4. Numbers (hex, float, decimal)
    `(\\b0x[0-9a-fA-F]+\\b|\\b\\d+(?:\\.\\d+)?\\b)`,
    // 5. Word identifiers (keywords, types, builtins, functions)
    `(\\b[a-zA-Z_][a-zA-Z0-9_]*\\b)`,
    // 6. Operators and punctuation
    `([{}()\\[\\];,.+\\-*/%=&|^!<>?:~]+)`
  ].join('|'), 'g');

  const KEYWORDS = new Set([
    // C++
    'auto', 'break', 'case', 'catch', 'class', 'const', 'constexpr', 'continue', 'default', 
    'delete', 'do', 'else', 'enum', 'explicit', 'export', 'extern', 'false', 'for', 'friend', 
    'goto', 'if', 'inline', 'mutable', 'namespace', 'new', 'noexcept', 'nullptr', 'operator', 
    'private', 'protected', 'public', 'register', 'return', 'sizeof', 'static', 'struct', 
    'switch', 'template', 'this', 'throw', 'true', 'try', 'typedef', 'typename', 'union', 
    'using', 'virtual', 'volatile', 'while', 'decltype',
    // Python
    'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'def', 'del', 'elif', 
    'except', 'finally', 'from', 'global', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 
    'or', 'pass', 'raise', 'with', 'yield'
  ]);

  const TYPES = new Set([
    // C++ standard types / library structures
    'bool', 'char', 'double', 'float', 'int', 'long', 'short', 'signed', 'unsigned', 'void',
    'wchar_t', 'char8_t', 'char16_t', 'char32_t', 'size_t', 'int32_t', 'int64_t', 'uint32_t', 'uint64_t',
    'vector', 'string', 'pair', 'map', 'set', 'unordered_map', 'unordered_set', 'queue', 'deque', 'stack',
    // Python types
    'list', 'dict', 'tuple', 'set', 'str', 'int', 'float', 'bool', 'bytes'
  ]);

  const BUILTINS = new Set([
    // C++ / standard namespaces & STL helpers
    'std', 'cin', 'cout', 'endl', 'ios_base', 'tie', 'NULL', 'accumulate', 'begin', 'end', 'solve', 'main',
    // Python helpers
    'print', 'len', 'range', 'enumerate', 'zip', 'sum', 'max', 'min', 'map', 'filter', 'sorted', 'any', 'all',
    'append', 'split', 'read', 'stdin', 'stdout'
  ]);

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(code)) !== null) {
    const matchIndex = match.index;
    
    // Add plain text before match if any
    if (matchIndex > lastIndex) {
      tokens.push({
        type: 'text',
        text: code.slice(lastIndex, matchIndex)
      });
    }

    const [
      _full,
      comment,
      str,
      preprocessor,
      number,
      word,
      operator
    ] = match;

    if (comment !== undefined) {
      tokens.push({ type: 'comment', text: comment });
    } else if (str !== undefined) {
      tokens.push({ type: 'string', text: str });
    } else if (preprocessor !== undefined) {
      tokens.push({ type: 'preprocessor', text: preprocessor });
    } else if (number !== undefined) {
      tokens.push({ type: 'number', text: number });
    } else if (word !== undefined) {
      if (KEYWORDS.has(word)) {
        tokens.push({ type: 'keyword', text: word });
      } else if (TYPES.has(word)) {
        tokens.push({ type: 'type', text: word });
      } else if (BUILTINS.has(word)) {
        tokens.push({ type: 'builtin', text: word });
      } else {
        // Lookahead to see if next token is function call
        const rest = code.slice(regex.lastIndex);
        if (/^\s*\(/.test(rest)) {
          tokens.push({ type: 'function', text: word });
        } else {
          tokens.push({ type: 'text', text: word });
        }
      }
    } else if (operator !== undefined) {
      tokens.push({ type: 'operator', text: operator });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < code.length) {
    tokens.push({
      type: 'text',
      text: code.slice(lastIndex)
    });
  }

  return tokens;
}

interface InteractiveCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  placeholder?: string;
  className?: string;
  id?: string;
}

export default function InteractiveCodeEditor({
  value,
  onChange,
  language,
  placeholder = "在这里编写代码...",
  className = "",
  id = ""
}: InteractiveCodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<HTMLDivElement>(null);

  // Synchronize scrolls on user scroll
  const handleScroll = () => {
    if (textareaRef.current) {
      const top = textareaRef.current.scrollTop;
      const left = textareaRef.current.scrollLeft;

      if (backdropRef.current) {
        backdropRef.current.scrollTop = top;
        backdropRef.current.scrollLeft = left;
      }
      if (linesRef.current) {
        linesRef.current.scrollTop = top;
      }
    }
  };

  // Sync scroll automatically on code/initialization changes
  useEffect(() => {
    handleScroll();
  }, [value]);

  // Tokenize the code and produce One Dark inline spans
  const tokens = tokenize(value);

  const renderedCode = tokens.map((token, index) => {
    let colorClass = "text-[#abb2bf]"; // One Dark standard text color
    
    switch (token.type) {
      case "comment":
        colorClass = "text-[#5c6370] italic font-light";
        break;
      case "string":
        colorClass = "text-[#98c379] font-medium";
        break;
      case "preprocessor":
        colorClass = "text-[#e06c75] font-bold";
        break;
      case "number":
        colorClass = "text-[#d19a66] font-mono";
        break;
      case "keyword":
        colorClass = "text-[#c678dd] font-bold";
        break;
      case "type":
        colorClass = "text-[#e5c07b] font-semibold";
        break;
      case "builtin":
        colorClass = "text-[#56b6c2] font-medium";
        break;
      case "function":
        colorClass = "text-[#61afef] font-medium";
        break;
      case "operator":
        colorClass = "text-[#abb2bf] font-normal";
        break;
      default:
        colorClass = "text-[#abb2bf]";
        break;
    }

    return (
      <span key={index} className={colorClass}>
        {token.text}
      </span>
    );
  });

  // Enable Tab support
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = value.substring(0, start) + "    " + value.substring(end);
      onChange(newValue);
      
      // Reset caret position after react re-renders
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  const lineCount = value.split("\n").length;
  const editorId = id || "interactive-code-editor-root";

  return (
    <div className={`relative w-full h-full font-mono text-[13px] leading-5 bg-[#282c34] flex select-none overflow-hidden mac-code-container ${className}`}>
      
      {/* Dynamic Mac Styling adjustments */}
      <style>{`
        #${editorId}::selection {
          background-color: rgba(82, 139, 255, 0.35) !important;
          color: transparent !important;
          -webkit-text-fill-color: transparent !important;
        }
        
        /* Sleek macOS Scrollbar Integration for Code Components */
        .mac-code-container ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .mac-code-container ::-webkit-scrollbar-track {
          background: transparent;
        }
        .mac-code-container ::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.2);
          border-radius: 9999px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .mac-code-container ::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.4);
          border-radius: 9999px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
      `}</style>

      {/* 1. Synced Line Number column (mac-style Gutter) */}
      <div 
        ref={linesRef}
        className="w-12 text-right pr-3 pl-1 py-4 font-mono text-[11px] leading-5 text-[#5c6370] bg-[#21252b] border-r border-[#181a1f] select-none overflow-hidden flex-shrink-0"
        style={{
          boxSizing: "border-box"
        }}
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i} className="h-5 leading-5 block content-none">
            {i + 1}
          </div>
        ))}
      </div>

      {/* 2. Unified Container for Editing Interface */}
      <div className="relative flex-1 h-full overflow-hidden">
        {/* Behind Overlay Containing Colorized Highlighted Code */}
        <div
          ref={backdropRef}
          className="absolute inset-0 pointer-events-none overflow-hidden p-4 select-none whitespace-pre font-mono text-[13px] leading-5 pr-12 pb-24 text-transparent mac-code-backdrop"
          style={{
            boxSizing: "border-box"
          }}
        >
          <code className="block select-none leading-5 whitespace-pre font-mono text-[13px] pr-12 pb-24">
            {renderedCode}
            {/* Add a dynamic ending space if the last token is new line, to sync scrolled offsets correctly */}
            {value.endsWith("\n") && " "}
          </code>
        </div>

        {/* Front Interface Native Textarea for typing and selection */}
        <textarea
          ref={textareaRef}
          id={editorId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-[#528bff] font-mono text-[13px] leading-5 p-4 resize-none focus:outline-none overflow-auto pr-12 pb-24 mac-code-textarea"
          placeholder={placeholder}
          spellCheck="false"
          style={{
            boxSizing: "border-box",
            WebkitTextFillColor: "transparent" // Ensure native text is 100% transparent but selection highlighting is perfectly preserved
          }}
        />
      </div>
    </div>
  );
}
