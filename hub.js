"use strict";
const $ = id => document.getElementById(id);

/* =========================================================
   LANGUE
   Une seule page de script pour les deux langues : `<html lang>` decide.
   Chaque texte affiche porte ses deux versions cote a cote, `T(fr, en)`,
   pour qu'une phrase ajoutee en francais ne puisse pas oublier l'anglais.
   La page anglaise vit dans `en/` : les chemins relatifs y remontent d'un cran.
   ========================================================= */
const EN = document.documentElement.lang === "en";
const T = (fr, en) => (EN ? en : fr);
const RACINE = EN ? "../" : "";
const LOCALE = EN ? "en-GB" : "fr-FR";
/** Nombre ecrit dans un texte : virgule decimale en francais, point en anglais. */
const dec = s => (EN ? String(s) : String(s).replace(".", ","));

/* =========================================================
   REGISTRE DES PAGES ET DU MENU
   Pour ajouter un outil : ecrire une fonction render(container),
   l'enregistrer dans PAGES ; pour un outil separe, ajouter son adresse dans
   OUTILS_EXTERNES et une entree dans GROUPES.
   ========================================================= */
const PAGES = {
  accueil:     { title:T("Accueil","Home"),                                            render:v=>renderTableau(v,null) },
  fissuration: { title:T("Armature minimale de fissuration","Minimum crack-control reinforcement"), render:renderFissuration },
};

/*
 * Les outils de la suite vivent dans des DEPOTS SEPARES, chacun avec sa propre
 * pile technique et sa propre adresse. Cette page les relie ; elle ne les
 * absorbe pas. Une entree de menu porte donc soit une route interne
 * (`["route","Libelle"]`), soit une adresse externe
 * (`{href:"…", label:"…"}`).
 */
const OUTILS_EXTERNES = {
  sectionUls:   "https://henri421.github.io/section-uls/",
  stm:          "https://henri421.github.io/MBT/",
  poinconnement:"https://henri421.github.io/poinconnement/",
  assemblages:  "https://henri421.github.io/assemblages-ec3/",
  schema:       "https://henri421.github.io/schema-statique/",
  poutres:      "https://henri421.github.io/beam/",
  climat:       "https://henri421.github.io/charges-climatiques/",
  ancrages:     "https://henri421.github.io/dispositions-constructives/",
  colonne:      "https://henri421.github.io/colonne_ec2/",
  sectionsEc3:  "https://henri421.github.io/sections-ec3/",
  ec2Gen2:      "https://henri421.github.io/blog/",
  fondbis:      "https://henri421.github.io/Fondbis/",
  regard:       "https://henri421.github.io/regard/",
  combinaisons: "https://henri421.github.io/combinaisons-actions/",
  interface:    "https://henri421.github.io/cisaillement-interface/",
  equilibre:    "https://henri421.github.io/equilibre-statique/",
};
/*
 * Outils qui ont une version anglaise, dans leur sous-dossier `en/`. Les
 * autres restent en francais : la page anglaise y renvoie quand meme, en le
 * signalant.
 */
const AVEC_ANGLAIS = new Set(["sectionUls","stm","poinconnement","assemblages","poutres","climat","ancrages","colonne","sectionsEc3","combinaisons","interface","equilibre"]);
const adresse = cle => (EN && AVEC_ANGLAIS.has(cle) ? OUTILS_EXTERNES[cle] + "en/" : OUTILS_EXTERNES[cle]);

/*
 * Les outils sont ranges PAR EUROCODE : c'est l'adresse qu'un ingenieur a deja
 * en tete (« le poinconnement, c'est l'EN 1992 »). Chaque groupe est aussi une
 * page du tableau de bord (#en1992…), l'accueil les montre tous.
 * Un outil porte soit `href` (outil separe, nouvel onglet ; null = pas encore
 * publie), soit `route` (page interne a ce hub). `fr` : outil sans version
 * anglaise.
 */
