# CodeVibe

A desktop music vibe visualizer for coding, lofi, and ambiance sessions — local files or streaming links, an audio-reactive visualizer, a clock overlay, and fourteen themes. Built with Electron; runs on Windows, macOS, and Linux.

[![Release](https://github.com/Installation-04/codevibe/actions/workflows/release.yml/badge.svg)](https://github.com/Installation-04/codevibe/actions/workflows/release.yml)

## Screenshots

| Ambient (Lofi Sunset) | Matrix Rain | Custom wallpaper (Cyberpunk) |
| --- | --- | --- |
| ![Lofi Sunset theme with the ambient particle visualizer](docs/screenshots/lofi-home.png) | ![Matrix theme with the Matrix Rain visualizer and the full theme picker](docs/screenshots/matrix-theme.png) | ![Cyberpunk theme with a custom wallpaper background and the particle visualizer overlaid](docs/screenshots/wallpaper-cyberpunk.png) |

## Download

Grab the latest build for your OS from the [**Releases page**](https://github.com/Installation-04/codevibe/releases/latest):

| Platform | File to download | Notes |
| --- | --- | --- |
| 🪟 Windows | **`CodeVibe-Setup-<version>.exe`** | Standard installer — adds a Start Menu entry and auto-updates in place. Recommended for most people. |
| 🪟 Windows (no install) | `CodeVibe-<version>.exe` | Portable build — runs directly, no installer, nothing written outside its own folder. |
| 🍎 macOS (Apple Silicon) | **`CodeVibe-<version>-arm64.dmg`** | For M1/M2/M3/M4 Macs. Open the `.dmg` and drag CodeVibe into Applications. |
| 🍎 macOS (alternative) | `CodeVibe-<version>-arm64-mac.zip` | Same Apple Silicon build as a plain `.zip`, if you'd rather not mount a `.dmg`. |
| 🐧 Linux (most distros) | **`CodeVibe-<version>.AppImage`** | Portable — `chmod +x` it and run, no installation or package manager needed. |
| 🐧 Linux (Debian/Ubuntu) | `codevibe_<version>_amd64.deb` | Installs via `sudo apt install ./codevibe_<version>_amd64.deb` and integrates with your app menu. |

Only Apple Silicon macOS builds are published right now — Intel Mac support would need an `x64`/universal target added to the mac build. Once installed, CodeVibe checks for new releases on startup and offers an in-app update.

### macOS: "malicious software" / unverified developer warning

macOS Gatekeeper will warn about **any** app that isn't signed with a paid Apple Developer certificate and notarized by Apple — this build currently isn't, so the warning is expected and doesn't mean the app is actually malicious. To open it anyway:

1. Try double-clicking CodeVibe once (it'll refuse and show the warning) — this registers it with Gatekeeper.
2. Open **System Settings → Privacy & Security**, scroll down to the Security section, and click **Open Anyway** next to the CodeVibe message.
3. Confirm **Open** in the dialog that appears. You only need to do this once per download.

Alternatively, from Terminal, clear the quarantine flag before first launch:

```bash
xattr -cr /Applications/CodeVibe.app
```

## Features

- **Local music playback** — add individual files or a whole folder (mp3, wav, flac, ogg, m4a, aac, opus) and play them with a real audio-reactive visualizer, driven by the Web Audio API.
- **6 visualizer styles** — Bars, Wave, Particles, Matrix Rain, Radial Bars, and Kaleidoscope.
- **Streaming links** — paste a YouTube, Spotify, or SoundCloud link and it plays in an embedded browser view alongside an ambient visualizer, with a one-click "Open in Browser Instead" fallback if a link can't be embedded (e.g. embedding disabled by the uploader).
- **Jellyfin and Plex** — connect to your own media server (Jellyfin: server address + username/password; Plex: sign in through plex.tv, then point it at your server) and browse and play your library directly.
- **Clock overlay** — draggable, with 12h/24h format, optional seconds, 5 styles (Digital, Minimal, Boxed, Neon, Analog), 5 font families, and an adjustable size.
- **14 themes** — Lofi Sunset, Ambient Forest, Synthwave, Midnight Focus, Codefi Neon, Rainy Night, Matrix, Cyberpunk, Retro Cyberpunk, Retro Games, Sleek, Minimalist, VibeCoding, Retro Hacker — plus a quick-pick accent color palette and full custom accent/background color pickers.
- **Background modes** — **Dynamic Theme** (animated gradient/visualizer, with Gradient/Grid/Vignette/Noise background patterns) or **Wallpaper** (any image of your choice, with Cover/Contain/Tile fit, adjustable dim and blur, and an option to overlay the visualizer on top).
- **Panel appearance** — adjustable blur and opacity for the glass-style sidebar and transport bar.
- **Versioning & auto-update** — the current version is shown in the sidebar; packaged builds check GitHub Releases on startup via `electron-updater` and offer an in-app download-and-restart when a newer one is found.
- Every setting (theme, colors, visualizer style, clock style/font/size, background mode/pattern, wallpaper, panel appearance, playlist, streaming history) persists between launches.

## Getting started

```bash
npm install
npm start
```

## Building installers

```bash
npm run dist:win     # Windows (nsis + portable)
npm run dist:mac     # macOS (dmg + zip)
npm run dist:linux   # Linux (AppImage + deb)
```

Requires [electron-builder](https://www.electron.build/); build on (or cross-compile from) the target platform for best results — a `.dmg` in particular can only be built on macOS.

## Releasing

Pushing a version tag (e.g. `v1.1.1`, matching `package.json`'s `version`) triggers [`.github/workflows/release.yml`](.github/workflows/release.yml), which builds Windows, macOS, and Linux in parallel on their native runners and publishes every installer — including a real macOS `.dmg` — plus the `electron-updater` metadata (`latest.yml`, `latest-mac.yml`, `latest-linux.yml`) to a GitHub Release matching the tag:

```bash
git tag v1.1.1
git push origin v1.1.1
```

You can also trigger it manually from the Actions tab (`workflow_dispatch`), or build and publish a single platform locally:

```bash
GH_TOKEN=<a token with repo scope> npm run dist:win -- --publish always     # Windows, from Windows (or Linux/macOS + Wine)
GH_TOKEN=<a token with repo scope> npm run dist:mac -- --publish always     # macOS, from macOS only
GH_TOKEN=<a token with repo scope> npm run dist:linux -- --publish always  # Linux
```

## Connecting Jellyfin / Plex

- **Jellyfin**: open the Jellyfin tab, enter your server's address (e.g. `http://192.168.1.10:8096`) plus your username and password, and click Connect. Your library loads automatically.
- **Plex**: open the Plex tab and click "Connect with Plex" — this opens plex.tv in your browser to sign in (no Plex developer account needed, the same PIN-based flow Plex's own apps use). Once signed in, enter your Plex Media Server's local address (e.g. `http://192.168.1.10:32400`) so CodeVibe knows where to fetch your library from.
- Both connect directly from the app to your server — nothing is proxied through a third party. Credentials and tokens are stored locally the same way as your other settings.
- Tracks played from either service skip the Web Audio analyser (so the visualizer falls back to its ambient animation for these, same as streaming links) — this is deliberate: requiring CORS mode for the audio element would make playback fail outright on servers that don't send `Access-Control-Allow-Origin` headers, and reliable playback matters more than a reactive visualizer here.
- This integration talks to the standard Jellyfin and Plex HTTP APIs directly from the renderer and hasn't been exercised against a live server in this environment (no such server was available) — the connect/browse/play flow was verified end-to-end against mocked API responses. Please report any issues connecting to a real server.

## Notes on streaming

CodeVibe doesn't proxy or download audio from third-party platforms — it embeds their official web players (YouTube/Spotify/SoundCloud) in an isolated browser view, so playback follows each platform's own terms of service and requires an active account/subscription where applicable. The full audio-reactive visualizer is only available for local files, since embedded players don't expose raw audio data to the host page; streaming mode shows an ambient animation instead. If a specific link won't embed (the uploader disabled embedding, or it's region-locked), CodeVibe shows an inline message and an "Open in Browser Instead" button.
