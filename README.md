# CodeVibe

A desktop music vibe visualizer for coding, lofi, and ambiance sessions — local files or streaming links, an audio-reactive visualizer, a clock overlay, and fourteen themes. Built with Electron; runs on Windows, macOS, and Linux.

[![Release](https://github.com/Installation-04/codevibe/actions/workflows/release.yml/badge.svg)](https://github.com/Installation-04/codevibe/actions/workflows/release.yml)

## Screenshots

| Ambient (Lofi Sunset) | Matrix Rain | Custom wallpaper (Cyberpunk) |
| --- | --- | --- |
| ![Lofi Sunset theme with the ambient particle visualizer](docs/screenshots/lofi-home.png) | ![Matrix theme with the Matrix Rain visualizer and the full theme picker](docs/screenshots/matrix-theme.png) | ![Cyberpunk theme with a custom wallpaper background and the particle visualizer overlaid](docs/screenshots/wallpaper-cyberpunk.png) |

## Features

- **Local music playback** — add individual files or a whole folder (mp3, wav, flac, ogg, m4a, aac, opus) and play them with a real audio-reactive visualizer (Bars / Wave / Particles / Matrix Rain), driven by the Web Audio API.
- **Streaming links** — paste a YouTube, Spotify, or SoundCloud link and it loads in an embedded player alongside an ambient visualizer.
- **Clock overlay** — a draggable on-screen clock with 12h/24h format and optional seconds, positioned anywhere on the stage.
- **14 themes** — Lofi Sunset, Ambient Forest, Synthwave, Midnight Focus, Codefi Neon, Rainy Night, Matrix, Cyberpunk, Retro Cyberpunk, Retro Games, Sleek, Minimalist, VibeCoding, Retro Hacker — plus custom accent and background color pickers.
- **Background modes** — **Dynamic Theme** (the animated gradient/visualizer background) or **Wallpaper** (any image of your choice, with Cover/Contain/Tile fit, adjustable dim and blur, and an option to overlay the visualizer on top).
- **Versioning & auto-update** — the current version is shown in the sidebar; packaged builds check GitHub Releases on startup via `electron-updater` and offer an in-app download-and-restart when a newer one is found.
- Every setting (theme, colors, visualizer style, background mode, wallpaper, clock preferences, playlist, streaming history) persists between launches.

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

Pushing a version tag (e.g. `v1.1.0`, matching `package.json`'s `version`) triggers [`.github/workflows/release.yml`](.github/workflows/release.yml), which builds Windows, macOS, and Linux in parallel on their native runners and publishes every installer — including a real macOS `.dmg` — plus the `electron-updater` metadata (`latest.yml`, `latest-mac.yml`, `latest-linux.yml`) to a GitHub Release matching the tag:

```bash
git tag v1.1.0
git push origin v1.1.0
```

You can also trigger it manually from the Actions tab (`workflow_dispatch`), or build and publish a single platform locally:

```bash
GH_TOKEN=<a token with repo scope> npm run dist:win -- --publish always     # Windows, from Windows (or Linux/macOS + Wine)
GH_TOKEN=<a token with repo scope> npm run dist:mac -- --publish always     # macOS, from macOS only
GH_TOKEN=<a token with repo scope> npm run dist:linux -- --publish always  # Linux
```

## Notes on streaming

CodeVibe doesn't proxy or download audio from third-party platforms — it embeds their official web players (YouTube/Spotify/SoundCloud iframes), so playback follows each platform's own terms of service and requires an active account/subscription where applicable. The full audio-reactive visualizer is only available for local files, since embedded players don't expose raw audio data to the host page; streaming mode shows an ambient animation instead.