const GROUPES = [
  { id:"en1990", num:"EN 1990", titre:T("Bases de calcul","Basis of structural design"), note:T("Combinaisons d'actions et équilibre statique.","Combinations of actions and static equilibrium."), outils:[
      {"nom": T("Combinaisons d'actions","Combinations of actions"), "court": T("ELU, ELS, coefficients ψ et γ","ULS, SLS, ψ and γ factors"), "href": adresse("combinaisons"), "icone": "icones/combinaisons.svg", "long": T("Combinaisons de l'EN 1990 pour les bâtiments : ELU EQU, STR/GEO (6.10 ou 6.10a/b), GEO, accidentelles, ELS caractéristiques, fréquentes et quasi permanentes ; groupes d'actions exclusives, valeurs combinées et enveloppes. Export CSV et Excel ; import des cas de neige et vent.","EN 1990 combinations for buildings: ULS EQU, STR/GEO (6.10 or 6.10a/b), GEO, accidental, characteristic, frequent and quasi-permanent SLS; groups of mutually exclusive actions, combination values and envelopes. CSV and Excel export; import of snow and wind cases.")},
      {"nom": T("Équilibre statique","Static equilibrium"), "court": T("Renversement, glissement, soulèvement","Overturning, sliding, uplift"), "href": adresse("equilibre"), "icone": "icones/equilibre.svg", "long": T("Équilibre d'un élément plan à l'ELU : segments pesants (L, U, cadres), charges ponctuelles, réparties, triangulaires, trapézoïdales et moments. Bras de levier et rôle de chaque charge, renversement (EQU) avec tableau charge / distance / &gamma;<sub>f</sub> / moments stabilisants et déstabilisants, glissement, soulèvement (UPL), position de la résultante.","ULS equilibrium of a plane element: self-weight segments (L, U, frames), point, distributed, triangular and trapezoidal loads and moments. Lever arm and role of each load, overturning (EQU) with a load / distance / &gamma;<sub>f</sub> / stabilising and destabilising moments table, sliding, uplift (UPL), position of the resultant.")}
  ]},
  { id:"en1991", num:"EN 1991", titre:T("Actions","Actions"), note:T("Actions climatiques sur les bâtiments.","Climatic actions on buildings."), outils:[
      {"nom": T("Neige et vent","Snow and wind"), "court": T("Charges climatiques, EN 1991-1-3 et 1-4","Climatic loads, EN 1991-1-3 and 1-4"), "href": adresse("climat"), "icone": "icones/climat.svg", "long": T("Charges de neige (EN 1991-1-3) et actions du vent (EN 1991-1-4) sur un bâtiment rectangulaire, zone par zone : pression de pointe, zonage des parois et des toitures, c<sub>pe,1</sub> et c<sub>pe,10</sub>, cas de neige et accumulations. Profil normatif sourcé, v<sub>b,0</sub> et s<sub>k</sub> saisis.","Snow loads (EN 1991-1-3) and wind actions (EN 1991-1-4) on a rectangular building, zone by zone: peak velocity pressure, zoning of walls and roofs, c<sub>pe,1</sub> and c<sub>pe,10</sub>, snow cases and drifts. Code profile with its sources, v<sub>b,0</sub> and s<sub>k</sub> entered.")}
  ]},
  { id:"en1992", num:"EN 1992", titre:T("Béton","Concrete"), note:T("Calcul des structures en béton. Génération 2004, bascule vers 2023 là où elle existe.","Design of concrete structures. 2004 generation, with a switch to 2023 where it exists."), outils:[
      {"nom": T("Vérification de sections","Section verification"), "court": T("Flexion déviée, service, tranchant","Biaxial bending, service, shear"), "href": adresse("sectionUls"), "icone": "icones/sectionUls.svg", "long": T("Flexion composée droite et déviée à l'ELU, domaines d'interaction, vérifications de service (contraintes, ouverture de fissures, courbure), effort tranchant &sect;6.2, dispositions constructives &sect;9.","Uniaxial and biaxial bending with axial force at the ULS, interaction domains, service verifications (stresses, crack width, curvature), shear 6.2, detailing 9.")},
      {"nom": T("Poutres continues","Continuous beams"), "court": T("Enveloppes, ferraillage, flèche","Envelopes, reinforcement, deflection"), "href": adresse("poutres"), "icone": "icones/poutres.svg", "long": T("Poutres continues et hyperstatiques : appuis, ressorts, rotules, tassements ; charges G et Q. Enveloppes ELU et ELS avec charges alternées, puis béton armé (aciers, effort tranchant, épure d'arrêt, ancrages) ou acier (section, déversement, flèche, via sections-ec3).","Continuous and statically indeterminate beams: supports, springs, hinges, settlements; G and Q loads. ULS and SLS envelopes with pattern loading, then reinforced concrete (reinforcement, shear, curtailment, anchorages) or steel (section, lateral-torsional buckling, deflection, via sections-ec3).")},
      {"nom": T("Colonne EC2","EC2 column"), "court": T("Flambement et second ordre §5.8","Buckling and second order 5.8"), "href": adresse("colonne"), "icone": "icones/colonne.svg", "long": T("Poteaux en béton armé : flambement et effets du second ordre (EN 1992-1-1 &sect;5.8, courbure nominale ou rigidité nominale), analyse P-&Delta; itérative, résistance de section N-M et flexion déviée.","Reinforced concrete columns: buckling and second-order effects (EN 1992-1-1, 5.8, nominal curvature or nominal stiffness), iterative P-&Delta; analysis, N-M section resistance and biaxial bending.")},
      {"nom": T("Poinçonnement","Punching shear"), "court": T("Dalles sur poteaux §6.4","Flat slabs on columns 6.4"), "href": adresse("poinconnement"), "icone": "icones/poinconnement.svg", "long": T("Dalles pleines au droit d'un poteau (&sect;6.4) : périmètres de contrôle par construction géométrique, coefficient d'excentrement, résistance avec et sans armatures, écrasement au nu du poteau.","Solid slabs at a column (6.4): control perimeters by geometric construction, eccentricity factor, resistance with and without shear reinforcement, crushing at the column face.")},
      {"nom": T("Cisaillement à l'interface","Interface shear"), "court": T("Reprises de bétonnage","Construction joints"), "href": adresse("interface"), "icone": "icones/interface.svg", "long": T("Reprises de bétonnage, dalle sur prédalle : v<sub>Edi</sub> et v<sub>Rdi</sub> selon l'EN 1992-1-1:2004 (&sect;6.2.5) ou 2023 (&sect;8.2.6, armatures ancrées ou non, effet de goujon). Un bouton bascule d'une génération à l'autre sans ressaisie.","Construction joints, topping on precast slab: v<sub>Edi</sub> and v<sub>Rdi</sub> to EN 1992-1-1:2004 (6.2.5) or 2023 (8.2.6, anchored or unanchored reinforcement, dowel action). One button switches from one generation to the other without re-entering data.")},
      {"nom": T("Ancrages et recouvrements","Anchorage and laps"), "court": T("Dispositions constructives §8","Detailing 8"), "href": adresse("ancrages"), "icone": "icones/ancrages.svg", "long": T("Longueurs d'ancrage et de recouvrement (EN 1992-1-1 &sect;8) : adhérence, coefficients &alpha;<sub>1</sub> à &alpha;<sub>6</sub> avec leur statut, borne 0,7, armatures de couture, paquets de barres, mandrins, cadres, synthèse par diamètre.","Anchorage and lap lengths (EN 1992-1-1, 8): bond, coefficients &alpha;<sub>1</sub> to &alpha;<sub>6</sub> with their status, 0.7 bound, transverse reinforcement at laps, bundled bars, mandrels, links, summary by diameter.")},
      {"nom": T("Bielle-tirant","Strut-and-tie"), "court": T("Zones D en 2D et 3D","D-regions in 2D and 3D"), "href": adresse("stm"), "icone": "icones/stm.svg", "long": T("Zones D en 2D et 3D (semelles sur pieux) : solveur par la méthode des rigidités, vérifications &sect;6.5, optimisation de Schlaich, choix des aciers HA, export DXF. Fonctionne hors ligne.","D-regions in 2D and 3D (pile caps): stiffness-method solver, verifications 6.5, Schlaich optimisation, choice of ribbed bars, DXF export. Works offline.")},
      {"nom": T("Armature minimale de fissuration","Minimum crack-control reinforcement"), "court": T("Déformation gênée, éléments massifs","Restrained deformation, massive members"), "route": "fissuration", "icone": "icones/fissuration.svg", "long": T("Éléments massifs sous déformation gênée. Équation 7.1, réduction pour élément épais, vérification de l'ouverture de fissure.","Massive members under restrained deformation. Expression (7.1), reduction for thick members, crack width verification.")},
      {"nom": T("Murs en L","L-shaped walls"), "court": T("Stabilité et ferraillage","Stability and reinforcement"), "href": null, "long": T("Murs de soutènement en L : poussée des terres, stabilité externe (renversement, glissement, portance) et ferraillage du voile et de la semelle, en appelant les moteurs de l'équilibre statique, des sections en béton armé et du sol. En préparation.","L-shaped retaining walls: earth pressure, external stability (overturning, sliding, bearing) and reinforcement of the stem and the base, using the static equilibrium, reinforced concrete section and soil engines. In preparation.")}
  ]},
  { id:"en1993", num:"EN 1993", titre:T("Acier","Steel"), note:T("Profils laminés, reconstitués et creux ; assemblages.","Rolled, welded and hollow sections; joints."), outils:[
      {"nom": T("Sections acier","Steel sections"), "court": T("Classes, résistances, instabilités","Classes, resistances, buckling"), "href": adresse("sectionsEc3"), "icone": "icones/sectionsEc3.svg", "long": T("Profils IPE, HEA, HEB, PRS et tubes (EN 1993-1-1) : propriétés recalculées, classification sous la sollicitation réelle, sections efficaces de classe 4, résistances, flambement, déversement (M<sub>cr</sub> hors norme signalé) et flexion composée.","IPE, HEA, HEB, welded and hollow sections (EN 1993-1-1): recalculated properties, classification under the actual action effects, class 4 effective sections, resistances, flexural buckling, lateral-torsional buckling (M<sub>cr</sub> outside the code, flagged) and combined bending and axial force.")},
      {"nom": T("Assemblages soudés et boulonnés","Welded and bolted joints"), "court": T("Soudures, platines, éclissages","Welds, plates, splices"), "href": adresse("assemblages"), "icone": "icones/assemblages.svg", "long": T("Cordons d'angle et pénétrations (EN 1993-1-8 &sect;4.5) : tête d'ancrage de tirant sur béton ou sur lierne, té, cruciforme, angle, recouvrement, profilé sur platine. Éclissage boulonné (&sect;3.4 à &sect;3.10) : cisaillement, pression diamétrale, groupe, section nette, cisaillement de bloc. Arrachement lamellaire, dispositions constructives.","Fillet and penetration welds (EN 1993-1-8, 4.5): tie anchor head on concrete or on a waler, tee, cruciform, corner, lap, section on end plate. Bolted splice (3.4 to 3.10): shear, bearing, bolt group, net section, block tearing. Lamellar tearing, detailing.")}
  ]},
  { id:"en1996", num:"EN 1996", titre:T("Maçonnerie","Masonry"), note:T("Maçonnerie non armée.","Unreinforced masonry."), outils:[
      {"nom": T("Regards en maçonnerie","Masonry manholes"), "court": T("Regards enterrés sous trafic","Buried manholes under traffic"), "href": adresse("regard"), "fr": true, "icone": "icones/regard.svg", "long": T("Murs de regards enterrés en maçonnerie non armée sous poussée des terres et trafic (SLW 60, LM1 ou charge saisie) : prédimensionnement EN 1996-3, bande verticale, méthode complète EN 1996-1-1 (compression, flexion, voûte horizontale, charge concentrée, cisaillement, soulèvement). Tables normatives pré-remplies, à vérifier.","Walls of buried manholes in unreinforced masonry under earth pressure and traffic (SLW 60, LM1 or entered load): EN 1996-3 preliminary design, vertical strip, full EN 1996-1-1 method (compression, bending, horizontal arching, concentrated load, shear, uplift). Code tables pre-filled, to be checked.")}
  ]},
  { id:"en1997", num:"EN 1997", titre:T("Géotechnique","Geotechnics"), note:T("Fondations, soutènements et stabilité des pentes.","Foundations, retaining structures and slope stability."), outils:[
      {"nom": T("Fondations et soutènements","Foundations and retaining structures"), "court": T("Semelles, pieux, parois, talus","Footings, piles, walls, slopes"), "href": adresse("fondbis"), "fr": true, "icone": "icones/fondbis.svg", "long": T("Un modèle de terrain pour toutes les vérifications (EN 1997-1:2004) : semelles et radiers, pieux, mur en L, paroi phasée, terre armée, stabilité de talus chargé (Bishop, DA1/DA2/DA3). Coefficients du sol renforcé indicatifs, à confirmer selon la NF P 94-270.","One ground model for all verifications (EN 1997-1:2004): footings and rafts, piles, L-shaped wall, staged retaining wall, reinforced earth, stability of a loaded slope (Bishop, DA1/DA2/DA3). Reinforced soil coefficients indicative, to be confirmed against NF P 94-270.")},
      {"nom": T("Tirants de paroi","Wall anchors"), "court": T("Ancrages d'une paroi de soutènement","Anchors of a retaining wall"), "href": null, "long": T("Vérification des tirants d'ancrage d'une paroi de soutènement (EN 1997-1 &sect;8). En préparation.","Verification of the ground anchors of a retaining wall (EN 1997-1, 8). In preparation.")}
  ]},
  { id:"outils", num:T("Outils","Tools"), titre:T("Hors Eurocode","Outside the Eurocodes"), note:T("Schémas pour les notes de calcul et veille normative.","Diagrams for calculation notes and code watch."), outils:[
      {"nom": T("Schéma statique","Structural diagram"), "court": T("Schémas pour les notes de calcul","Diagrams for calculation notes"), "href": adresse("schema"), "fr": true, "icone": "icones/schema.svg", "long": T("Schémas de poutres, portiques et consoles pour les notes de calcul : appuis, charges nommées, cotes, cas pratiques prêts à l'emploi et bibliothèque de modèles. Export SVG et PNG. Dessine, ne calcule pas.","Diagrams of beams, frames and cantilevers for calculation notes: supports, named loads, dimensions, ready-to-use practical cases and a model library. SVG and PNG export. Draws, does not calculate.")},
      {"nom": T("EC2 2e génération","EC2 2nd generation"), "court": T("Ce qui change avec l'EN 1992-1-1:2023","What changes with EN 1992-1-1:2023"), "href": adresse("ec2Gen2"), "fr": true, "icone": "icones/ec2Gen2.svg", "long": T("Ce qui change avec l'EN 1992-1-1:2023, mécanisme par mécanisme : effort tranchant, poinçonnement, fissuration, ancrages. Articles avec exemples chiffrés et calculateurs qui rendent côte à côte les deux générations et tous les niveaux d'approximation.","What changes with EN 1992-1-1:2023, mechanism by mechanism: shear, punching shear, cracking, anchorage. Articles with worked examples and calculators that show both generations and every level of approximation side by side.")}
  ]}
];

for(const g of GROUPES){
  PAGES[g.id] = { title:`${g.num} · ${g.titre}`, render:v=>renderTableau(v,g.id) };
}
const publies = g => g.outils.filter(o=>o.href!==null).length;
/** Sur la page anglaise, un outil reste parfois en francais : on le dit. */
const enFrancais = o => (EN && o.fr ? ` <small>(French only)</small>` : "");

