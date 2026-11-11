// Controle des versions epinglees de la suite (audit du 10/11/2026, R2 et I9).
//
// Pour chaque outil du hub (OUTILS_EXTERNES de hub.js) et chaque bibliotheque,
// lit package.json sur GitHub et signale :
//   - une dependance « github:henri421/x#vA » alors qu'un tag plus recent existe ;
//   - une bibliotheque dont src/ a change depuis son dernier tag (correctif non
//     publie : les outils qui l'importent ne le recoivent pas).
// Lance chaque semaine par .github/workflows/versions.yml, qui ouvre ou met a
// jour une issue. En local : node scripts/versions.mjs (reseau requis).

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const COMPTE = 'henri421';
export const BIBLIOTHEQUES = ['aedificium-ui', 'section-uls', 'sections-ec3', 'dispositions-constructives', 'equilibre-statique', 'sol-ec7'];

/** Noms de depots tires des adresses de OUTILS_EXTERNES. */
export function depotsDuHub(sourceHub) {
  const bloc = sourceHub.match(/const OUTILS_EXTERNES = \{([\s\S]*?)\};/);
  if (!bloc) throw new Error('OUTILS_EXTERNES introuvable dans hub.js');
  return [...bloc[1].matchAll(/https:\/\/henri421\.github\.io\/([^/"]+)\//g)].map((m) => m[1]);
}

/** Dependances epinglees d'un package.json : [{ bib, tag }]. */
export function epingles(pkg) {
  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  return Object.values(deps)
    .map((v) => String(v).match(/^github:henri421\/([^#]+)#(v[\d.]+)$/))
    .filter(Boolean)
    .map((m) => ({ bib: m[1], tag: m[2] }));
}

const cle = (t) => t.replace(/^v/, '').split('.').map(Number);
export function compare(a, b) {
  const x = cle(a); const y = cle(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}
export const dernier = (tags) => [...tags].sort(compare).at(-1) ?? null;

/** Constats a partir des donnees deja collectees (pur, teste). */
export function constats({ paquets, tags, srcDepuisTag }) {
  const lignes = [];
  for (const [depot, pkg] of Object.entries(paquets)) {
    if (!pkg) { lignes.push(`- **${depot}** : package.json illisible.`); continue; }
    for (const { bib, tag } of epingles(pkg)) {
      const d = dernier(tags[bib] ?? []);
      if (d && compare(tag, d) < 0) lignes.push(`- **${depot}** epingle \`${bib}#${tag}\`, dernier tag \`${d}\`.`);
    }
  }
  for (const [bib, commits] of Object.entries(srcDepuisTag)) {
    if (commits.length) lignes.push(`- **${bib}** : ${commits.length} commit(s) sur \`src/\` depuis son dernier tag (${commits.slice(0, 5).join(', ')}) : poser un tag, puis monter les outils qui l'importent.`);
  }
  return lignes;
}

// ---------------------------------------------------------------- collecte
const git = (args, cwd) => execFileSync('git', args, { cwd, encoding: 'utf8' });

function tagsDistants(depot) {
  const sortie = git(['ls-remote', '--tags', `https://github.com/${COMPTE}/${depot}.git`]);
  return [...sortie.matchAll(/refs\/tags\/(v[\d.]+)$/gm)].map((m) => m[1]);
}

async function paquet(depot) {
  const r = await fetch(`https://raw.githubusercontent.com/${COMPTE}/${depot}/HEAD/package.json`);
  if (r.status === 404) return undefined; // depot sans package.json (regard...)
  return r.ok ? r.json() : null;
}

function commitsSrcDepuis(depot, tag) {
  const dossier = mkdtempSync(join(tmpdir(), 'versions-'));
  try {
    git(['clone', '-q', '--filter=blob:none', '--no-checkout', `https://github.com/${COMPTE}/${depot}.git`, '.'], dossier);
    return git(['log', '--format=%h', `${tag}..HEAD`, '--', 'src'], dossier).split('\n').filter(Boolean);
  } finally {
    try { rmSync(dossier, { recursive: true, force: true, maxRetries: 3 }); } catch { /* Windows : fichiers git verrouilles, sans gravite */ }
  }
}

export async function collecter(sourceHub) {
  const depots = [...new Set([...depotsDuHub(sourceHub), ...BIBLIOTHEQUES])];
  const paquets = {};
  for (const d of depots) {
    const p = await paquet(d);
    if (p !== undefined) paquets[d] = p;
  }
  const tags = {};
  const srcDepuisTag = {};
  for (const b of BIBLIOTHEQUES) {
    tags[b] = tagsDistants(b);
    const d = dernier(tags[b]);
    srcDepuisTag[b] = d ? commitsSrcDepuis(b, d) : [];
  }
  return { paquets, tags, srcDepuisTag };
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/versions.mjs')) {
  const hub = readFileSync(new URL('../hub.js', import.meta.url), 'utf8');
  const lignes = constats(await collecter(hub));
  console.log(lignes.length ? lignes.join('\n') : 'Toutes les versions epinglees sont a jour.');
  process.exitCode = 0;
}
