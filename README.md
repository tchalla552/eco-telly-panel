# Solar Charge Monitor

Build a polished, responsive web dashboard for monitoring a legacy Power Queen PQ2430 / ML2430 MPPT solar charge controller over Bluetooth.

Context

I have an older Power Queen PQ2430 solar charge controller installed in a mobile camping/truck-bed power system called P1.

The controller is internally identified as:

Model: ML2430

External Bluetooth module: BT-TH-XXXXXXXX

Bluetooth interface: older BT-1 style module

Controller communication: RS232 over RJ12

Battery chemistry: LiFePO4

The original Power Queen mobile app no longer communicates correctly with this older controller, but I have confirmed that the hardware works.

I successfully read live controller telemetry using the open-source renogy-bt project, and I also confirmed that the browser-based web-bt1-monitor project can connect to the controller directly using the browser Web Bluetooth API.

The goal is to build a better-looking, more informative replacement dashboard while preserving the same direct browser-to-Bluetooth architecture.

Architecture requirements

The final application should remain entirely client-side.

Desired production architecture:

Chrome browser
    ↓
Web Bluetooth API
    ↓
BT-1 Bluetooth module
    ↓
PQ2430 / ML2430 charge controller

Do not assume a Raspberry Pi, backend server, cloud database, or API is required.

Use React + Vite for the application.

Structure the application so the dashboard is separated from the data source.

The UI should consume a normalized telemetry object regardless of whether data comes from:

mock JSON data during development, or

the live Bluetooth controller in production.

Conceptually:

Bluetooth adapter OR mock data
            ↓
     telemetry service
            ↓
 normalized telemetry object
            ↓
       React dashboard

Do not tightly couple UI components directly to Bluetooth calls.

Development mode

I often develop from an office that is physically out of Bluetooth range of the controller.

The project must therefore support a clear mock mode.

During development, use a local JSON file containing simulated controller polling data.

Allow mock mode to be enabled with a URL parameter such as:

?mock=1

In mock mode:

do not attempt Bluetooth discovery;

load the local JSON test fixture;

replay telemetry records automatically;

loop the fixture continuously;

update the dashboard as though live readings were arriving;

make the mock mode visually identifiable somewhere small and unobtrusive.

In live mode:

show a Connect button;

use Web Bluetooth;

allow the user to select a BT-TH-* device;

update dashboard values from live controller telemetry.

Current telemetry schema

The existing controller integration exposes data similar to:

{
  "model": "ML2430",
  "device_id": 1,
  "battery_percentage": 100,
  "battery_voltage": 13.5,
  "battery_current": 2.79,
  "battery_temperature": 77.0,
  "controller_temperature": 109.4,
  "load_status": "off",
  "load_voltage": 0.0,
  "load_current": 0.0,
  "load_power": 0,
  "pv_voltage": 17.8,
  "pv_current": 2.19,
  "pv_power": 39,
  "max_charging_power_today": 45,
  "max_discharging_power_today": 0,
  "charging_amp_hours_today": 5,
  "discharging_amp_hours_today": 0,
  "power_generation_today": 67,
  "power_consumption_today": 0,
  "power_generation_total": 261,
  "charging_status": "mppt",
  "battery_type": "lithium"
}

Charging states may include:

deactivated
activated
mppt
equalizing
boost
floating
current limiting

Dashboard priorities

This is for practical field use in a vehicle/camping power system.

The interface should answer these questions immediately:

How much solar power am I producing right now?

Is the battery charging?

What charging stage is the controller in?

What is the battery voltage?

How much current is going into the battery?

How much solar energy have I generated today?

Is the controller getting too hot?

How has solar production changed over the last several minutes?

Has the battery reached floating charge mode?

Dashboard layout

Create a clean, modern monitoring dashboard.

Top summary area

Prominently display:

Current solar power in watts

Battery voltage

Battery charging current

Charging mode

Solar generation today

Charging mode should be visually obvious.

Examples:

MPPT
BOOST
FLOATING

Do not make reported battery percentage the primary visual because the controller’s LiFePO4 state-of-charge estimate may not be precise.

Solar section

Show:

PV power

PV voltage

PV current

generation today

maximum charging power today

lifetime generation

Include a line chart for:

Solar power over time

The chart should show recent polling history.

Battery section

Show:

battery voltage

charging current

reported SOC

battery temperature

battery type

charging mode

Include a line chart for:

Battery voltage over time

If appropriate, also support battery charging current history.

Controller section

Show:

controller temperature

load status

load power

device model

connection status

Controller temperature should have a subtle warning treatment if it exceeds a configurable threshold.

Status treatment

Use status badges or pills for:

Connected / Disconnected

Mock / Live

MPPT

Boost

Floating

Current limiting

Make status clear without making the interface visually noisy.

Visual design

The dashboard should feel like a modern vehicle/energy system monitor, not a generic admin dashboard.

Desired characteristics:

clean

technical

restrained

highly legible

dark-mode friendly

responsive

usable on:

desktop monitor

MacBook

iPhone

tablet

Use a restrained visual hierarchy.

Avoid:

excessive gradients

neon cyberpunk styling

oversized decorative graphics

unnecessary animation

generic SaaS dashboard aesthetics

overly dense tables

Use charts only where they help understand trends.

Prefer cards, concise labels, status indicators, and line graphs.

Interaction

Provide:

Connect button

Disconnect button

clear connection status

auto-updating telemetry

mock/live mode indicator

In live mode, Bluetooth should only start after explicit user interaction because Web Bluetooth requires a user gesture.

Do not attempt Bluetooth access automatically on page load.

Code structure

Organize the code so these responsibilities remain separate:

components/
  dashboard cards
  charts
  status indicators

services/
  telemetry source
  Bluetooth source
  mock source

types/
  normalized telemetry schema

Use a single normalized telemetry model throughout the UI.

For example:

interface Telemetry {
  timestamp?: string;
  model: string;
  battery_percentage: number;
  battery_voltage: number;
  battery_current: number;
  battery_temperature: number;
  controller_temperature: number;
  load_status: string;
  load_power: number;
  pv_voltage: number;
  pv_current: number;
  pv_power: number;
  max_charging_power_today: number;
  charging_amp_hours_today: number;
  power_generation_today: number;
  power_generation_total: number;
  charging_status: string;
  battery_type: string;
}

Important constraint

Do not rewrite or invent the Bluetooth protocol yet.

For the first version:

build the React/Vite dashboard;

support mock JSON replay;

create a clean Bluetooth service abstraction/stub;

leave room to port the known-working Web Bluetooth logic from the existing web-bt1-monitor project afterward.

The immediate goal is a high-quality dashboard that works against mock data and is architecturally ready for the existing Bluetooth code.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/991c9aed-434a-4c9c-9a4f-8f2bb2644b4a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
