// Leonida Legend — GTA 6 Trophy Guide & Tracker (nurz entry for gta6-trophy-guide-01).
// An offline static guide for all 55 PS5 trophies: original 3–5 sentence guides in
// app/data/guides.js merged with the official list in app/data/trophies.json, a 7-stage
// roadmap to the platinum, missable warnings, filters, spoiler protection, and progress
// saved in localStorage with export/import. Dark neon Vice styling, no network calls.
// This program hands the entry in: it copies app/ and screenshots/ to the output folder
// and writes dossier.json with the vendored make.fun library (vendor file untouched).
// Run locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);

// Leonida Legend handover summary (authored step): report what was handed in.
try {
  const trophyData = JSON.parse(readFileSync(join(here, 'app', 'data', 'trophies.json'), 'utf8'));
  const trophyCount = Array.isArray(trophyData.trophies) ? trophyData.trophies.length : 0;
  const shotCount = existsSync(join(out, 'screenshots')) ? readdirSync(join(out, 'screenshots')).filter((f) => /\.(jpe?g|png)$/i.test(f)).length : 0;
  console.log(`Leonida Legend handed in: ${trophyCount} trophies, ${shotCount} screenshots.`);
} catch {
  console.log('Leonida Legend handed in: dossier written (summary unavailable).');
}
