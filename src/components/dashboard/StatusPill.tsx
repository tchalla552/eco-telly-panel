import { cn } from "@/lib/utils";
import type { ChargingStatus } from "@/types/telemetry";

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
  title,
}: {
  children: React.ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
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

const CHARGE_TONES: Record<ChargingStatus, Tone> = {
  mppt: "solar",
  boost: "solar",
  floating: "battery",
  equalizing: "accent",
  "current limiting": "warning",
  activated: "accent",
  deactivated: "neutral",
};

const CHARGE_LABELS: Record<ChargingStatus, string> = {
  mppt: "MPPT",
  boost: "Boost",
  floating: "Floating",
  equalizing: "Equalizing",
  "current limiting": "Current limiting",
  activated: "Activated",
  deactivated: "Deactivated",
};

export function chargeTone(status: ChargingStatus | undefined): Tone {
  return status ? (CHARGE_TONES[status] ?? "neutral") : "neutral";
}

export function chargeLabel(status: ChargingStatus | undefined): string {
  return status ? (CHARGE_LABELS[status] ?? status) : "—";
}

/** Charging stage is the primary status: "Charging · Boost". */
export function ChargeStagePill({
  status,
  className,
}: {
  status: ChargingStatus | undefined;
  className?: string;
}) {
  const active =
    status !== undefined && status !== "deactivated" && status !== "activated";
  return (
    <StatusPill
      tone={chargeTone(status)}
      dot
      className={className}
      title="Charging stage reported by the controller"
    >
      {active ? (
        <>
          <span className="opacity-70">Charging ·</span> {chargeLabel(status)}
        </>
      ) : (
        chargeLabel(status)
      )}
    </StatusPill>
  );
}
