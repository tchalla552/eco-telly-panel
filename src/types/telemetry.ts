export type ChargingStatus =
  | "deactivated"
  | "activated"
  | "mppt"
  | "equalizing"
  | "boost"
  | "floating"
  | "current limiting";

export const CHARGING_STATUSES: ChargingStatus[] = [
  "deactivated",
  "activated",
  "mppt",
  "equalizing",
  "boost",
  "floating",
  "current limiting",
];

/**
 * Measurement quality is architectural metadata: every value the dashboard
 * shows is either directly measured by the controller, estimated by the
 * controller, or derived by this application. The UI can surface this in
 * tooltips/hints without labelling every card.
 */
export type Quality = "measured" | "controller-estimated" | "derived";

export const QUALITY_LABEL: Record<Quality, string> = {
  measured: "Measured by controller",
  "controller-estimated": "Estimated by controller — not authoritative",
  derived: "Derived by this dashboard",
};

/** Which quality applies to each telemetry field path. */
export const FIELD_QUALITY = {
  "solar.voltage_v": "measured",
  "solar.current_a": "measured",
  "solar.power_w": "measured",
  "solar.generation_today_wh": "measured",
  "solar.generation_total_wh": "measured",
  "solar.max_power_today_w": "measured",
  "battery.voltage_v": "measured",
  "battery.charge_current_a": "measured",
  "battery.temperature_f": "measured",
  "battery.reported_soc_percent": "controller-estimated",
  "controller.temperature_f": "measured",
  "controller.charging_status": "measured",
  "load.power_w": "measured",
} satisfies Record<string, Quality>;

export type TelemetryField = keyof typeof FIELD_QUALITY;

export function qualityOf(field: TelemetryField): Quality {
  return FIELD_QUALITY[field];
}

/**
 * Normalized telemetry. Units are explicit in every field name:
 * power is watts (_w), energy is watt-hours (_wh). Sources MUST convert to
 * these units so no consumer has to guess Wh vs kWh.
 */
export interface Telemetry {
  timestamp: string;

  device: {
    model: string;
    bluetoothName?: string;
  };

  solar: {
    voltage_v: number;
    current_a: number;
    power_w: number;
    generation_today_wh: number;
    generation_total_wh: number;
    max_power_today_w: number;
  };

  battery: {
    voltage_v: number;
    charge_current_a: number;
    reported_soc_percent?: number;
    temperature_f: number;
    chemistry: string;
  };

  controller: {
    temperature_f: number;
    charging_status: ChargingStatus;
  };

  load: {
    status: "on" | "off";
    voltage_v: number;
    current_a: number;
    power_w: number;
  };
}

export type ConnectionState = "disconnected" | "connecting" | "connected" | "error";

export type SourceMode = "mock" | "live";

/** Everything the UI needs to know about where data comes from. */
export interface TelemetrySource {
  readonly mode: SourceMode;
  /** Starts streaming. In live mode this MUST be called from a user gesture. */
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  onData(handler: (t: Telemetry) => void): () => void;
  onState(handler: (s: ConnectionState, detail?: string) => void): () => void;
  /** Optional seed history (e.g. a mock day) for the "Today" chart range. */
  seedHistory?(): HistoryPoint[];
}

/** One retained sample. Kept flat and unit-explicit for charting. */
export interface HistoryPoint {
  t: number;
  pv_power_w: number;
  battery_voltage_v: number;
  battery_current_a: number;
}

export type TimeRange = "15m" | "1h" | "today";

export const TIME_RANGES: { id: TimeRange; label: string; ms: number | null }[] = [
  { id: "15m", label: "15m", ms: 15 * 60_000 },
  { id: "1h", label: "1h", ms: 60 * 60_000 },
  { id: "today", label: "Today", ms: null },
];