function buildMenu(){
  const m=$("menu");
  let h=`<a class="item" href="#accueil" data-route="accueil">${T("Accueil","Home")}</a>`;
  GROUPES.forEach(g=>{
    h+=`<div class="menu-group"><a class="menu-group-lbl" href="#${g.id}" data-route="${g.id}">${g.num} · ${g.titre}</a></div>`;
    g.outils.forEach(o=>{
      // Outil separe : lien sortant, nouvel onglet. L'utilisateur doit savoir
      // qu'il quitte cette page.
      if(o.route) h+=`<a class="item" href="#${o.route}" data-route="${o.route}">${o.nom}</a>`;
      else if(o.href===null) h+=`<span class="item disabled">${o.nom} <small>(${T("non publié","not published")})</small></span>`;
      else h+=`<a class="item" href="${o.href}" target="_blank" rel="noopener">${o.nom}${enFrancais(o)}</a>`;
    });
  });
  m.innerHTML=h;
}
function setActive(route){
  document.querySelectorAll("#menu a[data-route]").forEach(a=>{
    const on=a.dataset.route===route;
    a.classList.toggle("active",on);
    if(on)a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current");
  });
}
/*
 * Le tiroir de navigation. Un seul chemin d'ouverture et de fermeture : la
 * classe sur `body`. L'etat de l'icone la suit, sinon un lecteur d'ecran
 * annoncerait un menu ferme alors qu'il est ouvert.
 */
function toggleNav(open){
  document.body.classList.toggle("nav-open",open);
  const b=$("hamb");
  if(b) b.setAttribute("aria-expanded", open?"true":"false");
}
document.addEventListener("keydown", e=>{ if(e.key==="Escape") toggleNav(false); });

/* Le lien de langue garde la page ouverte : #fissuration reste #fissuration. */
function lienDeLangue(){
  const a=$("langue"); if(a) a.href=(EN?"../":"en/")+location.hash;
}

function router(){
  const route = (location.hash.replace("#","")||"accueil");
  const page = PAGES[route] || PAGES.accueil;
  document.title = page.title + " · Aedificium";
  const view=$("view"); view.innerHTML="";
  page.render(view);
  setActive(PAGES[route]?route:"accueil");
  lienDeLangue();
  toggleNav(false);
  window.scrollTo(0,0);
}
window.addEventListener("hashchange",router);

/* =========================================================
   PAGE : ACCUEIL ET PAGES PAR EUROCODE (tableau de bord)
   ========================================================= */
function tuile(o){
  // Sans icone dessinee : l'initiale, sur un pave neutre.
  const ic = o.icone
    ? `<img class="ic" src="${RACINE}${o.icone}" alt="" width="64" height="64">`
    : `<span class="ic ic-vide" aria-hidden="true">${o.nom[0]}</span>`;
  const corps = `${ic}<b>${o.nom}</b><small>${o.court}${enFrancais(o)}</small><p class="long">${o.long}</p>`;
  if(o.href===null) return `<div class="tuile attente">${corps}<span class="status">${T("non publié","not published")}</span></div>`;
  if(o.route) return `<a class="tuile" href="#${o.route}">${corps}</a>`;
  return `<a class="tuile" href="${o.href}" target="_blank" rel="noopener">${corps}<span class="ext" title="${T("Outil séparé, s'ouvre dans un nouvel onglet","Separate tool, opens in a new tab")}">↗<span class="sr"> (${T("nouvel onglet","new tab")})</span></span></a>`;
}

function renderTableau(view,id){
  const g = GROUPES.find(x=>x.id===id);
  const total = GROUPES.reduce((n,x)=>n+publies(x),0);
  const nav = `<a href="#accueil" class="${g?"":"actif"}"${g?"":' aria-current="page"'}><span class="num">${T("Tout","All")}</span>${T("Tous les outils","All tools")}<i>${total}</i></a>`
    + GROUPES.map(x=>`<a href="#${x.id}" class="${x===g?"actif":""}"${x===g?' aria-current="page"':""}><span class="num">${x.num}</span>${x.titre}<i>${publies(x)}</i></a>`).join("");
  const tete = g
    ? `<div class="page-h"><div><div class="eyebrow">${T("Accueil","Home")} · ${g.num}</div><h1>${g.titre}</h1><div class="sub">${g.note}</div></div></div>`
    : `<div class="page-h"><div><div class="eyebrow">${T("Suite d'outils · Eurocodes","Tool suite · Eurocodes")}</div><h1>${T("Calcul de structures","Structural design")}</h1>
         <div class="sub">${T("Outils de calcul pour bureau d'études, exécutés localement dans le navigateur, rangés par Eurocode.","Design tools for engineering offices, run locally in the browser, arranged by Eurocode.")}</div></div></div>
       <p class="lead">${T("Chaque outil expose la chaîne de calcul complète, avec les valeurs substituées, de sorte que la formule reste lisible derrière le résultat. Les outils marqués ↗ sont des applications séparées : ils s'ouvrent dans un nouvel onglet.","Each tool shows the full calculation chain, with the values substituted, so that the formula stays readable behind the result. Tools marked ↗ are separate applications: they open in a new tab.")}</p>`;
  const corps = g
    ? `<div class="tuiles detail">${g.outils.map(tuile).join("")}</div>`
    : GROUPES.map(x=>`<section class="tb-groupe"><h2><a href="#${x.id}"><span class="num">${x.num}</span> ${x.titre}</a></h2>
         <div class="tuiles">${x.outils.map(tuile).join("")}</div></section>`).join("");
  view.innerHTML = `<div class="tb"><nav class="tb-nav" aria-label="Eurocodes">${nav}</nav><div class="tb-main">${tete}${corps}</div></div>`;
}

/* =========================================================
   PAGE : PLACEHOLDER "À VENIR"
   ========================================================= */
function renderSoon(view,title,cat,desc){
  view.innerHTML=`
  <div class="page-h">
    <div><div class="eyebrow">${cat}</div><h1>${title}</h1><div class="sub">${T("Module en préparation","Module in preparation")}</div></div>
  </div>
  <div class="placeholder">
    <div class="big">${T("Outil à venir","Tool to come")}</div>
    <p>${desc}</p>
    <p style="margin-top:14px"><a href="#accueil" style="color:var(--accent)">${T("Retour à l'accueil","Back to home")}</a></p>
  </div>`;
}

/* =========================================================
   PAGE : ARMATURE MINIMALE DE FISSURATION
   ========================================================= */
const F_IDS=["fck","s","t","mode","fcteff","kzt","methode","convK","fyk","sigsMode","sigsVal","phistar","h","b","c","phi","cas","wk","asprov","kt","k1","k2","k3","k4",
  // Champs de FORCAGE. Vides par defaut : un champ vide veut dire « calcule ».
  "impFctm","impFcteff","impD1","impHcef","impK","impKc","impAct","impAceff","impSigs"];

const F_DEF={fck:30,s:"0.25",t:3,mode:"impose",fcteff:2.9,kzt:0.8,methode:"din",convK:"ec2",fyk:500,sigsMode:"fyk",sigsVal:320,phistar:13.54,h:1000,b:1000,c:50,phi:12,cas:"traction",wk:0.3,asprov:8000,kt:0.4,k1:0.8,k2:1.0,k3:3.4,k4:0.425,
  // ⚠ CHAINES VIDES et non zeros : un « 0 » dans un champ de forcage serait
  // une valeur imposee a zero, ce qui annulerait l armature en silence.
  impFctm:"",impFcteff:"",impD1:"",impHcef:"",impK:"",impKc:"",impAct:"",impAceff:"",impSigs:""};
let fissState={};

const fmt=(x,d=2)=>(isFinite(x)?x.toLocaleString(LOCALE,{minimumFractionDigits:d,maximumFractionDigits:d}):"—");
const fmt0=x=>(isFinite(x)?Math.round(x).toLocaleString(LOCALE):"—");

/*
 * Les avertissements viennent d'asmin.js, en francais. La page anglaise les
 * traduit ici, a l'affichage : asmin.js reste tel que ses tests le connaissent.
 */
const AVERT_EN = [
  [/^L'enrobage d'axe d1 = (.+) mm atteint la demi-epaisseur \(h\/2 = (.+) mm\) : la geometrie est incoherente, et hc,ef comme A_ct en dependent\.$/,
    "The axis distance d1 = $1 mm reaches half the thickness (h/2 = $2 mm): the geometry is inconsistent, and both hc,ef and A_ct depend on it."],
  [/^La zone efficace des (\d+) faces \((\d+) mm²\) depasse la section de beton \((\d+) mm²\) : hc,ef impose au-dela de h\/2\. Le calcul est mene tel quel\.$/,
    "The effective area of the $1 faces ($2 mm²) exceeds the concrete section ($3 mm²): hc,ef imposed beyond h/2. The calculation is carried out as it stands."],
];
const avertissement = a => {
  if(!EN) return a;
  for(const [motif,en] of AVERT_EN) if(motif.test(a)) return a.replace(motif,en);
  return a;
};
const approche = a => (EN ? ({mince:"thin",epaisse:"thick"}[a] || a) : a);

function renderFissuration(view){
  view.innerHTML = FISS_HTML();
  F_IDS.forEach(k=>{ const el=$(k); if(!el)return; el.value = (k in fissState)?fissState[k]:F_DEF[k]; });
  F_IDS.forEach(k=>{
    const el=$(k);
    el.addEventListener("input",()=>{ fissState[k]=el.value; fissRender(); });
  });
  $("cas").addEventListener("change",()=>{ $("k2").value=($("cas").value==="traction")?1.0:0.5; fissState.k2=$("k2").value; fissRender(); });
  buildBetonTable();
  fissRender();
}

function fissReadInputs(){
  const v={}; F_IDS.forEach(k=>{ const el=$(k); v[k]=(el.tagName==="SELECT")?el.value:parseFloat(el.value); }); return v;
}

