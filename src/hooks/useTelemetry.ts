import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createTelemetrySource,
  normalize,
  resolveMode,
} from "@/services/telemetryService";
import type {
  ConnectionState,
  HistoryPoint,
  SourceMode,
  Telemetry,
} from "@/types/telemetry";

const HISTORY_LIMIT = 60;

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

    const offData = source.onData((raw) => {
      const t = normalize(raw);
      setTelemetry(t);
      setHistory((prev) => {
        const at = t.timestamp ? new Date(t.timestamp) : new Date();
        const point: HistoryPoint = {
          t: at.getTime(),
          label: at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          pv_power: t.pv_power,
          battery_voltage: t.battery_voltage,
          battery_current: t.battery_current,
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
