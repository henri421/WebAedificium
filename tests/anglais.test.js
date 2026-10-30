// Version anglaise du hub (lot 8.8) : `en/index.html` charge le meme hub.js
// que la page francaise, et rien de francais ne s'affiche en anglais. hub.js
// tourne ici dans un DOM minimal : chaque page du hub est rendue, la page
// fissuration sous chaque option de ses listes.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const racine = path.join(__dirname, '..');
const lire = f => fs.readFileSync(path.join(racine, f), 'utf8');

/** Mots francais courants, accents ou non : aucun ne doit rester en anglais. */
const MOTS_FR = /(?<![\p{L}'])(de|la|le|les|du|des|et|pour|sur|par|une|est|avec|sans|aux|au|ou|dans|selon|entre|ne|pas|non|outil|outils|calcul|béton|beton|acier|armature|coupe|valeur|imposée?|retenu|nappe|face tendue|jours)(?![\p{L}'-])/iu;
const ACCENTS = /[àâäçéèêëîïôöùûüÿœæ]/i;

function texte(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<i lang="de">[\s\S]*?<\/i>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ');
}
/** Attributs lus par une personne : title, aria-label. */
const attributs = html => [...html.matchAll(/\s(?:title|aria-label)="([^"]*)"/g)].map(m => m[1]);

function constats(nom, html) {
  const morceaux = [...texte(html).split(/(?<=[.:;!?])\s|\s[·—|]\s/), ...attributs(html)];
  return morceaux
    .filter(m => !/Version française/.test(m))
    .filter(m => ACCENTS.test(m) || MOTS_FR.test(m))
    .map(m => `${nom} : « ${m.trim().slice(0, 140)} »`);
}

/** Un DOM juste assez grand pour hub.js. */
function monter(langue, hash) {
  const elements = new Map();
  const vue = { innerHTML: '' };
  const element = id => {
    if (!elements.has(id)) {
      const select = new RegExp(`<select id="${id}"`).test(vue.innerHTML);
      const options = select ? [...vue.innerHTML.split(`<select id="${id}"`)[1].split('</select>')[0].matchAll(/value="([^"]*)"/g)].map(m => m[1]) : [];
      elements.set(id, {
        id, innerHTML: '', textContent: '', value: '', className: '', options,
        tagName: select ? 'SELECT' : 'DIV',
        addEventListener() {}, setAttribute() {}, removeAttribute() {},
        classList: { toggle() {} },
      });
    }
    return elements.get(id);
  };
  const document = {
    documentElement: { lang: langue },
    title: '',
    body: { classList: { toggle() {}, contains: () => false } },
    getElementById: id => (id === 'view' ? vue : element(id)),
    querySelectorAll: () => [],
    addEventListener() {},
  };
  const window = { addEventListener() {}, scrollTo() {} };
  const contexte = {
    document, window, location: { hash },
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    navigator: {}, setTimeout, console, Math, Number, String, Object, Array, Set, Map, RegExp, JSON, isFinite, parseFloat,
  };
  window.document = document;
  vm.createContext(contexte);
  vm.runInContext(lire('asmin.js'), contexte, { filename: 'asmin.js' });
  vm.runInContext(lire('hub.js'), contexte, { filename: 'hub.js' });
  return { vue, element, contexte, elements };
}

/** Tout ce qu'affiche une page rendue : la vue et les champs remplis par script. */
function affichage(m) {
  return [m.vue.innerHTML, m.element('menu').innerHTML, ...[...m.elements.values()].map(e => e.innerHTML + ' ' + e.textContent), m.contexte.document.title].join('\n');
}

const ROUTES = ['accueil', 'en1990', 'en1991', 'en1992', 'en1993', 'en1996', 'en1997', 'outils', 'fissuration'];
const LISTES = ['s', 'mode', 'methode', 'convK', 'sigsMode', 'cas'];

test('page anglaise : meme squelette, langue, chemins, lien FR', () => {
  const fr = lire('index.html');
  const en = lire('en/index.html');
  const ids = h => [...h.matchAll(/\sid="([^"]*)"/g)].map(m => m[1]);
  assert.deepEqual(ids(en), ids(fr));
  assert.match(en, /<html lang="en">/);
  assert.match(en, /href="\.\.\/hub\.css"/);
  assert.match(en, /src="\.\.\/asmin\.js"/);
  assert.match(en, /src="\.\.\/hub\.js"/);
  assert.match(en, /class="barre-langue" id="langue" href="\.\.\/"/);
  assert.match(fr, /class="barre-langue" id="langue" href="en\/"/);
  assert.deepEqual(constats('page', en.replace(/<script[\s\S]*?<\/script>/g, '')), []);
});

test('chaque page du hub, en anglais, sans francais', () => {
  const trouves = [];
  for (const route of ROUTES) {
    const m = monter('en', '#' + route);
    trouves.push(...constats(route, affichage(m)));
  }
  assert.deepEqual(trouves, []);
});

test('fissuration en anglais : chaque option, la synthese copiee, les avertissements', () => {
  const trouves = [];
  for (const liste of LISTES) {
    const m0 = monter('en', '#fissuration');
    for (const valeur of m0.element(liste).options) {
      const m = monter('en', '#fissuration');
      m.element(liste).value = valeur;
      // Un d1 impose au-dela de h/2 declenche les deux avertissements.
      m.element('impD1').value = '600';
      vm.runInContext('fissRender()', m.contexte);
      trouves.push(...constats(`${liste}=${valeur}`, affichage(m)));
      let copie = '';
      m.contexte.navigator.clipboard = { writeText: t => { copie = t; return { then() {} }; } };
      vm.runInContext('copySummary({ textContent: "" })', m.contexte);
      trouves.push(...constats(`${liste}=${valeur} synthese`, copie.replace(/\n/g, ' | ')));
    }
  }
  assert.deepEqual(trouves, []);
});

test('outils publies : version anglaise quand elle existe, mention sinon', () => {
  const m = monter('en', '#accueil');
  const html = affichage(m);
  assert.match(html, /https:\/\/henri421\.github\.io\/section-uls\/en\//);
  assert.match(html, /https:\/\/henri421\.github\.io\/beam\/en\//);
  assert.match(html, /https:\/\/henri421\.github\.io\/Fondbis\/"[^>]*>[\s\S]*?French only/);
  assert.match(html, /src="\.\.\/icones\/sectionUls\.svg"/);
});

test('la page francaise ne change pas : liens, icones, textes', () => {
  const m = monter('fr', '#accueil');
  const html = affichage(m);
  assert.match(html, /href="https:\/\/henri421\.github\.io\/section-uls\/"/);
  assert.match(html, /src="icones\/sectionUls\.svg"/);
  assert.match(html, /Tous les outils/);
  assert.doesNotMatch(html, /French only|\/en\//);
  const f = monter('fr', '#fissuration');
  assert.match(affichage(f), /Armature minimale de fissuration/);
  assert.match(affichage(f), /0,30 · 30\^\(2\/3\)/);
});
