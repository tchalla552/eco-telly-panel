import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HistoryPoint } from "@/types/telemetry";

type Key = "pv_power" | "battery_voltage" | "battery_current";

const COLORS: Record<Key, string> = {
  pv_power: "var(--color-solar)",
  battery_voltage: "var(--color-battery)",
  battery_current: "var(--color-chart-3)",
};

export function TrendChart({
  data,
  dataKey,
  unit,
  domain,
  height = 168,
  decimals = 0,
}: {
  data: HistoryPoint[];
  dataKey: Key;
  unit: string;
  domain?: [number | "auto", number | "auto"];
  height?: number;
  decimals?: number;
}) {
  if (data.length < 2) {
    return (
      <div
        className="flex items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground"
        style={{ height }}
      >
        Waiting for polling history…
      </div>
    );
  }

  const color = COLORS[dataKey];
  const gradientId = `grad-${dataKey}`;

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
            stroke="var(--color-border)"
            interval="preserveStartEnd"
            minTickGap={44}
          />
          <YAxis
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
            stroke="var(--color-border)"
            domain={domain ?? ["auto", "auto"]}
            width={44}
            tickFormatter={(v: number) => v.toFixed(decimals)}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--color-muted-foreground)" }}
            formatter={(value) => [`${Number(value).toFixed(decimals)} ${unit}`, ""]}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
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
