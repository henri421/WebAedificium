const test = require('node:test');
const assert = require('node:assert/strict');
const { armatureMinimaleBridage, hauteurEfficace, facteurK } = require('../asmin.js');

/** Le cas de validation de SPEC_correction_Asmin_bridage.md §7. */
const CAS = {
  h: 1300, b: 1000, cnom: 45, phi: 20,
  fck: 30, fyk: 500, Es: 200000,
  wk: 0.20, kzt: 0.80, kc: 1.0,
  phiStar: 13.54,
  sollicitation: 'traction',
  conventionK: 'ec2',
};

/** Tolérance 1 %, celle que la spec accorde. */
function proche(obtenu, attendu, message) {
  assert.ok(
    Math.abs(obtenu - attendu) <= Math.abs(attendu) * 0.01,
    `${message} : obtenu ${obtenu}, attendu ${attendu}`
  );
}

test('hauteurEfficace : les branches de la TRACTION CENTREE, pas celles de la flexion', () => {
  // h/d1 = 1300/55 = 23,6 -> branche 5 a 30 : 0,10h + 2 d1 = 240 mm.
  proche(hauteurEfficace(1300, 55, 'traction'), 240, 'hcef traction centree');

  // La meme geometrie lue en FLEXION tombe dans une autre branche : c'est
  // exactement la confusion qui sous-estimait l'armature de 43 %.
  proche(hauteurEfficace(1300, 55, 'flexion'), 0.05 * 1300 + 2 * 55, 'hcef flexion');

  // Branches extremes.
  proche(hauteurEfficace(200, 50, 'traction'), 100, 'ratio < 5 : 2,5 d1 ecrete a h/2');
  proche(hauteurEfficace(3000, 50, 'traction'), 250, 'ratio >= 30 : 5 d1');
});

test('hauteurEfficace : jamais plus que h/2', () => {
  assert.ok(hauteurEfficace(300, 60, 'traction') <= 150);
  assert.ok(hauteurEfficace(1300, 55, 'traction') <= 650);
});

test('facteurK : les deux conventions, sans melanger leurs bornes', () => {
  proche(facteurK(1300, 'ec2'), 0.65, 'k EC2 sur element massif');
  proche(facteurK(1300, 'de'), 0.50, 'k allemand sur element massif');
  proche(facteurK(200, 'ec2'), 1.0, 'k EC2 sur element mince');
  proche(facteurK(200, 'de'), 0.8, 'k allemand sur element mince');
  proche(facteurK(550, 'ec2'), 1.0 - (250 / 500) * 0.35, 'k EC2 interpole');
  proche(facteurK(550, 'de'), 0.8 - (250 / 500) * 0.30, 'k allemand interpole');
});

test('les valeurs intermediaires du cas de validation', () => {
  const r = armatureMinimaleBridage(CAS);

  proche(r.fctm, 2.896, 'fctm');
  proche(r.fcteff, 2.317, 'fcteff');
  proche(r.d1, 55, 'd1');
  proche(r.hcef, 240, 'hcef');
  proche(r.Act, 1300000, 'Act total');
  proche(r.Aceff, 240000, 'Aceff une face');
  proche(r.k, 0.65, 'k');
  proche(r.sigs, 202.7, 'sigs');
});

test('convention EC2 : 48,30 / 27,44, l approche epaisse gouverne', () => {
  const r = armatureMinimaleBridage(CAS);

  proche(r.AsMinceParNappe / 100, 48.30, 'As_mince cm2/m par nappe');
  proche(r.AsEpaisParNappe / 100, 27.44, 'As_epais cm2/m par nappe');
  proche(r.AsMinParNappe / 100, 27.44, 'As,min retenu cm2/m par nappe');
  assert.equal(r.approcheRetenue, 'epaisse');
});

test('convention allemande : 37,16 / 27,44, meme resultat retenu', () => {
  const r = armatureMinimaleBridage({ ...CAS, conventionK: 'de' });

  proche(r.k, 0.50, 'k allemand');
  proche(r.AsMinceParNappe / 100, 37.16, 'As_mince cm2/m par nappe');
  proche(r.AsMinParNappe / 100, 27.44, 'As,min retenu cm2/m par nappe');
});

/**
 * LE FACTEUR 2, cause classique d ecart avec une feuille de calcul : le total
 * et la nappe doivent etre nommes tous les deux, jamais confondus.
 */
test('le total et la valeur par nappe sont rendus separement', () => {
  const r = armatureMinimaleBridage(CAS);

  assert.equal(r.nappes, 2);
  proche(r.AsMinTotal, r.AsMinParNappe * 2, 'total = 2 x par nappe');
  proche(r.AsMinTotal / 100, 54.88, 'As,min total cm2/m');
});

