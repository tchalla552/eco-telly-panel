import fixture from "./fixtures/telemetry-fixture.json";
import { Emitter } from "./emitter";
import type { ConnectionState, Telemetry, TelemetrySource } from "@/types/telemetry";

const POLL_MS = 2000;

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
    const records = fixture as unknown as Telemetry[];
    this.state.emit("connected", "Mock replay");
    const push = () => {
      const record = records[this.index % records.length];
      this.index += 1;
      if (!record) return;
      this.data.emit({ ...record, timestamp: new Date().toISOString() });
    };
    push();
    this.timer = setInterval(push, POLL_MS);
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
