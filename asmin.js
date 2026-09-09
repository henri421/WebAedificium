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
 * ses annexes nationales. Le choix se fait par `methode`.
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
 * Employer les branches de la FLEXION sur un bridage CENTRE — ce que faisait
 * le code — fait tomber `hcef` de 240 a 137,5 mm sur le cas de validation,
 * soit environ 43 % d'armature en moins.
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
 * `methode` ('ec2' | 'din') ; `conventionK` ('ec2' | 'de') ; `sollicitation`
 * ('traction' | 'flexion') ; `scenario` ('jeune' | 'tardif') ; puis
 * `phiStar` (mm) OU `sigs` (MPa) ; et `impose` pour forcer des grandeurs.
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
  } else if (impose.sigs !== undefined && impose.sigs !== null && impose.sigs !== '' && !Number.isNaN(Number(impose.sigs))) {
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
