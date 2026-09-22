# CodeVibe

A desktop music vibe visualizer for coding, lofi, and ambiance sessions. Runs cross-platform (Windows, macOS, Linux) as an Electron app.

## Features

- **Local music playback** — add individual files or a whole folder (mp3, wav, flac, ogg, m4a, aac, opus) and play them with a real audio-reactive visualizer (bars / wave / particles / Matrix rain), driven by the Web Audio API.
- **Streaming links** — paste a YouTube, Spotify, or SoundCloud link and it loads in an embedded player alongside an ambient visualizer.
- **Clock overlay** — a draggable on-screen clock with 12h/24h format and optional seconds, positioned anywhere on the stage.
- **Themes** — fourteen built-in presets (Lofi Sunset, Ambient Forest, Synthwave, Midnight Focus, Codefi Neon, Rainy Night, Matrix, Cyberpunk, Retro Cyberpunk, Retro Games, Sleek, Minimalist, VibeCoding, Retro Hacker) plus custom accent and background color pickers.
- **Background modes** — switch between **Dynamic Theme** (the animated gradient/visualizer background) and **Wallpaper** (a custom image of your choice, with Cover/Contain/Tile fit, adjustable dim and blur, and an option to overlay the visualizer on top).
- Settings (theme, colors, visualizer style, background mode, wallpaper, clock preferences, playlist, streaming history) persist between launches.

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

Requires [electron-builder](https://www.electron.build/); build on (or cross-compile from) the target platform for best results.

## Notes on streaming

CodeVibe does not proxy or download audio from third-party platforms — it embeds their official web players (YouTube/Spotify/SoundCloud iframes), so playback follows each platform's own terms of service and requires an active account/subscription where applicable. The full audio-reactive visualizer (frequency bars, waveform, reactive particles) is only available for local files, since embedded players don't expose raw audio data to the host page; streaming mode shows an ambient animation instead.
