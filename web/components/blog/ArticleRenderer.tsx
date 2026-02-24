"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { splitMarkdownSections } from "@/lib/blog/markdown";
import { BlogAdSlot } from "./BlogAdSlot";
import { AppPromoBanner } from "./AppPromoBanner";

// Tailwind class map for markdown elements — static classes for JIT compatibility
const markdownComponents: Components = {
  h2({ children }) {
    return (
      <h2 className="font-bebas text-3xl text-floodlight tracking-wide mt-10 mb-4">
        {children}
      </h2>
    );
  },
  h3({ children }) {
    return (
      <h3 className="font-bebas text-2xl text-floodlight tracking-wide mt-8 mb-3">
        {children}
      </h3>
    );
  },
  p({ children }) {
    return <p className="text-slate-300 leading-relaxed mb-4">{children}</p>;
  },
  strong({ children }) {
    return <strong className="text-floodlight font-semibold">{children}</strong>;
  },
  em({ children }) {
    return <em className="italic text-slate-300">{children}</em>;
  },
  a({ href, children }) {
    const isExternal = href?.startsWith("http");
    return (
      <a
        href={href}
        className="text-pitch-green hover:underline underline-offset-2"
        {...(isExternal
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {children}
      </a>
    );
  },
  ul({ children }) {
    return (
      <ul className="text-slate-300 space-y-2 mb-4 ml-6 list-disc">
        {children}
      </ul>
    );
  },
  ol({ children }) {
    return (
      <ol className="text-slate-300 space-y-2 mb-4 ml-6 list-decimal">
        {children}
      </ol>
    );
  },
  li({ children }) {
    return <li className="leading-relaxed">{children}</li>;
  },
  blockquote({ children }) {
    return (
      <blockquote className="border-l-2 border-pitch-green pl-4 italic text-slate-400 my-4">
        {children}
      </blockquote>
    );
  },
  hr() {
    return <hr className="border-white/10 my-8" />;
  },
  code({ children, className }) {
    // Inline code only — no fenced code blocks expected in blog content
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <pre className="bg-white/5 border border-white/10 rounded-lg p-4 overflow-x-auto my-4">
          <code className="text-sm text-slate-300 font-mono">{children}</code>
        </pre>
      );
    }
    return (
      <code className="bg-white/10 text-pitch-green text-sm font-mono px-1.5 py-0.5 rounded">
        {children}
      </code>
    );
  },
};

interface ArticleRendererProps {
  content: string;
}

export function ArticleRenderer({ content }: ArticleRendererProps) {
  const sections = splitMarkdownSections(content);

  return (
    <div className="article-body">
      {sections.map((section, index) => {
        // Build the markdown string for this section:
        // If there's a heading, prepend it as a ## heading so ReactMarkdown renders it
        const sectionMarkdown = section.heading
          ? `## ${section.heading}\n\n${section.content}`
          : section.content;

        // After the 3rd section (index 2), inject the AppPromoBanner
        const showAppBanner = index === 2;

        // After every 2nd section (index 1, 3, 5...), inject a BlogAdSlot
        // Skip index 2 since AppPromoBanner is already placed there
        const showAdSlot = index > 0 && index % 2 === 1;

        return (
          <div key={`section-${index}`}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {sectionMarkdown}
            </ReactMarkdown>
            {showAppBanner && <AppPromoBanner />}
            {!showAppBanner && showAdSlot && <BlogAdSlot />}
          </div>
        );
      })}
    </div>
  );
}
