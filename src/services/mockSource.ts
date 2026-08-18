import fixture from "./fixtures/telemetry-fixture.json";
import { Emitter } from "./emitter";
import { normalize, type RawControllerFrame } from "./telemetryService";
import type {
  ConnectionState,
  HistoryPoint,
  Telemetry,
  TelemetrySource,
} from "@/types/telemetry";

const POLL_MS = 2000;
/** Spacing used when projecting the fixture onto a synthetic "today" series. */
const SEED_SPACING_MS = 5 * 60_000;

const RECORDS = fixture as unknown as RawControllerFrame[];

/**
 * Replays a local JSON fixture on a loop, as if the controller were polled live.
 * No Bluetooth discovery happens in this mode.
 */
export class MockSource implements TelemetrySource {
  readonly mode = "mock" as const;

  private data = new Emitter<[Telemetry]>();
  private state = new Emitter<[ConnectionState, string | undefined]>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private index = 0;

  async connect() {
    if (this.timer) return;
    this.state.emit("connecting", "Loading fixture");
    this.state.emit("connected", "Mock replay · BT-TH-XXXXXXXX");
    const push = () => {
      const record = RECORDS[this.index % RECORDS.length];
      this.index += 1;
      if (!record) return;
      this.data.emit(normalize({ ...record, timestamp: new Date().toISOString() }));
    };
    push();
    this.timer = setInterval(push, POLL_MS);
  }

  /** Fixture projected backwards over the day so "Today" has a shape to draw. */
  seedHistory(): HistoryPoint[] {
    const end = Date.now() - SEED_SPACING_MS;
    return RECORDS.map((raw, i) => {
      const t = normalize(raw);
      return {
        t: end - (RECORDS.length - 1 - i) * SEED_SPACING_MS,
        pv_power_w: t.solar.power_w,
        battery_voltage_v: t.battery.voltage_v,
        battery_current_a: t.battery.charge_current_a,
      };
    });
  }

  async disconnect() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.state.emit("disconnected", undefined);
  }

  onData(handler: (t: Telemetry) => void) {
    return this.data.on(handler);
  }

  onState(handler: (s: ConnectionState, detail?: string) => void) {
    return this.state.on(handler);
  }
}