/**
 * k traduit une reduction a l echelle de la SECTION ENTIERE. L approche par
 * zone efficace raisonne sur la peau qui travaille : l y appliquer une
 * seconde fois retirerait 35 % d acier, du mauvais cote.
 */
test('l approche epaisse ne depend NI de k NI de kc', () => {
  const ec2 = armatureMinimaleBridage(CAS);
  const de = armatureMinimaleBridage({ ...CAS, conventionK: 'de' });

  proche(de.AsEpaisParNappe, ec2.AsEpaisParNappe, 'As_epais insensible a k');
});

test('la borne anti-plastification est calculee et rendue', () => {
  const r = armatureMinimaleBridage(CAS);

  // k · fcteff · Act / fyk = 0,65 · 2,317 · 1,3e6 / 500, par nappe.
  proche(r.BorneParNappe / 100, 19.58, 'borne cm2/m par nappe');
  // Elle ne gouverne pas sur ce cas.
  assert.ok(r.BorneParNappe < r.AsEpaisParNappe);
});

test('la borne gouverne quand la zone efficace devient tres mince', () => {
  // Un element mince : hcef est ecrete a h/2, l approche mince gouverne.
  const r = armatureMinimaleBridage({ ...CAS, h: 250 });

  assert.equal(r.approcheRetenue, 'mince');
  proche(r.hcef, 125, 'hcef ecrete a h/2');
});

test('le bridage TARDIF ignore kzt et applique le plancher de 3,0 MPa', () => {
  const r = armatureMinimaleBridage({ ...CAS, scenario: 'tardif' });

  // max(fctm, 3,0) = 3,0 puisque fctm = 2,896.
  proche(r.fcteff, 3.0, 'fcteff tardif');
  assert.ok(r.AsMinParNappe > armatureMinimaleBridage(CAS).AsMinParNappe);
});

test('sigs peut etre impose plutot que derive de phiStar', () => {
  const r = armatureMinimaleBridage({ ...CAS, sigs: 250, phiStar: undefined });

  proche(r.sigs, 250, 'sigs impose');
  assert.equal(r.sigsSource, 'impose');
});

test('une fcteff imposee court-circuite kzt et le scenario', () => {
  const r = armatureMinimaleBridage({ ...CAS, fcteffImpose: 1.9 });
  proche(r.fcteff, 1.9, 'fcteff imposee');

  const tardif = armatureMinimaleBridage({ ...CAS, scenario: 'tardif', fcteffImpose: 1.9 });
  proche(tardif.fcteff, 1.9, 'l imposition l emporte sur le scenario');
});

test('refuse une entree qui rendrait le resultat absurde', () => {
  assert.throws(() => armatureMinimaleBridage({ ...CAS, h: 0 }), /hauteur/);
  assert.throws(() => armatureMinimaleBridage({ ...CAS, phiStar: 0, sigs: undefined }), /phiStar/);
  assert.throws(
    () => armatureMinimaleBridage({ ...CAS, impose: { d1: -5 } }),
    /enrobage/
  );
});

// --- Choix de la methode --------------------------------------------------

test('methode ec2 : le TEXTE de la norme, 2,5 d1 ecrete a h/2', () => {
  const r = armatureMinimaleBridage({ ...CAS, methode: 'ec2' });

  // 2,5 x 55 = 137,5 mm — la valeur que le code donnait par erreur, et qui
  // est ici le choix EXPLICITE du texte europeen.
  proche(r.hcef, 137.5, 'hcef methode EC2');
  assert.equal(r.methode, 'ec2');
});

test('methode din : les branches de la pratique allemande', () => {
  const r = armatureMinimaleBridage({ ...CAS, methode: 'din' });
  proche(r.hcef, 240, 'hcef methode DIN');
});

test('la methode est le defaut DIN, et elle est independante de la convention de k', () => {
  // Le tableau de la spec §7 croise les deux conventions de k avec les MEMES
  // branches de hcef : k est un parametre d annexe nationale, la formule de
  // hcef est un choix de methode. Les lier interdirait « branches allemandes,
  // k de l annexe belge », qui est parfaitement legitime.
  const a = armatureMinimaleBridage({ ...CAS, methode: 'din', conventionK: 'ec2' });
  const b = armatureMinimaleBridage({ ...CAS, methode: 'din', conventionK: 'de' });

  proche(a.hcef, b.hcef, 'hcef ne depend pas de la convention de k');
  proche(a.k, 0.65, 'k EC2');
  proche(b.k, 0.50, 'k allemand');
});

