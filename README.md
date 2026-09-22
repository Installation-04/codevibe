# CodeVibe

A desktop music vibe visualizer for coding, lofi, and ambiance sessions. Runs cross-platform (Windows, macOS, Linux) as an Electron app.

## Features

- **Local music playback** — add individual files or a whole folder (mp3, wav, flac, ogg, m4a, aac, opus) and play them with a real audio-reactive visualizer (bars / wave / particles / Matrix rain), driven by the Web Audio API.
- **Streaming links** — paste a YouTube, Spotify, or SoundCloud link and it loads in an embedded player alongside an ambient visualizer.
- **Clock overlay** — a draggable on-screen clock with 12h/24h format and optional seconds, positioned anywhere on the stage.
- **Themes** — fourteen built-in presets (Lofi Sunset, Ambient Forest, Synthwave, Midnight Focus, Codefi Neon, Rainy Night, Matrix, Cyberpunk, Retro Cyberpunk, Retro Games, Sleek, Minimalist, VibeCoding, Retro Hacker) plus custom accent and background color pickers.
- **Background modes** — switch between **Dynamic Theme** (the animated gradient/visualizer background) and **Wallpaper** (a custom image of your choice, with Cover/Contain/Tile fit, adjustable dim and blur, and an option to overlay the visualizer on top).
- Settings (theme, colors, visualizer style, background mode, wallpaper, clock preferences, playlist, streaming history) persist between launches.
- **Versioning & auto-update** — the current version is shown in the sidebar, and packaged builds check GitHub Releases on startup via `electron-updater`; when a newer release is found, an in-app banner lets you download and install it without leaving the app (only active in packaged builds, not `npm start`).

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

Requires [electron-builder](https://www.electron.build/); build on (or cross-compile from) the target platform for best results — in particular, a `.dmg` can only be built on macOS.

## Releasing

Pushing a version tag (e.g. `v1.1.0`, matching the `version` field in `package.json`) triggers [`.github/workflows/release.yml`](.github/workflows/release.yml), which builds Windows, macOS, and Linux in parallel on their native runners and publishes every installer — including the macOS `.dmg`, which can only be built on an actual Mac — plus the `electron-updater` metadata (`latest.yml`, `latest-mac.yml`, `latest-linux.yml`) to a GitHub Release matching the tag:

```bash
git tag v1.1.0
git push origin v1.1.0
```

You can also trigger it manually from the Actions tab (`workflow_dispatch`). To build and publish a single platform locally instead:

```bash
GH_TOKEN=<a token with repo scope> npm run dist:win -- --publish always     # Windows, from Windows (or Linux/macOS + Wine)
GH_TOKEN=<a token with repo scope> npm run dist:mac -- --publish always     # macOS, from macOS only
GH_TOKEN=<a token with repo scope> npm run dist:linux -- --publish always  # Linux
```

## Notes on streaming

CodeVibe does not proxy or download audio from third-party platforms — it embeds their official web players (YouTube/Spotify/SoundCloud iframes), so playback follows each platform's own terms of service and requires an active account/subscription where applicable. The full audio-reactive visualizer (frequency bars, waveform, reactive particles) is only available for local files, since embedded players don't expose raw audio data to the host page; streaming mode shows an ambient animation instead.
