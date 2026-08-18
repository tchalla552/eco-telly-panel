/// <reference types="web-bluetooth" />
import { Emitter } from "./emitter";
import { normalize, type RawControllerFrame } from "./telemetryService";
import type { ConnectionState, Telemetry, TelemetrySource } from "@/types/telemetry";

/** Live Web Bluetooth source for Renogy/Power Queen BT-TH modules. */

export const BT1_WRITE_SERVICE = "0000ffd0-0000-1000-8000-00805f9b34fb";
export const BT1_WRITE_CHAR = "0000ffd1-0000-1000-8000-00805f9b34fb";
export const BT1_NOTIFY_SERVICE = "0000fff0-0000-1000-8000-00805f9b34fb";
export const BT1_NOTIFY_CHAR = "0000fff1-0000-1000-8000-00805f9b34fb";

const POLL_MS = 5_000;
const READ_FUNCTION = 3;
const LIVE_DATA_BYTES = 68;
const LIVE_DATA_REQUEST = new Uint8Array([255, 3, 1, 0, 0, 34, 209, 241]);
const BATTERY_TYPE_DATA_BYTES = 2;
const BATTERY_TYPE_REQUEST = new Uint8Array([255, 3, 224, 4, 0, 1, 231, 213]);

const CHARGING_STATE: Record<number, RawControllerFrame["charging_status"]> = {
  0: "deactivated",
  1: "activated",
  2: "mppt",
  3: "equalizing",
  4: "boost",
  5: "floating",
  6: "current limiting",
};

const BATTERY_TYPE: Record<number, string> = {
  1: "open",
  2: "sealed",
  3: "gel",
  4: "lithium",
  5: "custom",
};

/** Matches renogy-bt's sign-bit temperature encoding and Fahrenheit output. */
function temperatureF(raw: number): number {
  const celsius = raw >> 7 === 1 ? -(raw - 128) : raw;
  return (celsius * 9) / 5 + 32;
}

function parseControllerFrame(
  view: DataView,
  bluetoothName?: string,
  batteryType?: string,
): RawControllerFrame | null {
  // A read response is: device id, function, byte count, register data, CRC.
  // All requested values end within the 68-byte register-data section.
  if (
    view.byteLength < 3 + LIVE_DATA_BYTES ||
    view.getUint8(1) !== READ_FUNCTION ||
    view.getUint8(2) < LIVE_DATA_BYTES
  ) {
    return null;
  }

  return {
    timestamp: new Date().toISOString(),
    model: "ML2430",
    ...(bluetoothName ? { bluetooth_name: bluetoothName } : {}),
    ...(batteryType ? { battery_type: batteryType } : {}),
    battery_percentage: view.getUint16(3),
    battery_voltage: view.getUint16(5) * 0.1,
    battery_current: view.getUint16(7) * 0.01,
    controller_temperature: temperatureF(view.getUint8(9)),
    battery_temperature: temperatureF(view.getUint8(10)),
    load_status: view.getUint8(67) >> 7 === 1 ? "on" : "off",
    load_voltage: view.getUint16(11) * 0.1,
    load_current: view.getUint16(13) * 0.01,
    load_power: view.getUint16(15),
    pv_voltage: view.getUint16(17) * 0.1,
    pv_current: view.getUint16(19) * 0.01,
    pv_power: view.getUint16(21),
    max_charging_power_today: view.getUint16(33),
    // RoverClient reports these register values directly in watt-hours.
    power_generation_today: view.getUint16(41),
    power_generation_total: view.getUint32(59),
    charging_status: CHARGING_STATE[view.getUint8(68)] ?? "deactivated",
  };
}

export class BluetoothSource implements TelemetrySource {
  readonly mode = "live" as const;

  private data = new Emitter<[Telemetry]>();
  private state = new Emitter<[ConnectionState, string | undefined]>();
  private device: BluetoothDevice | null = null;
  private writeChar: BluetoothRemoteGATTCharacteristic | null = null;
  private notifyChar: BluetoothRemoteGATTCharacteristic | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private batteryType: string | undefined;