test('la methode ec2 exige plus d acier ici, et c est coherent', () => {
  const ec2 = armatureMinimaleBridage({ ...CAS, methode: 'ec2' });
  const din = armatureMinimaleBridage({ ...CAS, methode: 'din' });

  // hcef plus petit -> zone efficace plus petite -> As_epais plus petit ->
  // l approche epaisse gouverne encore plus nettement.
  assert.ok(ec2.AsEpaisParNappe < din.AsEpaisParNappe);
});

// --- Forcage de n importe quelle grandeur ---------------------------------

test('chaque grandeur peut etre imposee et court-circuite sa formule', () => {
  const r = armatureMinimaleBridage({ ...CAS, impose: { hcef: 300 } });

  proche(r.hcef, 300, 'hcef impose');
  proche(r.Aceff, 300 * 1000, 'Aceff suit le hcef impose');
  assert.equal(r.sources.hcef, 'impose');
  assert.equal(r.sources.Aceff, 'calcule');
});

test('une grandeur imposee alimente la suite de la chaine', () => {
  // d1 impose change hcef, qui change Aceff, qui change As_epais.
  const base = armatureMinimaleBridage(CAS);
  const force = armatureMinimaleBridage({ ...CAS, impose: { d1: 80 } });

  proche(force.d1, 80, 'd1 impose');
  proche(force.hcef, 0.1 * 1300 + 2 * 80, 'hcef recalcule sur le d1 impose');
  assert.ok(force.AsEpaisParNappe > base.AsEpaisParNappe);
});

test('fcteff impose se propage jusqu a sigs', () => {
  const r = armatureMinimaleBridage({ ...CAS, impose: { fcteff: 3.0 } });

  proche(r.fcteff, 3.0, 'fcteff impose');
  proche(r.sigs, Math.sqrt((6 * 0.2 * 200000 * 3.0) / 13.54), 'sigs suit fcteff');
  assert.equal(r.sources.fcteff, 'impose');
});

/**
 * LA REGLE QUI REND LE FORCAGE ACCEPTABLE : une note de calcul qui
 * presenterait une valeur imposee comme calculee ne serait verifiable par
 * personne.
 */
test('sources dit pour CHAQUE grandeur si elle est calculee ou imposee', () => {
  const r = armatureMinimaleBridage({ ...CAS, impose: { k: 0.55, Act: 900000 } });

  assert.equal(r.sources.k, 'impose');
  assert.equal(r.sources.Act, 'impose');
  assert.equal(r.sources.fctm, 'calcule');
  assert.equal(r.sources.hcef, 'calcule');
  assert.equal(r.sources.d1, 'calcule');

  proche(r.k, 0.55, 'k impose');
  proche(r.Act, 900000, 'Act impose');
});

test('une valeur imposee vide ou illisible retombe sur le calcul', () => {
  const r = armatureMinimaleBridage({ ...CAS, impose: { hcef: '', k: null, Act: undefined } });

  proche(r.hcef, 240, 'hcef calcule');
  assert.equal(r.sources.hcef, 'calcule');
  assert.equal(r.sources.k, 'calcule');
});

/**
 * Le forcage ne declenche AUCUN garde-fou silencieux : ecreter retirerait a
 * l ingenieur la decision qu il vient explicitement de prendre, ne rien dire
 * la lui laisserait prendre a l aveugle.
 */
test('une zone efficace imposee au-dela de la section AVERTIT sans ecreter', () => {
  const r = armatureMinimaleBridage({ ...CAS, impose: { hcef: 900 } });

  proche(r.hcef, 900, 'la valeur imposee est employee telle quelle');
  assert.equal(r.avertissements.length, 1);
  assert.match(r.avertissements[0], /depasse la section/);
});

test('le chemin CALCULE reste ecrete a h/2, lui', () => {
  const r = armatureMinimaleBridage({ ...CAS, h: 250 });

  proche(r.hcef, 125, 'hcef calcule ecrete');
  assert.equal(r.avertissements.length, 0);
});

test('un enrobage d axe impose au-dela de h/2 avertit', () => {
  const r = armatureMinimaleBridage({ ...CAS, impose: { d1: 700 } });

  assert.ok(r.avertissements.some((a) => /demi-epaisseur/.test(a)));
});

test('sans forcage, aucun avertissement et tout est calcule', () => {
  const r = armatureMinimaleBridage(CAS);

  assert.deepEqual(r.avertissements, []);
  for (const nom of ['fctm', 'fcteff', 'd1', 'hcef', 'k', 'kc', 'Act', 'Aceff']) {
    assert.equal(r.sources[nom], 'calcule', nom + ' devrait etre calcule');
  }
});
