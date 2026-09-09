# Correction de l'armature minimale sous bridage centré — plan d'implémentation

> **Pour un agent exécutant :** SOUS-SKILL REQUISE — `superpowers:subagent-driven-development` (recommandé) ou `superpowers:executing-plans`, tâche par tâche. Les étapes sont des cases à cocher (`- [ ]`).

**Objectif :** corriger la chaîne de calcul de `As,min` sous bridage centré dans les **deux** outils qui la portent, de sorte que le cas de validation de `SPEC_correction_Asmin_bridage.md` §7 tombe exactement dans l'un comme dans l'autre.

**Architecture :** la physique corrigée est écrite **une fois par dépôt**, dans une fonction pure sans DOM, et le cas de validation §7 sert de contrat numérique commun. Structura reçoit un fichier `asmin.js` chargé en script classique (son script en ligne ne peut pas devenir un module : `index.html` porte des `onclick` en ligne — `toggleNav`, `copySummary`, `resetFiss` — qui exigent la portée globale). section-uls corrige son module TypeScript existant `src/detailing/restraint.ts`.

**Pile :** Structura = HTML/JS sans build ni dépendance, tests par `node --test` (runner intégré à Node, zéro dépendance). section-uls = TypeScript strict + Vitest.

---

## Pourquoi deux dépôts dans un seul plan

La skill `writing-plans` demande un plan par sous-système. J'y déroge **délibérément**, pour une raison précise : les deux outils calculent la même grandeur, et c'est justement leur divergence qui a produit l'écart avec la feuille de référence. Les planifier séparément, c'est accepter qu'ils repartent de deux lectures différentes de la même clause. Le contrat numérique ci-dessous est écrit **une fois** et vérifié **deux fois**.

Les deux dépôts restent autonomes : aucun code n'est partagé, aucune dépendance n'est créée entre eux. C'est le **cas de test** qui est commun, pas le code.

---

## Contrat numérique commun (spec §7)

Toute implémentation doit reproduire ceci, tolérance 1 %.

**Entrées** (longueurs en mm dans le code, la spec les donne en m) :

```
h = 1300 mm    b = 1000 mm    cnom = 45 mm    phi = 20 mm
fck = 30 MPa   fyk = 500 MPa  Es = 200000 MPa
wk = 0.20 mm   kzt = 0.80     kc = 1.0        phiStar = 13.54 mm
```

**Intermédiaires :**

| Grandeur | Valeur | Unité |
|---|---|---|
| `fctm` | 2,896 | MPa |
| `fcteff = kzt·fctm` | 2,317 | MPa |
| `d1 = cnom + phi/2` | 55 | mm |
| `h/d1` | 23,64 | — |
| `hcef` (branche 5–30) | 240 | mm |
| `Act` (total, traction centrée) | 1 300 000 | mm² |
| `Aceff` (**une** face) | 240 000 | mm² |
| `k_ec2` | 0,65 | — |
| `k_de` | 0,50 | — |
| `sigs` | 202,7 | MPa |

**Résultats, en cm²/m PAR NAPPE :**

| Convention | `As_mince` | `As_epais` | retenu |
|---|---|---|---|
| allemande (`k = 0,50`) | 37,16 | 27,44 | **27,44** |
| EC2 (`k = 0,65`) | 48,30 | 27,44 | **27,44** |

### ⚠ Le piège du facteur 2, à ne jamais laisser implicite

La spec exprime `Act = 0,5·h·b` et rend un résultat **par nappe**. Les deux codes existants raisonnent en **total** (`Act = b·h` en traction centrée). Les deux lectures sont justes et diffèrent d'un facteur 2 : c'est exactement le genre d'écart qui fait dire « je n'ai pas les mêmes résultats que ma feuille ».

**Décision, à appliquer dans les deux dépôts :** le calcul se fait en **TOTAL** — c'est la grandeur de l'équation (7.1) de l'EN 1992-1-1 — et le résultat est rendu **avec les deux valeurs, chacune nommée** : `AsMinTotal` et `AsMinParNappe = AsMinTotal / nombreDeNappes`. Aucun affichage ne montre un nombre sans dire lequel des deux il est.

En total, le contrat devient :

```
As_mince_total = k · kc · fcteff · (b·h) / sigs
As_epais_total = 2 · fcteff · Aceff / sigs          # deux faces
borne_total    = k · fcteff · (b·h) / fyk
As_total       = min(As_mince_total, max(As_epais_total, borne_total))
```

Vérification (k = 0,65) : `As_mince_total` = 9661,5 mm² → 48,31 cm²/m par nappe. `As_epais_total` = 5488,0 mm² → 27,44. `borne_total` = 3916,1 mm² → 19,58. Retenu 5488,0 → **27,44 cm²/m par nappe** ✓

### ⚠ `k` et `kc` ne s'appliquent PAS à l'approche épaisse

C'est le troisième écart, et il n'est pas dans la liste de la spec §3. Les deux codes appliquent aujourd'hui `k·kc` à la zone efficace. La spec ne les applique **qu'à l'approche mince** (`terme1 = fcteff·Aceff/sigs`, sans `k`), et sa §7 le confirme explicitement : « le terme `terme1` vaut 27,44 et **ne dépend pas de `k`** ».

Physiquement : `k` traduit la réduction de l'effort par les contraintes d'auto-équilibre à l'échelle de la section entière. L'approche par zone efficace ne raisonne plus sur la section entière mais sur la peau qui travaille réellement, où cette réduction n'a pas lieu d'être appliquée une seconde fois.

Sans cette correction, les deux codes rendraient 17,8 au lieu de 27,44 — soit **35 % d'acier de moins**, du mauvais côté.

### Deux choix de l'ingénieur : la MÉTHODE, et le FORÇAGE de n'importe quelle grandeur

Ce sont deux mécanismes distincts, et il ne faut pas les confondre.

**1. La méthode** — quelle famille de formules gouverne `hc,ef` :

| `methode` | `hc,ef` | Origine |
|---|---|---|
| `ec2` | `min(2,5·d1 ; h/2)` | **Texte** de l'EN 1992-1-1 §7.3.2(3) |
| `din` | branches selon `h/d1` (5 et 30 en traction, 10 et 60 en flexion) | Pratique allemande (Schneider ; Fingerloos, Hegger, Zilch) |

Le terme `(h−x)/3` du §7.3.2(3) ne figure dans aucune des deux : il suppose un axe neutre de section **fissurée en flexion**, qui n'a pas de sens à l'instant de la première fissure sous bridage.

**La convention de `k` reste un choix SÉPARÉ** (`ec2` : 1,00→0,65 ; `de` : 0,80→0,50). C'est ce que fait la spec elle-même en §7, où le tableau croise les deux conventions de `k` avec les **mêmes** branches de `hc,ef` : `k` est un paramètre d'annexe nationale, la formule de `hc,ef` est un choix de méthode. Les lier interdirait la combinaison parfaitement légitime « branches allemandes, `k` de l'annexe belge ».

**2. Le forçage** — toute grandeur intermédiaire peut être imposée à la main :

```
fctm   fcteff   d1   hcef   k   kc   Act   Aceff   sigs
```

Une valeur imposée **court-circuite sa formule** et alimente la suite de la chaîne normalement — imposer `d1` change `hc,ef`, imposer `fcteff` change `σs`.

**LA RÈGLE QUI REND CE MÉCANISME ACCEPTABLE :** toute grandeur imposée est **marquée comme telle**, dans le résultat, à l'écran et dans la note de calcul. Une note qui présenterait un `hc,ef` imposé comme s'il était calculé ne serait vérifiable par personne — et c'est précisément ce à quoi une note de calcul sert. Le résultat porte donc un dictionnaire `sources` qui dit, pour chaque grandeur, `'calcule'` ou `'impose'`.

**Le forçage ne déclenche aucun garde-fou silencieux.** Si une valeur imposée sort du domaine physique — `hc,ef` tel que les deux faces couvrent plus que la section, `d1 ≥ h/2` — le module rend un **avertissement** dans `avertissements[]` et **calcule quand même avec la valeur donnée**. Écrêter en silence retirerait à l'ingénieur la décision qu'il vient explicitement de prendre ; ne rien dire la lui laisserait prendre à l'aveugle.

Le garde `hc,ef ≤ h/2` reste en revanche appliqué sur le chemin **calculé** : là, c'est la formule qui doit rester dans son domaine.

### Réserves normatives à porter dans les deux outils

À écrire dans le code **et** à l'écran, pas seulement ici :

1. Les branches de `hcef` en traction centrée (seuils 5 et 30, coefficient 0,10) **ne sont pas le texte de l'EN 1992-1-1**, dont le §7.3.2(3) écrit `hc,ef = min(2,5(h−d) ; (h−x)/3 ; h/2)`. Elles viennent de la pratique allemande (Schneider *Bautabellen*, Fingerloos/Hegger/Zilch). C'est un **écart documenté**, du même ordre que celui que `restraint.ts` assume déjà pour `effectiveZoneOnly`.
2. `k` est un paramètre national : 1,0/0,65 recommandé, 0,8/0,5 en annexe allemande. En Belgique et au Luxembourg, la justification reste l'EN 1992-1-1 et ses annexes NBN / ILNAS.
3. `phiStar` et la définition de `hcr` restent à confirmer (spec §4.7). **`phiStar` est donc une ENTRÉE, jamais recalculé** — c'est la recommandation de la spec elle-même, et on s'y tient.
4. Le plancher `fct,eff ≥ 3,0 MPa` du bridage tardif est une valeur recommandée, modifiable en annexe nationale.

---

# Phase A — Structura

## Structure de fichiers

- Créer : `/home/hnr/Downloads/code/Structura/asmin.js` — la chaîne de calcul pure, sans DOM. Script **classique** (pas un module), avec un garde d'export CommonJS pour que Node puisse le charger.
- Créer : `/home/hnr/Downloads/code/Structura/tests/asmin.test.js` — le cas §7, par `node --test`.
- Modifier : `/home/hnr/Downloads/code/Structura/index.html` — charger `asmin.js`, brancher `fissCompute` dessus, ajouter les champs.
- Modifier : `/home/hnr/Downloads/code/Structura/README.md` — la commande de test.

---

### Tâche A1 : le module de calcul pur et son test

**Fichiers :**
- Créer : `Structura/asmin.js`
- Créer : `Structura/tests/asmin.test.js`

- [ ] **Étape 1 : écrire le test qui échoue**

`Structura/tests/asmin.test.js` :

```js
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
```

- [ ] **Étape 2 : lancer le test et vérifier qu'il échoue**

```bash
cd /home/hnr/Downloads/code/Structura && node --test
```

Attendu : ÉCHEC, `Cannot find module '../asmin.js'`.

- [ ] **Étape 3 : écrire `asmin.js`**

`Structura/asmin.js` :

