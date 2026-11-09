// Note de projet : suit l'arbre, ne prend que les feuilles a justifier,
// et ne presente jamais un verdict perime comme valable.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const charger = (f) => import(pathToFileURL(path.join(__dirname, '..', 'projets', f)).href);
const T = (fr) => fr;

async function projet() {
  const P = await charger('projets.js');
  const p = P.creerProjet('Immeuble <X>');
  const e = P.ajouterElement(p, null, 'M1');
  const c = P.ajouterCalcul(p, e.id, { app: 'mur-en-l', adresse: 'u', nom: 'Mur' }, { h: 3 });
  const f1 = c.feuilles[0];
  const f2 = P.dupliquerFeuille(c, f1.id);
  P.ecrireFeuille(c, f2.id, { h: 4 });
  const f3 = P.dupliquerFeuille(c, f1.id);
  P.definirStatut(c, f3.id, 'etude');
  P.renommer(p, c.id, 'Mur');
  return { P, p, c, f1, f2, f3 };
}

test('ne retient que les feuilles a justifier, et echappe le texte', async () => {
  const { p, c, f1, f2, f3 } = await projet();
  const { noteDeProjetHtml } = await charger('note.js');
  const html = noteDeProjetHtml(p, T, () => 'Mur', '9/11/2026');
  assert.ok(html.includes('Immeuble &lt;X&gt;'));
  assert.ok(html.includes(`<td>${f1.nom}</td>`));
  assert.ok(html.includes(`<td>${f2.nom}</td>`));
  assert.ok(!html.includes(`<td>${f3.nom}</td>`));
  assert.ok(html.includes('h = 4'));
  assert.equal(c.feuilles.length, 3);
});

test('un verdict perime est signale et declenche la reserve', async () => {
  const { P, p, c, f1, f2 } = await projet();
  const { noteDeProjetHtml } = await charger('note.js');
  P.definirVerdict(c, f1.id, 'ok');
  P.definirVerdict(c, f2.id, 'ok');
  assert.ok(!noteDeProjetHtml(p, T, () => 'Mur', 'd').includes('class="reserve"'));
  P.ecrireFeuille(c, f1.id, { h: 9, l: 1 });
  const html = noteDeProjetHtml(p, T, () => 'Mur', 'd');
  assert.ok(html.includes('À recalculer'));
  assert.ok(html.includes('class="reserve"'));
});
