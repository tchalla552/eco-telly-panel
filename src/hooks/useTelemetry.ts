import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createTelemetrySource, resolveMode } from "@/services/telemetryService";
import type {
  ConnectionState,
  HistoryPoint,
  SourceMode,
  Telemetry,
} from "@/types/telemetry";

/**
 * In-memory retention only. A persistent store (file, IndexedDB, backend)
 * can later replace this by feeding the same `HistoryPoint[]` shape.
 */
const HISTORY_LIMIT = 4000;

export function useTelemetry() {
  const [mode, setMode] = useState<SourceMode>("live");
  const [state, setState] = useState<ConnectionState>("disconnected");
  const [detail, setDetail] = useState<string>();
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const sourceRef = useRef<ReturnType<typeof createTelemetrySource> | null>(null);

  useEffect(() => {
    const resolved = resolveMode();
    setMode(resolved);
    const source = createTelemetrySource(resolved);
    sourceRef.current = source;

    const seed = source.seedHistory?.() ?? [];
    if (seed.length) setHistory(seed);

    const offData = source.onData((t) => {
      setTelemetry(t);
      setHistory((prev) => {
        const point: HistoryPoint = {
          t: t.timestamp ? new Date(t.timestamp).getTime() : Date.now(),
          pv_power_w: t.solar.power_w,
          battery_voltage_v: t.battery.voltage_v,
          battery_current_a: t.battery.charge_current_a,
        };
        return [...prev, point].slice(-HISTORY_LIMIT);
      });
    });
    const offState = source.onState((s, d) => {
      setState(s);
      setDetail(d);
    });

    // Mock mode streams immediately; live mode waits for a user gesture.
    if (resolved === "mock") void source.connect();

    return () => {
      offData();
      offState();
      void source.disconnect();
      sourceRef.current = null;
    };
  }, []);

  const connect = useCallback(() => {
    void sourceRef.current?.connect();
  }, []);

  const disconnect = useCallback(() => {
    void sourceRef.current?.disconnect();
  }, []);

  return useMemo(
    () => ({ mode, state, detail, telemetry, history, connect, disconnect }),
    [mode, state, detail, telemetry, history, connect, disconnect],
  );
}