function fissCompute(v){
  const r={};
  r.fcm=v.fck+8;
  r.fctm=v.fck<=50?0.30*Math.pow(v.fck,2/3):2.12*Math.log(1+r.fcm/10);
  r.bcc=Math.exp(parseFloat(v.s)*(1-Math.sqrt(28/v.t)));
  r.fctmt=(v.t<28?r.bcc:Math.pow(r.bcc,2/3))*r.fctm;
  r.fcteff=(v.mode==="auto")?r.fctmt:v.fcteff;
  // La chaine d'armature minimale vit dans asmin.js, testee contre le cas de
  // validation de SPEC_correction_Asmin_bridage.md §7. Ne pas la reecrire ici.
  //
  // Les champs de forcage : un champ VIDE veut dire « calcule », jamais zero.
  // `retenu()` dans asmin.js ignore les chaines vides et les NaN — et
  // `fissReadInputs` fait `parseFloat`, qui rend NaN sur un champ vide — donc
  // on peut les transmettre tels quels sans les filtrer ici.
  const impose = {
    fctm: v.impFctm, fcteff: v.impFcteff, d1: v.impD1, hcef: v.impHcef,
    k: v.impK, kc: v.impKc, Act: v.impAct, Aceff: v.impAceff, sigs: v.impSigs,
  };

  const am = armatureMinimaleBridage({
    h: v.h, b: v.b, cnom: v.c, phi: v.phi,
    fck: v.fck, fyk: v.fyk, Es: 200000,
    wk: v.wk, kzt: v.kzt, kc: (v.cas === "traction") ? 1.0 : 0.4,
    methode: v.methode,
    conventionK: v.convK,
    sollicitation: v.cas,
    // UN SEUL selecteur pour f_ct,eff, a quatre branches, plutot que deux
    // controles qui se recouvriraient. « impose » et « auto » fournissent la
    // valeur directement ; « kzt » et « tardif » la laissent calculer par
    // asmin.js, qui porte les deux regles.
    scenario: v.mode === "tardif" ? "tardif" : "jeune",
    ...(v.mode === "impose"
      ? { fcteffImpose: v.fcteff }
      : v.mode === "auto"
        ? { fcteffImpose: r.fctmt }
        : {}),
    ...(v.sigsMode === "phistar"
      ? { phiStar: v.phistar }
      : { sigs: (v.sigsMode === "fyk") ? v.fyk : v.sigsVal }),
    impose,
  });

  r.am = am;
  r.k = am.k;
  r.kc = am.kc;
  r.fctm = am.fctm;
  r.fcteff = am.fcteff;
  r.Act = am.Act;
  r.sigs = am.sigs;
  r.hcef = am.hcef;
  r.Asmin = am.AsMinceTotal;
  r.AsminFace = am.AsMinceParNappe;
  r.AsminThick = am.AsEpaisTotal;
  r.rho = am.AsMinTotal / (v.b * v.h);
  r.nZone = am.nappes;
  r.ActEff = am.nappes * am.Aceff;

  // La non-fragilite du §9.2.1.1 reste calculee ici : elle repond a une AUTRE
  // question — la resistance, pas la maitrise de la fissuration — et ne fait
  // pas partie de la chaine de bridage.
  r.d = v.h - am.d1;
  r.Asnf = Math.max(0.26 * r.fctm / v.fyk, 0.0013) * v.b * r.d;
  r.Asgov = Math.max(am.AsMinTotal, r.Asnf);
  r.govWho = am.AsMinTotal >= r.Asnf
    ? T("équation 7.1 (retrait gêné)","expression (7.1) (restrained shrinkage)")
    : T("non-fragilité","minimum reinforcement against brittle failure");
  r.AcEff = am.nappes * am.Aceff;
  r.rhoEff=v.asprov/r.AcEff;
  r.Nr=r.kc*r.k*r.fcteff*r.Act;
  r.sigsWk=r.Nr/v.asprov;
  r.Ecm=22000*Math.pow(r.fcm/10,0.3);
  r.ae=200000/r.Ecm;
  r.eps=Math.max((r.sigsWk-v.kt*r.fcteff/r.rhoEff*(1+r.ae*r.rhoEff))/200000, 0.6*r.sigsWk/200000);
  r.srmax=v.k3*v.c+v.k1*v.k2*v.k4*v.phi/r.rhoEff;
  r.wk=r.srmax*r.eps;
  r.ok=r.wk<=v.wk;
  return r;
}

function fissDraw(v,r){
  const svg=$("sec"); if(!svg)return;
  /* Un SVG genere en JS ne voit pas les variables CSS : les jetons sont lus une
     seule fois ici, puis passes en valeurs litterales aux attributs. Les
     valeurs de secours ne servent que si les proprietes personnalisees ne sont
     pas resolues (moteur sans support, environnement de test). */
  const cs=getComputedStyle(document.documentElement);
  const jeton=(nom,secours)=>(cs.getPropertyValue(nom)||"").trim()||secours;
  const ZONE_EFFECTIVE=jeton("--accent-doux","#eaf1f9"); // aplat de la zone tendue
  const CONTOUR=jeton("--texte","#1a1a1a");              // trait de section et barres
  const CONSTRUCTION=jeton("--accent","#1e5aa8");        // limite geometrique h_c,ef
  const COTE=jeton("--texte-doux","#4a4842");            // lignes et textes de cotation
  const MONO=jeton("--mono","ui-monospace,monospace");   // les cotes sont des nombres

  const W=640,H=360,padL=70,padR=44,padT=30,padB=50;
  const availW=W-padL-padR, availH=H-padT-padB;
  const sc=Math.min(availW/v.b, availH/v.h);
  const bw=v.b*sc, hh=v.h*sc, x0=padL+(availW-bw)/2, y0=padT+(availH-hh)/2;
  const cc=v.c*sc, hcefpx=r.hcef*sc, rphi=Math.max(2,(v.phi/2)*sc);
  const traction=v.cas==="traction";
  let g="";
  const rect=(x,y,w,h,fill,stroke,sw,dash)=>`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${fill}" stroke="${stroke||"none"}" stroke-width="${sw||0}" ${dash?`stroke-dasharray="${dash}"`:""}/>`;
  const line=(x1,y1,x2,y2,st,sw,dash)=>`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${st}" stroke-width="${sw||1}" ${dash?`stroke-dasharray="${dash}"`:""}/>`;
  const txt=(x,y,s,anc,col,sz)=>`<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anc||"middle"}" fill="${col||CONTOUR}" font-family="${MONO}" font-size="${sz||11}">${s}</text>`;
  g+=rect(x0,y0+hh-hcefpx,bw,hcefpx,ZONE_EFFECTIVE);
  if(traction) g+=rect(x0,y0,bw,hcefpx,ZONE_EFFECTIVE);
  g+=rect(x0,y0,bw,hh,"none",CONTOUR,1.6);
  g+=line(x0,y0+hh-hcefpx,x0+bw,y0+hh-hcefpx,CONSTRUCTION,1,"4 3");
  if(traction) g+=line(x0,y0+hcefpx,x0+bw,y0+hcefpx,CONSTRUCTION,1,"4 3");
  const AsFace=traction?v.asprov/2:v.asprov;
  const barA=Math.PI*v.phi*v.phi/4;
  let n=Math.max(2,Math.round(AsFace/barA));
  const nDraw=Math.min(n,Math.max(2,Math.floor(bw/(2*rphi+4))));
  const face=yc=>{let s="";const us=bw-2*cc;for(let i=0;i<nDraw;i++){const x=x0+cc+(nDraw===1?us/2:us*i/(nDraw-1));s+=`<circle cx="${x.toFixed(1)}" cy="${yc.toFixed(1)}" r="${rphi.toFixed(1)}" fill="${CONTOUR}"/>`;}return s;};
  g+=face(y0+hh-cc);
  if(traction) g+=face(y0+cc);
  const dimX=x0-26;
  g+=line(dimX,y0,dimX,y0+hh,COTE,1)+line(dimX-4,y0,dimX+4,y0,COTE,1)+line(dimX-4,y0+hh,dimX+4,y0+hh,COTE,1);
  g+=`<text x="${(dimX-8).toFixed(1)}" y="${(y0+hh/2).toFixed(1)}" text-anchor="middle" fill="${COTE}" font-family="${MONO}" font-size="11" transform="rotate(-90 ${(dimX-8).toFixed(1)} ${(y0+hh/2).toFixed(1)})">h = ${fmt0(v.h)} mm</text>`;
  const dimY=y0+hh+24;
  g+=line(x0,dimY,x0+bw,dimY,COTE,1)+line(x0,dimY-4,x0,dimY+4,COTE,1)+line(x0+bw,dimY-4,x0+bw,dimY+4,COTE,1);
  g+=txt(x0+bw/2,dimY+14,`b = ${fmt0(v.b)} mm`,"middle",COTE,11);
  const bx=x0+bw+16;
  g+=line(bx,y0+hh-hcefpx,bx,y0+hh,CONSTRUCTION,1)+line(bx-4,y0+hh-hcefpx,bx+4,y0+hh-hcefpx,CONSTRUCTION,1)+line(bx-4,y0+hh,bx+4,y0+hh,CONSTRUCTION,1);
  g+=txt(bx+6,y0+hh-hcefpx/2+4,`h_c,ef=${fmt0(r.hcef)}`,"start",CONSTRUCTION,10);
  svg.innerHTML=g;
}

