# Xenon Edge Widget

A polished, self-contained dashboard widget for **Corsair iCUE / Xeneon Edge** (or any browser / iframe host) on **Windows**.
Everything runs locally — there is no cloud, no telemetry, no account.

![platform](https://img.shields.io/badge/platform-Windows%2010%2F11-0078D6)
![node](https://img.shields.io/badge/node-%E2%89%A5%2018.15-brightgreen)
![license](https://img.shields.io/badge/license-MIT-blue)

## What you get

- **Media** — Spotify / YouTube / any SMTC-aware app: title, artist, artwork, play / pause / next / previous.
- **Microphone** — one-click mute / unmute, live mic level, change default device.
- **Audio** — output device picker, volume slider, mute toggle.
- **System** — CPU, GPU, RAM, disks, temperatures, uptime, hostname.
- **Network** — ping, jitter, live download / upload bandwidth.
- **Windows / apps** — list and focus open windows, launch favorites.
- **Calendar** — quick events with desktop reminders.
- **Notes** — auto-saving scratchpad.
- **Bilingual UI** — Italian / English, switchable on the fly.
- **Single-file frontend** — every panel lives in `widget.html` and can be embedded individually via `?panel=...`.

## Install — for everyone

### Step 1 — Run the installer (once)

1. Download the ZIP from **[Releases](https://github.com/marcimastro98/XenonEdgeWidget/releases/latest)** and extract it anywhere.
2. Open the extracted folder.
3. Double-click **`INSTALL.bat`**.
4. If Windows asks for permission to install Node.js, click **Yes**.

The installer will automatically:
- install **Node.js LTS** if it is not already on your PC;
- register the widget server to **start with Windows** (no terminal, no tray icon — fully silent);
- start the server right now in the background;
- open `http://127.0.0.1:3030/` in your browser so you can confirm it works.

### Step 2 — Add the widget in Corsair iCUE (once)

1. Open **Corsair iCUE**.
2. Go to your Xenon Edge dashboard and add an **iFrame** widget.
3. Paste one of the URLs from the table below and save.

That's the only time you ever need to touch anything.

### Every time you start your PC after that

> **Nothing.** The server starts silently in the background with Windows, and iCUE remembers your widget layout. The widget is live before you even open iCUE.

To remove the startup entry, double-click **`UNINSTALL.bat`**.

## Requirements

- Windows 10 or 11 (x64).
- [Node.js 18.15 or newer](https://nodejs.org/).
- *(Optional)* [LibreHardwareMonitor](https://github.com/LibreHardwareMonitor/LibreHardwareMonitor) running in the background if you want CPU temperatures (the widget falls back gracefully when it is missing).
- *(Optional)* `nvidia-smi` is auto-detected for NVIDIA GPU usage / temperature.

The bundled [`SoundVolumeView`](https://www.nirsoft.net/utils/sound_volume_view.html) by NirSoft handles audio device control and is shipped unmodified under its freeware license.

## Developer quick start

```powershell
git clone https://github.com/marcimastro98/XenonEdgeWidget.git
cd XenonEdgeWidget
npm start
```

Then open <http://127.0.0.1:3030/> in any browser, or paste the same URL into a Corsair iCUE **iFrame** widget.

You can also double-click `INSTALL.bat` for the full user-friendly setup, or `files/start.bat` if Node.js is already installed and you only want to start the server manually.

> The server listens **only** on `127.0.0.1:3030` and rejects requests whose `Host` header is not loopback, to prevent DNS-rebinding / CSRF abuse from public websites.

## Embedding individual panels

The same `widget.html` serves every panel; pick one with `?panel=`:

| Panel | URL |
|---|---|
| Full dashboard | `http://127.0.0.1:3030/` |
| Media (Spotify / YouTube / Calendar) | `http://127.0.0.1:3030/?panel=media` |
| Microphone | `http://127.0.0.1:3030/?panel=mic` |
| Notes | `http://127.0.0.1:3030/?panel=notes` |
| System (CPU / GPU / RAM / Disks) | `http://127.0.0.1:3030/?panel=system` |
| Audio devices & volume | `http://127.0.0.1:3030/?panel=audio` |

Inside an `<iframe>`:

```html
<iframe src="http://127.0.0.1:3030/?panel=mic" width="100%" height="100%" frameborder="0"></iframe>
```

In Corsair iCUE, drop the **iFrame** widget on your dashboard and paste the URL (size **XL** is recommended for the full panel).

## HTTP API (loopback only)

| Method | Endpoint | Purpose |
|---|---|---|
| `GET`  | `/` | Serve the widget HTML. |
| `GET`  | `/status` | Mic mute state. |
| `POST` | `/toggle` | Toggle mic mute. |
| `GET`  | `/audio` | Audio devices, default speaker / mic, volumes. |
| `POST` | `/volume/set` | `{ level: 0–100 }` set speaker volume. |
| `POST` | `/mic/volume` | `{ level: 0–100 }` set mic volume. |
| `POST` | `/speaker/set` | `{ id }` change default speaker. |
| `POST` | `/mic/set` | `{ id }` change default mic. |
| `POST` | `/speaker/mute` | Toggle speaker mute. |
| `GET`  | `/media` | Currently playing track. |
| `POST` | `/media/playpause`, `/media/next`, `/media/previous` | Transport. |
| `GET`  | `/system` | CPU, GPU, RAM, disks, temps. |
| `GET`  | `/network` | Ping, latency, bandwidth. |
| `GET`  | `/windows` | List visible top-level windows. |
| `POST` | `/windows/focus` | `{ id }` bring a window to the foreground. |
| `GET` / `POST` | `/notes` | Read / save the notepad. |
| `GET` / `POST` | `/events` | Read / save calendar events. |
| `POST` | `/lock` | Lock the workstation. |
| `POST` | `/shortcut` | `{ keys }` send a whitelisted SendKeys macro. |

## File layout

```
XenonEdgeWidget/
├── INSTALL.bat        ← One-click installer for normal users
├── UNINSTALL.bat      ← Removes startup entry and stops the server
├── package.json
├── README.md
├── LICENSE
└── files/
    ├── server.js          ← Node.js server (port 3030)
    ├── widget.html        ← Full UI (HTML + CSS + JS)
    ├── start.bat          ← Double-click launcher
    ├── start-hidden.vbs   ← Hidden startup launcher
    ├── install.ps1        ← Installer logic
    ├── uninstall.ps1      ← Uninstaller logic
    ├── media.ps1          ← Now-playing via Windows SMTC
    ├── gpu.ps1            ← GPU usage / temperature (NVIDIA + perf counters)
    ├── network.ps1        ← Ping + adapter byte counters
    ├── windows.ps1        ← Window enumeration / focus
    ├── notes.txt          ← Notes (auto-created)
    ├── events.json        ← Calendar (auto-created)
    └── soundvolumeview-x64/
        └── SoundVolumeView.exe   ← Audio device control (NirSoft, freeware)
```

## Security notes

- The server binds to `127.0.0.1` only and validates the `Host` and `Origin` headers — public websites cannot reach it via DNS rebinding.
- No CORS wildcards: everything is same-origin.
- Inputs to `/windows/focus`, `/shortcut`, `/notes`, `/events` are validated and capped.
- Bundled `SoundVolumeView.exe` is unmodified; you may verify it against [NirSoft's official download](https://www.nirsoft.net/utils/sound_volume_view.html).

## Troubleshooting

- **`node` not recognised** — install Node.js 18+ and reopen your terminal.
- **Port 3030 already in use** — close any other widget instance, or change the port in `files/server.js`.
- **No CPU temperature** — install LibreHardwareMonitor and keep it running in the background.
- **Mic mute does nothing on first launch** — wait one or two seconds: the device cache is populated right after startup.

## License

[MIT](LICENSE). Includes [SoundVolumeView](https://www.nirsoft.net/utils/sound_volume_view.html) © Nir Sofer (freeware, redistributed unmodified).
