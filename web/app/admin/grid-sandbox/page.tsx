import { GridSandbox } from "./_components/GridSandbox";

export default function GridSandboxPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC]">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold font-[family-name:var(--font-bebas)] tracking-wide">
            Grid Sandbox
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Dev tool for validating 3x3 matrix logic, stats_cache accuracy, and
            rarity scoring
          </p>
        </div>
        <GridSandbox />
      </div>
    </div>
  );
}
