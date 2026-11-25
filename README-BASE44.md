# SBC 350 3D Engine Builder — Base44 import source

Clean, import-ready copy of the **v14** app for Base44 (GitHub import route).
This branch exists only so Base44 can import one app at the repo root —
`main` stays the GitHub Pages site with all the versioned builds.

- **Source:** `ai-studio-app-v13-staging` on `main` — the tree v14 was built
  from (commit `9cfd58e`, tag `v14`, live at
  https://phoenixlightcomeshome.github.io/sbc-350-3d-modeler/v14/).
- **Stack:** React 19 + Vite 8 + Three.js 0.187 + Tailwind 4. `npm run build`
  (`vite build`), `npm run lint` (`tsc --noEmit`). Dev server runs
  `server.ts` (Express) for the optional `/api/specs/*` endpoints; the app
  already fails gracefully without it on a static host.
- **Excluded:** `dist/` (build output) and `node_modules/` — install with
  `npm install` (or `bun install`, `bun.lock` kept).
- **Tabs (14, Tab 00–13):** 00 CAD/CAM Design Studio · 01 3D Drafting & Rig ·
  02 Engine & Rotating · 03 Valvetrain & Flow · 04 Induction & Fuel ·
  05 Ignition & Timing · 06 Driveline Matrix · 07 Dyno & Curves ·
  08 Machine Shop BOM · 09 Tech Drawings · 10 Engineering Config ·
  11 More Drawings · 12 Drawing & MFG Matrix · 13 Modification Studio.
- **Baseline (never regress):** 349.85 CID, 385 HP / 414 TQ carb,
  408 HP / 431 TQ MPFI. Cam fix: `camCore.rotation.y = crankAngle * 0.5`.
- **Not in this branch yet — image-to-3D:** the Design Studio
  image-upload → trace → extrude → render flow (7 files from Gemini) is
  still in the AI Studio chat; it lands after the Tabs4Pods daily-limit
  reset (~midnight Nov 25/26) and gets wired into the new Tab 14
  (Design Matrix) described in `base44-package/` on `main`.
- **Do not merge this branch into `main`.** It replaces the Pages site at
  root by design; it is only an import source for Base44.
