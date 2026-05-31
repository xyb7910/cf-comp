import React from "react";
import katex from "katex";

export function preprocessLaTeX(text: string): string {
  if (!text) return "";
  let processed = text;
  // Replace \[ ... \] with $$ ... $$
  processed = processed.replace(/\\\[/g, "$$").replace(/\\\]/g, "$$");
  // Replace \( ... \) with $ ... $
  processed = processed.replace(/\\\( /g, "$").replace(/ \\\)/g, "$").replace(/\\\(/g, "$").replace(/\\\)/g, "$");
  return processed;
}

export function renderInlineMath(text: string): React.ReactNode {
  const inlineParts = text.split("$");
  if (inlineParts.length <= 1) {
    return text;
  }

  return (
    <>
      {inlineParts.map((part, index) => {
        if (index % 2 === 1) {
          try {
            const html = katex.renderToString(part, { displayMode: false, throwOnError: false });
            return <span key={`inline-${index}`} className="inline-block px-0.5 align-middle select-all" dangerouslySetInnerHTML={{ __html: html }} />;
          } catch (err) {
            return <code key={`inline-err-${index}`} className="text-red-500 text-xs font-mono bg-red-50 px-1 rounded">${part}$</code>;
          }
        } else {
          return part;
        }
      })}
    </>
  );
}

export function renderTextWithMath(text: string): React.ReactNode {
  if (!text) return "";

  const preprocessed = preprocessLaTeX(text);
  const displayParts = preprocessed.split("$$");
  if (displayParts.length > 1) {
    return (
      <>
        {displayParts.map((part, index) => {
          if (index % 2 === 1) {
            try {
              const html = katex.renderToString(part, { displayMode: true, throwOnError: false });
              return <div key={`block-${index}`} className="my-3 overflow-x-auto w-full max-w-full select-all scrollbar-thin" dangerouslySetInnerHTML={{ __html: html }} />;
            } catch (err) {
              return <pre key={`block-err-${index}`} className="text-red-500 text-xs font-mono bg-red-50 p-2 my-2 rounded select-all">$$ {part} $$</pre>;
            }
          } else {
            return <React.Fragment key={`inline-container-${index}`}>{renderInlineMath(part)}</React.Fragment>;
          }
        })}
      </>
    );
  }

  return renderInlineMath(preprocessed);
}
