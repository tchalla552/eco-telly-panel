import { BluetoothSource } from "./bluetoothSource";
import { MockSource } from "./mockSource";
import { CHARGING_STATUSES } from "@/types/telemetry";
import type {
  ChargingStatus,
  SourceMode,
  Telemetry,
  TelemetrySource,
} from "@/types/telemetry";

/** `?mock=1` forces the fixture replay source. */
export function resolveMode(search?: string): SourceMode {
  const query = search ?? (typeof window !== "undefined" ? window.location.search : "");
  const value = new URLSearchParams(query).get("mock");
  return value && value !== "0" && value !== "false" ? "mock" : "live";
}

export function createTelemetrySource(mode: SourceMode): TelemetrySource {
  return mode === "mock" ? new MockSource() : new BluetoothSource();
}

/**
 * Raw controller frame shape (flat, mixed units) as produced by the BT-1
 * Modbus registers and the JSON fixture. Sources hand this to `normalize`;
 * nothing downstream ever sees it.
 */
export interface RawControllerFrame {
  timestamp?: string;
  model?: string;
  bluetooth_name?: string;
  device_id?: number;
  battery_percentage?: number;
  battery_voltage?: number;
  battery_current?: number;
  battery_temperature?: number;
  battery_type?: string;
  controller_temperature?: number;
  charging_status?: string;
  load_status?: string;
  load_voltage?: number;
  load_current?: number;
  load_power?: number;
  pv_voltage?: number;
  pv_current?: number;
  pv_power?: number;
  max_charging_power_today?: number;
  /** Watt-hours. The controller reports energy in Wh; never kWh. */
  power_generation_today?: number;
  power_generation_total?: number;
}

const n = (v: unknown, fallback = 0) =>
  typeof v === "number" && isFinite(v) ? v : fallback;

function chargingStatus(value: unknown): ChargingStatus {
  const s = typeof value === "string" ? value.toLowerCase() : "";
  return (CHARGING_STATUSES as string[]).includes(s)
    ? (s as ChargingStatus)
    : "deactivated";
}

/** Converts a raw frame into the unit-explicit normalized model. */
export function normalize(raw: RawControllerFrame): Telemetry {
  const soc = raw.battery_percentage;
  return {
    timestamp: raw.timestamp ?? new Date().toISOString(),
    device: {
      model: raw.model ?? "ML2430",
      ...(raw.bluetooth_name ? { bluetoothName: raw.bluetooth_name } : {}),
    },
    solar: {
      voltage_v: n(raw.pv_voltage),
      current_a: n(raw.pv_current),
      power_w: n(raw.pv_power),
      generation_today_wh: n(raw.power_generation_today),
      generation_total_wh: n(raw.power_generation_total),
      max_power_today_w: n(raw.max_charging_power_today),
    },
    battery: {
      voltage_v: n(raw.battery_voltage),
      charge_current_a: n(raw.battery_current),
      ...(typeof soc === "number" && isFinite(soc)
        ? { reported_soc_percent: soc }
        : {}),
      temperature_f: n(raw.battery_temperature),
      chemistry: raw.battery_type === "lithium" ? "LiFePO₄" : (raw.battery_type ?? "unknown"),
    },
    controller: {
      temperature_f: n(raw.controller_temperature),
      charging_status: chargingStatus(raw.charging_status),
    },
    load: {
      status: raw.load_status === "on" ? "on" : "off",
      voltage_v: n(raw.load_voltage),
      current_a: n(raw.load_current),
      power_w: n(raw.load_power),
    },
  };
}
