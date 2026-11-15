// README du hub genere depuis GROUPES (etape 10, D1 ; audit I1-I3) et renvoi EN 1997 du mur en L (D8, I12).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const charger = () => import(pathToFileURL(path.join(__dirname, '..', 'scripts', 'readme.mjs')).href);
const readme = () => fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');

test('le tableau des outils du README est a jour (node scripts/readme.mjs)', async () => {
  const R = await charger();
  assert.equal(readme().replace(/\r\n/g, '\n'), R.readmeAJour(readme()).replace(/\r\n/g, '\n'));
});

test('chaque outil publie des GROUPES figure une fois dans le README', async () => {
  const R = await charger();
  const t = readme();
  for (const g of R.groupes()) {
    for (const o of g.outils) {
      if (o.renvoi || !o.href) continue;
      assert.ok(t.includes(`(${o.href})`), `${R.texte(o.nom)} absent du README`);
    }
  }
  assert.doesNotMatch(t, /Fondbis|fondbis/);
});

test('D8 : le mur en L est aussi range sous EN 1997, en simple renvoi', async () => {
  const R = await charger();
  const g = R.groupes().find((x) => x.id === 'en1997');
  const mur = g.outils.find((o) => /mur-en-l/.test(o.href ?? ''));
  assert.ok(mur, 'mur en L absent du groupe EN 1997');
  assert.equal(mur.renvoi, true);
});

test('texte : indices et entites convertis, barres echappees', async () => {
  const R = await charger();
  assert.equal(R.texte('K<sub>a</sub> &sect;6.2 a|b'), 'K_a §6.2 a\\|b');
});