function fissRender(){
  const v=fissReadInputs(), r=fissCompute(v);
  const am=r.am;
  const nappe=am.nappes===2?T(" par nappe"," per layer"):"";
  /* Le suffixe « imposé » n'est PAS decoratif : c'est ce qui distingue une
     valeur que la chaine a calculee d'une valeur que l'ingenieur a forcee.
     Sans lui, une note de calcul presenterait les deux de la meme facon et ne
     serait verifiable par personne. */
  const marque=nom=>(am.sources[nom]==="impose"?T(" (imposé)"," (imposed)"):"");

  $("asmin").textContent=fmt0(am.AsMinceTotal);
  $("asminface").textContent=(v.cas==="traction")?`${fmt0(am.AsMinceParNappe)} mm²${nappe}`:T("face tendue","tension face");
  $("asminthick").textContent=fmt0(am.AsEpaisTotal);
  $("asminborne").textContent=T(`zone de surface · borne ${fmt0(am.BorneTotal)} mm²`,`surface zone · bound ${fmt0(am.BorneTotal)} mm²`);
  $("asnf").textContent=fmt0(r.Asnf);
  $("asgov").textContent=fmt0(r.Asgov);
  $("govwho").textContent="→ "+r.govWho;

  $("approche").textContent=am.approcheRetenue==="epaisse"
    ?T("approche ÉPAISSE — elle gouverne","THICK approach — it governs")
    :T("approche MINCE — elle gouverne","THIN approach — it governs");
  $("asretenu").textContent=`${fmt0(am.AsMinParNappe)} mm²${nappe} · ${fmt0(am.AsMinTotal)} mm² ${T("au total","in total")}`;
  $("referentiel").textContent=
    (am.methode==="ec2"?T("texte EN 1992-1-1 §7.3.2(3)","text of EN 1992-1-1, 7.3.2(3)"):T("pratique allemande, branches h/d₁","German practice, h/d₁ branches"))
    +" · "+(am.conventionK==="de"?T("k annexe allemande","k German Annex"):T("k EC2 recommandé","k EC2 recommended"));
  $("d1out").textContent=fmt0(am.d1)+" mm"+marque("d1");
  $("hcefout").textContent=fmt0(am.hcef)+" mm"+marque("hcef");
  $("fctmout").textContent=fmt(am.fctm,2)+" MPa"+marque("fctm");
  $("fcteffout").textContent=fmt(am.fcteff,2)+" MPa"+marque("fcteff");
  $("kout").textContent=fmt(am.k,3)+marque("k");
  $("kcout").textContent=fmt(am.kc,2)+marque("kc");
  $("actout").textContent=fmt0(am.Act)+" mm²"+marque("Act");
  $("aceffout").textContent=fmt0(am.Aceff)+" mm²"+marque("Aceff");
  $("sigsout").textContent=fmt(am.sigs,1)+" MPa"+marque("sigs");

  /* Les avertissements SIGNALENT, ils n'ecretent pas : ecreter retirerait a
     l'ingenieur la decision qu'il vient explicitement de prendre. */
  $("avertissements").innerHTML=am.avertissements.length===0?""
    :"<ul>"+am.avertissements.map(a=>"<li>"+avertissement(a)+"</li>").join("")+"</ul>";

  $("hcef").textContent=fmt0(r.hcef);
  $("aceff").textContent=fmt0(r.AcEff);
  $("rhoeff").textContent=fmt(r.rhoEff,4);
  $("sigsv").textContent=fmt0(r.sigsWk)+" MPa";
  $("eps").textContent=fmt(r.eps,6);
  $("srmax").textContent=fmt0(r.srmax);
  $("wkcalc").textContent=fmt(r.wk,3);
  $("wktgt").textContent=fmt(v.wk,2);
  const vb=$("verif"),chip=$("verifChip"),vd=$("verdict"),vdt=$("verdictTxt");
  if(r.ok){vb.className="verif ok";chip.textContent=T("✓ VÉRIFIÉ","✓ SATISFIED");vd.className="verdict v-ok";vdt.textContent=`w_k = ${fmt(r.wk,3)} ≤ ${fmt(v.wk,2)} mm`;}
  else{vb.className="verif no";chip.textContent=T("✗ NON VÉRIFIÉ","✗ NOT SATISFIED");vd.className="verdict v-no";vdt.textContent=`w_k = ${fmt(r.wk,3)} > ${fmt(v.wk,2)} mm`;}
  if(r.sigsWk>v.fyk){chip.textContent=T("✗ σs > fyk : l'acier plastifie à la fissuration","✗ σs > fyk: the steel yields at cracking");vb.className="verif no";}
  fissDraw(v,r);
  fissSteps(v,r);
  window._state={v,r};
}

function fissSteps(v,r){
  const S=[];
  const row=(sym,expr,res)=>`<div class="step"><span class="sym">${sym}</span><span class="expr">${expr}</span><span class="res">${res}</span></div>`;
  const hd=t=>`<div class="step head">${t}</div>`;
  /* Meme marquage que dans le panneau : le detail du calcul doit dire, lui
     aussi, ce qui a ete impose — c'est lui qu'on relit pour verifier. */
  const marq=nom=>(r.am.sources[nom]==="impose"?T(" · IMPOSÉ"," · IMPOSED"):"");
  const ec2Hcef=T("texte EC2 · min(2,5·d₁ ; h/2)","EC2 text · min(2.5·d₁; h/2)");
  S.push(hd(T("A · Résistance en traction du béton","A · Tensile strength of concrete")));
  S.push(row("f_cm","f_ck + 8 = "+fmt0(v.fck)+" + 8",fmt0(r.fcm)+" MPa"));
  S.push(row("f_ctm",v.fck<=50?`${dec("0.30")} · ${fmt0(v.fck)}^(2/3)`:`${dec("2.12")} · ln(1 + ${fmt(r.fcm,0)}/10)`,fmt(r.fctm,2)+" MPa"));
  S.push(row("β_cc(t)","exp{ "+v.s+" · [1 − √(28/"+fmt0(v.t)+")] }",fmt(r.bcc,3)));
  S.push(row("f_ctm(t)",(v.t<28?"β_cc":"β_cc^(2/3)")+" · f_ctm",fmt(r.fctmt,2)+" MPa"));
  S.push(row("f_ct,eff",{impose:T("valeur imposée","imposed value"),auto:"= f_ctm(t)",kzt:`k_zt · f_ctm = ${fmt(v.kzt,2)} · ${fmt(r.fctm,2)}`,tardif:T("max(f_ctm ; 3,0) — bridage tardif","max(f_ctm; 3.0) — late-age restraint")}[v.mode]+marq("fcteff"),fmt(r.fcteff,2)+" MPa"));
  S.push(hd(T("B · Coefficients de l'équation 7.1","B · Coefficients of expression (7.1)")));
  S.push(row("k",(v.convK==="de"?T("annexe allemande · ","German Annex · "):"EC2 · ")+(v.h<=300?"h ≤ 300":(v.h>=800?"h ≥ 800":T("interpolation","interpolation")))+marq("k"),fmt(r.k,3)));
  S.push(row("k_c",(v.cas==="traction"?T("traction pure","pure tension"):T("flexion pure","pure bending"))+marq("kc"),fmt(r.kc,2)));
  S.push(row("A_ct",(v.cas==="traction"?"b · h":"b · h / 2")+marq("Act"),fmt0(r.Act)+" mm²"));
  S.push(row("d₁",("c + φ/2")+marq("d1"),fmt0(r.am.d1)+" mm"));
  S.push(row("h_c,ef",(v.methode==="ec2"?ec2Hcef:T(`pratique allemande · h/d₁ = ${fmt(r.am.ratio,1)}`,`German practice · h/d₁ = ${fmt(r.am.ratio,1)}`))+marq("hcef"),fmt0(r.hcef)+" mm"));
  S.push(row("A_c,ef",T("b · h_c,ef (une face)","b · h_c,ef (one face)")+marq("Aceff"),fmt0(r.am.Aceff)+" mm²"));
  S.push(hd(T("C · Contrainte dans l'acier","C · Steel stress")));
  S.push(row("σ_s",{fyk:"= f_yk",val:T("valeur imposée","imposed value"),phistar:`√(6·w_k·E_s·f_ct,eff / Ø*) = √(6·${fmt(v.wk,2)}·200000·${fmt(r.fcteff,2)} / ${fmt(v.phistar,2)})`}[v.sigsMode]+marq("sigs"),fmt(r.sigs,1)+" MPa"));
  S.push(hd(T("D · Armature minimale (éq. 7.1)","D · Minimum reinforcement (expr. 7.1)")));
  S.push(row(T("A_s,min mince","A_s,min thin"),`k_c·k·f_ct,eff·A_ct/σ_s = ${fmt(r.kc,1)}·${fmt(r.k,2)}·${fmt(r.fcteff,1)}·${fmt0(r.Act)}/${fmt0(r.sigs)}`,fmt0(r.am.AsMinceTotal)+" mm²"));
  S.push(row(T("A_s,min épais","A_s,min thick"),T(`${r.am.nappes} · f_ct,eff·A_c,ef/σ_s — NI k NI k_c : ils reduisent l'effort a l'echelle de la section entiere, pas de la peau qui travaille`,`${r.am.nappes} · f_ct,eff·A_c,ef/σ_s — NEITHER k NOR k_c: they reduce the force at the scale of the whole section, not of the working skin`),fmt0(r.am.AsEpaisTotal)+" mm²"));
  S.push(row(T("borne","bound"),T("k·f_ct,eff·A_ct/f_yk — en deça, l'acier plastifie a la fissuration","k·f_ct,eff·A_ct/f_yk — below it, the steel yields at cracking"),fmt0(r.am.BorneTotal)+" mm²"));
  S.push(row(T("A_s,min retenu","A_s,min adopted"),T(`min(mince ; épais) — approche ${r.am.approcheRetenue}`,`min(thin; thick) — ${approche(r.am.approcheRetenue)} approach`),"<b>"+fmt0(r.am.AsMinTotal)+" mm² total · "+fmt0(r.am.AsMinParNappe)+" mm²"+(r.am.nappes===2?T(" par nappe"," per layer"):"")+"</b>"));
  S.push(row("ρ","A_s,min / (b·h)",fmt(r.rho*100,3)+" %"));
  S.push(hd(T("E · Non-fragilité (§9.2.1.1)","E · Minimum reinforcement against brittle failure (9.2.1.1)")));
  S.push(row("d","h − d₁",fmt0(r.d)+" mm"));
  S.push(row("A_s,min,nf",T("max(0,26·f_ctm/f_yk ; 0,0013)·b·d","max(0.26·f_ctm/f_yk; 0.0013)·b·d"),fmt0(r.Asnf)+" mm²"));
  S.push(hd(T("F · Élément épais — zone effective","F · Thick member — effective area")));
  S.push(row("h_c,ef",(v.methode==="ec2"?ec2Hcef:T("pratique allemande, branches h/d₁","German practice, h/d₁ branches"))+marq("hcef"),fmt0(r.hcef)+" mm"));
  S.push(row("A_ct,eff",(r.nZone===2?"2·":"")+"b·h_c,ef",fmt0(r.ActEff)+" mm²"));
  S.push(row(T("A_s,min,épais","A_s,min,thick"),T(`max(${r.am.nappes} · f_ct,eff·A_c,ef/σ_s ; borne) — sans k ni k_c`,`max(${r.am.nappes} · f_ct,eff·A_c,ef/σ_s; bound) — without k or k_c`),"<b>"+fmt0(r.AsminThick)+" mm²</b>"));
  S.push(hd(T("G · Ouverture de fissure (éq. 7.8 – 7.11)","G · Crack width (expr. 7.8 – 7.11)")));
  S.push(row("N_r","k_c·k·f_ct,eff·A_ct",fmt0(r.Nr)+" N"));
  S.push(row("σ_s (wk)","N_r / A_s,prov",fmt0(r.sigsWk)+" MPa"));
  S.push(row("ρ_p,eff","A_s,prov / A_c,eff",fmt(r.rhoEff,4)));
  S.push(row("ε_sm−ε_cm",T("éq. 7.9 (plancher 0,6σ_s/E_s)","expr. 7.9 (floor 0.6σ_s/E_s)"),fmt(r.eps,6)));
  S.push(row("s_r,max","k_3·c + k_1·k_2·k_4·φ/ρ_p,eff",fmt0(r.srmax)+" mm"));
  S.push(row("w_k","s_r,max · (ε_sm−ε_cm)","<b>"+fmt(r.wk,3)+" mm</b>"));
  $("steps").innerHTML=S.join("");
}

