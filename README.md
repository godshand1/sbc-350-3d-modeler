# SBC 350 3D Engine Builder

Ray's 3D V8 Chevy small-block builder — 3D CAD engine workbench, transmission matrix, dyno, technical drawings, ignition, induction, valvetrain, rotating assembly, and machine shop build sheet. Live on GitHub Pages.

- **Live:** https://phoenixlightcomeshome.github.io/sbc-350-3d-modeler/ (v7)
- **Live v8:** https://phoenixlightcomeshome.github.io/sbc-350-3d-modeler/v8/ — same app, Tab 09 drawings fixes + dyno falloff fix. v7 stays live at the root; v8 lives under `/v8/`.
- **Baseline (Ray, confirmed):** 4.000" bore, 3.480" stroke, 5.700" rods, 9.025" deck height, 64cc chambers, .039" gasket with .015" deck clearance; 9.90:1 compression, 0.054" quench. All dimensions/specs are Gemini's from Ray's numbers — for Ray to true, as with the buoy.

## v8 (current) — Tab 09 drawings fixes + dyno falloff fix (Nov 24, 2026)

Built from the v7 source with three files swapped in from the "Fixing SBC 350 Technical Drawings" AI Studio chat (Gemini 4 Hydrogen), verified headless before posting. The v7 root build is untouched.

- **Tab 09 — Dimensioned CAD button now works:** the two view buttons are a proper segmented control (aria-pressed, distinct active state). "Dimensioned CAD" is a real ON/OFF toggle with a badge — clicking it from the Part Catalog Diagram returns to the schematic with dimensions on; clicking it on the schematic hides the dimensions and shows an amber "Dimensions hidden — click Dimensioned CAD to show them" banner with a Show Dimensions button.
- **Tab 09 — hook-order crash fixed:** `TechDrawingSpecsDrawer.tsx` had hooks after an early `return null` (fatal); all hooks now run before any early return. Also: content-type checks before JSON.parse on the two server-only endpoints (graceful static-host errors), Discard Staged + Restore Live Sheet buttons, image onError fallback, Escape-key handler, Export SVG xmlns fix.
- **Dyno — HP no longer climbs after its peak:** the torque falloff had a 0.5 floor, so torque went flat at high RPM while RPM rose and HP climbed again (246 @ 6,250 → 256 @ 6,500). The falloff is now asymmetric with a post-peak monotonic guard; HP peaks **385 @ 5,500** then falls (383 / 376 / 363 / 343), TQ peaks **414 @ ~4,000**, HP = TQ×RPM/5252 holds every row. Note: Gemini's full-file rebuild of `coordinationEngine.ts` was rejected on verification (it dropped the cam tables / trans overrides / compatibility logic and rebuilt from memory); only her corrected dyno loop was merged into the v7 original — the diff vs v7 is confined to that loop.
- **Verification (headless, Nov 24):** local v8 build served and click-tested — tab 09 toggle on/off + banner + badge, dyno log rows read live (5500 RPM 385 HP, 6250 RPM 363 HP, 6500 RPM 343 HP). No console errors except the sandbox's Google Fonts proxy failure.
- **Build:** source `ai-studio-app-v8/` (local, uncommitted, like v7); built with `npm run build -- --base=/sbc-350-3d-modeler/v8/`; published build in `v8/` (git tag `v8`).
- **Not in v8:** Tabs 10–11 (Engineering Config, More Drawings) and the multi-brand engine/vehicle catalog — those are in flight in separate AI Studio chats and will land as the next version.

## v7 — Render / Section / Dress fixes (Gemini, Tabs4Pods chat)

Ray reported the Render, Section, and Dress buttons not working. Gemini's fixes, collected from the Tabs4Pods AI Studio chat Nov 23, 2026, applied to 8 of her 10 changed files and verified headless before posting:

- **Render — Ghost X-Ray:** materials now use `depthWrite: false`, so the engine is genuinely see-through (was reading as solid); Ghost gets its own deep-ocean X-ray environment (#050d18, #00f0ff grid). Tech Drawing gets a unified ISO/ASME blueprint palette — no more photorealistic parts on a dark scene.
- **Section — Valvetrain:** cut constant recalibrated 3.75 → 2.45, so the cut removes the valve covers and upper intake plenum (was skimming 0.11 units off the cover roofs). **Centerline:** clipping planes now attach to all outer accessories, so the starter, fuel pump, and carb bowls cut with the block instead of floating.
- **Dress:** the induction dress is promoted into `EngineConfig`, so it now reaches the specs and dyno — MPFI + Coils reads **408 HP / 431 TQ** (Gemini's calculation, for Ray to true); Carb + HEI keeps Ray's baseline **385 HP / 414 TQ**.
- **Also fixed:** Reset Ray's 350, Live Blueprint Spec Box, Tab 04 Carb CFM & AFR slider, Tab 05 timing slider (26°–44°, knock warning above 38°), Tab 06 transmission viewport (exploded slider, spinning shaft, synced Ghost/Tech Drawing).
- **Verification (headless, Nov 23):** `tsc --noEmit` clean, `vite build` clean; all 5 render modes clicked and visibly distinct, all 4 section cuts clicked (Valvetrain covers off, Centerline clean), Dress numbers confirmed moving 385/414 ↔ 408/431. No console errors except the sandbox's Google Fonts proxy failure.
- **The last 2 of Gemini's 10 files are now in v8** (Tab 09 technical drawings: `TechDrawingSpecsDrawer.tsx`, `TabTechnicalDrawings.tsx`) — collected Nov 24 from the "Fixing SBC 350 Technical Drawings" chat in Phoenix's AI Studio account after the Tabs4Pods chat hit its daily limit. Tab 09 in v7 still runs the v6 code; v8 has the corrected files.

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
