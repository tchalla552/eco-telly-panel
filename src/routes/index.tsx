import { createFileRoute } from "@tanstack/react-router";
import { useTelemetry } from "@/hooks/useTelemetry";
import { ConnectionBar } from "@/components/dashboard/ConnectionBar";
import { Metric, Panel, Row } from "@/components/dashboard/Panel";
import { StatusPill, chargeTone } from "@/components/dashboard/StatusPill";
import { TrendChart } from "@/components/dashboard/TrendChart";

const CONTROLLER_TEMP_WARN_F = 130;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "P1 Solar Monitor — PQ2430 / ML2430 Controller" },
      {
        name: "description",
        content:
          "Live Bluetooth dashboard for a Power Queen PQ2430 / ML2430 MPPT solar charge controller: PV power, battery voltage, charge stage and daily yield.",
      },
      { property: "og:title", content: "P1 Solar Monitor — PQ2430 / ML2430" },
      {
        property: "og:description",
        content:
          "Browser-to-Bluetooth monitoring for a PQ2430 / ML2430 MPPT charge controller in a mobile power system.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { mode, state, detail, telemetry, history, connect, disconnect } = useTelemetry();

  const t = telemetry;
  const chargingStatus = t?.charging_status ?? "—";
  const charging = (t?.battery_current ?? 0) > 0.05;
  const tempWarn = (t?.controller_temperature ?? 0) > CONTROLLER_TEMP_WARN_F;
  const num = (v: number | undefined, d = 1) => (v === undefined ? "—" : v.toFixed(d));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">P1 Solar Monitor</h1>
            <p className="readout text-xs text-muted-foreground">
              {t?.model ?? "ML2430"} · BT-TH-XXXXXXXX · LiFePO₄
            </p>
          </div>
          <ConnectionBar
            mode={mode}
            state={state}
            detail={detail}
            onConnect={connect}
            onDisconnect={disconnect}
          />
        </div>
      </header>

      {/* Top summary */}
      <section className="panel mb-4 grid grid-cols-2 gap-5 p-4 sm:p-6 lg:grid-cols-5">
        <div className="col-span-2 lg:col-span-1">
          <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            Solar power now
          </div>
          <div className="readout mt-1 flex items-baseline gap-1.5 text-solar">
            <span className="text-4xl sm:text-5xl">{t ? t.pv_power : "—"}</span>
            <span className="text-sm text-muted-foreground">W</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <StatusPill tone={chargeTone(chargingStatus)}>{chargingStatus}</StatusPill>
            <StatusPill tone={charging ? "battery" : "neutral"} dot>
              {charging ? "Charging" : "Idle"}
            </StatusPill>
          </div>
        </div>
        <Metric label="Battery voltage" value={num(t?.battery_voltage, 2)} unit="V" tone="battery" />
        <Metric
          label="Charge current"
          value={num(t?.battery_current, 2)}
          unit="A"
          tone="battery"
          hint={t ? `${t.charging_amp_hours_today} Ah today` : undefined}
        />
        <Metric
          label="Generated today"
          value={t ? String(t.power_generation_today) : "—"}
          unit="Wh"
          tone="solar"
        />
        <Metric
          label="Reported SOC"
          value={t ? String(t.battery_percentage) : "—"}
          unit="%"
          hint="Estimate only"
        />
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel
          title="Solar array"
          meta={<StatusPill tone="solar">{num(t?.pv_voltage, 1)} V</StatusPill>}
        >
          <div className="mb-4 grid grid-cols-3 gap-4">
            <Metric label="PV power" value={t ? String(t.pv_power) : "—"} unit="W" tone="solar" />
            <Metric label="PV voltage" value={num(t?.pv_voltage, 1)} unit="V" />
            <Metric label="PV current" value={num(t?.pv_current, 2)} unit="A" />
          </div>
          <TrendChart data={history} dataKey="pv_power" unit="W" decimals={0} />
          <div className="mt-3">
            <Row label="Generation today" value={`${t?.power_generation_today ?? "—"} Wh`} />
            <Row label="Max charging power today" value={`${t?.max_charging_power_today ?? "—"} W`} />
            <Row label="Lifetime generation" value={`${t?.power_generation_total ?? "—"} Wh`} />
          </div>
        </Panel>

        <Panel
          title="Battery"
          meta={<StatusPill tone={chargeTone(chargingStatus)}>{chargingStatus}</StatusPill>}
        >
          <div className="mb-4 grid grid-cols-3 gap-4">
            <Metric
              label="Voltage"
              value={num(t?.battery_voltage, 2)}
              unit="V"
              tone="battery"
            />
            <Metric label="Current" value={num(t?.battery_current, 2)} unit="A" tone="battery" />
            <Metric label="Temp" value={num(t?.battery_temperature, 1)} unit="°F" />
          </div>
          <TrendChart
            data={history}
            dataKey="battery_voltage"
            unit="V"
            decimals={2}
            domain={["auto", "auto"]}
          />
          <div className="mt-2">
            <TrendChart data={history} dataKey="battery_current" unit="A" decimals={2} height={120} />
          </div>
          <div className="mt-3">
            <Row label="Reported SOC" value={`${t?.battery_percentage ?? "—"} %`} />
            <Row label="Chemistry" value={t?.battery_type ?? "—"} />
            <Row
              label="Float reached"
              value={chargingStatus === "floating" ? "Yes" : "Not yet"}
            />
          </div>
        </Panel>

        <Panel
          title="Controller"
          meta={
            tempWarn ? (
              <StatusPill tone="warning">Running hot</StatusPill>
            ) : (
              <StatusPill tone="neutral">Nominal</StatusPill>
            )
          }
          className="lg:col-span-2"
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric
              label="Controller temp"
              value={num(t?.controller_temperature, 1)}
              unit="°F"
              tone={tempWarn ? "warning" : "default"}
              hint={`Warn above ${CONTROLLER_TEMP_WARN_F} °F`}
            />
            <Metric label="Load power" value={t ? String(t.load_power) : "—"} unit="W" />
            <div>
              <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                Load status
              </div>
              <div className="mt-2">
                <StatusPill tone={t?.load_status === "on" ? "accent" : "neutral"} dot>
                  {t?.load_status ?? "—"}
                </StatusPill>
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                Device
              </div>
              <div className="readout mt-1 text-sm">
                {t?.model ?? "ML2430"} · id {t?.device_id ?? "—"}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {mode === "mock" ? "Fixture replay" : "Web Bluetooth (BT-1)"}
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <footer className="mt-6 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span>
          {t?.timestamp
            ? `Last poll ${new Date(t.timestamp).toLocaleTimeString()}`
            : "No telemetry yet"}
        </span>
        {mode === "mock" ? <span>· simulated data (?mock=1)</span> : null}
      </footer>
    </main>
  );
}