```js
/*
 * Armature minimale de maitrise de la fissuration sous BRIDAGE CENTRE
 * (zentrischer Zwang), EN 1992-1-1 §7.3.2 et §7.3.3.
 *
 * SCRIPT CLASSIQUE, pas un module : index.html porte des `onclick` en ligne
 * (toggleNav, copySummary, resetFiss) qui exigent la portee globale, et son
 * script en ligne ne peut donc pas devenir un module. Le garde d'export en
 * bas de fichier permet neanmoins a Node de le charger pour les tests, sans
 * build ni dependance.
 *
 * FONCTIONS PURES, sans DOM : c'est ce qui rend testable tout ce qui peut se
 * tromper, et ce sont precisement ces formules qui se trompaient.
 *
 * ⚠ ECART DOCUMENTE AU TEXTE DE L'EN 1992-1-1. Les branches de `hcef` en
 * traction centree (seuils 5 et 30, coefficient 0,10) ne figurent pas dans
 * la norme europeenne, dont le §7.3.2(3) ecrit
 * `hc,ef = min(2,5(h−d) ; (h−x)/3 ; h/2)`. Elles viennent de la pratique
 * allemande (Schneider Bautabellen ; Fingerloos, Hegger, Zilch). En Belgique
 * et au Luxembourg, la justification reglementaire reste l'EN 1992-1-1 et
 * ses annexes nationales.
 *
 * Unites : longueurs en mm, contraintes en MPa (N/mm²), aires en mm². Avec
 * une largeur `b = 1000`, les aires sont donc des mm²/m.
 */

/** Resistance moyenne en traction (MPa), EN 1992-1-1 tableau 3.1. */
function fctmDepuisFck(fck) {
  return fck <= 50 ? 0.3 * Math.pow(fck, 2 / 3) : 2.12 * Math.log(1 + (fck + 8) / 10);
}

/**
 * Facteur `k` des contraintes d'auto-equilibre (§7.3.2(2)).
 *
 * PARAMETRE NATIONAL, d'ou les deux conventions. Ne jamais melanger la
 * pente de l'une avec les bornes de l'autre : c'est l'erreur que la spec
 * signale en deuxieme position.
 *
 *   ec2 : 1,00 (h <= 300) -> 0,65 (h >= 800)   valeurs recommandees
 *   de  : 0,80 (h <= 300) -> 0,50 (h >= 800)   annexe nationale allemande
 */
function facteurK(hMm, convention) {
  const haut = convention === 'de' ? 0.8 : 1.0;
  const bas = convention === 'de' ? 0.5 : 0.65;

  if (hMm <= 300) return haut;
  if (hMm >= 800) return bas;
  return haut - ((hMm - 300) / 500) * (haut - bas);
}

/**
 * Hauteur de la zone de beton tendu efficace (mm). LE POINT CRITIQUE.
 *
 * En traction centree, la zone efficace CROIT avec l'epaisseur, contrairement
 * a la zone de rive figee de la flexion : apres la premiere fissure
 * traversante, l'acier reintroduit l'effort sur une longueur d'introduction,
 * et dans un element epais les barres sont trop espacees pour agir sur tout
 * le coeur — il se forme des fissures secondaires pres des barres, ce qui
 * approfondit leur zone d'influence.
 *
 * Employer les branches de la FLEXION ici — ce que faisait le code — fait
 * tomber `hcef` de 240 a 137,5 mm sur le cas de validation, soit environ
 * 43 % d'armature en moins.
 */
function hauteurEfficace(h, d1, sollicitation, methode) {
  let hcef;

  if (methode === 'ec2') {
    // TEXTE de l'EN 1992-1-1 §7.3.2(3) : hc,ef = min(2,5(h−d) ; (h−x)/3 ; h/2),
    // avec (h−d) = d1. Le terme (h−x)/3 est ECARTE : il suppose un axe neutre
    // de section FISSUREE EN FLEXION, qui n'a pas de sens a l'instant de la
    // premiere fissure sous bridage.
    hcef = 2.5 * d1;
  } else {
    const ratio = h / d1;
    if (sollicitation === 'traction') {
      if (ratio < 5) hcef = 2.5 * d1;
      else if (ratio < 30) hcef = 0.1 * h + 2 * d1;
      else hcef = 5 * d1;
    } else {
      if (ratio < 10) hcef = 2.5 * d1;
      else if (ratio < 60) hcef = 0.05 * h + 2 * d1;
      else hcef = 5 * d1;
    }
  }

  // Garde : la zone efficace d'une face ne peut pas depasser la demi-section,
  // sans quoi les deux faces couvriraient plus que le beton disponible. Il ne
  // s'applique qu'au chemin CALCULE — une valeur imposee par l'ingenieur n'est
  // pas ecretee en silence, elle est signalee.
  return Math.min(hcef, h / 2);
}

/**
 * Contrainte d'acier admissible (MPa), controle par diametre limite
 * (§7.3.3, tableau NA.7.2) : `sigs = sqrt(6 · wk · Es · fct,eff / phi*)`.
 *
 * ⚠ `phi*` est une ENTREE, jamais recalcule ici. La spec §4.7 signale une
 * ambiguite non levee sur l'emplacement du rapport `fct0/fct,eff` et sur la
 * definition de `hcr` en traction pure : la reproduction de la feuille de
 * reference n'est obtenue qu'avec `hcr = h` et sans le facteur. Recalculer
 * `phi*` figerait dans le code une hypothese que personne n'a confirmee.
 */
function contrainteAcier(wk, Es, fcteff, phiStar) {
  return Math.sqrt((6 * wk * Es * fcteff) / phiStar);
}

/**
 * La chaine complete. Rend TOUS les intermediaires : une note de calcul qui
 * ne porterait que le resultat ne serait verifiable par personne.
 *
 * Entrees : h, b, cnom, phi (mm) ; fck, fyk, Es (MPa) ; wk (mm) ; kzt, kc ;
 * `conventionK` ('ec2' | 'de') ; `sollicitation` ('traction' | 'flexion') ;
 * `scenario` ('jeune' | 'tardif') ; puis `phiStar` (mm) OU `sigs` (MPa).
 */
function armatureMinimaleBridage(e) {
  const sollicitation = e.sollicitation || 'traction';
  const methode = e.methode || 'din';
  const conventionK = e.conventionK || 'ec2';
  const scenario = e.scenario || 'jeune';
  const Es = e.Es === undefined ? 200000 : e.Es;

  const impose = e.impose || {};
  const sources = {};
  const avertissements = [];

  /*
   * LE MECANISME DE FORCAGE.
   *
   * Toute grandeur intermediaire peut etre imposee a la main : elle
   * court-circuite alors sa formule et alimente la suite de la chaine
   * normalement — imposer `d1` change `hcef`, imposer `fcteff` change `sigs`.
   *
   * Chaque grandeur est enregistree dans `sources` comme 'calcule' ou
   * 'impose'. C'est la condition qui rend le mecanisme acceptable : une note
   * de calcul qui presenterait un hcef impose comme s'il etait calcule ne
   * serait verifiable par personne, et c'est precisement a cela qu'une note
   * de calcul sert.
   */
  function retenu(nom, calcule) {
    const force = impose[nom];
    if (force !== undefined && force !== null && force !== '' && !Number.isNaN(Number(force))) {
      sources[nom] = 'impose';
      return Number(force);
    }
    sources[nom] = 'calcule';
    return calcule;
  }

  if (!(e.h > 0) || !(e.b > 0)) {
    throw new Error('armatureMinimaleBridage : hauteur ou largeur nulle ou negative');
  }

  const d1 = retenu('d1', e.cnom + e.phi / 2);
  if (!(d1 > 0)) {
    throw new Error('armatureMinimaleBridage : enrobage d axe nul ou negatif (d1 = ' + d1 + ')');
  }
  if (d1 >= e.h / 2) {
    // AVERTISSEMENT et non refus : sur le chemin calcule c'est une saisie
    // aberrante, mais un ingenieur qui IMPOSE d1 sait ce qu'il fait, et
    // l'arreter lui retirerait la decision qu'il vient de prendre.
    avertissements.push(
      "L'enrobage d'axe d1 = " + d1 + ' mm atteint la demi-epaisseur (h/2 = ' + e.h / 2 +
        ' mm) : la geometrie est incoherente, et hc,ef comme A_ct en dependent.'
    );
  }

  const fctm = retenu('fctm', fctmDepuisFck(e.fck));

  // Bridage TARDIF : l'ouvrage a vieilli, la pleine resistance en traction
  // est mobilisee, et le plancher de 3,0 MPa s'applique. Bridage au JEUNE
  // age : la fissuration survient pendant l'evacuation de la chaleur
  // d'hydratation, et `kzt` dit ou en est le beton a cet instant.
  //
  // `fcteffImpose` reste accepte pour compatibilite avec le mode manuel de
  // la page ; il vaut exactement `impose.fcteff`.
  const fcteffCalcule = scenario === 'tardif' ? Math.max(fctm, 3.0) : e.kzt * fctm;
  const fcteff = retenu(
    'fcteff',
    e.fcteffImpose !== undefined && e.fcteffImpose !== null && !Number.isNaN(e.fcteffImpose)
      ? e.fcteffImpose
      : fcteffCalcule
  );

  const k = retenu('k', facteurK(e.h, conventionK));
  const kc = retenu('kc', e.kc === undefined ? 1.0 : e.kc);
  const hcef = retenu('hcef', hauteurEfficace(e.h, d1, sollicitation, methode));

  // En traction centree toute la section est tendue et DEUX faces sont
  // armees ; en flexion, une seule.
  const nappes = sollicitation === 'traction' ? 2 : 1;
  const Act = retenu('Act', sollicitation === 'traction' ? e.b * e.h : (e.b * e.h) / 2);
  const Aceff = retenu('Aceff', hcef * e.b); // UNE face

  // Le domaine physique est CONTROLE mais jamais ecrete quand la valeur est
  // imposee : on signale, on calcule quand meme avec ce qui a ete donne.
  if (nappes * Aceff > e.b * e.h) {
    avertissements.push(
      'La zone efficace des ' + nappes + ' faces (' + Math.round(nappes * Aceff) +
        ' mm²) depasse la section de beton (' + Math.round(e.b * e.h) +
        ' mm²) : hc,ef impose au-dela de h/2. Le calcul est mene tel quel.'
    );
  }

  let sigs;
  let sigsSource;
  if (e.sigs !== undefined && e.sigs !== null && !Number.isNaN(e.sigs)) {
    sigs = e.sigs;
    sigsSource = 'impose';
  } else if (impose.sigs !== undefined && impose.sigs !== null && !Number.isNaN(Number(impose.sigs))) {
    sigs = Number(impose.sigs);
    sigsSource = 'impose';
  } else {
    if (!(e.phiStar > 0)) {
      throw new Error(
        'armatureMinimaleBridage : sans `sigs` impose, `phiStar` doit etre strictement positif'
      );
    }
    sigs = contrainteAcier(e.wk, Es, fcteff, e.phiStar);
    sigsSource = 'phiStar';
  }
  sources.sigs = sigsSource === 'phiStar' ? 'calcule' : 'impose';

  if (!(sigs > 0)) {
    throw new Error('armatureMinimaleBridage : contrainte d acier nulle ou negative');
  }

  const AsMinceTotal = (k * kc * fcteff * Act) / sigs;

  // ⚠ NI `k` NI `kc` ici, et ce n'est pas un oubli. `k` traduit la reduction
  // de l'effort par les contraintes d'auto-equilibre a l'echelle de la
  // SECTION ENTIERE ; l'approche par zone efficace ne raisonne plus sur la
  // section entiere mais sur la peau qui travaille reellement, ou cette
  // reduction n'a pas lieu d'etre appliquee une seconde fois. L'appliquer
  // quand meme retirerait 35 % d'acier sur le cas de validation.
  const AsEpaisSansBorne = (nappes * fcteff * Aceff) / sigs;

  // Borne inferieure anti-plastification : en deca, l'acier plastifie a
  // l'instant de la fissuration et la fissure devient unique et large au
  // lieu de rester fine et repartie — ce que l'armature minimale existe
  // precisement pour empecher.
  const BorneTotal = (k * fcteff * Act) / e.fyk;
  const AsEpaisTotal = Math.max(AsEpaisSansBorne, BorneTotal);

  // La norme ne fixe pas de frontiere nette entre element mince et epais :
  // on calcule les deux et on retient la plus petite.
  const AsMinTotal = Math.min(AsMinceTotal, AsEpaisTotal);
  const approcheRetenue = AsMinTotal === AsMinceTotal ? 'mince' : 'epaisse';

  const parNappe = (total) => total / nappes;

  return {
    fctm, fcteff, d1, ratio: e.h / d1, hcef, k, kc, Act, Aceff, sigs, sigsSource,
    nappes, sollicitation, methode, conventionK, scenario, approcheRetenue,
    AsMinceTotal, AsEpaisTotal, BorneTotal, AsMinTotal,
    AsMinceParNappe: parNappe(AsMinceTotal),
    AsEpaisParNappe: parNappe(AsEpaisTotal),
    BorneParNappe: parNappe(BorneTotal),
    AsMinParNappe: parNappe(AsMinTotal),
    /** Pour CHAQUE grandeur : 'calcule' ou 'impose'. Jamais implicite. */
    sources,
    /** Domaine physique franchi par une valeur imposee. Signale, pas ecrete. */
    avertissements,
  };
}

/*
 * Garde d'export : ignore par le navigateur (qui charge ce fichier en script
 * classique), utilise par Node pour les tests. Aucun build, aucune
 * dependance.
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { fctmDepuisFck, facteurK, hauteurEfficace, contrainteAcier, armatureMinimaleBridage };
}
```

- [ ] **Étape 4 : lancer le test et vérifier qu'il passe**

```bash
cd /home/hnr/Downloads/code/Structura && node --test
```

