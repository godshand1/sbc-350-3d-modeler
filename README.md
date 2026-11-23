# SBC 350 3D Engine Builder

Ray's 3D V8 Chevy small-block builder — 3D CAD engine workbench, transmission matrix, dyno, technical drawings, ignition, induction, valvetrain, rotating assembly, and machine shop build sheet. Live on GitHub Pages.

- **Live:** https://phoenixlightcomeshome.github.io/sbc-350-3d-modeler/
- **Baseline (Ray, confirmed):** 4.000" bore, 3.480" stroke, 5.700" rods, 9.025" deck height, 64cc chambers, .039" gasket with .015" deck clearance; 9.90:1 compression, 0.054" quench. All dimensions/specs are Gemini's from Ray's numbers — for Ray to true, as with the buoy.

## v6 (current) — AI Studio app, Ray's updates

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
