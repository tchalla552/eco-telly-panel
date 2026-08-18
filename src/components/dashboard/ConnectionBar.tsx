import { Button } from "@/components/ui/button";
import { StatusPill } from "./StatusPill";
import type { ConnectionState, SourceMode } from "@/types/telemetry";

export function ConnectionBar({
  mode,
  state,
  detail,
  onConnect,
  onDisconnect,
}: {
  mode: SourceMode;
  state: ConnectionState;
  detail?: string | undefined;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const connected = state === "connected";
  const mock = mode === "mock";

  // "Connected" is reserved for a real Web Bluetooth link; mock replay is data-only.
  const label = connected
    ? mock
      ? "Data active"
      : "Connected"
    : state === "connecting"
      ? mock
        ? "Loading"
        : "Connecting"
      : state === "error"
        ? "Error"
        : mock
          ? "Idle"
          : "Disconnected";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatusPill
        tone={connected ? (mock ? "accent" : "battery") : state === "error" ? "danger" : "neutral"}
        dot
      >
        {label}
      </StatusPill>
      <StatusPill tone={mode === "mock" ? "warning" : "accent"}>
        {mode === "mock" ? "Mock" : "Live"}
      </StatusPill>
      {detail ? (
        <span className="max-w-[22rem] truncate text-xs text-muted-foreground">{detail}</span>
      ) : null}

      <div className="ml-auto flex gap-2">
        {mode === "live" ? (
          <Button size="sm" onClick={onConnect} disabled={connected || state === "connecting"}>
            Connect
          </Button>
        ) : null}
        <Button size="sm" variant="outline" onClick={onDisconnect} disabled={!connected}>
          Disconnect
        </Button>
      </div>
    </div>
  );
}