function buildBetonTable(){
  const classes=[["C12/15",12],["C16/20",16],["C20/25",20],["C25/30",25],["C30/37",30],["C35/45",35],["C40/50",40],["C45/55",45],["C50/60",50]];
  let h=""; classes.forEach(([nm,fck])=>{const fcm=fck+8,fctm=0.30*Math.pow(fck,2/3),fctk=0.7*fctm,Ecm=22000*Math.pow(fcm/10,0.3);h+=`<tr><td class="l">${nm}</td><td>${fck}</td><td>${fcm}</td><td>${fmt(fctm,2)}</td><td>${fmt(fctk,2)}</td><td>${fmt0(Ecm)}</td></tr>`;});
  $("betonTbl").innerHTML=h;
}

function copySummary(btn){
  const {v,r}=window._state;
  const am=r.am;
  const nappe=am.nappes===2?T(" par nappe"," per layer"):"";
  /* La synthese copiee porte les MEMES marques que l'ecran. Une note qui
     presenterait une valeur forcee comme calculee ne serait verifiable par
     personne, et c'est ce texte-la qu'on colle dans un rapport. */
  const marq=nom=>(am.sources[nom]==="impose"?T(" [IMPOSÉ]"," [IMPOSED]"):"");
  const avert=am.avertissements.length===0?""
    :"\n--------------------------------------------\n"+T("AVERTISSEMENTS","WARNINGS")+"\n"+am.avertissements.map(a=>"  ! "+avertissement(a)).join("\n");

  const t=EN?`MINIMUM CRACK-CONTROL REINFORCEMENT — EN 1992-1-1
Concrete C${v.fck} · fct,eff=${fmt(am.fcteff,2)} MPa${marq("fcteff")} · fyk=${v.fyk} MPa
Section h=${v.h} b=${v.b} c=${v.c} φ=${v.phi} · ${v.cas==="traction"?"pure tension":"pure bending"}
h_c,ef method: ${am.methode==="ec2"?"text of EN 1992-1-1, 7.3.2(3)":"German practice, h/d1 branches"}
k convention: ${am.conventionK==="de"?"German Annex (0.80→0.50)":"EC2 recommended (1.00→0.65)"}
--------------------------------------------
d1        = ${fmt0(am.d1)} mm${marq("d1")}
h_c,ef    = ${fmt0(am.hcef)} mm${marq("hcef")}
k · k_c   = ${fmt(am.k,3)}${marq("k")} · ${fmt(am.kc,2)}${marq("kc")}
A_ct      = ${fmt0(am.Act)} mm²${marq("Act")}
A_c,ef    = ${fmt0(am.Aceff)} mm² (one face)${marq("Aceff")}
σ_s       = ${fmt(am.sigs,1)} MPa${marq("sigs")}
--------------------------------------------
As,min thin approach  = ${fmt0(am.AsMinceTotal)} mm² total · ${fmt0(am.AsMinceParNappe)} mm²${nappe}
As,min thick approach = ${fmt0(am.AsEpaisTotal)} mm² total · ${fmt0(am.AsEpaisParNappe)} mm²${nappe}
  (anti-yielding bound ${fmt0(am.BorneTotal)} mm² total)
As,min ADOPTED (${approche(am.approcheRetenue)}) = ${fmt0(am.AsMinTotal)} mm² total · ${fmt0(am.AsMinParNappe)} mm²${nappe}
As,min (brittle failure) = ${fmt0(r.Asnf)} mm²
As,min GOVERNING      = ${fmt0(r.Asgov)} mm² (${r.govWho})${avert}
--------------------------------------------
wk verification (As,prov=${v.asprov} mm²):
  sr,max = ${fmt0(r.srmax)} mm · εsm-εcm = ${fmt(r.eps,6)}
  wk = ${fmt(r.wk,3)} mm  /  wk,max = ${fmt(v.wk,2)} mm  →  ${r.ok?"SATISFIED":"NOT SATISFIED"}
--------------------------------------------
Caveat: the h_c,ef branches are not the text of EN 1992-1-1
(7.3.2(3): min(2.5(h−d); (h−x)/3; h/2)) but German practice.
k is a Nationally Determined Parameter. In BE and LU, the design basis
remains EN 1992-1-1 and its NBN / ILNAS Annexes. Ø* is an input.`
  :`ARMATURE MINIMALE DE FISSURATION — EN 1992-1-1
Béton C${v.fck} · fct,eff=${fmt(am.fcteff,2)} MPa${marq("fcteff")} · fyk=${v.fyk} MPa
Section h=${v.h} b=${v.b} c=${v.c} φ=${v.phi} · ${v.cas==="traction"?"traction pure":"flexion pure"}
Méthode h_c,ef : ${am.methode==="ec2"?"texte EN 1992-1-1 §7.3.2(3)":"pratique allemande, branches h/d1"}
Convention de k : ${am.conventionK==="de"?"annexe allemande (0,80→0,50)":"EC2 recommandé (1,00→0,65)"}
--------------------------------------------
d1        = ${fmt0(am.d1)} mm${marq("d1")}
h_c,ef    = ${fmt0(am.hcef)} mm${marq("hcef")}
k · k_c   = ${fmt(am.k,3)}${marq("k")} · ${fmt(am.kc,2)}${marq("kc")}
A_ct      = ${fmt0(am.Act)} mm²${marq("Act")}
A_c,ef    = ${fmt0(am.Aceff)} mm² (une face)${marq("Aceff")}
σ_s       = ${fmt(am.sigs,1)} MPa${marq("sigs")}
--------------------------------------------
As,min approche mince  = ${fmt0(am.AsMinceTotal)} mm² total · ${fmt0(am.AsMinceParNappe)} mm²${nappe}
As,min approche épaisse = ${fmt0(am.AsEpaisTotal)} mm² total · ${fmt0(am.AsEpaisParNappe)} mm²${nappe}
  (borne anti-plastification ${fmt0(am.BorneTotal)} mm² total)
As,min RETENU (${am.approcheRetenue}) = ${fmt0(am.AsMinTotal)} mm² total · ${fmt0(am.AsMinParNappe)} mm²${nappe}
As,min (non-fragilité) = ${fmt0(r.Asnf)} mm²
As,min GOUVERNANT     = ${fmt0(r.Asgov)} mm² (${r.govWho})${avert}
--------------------------------------------
Vérification wk (As,prov=${v.asprov} mm²):
  sr,max = ${fmt0(r.srmax)} mm · εsm-εcm = ${fmt(r.eps,6)}
  wk = ${fmt(r.wk,3)} mm  /  wk,max = ${fmt(v.wk,2)} mm  →  ${r.ok?"VÉRIFIÉ":"NON VÉRIFIÉ"}
--------------------------------------------
Réserve : les branches de h_c,ef ne sont pas le texte de l'EN 1992-1-1
(§7.3.2(3) : min(2,5(h−d) ; (h−x)/3 ; h/2)) mais la pratique allemande.
k est un paramètre national. En BE et au LU, la justification réglementaire
reste l'EN 1992-1-1 et ses annexes NBN / ILNAS. Ø* est une entrée.`;
  navigator.clipboard.writeText(t).then(()=>flash(btn,T("Synthèse copiée","Summary copied")),()=>flash(btn,T("Copie impossible","Copy failed")));
}
function flash(btn,msg){const o=btn.textContent;btn.textContent=msg;setTimeout(()=>btn.textContent=o,1400);}
function resetFiss(){ fissState={}; F_IDS.forEach(k=>{$(k).value=F_DEF[k];}); fissRender(); }

/* ---- Gabarit HTML de la page fissuration ----
   Une fonction et non une constante : `T` y choisit la langue au rendu. */
