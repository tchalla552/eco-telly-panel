import { cn } from "@/lib/utils";

export function Panel({
  title,
  meta,
  children,
  className,
}: {
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("panel p-4 sm:p-5", className)}>
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {title}
        </h2>
        {meta}
      </header>
      {children}
    </section>
  );
}

export function Metric({
  label,
  value,
  unit,
  hint,
  tone,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  tone?: "solar" | "battery" | "warning" | "default";
}) {
  const toneClass =
    tone === "solar"
      ? "text-solar"
      : tone === "battery"
        ? "text-battery"
        : tone === "warning"
          ? "text-warning"
          : "text-foreground";

  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">{label}</div>
      <div className={cn("readout mt-1 flex items-baseline gap-1 text-xl sm:text-2xl", toneClass)}>
        <span>{value}</span>
        {unit ? <span className="text-xs text-muted-foreground">{unit}</span> : null}
      </div>
      {hint ? <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

export function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "warning";
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-2 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "readout text-sm",
          tone === "warning" ? "text-warning" : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}
