import { cn } from "@/lib/utils";

type Tone = "neutral" | "solar" | "battery" | "accent" | "warning" | "danger";

const tones: Record<Tone, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  solar: "border-solar/40 bg-solar/12 text-solar",
  battery: "border-battery/40 bg-battery/12 text-battery",
  accent: "border-accent/40 bg-accent/12 text-accent",
  warning: "border-warning/45 bg-warning/12 text-warning",
  danger: "border-destructive/45 bg-destructive/12 text-destructive",
};

export function StatusPill({
  children,
  tone = "neutral",
  dot = false,
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.09em]",
        tones[tone],
        className,
      )}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}

const CHARGE_TONES: Record<string, Tone> = {
  mppt: "solar",
  boost: "solar",
  floating: "battery",
  equalizing: "accent",
  "current limiting": "warning",
  activated: "accent",
  deactivated: "neutral",
};

export function chargeTone(status: string): Tone {
  return CHARGE_TONES[status.toLowerCase()] ?? "neutral";
}
