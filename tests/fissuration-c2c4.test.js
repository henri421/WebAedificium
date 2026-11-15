// Etape 10, C2 a C4 (audit du 10/11/2026, E1 a E3). Test d'acceptation : ne pas modifier.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { armatureMinimaleBridage, espacementFissures } = require('../asmin.js');

const proche = (obtenu, attendu, message) =>
  assert.ok(Math.abs(obtenu - attendu) <= Math.abs(attendu) * 1e-6, `${message} : obtenu ${obtenu}, attendu ${attendu}`);

const CAS = {
  h: 1300, b: 1000, cnom: 45, phi: 20, fck: 20, fyk: 500, Es: 200000,
  wk: 0.2, kzt: 0.8, kc: 1.0, phiStar: 13.54, sollicitation: 'traction', conventionK: 'ec2',
  scenario: 'tardif',
};

// --- C2 (E1) : sigma_s par defaut tire du diametre limite ---------------------------------

test('C2 : le hub ouvre sur sigma_s derive de phi* (7.3.3), plus sur f_yk', () => {
  const hub = fs.readFileSync(path.join(__dirname, '..', 'hub.js'), 'utf8');
  const def = hub.match(/const F_DEF=\{[\s\S]*?\};/);
  assert.ok(def, 'F_DEF introuvable dans hub.js');
  assert.match(def[0], /sigsMode:"phistar"/);
});

// --- C4 (E2) : plancher de 3,0 MPa reserve a la methode allemande -------------------------

test('C4 : bridage tardif, methode din : f_ct,eff = max(f_ctm ; 3,0)', () => {
  const r = armatureMinimaleBridage({ ...CAS, methode: 'din' });
  proche(r.fcteff, 3.0, 'fcteff din');
});

test('C4 : bridage tardif, methode ec2 (texte EN) : f_ct,eff = f_ctm, sans plancher', () => {
  const r = armatureMinimaleBridage({ ...CAS, methode: 'ec2' });
  proche(r.fcteff, 0.3 * Math.pow(20, 2 / 3), 'fcteff ec2');
  assert.ok(r.fcteff < 3.0);
});

// --- C3 (E3) : espacement au-dela de 5(c + phi/2) ----------------------------------------

const BASE = { c: 50, phi: 12, b: 1000, h: 1000, nappes: 2, rhoEff: 0.02, k1: 0.8, k2: 1.0, k3: 3.4, k4: 0.425 };
const aireBarre = Math.PI * 12 * 12 / 4;

test('C3 : barres serrees : s_r,max par l equation 7.11, sans avertissement', () => {
  const r = espacementFissures({ ...BASE, asprov: 8000 });
  proche(r.espacement, 1000 / (4000 / aireBarre), 'espacement');
  proche(r.limite, 5 * (50 + 6), 'limite 5(c + phi/2)');
  assert.equal(r.formule, '7.11');
  proche(r.srmax, 3.4 * 50 + 0.8 * 1.0 * 0.425 * 12 / 0.02, 'srmax 7.11');
  assert.equal(r.avertissement, null);
});

test('C3 : barres espacees au-dela de 5(c + phi/2) : s_r,max = 1,3 (h - x) (7.14) et avertissement', () => {
  const r = espacementFissures({ ...BASE, asprov: 800 });
  assert.ok(r.espacement > r.limite);
  assert.equal(r.formule, '7.14');
  proche(r.srmax, 1.3 * 1000, 'srmax 7.14, x = 0 par defaut (majorant)');
  assert.match(r.avertissement, /5\(c \+ φ\/2\)/);
  assert.match(r.avertissement, /7\.14/);
});

test('C3 : x saisi : s_r,max = 1,3 (h - x)', () => {
  const r = espacementFissures({ ...BASE, asprov: 800, x: 200 });
  proche(r.srmax, 1.3 * 800, 'srmax avec x');
});

test('C3 : le hub calcule s_r,max par espacementFissures, plus en ligne', () => {
  const hub = fs.readFileSync(path.join(__dirname, '..', 'hub.js'), 'utf8');
  assert.match(hub, /espacementFissures\(/);
  assert.doesNotMatch(hub, /r\.srmax=v\.k3\*v\.c\+/);
});
