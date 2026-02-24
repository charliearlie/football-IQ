import { format, parseISO } from "date-fns";

interface BlogHeaderProps {
  title: string;
  subtitle: string | null;
  date: string;
  readTime: string;
}

export function BlogHeader({ title, subtitle, date, readTime }: BlogHeaderProps) {
  const formattedDate = format(parseISO(date), "EEEE d MMMM yyyy");

  return (
    <header className="mb-10 pb-8 border-b border-white/10">
      <time
        dateTime={date}
        className="block text-xs text-slate-500 uppercase tracking-wider mb-4"
      >
        {formattedDate}
      </time>

      <h1 className="font-bebas text-4xl md:text-5xl text-floodlight tracking-wide leading-tight mb-4">
        {title}
      </h1>

      <div className="flex items-center gap-2 text-sm text-slate-400">
        <span>Football IQ Daily Digest</span>
        <span className="text-white/20" aria-hidden="true">·</span>
        <span>{readTime}</span>
      </div>

      {subtitle && (
        <p className="mt-4 text-base text-slate-300 leading-relaxed border-l-2 border-pitch-green pl-4">
          {subtitle}
        </p>
      )}
    </header>
  );
}
