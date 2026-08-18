import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTelemetry } from "@/hooks/useTelemetry";
import { ConnectionBar } from "@/components/dashboard/ConnectionBar";
import { Metric, Panel, Row } from "@/components/dashboard/Panel";
import { ChargeStagePill, StatusPill } from "@/components/dashboard/StatusPill";
import {
  RangeSelector,
  SeriesSelector,
  TrendChart,
  sliceRange,
  type SeriesKey,
} from "@/components/dashboard/TrendChart";
import { THRESHOLDS, THRESHOLD_LABEL, levelFor } from "@/config/thresholds";
import { clockLabel, energyText, num } from "@/lib/format";
import { QUALITY_LABEL } from "@/types/telemetry";
import type { HistoryPoint, TimeRange } from "@/types/telemetry";

const SOC_HINT = QUALITY_LABEL["controller-estimated"];

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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function ChartBlock({
  history,
  options,
  height = 204,
}: {
  history: HistoryPoint[];
  options: SeriesKey[];
  height?: number;
}) {
  const [range, setRange] = useState<TimeRange>("15m");
  const [series, setSeries] = useState<SeriesKey>(options[0] as SeriesKey);
  const data = useMemo(() => sliceRange(history, range), [history, range]);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        {options.length > 1 ? (
          <SeriesSelector value={series} options={options} onChange={setSeries} />
        ) : (
          <span className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            Trend
          </span>
        )}
        <RangeSelector value={range} onChange={setRange} />
      </div>
      <TrendChart data={data} series={series} height={height} />
    </div>
  );
}

function Dashboard() {
  const { mode, state, detail, telemetry, history, connect, disconnect } = useTelemetry();

  const t = telemetry;
  const stage = t?.controller.charging_status;
  
  const ctrlLevel = levelFor(t?.controller.temperature_f, THRESHOLDS.controllerTemperatureF);
  const battLevel = levelFor(t?.battery.temperature_f, THRESHOLDS.batteryTemperatureF);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">P1 Solar Monitor</h1>
            <p className="readout text-xs text-muted-foreground">
              {t?.device.model ?? "ML2430"} · BT-TH-XXXXXXXX · {t?.battery.chemistry ?? "LiFePO₄"}
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

      {/* Top summary — what is the system doing right now? */}
      <section className="panel mb-4 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
          <div className="col-span-2 lg:col-span-1">
            <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
              Solar power now
            </div>
            <div className="readout mt-1 flex items-baseline gap-1.5 text-solar">
              <span className="text-4xl sm:text-5xl">{t ? t.solar.power_w : "—"}</span>
              <span className="text-sm text-muted-foreground">W</span>
            </div>
            <div className="mt-2">
              <ChargeStagePill status={stage} />
            </div>
          </div>
          <Metric
            label="Battery voltage"
            value={num(t?.battery.voltage_v, 2)}
            unit="V"
            tone="battery"
          />
          <Metric
            label="Charge current"
            value={num(t?.battery.charge_current_a, 2)}
            unit="A"
            tone="battery"
          />
        </div>

        {/* Secondary line: reported SOC stays deliberately understated. */}
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <span title={SOC_HINT}>
            Reported SOC{" "}
            <span className="readout text-foreground/80">
              {t?.battery.reported_soc_percent ?? "—"}%
            </span>
          </span>
          <span className="italic opacity-80">Estimate only</span>
        </div>

      </section>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel
          title="Solar array"
          meta={<StatusPill tone="solar">{num(t?.solar.voltage_v, 1)} V</StatusPill>}
        >
          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="hidden sm:block">
              <Metric
                label="PV power"
                value={t ? String(t.solar.power_w) : "—"}
                unit="W"
                tone="solar"
              />
            </div>
            <Metric label="PV voltage" value={num(t?.solar.voltage_v, 1)} unit="V" />
            <Metric label="PV current" value={num(t?.solar.current_a, 2)} unit="A" />
          </div>

          <ChartBlock history={history} options={["pv_power_w"]} />
          <div className="mt-3">
            <Row label="Generation today" value={energyText(t?.solar.generation_today_wh)} />
            <Row
              label="Max charging power today"
              value={`${t ? t.solar.max_power_today_w : "—"} W`}
            />
            <Row label="Lifetime generation" value={energyText(t?.solar.generation_total_wh)} />
          </div>
        </Panel>

        <Panel title="Battery" meta={<ChargeStagePill status={stage} />}>
          <div className="mb-4 grid grid-cols-3 gap-4">
            <Metric
              label="Voltage"
              value={num(t?.battery.voltage_v, 2)}
              unit="V"
              tone="battery"
            />
            <Metric
              label="Charge current"
              value={num(t?.battery.charge_current_a, 2)}
              unit="A"
              tone="battery"
            />
            <Metric
              label="Temp"
              value={num(t?.battery.temperature_f, 1)}
              unit="°F"
              tone={battLevel === "nominal" ? "default" : "warning"}
            />
          </div>
          <ChartBlock
            history={history}
            options={["battery_voltage_v", "battery_current_a"]}
          />
          <div className="mt-3">
            <Row
              label="Reported SOC"
              value={
                <span title={SOC_HINT}>
                  {t?.battery.reported_soc_percent ?? "—"} %
                  <span className="ml-1.5 text-[11px] font-normal italic text-muted-foreground">
                    est.
                  </span>
                </span>
              }
            />
            <Row label="Chemistry" value={t?.battery.chemistry ?? "—"} />
            <Row label="Charging mode" value={<ChargeStagePill status={stage} />} />
          </div>
        </Panel>

        <Panel
          title="Controller"
          meta={
            <StatusPill tone={ctrlLevel === "nominal" ? "neutral" : "warning"}>
              {THRESHOLD_LABEL[ctrlLevel]}
            </StatusPill>
          }
          className="lg:col-span-2"
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric
              label="Controller temp"
              value={num(t?.controller.temperature_f, 1)}
              unit="°F"
              tone={ctrlLevel === "nominal" ? "default" : "warning"}
              hint={`Warm above ${THRESHOLDS.controllerTemperatureF.elevated} °F`}
            />
            <Metric label="Load power" value={t ? String(t.load.power_w) : "—"} unit="W" />
            <div>
              <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                Load status
              </div>
              <div className="mt-2">
                <StatusPill tone={t?.load.status === "on" ? "accent" : "neutral"} dot>
                  {t?.load.status ?? "—"}
                </StatusPill>
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {num(t?.load.voltage_v, 1)} V · {num(t?.load.current_a, 2)} A
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                Device
              </div>
              <div className="readout mt-1 text-sm">{t?.device.model ?? "ML2430"}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {t?.device.bluetoothName ?? "BT-TH-XXXXXXXX"} ·{" "}
                {mode === "mock" ? "fixture replay" : "Web Bluetooth (BT-1)"}
              </div>
              <div className="mt-2">
                <StatusPill
                  tone={
                    state === "connected" ? "battery" : state === "error" ? "danger" : "neutral"
                  }
                  dot
                >
                  {state}
                </StatusPill>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <footer className="mt-6 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span>
          {t?.timestamp
            ? `Last poll ${clockLabel(new Date(t.timestamp).getTime())}`
            : "No telemetry yet"}
        </span>
        {mode === "mock" ? <span>· simulated data (?mock=1)</span> : null}
      </footer>
    </main>
  );
}
