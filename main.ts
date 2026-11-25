// Pasar Rempah — the hand-in program for the make.fun card-game bounty.
// The game itself is the static site under game/ (plain HTML, CSS and
// classic scripts, no libraries, nothing fetched). This program copies
// game/ and screenshots/ into the output directory and writes the dossier
// the judge reads, using the vendored make.fun library.
//
// Run it the way the grader does:
//   node main.ts                      (writes to /output)
//   MAKEFUN_OUTPUT_DIR=out node main.ts   (writes to ./out anywhere else)

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The caps mirror the scorer's own limits, so an entry the scorer would
// refuse is refused here first instead.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
