# EchoSphere — XR Gallery

WebXR gallery for IPMD, Inc. Built with Three.js + Vite + TypeScript. Viewable in any browser, fully immersive in VR headsets.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173 — orbit with drag, scroll to zoom, click an artwork for details, use the VR button to enter immersive mode.

## Build

```bash
npm run build
```

## Adding an artwork

Open `src/data/artworks.json` and append an entry:

```json
{
  "id": "my-piece",
  "title": "MY PIECE",
  "artist": "Artist Name",
  "description": "A sentence about the piece.",
  "type": "artwork",
  "colors": [210, 270],
  "x": 7.2
}
```

- `colors` — HSL hues for the procedural gradient artwork.
- `x` — position along the back wall (gallery spans -9 to 9).
- `type` — `artwork` (flat piece). `sculpture` (GLB model on a plinth) comes next.

No code changes needed — the gallery reads the scene from the config file.

## Roadmap

- [x] Three.js gallery scene (floor, walls, lighting)
- [x] WebXR VR session support
- [x] Scene configuration via `artworks.json`
- [x] Artwork detail cards (click to view)
- [ ] GLB sculpture loading + asset ingestion pipeline
- [ ] FastAPI backend: asset APIs, session state, analytics
- [ ] Admin dashboard for asset management

PM: Pasha Ryan Raoufi
