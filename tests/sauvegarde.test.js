// Etape 10, C9 (audit du 10/11/2026, R7) : rappel d'export et export global des projets.
// Test d'acceptation : ne pas modifier.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const dossier = path.join(__dirname, '..', 'projets');
const charger = (f) => import(pathToFileURL(path.join(dossier, f)).href);

/** Stockage cle-valeur en memoire, de la forme de localStorage. */
function memoire() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

test('date du dernier export : notee et relue par projet, null si jamais exporte', async () => {
  const S = await charger('sauvegarde.js');
  const st = memoire();
  assert.equal(S.dernierExport('p1', st), null);
  S.noterExport('p1', '2026-11-15T10:00:00.000Z', st);
  assert.equal(S.dernierExport('p1', st), '2026-11-15T10:00:00.000Z');
  assert.equal(S.dernierExport('p2', st), null);
  assert.equal(st.getItem('aedificium-export:p1'), '2026-11-15T10:00:00.000Z');
});

test('stockage indisponible (navigation privee) : aucune exception', async () => {
  const S = await charger('sauvegarde.js');
  const casse = { getItem() { throw new Error('refuse'); }, setItem() { throw new Error('refuse'); } };
  assert.equal(S.dernierExport('p1', casse), null);
  assert.doesNotThrow(() => S.noterExport('p1', '2026-11-15T10:00:00.000Z', casse));
});

test('invitation a exporter : jamais exporte, ou modifie depuis le dernier export', async () => {
  const S = await charger('sauvegarde.js');
  assert.equal(S.aExporter('2026-11-15T10:00:00.000Z', null), true);
  assert.equal(S.aExporter('2026-11-15T10:00:00.000Z', '2026-11-15T09:00:00.000Z'), true);
  assert.equal(S.aExporter('2026-11-15T10:00:00.000Z', '2026-11-15T10:00:00.000Z'), false);
  assert.equal(S.aExporter('2026-11-15T10:00:00.000Z', '2026-11-15T11:00:00.000Z'), false);
});

test('export global : tous les projets en un fichier, relu a l identique', async () => {
  const P = await charger('projets.js');
  const S = await charger('sauvegarde.js');
  const a = P.creerProjet('Immeuble A');
  P.ajouterElement(a, null, 'M1');
  const b = P.creerProjet('Pont B');
  const texte = S.exporterTous([a, b], '2026-11-15T10:00:00.000Z');
  const brut = JSON.parse(texte);
  assert.equal(brut.format, 'aedificium-projets/1');
  assert.equal(brut.exporte, '2026-11-15T10:00:00.000Z');
  assert.equal(brut.projets.length, 2);
  const relus = S.importerFichier(texte);
  assert.deepEqual(relus.map((p) => p.nom), ['Immeuble A', 'Pont B']);
  assert.deepEqual(relus[0], JSON.parse(JSON.stringify(a)));
});

test('import : un fichier d un seul projet est aussi accepte', async () => {
  const P = await charger('projets.js');
  const S = await charger('sauvegarde.js');
  const a = P.creerProjet('Seul');
  const relus = S.importerFichier(P.exporterProjet(a));
  assert.equal(relus.length, 1);
  assert.equal(relus[0].nom, 'Seul');
});

test('import : un export global dont un projet est corrompu est refuse en entier', async () => {
  const P = await charger('projets.js');
  const S = await charger('sauvegarde.js');
  const brut = JSON.parse(S.exporterTous([P.creerProjet('Bon')], '2026-11-15T10:00:00.000Z'));
  brut.projets.push({ format: 'inconnu' });
  assert.throws(() => S.importerFichier(JSON.stringify(brut)));
  assert.throws(() => S.importerFichier('pas du json'));
});

test('page des projets : date du dernier export, invitation et bouton d export global', () => {
  const page = fs.readFileSync(path.join(dossier, 'page.js'), 'utf8');
  assert.match(page, /from '\.\/sauvegarde\.js'/);
  assert.match(page, /data-action="exporter-tous"/);
  assert.match(page, /noterExport\(/);
  assert.match(page, /aExporter\(/);
  assert.match(page, /importerFichier\(/);
});
