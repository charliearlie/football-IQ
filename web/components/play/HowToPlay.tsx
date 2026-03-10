interface HowToPlayProps {
  title: string;
  rules: string[];
  tips: string[];
  keywords?: string;
}

export function HowToPlay({ title, rules, tips, keywords }: HowToPlayProps) {
  return (
    <details className="max-w-md mx-auto w-full px-4 pb-8 group">
      <summary className="cursor-pointer text-sm font-semibold text-slate-300 uppercase tracking-wider py-3 list-none flex items-center justify-between border-t border-white/5">
        <span>How to Play {title}</span>
        <span className="text-slate-500 group-open:rotate-45 transition-transform text-lg leading-none">
          +
        </span>
      </summary>
      <div className="text-sm text-slate-400 leading-relaxed space-y-4 pt-2">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
            Rules
          </p>
          <ul className="list-disc list-inside space-y-1">
            {rules.map((rule, i) => (
              <li key={i}>{rule}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
            Tips
          </p>
          <ul className="list-disc list-inside space-y-1">
            {tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
        {keywords && <p className="text-slate-500 text-xs">{keywords}</p>}
      </div>
    </details>
  );
}
