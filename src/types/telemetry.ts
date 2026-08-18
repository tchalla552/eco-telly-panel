export type ChargingStatus =
  | "deactivated"
  | "activated"
  | "mppt"
  | "equalizing"
  | "boost"
  | "floating"
  | "current limiting"
  | string;

export interface Telemetry {
  timestamp?: string;
  model: string;
  device_id?: number;
  battery_percentage: number;
  battery_voltage: number;
  battery_current: number;
  battery_temperature: number;
  controller_temperature: number;
  load_status: string;
  load_voltage?: number;
  load_current?: number;
  load_power: number;
  pv_voltage: number;
  pv_current: number;
  pv_power: number;
  max_charging_power_today: number;
  max_discharging_power_today?: number;
  charging_amp_hours_today: number;
  discharging_amp_hours_today?: number;
  power_generation_today: number;
  power_consumption_today?: number;
  power_generation_total: number;
  charging_status: ChargingStatus;
  battery_type: string;
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
}

export interface HistoryPoint {
  t: number;
  label: string;
  pv_power: number;
  battery_voltage: number;
  battery_current: number;
}
