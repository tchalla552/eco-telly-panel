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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatusPill
        tone={connected ? "battery" : state === "error" ? "danger" : "neutral"}
        dot
      >
        {connected
          ? "Connected"
          : state === "connecting"
            ? "Connecting"
            : state === "error"
              ? "Error"
              : "Disconnected"}
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
