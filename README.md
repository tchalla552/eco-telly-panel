# Eco Telly Panel

Eco Telly Panel is a responsive, browser-based dashboard for monitoring a Power Queen PQ2430 / ML2430 solar charge controller through a compatible BT-TH Bluetooth module. It connects directly from the browser using Web Bluetooth: no backend, cloud service, database, MQTT broker, or Raspberry Pi is required.

The dashboard reports live solar, battery, controller, load, temperature, charging-stage, and energy-generation telemetry. A fixture-backed mock mode supports development away from the controller.

## Browser support

Live mode requires a browser and platform with Web Bluetooth support. Use a Chromium-based browser that exposes `navigator.bluetooth`. Bluetooth access must be initiated through the dashboard's **Connect** button and requires a secure context.

Mock mode does not require Bluetooth and can be used in any modern browser.

## Architecture

```text
BT-TH module ──> BluetoothSource ──┐
                                   ├──> normalized Telemetry ──> dashboard
JSON fixture ──> MockSource ───────┘
```

Bluetooth protocol handling is isolated in `src/services/bluetoothSource.ts`. UI components consume only the normalized model defined in `src/types/telemetry.ts`.

## Getting started

Requirements:

- Node.js 20 or newer
- npm

```sh
git clone https://github.com/tchalla552/eco-telly-panel.git
cd eco-telly-panel
npm install
npm run dev
```

Open the URL printed by Vite. Live Bluetooth discovery only begins after selecting **Connect**.

## Mock mode

Append `?mock=1` to the development URL:

```text
http://localhost:8080/?mock=1
```

Mock mode replays `src/services/fixtures/telemetry-fixture.json`, performs no Bluetooth discovery, and is visibly identified in the dashboard.

## HTTPS development on a LAN

Web Bluetooth requires a secure context when the dashboard is opened from another device. The Vite configuration supports locally trusted certificates at:

```text
.cert/cert.pem
.cert/key.pem
```

One option is to generate them with [mkcert](https://github.com/FiloSottile/mkcert):

```sh
mkcert -install
mkdir -p .cert
mkcert -cert-file .cert/cert.pem -key-file .cert/key.pem localhost 127.0.0.1 <LAN-IP>
npm run dev
```

Install and trust the mkcert root CA on the phone or tablet used for testing, then open the HTTPS network URL printed by Vite. Certificate files and local environment files are ignored by Git and must never be committed.

## Commands

```sh
npm run dev       # Start the development server
npm run build     # Create a production build
npm run preview   # Preview a production build locally
npm run lint      # Run ESLint
```

## Supported telemetry

The live source currently reads:

- PV voltage, current, power, daily generation, total generation, and daily peak power
- Battery voltage, charging current, reported state of charge, temperature, and configured chemistry
- Controller temperature and charging stage
- Load state, voltage, current, and power

Charging stages include deactivated, activated, MPPT, equalizing, boost, floating, and current limiting.

## Privacy and security

- Bluetooth device selection remains local to the browser.
- The application does not transmit telemetry to a backend or cloud service.
- Do not commit development certificates, private keys, environment files, or real device identifiers.
- Mock telemetry is synthetic and contains no device identity or location data.

Previously recorded Bluetooth module identifiers have been retroactively obfuscated throughout
the repository history before public release.

## Project tooling

This project uses React, TypeScript, TanStack Start, Vite, Tailwind CSS, and Recharts. It remains connected to [Lovable](https://lovable.dev); commits pushed to the connected branch may synchronize back to the Lovable editor.

## License

Licensed under the [MIT License](LICENSE). Copyright (c) 2026 Neil Chapman.
