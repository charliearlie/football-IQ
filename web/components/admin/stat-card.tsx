interface StatCardProps {
  label: string;
  value: string | number;
  variant?: "success" | "warning" | "error";
  subtext?: string;
}

export function StatCard({ label, value, variant, subtext }: StatCardProps) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p
        className={
          variant === "success"
            ? "text-lg font-semibold text-pitch-green"
            : variant === "warning"
              ? "text-lg font-semibold text-card-yellow"
              : variant === "error"
                ? "text-lg font-semibold text-red-card"
                : "text-lg font-semibold text-floodlight"
        }
      >
        {value}
      </p>
      {subtext && (
        <p className="text-[10px] text-muted-foreground">{subtext}</p>
      )}
    </div>
  );
}
