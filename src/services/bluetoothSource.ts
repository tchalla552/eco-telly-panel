/// <reference types="web-bluetooth" />
import { Emitter } from "./emitter";
import type { ConnectionState, Telemetry, TelemetrySource } from "@/types/telemetry";

/**
 * Live BT-1 (BT-TH-*) source.
 *
 * PORTING NOTE
 * ------------
 * The protocol layer is intentionally left as a stub. The known-working
 * Web Bluetooth logic from web-bt1-monitor should be dropped into
 * `startPolling()` / `parseFrame()` below. Everything above that line
 * (device selection, GATT connect, lifecycle, event fan-out) is already in
 * place, and the dashboard only ever sees normalized `Telemetry` objects.
 *
 * BT-1 module GATT (Renogy/Power Queen BT-TH-* family):
 *   write service  0000ffd0-0000-1000-8000-00805f9b34fb
 *   write char     0000ffd1-0000-1000-8000-00805f9b34fb
 *   notify service 0000fff0-0000-1000-8000-00805f9b34fb
 *   notify char    0000fff1-0000-1000-8000-00805f9b34fb
 * Payloads are Modbus-RTU-over-RS232 frames (device id 1, read holding regs).
 */

export const BT1_WRITE_SERVICE = "0000ffd0-0000-1000-8000-00805f9b34fb";
export const BT1_WRITE_CHAR = "0000ffd1-0000-1000-8000-00805f9b34fb";
export const BT1_NOTIFY_SERVICE = "0000fff0-0000-1000-8000-00805f9b34fb";
export const BT1_NOTIFY_CHAR = "0000fff1-0000-1000-8000-00805f9b34fb";

export class BluetoothSource implements TelemetrySource {
  readonly mode = "live" as const;

  private data = new Emitter<[Telemetry]>();
  private state = new Emitter<[ConnectionState, string | undefined]>();
  private device: BluetoothDevice | null = null;

  static isSupported() {
    return typeof navigator !== "undefined" && "bluetooth" in navigator;
  }

  /** Must be called from a user gesture (click). */
  async connect() {
    if (!BluetoothSource.isSupported()) {
      this.state.emit("error", "Web Bluetooth is unavailable. Use Chrome over HTTPS.");
      return;
    }
    try {
      this.state.emit("connecting", "Requesting device");
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "BT-TH-" }],
        optionalServices: [BT1_WRITE_SERVICE, BT1_NOTIFY_SERVICE],
      });
      this.device = device;
      device.addEventListener("gattserverdisconnected", () => {
        this.state.emit("disconnected", "Controller link dropped");
      });

      this.state.emit("connecting", device.name ?? "BT-1 module");
      const server = await device.gatt?.connect();
      if (!server) throw new Error("GATT connect failed");

      this.state.emit("connected", device.name ?? "BT-1 module");
      await this.startPolling(server);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connection failed";
      this.state.emit("error", message);
    }
  }

  /**
   * STUB: wire the web-bt1-monitor Modbus request/notify loop in here, then
   * call `this.data.emit(parseFrame(bytes))` for every controller response.
   */
  private async startPolling(_server: BluetoothRemoteGATTServer) {
    this.state.emit(
      "error",
      "Connected, but the BT-1 protocol layer is not wired up yet in this build.",
    );
  }

  async disconnect() {
    try {
      this.device?.gatt?.disconnect();
    } finally {
      this.device = null;
      this.state.emit("disconnected", undefined);
    }
  }

  onData(handler: (t: Telemetry) => void) {
    return this.data.on(handler);
  }

  onState(handler: (s: ConnectionState, detail?: string) => void) {
    return this.state.on(handler);
  }
}
