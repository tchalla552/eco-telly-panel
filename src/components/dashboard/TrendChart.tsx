import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { clockLabel } from "@/lib/format";
import { TIME_RANGES } from "@/types/telemetry";
import type { HistoryPoint, TimeRange } from "@/types/telemetry";

export type SeriesKey = "pv_power_w" | "battery_voltage_v" | "battery_current_a";

export const SERIES: Record<
  SeriesKey,
  { label: string; unit: string; color: string; decimals: number }
> = {
  pv_power_w: { label: "Solar power", unit: "W", color: "var(--color-solar)", decimals: 0 },
  battery_voltage_v: {
    label: "Battery voltage",
    unit: "V",
    color: "var(--color-battery)",
    decimals: 2,
  },
  battery_current_a: {
    label: "Charge current",
    unit: "A",
    color: "var(--color-chart-3)",
    decimals: 2,
  },
};

/** Filters retained samples to a range. Swappable for a persistent store later. */
export function sliceRange(data: HistoryPoint[], range: TimeRange): HistoryPoint[] {
  const spec = TIME_RANGES.find((r) => r.id === range);
  if (!spec?.ms) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return data.filter((p) => p.t >= startOfDay.getTime());
  }
  const cutoff = Date.now() - spec.ms;
  return data.filter((p) => p.t >= cutoff);
}

export function RangeSelector({
  value,
  onChange,
  className,
}: {
  value: TimeRange;
  onChange: (r: TimeRange) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-border bg-muted/40 p-0.5",
        className,
      )}
      role="group"
      aria-label="Chart time range"
    >
      {TIME_RANGES.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => onChange(r.id)}
          aria-pressed={value === r.id}
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide transition-colors",
            value === r.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

export function SeriesSelector({
  value,
  options,
  onChange,
}: {
  value: SeriesKey;
  options: SeriesKey[];
  onChange: (k: SeriesKey) => void;
}) {
  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-full border border-border bg-muted/40 p-0.5"
      role="group"
      aria-label="Chart series"
    >
      {options.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          aria-pressed={value === key}
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide transition-colors",
            value === key
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {SERIES[key].label}
        </button>
      ))}
    </div>
  );
}

export function TrendChart({
  data,
  series,
  height = 168,
}: {
  data: HistoryPoint[];
  series: SeriesKey;
  height?: number;
}) {
  const spec = SERIES[series];
  const points = useMemo(
    () => data.map((p) => ({ ...p, label: clockLabel(p.t, true) })),
    [data],
  );

  if (points.length < 2) {
    return (
      <div
        className="flex items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground"
        style={{ height }}
      >
        Collecting samples for this range…
      </div>
    );
  }

  const gradientId = `grad-${series}`;

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 6, right: 6, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={spec.color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={spec.color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
            stroke="var(--color-border)"
            interval="preserveStartEnd"
            minTickGap={36}
          />
          <YAxis
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
            stroke="var(--color-border)"
            domain={["auto", "auto"]}
            width={44}
            tickFormatter={(v: number) => v.toFixed(spec.decimals)}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--color-muted-foreground)" }}
            labelFormatter={(_l, payload) => {
              const t = payload?.[0]?.payload?.t as number | undefined;
              return t ? clockLabel(t) : "";
            }}
            formatter={(value) => [
              `${Number(value).toFixed(spec.decimals)} ${spec.unit}`,
              spec.label,
            ]}
          />
          <Area
            type="monotone"
            dataKey={series}
            stroke={spec.color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
