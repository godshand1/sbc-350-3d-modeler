/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const MODEL_ID = 'gemini-4-hydrogen';

function createGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function extractJsonObject(rawText: string): Record<string, unknown> {
  const trimmed = rawText.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : trimmed;
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('Model response did not contain a valid JSON object.');
  }
  const slice = candidate.slice(firstBrace, lastBrace + 1);
  return JSON.parse(slice) as Record<string, unknown>;
}

const DIAGRAM_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    domain: {
      type: Type.STRING,
      description: 'Detected automotive domain: either "engine" or "transmission".',
    },
    drawingNumber: {
      type: Type.STRING,
      description: 'Technical drawing sheet or catalog page identifier visible on the diagram.',
    },
    title: {
      type: Type.STRING,
      description: 'Official engine or transmission model title from the diagram.',
    },
    subtitle: {
      type: Type.STRING,
      description: 'Short technical subtitle including application, series, or speed configuration.',
    },
    unitSummary: {
      type: Type.STRING,
      description: 'Real-world engineering overview of the unit, clearances, hydraulic/valvetrain notes, and design tolerances.',
    },
    dimensions: {
      type: Type.OBJECT,
      properties: {
        bore: { type: Type.NUMBER, description: 'Cylinder bore diameter in inches (engine only if specified).' },
        stroke: { type: Type.NUMBER, description: 'Crankshaft stroke in inches (engine only if specified).' },
        rodLength: { type: Type.NUMBER, description: 'Connecting rod center-to-center length in inches.' },
        deckHeight: { type: Type.NUMBER, description: 'Block deck height in inches.' },
        deckClearance: { type: Type.NUMBER, description: 'Piston-to-deck clearance in inches.' },
        gasketThickness: { type: Type.NUMBER, description: 'Compressed head gasket thickness in inches.' },
        chamberCc: { type: Type.NUMBER, description: 'Combustion chamber volume in cc.' },
        ratios: {
          type: Type.ARRAY,
          items: { type: Type.NUMBER },
          description: 'Forward transmission gear ratios in order 1st..top gear.',
        },
        reverse: { type: Type.NUMBER, description: 'Transmission reverse gear ratio.' },
        lengthInches: { type: Type.NUMBER, description: 'Overall transmission length in inches.' },
        defaultStall: { type: Type.NUMBER, description: 'Recommended converter stall RPM for automatics (0 for manuals).' },
        nativePattern: { type: Type.STRING, description: 'Bellhousing bolt pattern family.' },
      },
    },
    callouts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          row: { type: Type.STRING, description: 'Diagram row or section letter (A, B, C, D, E, F).' },
          indexCode: { type: Type.STRING, description: 'Callout number/index shown on the technical drawing (e.g. A-001, 104, 12).' },
          partName: { type: Type.STRING, description: 'Official component name.' },
          partNumber: { type: Type.STRING, description: 'OEM or aftermarket reference part number / SKU.' },
          category: { type: Type.STRING, description: 'Assembly group category.' },
          clearanceSpec: { type: Type.STRING, description: 'Real-world clearance, end play, backlash, or hydraulic pressure spec.' },
          torqueSpec: { type: Type.STRING, description: 'Fastener torque spec (ft-lbs or in-lbs).' },
          material: { type: Type.STRING, description: 'Component alloy or friction/seal material.' },
          notes: { type: Type.STRING, description: 'Installation, orientation, or service notes.' },
          targetSubassembly: {
            type: Type.STRING,
            description:
              'Matching 3D subassembly key. Engine keys: block, crank, rotating, heads, cam, intake, ignition, lubrication, cooling, fuel, starter, timingCover, oilPan. Transmission keys: bellhousing, converter, frontPump, clutchPack, mainCase, valveBody, pan, tailhousing, slipYoke.',
          },
        },
        required: ['row', 'indexCode', 'partName', 'category', 'targetSubassembly'],
      },
    },
  },
  required: ['domain', 'title', 'unitSummary', 'callouts'],
};

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, model: MODEL_ID });
  });

  // Online real-world OEM & aftermarket automotive spec + BOM lookup via Google Search Grounding
  app.post('/api/specs/lookup', async (req, res) => {
    const ai = createGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'GEMINI_API_KEY is not configured in the server environment.',
      });
      return;
    }

    try {
      const body = req.body as {
        domain?: 'engine' | 'transmission';
        query?: string;
        unitName?: string;
        contextSpecs?: Record<string, unknown>;
      };

      const domain = body.domain === 'transmission' ? 'transmission' : 'engine';
      const query = String(body.query || body.unitName || '').trim();
      if (!query) {
        res.status(400).json({ error: 'Search query or component name is required.' });
        return;
      }

      const targetKeys =
        domain === 'transmission'
          ? 'bellhousing, converter, frontPump, clutchPack, mainCase, valveBody, pan, tailhousing, slipYoke'
          : 'block, crank, rotating, heads, cam, intake, ignition, lubrication, cooling, fuel, starter, timingCover, oilPan';

      const prompt = `You are a master automotive machine shop engineer and technical catalog specialist.
Research real-world OEM and aftermarket technical drawing specifications, service manual clearances, fastener torque specs, and exploded parts catalog BOM callouts for:
Domain: ${domain.toUpperCase()}
Query / Unit: "${query}"
${body.unitName ? `Active Studio Assembly: "${body.unitName}"` : ''}
${body.contextSpecs ? `Current Parameters: ${JSON.stringify(body.contextSpecs)}` : ''}

Use Google Search to verify accurate real-world specifications, OEM/aftermarket part numbers, factory clearances, end-play tolerances, torque specs, and gear/engine dimensions.

Return ONLY a valid JSON object (no surrounding commentary) matching this exact schema:
{
  "domain": "${domain}",
  "drawingNumber": "string (e.g., OEM / Aftermarket Ref ID)",
  "title": "string (official unit or component title)",
  "subtitle": "string (make, years, application, spec summary)",
  "unitSummary": "string (concise technical engineering overview)",
  "dimensions": {
    ${
      domain === 'transmission'
        ? `"ratios": [number],
    "reverse": number,
    "lengthInches": number,
    "defaultStall": number,
    "nativePattern": "string"`
        : `"bore": number,
    "stroke": number,
    "rodLength": number,
    "deckHeight": number,
    "deckClearance": number,
    "gasketThickness": number,
    "chamberCc": number`
    }
  },
  "callouts": [
    {
      "row": "A | B | C | D | E | F",
      "indexCode": "string (e.g. A-101, B-204)",
      "partName": "string",
      "partNumber": "string (real OEM or aftermarket SKU)",
      "category": "string",
      "clearanceSpec": "string (real-world clearance / end play / pressure / gap)",
      "torqueSpec": "string (real-world torque in ft-lbs or in-lbs)",
      "material": "string",
      "notes": "string",
      "targetSubassembly": "one of: ${targetKeys}"
    }
  ]
}

Provide 8 to 14 well-organized callout items spanning Rows A through F so every major subassembly in the 3D CAD viewer receives verified specs. Omit unknown numeric fields inside "dimensions" rather than guessing zero.`;

      const response = await ai.models.generateContent({
        model: MODEL_ID,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const rawText = response.text || '';
      const parsed = extractJsonObject(rawText);

      const candidate = response.candidates?.[0] as
        | {
            groundingMetadata?: {
              groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
            };
          }
        | undefined;

      const chunks = candidate?.groundingMetadata?.groundingChunks || [];
      const seenUris = new Set<string>();
      const sourceUrls: Array<{ title: string; uri: string }> = [];
      for (const chunk of chunks) {
        const uri = chunk.web?.uri;
        if (uri && !seenUris.has(uri)) {
          seenUris.add(uri);
          sourceUrls.push({
            title: chunk.web?.title || uri,
            uri,
          });
        }
      }

      res.json({
        sheet: {
          id: `online_${Date.now()}`,
          domain,
          drawingNumber: String(parsed.drawingNumber || `WEB-${domain.toUpperCase()}`),
          title: String(parsed.title || query),
          subtitle: String(parsed.subtitle || 'Verified Online Automotive Technical Spec'),
          sourceLabel: 'Live Google Search Grounded Technical Data',
          unitSummary: String(parsed.unitSummary || ''),
          dimensions:
            parsed.dimensions && typeof parsed.dimensions === 'object'
              ? parsed.dimensions
              : undefined,
          callouts: Array.isArray(parsed.callouts) ? parsed.callouts : [],
          sourceUrls,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to look up online automotive specifications.';
      console.error('[/api/specs/lookup] Error:', err);
      res.status(502).json({ error: message });
    }
  });

  // Multimodal Technical Drawing / Exploded Catalog Diagram Upload & Extraction
  app.post('/api/specs/parse-diagram', async (req, res) => {
    const ai = createGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'GEMINI_API_KEY is not configured in the server environment.',
      });
      return;
    }

    try {
      const body = req.body as {
        domain?: 'engine' | 'transmission' | 'auto';
        imageBase64?: string;
        mimeType?: string;
        notes?: string;
        unitHint?: string;
      };

      const rawBase64 = String(body.imageBase64 || '').replace(/^data:[^;]+;base64,/, '').trim();
      if (!rawBase64) {
        res.status(400).json({ error: 'Uploaded diagram image data is required.' });
        return;
      }

      const mimeType = String(body.mimeType || 'image/jpeg');
      const requestedDomain = body.domain || 'auto';

      const prompt = `Analyze this automotive technical drawing, exploded parts catalog diagram, or engine/transmission specification sheet.
Requested domain hint: ${requestedDomain}.
${body.unitHint ? `Active unit context: ${body.unitHint}.` : ''}
${body.notes ? `Technician notes: ${body.notes}.` : ''}

Instructions:
1. Identify the exact engine or transmission model/series shown in the header/title (for example Chrysler 40RH / 42RH / 42RE / 44RE A500, TH350, 4L60E, SBC 350, etc.).
2. Read the visible exploded diagram rows (such as Rows A, B, C, D, E, F) and numbered callouts/part groups.
3. Combine what is visible in the diagram with accurate real-world automotive OEM/aftermarket service clearances, fastener torque specs, and dimensions for each subassembly.
4. Map every callout to the closest 3D CAD subassembly key:
   - For transmission diagrams: bellhousing, converter, frontPump, clutchPack, mainCase, valveBody, pan, tailhousing, slipYoke.
   - For engine diagrams: block, crank, rotating, heads, cam, intake, ignition, lubrication, cooling, fuel, starter, timingCover, oilPan.
5. Extract any real numeric dimensions if applicable (gear ratios, lengthInches, defaultStall, nativePattern OR bore, stroke, rodLength, deckHeight, chamberCc, gasketThickness).`;

      const response = await ai.models.generateContent({
        model: MODEL_ID,
        contents: [
          {
            inlineData: {
              mimeType,
              data: rawBase64,
            },
          },
          prompt,
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: DIAGRAM_RESPONSE_SCHEMA,
        },
      });

      const parsed = JSON.parse(response.text || '{}') as Record<string, unknown>;
      const resolvedDomain =
        parsed.domain === 'transmission' || parsed.domain === 'engine'
          ? parsed.domain
          : requestedDomain === 'transmission'
          ? 'transmission'
          : 'engine';

      res.json({
        sheet: {
          id: `upload_${Date.now()}`,
          domain: resolvedDomain,
          drawingNumber: String(parsed.drawingNumber || 'UPLOADED-DWG'),
          title: String(parsed.title || body.unitHint || 'Uploaded Technical Drawing'),
          subtitle: String(parsed.subtitle || 'Extracted from Uploaded CAD / Parts Catalog Sheet'),
          sourceLabel: 'Uploaded Diagram Vision Extraction',
          unitSummary: String(parsed.unitSummary || ''),
          dimensions:
            parsed.dimensions && typeof parsed.dimensions === 'object'
              ? parsed.dimensions
              : undefined,
          callouts: Array.isArray(parsed.callouts) ? parsed.callouts : [],
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to extract technical drawing specifications.';
      console.error('[/api/specs/parse-diagram] Error:', err);
      res.status(502).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Production build not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SBC 350 CAD Studio server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
