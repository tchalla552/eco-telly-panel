/** Presentation helpers. Storage is always Wh / W; display unit is chosen here. */

export function formatEnergyWh(wh: number | undefined): { value: string; unit: string } {
  if (wh === undefined || !isFinite(wh)) return { value: "—", unit: "Wh" };
  const abs = Math.abs(wh);
  if (abs >= 1_000_000) return { value: (wh / 1_000_000).toFixed(2), unit: "MWh" };
  if (abs >= 1_000) return { value: (wh / 1_000).toFixed(wh / 1000 >= 100 ? 1 : 2), unit: "kWh" };
  return { value: Math.round(wh).toString(), unit: "Wh" };
}

export function energyText(wh: number | undefined): string {
  const { value, unit } = formatEnergyWh(wh);
  return `${value} ${unit}`;
}

/** Concise local clock label — no seconds. */
export function clockLabel(t: number, compact = false): string {
  const d = new Date(t);
  return d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: !compact,
  });
}

export function num(v: number | undefined, decimals = 1): string {
  return v === undefined || !isFinite(v) ? "—" : v.toFixed(decimals);
}
