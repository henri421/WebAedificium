// Tableau des outils du README, genere depuis GROUPES de hub.js (audit I1-I3).
// Lancement : node scripts/readme.mjs (reecrit README.md entre les reperes).
// Le test tests/readme.test.js echoue si le README n'est plus a jour.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const racine = new URL('../', import.meta.url);
const lire = (f) => readFileSync(new URL(f, racine), 'utf8');
export const DEBUT = '<!-- OUTILS:DEBUT (genere par scripts/readme.mjs, ne pas modifier a la main) -->';
export const FIN = '<!-- OUTILS:FIN -->';

/** GROUPES de hub.js, en francais, charge dans un DOM minimal. */
export function groupes() {
  const neutre = () => ({ innerHTML: '', textContent: '', value: '', options: [], addEventListener() {}, setAttribute() {}, removeAttribute() {}, classList: { toggle() {} } });
  const document = {
    documentElement: { lang: 'fr' }, title: '',
    body: { classList: { toggle() {}, contains: () => false } },
    getElementById: neutre, querySelectorAll: () => [], addEventListener() {},
  };
  const contexte = {
    document, window: { addEventListener() {}, scrollTo() {}, document }, location: { hash: '#accueil', href: 'https://henri421.github.io/WebAedificium/' },
    getComputedStyle: () => ({ getPropertyValue: () => '' }), navigator: {}, setTimeout, console,
  };
  vm.createContext(contexte);
  vm.runInContext(lire('asmin.js'), contexte);
  vm.runInContext(`${lire('hub.js')}\n;globalThis.__GROUPES = GROUPES;`, contexte);
  return contexte.__GROUPES;
}

const ENTITES = { '&sect;': '§', '&gamma;': 'γ', '&alpha;': 'α', '&amp;': '&', '&nbsp;': ' ', '&rarr;': '→', '&eacute;': 'é', '&lt;': '<', '&gt;': '>' };
/** Texte HTML de la carte vers du Markdown simple : indices en _x, balises retirees. */
export function texte(html) {
  return String(html)
    .replace(/<sub>(.*?)<\/sub>/g, '_$1')
    .replace(/<sup>(.*?)<\/sup>/g, '^$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;/g, (e) => ENTITES[e] ?? e)
    .replace(/\|/g, '\\|')
    .replace(/\s+/g, ' ')
    .trim();
}

function ou(o) {
  if (o.route) return 'sur cette page';
  if (o.href === null || o.href === undefined) return 'non publié';
  const depot = new URL(o.href).pathname.split('/').filter(Boolean)[0];
  return `[dépôt](https://github.com/henri421/${depot}) · [ouvrir](${o.href})`;
}

/** Le tableau, groupe par groupe, sans les renvois (un outil n'y figure qu'une fois). */
export function tableau() {
  const lignes = ['| Outil | Référentiel | Où | Ce qu\'il fait |', '|---|---|---|---|'];
  for (const g of groupes()) {
    for (const o of g.outils) {
      if (o.renvoi) continue;
      lignes.push(`| **${texte(o.nom)}** | ${texte(g.num)} | ${ou(o)} | ${texte(o.long)} |`);
    }
  }
  return lignes.join('\n');
}

/** Le README avec son tableau regenere ; leve si les reperes manquent. */
export function readmeAJour(readme) {
  const i = readme.indexOf(DEBUT);
  const j = readme.indexOf(FIN);
  if (i < 0 || j < i) throw new Error('README.md : reperes OUTILS:DEBUT / OUTILS:FIN absents');
  return `${readme.slice(0, i + DEBUT.length)}\n${tableau()}\n${readme.slice(j)}`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const chemin = new URL('README.md', racine);
  writeFileSync(chemin, readmeAJour(readFileSync(chemin, 'utf8')));
  console.log('README.md : tableau des outils regenere');
}
