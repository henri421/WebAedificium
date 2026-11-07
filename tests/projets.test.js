// Copie du moteur de projets dans le hub (projets/projets.js, generee depuis
// aedificium-ui) : elle se charge sans compilation et l'heritage des feuilles
// y fonctionne comme dans la source. Les tests complets vivent dans
// aedificium-ui/tests/projets.test.ts.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const dossier = path.join(__dirname, '..', 'projets');
const charger = (f) => import(pathToFileURL(path.join(dossier, f)).href);

test('copies generees : en-tete, aucun reste de TypeScript', () => {
  for (const f of ['projets.js', 'projets-stockage.js']) {
    const t = fs.readFileSync(path.join(dossier, f), 'utf8');
    assert.match(t, /^\/\/ GENERE depuis aedificium-ui\/src\//);
    assert.doesNotMatch(t, /\binterface\s+\w+\s*\{/);
    assert.doesNotMatch(t, /from '\.\/projets'/);
  }
});

test('mur en 4 feuilles : la feuille 1 change, les autres suivent sauf leur hauteur', async () => {
  const P = await charger('projets.js');
  const p = P.creerProjet('Immeuble rue X');
  const e = P.ajouterElement(p, null, 'M1');
  const c = P.ajouterCalcul(p, e.id, { app: 'mur-en-l', adresse: '', nom: '' }, { h: '2', gammaBeton: '25' });
  const f1 = c.feuilles[0].id;
  const autres = ['2.8', '3.5', '4.2'].map((h) => {
    const f = P.dupliquerFeuille(c, f1);
    P.ecrireFeuille(c, f.id, { ...P.donneesDeFeuille(c, f.id), h });
    return f.id;
  });
  P.ecrireFeuille(c, f1, { h: '2', gammaBeton: '24' });
  assert.deepEqual(
    autres.map((id) => P.donneesDeFeuille(c, id)),
    [{ h: '2.8', gammaBeton: '24' }, { h: '3.5', gammaBeton: '24' }, { h: '4.2', gammaBeton: '24' }]
  );
  assert.throws(() => P.supprimerFeuille(c, f1), P.ErreurProjet);
});

test('depot en memoire de la copie', async () => {
  const P = await charger('projets.js');
  const S = await charger('projets-stockage.js');
  const d = S.depotEnMemoire();
  const p = P.creerProjet('A');
  await d.ecrire(p);
  assert.deepEqual(await d.lire(p.id), p);
});
