// Adresse d'un calcul importe (projets/adresse.js, audit R9).
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const charger = () => import(pathToFileURL(path.join(__dirname, '..', 'projets', 'adresse.js')).href);

test('pages de la suite acceptees', async () => {
  const { adresseSure } = await charger();
  assert.equal(adresseSure('https://henri421.github.io/pieux/', 'https://henri421.github.io'), 'https://henri421.github.io/pieux/');
  assert.equal(adresseSure('http://localhost:5199/pieux/', 'http://localhost:5199'), 'http://localhost:5199/pieux/');
});

test('autres sites, javascript: et adresses invalides refuses', async () => {
  const { adresseSure } = await charger();
  for (const a of ['https://exemple.com/pieux/', 'javascript:alert(1)', 'http://henri421.github.io/pieux/', 'https://henri421.github.io.evil.com/', 'pieux/', '', null, 42]) {
    assert.equal(adresseSure(a, 'https://henri421.github.io'), '', String(a));
  }
});
