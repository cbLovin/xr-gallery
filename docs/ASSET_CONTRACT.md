# Asset Contract — XR Gallery

This document is the contract between asset production and the gallery runtime. It exists so
nothing you build has to be reworked. **Read it before starting any asset work.**

---

## 1. What the gallery is

A browser-based WebXR gallery built with **Three.js** (r185), TypeScript and Vite. It renders a
single interior room. Artwork hangs on three walls. The viewer moves through it on desktop with
orbit controls and in a headset via WebXR.

Runtime source: `src/gallery/`. Artwork mounting is `src/gallery/artwork.ts`.

---

## 2. Delivery format

| Property | Requirement |
|---|---|
| Format | **GLB 2.0** (binary glTF). Not FBX, not OBJ. |
| Y-up, right-handed | Required — glTF default. Do not bake a scale of 100. |
| Unit | **1 unit = 1 metre** |
| Draco compression | Optional, but strongly encouraged for anything over 2 MB |
| Textures | Embed in the GLB, or place beside it and use a relative path |
| Naming | `kebab-case`, lowercase, no spaces: `oak-console.glb`, `plinth-tall.glb` |
| Origin | **Centred at the object's footprint centre, sitting on y = 0** |

That last row matters most. If a mesh's origin is anywhere else, it will float or sink in the
gallery and I cannot compensate for it generically.

---

## 3. Where files go

```
public/
  assets/
    environment/     room shell, walls, floor, ceiling, trim
    props/           furniture, plinths, benches, anything freestanding
    lighting/        (not needed — lights are configured in code)
    sculptures/      GLB sculptures shown on plinths
  textures/          loose textures, if not embedded
```

Load with a relative URL from `public/`: `assets/props/oak-console.glb`.

---

## 4. Hard budgets

These are performance limits, not preferences. Exceeding them costs frame rate on the headsets
we're targeting.

| Asset class | Triangle budget | Texture resolution | Max file size |
|---|---|---|---|
| Hero / focal prop | ≤ 30k tris | 2048px max | ≤ 8 MB |
| Standard prop | ≤ 10k tris | 1024px max | ≤ 3 MB |
| Set dressing | ≤ 1k tris | 512px max | ≤ 1 MB |
| Sculpture (hero) | ≤ 60k tris | 2048px max | ≤ 12 MB |

**Textures:** PNG for anything with alpha, JPEG otherwise. Prefer a single 2048px atlas over
many small maps. Total texture memory per scene must stay under **64 MB**.

---

## 5. Render style

The gallery uses a **clean, NPR-adjacent look**: flat-ish base colour, soft rim separation,
no photoreal PBR noise. The runtime already provides:

- one warm key light with shadows
- one warm fill
- two accent spotlights aimed at the back wall
- one rim light
- hemisphere + ambient

So **do not bake lighting into vertex colours or emissive maps** — it will fight the runtime
lights. Materials should be mostly `roughness ≥ 0.6`, `metalness ≤ 0.2`, unless the asset is
explicitly metal or glass.

Give each material an emissive base of black. The runtime tints glows by the active mood colour.

---

## 6. Anchor points

To place a prop, the runtime needs one of these. Prefer a named empty:

| Anchor | Z-up offset | Use for |
|---|---|---|
| `floor` | 0 | Consoles, benches, plinths — default |
| `wall` | +0.35 toward room centre | Anything hung (frames, panels, signage) |
| `pedestal` | +0.9 | Sculptures on plinths |

Room dimensions, which anchor coordinates are relative to:

```
Width (X)  18 units      wall height (Y)  5 units      depth (Z)  12 units
Floor at y = 0.  Back wall at z = -6.  Left wall x = -9.  Right wall x = +9.
```

---

## 7. Handoff checklist

Before an asset is considered done:

- [ ] Opens correctly in Blender or Unreal with no missing textures
- [ ] Exports to GLB at or under budget
- [ ] Origin at footprint centre, on y = 0
- [ ] Named anchor empty present and parented to the root
- [ ] Applied transforms (no unapplied scale/rotation)
- [ ] Renders in a neutral grey clay pass — no baked lighting
- [ ] Dropped into `public/assets/` and loads without console errors
- [ ] **README entry added** under its folder: author, software, poly count, texture list, any
      non-obvious scale decisions — this is what makes the asset survive the handover

---

## 8. Why the documentation requirement

Asset production has a fixed end date, and this is the handoff. Anything that can't be explained
in a README will have to be reverse-engineered later. Assume no one remembers the source file
layout.

**Open questions for the project lead rather than guessing:**
- Whether a prop needs collision or interaction
- Whether an asset must read at distance, or only up close
- Whether it belongs in a mood-accented area (back wall) or a neutral one
