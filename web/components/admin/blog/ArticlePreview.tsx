"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Eye, Pencil } from "lucide-react";

interface ArticlePreviewProps {
  content: string;
  title?: string;
  onContentChange: (content: string) => void;
}

export function ArticlePreview({
  content,
  title,
  onContentChange,
}: ArticlePreviewProps) {
  const [mode, setMode] = useState<"preview" | "edit">("preview");

  return (
    <div className="rounded-lg border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
        <span className="text-sm font-medium text-muted-foreground">
          {mode === "preview" ? "Article Preview" : "Edit Content"}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode("preview")}
            className={`h-8 text-xs ${
              mode === "preview"
                ? "bg-white/10 text-floodlight"
                : "text-muted-foreground hover:text-floodlight"
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode("edit")}
            className={`h-8 text-xs ${
              mode === "edit"
                ? "bg-white/10 text-floodlight"
                : "text-muted-foreground hover:text-floodlight"
            }`}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        </div>
      </div>

      {/* Content */}
      {mode === "preview" ? (
        <div className="p-6 overflow-y-auto max-h-[calc(100vh-280px)]">
          {title && (
            <h1 className="text-2xl font-bold text-floodlight mb-6 leading-tight">
              {title}
            </h1>
          )}
          <div className="prose-blog">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="text-xl font-bold text-floodlight mb-3 mt-6 first:mt-0">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-lg font-semibold text-floodlight mb-2 mt-5 first:mt-0">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base font-semibold text-slate-200 mb-2 mt-4 first:mt-0">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-slate-300 mb-4 leading-relaxed text-sm">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-1 mb-4 text-slate-300 text-sm pl-2">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-1 mb-4 text-slate-300 text-sm pl-2">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-slate-300 text-sm leading-relaxed">
                    {children}
                  </li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-floodlight">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-slate-300">{children}</em>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-pitch-green/40 pl-4 my-4 text-slate-400 italic text-sm">
                    {children}
                  </blockquote>
                ),
                code: ({ children, className }) => {
                  const isBlock = className?.includes("language-");
                  if (isBlock) {
                    return (
                      <code className="block bg-white/5 border border-white/10 rounded-md p-3 text-xs font-mono text-slate-300 overflow-x-auto mb-4">
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code className="bg-white/10 rounded px-1 py-0.5 text-xs font-mono text-slate-200">
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => (
                  <pre className="mb-4">{children}</pre>
                ),
                hr: () => (
                  <hr className="border-white/10 my-6" />
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pitch-green hover:underline"
                  >
                    {children}
                  </a>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm border border-white/10 rounded">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="text-left px-3 py-2 text-muted-foreground border-b border-white/10 bg-white/5 font-medium text-xs uppercase tracking-wide">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-3 py-2 text-slate-300 border-b border-white/5 text-sm">
                    {children}
                  </td>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
          {!content && (
            <p className="text-muted-foreground text-sm italic">
              No content to preview.
            </p>
          )}
        </div>
      ) : (
        <div className="p-4">
          <textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            className="w-full min-h-[calc(100vh-340px)] bg-transparent text-slate-300 text-sm font-mono leading-relaxed resize-y outline-none placeholder:text-muted-foreground/40 border border-white/10 rounded-md p-3 focus:border-white/20 transition-colors"
            placeholder="Article content in Markdown..."
            spellCheck={false}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Editing in Markdown. Switch to Preview to see the rendered result.
          </p>
        </div>
      )}
    </div>
  );
}
