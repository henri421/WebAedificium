// Partie pure du controle des versions (scripts/versions.mjs), sans reseau.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const charger = () => import(pathToFileURL(path.join(__dirname, '..', 'scripts', 'versions.mjs')).href);

test('depots tires de OUTILS_EXTERNES du hub', async () => {
  const { depotsDuHub } = await charger();
  const depots = depotsDuHub(fs.readFileSync(path.join(__dirname, '..', 'hub.js'), 'utf8'));
  assert.ok(depots.includes('beam'));
  assert.ok(depots.includes('maconnerie'));
  assert.ok(!depots.includes('Fondbis'));
});

test('tags compares numeriquement', async () => {
  const { compare, dernier } = await charger();
  assert.ok(compare('v0.10.0', 'v0.9.1') > 0);
  assert.equal(dernier(['v1.6.3', 'v1.10.0', 'v1.2.0']), 'v1.10.0');
});

test('constats : tag en retard et src non publie', async () => {
  const { constats } = await charger();
  const lignes = constats({
    paquets: {
      beam: { dependencies: { 'section-uls': 'github:henri421/section-uls#v0.1.0', 'aedificium-ui': 'github:henri421/aedificium-ui#v1.6.3' } },
      pieux: { dependencies: { 'sol-ec7': 'github:henri421/sol-ec7#v0.3.0' } },
      casse: null,
    },
    tags: { 'section-uls': ['v0.1.0', 'v0.2.1'], 'aedificium-ui': ['v1.6.3'], 'sol-ec7': ['v0.3.0'] },
    srcDepuisTag: { 'sections-ec3': ['70e8fa5'], 'sol-ec7': [] },
  });
  assert.equal(lignes.length, 3);
  assert.match(lignes[0], /beam.*section-uls#v0\.1\.0.*v0\.2\.1/);
  assert.match(lignes[1], /casse/);
  assert.match(lignes[2], /sections-ec3.*1 commit/);
});

test('rien a signaler quand tout est a jour', async () => {
  const { constats } = await charger();
  assert.deepEqual(constats({ paquets: { pieux: { dependencies: { 'sol-ec7': 'github:henri421/sol-ec7#v0.3.0' } } }, tags: { 'sol-ec7': ['v0.3.0'] }, srcDepuisTag: {} }), []);
});
