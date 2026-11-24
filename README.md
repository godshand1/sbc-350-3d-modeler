# SBC 350 3D Engine Builder

Ray's 3D V8 Chevy small-block builder — 3D CAD engine workbench, transmission matrix, dyno, technical drawings, ignition, induction, valvetrain, rotating assembly, and machine shop build sheet. Live on GitHub Pages.

- **Live:** https://phoenixlightcomeshome.github.io/sbc-350-3d-modeler/
- **Baseline (Ray, confirmed):** 4.000" bore, 3.480" stroke, 5.700" rods, 9.025" deck height, 64cc chambers, .039" gasket with .015" deck clearance; 9.90:1 compression, 0.054" quench. All dimensions/specs are Gemini's from Ray's numbers — for Ray to true, as with the buoy.

## v7 (current) — Render / Section / Dress fixes (Gemini, Tabs4Pods chat)

Ray reported the Render, Section, and Dress buttons not working. Gemini's fixes, collected from the Tabs4Pods AI Studio chat Nov 23, 2026, applied to 8 of her 10 changed files and verified headless before posting:

- **Render — Ghost X-Ray:** materials now use `depthWrite: false`, so the engine is genuinely see-through (was reading as solid); Ghost gets its own deep-ocean X-ray environment (#050d18, #00f0ff grid). Tech Drawing gets a unified ISO/ASME blueprint palette — no more photorealistic parts on a dark scene.
- **Section — Valvetrain:** cut constant recalibrated 3.75 → 2.45, so the cut removes the valve covers and upper intake plenum (was skimming 0.11 units off the cover roofs). **Centerline:** clipping planes now attach to all outer accessories, so the starter, fuel pump, and carb bowls cut with the block instead of floating.
- **Dress:** the induction dress is promoted into `EngineConfig`, so it now reaches the specs and dyno — MPFI + Coils reads **408 HP / 431 TQ** (Gemini's calculation, for Ray to true); Carb + HEI keeps Ray's baseline **385 HP / 414 TQ**.
- **Also fixed:** Reset Ray's 350, Live Blueprint Spec Box, Tab 04 Carb CFM & AFR slider, Tab 05 timing slider (26°–44°, knock warning above 38°), Tab 06 transmission viewport (exploded slider, spinning shaft, synced Ghost/Tech Drawing).
- **Verification (headless, Nov 23):** `tsc --noEmit` clean, `vite build` clean; all 5 render modes clicked and visibly distinct, all 4 section cuts clicked (Valvetrain covers off, Centerline clean), Dress numbers confirmed moving 385/414 ↔ 408/431. No console errors except the sandbox's Google Fonts proxy failure.
- **Still to come:** the last 2 of Gemini's 10 files (Tab 09 technical drawings: `TechDrawingSpecsDrawer.tsx`, `TabTechnicalDrawings.tsx`) — the Tabs4Pods chat hit its daily limit before they were delivered; collection resumes after the reset (~midnight Nov 23) and they will follow as the next update. Tab 09 currently runs the v6 code.

## v6 — AI Studio app, Ray's updates

Built in Phoenix's AI Studio account ("SBC 350 3D Engine Builder", app 8629f36c), exported Nov 23, 2026 after Ray updated it, and posted here. Vite + React 19 + TypeScript + Tailwind 4 + Three.js, with an Express server (`server.ts`) for the two Gemini-powered features: live online spec lookup and upload-a-diagram-to-3D.

- **Source:** `app/` (the full Vite project). **Live build:** `index.html` + `assets/` at the repo root (built output, served by Pages).
- **Build it:** `cd app && bun install && bun run build`, then copy `dist/*` to the repo root. `bun run lint` (`tsc --noEmit`) passes clean. npm is not used for this repo (esbuild ERESOLVE) — bun 1.4.4.
- **GitHub Pages note:** the build uses `base: '/sbc-350-3d-modeler/'` in `app/vite.config.ts`, and the two hardcoded asset paths (A500 reference image, applet history JSON) use `import.meta.env.BASE_URL`, so the app works under the project subpath.
- **What works on Pages:** everything client-side — 3D engine + transmission scenes, all nine workbench tabs, the 28-transmission matrix, dyno curves, machine shop build sheet, tech-drawings catalog.
- **What does not work on Pages:** the two server features (online spec lookup, diagram parsing) need `server.ts` running with a `GEMINI_API_KEY`. On Pages those buttons show a panel error instead of results — they fail gracefully and nothing else breaks. No key is stored in this repo.

## v5 and earlier — single-file app

v1–v5 were a single `index.html` (React 18 + Three.js + Tailwind via CDN), built from Gemini's five variant files merged onto the v4 reliability base. v5 is preserved in git history (commit `14fee27`) and in the local backups (`index.html.v1.bak`–`.v4.bak`); the v5 Drive backup is `~/workspace/backups/sbc-350-3d-modeler-20261123-v5.zip`.

## Provenance

- Code by Gemini in Ray's AI Studio chats (Nov 22–23, 2026), from Ray's brief and his upgrade directions, under the MODSIM + HOOPS Visualize standards he set for his shop tools.
- The five original Gemini variant files are kept verbatim in `app/public/assets/aistudio/01–05-*.txt` and in `gemini-upgrade-v6/` (local working files, not committed).
- Ray updated the AI Studio app himself on the night of Nov 22–23, 2026; the export in `ai-studio-app-export-20261123/` (local, not committed) is that updated version.
