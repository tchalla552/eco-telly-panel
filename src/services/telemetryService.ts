import { BluetoothSource } from "./bluetoothSource";
import { MockSource } from "./mockSource";
import type { SourceMode, Telemetry, TelemetrySource } from "@/types/telemetry";

/** `?mock=1` forces the fixture replay source. */
export function resolveMode(search?: string): SourceMode {
  const query = search ?? (typeof window !== "undefined" ? window.location.search : "");
  const value = new URLSearchParams(query).get("mock");
  return value && value !== "0" && value !== "false" ? "mock" : "live";
}

export function createTelemetrySource(mode: SourceMode): TelemetrySource {
  return mode === "mock" ? new MockSource() : new BluetoothSource();
}

/** Guards against partial frames so the UI always gets full numbers. */
export function normalize(raw: Partial<Telemetry>): Telemetry {
  const n = (v: unknown, fallback = 0) => (typeof v === "number" && isFinite(v) ? v : fallback);
  return {
    timestamp: raw.timestamp ?? new Date().toISOString(),
    model: raw.model ?? "ML2430",
    device_id: n(raw.device_id, 1),
    battery_percentage: n(raw.battery_percentage),
    battery_voltage: n(raw.battery_voltage),
    battery_current: n(raw.battery_current),
    battery_temperature: n(raw.battery_temperature),
    controller_temperature: n(raw.controller_temperature),
    load_status: raw.load_status ?? "off",
    load_voltage: n(raw.load_voltage),
    load_current: n(raw.load_current),
    load_power: n(raw.load_power),
    pv_voltage: n(raw.pv_voltage),
    pv_current: n(raw.pv_current),
    pv_power: n(raw.pv_power),
    max_charging_power_today: n(raw.max_charging_power_today),
    max_discharging_power_today: n(raw.max_discharging_power_today),
    charging_amp_hours_today: n(raw.charging_amp_hours_today),
    discharging_amp_hours_today: n(raw.discharging_amp_hours_today),
    power_generation_today: n(raw.power_generation_today),
    power_consumption_today: n(raw.power_consumption_today),
    power_generation_total: n(raw.power_generation_total),
    charging_status: raw.charging_status ?? "deactivated",
    battery_type: raw.battery_type ?? "lithium",
  };
}
