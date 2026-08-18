/** Configurable thresholds — never hard-code warning behaviour in components. */

export type ThresholdLevel = "nominal" | "elevated" | "high";

export interface Threshold {
  elevated: number;
  high: number;
  unit: string;
}

export const THRESHOLDS = {
  controllerTemperatureF: { elevated: 130, high: 158, unit: "°F" },
  batteryTemperatureF: { elevated: 122, high: 140, unit: "°F" },
} satisfies Record<string, Threshold>;

export function levelFor(value: number | undefined, threshold: Threshold): ThresholdLevel {
  if (value === undefined || !isFinite(value)) return "nominal";
  if (value >= threshold.high) return "high";
  if (value >= threshold.elevated) return "elevated";
  return "nominal";
}

export const THRESHOLD_LABEL: Record<ThresholdLevel, string> = {
  nominal: "Nominal",
  elevated: "Running warm",
  high: "Running hot",
};