Attendu : `# fail 0`. (Le compte de `pass` n'est pas asserté ici : il bougera à chaque test ajouté, et une valeur figée dans un plan devient fausse au premier enrichissement.)

- [ ] **Étape 5 : commit**

```bash
cd /home/hnr/Downloads/code/Structura
git add asmin.js tests/asmin.test.js
git commit -m "feat: chaine de calcul de l armature minimale sous bridage centre

Fonction pure, sans DOM, avec le cas de validation de la spec en test.

hcef employait les branches de la FLEXION sur un bridage CENTRE : 137,5 mm
au lieu de 240 sur le cas de reference, soit 43 % d armature en moins. Les
branches de la traction centree sont selectionnees par h/d1 (seuils 5 et 30).

Trois autres ecarts corriges au passage : le facteur k expose ses deux
conventions (EC2 et annexe allemande) sans melanger leurs bornes ; l approche
par zone efficace n applique NI k NI kc, ce que la spec confirme et qui vaut
35 % d acier ; la borne anti-plastification k fcteff Act / fyk est calculee.

phiStar reste une ENTREE : la spec signale une ambiguite non levee sur hcr en
traction pure, et la recalculer figerait une hypothese non confirmee.

Script classique et non module : index.html porte des onclick en ligne qui
exigent la portee globale. Le garde d export permet a node --test de le
charger sans build ni dependance."
```

---

### Tâche A2 : brancher `index.html` sur `asmin.js`

**Fichiers :**
- Modifier : `Structura/index.html` — la balise `<script>` ligne 281 et `fissCompute` lignes 458-490.

- [ ] **Étape 1 : charger le fichier avant le script en ligne**

Dans `index.html`, juste avant `<script>` (ligne 281), insérer :

```html
<!--
  Charge AVANT le script en ligne : les deux sont des scripts classiques et
  partagent la portee globale, donc `armatureMinimaleBridage` y est visible.
  Le passer en module casserait les `onclick` en ligne de la page.
-->
<script src="./asmin.js"></script>
```

- [ ] **Étape 2 : remplacer le calcul de `As,min` dans `fissCompute`**

Dans `fissCompute`, remplacer les lignes qui vont de `r.k=v.h<=300?...` jusqu'à `r.AsminThick=...` incluse par :

```js
  // La chaine d'armature minimale vit dans asmin.js, testee contre le cas de
  // validation de SPEC_correction_Asmin_bridage.md §7. Ne pas la reecrire ici.
  // Les champs de forcage : un champ VIDE veut dire « calcule », jamais zero.
  // `retenu()` dans asmin.js ignore les chaines vides et les NaN, donc on peut
  // les transmettre tels quels sans les filtrer ici.
  //
  // NOTE A L'EXECUTANT : ces champs n'existent qu'a partir de la tache A3.
  // D'ici la ils valent `undefined`, que `retenu()` lit comme « calcule » —
  // le code fonctionne donc des maintenant, sans forcage possible.
  const impose = {
    fctm: v.impFctm, fcteff: v.impFcteff, d1: v.impD1, hcef: v.impHcef,
    k: v.impK, kc: v.impKc, Act: v.impAct, Aceff: v.impAceff, sigs: v.impSigs,
  };

  const am = armatureMinimaleBridage({
    h: v.h, b: v.b, cnom: v.c, phi: v.phi,
    fck: v.fck, fyk: v.fyk, Es: 200000,
    wk: v.wk, kzt: v.kzt, kc: (v.cas === 'traction') ? 1.0 : 0.4,
    methode: v.methode,
    conventionK: v.convK,
    sollicitation: v.cas,
    scenario: v.scenario,
    // `fcteff` impose court-circuite `kzt` : c'est le mode manuel existant.
    ...(v.mode === 'impose' ? { fcteffImpose: v.fcteff } : {}),
    ...(v.sigsMode === 'phistar' ? { phiStar: v.phistar } : { sigs: (v.sigsMode === 'fyk') ? v.fyk : v.sigsVal }),
    impose,
  });

  r.am = am;
  r.k = am.k;
  r.kc = am.kc;
  r.fcteff = am.fcteff;
  r.Act = am.Act;
  r.sigs = am.sigs;
  r.hcef = am.hcef;
  r.Asmin = am.AsMinceTotal;
  r.AsminFace = am.AsMinceParNappe;
  r.AsminThick = am.AsEpaisTotal;
  r.rho = am.AsMinTotal / (v.b * v.h);
```

- [ ] **Étape 3 : gérer `fcteffImpose` dans `asmin.js`**

Dans `armatureMinimaleBridage`, remplacer la ligne de `fcteff` par :

```js
  // `fcteffImpose` court-circuite le scenario : l'utilisateur donne la
  // resistance en traction a l'instant de la fissuration, ce qui reste le
  // parametre le plus lourd de consequences du calcul.
  const fcteff =
    e.fcteffImpose !== undefined && e.fcteffImpose !== null && !Number.isNaN(e.fcteffImpose)
      ? e.fcteffImpose
      : scenario === 'tardif'
        ? Math.max(fctm, 3.0)
        : e.kzt * fctm;
```

- [ ] **Étape 4 : ajouter le test de `fcteffImpose`**

Ajouter à `tests/asmin.test.js` :

```js
test('une fcteff imposee court-circuite kzt et le scenario', () => {
  const r = armatureMinimaleBridage({ ...CAS, fcteffImpose: 1.9 });
  proche(r.fcteff, 1.9, 'fcteff imposee');

  const tardif = armatureMinimaleBridage({ ...CAS, scenario: 'tardif', fcteffImpose: 1.9 });
  proche(tardif.fcteff, 1.9, 'l imposition l emporte sur le scenario');
});
```

- [ ] **Étape 5 : lancer les tests**

```bash
cd /home/hnr/Downloads/code/Structura && node --test
```

Attendu : `# fail 0`.

- [ ] **Étape 6 : commit**

```bash
cd /home/hnr/Downloads/code/Structura
git add index.html asmin.js tests/asmin.test.js
git commit -m "refactor: la page consomme asmin.js au lieu de recalculer

fissCompute ne porte plus la chaine d armature minimale : elle appelle la
fonction pure, testee. Une fcteff imposee continue de court-circuiter kzt et
le scenario — c est le parametre le plus lourd de consequences du calcul, et
l utilisateur doit pouvoir le donner."
```

---

### Tâche A3 : les champs de saisie nouveaux

**Fichiers :**
- Modifier : `Structura/index.html` — `F_IDS` (ligne 435), `F_DEF` (ligne 436), et le gabarit `FISS_HTML`.

- [ ] **Étape 1 : déclarer les champs**

Remplacer `F_IDS` et `F_DEF` par :

```js
const F_IDS=["fck","s","t","mode","fcteff","kzt","scenario","methode","convK","fyk","sigsMode","sigsVal","phistar","h","b","c","phi","cas","wk","asprov","kt","k1","k2","k3","k4",
  // Champs de FORCAGE. Vides par defaut : un champ vide veut dire « calcule ».
  "impFctm","impFcteff","impD1","impHcef","impK","impKc","impAct","impAceff","impSigs"];

const F_DEF={fck:30,s:"0.25",t:3,mode:"impose",fcteff:2.9,kzt:0.8,scenario:"jeune",methode:"din",convK:"ec2",fyk:500,sigsMode:"fyk",sigsVal:320,phistar:13.54,h:1000,b:1000,c:50,phi:12,cas:"traction",wk:0.3,asprov:8000,kt:0.4,k1:0.8,k2:1.0,k3:3.4,k4:0.425,
  // ⚠ CHAINES VIDES et non zeros : un « 0 » dans un champ de forcage serait
  // une valeur imposee a zero, ce qui annulerait l armature en silence.
  impFctm:"",impFcteff:"",impD1:"",impHcef:"",impK:"",impKc:"",impAct:"",impAceff:"",impSigs:""};
```

⚠ `fissReadInputs` fait `parseFloat(el.value)`, ce qui rend `NaN` sur un champ vide — et c'est exactement ce que `retenu()` interprète comme « calculé ». Aucune adaptation nécessaire.

- [ ] **Étape 2 : ajouter les contrôles dans `FISS_HTML`**

Dans le bloc de saisie des matériaux de `FISS_HTML`, à la suite du champ `fcteff`, insérer :

```html
<div class="field">
  <label>k_zt = f_ct,eff / f_ctm</label>
  <input id="kzt" type="number" step="0.05" min="0.1" max="1" />
</div>
<div class="field">
  <label>Scénario de bridage</label>
  <select id="scenario">
    <option value="jeune">Jeune âge (hydratation) — k_zt s'applique</option>
    <option value="tardif">Tardif — f_ct,eff = max(f_ctm ; 3,0)</option>
  </select>
</div>
<div class="field">
  <label>Méthode de calcul de h<sub>c,ef</sub></label>
  <select id="methode">
    <option value="din">Pratique allemande — branches selon h/d₁</option>
    <option value="ec2">Texte EN 1992-1-1 §7.3.2(3) — 2,5·d₁</option>
  </select>
</div>
<div class="field">
  <label>Convention du facteur k</label>
  <select id="convK">
    <option value="ec2">EC2 recommandé — 1,00 → 0,65</option>
    <option value="de">Annexe allemande — 0,80 → 0,50</option>
  </select>
</div>
<div class="field">
  <label>Ø* limite (mm)</label>
  <input id="phistar" type="number" step="0.1" min="1" />
</div>
```

Et dans le `<select id="sigsMode">`, ajouter l'option :

```html
<option value="phistar">Dérivée de Ø* (§7.3.3)</option>
```

**La méthode et la convention de `k` sont DEUX listes distinctes**, et il ne faut pas les fondre en une : le tableau de la spec §7 croise les deux conventions de `k` avec les mêmes branches de `hc,ef`. Les lier interdirait « branches allemandes, `k` de l'annexe belge », qui est un cas parfaitement légitime au Luxembourg.

- [ ] **Étape 2 bis : le bloc de forçage**

À la fin du panneau de saisie de `FISS_HTML`, ajouter :

```html
<details class="forcage">
  <summary>Forcer des valeurs intermédiaires</summary>
  <p class="note">
    Un champ <strong>vide</strong> veut dire « calculé ». Une valeur saisie
    <strong>court-circuite sa formule</strong> et alimente la suite de la chaîne :
    imposer <em>d₁</em> change <em>h<sub>c,ef</sub></em>, imposer
    <em>f<sub>ct,eff</sub></em> change <em>σ<sub>s</sub></em>. Toute valeur imposée
    est <strong>marquée comme telle</strong> dans les résultats et dans la note :
    une note qui présenterait une valeur forcée comme calculée ne serait
    vérifiable par personne.
  </p>
  <div class="field"><label>f<sub>ctm</sub> (MPa)</label><input id="impFctm" type="number" step="0.01" /></div>
  <div class="field"><label>f<sub>ct,eff</sub> (MPa)</label><input id="impFcteff" type="number" step="0.01" /></div>
  <div class="field"><label>d₁ (mm)</label><input id="impD1" type="number" step="1" /></div>
  <div class="field"><label>h<sub>c,ef</sub> (mm)</label><input id="impHcef" type="number" step="1" /></div>
  <div class="field"><label>k</label><input id="impK" type="number" step="0.01" /></div>
  <div class="field"><label>k<sub>c</sub></label><input id="impKc" type="number" step="0.05" /></div>
  <div class="field"><label>A<sub>ct</sub> (mm²)</label><input id="impAct" type="number" step="1000" /></div>
  <div class="field"><label>A<sub>c,eff</sub> une face (mm²)</label><input id="impAceff" type="number" step="1000" /></div>
  <div class="field"><label>σ<sub>s</sub> (MPa)</label><input id="impSigs" type="number" step="1" /></div>
</details>
```

- [ ] **Étape 3 : vérifier à l'œil dans le navigateur**

```bash
cd /home/hnr/Downloads/code/Structura && python3 -m http.server 8123
```

Ouvrir `http://localhost:8123/`, onglet fissuration. Saisir le cas §7 : `h = 1300`, `b = 1000`, `c = 45`, `phi = 20`, `fck = 30`, `wk = 0,2`, `kzt = 0,8`, `Ø* = 13,54`, mode σs = « Dérivée de Ø* », méthode « pratique allemande », convention `k` EC2.

Attendu à l'écran : `hc,ef = 240 mm`, `σs ≈ 202,7 MPa`, `As,min = 27,44 cm²/m par nappe`.

Puis vérifier les trois gestes nouveaux :
1. Basculer la méthode sur « texte EN 1992-1-1 » → `hc,ef` passe à `137,5 mm`, et `As,min` baisse.
2. Basculer la convention de `k` sur « annexe allemande » → `k` passe à `0,50`, `hc,ef` **ne bouge pas** (les deux choix sont indépendants), et `As,min` reste `27,44` (l'approche épaisse gouverne).
3. Ouvrir « Forcer des valeurs intermédiaires », saisir `hc,ef = 300` → la valeur affichée devient `300 mm (imposé)` et `As,min` suit. Saisir `hc,ef = 900` → un avertissement apparaît, **sans** que la valeur soit écrêtée.

- [ ] **Étape 4 : commit**

```bash
cd /home/hnr/Downloads/code/Structura
git add index.html
git commit -m "feat: la methode se choisit, et toute grandeur intermediaire se force

Rien en dur : les parametres que la spec exige d exposer sont des champs, et
le mode sigma_s gagne la derivation par Ø* du §7.3.3.

Deux mecanismes distincts s ajoutent, qu il ne faut pas confondre.

La METHODE gouverne la famille de formules de hcef : texte de l EN 1992-1-1
(2,5 d1) ou branches de la pratique allemande selon h/d1. Elle reste SEPAREE
de la convention de k, parce que le tableau de la spec croise les deux
conventions de k avec les memes branches : k est un parametre d annexe
nationale, hcef est un choix de methode. Les lier interdirait « branches
allemandes, k de l annexe belge », legitime au Luxembourg.

Le FORCAGE permet d imposer n importe quelle grandeur intermediaire — fctm,
fcteff, d1, hcef, k, kc, Act, Aceff, sigs. Une valeur imposee court-circuite
sa formule et alimente la suite de la chaine. Un champ vide veut dire
« calcule », jamais zero : un 0 annulerait l armature en silence."
```

---

### Tâche A4 : l'affichage dit lequel des deux nombres il montre

**Fichiers :**
- Modifier : `Structura/index.html` — `fissRender` (les lignes `$("asmin").textContent=...` autour de 543-591).

- [ ] **Étape 1 : nommer total et nappe partout**

Remplacer les affectations de `asmin`, `asminthick` et les lignes du détail par :

```js
  const am = r.am;
  const cm2 = (mm2) => fmt(mm2 / 100, 2);
  const nappe = am.nappes === 2 ? " par nappe" : "";

  /*
   * Le suffixe « imposé » n'est PAS decoratif : c'est ce qui distingue une
   * valeur que la chaine a calculee d'une valeur que l'ingenieur a forcee.
   * Sans lui, une note de calcul presenterait les deux de la meme facon et
   * ne serait verifiable par personne.
   */
  const marque = (nom) => (am.sources[nom] === "impose" ? " (imposé)" : "");

  $("asmin").textContent = cm2(am.AsMinParNappe) + " cm²/m" + nappe;
  $("asmintotal").textContent = cm2(am.AsMinTotal) + " cm²/m au total";
  $("asminmince").textContent = cm2(am.AsMinceParNappe) + " cm²/m" + nappe;
  $("asminthick").textContent = cm2(am.AsEpaisParNappe) + " cm²/m" + nappe;
  $("asminborne").textContent = cm2(am.BorneParNappe) + " cm²/m" + nappe;
  $("approche").textContent =
    am.approcheRetenue === "epaisse"
      ? "approche ÉPAISSE (zone efficace) — elle gouverne"
      : "approche MINCE (section tendue entière) — elle gouverne";

  $("methode").textContent =
    am.methode === "ec2"
      ? "texte EN 1992-1-1 §7.3.2(3)"
      : "pratique allemande, branches h/d₁";

  $("hcef").textContent = fmt(am.hcef, 0) + " mm" + marque("hcef");
  $("d1out").textContent = fmt(am.d1, 0) + " mm" + marque("d1");
  $("fcteffout").textContent = fmt(am.fcteff, 2) + " MPa" + marque("fcteff");
  $("kout").textContent = fmt(am.k, 3) + marque("k");
  $("kcout").textContent = fmt(am.kc, 2) + marque("kc");
  $("actout").textContent = fmt0(am.Act) + " mm²" + marque("Act");
  $("aceffout").textContent = fmt0(am.Aceff) + " mm² (une face)" + marque("Aceff");
  $("sigsout").textContent = fmt(am.sigs, 1) + " MPa" + marque("sigs");

  // Les avertissements de domaine, quand une valeur imposee sort du physique.
  // Ils SIGNALENT, ils n'ecretent pas : ecreter retirerait a l'ingenieur la
  // decision qu'il vient explicitement de prendre.
  const zone = $("avertissements");
  zone.innerHTML = am.avertissements.length === 0
    ? ""
    : "<ul>" + am.avertissements.map((a) => "<li>" + a + "</li>").join("") + "</ul>";
```

Ajouter les `<span>` correspondants dans `FISS_HTML` : `asmintotal`, `asminmince`, `asminborne`, `approche`, `methode`, `hcef`, `d1out`, `fcteffout`, `kout`, `kcout`, `actout`, `aceffout`, `sigsout`, plus un `<div id="avertissements" class="avert"></div>`.

Et le style de l'avertissement, dans le `<style>` de la page :

```css
/* Une valeur forcee hors du domaine physique n'est pas un echec de
   verification : c'est un avertissement. D'ou la couleur d'alerte, jamais
   celle du refus — la regle « une couleur de sens ne sert jamais de decor »
   vaut aussi dans l'autre sens. */
.avert ul { margin: .4rem 0; padding-left: 1.1rem; color: var(--alerte); font-size: .82rem; }
.forcage { margin-top: .8rem; border-top: 1px solid var(--bordure-douce); padding-top: .5rem; }
.forcage summary { cursor: pointer; font-size: .8rem; color: var(--texte-faible); }
```

- [ ] **Étape 2 : ajouter la réserve normative à l'écran**

Sous le bloc de résultat de `FISS_HTML` :

```html
<p class="note">
  Les branches de <em>h<sub>c,ef</sub></em> en traction centrée (seuils
  <em>h/d₁</em> = 5 et 30) ne sont <strong>pas le texte</strong> de
  l'EN 1992-1-1, dont le §7.3.2(3) écrit
  <em>h<sub>c,ef</sub> = min(2,5(h−d) ; (h−x)/3 ; h/2)</em>. Elles viennent de
  la pratique allemande (Schneider ; Fingerloos, Hegger, Zilch). Le facteur
  <em>k</em> est un <strong>paramètre national</strong>. En Belgique et au
  Luxembourg, la justification réglementaire reste l'EN 1992-1-1 et ses
  annexes NBN / ILNAS. <em>Ø*</em> est une <strong>entrée</strong> : la
  définition de <em>h<sub>cr</sub></em> en traction pure reste à confirmer.
</p>
```

- [ ] **Étape 3 : vérifier à l'écran**

Relancer le serveur, resaisir le cas §7. Attendu : `As,min = 27,44 cm²/m par nappe`, `54,88 cm²/m au total`, mention « approche ÉPAISSE », méthode nommée, et la réserve visible.

Puis forcer `k = 0,55` et vérifier que la ligne `k` affiche bien `0,550 (imposé)` — c'est la garantie qui rend le forçage acceptable.

- [ ] **Étape 4 : la note imprimée porte les marques et les avertissements**

`copySummary` et l'impression doivent reprendre les suffixes « (imposé) » et la liste d'avertissements. Vérifier en cliquant « Copier la synthèse » après avoir forcé `hc,ef = 900` : le texte copié doit contenir `(imposé)` **et** l'avertissement de dépassement.

Si `copySummary` reconstruit son texte à part, l'aligner sur `fissRender` plutôt que de dupliquer la mise en forme.

- [ ] **Étape 5 : commit**

```bash
cd /home/hnr/Downloads/code/Structura
git add index.html
git commit -m "feat: l affichage nomme le total, la nappe, la methode et ce qui est impose

Le facteur 2 entre total et nappe est la cause classique d un ecart avec une
feuille de calcul : aucun nombre ne s affiche plus sans dire lequel des deux
il est. L approche retenue et la methode employee sont nommees.

Toute grandeur FORCEE porte le suffixe « (imposé) », a l ecran comme dans la
synthese copiee. Ce n est pas decoratif : sans lui, une note de calcul
presenterait une valeur forcee exactement comme une valeur calculee, et ne
serait verifiable par personne.

Une valeur imposee hors du domaine physique produit un AVERTISSEMENT, jamais
un ecretage silencieux : ecreter retirerait a l ingenieur la decision qu il
vient de prendre, ne rien dire la lui laisserait prendre a l aveugle. Couleur
d alerte et non de refus — ce n est pas un echec de verification.

L ecart au texte de l EN 1992-1-1 est ecrit a l ecran, pas seulement dans le
code."
```

---

### Tâche A5 : la commande de test dans le README

**Fichiers :**
- Modifier : `Structura/README.md`

- [ ] **Étape 1 : ajouter la section**

```markdown
## Tests

Aucune dépendance, aucun build : le runner intégré à Node suffit.

```bash
node --test
```
```

- [ ] **Étape 2 : commit**

```bash
cd /home/hnr/Downloads/code/Structura
git add README.md && git commit -m "docs: la commande de test"
```

---

# Phase B — section-uls

Le même défaut vit dans `src/detailing/restraint.ts`, derrière la case « Zwang » et son sélecteur de référentiel. Les corrections sont identiques ; la différence est que ce dépôt a déjà une suite de 695 tests et un noyau typé.

## Structure de fichiers

- Modifier : `Section BA/src/detailing/restraint.ts` — `thicknessFactor`, `aireEfficace`, `minimumRestraintArea`.
- Modifier : `Section BA/tests/detailing/restraint.test.ts` — le cas §7.
- Modifier : `Section BA/app/src/checks-view.ts` — `blocZwang`, pour nommer total et nappe.
- Modifier : `Section BA/app/src/form.ts` et `app/src/main.ts` — le champ de convention de `k`.

---

### Tâche B1 : les branches de `hcef` et la convention de `k`

**Fichiers :**
- Modifier : `Section BA/src/detailing/restraint.ts`
- Test : `Section BA/tests/detailing/restraint.test.ts`

- [ ] **Étape 1 : écrire les tests qui échouent**

Ajouter à `tests/detailing/restraint.test.ts` :

```ts
import { effectiveRestraintHeight, thicknessFactor } from '../../src/detailing/restraint';

describe('effectiveRestraintHeight : traction centree, pas flexion', () => {
  it('branche 5 a 30 sur le cas de validation de la spec', () => {
    // h = 1300, d1 = 55 -> h/d1 = 23,6 -> 0,10 h + 2 d1 = 240 mm.
    expect(effectiveRestraintHeight(1300, 55, 'central')).toBeCloseTo(240, 6);
  });

  it('la meme geometrie lue en flexion tombe ailleurs', () => {
    expect(effectiveRestraintHeight(1300, 55, 'bending')).toBeCloseTo(0.05 * 1300 + 2 * 55, 6);
  });

  it('les branches extremes', () => {
    expect(effectiveRestraintHeight(200, 50, 'central')).toBeCloseTo(100, 6); // ecrete a h/2
    expect(effectiveRestraintHeight(3000, 50, 'central')).toBeCloseTo(250, 6);
  });

  it('jamais plus que h/2', () => {
    expect(effectiveRestraintHeight(300, 60, 'central')).toBeLessThanOrEqual(150);
  });
});

describe('thicknessFactor : deux conventions nationales', () => {
  it('ne melange pas les bornes de l une avec la pente de l autre', () => {
    expect(thicknessFactor(1300, 'ec2')).toBeCloseTo(0.65, 9);
    expect(thicknessFactor(1300, 'de')).toBeCloseTo(0.5, 9);
    expect(thicknessFactor(200, 'ec2')).toBeCloseTo(1.0, 9);
    expect(thicknessFactor(200, 'de')).toBeCloseTo(0.8, 9);
    expect(thicknessFactor(550, 'ec2')).toBeCloseTo(1.0 - 0.5 * 0.35, 9);
    expect(thicknessFactor(550, 'de')).toBeCloseTo(0.8 - 0.5 * 0.3, 9);
  });

  it('la convention EC2 reste le defaut', () => {
    expect(thicknessFactor(1300)).toBeCloseTo(0.65, 9);
  });
});
```

- [ ] **Étape 2 : lancer et vérifier l'échec**

```bash
cd "/home/hnr/Downloads/code/Section BA" && npx vitest run tests/detailing/restraint.test.ts
```

Attendu : ÉCHEC, `effectiveRestraintHeight is not a function`.

- [ ] **Étape 3 : implémenter**

Dans `src/detailing/restraint.ts`, remplacer `thicknessFactor` et ajouter `effectiveRestraintHeight` :

```ts
/** Convention nationale du facteur `k` du §7.3.2(2). */
export type ThicknessConvention = 'ec2' | 'de';

/**
 * Facteur `k` des contraintes d'auto-equilibre (§7.3.2(2)).
 *
 *   ec2 : 1,00 (h <= 300 mm) -> 0,65 (h >= 800 mm)  valeurs recommandees
 *   de  : 0,80 (h <= 300 mm) -> 0,50 (h >= 800 mm)  annexe allemande
 *
 * PARAMETRE NATIONAL. Ne jamais melanger la pente de l'une avec les bornes
 * de l'autre — c'est l'une des erreurs que la correction visait.
 *
 * Le sens physique reste celui d'un facteur REDUCTEUR : dans une piece
 * epaisse, les contraintes d'auto-equilibre reduisent l'effort qui traverse
 * reellement la section a l'instant de la fissuration.
 */
export function thicknessFactor(h: number, convention: ThicknessConvention = 'ec2'): number {
  const haut = convention === 'de' ? 0.8 : 1.0;
  const bas = convention === 'de' ? 0.5 : 0.65;

  if (h <= 300) return haut;
  if (h >= 800) return bas;
  return haut - ((h - 300) / 500) * (haut - bas);
}

/**
 * Hauteur de la zone de beton tendu efficace (mm), branches selon `h/d1`.
 *
 * ⚠ ECART DOCUMENTE AU TEXTE DE L'EN 1992-1-1, dont le §7.3.2(3) ecrit
 * `hc,ef = min(2,5(h−d) ; (h−x)/3 ; h/2)`. Ces branches viennent de la
 * pratique allemande (Schneider Bautabellen ; Fingerloos, Hegger, Zilch).
 *
 * POURQUOI ELLES DIFFERENT DE LA FLEXION, et pourquoi les confondre coutait
 * 43 % d'armature : en traction centree, la zone efficace CROIT avec
 * l'epaisseur. Apres la premiere fissure traversante, l'acier reintroduit
 * l'effort sur une longueur d'introduction ; dans un element epais, les
 * barres sont trop espacees pour agir sur tout le coeur, et il se forme des
 * fissures secondaires pres des barres — ce qui approfondit leur zone
 * d'influence bien au-dela de la zone de rive figee de la flexion.
 */
export function effectiveRestraintHeight(
  h: number,
  d1: number,
  restraint: RestraintType,
  methode: RestraintMethod = 'din'
): number {
  let hcEff: number;

  if (methode === 'ec2') {
    // TEXTE de l'EN 1992-1-1 §7.3.2(3) : min(2,5(h−d) ; (h−x)/3 ; h/2), avec
    // (h−d) = d1. Le terme (h−x)/3 est ECARTE : il suppose un axe neutre de
    // section FISSUREE EN FLEXION, qui n'a pas de sens a l'instant de la
    // premiere fissure sous bridage.
    hcEff = 2.5 * d1;
  } else {
    const ratio = h / d1;
    if (restraint === 'central') {
      if (ratio < 5) hcEff = 2.5 * d1;
      else if (ratio < 30) hcEff = 0.1 * h + 2 * d1;
      else hcEff = 5 * d1;
    } else {
      if (ratio < 10) hcEff = 2.5 * d1;
      else if (ratio < 60) hcEff = 0.05 * h + 2 * d1;
      else hcEff = 5 * d1;
    }
  }

  // La zone efficace d'une face ne peut pas depasser la demi-section : les
  // deux faces couvriraient sinon plus que le beton disponible. Ce garde ne
  // vaut que sur le chemin CALCULE — une valeur imposee est signalee, pas
  // ecretee.
  return Math.min(hcEff, h / 2);
}
```

Et le type de méthode, à placer près de `ThicknessConvention` :

```ts
/**
 * Famille de formules qui gouverne `h_c,ef`.
 *
 * ⚠ A NE PAS FONDRE avec `ThicknessConvention`. Ce sont deux choix
 * INDEPENDANTS : `k` est un parametre d'annexe nationale, la formule de
 * `h_c,ef` est un choix de methode. Les lier interdirait « branches
 * allemandes, k de l'annexe belge », qui est un cas parfaitement legitime au
 * Luxembourg — et c'est d'ailleurs ainsi que la spec les croise dans son
 * tableau de validation.
 *
 *   ec2 : le TEXTE de l'EN 1992-1-1 §7.3.2(3), `2,5·d1` ecrete a `h/2`
 *   din : les branches selon `h/d1` de la pratique allemande
 */
export type RestraintMethod = 'ec2' | 'din';
```

- [ ] **Étape 4 : lancer et vérifier que ça passe**

```bash
cd "/home/hnr/Downloads/code/Section BA" && npx vitest run tests/detailing/restraint.test.ts
```

Attendu : PASS.

- [ ] **Étape 5 : commit**

```bash
cd "/home/hnr/Downloads/code/Section BA"
git add src/detailing/restraint.ts tests/detailing/restraint.test.ts
git commit -m "fix(core): hcef employait les branches de la flexion sur un bridage centre

Sur le cas de reference (h = 1300, d1 = 55), hcef tombait a 137,5 mm au lieu
de 240 : 43 % d armature en moins. En traction centree la zone efficace CROIT
avec l epaisseur, contrairement a la zone de rive figee de la flexion.

thicknessFactor expose ses deux conventions nationales — EC2 recommande et
annexe allemande — sans melanger la pente de l une avec les bornes de l autre.

Ecart au texte de l EN 1992-1-1 documente en tete de fonction."
```

---

### Tâche B2 : les deux approches, la borne, et le total nommé

**Fichiers :**
- Modifier : `Section BA/src/detailing/restraint.ts` — `RestraintOptions`, `RestraintResult`, `minimumRestraintArea`, `aireEfficace`.
- Test : `Section BA/tests/detailing/restraint.test.ts`

- [ ] **Étape 1 : écrire le test qui échoue**

```ts
/**
 * LE CAS DE VALIDATION de SPEC_correction_Asmin_bridage.md §7, recalcule a
 * la main. Il est le contrat commun avec l'outil As,min de la suite : les
 * deux doivent rendre les memes nombres.
 */
describe('minimumRestraintArea : le cas de validation de la spec', () => {
  function radier() {
    const acier = createSteel(500, 200000, ec2Recommended());
    return rectangularSection({
      width: 1000,
      height: 1300,
      concrete: createConcrete(30, ec2Recommended()),
      // Enrobage d'axe 55 mm = 45 + 20/2, sur les deux parements.
      rebars: [
        { y: 0, z: 1300 / 2 - 55, area: 3000, steel: acier },
        { y: 0, z: -(1300 / 2 - 55), area: 3000, steel: acier },
      ],
    });
  }

  const OPTIONS = { fctEff: 0.8 * 2.8965, sigmaS: 202.7 };

  it('rend les intermediaires attendus', () => {
    const r = minimumRestraintArea(radier(), 'central', OPTIONS);

    expect(r.fctEff).toBeCloseTo(2.317, 2);
    expect(r.hcEff).toBeCloseTo(240, 0);
    expect(r.k).toBeCloseTo(0.65, 3);
    expect(r.kc).toBeCloseTo(1.0, 9);
    expect(r.Act).toBeCloseTo(1_300_000, 0);
    expect(r.AcEff).toBeCloseTo(240_000, 0);
  });

  it('rend 27,44 cm2/m par nappe, l approche epaisse gouvernant', () => {
    const r = minimumRestraintArea(radier(), 'central', OPTIONS);

    expect(r.AsMinceParNappe / 100).toBeCloseTo(48.3, 1);
    expect(r.AsEpaisParNappe / 100).toBeCloseTo(27.44, 1);
    expect(r.AsMinParNappe / 100).toBeCloseTo(27.44, 1);
    expect(r.approach).toBe('epaisse');
  });

  it('en convention allemande, meme resultat retenu', () => {
    const r = minimumRestraintArea(radier(), 'central', {
      ...OPTIONS,
      thicknessConvention: 'de' as const,
    });

    expect(r.k).toBeCloseTo(0.5, 9);
    expect(r.AsMinceParNappe / 100).toBeCloseTo(37.16, 1);
    expect(r.AsMinParNappe / 100).toBeCloseTo(27.44, 1);
  });

  it('l approche epaisse ne depend NI de k NI de kc', () => {
    const ec2 = minimumRestraintArea(radier(), 'central', OPTIONS);
    const de = minimumRestraintArea(radier(), 'central', {
      ...OPTIONS,
      thicknessConvention: 'de' as const,
    });

    expect(de.AsEpaisParNappe).toBeCloseTo(ec2.AsEpaisParNappe, 6);
  });

  it('la borne anti-plastification est rendue, et ne gouverne pas ici', () => {
    const r = minimumRestraintArea(radier(), 'central', OPTIONS);

    expect(r.BorneParNappe / 100).toBeCloseTo(19.58, 1);
    expect(r.BorneParNappe).toBeLessThan(r.AsEpaisParNappe);
  });

  /** Le facteur 2 : aucun nombre ne doit sortir sans dire lequel il est. */
  it('le total vaut deux fois la nappe en gene centree', () => {
    const r = minimumRestraintArea(radier(), 'central', OPTIONS);

    expect(r.nappes).toBe(2);
    expect(r.AsMin).toBeCloseTo(r.AsMinParNappe * 2, 6);
  });

  // --- Choix de la methode ------------------------------------------------

  it('la methode ec2 applique le TEXTE : 2,5 d1', () => {
    const r = minimumRestraintArea(radier(), 'central', { ...OPTIONS, method: 'ec2' as const });

    expect(r.hcEff).toBeCloseTo(137.5, 1);
    expect(r.method).toBe('ec2');
  });

  it('la methode din applique les branches h/d1, et c est le defaut', () => {
    expect(minimumRestraintArea(radier(), 'central', OPTIONS).hcEff).toBeCloseTo(240, 0);
    expect(minimumRestraintArea(radier(), 'central', OPTIONS).method).toBe('din');
  });

  /**
   * Les deux choix sont INDEPENDANTS : le tableau de la spec §7 croise les
   * deux conventions de `k` avec les MEMES branches de h_c,ef. Les lier
   * interdirait « branches allemandes, k de l annexe belge ».
   */
  it('la methode et la convention de k ne se commandent pas l une l autre', () => {
    const a = minimumRestraintArea(radier(), 'central', {
      ...OPTIONS, method: 'din' as const, thicknessConvention: 'ec2' as const,
    });
    const b = minimumRestraintArea(radier(), 'central', {
      ...OPTIONS, method: 'din' as const, thicknessConvention: 'de' as const,
    });

    expect(a.hcEff).toBeCloseTo(b.hcEff, 9);
    expect(a.k).toBeCloseTo(0.65, 9);
    expect(b.k).toBeCloseTo(0.5, 9);
  });

  // --- Forcage ------------------------------------------------------------

  it('toute grandeur peut etre imposee et court-circuite sa formule', () => {
    const r = minimumRestraintArea(radier(), 'central', {
      ...OPTIONS,
      overrides: { hcEff: 300 },
    });

    expect(r.hcEff).toBeCloseTo(300, 9);
    expect(r.AcEff).toBeCloseTo(300 * 1000, 9);
    expect(r.sources.hcEff).toBe('impose');
    expect(r.sources.AcEff).toBe('calcule');
  });

  it('une grandeur imposee alimente la suite de la chaine', () => {
    const base = minimumRestraintArea(radier(), 'central', OPTIONS);
    const force = minimumRestraintArea(radier(), 'central', {
      ...OPTIONS,
      overrides: { d1: 80 },
    });

    expect(force.d1).toBeCloseTo(80, 9);
    expect(force.hcEff).toBeCloseTo(0.1 * 1300 + 2 * 80, 6);
    expect(force.AsEpaisParNappe).toBeGreaterThan(base.AsEpaisParNappe);
  });

  it('sources dit pour CHAQUE grandeur si elle est calculee ou imposee', () => {
    const r = minimumRestraintArea(radier(), 'central', {
      ...OPTIONS,
      overrides: { k: 0.55, Act: 900_000 },
    });

    expect(r.sources.k).toBe('impose');
    expect(r.sources.Act).toBe('impose');
    expect(r.sources.hcEff).toBe('calcule');
    expect(r.sources.d1).toBe('calcule');
    expect(r.k).toBeCloseTo(0.55, 9);
  });

  /**
   * Ecreter retirerait a l ingenieur la decision qu il vient explicitement de
   * prendre ; ne rien dire la lui laisserait prendre a l aveugle.
   */
  it('une zone efficace imposee au-dela de la section AVERTIT sans ecreter', () => {
    const r = minimumRestraintArea(radier(), 'central', {
      ...OPTIONS,
      overrides: { hcEff: 900 },
    });

    expect(r.hcEff).toBeCloseTo(900, 9);
    expect(r.warnings).toHaveLength(1);
    expect(r.warnings[0]).toMatch(/depasse la section/);
  });

  it('sans forcage, aucun avertissement et tout est calcule', () => {
    const r = minimumRestraintArea(radier(), 'central', OPTIONS);

    expect(r.warnings).toEqual([]);
    for (const nom of ['fctEff', 'd1', 'hcEff', 'k', 'kc', 'Act', 'AcEff', 'sigmaS'] as const) {
      expect(r.sources[nom], `${nom} devrait etre calcule`).toBe('calcule');
    }
  });
});
```

⚠ Le test `OPTIONS` passe `fctEff` et `sigmaS` par les **options historiques**, pas par `overrides`. Les deux chemins coexistent : `options.fctEff` reste la saisie normale du champ, `overrides.fctEff` est le forçage explicite. `retenu()` donne la priorité à `overrides`, et c'est lui seul qui marque `'impose'` — un champ `f_ct,eff` rempli normalement n'est **pas** un forçage.

- [ ] **Étape 2 : lancer et vérifier l'échec**

```bash
cd "/home/hnr/Downloads/code/Section BA" && npx vitest run tests/detailing/restraint.test.ts
```

Attendu : ÉCHEC, `r.hcEff` indéfini.

- [ ] **Étape 3 : implémenter**

Dans `src/detailing/restraint.ts`, remplacer `RestraintOptions.effectiveZoneOnly` par `thicknessConvention`, étendre `RestraintResult`, et réécrire `minimumRestraintArea` :

```ts
/**
 * Grandeurs intermediaires qu'on peut IMPOSER a la main.
 *
 * Une valeur imposee court-circuite sa formule et alimente la suite de la
 * chaine normalement — imposer `d1` change `hcEff`, imposer `fctEff` change
 * ce qui en depend.
 *
 * ⚠ TOUTE VALEUR IMPOSEE EST MARQUEE dans `RestraintResult.sources`. C'est la
 * condition qui rend le mecanisme acceptable : une note de calcul qui
 * presenterait une valeur forcee comme calculee ne serait verifiable par
 * personne, et c'est precisement a cela qu'une note sert.
 */
export interface RestraintOverrides {
  fctEff?: number;
  d1?: number;
  hcEff?: number;
  k?: number;
  kc?: number;
  Act?: number;
  AcEff?: number;
  sigmaS?: number;
}

/** Provenance de chaque grandeur : jamais implicite. */
export type ValueSource = 'calcule' | 'impose';

export interface RestraintOptions {
  fctEff?: number;
  sigmaS?: number;
  NEd?: number;
  /** Convention nationale du facteur `k`. Defaut `ec2`. */
  thicknessConvention?: ThicknessConvention;
  /** Famille de formules de `h_c,ef`. Defaut `din`. Choix INDEPENDANT du precedent. */
  method?: RestraintMethod;
  /** Grandeurs imposees a la main. Voir `RestraintOverrides`. */
  overrides?: RestraintOverrides;
}

export interface RestraintResult {
  k: number;
  kc: number;
  /** Aire de beton tendu ENTIERE (mm²). */
  Act: number;
  /** Hauteur de la zone efficace, UNE face (mm). */
  hcEff: number;
  /** Aire efficace, UNE face (mm²). */
  AcEff: number;
  fctEff: number;
  sigmaS: number;
  /** Nombre de nappes armees : 2 en gene centree, 1 en flexion. */
  nappes: number;
  /** Approche mince, section tendue entiere (mm², TOTAL). */
  AsMince: number;
  /** Approche epaisse, zone efficace, bornee (mm², TOTAL). */
  AsEpais: number;
  /** Borne anti-plastification (mm², TOTAL). */
  Borne: number;
  /** Armature minimale retenue (mm², TOTAL) — le min des deux approches. */
  AsMin: number;
  AsMinceParNappe: number;
  AsEpaisParNappe: number;
  BorneParNappe: number;
  AsMinParNappe: number;
  approach: 'mince' | 'epaisse';
  massive: boolean;
  method: RestraintMethod;
  thicknessConvention: ThicknessConvention;
  /** Pour CHAQUE grandeur : `calcule` ou `impose`. */
  sources: Record<keyof RestraintOverrides, ValueSource>;
  /**
   * Domaine physique franchi par une valeur IMPOSEE. Signale, jamais ecrete :
   * ecreter retirerait a l'ingenieur la decision qu'il vient explicitement de
   * prendre, ne rien dire la lui laisserait prendre a l'aveugle.
   */
  warnings: string[];
}

export function minimumRestraintArea(
  section: Section,
  restraint: RestraintType,
  options?: RestraintOptions
): RestraintResult {
  if (section.geometry.kind !== 'rectangle') {
    throw new Error(
      'minimumRestraintArea : geometrie non rectangulaire. L aire de beton tendu du ' +
        '§7.3.2 suppose une largeur constante et n est pas transposable telle quelle.'
    );
  }

  const b = section.geometry.width;
  const h = section.geometry.height;

  // `f_yk` sert DEUX fois : comme contrainte d'acier par defaut, et comme
  // denominateur de la borne anti-plastification. Le lire une seule fois
  // evite qu'une section sans armature leve a un endroit et pas a l'autre.
  const fyk = acierDeReference(section);

  const method = options?.method ?? 'din';
  const convention = options?.thicknessConvention ?? 'ec2';
  const overrides = options?.overrides ?? {};
  const sources = {} as Record<keyof RestraintOverrides, ValueSource>;
  const warnings: string[] = [];

  /**
   * LE MECANISME DE FORCAGE. Une valeur imposee court-circuite sa formule et
   * alimente la suite de la chaine ; sa provenance est enregistree, sans quoi
   * la note de calcul ne serait pas relisable.
   */
  function retenu(nom: keyof RestraintOverrides, calcule: number): number {
    const force = overrides[nom];
    if (force !== undefined && Number.isFinite(force)) {
      sources[nom] = 'impose';
      return force;
    }
    sources[nom] = 'calcule';
    return calcule;
  }

  const fctEff = retenu('fctEff', options?.fctEff ?? fctmDepuisFck(section.concrete.fck));
  const sigmaS = retenu('sigmaS', options?.sigmaS ?? fyk);
  const k = retenu('k', thicknessFactor(h, convention));
  const kc = retenu('kc', facteurDeDistribution(restraint, b, h, fctEff, options?.NEd));

  const d1 = retenu('d1', enrobageDAxe(section, h));
  if (d1 >= h / 2) {
    warnings.push(
      `L enrobage d axe d1 = ${d1.toFixed(0)} mm atteint la demi-epaisseur ` +
        `(h/2 = ${(h / 2).toFixed(0)} mm) : la geometrie est incoherente, et h_c,ef en depend.`
    );
  }

  const hcEff = retenu('hcEff', effectiveRestraintHeight(h, d1, restraint, method));

  const nappes = restraint === 'central' ? 2 : 1;
  const Act = retenu('Act', restraint === 'central' ? b * h : (b * h) / 2);
  const AcEff = retenu('AcEff', hcEff * b); // UNE face

  // Domaine physique CONTROLE, jamais ecrete quand la valeur est imposee.
  if (nappes * AcEff > b * h) {
    warnings.push(
      `La zone efficace des ${nappes} faces (${Math.round(nappes * AcEff)} mm²) depasse la ` +
        `section de beton (${Math.round(b * h)} mm²) : h_c,ef impose au-dela de h/2. ` +
        'Le calcul est mene tel quel.'
    );
  }
  if (!(sigmaS > 0)) {
    throw new Error('minimumRestraintArea : contrainte d acier nulle ou negative');
  }

  const AsMince = (kc * k * fctEff * Act) / sigmaS;

  // ⚠ NI `k` NI `kc` ici, et ce n'est pas un oubli. `k` traduit la reduction
  // de l'effort par les contraintes d'auto-equilibre a l'echelle de la
  // SECTION ENTIERE ; l'approche par zone efficace raisonne sur la peau qui
  // travaille reellement, ou cette reduction n'a pas lieu d'etre appliquee
  // une seconde fois. L'appliquer quand meme retirait 35 % d'acier.
  const AsEpaisBrut = (nappes * fctEff * AcEff) / sigmaS;

  // En deca de cette borne, l'acier plastifie a l'instant de la fissuration :
  // la fissure devient unique et large au lieu de rester fine et repartie,
  // c'est-a-dire exactement ce que cette armature existe pour empecher.
  const Borne = (k * fctEff * Act) / fyk;
  const AsEpais = Math.max(AsEpaisBrut, Borne);

  // La norme ne fixe pas de frontiere nette entre mince et epais : on calcule
  // les deux et on retient la plus petite.
  const AsMin = Math.min(AsMince, AsEpais);

  const parNappe = (total: number): number => total / nappes;

  return {
    k, kc, Act, hcEff, AcEff, fctEff, sigmaS, nappes,
    AsMince, AsEpais, Borne, AsMin,
    AsMinceParNappe: parNappe(AsMince),
    AsEpaisParNappe: parNappe(AsEpais),
    BorneParNappe: parNappe(Borne),
    AsMinParNappe: parNappe(AsMin),
    approach: AsMin === AsMince ? 'mince' : 'epaisse',
    massive: h >= 800,
    method,
    thicknessConvention: convention,
    sources,
    warnings,
  };
}

/**
 * Enrobage d'axe `d1` (mm) : du parement au centre de la nappe qui en est la
 * plus proche. C'est lui qui commande la hauteur efficace.
 */
function enrobageDAxe(section: Section, h: number): number {
  if (section.rebars.length === 0) {
    throw new Error(
      'minimumRestraintArea : section sans armature, l enrobage d axe est indefini ' +
        'et la hauteur efficace avec lui.'
    );
  }

  const zTop = -h / 2;
  const zBottom = h / 2;
  return Math.min(...section.rebars.map((r) => Math.min(r.z - zTop, zBottom - r.z)));
}
```

Supprimer l'ancienne fonction `aireEfficace`, devenue sans objet.

- [ ] **Étape 4 : lancer les tests du module**

```bash
cd "/home/hnr/Downloads/code/Section BA" && npx vitest run tests/detailing/restraint.test.ts && npm run typecheck
```

Attendu : PASS, typecheck propre.

- [ ] **Étape 5 : réparer les appelants**

`RestraintResult.AsMin` existait déjà, mais `basis` et l'option `effectiveZoneOnly` ont disparu. Lancer la suite complète et corriger les erreurs de compilation dans `app/src/checks-view.ts`, `app/src/form.ts`, `app/src/main.ts`, `src/persistence/*`.

```bash
cd "/home/hnr/Downloads/code/Section BA" && npm run typecheck
```

- [ ] **Étape 6 : commit**

```bash
cd "/home/hnr/Downloads/code/Section BA"
git add src/detailing/restraint.ts tests/detailing/restraint.test.ts
git commit -m "fix(core): les deux approches sont calculees, la plus petite retenue

La case « zone efficace » choisissait UNE approche ; la norme ne fixe pas de
frontiere nette entre element mince et epais. Les deux sont desormais
calculees et la plus petite retenue, l approche epaisse etant bornee par
k fcteff Act / fyk — en deca, l acier plastifie a la fissuration et la fissure
devient unique et large au lieu de rester fine et repartie.

L approche epaisse n applique NI k NI kc : k traduit une reduction a l echelle
de la section entiere, pas de la peau qui travaille. L appliquer une seconde
fois retirait 35 % d acier.

Le resultat porte le TOTAL et la valeur PAR NAPPE, nommes separement : leur
confusion est la cause classique d un ecart de facteur 2 avec une feuille de
calcul.

Le cas de validation de la spec tombe a 1 % : 27,44 cm2/m par nappe."
```

---

### Tâche B3 : l'affichage et le champ de convention

**Fichiers :**
- Modifier : `Section BA/app/src/checks-view.ts` — `blocZwang`
- Modifier : `Section BA/app/src/form.ts` — `FormState`, `ParametresVerifications`
- Modifier : `Section BA/app/src/main.ts` — le cadre Zwang

- [ ] **Étape 1 : réécrire `blocZwang`**

Dans `app/src/checks-view.ts`, remplacer le corps de `blocZwang` :

```ts
export function blocZwang(entree: Issue<RestraintResult>): BlocService {
  const titre = 'Deformation genee, armature minimale (§7.3.2)';
  if (!('resultat' in entree)) return sansCalcul(titre, `${entree.motif} ${AUCUN_VERDICT}`);

  const r = entree.resultat;
  const parNappe = r.nappes === 2 ? ' par nappe' : '';
  const aire = (mm2: number): string => `${formatNumber(mm2 / 100, 2)} cm²/m${parNappe}`;

  /*
   * Le suffixe « imposé » n'est pas decoratif : c'est ce qui distingue une
   * valeur que la chaine a calculee d'une valeur que l'ingenieur a forcee.
   * Sans lui, la note de calcul presenterait les deux de la meme facon et ne
   * serait verifiable par personne.
   */
  const marque = (nom: keyof typeof r.sources): string =>
    r.sources[nom] === 'impose' ? ' — IMPOSE' : '';

  return {
    titre,
    lignes: [
      // LE RESULTAT D'ABORD, et nomme : total et nappe different d'un facteur
      // 2, et leur confusion est la cause classique d'un ecart avec une
      // feuille de calcul.
      { libelle: 'A_s,min retenu', valeur: aire(r.AsMinParNappe) },
      { libelle: 'A_s,min total (deux nappes)', valeur: `${formatNumber(r.AsMin / 100, 2)} cm²/m` },
      {
        libelle: 'Approche retenue',
        valeur:
          r.approach === 'epaisse'
            ? 'EPAISSE — zone de beton tendu efficace'
            : 'MINCE — section tendue entiere',
      },
      { libelle: 'A_s,min approche mince', valeur: aire(r.AsMinceParNappe) },
      { libelle: 'A_s,min approche epaisse', valeur: aire(r.AsEpaisParNappe) },
      { libelle: 'Borne anti-plastification', valeur: aire(r.BorneParNappe) },
      {
        libelle: 'Methode de h_c,ef',
        valeur:
          r.method === 'ec2'
            ? 'texte EN 1992-1-1 §7.3.2(3) — 2,5·d1'
            : 'pratique allemande — branches selon h/d1',
      },
      {
        libelle: 'Convention du facteur k',
        valeur:
          r.thicknessConvention === 'de'
            ? 'annexe allemande — 0,80 vers 0,50'
            : 'EC2 recommande — 1,00 vers 0,65',
      },
      { libelle: 'k (facteur d epaisseur)', valeur: formatNumber(r.k, 3) + marque('k') },
      { libelle: 'k_c (distribution)', valeur: formatNumber(r.kc, 2) + marque('kc') },
      { libelle: 'd1 (enrobage d axe)', valeur: `${formatNumber(r.d1, 0)} mm${marque('d1')}` },
      { libelle: 'h_c,ef (une face)', valeur: `${formatNumber(r.hcEff, 0)} mm${marque('hcEff')}` },
      { libelle: 'A_c,ef (une face)', valeur: `${formatNumber(r.AcEff, 0)} mm²${marque('AcEff')}` },
      { libelle: 'A_ct (zone tendue entiere)', valeur: `${formatNumber(r.Act, 0)} mm²${marque('Act')}` },
      { libelle: 'f_ct,eff', valeur: `${formatNumber(r.fctEff, 2)} MPa${marque('fctEff')}` },
      { libelle: 'sigma_s', valeur: `${formatNumber(r.sigmaS, 0)} MPa${marque('sigmaS')}` },
      {
        libelle: 'Element massif',
        valeur: r.massive
          ? 'oui (h ≥ 800 mm) : k est a son plancher, l acier exige est reduit d autant'
          : 'non (h < 800 mm)',
      },
    ],
    verdict: null,
    // Les avertissements de domaine passent AVANT les reserves generales :
    // ils portent sur ce calcul-ci, pas sur la methode en general.
    note: [...r.warnings, AUCUN_VERDICT, ECART_AU_TEXTE].join(' '),
  };
}
```

`RestraintResult` doit donc exposer `d1`. L'ajouter au type et au retour de `minimumRestraintArea` de la tâche B2 :

```ts
  /** Enrobage d'axe retenu (mm) — il commande `h_c,ef`. */
  d1: number;
```

et dans le `return` : `k, kc, d1, Act, hcEff, AcEff, …`.

/**
 * L'ecart au texte de l'EN 1992-1-1, affiche et non seulement commente.
 */
const ECART_AU_TEXTE =
  'ECART DOCUMENTE AU TEXTE : les branches de h_c,ef en traction centree (seuils h/d1 = 5 et ' +
  '30) ne figurent pas dans l EN 1992-1-1, dont le §7.3.2(3) ecrit ' +
  'h_c,ef = min(2,5(h−d) ; (h−x)/3 ; h/2). Elles viennent de la pratique allemande. Le facteur ' +
  'k est un PARAMETRE NATIONAL : en Belgique et au Luxembourg, la justification reglementaire ' +
  'reste l EN 1992-1-1 et ses annexes NBN / ILNAS.';
```

- [ ] **Étape 2 : remplacer la case « zone efficace » par le sélecteur de convention**

Dans `app/src/form.ts`, remplacer `zoneEfficace: boolean` par :

```ts
  /**
   * Convention nationale du facteur `k` du §7.3.2(2).
   *
   * Remplace la case « zone efficace », devenue sans objet : les deux
   * approches sont desormais calculees et la plus petite retenue, la norme
   * ne fixant pas de frontiere nette entre element mince et epais.
   */
  thicknessConvention: 'ec2' | 'de';

  /**
   * Famille de formules de `h_c,ef`. Choix INDEPENDANT du precedent : `k` est
   * un parametre d'annexe nationale, `h_c,ef` est un choix de methode.
   */
  restraintMethod: 'ec2' | 'din';

  /**
   * FORCAGE des grandeurs intermediaires. Un champ VIDE veut dire
   * « calcule », jamais zero — un `0` imposerait une valeur nulle et
   * annulerait l'armature en silence.
   */
  impFctEff: string;
  impD1: string;
  impHcEff: string;
  impK: string;
  impKc: string;
  impAct: string;
  impAcEff: string;
  impSigmaS: string;
```

et dans `ParametresVerifications`, remplacer `zoneEfficace: boolean` par :

```ts
  thicknessConvention: 'ec2' | 'de';
  restraintMethod: 'ec2' | 'din';
  /** Grandeurs imposees ; les champs vides sont absents, jamais a zero. */
  restraintOverrides: RestraintOverrides;
```

et, dans `parametresDeVerification`, les lire ainsi :

```ts
  // `nombreOptionnel` rend `undefined` sur un champ vide : c'est exactement
  // ce que `retenu()` interprete comme « calcule ». Un `0` saisi, lui, est
  // une valeur imposee a zero — et il doit le rester.
  const restraintOverrides: RestraintOverrides = {
    ...(nombreOptionnel(form.impFctEff, 'f_ct,eff impose') !== undefined
      ? { fctEff: nombreOptionnel(form.impFctEff, 'f_ct,eff impose') }
      : {}),
    ...(nombreOptionnel(form.impD1, 'd1 impose') !== undefined
      ? { d1: nombreOptionnel(form.impD1, 'd1 impose') }
      : {}),
    ...(nombreOptionnel(form.impHcEff, 'h_c,ef impose') !== undefined
      ? { hcEff: nombreOptionnel(form.impHcEff, 'h_c,ef impose') }
      : {}),
    ...(nombreOptionnel(form.impK, 'k impose') !== undefined
      ? { k: nombreOptionnel(form.impK, 'k impose') }
      : {}),
    ...(nombreOptionnel(form.impKc, 'k_c impose') !== undefined
      ? { kc: nombreOptionnel(form.impKc, 'k_c impose') }
      : {}),
    ...(nombreOptionnel(form.impAct, 'A_ct impose') !== undefined
      ? { Act: nombreOptionnel(form.impAct, 'A_ct impose') }
      : {}),
    ...(nombreOptionnel(form.impAcEff, 'A_c,ef impose') !== undefined
      ? { AcEff: nombreOptionnel(form.impAcEff, 'A_c,ef impose') }
      : {}),
    ...(nombreOptionnel(form.impSigmaS, 'sigma_s impose') !== undefined
      ? { sigmaS: nombreOptionnel(form.impSigmaS, 'sigma_s impose') }
      : {}),
  };
```

Dans `app/src/main.ts`, remplacer le `champCase('zoneEfficace', …)` par les deux listes **distinctes** et le bloc de forçage :

```ts
    ${champChoix(
      'restraintMethod',
      `Methode de calcul de h_c,ef ${info(
        `Deux familles de formules. Le <strong>texte</strong> de l EN 1992-1-1 §7.3.2(3) donne
         <em>2,5·d1</em> ; la <strong>pratique allemande</strong> donne des branches selon
         <em>h/d1</em>, qui croissent avec l epaisseur. Sur un radier de 1,30 m, l ecart entre
         les deux vaut environ 43 % d armature.<br /><br />
         Ce choix est <strong>independant</strong> de la convention de <em>k</em> ci-dessous :
         <em>k</em> est un parametre d annexe nationale, <em>h_c,ef</em> est un choix de
         methode. « Branches allemandes, <em>k</em> de l annexe belge » est un cas
         parfaitement legitime.`,
        'decisif'
      )}`,
      etat.restraintMethod,
      [
        ['din', 'Pratique allemande — branches selon h/d1'],
        ['ec2', 'Texte EN 1992-1-1 §7.3.2(3) — 2,5·d1'],
      ]
    )}
    ${champChoix(
      'thicknessConvention',
      `Convention du facteur k ${info(
        `<em>k</em> est un <strong>parametre national</strong> : 1,00 &rarr; 0,65 en valeurs
         recommandees de l EC2, 0,80 &rarr; 0,50 en annexe allemande. En Belgique et au
         Luxembourg, la justification reglementaire reste l EN 1992-1-1 et ses annexes
         NBN / ILNAS.`,
        'decisif'
      )}`,
      etat.thicknessConvention,
      [
        ['ec2', 'EC2 recommande — 1,00 vers 0,65'],
        ['de', 'Annexe allemande — 0,80 vers 0,50'],
      ]
    )}
    <p class="sous-titre">Forcer des valeurs intermediaires ${info(
      `Un champ <strong>vide</strong> veut dire « calcule ». Une valeur saisie
       <strong>court-circuite sa formule</strong> et alimente la suite de la chaine : imposer
       <em>d1</em> change <em>h_c,ef</em>, imposer <em>f_ct,eff</em> change ce qui en depend.
       Toute valeur imposee est <strong>marquee</strong> dans les resultats et dans la note de
       calcul — une note qui presenterait une valeur forcee comme calculee ne serait
       verifiable par personne.<br /><br />
       Une valeur hors du domaine physique produit un <strong>avertissement</strong>, jamais un
       ecretage silencieux.`
    )}</p>
    ${champTexte('impFctEff', 'f_ct,eff impose (MPa)', etat.impFctEff)}
    ${champTexte('impD1', 'd1 impose (mm)', etat.impD1)}
    ${champTexte('impHcEff', 'h_c,ef impose (mm)', etat.impHcEff)}
    ${champTexte('impK', 'k impose', etat.impK)}
    ${champTexte('impKc', 'k_c impose', etat.impKc)}
    ${champTexte('impAct', 'A_ct impose (mm²)', etat.impAct)}
    ${champTexte('impAcEff', 'A_c,ef impose, une face (mm²)', etat.impAcEff)}
    ${champTexte('impSigmaS', 'sigma_s impose (MPa)', etat.impSigmaS)}
```

Et dans `modelToForm`, ces neuf champs prennent leurs valeurs de départ :

```ts
    thicknessConvention: model.restraint?.thicknessConvention ?? 'ec2',
    restraintMethod: model.restraint?.method ?? 'din',
    // ⚠ CHAINES VIDES et non zeros : un « 0 » serait une valeur imposee a
    // zero, qui annulerait l armature en silence.
    impFctEff: '', impD1: '', impHcEff: '', impK: '',
    impKc: '', impAct: '', impAcEff: '', impSigmaS: '',
```

**Le forçage n'entre PAS dans le modèle**, délibérément : c'est une hypothèse d'examen, pas une donnée d'ouvrage, et la règle de frontière du format s'applique dans son sens habituel. La **méthode** et la **convention de `k`**, elles, s'enregistrent — elles décrivent le référentiel retenu, que la note de calcul doit pouvoir réaffirmer.

- [ ] **Étape 3 : mettre à jour le format de persistance**

Dans `src/persistence/model-format.ts`, remplacer dans `RestraintModel` :

```ts
  /** Calcul sur la seule zone efficace (pratique allemande). Absent : `false`. */
  effectiveZoneOnly?: boolean;
```

par :

```ts
  /**
   * Convention nationale du facteur `k`. Absent : `ec2`.
   *
   * Remplace `effectiveZoneOnly` de la version 4, devenu sans objet : les
   * deux approches sont desormais calculees et la plus petite retenue. Un
   * fichier qui portait l ancien champ le voit IGNORE — le parseur ne leve
   * pas, mais le resultat ne dependra plus de lui.
   */
  thicknessConvention?: 'ec2' | 'de';
  /**
   * Famille de formules de `h_c,ef`. Absent : `din`.
   *
   * S'ENREGISTRE, contrairement au forcage des valeurs intermediaires : la
   * methode decrit le REFERENTIEL retenu, que la note de calcul doit pouvoir
   * reaffirmer six mois plus tard. Un forcage, lui, est une hypothese
   * d'examen — la regle de frontiere du format s'y applique dans son sens
   * habituel, et il se re-choisit.
   */
  method?: 'ec2' | 'din';
```

Dans `src/persistence/parse.ts`, remplacer la fonction `gene` par :

```ts
const CONVENTIONS_D_EPAISSEUR: readonly NonNullable<RestraintModel['thicknessConvention']>[] = [
  'ec2',
  'de',
];
const METHODES_DE_GENE: readonly NonNullable<RestraintModel['method']>[] = ['ec2', 'din'];

function gene(v: unknown, chemin: string): RestraintModel {
  const o = objet(v, chemin);
  const fctEff = optionnel(o.fctEff, `${chemin}.fctEff`, positif);
  const sigmaS = optionnel(o.sigmaS, `${chemin}.sigmaS`, positif);
  const thicknessConvention = optionnel(o.thicknessConvention, `${chemin}.thicknessConvention`, (x, c) =>
    enumere(x, c, CONVENTIONS_D_EPAISSEUR)
  );
  const method = optionnel(o.method, `${chemin}.method`, (x, c) =>
    enumere(x, c, METHODES_DE_GENE)
  );

  // `effectiveZoneOnly` est LU puis JETE : les fichiers enregistres avant la
  // correction le portent, et refuser sa presence les rendrait illisibles du
  // jour au lendemain. Il n'a plus d'effet — les deux approches sont
  // desormais calculees de toute facon — mais on continue d'en verifier le
  // type, pour ne pas laisser passer un fichier corrompu sous couvert de
  // retrocompatibilite.
  optionnel(o.effectiveZoneOnly, `${chemin}.effectiveZoneOnly`, booleen);

  return {
    type: enumere(o.type, `${chemin}.type`, TYPES_DE_GENE),
    ...(fctEff !== undefined ? { fctEff } : {}),
    ...(sigmaS !== undefined ? { sigmaS } : {}),
    ...(thicknessConvention !== undefined ? { thicknessConvention } : {}),
    ...(method !== undefined ? { method } : {}),
  };
}
```

et `geneOrdonnee` par :

```ts
function geneOrdonnee(r: RestraintModel) {
  return {
    type: r.type,
    ...(r.fctEff !== undefined ? { fctEff: r.fctEff } : {}),
    ...(r.sigmaS !== undefined ? { sigmaS: r.sigmaS } : {}),
    ...(r.thicknessConvention !== undefined
      ? { thicknessConvention: r.thicknessConvention }
      : {}),
    ...(r.method !== undefined ? { method: r.method } : {}),
  };
}
```

Dans `src/persistence/resolve.ts`, `ResolvedRestraint.options` suit automatiquement le type `RestraintOptions` ; remplacer la ligne qui recopiait `effectiveZoneOnly` par :

```ts
        ...(model.restraint.thicknessConvention !== undefined
          ? { thicknessConvention: model.restraint.thicknessConvention }
          : {}),
        ...(model.restraint.method !== undefined ? { method: model.restraint.method } : {}),
```

Ajouter le test de rétrocompatibilité dans `tests/persistence/parse.test.ts` :

```ts
it('un fichier portant l ancien effectiveZoneOnly reste lisible', () => {
  const brut = JSON.parse(serializeModel(modeleMinimal()));
  brut.restraint = { type: 'central', effectiveZoneOnly: true };

  const lu = parseModel(JSON.stringify(brut));

  expect(lu.restraint?.type).toBe('central');
  // Le champ est jete : il n a plus d effet, les deux approches etant
  // desormais calculees de toute facon.
  expect('effectiveZoneOnly' in (lu.restraint ?? {})).toBe(false);
});

it('mais un effectiveZoneOnly mal type est toujours refuse', () => {
  const brut = JSON.parse(serializeModel(modeleMinimal()));
  brut.restraint = { type: 'central', effectiveZoneOnly: 'oui' };

  expect(() => parseModel(JSON.stringify(brut))).toThrow(/effectiveZoneOnly/);
});
```

- [ ] **Étape 4 : lancer la suite complète**

```bash
cd "/home/hnr/Downloads/code/Section BA" && npm run typecheck && npx vitest run
```

Attendu : typecheck propre, `FAIL 0`. Corriger les tests de câblage qui assertaient l'ancienne case.

- [ ] **Étape 5 : reconstruire et commit**

```bash
cd "/home/hnr/Downloads/code/Section BA"
npm run build
git add -A
git commit -m "feat(app): le bloc Zwang nomme le total et la nappe, et la convention se choisit

Le resultat d abord, et dit lequel des deux nombres il est : total et nappe
different d un facteur 2, et leur confusion est la cause classique d un ecart
avec une feuille de calcul. Les deux approches, la borne et h_c,ef sont
affichees a cote — un A_s,min sans ses intermediaires n est verifiable par
personne.

La case « zone efficace » devient un selecteur de CONVENTION NATIONALE du
facteur k : les deux approches sont maintenant calculees de toute facon, et
c est k qui reste un choix. L ecart au texte de l EN 1992-1-1 est affiche.

Les fichiers portant l ancien effectiveZoneOnly restent lisibles : le champ
est accepte et ignore."
```

---

### Tâche B4 : le README de section-uls

**Fichiers :**
- Modifier : `Section BA/README.md`

- [ ] **Étape 1 : réécrire la ligne du §7.3.2**

Remplacer la puce « l'armature minimale sous déformation gênée (§7.3.2)… » par :

```markdown
- l'**armature minimale sous déformation gênée** (§7.3.2), qui gouverne les voiles et radiers massifs. Elle **ne rend aucun verdict** : elle donne une aire exigée, elle ne la compare à rien.

  Les **deux approches sont calculées** — section tendue entière, et zone de béton tendu efficace — et **la plus petite est retenue**, la norme ne fixant pas de frontière nette entre élément mince et épais. L'approche épaisse est bornée par `k·f_ct,eff·A_ct/f_yk` : en deçà, l'acier plastifie à l'instant de la fissuration et la fissure devient unique et large au lieu de rester fine et répartie — exactement ce que cette armature existe pour empêcher.

  Le résultat porte le **total** et la valeur **par nappe**, nommés séparément. Leur confusion est la cause classique d'un écart de facteur 2 avec une feuille de calcul.

  **Écart documenté au texte :** `h_c,ef` suit des branches fonction de `h/d1` (seuils 5 et 30 en traction centrée, 10 et 60 en flexion) qui ne figurent pas dans l'EN 1992-1-1, dont le §7.3.2(3) écrit `h_c,ef = min(2,5(h−d) ; (h−x)/3 ; h/2)`. Elles viennent de la pratique allemande (Schneider ; Fingerloos, Hegger, Zilch). Employer les branches de la **flexion** sur un bridage **centré** — ce que faisait le code — sous-estimait l'armature d'environ 43 % sur un radier de 1,30 m.

  Le facteur `k` est un **paramètre national** et se choisit : 1,00 → 0,65 (recommandé EC2) ou 0,80 → 0,50 (annexe allemande).
```

- [ ] **Étape 2 : commit**

```bash
cd "/home/hnr/Downloads/code/Section BA"
git add README.md && git commit -m "docs: la correction de l armature minimale sous bridage centre"
```

---

## Revue finale, une fois les deux phases exécutées

- [ ] Les deux outils rendent **27,44 cm²/m par nappe** sur le cas §7, en convention EC2 **et** en convention allemande.
- [ ] Les deux affichent le total **et** la nappe, chacun nommé.
- [ ] Les deux portent l'écart au texte de l'EN 1992-1-1 **à l'écran**, pas seulement dans le code.
- [ ] **Méthode :** basculer sur « texte EN 1992-1-1 » fait passer `h_c,ef` de 240 à 137,5 mm dans les deux outils.
- [ ] **Indépendance :** changer la convention de `k` ne change **pas** `h_c,ef`, et changer la méthode ne change **pas** `k`.
- [ ] **Forçage :** chacune des grandeurs `f_ct,eff`, `d1`, `h_c,ef`, `k`, `k_c`, `A_ct`, `A_c,ef`, `σ_s` peut être imposée, et la valeur imposée apparaît **marquée** à l'écran.
- [ ] **Traçabilité :** la note de calcul et le CSV portent la marque « imposé ». Une note où un `h_c,ef` forcé passerait pour calculé est un **échec de cette revue**.
- [ ] **Avertissement sans écrêtage :** forcer `h_c,ef = 900` sur `h = 1300` produit un avertissement, et la valeur employée reste 900.
- [ ] **Champ vide ≠ zéro :** vider un champ de forçage rend la main au calcul ; y saisir `0` impose bien zéro.
- [ ] `node --test` passe dans Structura ; `npx vitest run` passe dans section-uls.
- [ ] `npm run build` a été relancé dans section-uls avant le push (`docs/` est la page publiée).

## Ce que ce plan ne fait PAS, délibérément

- **`phi*` n'est jamais recalculé.** La spec §4.7 signale une ambiguïté non levée sur l'emplacement du rapport `fct0/fct,eff` et sur la définition de `hcr` en traction pure ; la reproduction de la feuille de référence n'est obtenue qu'avec `hcr = h` et sans le facteur. Le figer dans le code inscrirait une hypothèse que personne n'a confirmée. Il reste une **entrée**, ce que la spec recommande elle-même.
- **La flexion n'est pas retouchée** au-delà de ses branches `hcef`. Le `kc` de flexion est hors périmètre de la spec, et l'expression actuelle de l'éq. (7.2) reste en place.
- **Le forçage ne s'enregistre pas dans le modèle.** C'est une hypothèse d'examen, pas une donnée d'ouvrage : la règle de frontière du format s'y applique dans son sens habituel, et il se re-choisit à chaque ouverture. Un `h_c,ef` forcé qui ressortirait d'un fichier six mois plus tard, sans que personne se souvienne de l'avoir imposé, serait exactement ce que cette règle existe pour empêcher. La **méthode** et la **convention de `k`**, elles, s'enregistrent : elles décrivent le référentiel retenu, que la note doit pouvoir réaffirmer.
- **Aucune valeur forcée n'est validée contre la norme.** Le module contrôle le **domaine physique** — aires négatives, zone efficace au-delà de la section — et rien d'autre. Forcer `k = 2,0` est accepté sans commentaire : c'est un outil d'ingénieur, et le marquage « imposé » suffit à rendre la décision visible.
- **section-uls ne reçoit ni sélecteur de scénario, ni dérivation de `σs` par `Ø*`.** Ce n'est pas un oubli : `f_ct,eff` et `σ_s` y sont **déjà des champs libres**, avec leur avertissement. Ajouter un scénario qui calculerait `max(f_ctm ; 3,0)` dans une case au-dessus d'un champ où l'on peut taper `3.0` créerait deux chemins pour une seule valeur, et la question « lequel gagne ? » à chaque relecture de fichier. Structura, lui, les reçoit — c'est l'outil dédié, et c'est là que le pré-dimensionnement se fait.

  **Conséquence à connaître :** pour reproduire le cas §7 dans section-uls, il faut saisir `f_ct,eff = 2,317` et `σ_s = 202,7` à la main. C'est ce que fait la tâche B2 dans son test.
- **Aucun code n'est partagé entre les deux dépôts.** Ils restent autonomes ; c'est le cas de validation qui est commun.