  private readonly notificationHandler = (event: Event) => {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    if (!characteristic.value) return;

    const view = characteristic.value;
    if (
      view.byteLength === BATTERY_TYPE_DATA_BYTES + 5 &&
      view.getUint8(1) === READ_FUNCTION &&
      view.getUint8(2) === BATTERY_TYPE_DATA_BYTES
    ) {
      this.batteryType = BATTERY_TYPE[view.getUint16(3)];
      void this.requestTelemetry().catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Telemetry request failed";
        this.state.emit("error", message);
      });
      return;
    }

    const raw = parseControllerFrame(view, this.device?.name, this.batteryType);
    if (raw) this.data.emit(normalize(raw));
  };

  private readonly disconnectedHandler = () => {
    void this.cleanUp(false).finally(() => {
      this.state.emit("disconnected", "Controller link dropped");
    });
  };

  static isSupported() {
    return typeof navigator !== "undefined" && "bluetooth" in navigator;
  }

  /** Must be called from a user gesture (click). */
  async connect() {
    if (!BluetoothSource.isSupported()) {
      this.state.emit("error", "Web Bluetooth is unavailable. Use Chrome over HTTPS.");
      return;
    }

    await this.cleanUp(true);

    try {
      this.state.emit("connecting", "Requesting device");
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "BT-TH-" }],
        optionalServices: [BT1_WRITE_SERVICE, BT1_NOTIFY_SERVICE],
      });
      this.device = device;
      device.addEventListener("gattserverdisconnected", this.disconnectedHandler);

      this.state.emit("connecting", device.name ?? "BT-TH module");
      const server = await device.gatt?.connect();
      if (!server) throw new Error("GATT connect failed");

      await this.startPolling(server);
      this.state.emit("connected", device.name ?? "BT-TH module");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connection failed";
      await this.cleanUp(true);
      this.state.emit("error", message);
    }
  }

  private async startPolling(server: BluetoothRemoteGATTServer) {
    const writeService = await server.getPrimaryService(BT1_WRITE_SERVICE);
    const notifyService = await server.getPrimaryService(BT1_NOTIFY_SERVICE);

    this.writeChar = await writeService.getCharacteristic(BT1_WRITE_CHAR);
    this.notifyChar = await notifyService.getCharacteristic(BT1_NOTIFY_CHAR);
    this.notifyChar.addEventListener("characteristicvaluechanged", this.notificationHandler);
    await this.notifyChar.startNotifications();

    await this.requestBatteryType();
    this.pollTimer = setInterval(() => {
      void this.requestTelemetry().catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Telemetry request failed";
        this.state.emit("error", message);
      });
    }, POLL_MS);
  }

  private async requestTelemetry() {
    if (!this.writeChar || !this.device?.gatt?.connected) return;
    await this.writeChar.writeValue(LIVE_DATA_REQUEST);
  }

  private async requestBatteryType() {
    if (!this.writeChar || !this.device?.gatt?.connected) return;
    await this.writeChar.writeValue(BATTERY_TYPE_REQUEST);
  }

  private async cleanUp(disconnectGatt: boolean) {
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    const notifyChar = this.notifyChar;
    this.notifyChar = null;
    this.writeChar = null;
    this.batteryType = undefined;
    if (notifyChar) {
      notifyChar.removeEventListener("characteristicvaluechanged", this.notificationHandler);
      if (notifyChar.service.device.gatt?.connected) {
        try {
          await notifyChar.stopNotifications();
        } catch {
          // The remote device may already have disappeared.
        }
      }
    }

    const device = this.device;
    this.device = null;
    if (device) {
      device.removeEventListener("gattserverdisconnected", this.disconnectedHandler);
      if (disconnectGatt && device.gatt?.connected) device.gatt.disconnect();
    }
  }

  async disconnect() {
    await this.cleanUp(true);
    this.state.emit("disconnected", undefined);
  }

  onData(handler: (t: Telemetry) => void) {
    return this.data.on(handler);
  }

  onState(handler: (s: ConnectionState, detail?: string) => void) {
    return this.state.on(handler);
  }
}