const FISS_HTML = () => `
  <div class="page-h">
    <div>
      <div class="eyebrow">EN 1992-1-1 · ${T("§7.3.2 – 7.3.4","7.3.2 – 7.3.4")}</div>
      <h1>${T("Armature minimale de fissuration","Minimum crack-control reinforcement")}</h1>
      <div class="sub">${T("Éléments massifs sous déformation gênée · radiers, poutres épaisses, voiles bridés","Massive members under restrained deformation · rafts, deep beams, restrained walls")}</div>
    </div>
    <div id="verdict" class="verdict v-ok"><small>${T("Ouverture de fissure","Crack width")}</small><span id="verdictTxt">—</span></div>
  </div>

  <div class="grid">
    <div class="panel">
      <div class="panel-h"><span class="num">01</span> ${T("Paramètres","Parameters")}</div>
      <div class="panel-b">
        <div class="grp">
          <div class="subh">${T("Béton","Concrete")}</div>
          <div class="field"><label>${T("Résistance fck","Strength fck")}</label><input id="fck" type="number" step="1"><div class="u">MPa</div></div>
          <div class="field"><label>${T("Ciment (coeff. s)","Cement (coeff. s)")}</label><select id="s"><option value="0.20">R · ${dec("0.20")}</option><option value="0.25">N · ${dec("0.25")}</option><option value="0.38">S · ${dec("0.38")}</option></select></div>
          <div class="field"><label>${T("Âge fissuration t","Age at cracking t")}</label><input id="t" type="number" step="1" min="1"><div class="u">${T("jours","days")}</div></div>
          <div class="field"><label>fct,eff</label><select id="mode"><option value="impose">${T("valeur imposée","imposed value")}</option><option value="auto">${T("fctm(t) par β_cc","fctm(t) by β_cc")}</option><option value="kzt">${T("k_zt · fctm (jeune âge)","k_zt · fctm (early age)")}</option><option value="tardif">${T("tardif · max(fctm ; 3,0)","late age · max(fctm; 3.0)")}</option></select></div>
          <div class="field"><label>${T("fct,eff imposé","fct,eff imposed")}</label><input id="fcteff" type="number" step="0.1"><div class="u">MPa</div></div>
          <div class="field"><label>k_zt = fct,eff / fctm</label><input id="kzt" type="number" step="0.05" min="0.1" max="1"></div>
          <div class="note">${T("Au jeune âge, la fissuration thermique survient souvent avant 28 j. Valeur minimale conseillée ≈ 2,9 MPa si l'échéance est incertaine. Ordres de grandeur de <em>k_zt</em> : 0,65 à 3 j, 0,75 à 5 j, 0,85 à 7 j — un radier massif dépasse 7 j, donc <em>k_zt</em> tend vers 1,0.","At early age, thermal cracking often occurs before 28 days. Suggested minimum ≈ 2.9 MPa when the timing is uncertain. Orders of magnitude of <em>k_zt</em>: 0.65 at 3 days, 0.75 at 5 days, 0.85 at 7 days — a massive raft goes beyond 7 days, so <em>k_zt</em> tends to 1.0.")}</div>
          <div class="field"><label>${T("Méthode h_c,ef","h_c,ef method")}</label><select id="methode"><option value="din">${T("pratique allemande · branches h/d₁","German practice · h/d₁ branches")}</option><option value="ec2">${T("texte EN 1992-1-1 · 2,5·d₁","EN 1992-1-1 text · 2.5·d₁")}</option></select></div>
          <div class="field"><label>${T("Convention de k","k convention")}</label><select id="convK"><option value="ec2">EC2 · ${dec("1.00")} → ${dec("0.65")}</option><option value="de">${T("annexe allemande","German Annex")} · ${dec("0.80")} → ${dec("0.50")}</option></select></div>
          <div class="note">${T("Deux choix <strong>indépendants</strong> : <em>k</em> est un paramètre d'annexe nationale, <em>h_c,ef</em> une famille de formules. « Branches allemandes, <em>k</em> de l'annexe belge » est un cas légitime. Les branches de <em>h_c,ef</em> ne sont <strong>pas le texte</strong> de l'EN 1992-1-1, dont le §7.3.2(3) écrit min(2,5(h−d) ; (h−x)/3 ; h/2) : en BE et au LU, la justification réglementaire reste l'EC2 et ses annexes NBN / ILNAS.","Two <strong>independent</strong> choices: <em>k</em> is a National Annex parameter, <em>h_c,ef</em> a family of formulas. “German branches, <em>k</em> from the Belgian Annex” is a legitimate case. The <em>h_c,ef</em> branches are <strong>not the text</strong> of EN 1992-1-1, whose 7.3.2(3) writes min(2.5(h−d); (h−x)/3; h/2): in BE and LU, the design basis remains EC2 and its NBN / ILNAS Annexes.")}</div>
        </div>
        <div class="grp">
          <div class="subh">${T("Acier","Steel")}</div>
          <div class="field"><label>${T("Limite fyk","Yield strength fyk")}</label><input id="fyk" type="number" step="10"><div class="u">MPa</div></div>
          <div class="field"><label>${T("σs (calcul)","σs (design)")}</label><select id="sigsMode"><option value="fyk">${T("= fyk (plafond)","= fyk (ceiling)")}</option><option value="val">${T("valeur imposée","imposed value")}</option><option value="phistar">${T("dérivée de Ø* (§7.3.3)","derived from Ø* (7.3.3)")}</option></select></div>
          <div class="field"><label>${T("σs imposé","σs imposed")}</label><input id="sigsVal" type="number" step="10"><div class="u">MPa</div></div>
          <div class="field"><label>${T("Ø* limite","Ø* limit")}</label><input id="phistar" type="number" step="0.1" min="1"><div class="u">mm</div></div>
          <div class="note">${T("Pour viser une largeur de fissure, lire σs au tableau 7.2N selon φ et wk — ou le dériver de Ø* par σs = √(6·w_k·E_s·f_ct,eff / Ø*). <strong>Ø* est une entrée</strong> : la définition de h_cr en traction pure reste à confirmer, et la recalculer figerait une hypothèse non vérifiée.","To target a crack width, read σs from Table 7.2N for φ and wk — or derive it from Ø* by σs = √(6·w_k·E_s·f_ct,eff / Ø*). <strong>Ø* is an input</strong>: the definition of h_cr in pure tension is still to be confirmed, and recalculating it would freeze an unchecked assumption.")}</div>
        </div>
        <div class="grp">
          <div class="subh">${T("Géométrie","Geometry")}</div>
          <div class="field"><label>${T("Hauteur h","Depth h")}</label><input id="h" type="number" step="50"><div class="u">mm</div></div>
          <div class="field"><label>${T("Largeur b","Width b")}</label><input id="b" type="number" step="50"><div class="u">mm</div></div>
          <div class="field"><label>${T("Enrobage nominal c","Nominal cover c")}</label><input id="c" type="number" step="5"><div class="u">mm</div></div>
          <div class="field"><label>${T("Diamètre φ","Diameter φ")}</label><input id="phi" type="number" step="2"><div class="u">mm</div></div>
        </div>
        <div class="grp">
          <div class="subh">${T("Sollicitation","Action effect")}</div>
          <div class="field stack"><label>${T("Cas de bridage","Restraint case")}</label><select id="cas"><option value="traction">${T("Traction pure — retrait axial gêné (kc = 1)","Pure tension — restrained axial shrinkage (kc = 1)")}</option><option value="flexion">${T("Flexion pure (kc = 0,4)","Pure bending (kc = 0.4)")}</option></select></div>
        </div>
        <div class="grp">
          <div class="subh">${T("Critère de fissuration","Cracking criterion")}</div>
          <div class="field"><label>${T("wk,max cible","Target wk,max")}</label><input id="wk" type="number" step="0.05"><div class="u">mm</div></div>
          <div class="field"><label>${T("As,prov posé","As,prov provided")}</label><input id="asprov" type="number" step="200"><div class="u">mm²</div></div>
          <div class="note">${T("As,prov = section totale que vous comptez ferrailler. Sert à vérifier wk réel.","As,prov = total area you intend to provide. Used to check the actual wk.")}</div>
        </div>
        <details class="adv">
          <summary>${T("Coefficients avancés (7.9 / 7.11)","Advanced coefficients (7.9 / 7.11)")}</summary>
          <div class="field"><label>${T("kt (durée)","kt (duration)")}</label><input id="kt" type="number" step="0.1"><div class="u">–</div></div>
          <div class="field"><label>${T("k1 (adhérence)","k1 (bond)")}</label><input id="k1" type="number" step="0.1"><div class="u">–</div></div>
          <div class="field"><label>${T("k2 (déformation)","k2 (strain distribution)")}</label><input id="k2" type="number" step="0.1"><div class="u">–</div></div>
          <div class="field"><label>k3</label><input id="k3" type="number" step="0.1"><div class="u">–</div></div>
          <div class="field"><label>k4</label><input id="k4" type="number" step="0.005"><div class="u">–</div></div>
          <div class="note">${T("Valeurs recommandées EN 1992-1-1. Vérifiez l'Annexe Nationale (NBN / ILNAS). kt = 0,4 longue durée, 0,6 courte durée. k2 = 1,0 traction, 0,5 flexion.","EN 1992-1-1 recommended values. Check the National Annex (NBN / ILNAS). kt = 0.4 long term, 0.6 short term. k2 = 1.0 tension, 0.5 bending.")}</div>
        </details>
        <details class="adv">
          <summary>${T("Forcer des valeurs intermédiaires","Impose intermediate values")}</summary>
          <div class="note">${T("Un champ <strong>vide</strong> veut dire « calculé ». Une valeur saisie <strong>court-circuite sa formule</strong> et alimente la suite de la chaîne : imposer <em>d₁</em> change <em>h_c,ef</em>, imposer <em>f_ct,eff</em> change <em>σ_s</em>. Toute valeur imposée est <strong>marquée</strong> dans les résultats et la synthèse — une note qui présenterait une valeur forcée comme calculée ne serait vérifiable par personne. Une valeur hors du domaine physique produit un <strong>avertissement</strong>, jamais un écrêtage silencieux.","An <strong>empty</strong> field means “calculated”. An entered value <strong>bypasses its formula</strong> and feeds the rest of the chain: imposing <em>d₁</em> changes <em>h_c,ef</em>, imposing <em>f_ct,eff</em> changes <em>σ_s</em>. Every imposed value is <strong>marked</strong> in the results and the summary — a note that presented an imposed value as calculated could not be checked by anyone. A value outside the physical range produces a <strong>warning</strong>, never silent clipping.")}</div>
          <div class="field"><label>f_ctm</label><input id="impFctm" type="number" step="0.01"><div class="u">MPa</div></div>
          <div class="field"><label>f_ct,eff</label><input id="impFcteff" type="number" step="0.01"><div class="u">MPa</div></div>
          <div class="field"><label>d₁</label><input id="impD1" type="number" step="1"><div class="u">mm</div></div>
          <div class="field"><label>h_c,ef</label><input id="impHcef" type="number" step="1"><div class="u">mm</div></div>
          <div class="field"><label>k</label><input id="impK" type="number" step="0.01"><div class="u">–</div></div>
          <div class="field"><label>k_c</label><input id="impKc" type="number" step="0.05"><div class="u">–</div></div>
          <div class="field"><label>A_ct</label><input id="impAct" type="number" step="1000"><div class="u">mm²</div></div>
          <div class="field"><label>${T("A_c,ef une face","A_c,ef one face")}</label><input id="impAceff" type="number" step="1000"><div class="u">mm²</div></div>
          <div class="field"><label>σ_s</label><input id="impSigs" type="number" step="1"><div class="u">MPa</div></div>
        </details>
      </div>
    </div>

    <div>
      <div class="draw-wrap">
        <div class="panel-h"><span class="num">02</span> ${T("Coupe de la section","Cross-section")}</div>
        <div class="draw-b"><svg id="sec" class="section" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${T("Coupe de la section en béton armé","Cross-section of the reinforced concrete member")}"></svg></div>
        <div class="legend">
          <span><i style="background:var(--accent-doux);border:1px solid var(--accent)"></i>${T("Zone tendue effective h_c,ef","Effective tension area h_c,ef")}</span>
          <span><i style="background:var(--texte)"></i>${T("Armature φ à l'échelle","Reinforcement φ to scale")}</span>
          <span><i style="background:var(--surface);border:1px solid var(--bordure)"></i>${T("Section béton","Concrete section")}</span>
        </div>
      </div>

      <div id="avertissements" class="avert"></div>

      <div class="cards">
        <div class="card"><div class="k">${T("A_s,min — approche mince (section entière)","A_s,min — thin approach (whole section)")}</div><div class="val"><span id="asmin">—</span> <small>mm²</small></div><div class="x" id="asminface">—</div></div>
        <div class="card"><div class="k">${T("A_s,min — approche épaisse (zone efficace)","A_s,min — thick approach (effective area)")}</div><div class="val"><span id="asminthick">—</span> <small>mm²</small></div><div class="x" id="asminborne">—</div></div>
        <div class="card"><div class="k">${T("Non-fragilité — §9.2.1.1","Brittle failure — 9.2.1.1")}</div><div class="val"><span id="asnf">—</span> <small>mm²</small></div><div class="x">${T("plancher de ductilité","ductility floor")}</div></div>
        <div class="card gov"><div class="k">${T("A_s,min retenu","A_s,min adopted")}</div><div class="val"><span id="asgov">—</span> <small>mm²</small></div><div class="x" id="govwho">—</div></div>
      </div>

      <!--
        Le facteur 2 entre TOTAL et NAPPE est la cause classique d'un ecart
        avec une feuille de calcul : les deux sont nommes, jamais confondus.
        Et chaque grandeur dit si elle a ete CALCULEE ou IMPOSEE — sans quoi
        une note presenterait une valeur forcee exactement comme une valeur
        calculee, et ne serait verifiable par personne.
      -->
      <div class="verif ok">
        <div class="verif-h"><span>${T("Armature minimale de bridage — détail","Minimum reinforcement under restraint — details")}</span><span id="approche">—</span></div>
        <div class="verif-b">
          <div class="kv"><span class="lab">${T("A_s,min retenu","A_s,min adopted")}</span><span class="v" id="asretenu">—</span></div>
          <div class="kv"><span class="lab">${T("Méthode · convention de k","Method · k convention")}</span><span class="v" id="referentiel">—</span></div>
          <div class="kv"><span class="lab">d₁ · h_c,ef</span><span class="v"><span id="d1out">—</span> · <span id="hcefout">—</span></span></div>
          <div class="kv"><span class="lab">f_ctm · f_ct,eff</span><span class="v"><span id="fctmout">—</span> · <span id="fcteffout">—</span></span></div>
          <div class="kv"><span class="lab">k · k_c</span><span class="v"><span id="kout">—</span> · <span id="kcout">—</span></span></div>
          <div class="kv"><span class="lab">${T("A_ct · A_c,ef (une face)","A_ct · A_c,ef (one face)")}</span><span class="v"><span id="actout">—</span> · <span id="aceffout">—</span></span></div>
          <div class="kv"><span class="lab">σ_s</span><span class="v" id="sigsout">—</span></div>
        </div>
      </div>

      <div id="verif" class="verif ok">
        <div class="verif-h"><span>${T("Vérification de l'ouverture de fissure · éq. 7.8","Crack width verification · expr. 7.8")}</span><span id="verifChip">—</span></div>
        <div class="verif-b">
          <div class="kv"><span class="lab">h_c,ef · A_c,eff</span><span class="v"><span id="hcef">—</span> mm · <span id="aceff">—</span> mm²</span></div>
          <div class="kv"><span class="lab">ρ_p,eff = A_s,prov / A_c,eff</span><span class="v" id="rhoeff">—</span></div>
          <div class="kv"><span class="lab">σ_s = N_r / A_s,prov</span><span class="v" id="sigsv">—</span></div>
          <div class="kv"><span class="lab">ε_sm − ε_cm</span><span class="v" id="eps">—</span></div>
          <div class="kv"><span class="lab">s_r,max</span><span class="v"><span id="srmax">—</span> mm</span></div>
          <div class="kv"><span class="lab">${T("w_k calculé / w_k,max","calculated w_k / w_k,max")}</span><span class="v"><span id="wkcalc">—</span> / <span id="wktgt">—</span> mm</span></div>
        </div>
      </div>

      <details class="deriv"><summary>${T("Détail du calcul — valeurs substituées","Calculation details — substituted values")}</summary><div class="deriv-b" id="steps"></div></details>
    </div>
  </div>

  <div class="ref">
    <div class="panel">
      <div class="panel-h"><span class="num">03</span> ${T("Tables de référence · EN 1992-1-1","Reference tables · EN 1992-1-1")}</div>
      <div class="panel-b" style="overflow-x:auto">
        <table>
          <caption>${T("Tableau 3.1 — propriétés des bétons","Table 3.1 — strength and deformation characteristics of concrete")}</caption>
          <thead><tr><th class="l">${T("Classe","Class")}</th><th>f_ck</th><th>f_cm</th><th>f_ctm</th><th>f_ctk,0,05</th><th>E_cm</th></tr></thead>
          <tbody id="betonTbl"></tbody>
        </table>
        <table style="margin-top:16px">
          <caption>${T("Tableau 7.2N — diamètre maximal φ*s [mm]","Table 7.2N — maximum bar diameter φ*s [mm]")}</caption>
          <thead><tr><th class="l">σs [MPa]</th><th>wk=${dec("0.4")}</th><th>wk=${dec("0.3")}</th><th>wk=${dec("0.2")}</th></tr></thead>
          <tbody>
            <tr><td class="l">160</td><td>40</td><td>32</td><td>25</td></tr><tr><td class="l">200</td><td>32</td><td>25</td><td>16</td></tr>
            <tr><td class="l">240</td><td>20</td><td>16</td><td>12</td></tr><tr><td class="l">280</td><td>16</td><td>12</td><td>8</td></tr>
            <tr><td class="l">320</td><td>12</td><td>10</td><td>6</td></tr><tr><td class="l">360</td><td>10</td><td>8</td><td>5</td></tr>
            <tr><td class="l">400</td><td>8</td><td>6</td><td>4</td></tr><tr><td class="l">450</td><td>6</td><td>5</td><td>—</td></tr>
          </tbody>
        </table>
        <table style="margin-top:16px">
          <caption>${T("Tableau 7.3N — espacement maximal [mm]","Table 7.3N — maximum bar spacing [mm]")}</caption>
          <thead><tr><th class="l">σs [MPa]</th><th>wk=${dec("0.4")}</th><th>wk=${dec("0.3")}</th><th>wk=${dec("0.2")}</th></tr></thead>
          <tbody>
            <tr><td class="l">160</td><td>300</td><td>300</td><td>200</td></tr><tr><td class="l">200</td><td>300</td><td>250</td><td>150</td></tr>
            <tr><td class="l">240</td><td>250</td><td>200</td><td>100</td></tr><tr><td class="l">280</td><td>200</td><td>150</td><td>50</td></tr>
            <tr><td class="l">320</td><td>150</td><td>100</td><td>—</td></tr><tr><td class="l">360</td><td>100</td><td>50</td><td>—</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="foot">
    <div class="tools">
      <button class="tool" onclick="window.print()">${T("Imprimer / PDF","Print / PDF")}</button>
      <button class="tool" onclick="copySummary(this)">${T("Copier la synthèse","Copy the summary")}</button>
      <button class="tool" onclick="resetFiss()">${T("Réinitialiser","Reset")}</button>
    </div>
    <p>${T("<b>Base normative.</b> EN 1992-1-1:2004 + AC:2010, §7.3.2 (éq. 7.1), §7.3.4 (éq. 7.8 – 7.11), tableau 3.1. La méthode « élément épais » suit l'EN 1992-3 et l'ouvrage de G. Meyer, <i>Rissbreitenbegrenzung nach DIN 1045-1 für dicke Bauteile</i>.","<b>Code basis.</b> EN 1992-1-1:2004 + AC:2010, 7.3.2 (expr. 7.1), 7.3.4 (expr. 7.8 – 7.11), Table 3.1. The “thick member” method follows EN 1992-3 and the book by G. Meyer, <i lang=\"de\">Rissbreitenbegrenzung nach DIN 1045-1 für dicke Bauteile</i>.")}</p>
    <p>${T("<b>Réserves.</b> Les valeurs recommandées (k3, k4, plancher de fct,eff) peuvent être modifiées par les Annexes Nationales belge (NBN) et luxembourgeoise (ILNAS). La 2ᵉ génération d'Eurocode (EN 1992-1-1:2023) révise la formulation de la maîtrise de la fissuration. Cet outil est une aide au calcul ; la vérification finale incombe à l'ingénieur.","<b>Caveats.</b> The recommended values (k3, k4, floor of fct,eff) may be modified by the Belgian (NBN) and Luxembourg (ILNAS) National Annexes. The 2nd generation Eurocode (EN 1992-1-1:2023) revises the formulation of crack control. This tool is a design aid; the final check is the engineer's responsibility.")}</p>
  </div>`;



/* ---- démarrage ---- */
buildMenu();
router();
