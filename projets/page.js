// Page « Mes projets » du hub (etape 9.5 du plan de la suite).
//
// Projet → dossiers libres → elements (reperes) → calculs (une app chacun)
// → feuilles de calcul. Le moteur (`projets.js`, `projets-stockage.js`) est la
// copie generee d'aedificium-ui ; cette page ne fait que l'afficher et le
// piloter. Les projets vivent dans IndexedDB, partage par toutes les apps de
// la suite (meme origine henri421.github.io) : une app ouverte depuis ici lit
// et ecrit le meme projet.
//
// Chaque action relit le projet AVANT de le modifier, puis l'enregistre :
// une app ouverte dans un autre onglet a pu l'enrichir entre-temps.

import * as P from './projets.js';
import { depotParDefaut } from './projets-stockage.js';

const EN = document.documentElement.lang === 'en';
const T = (fr, en) => (EN ? en : fr);
const depot = depotParDefaut();

const ech = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const date = (iso) =>
  new Date(iso).toLocaleString(EN ? 'en-GB' : 'fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

/** Apps qui savent ouvrir une feuille de projet : fournies par hub.js. */
const apps = () => (window.aedAppsFeuilles ? window.aedAppsFeuilles() : []);
const nomApp = (c) => apps().find((a) => a.app === c.app)?.nom || c.nom || c.app;

let vue = null; // conteneur de la page
let projet = null; // projet ouvert
let selection = null; // id du noeud ou du calcul selectionne
let coupe = null; // id du noeud coupe, en attente de « Coller ici »

/* ------------------------------------------------------------------ */
/* Boites de dialogue                                                 */
/* ------------------------------------------------------------------ */

function boite(html) {
  const d = document.createElement('dialog');
  d.className = 'pj-dialogue';
  d.innerHTML = html;
  document.body.appendChild(d);
  d.addEventListener('close', () => d.remove());
  // « Annuler » n'est pas un bouton d'envoi : la touche Entree valide, jamais n'annule.
  for (const b of d.querySelectorAll('[data-fermer]')) b.addEventListener('click', () => d.close('non'));
  d.showModal();
  return d;
}

/** Demande un nom ; resout null si l'on annule. */
function demander(titre, valeur = '') {
  return new Promise((ok) => {
    const d = boite(`<form method="dialog"><label class="pj-q">${ech(titre)}
        <input name="v" value="${ech(valeur)}" required></label>
        <div class="pj-boutons"><button type="button" data-fermer>${T('Annuler', 'Cancel')}</button>
        <button value="oui" class="pj-principal">${T('Valider', 'OK')}</button></div></form>`);
    const champ = d.querySelector('input');
    champ.select();
    d.addEventListener('close', () => ok(d.returnValue === 'oui' && champ.value.trim() ? champ.value.trim() : null));
  });
}

function confirmer(message, action) {
  return new Promise((ok) => {
    const d = boite(`<form method="dialog"><p class="pj-q">${message}</p>
        <div class="pj-boutons"><button type="button" data-fermer>${T('Annuler', 'Cancel')}</button>
        <button value="oui" class="pj-danger">${ech(action)}</button></div></form>`);
    d.addEventListener('close', () => ok(d.returnValue === 'oui'));
  });
}

function signaler(message) {
  boite(`<form method="dialog"><p class="pj-q">${ech(message)}</p>
      <div class="pj-boutons"><button class="pj-principal">OK</button></div></form>`);
}

function messageDErreur(e) {
  if (!(e instanceof P.ErreurProjet)) return String(e?.message || e);
  if (!EN) return e.message;
  return (
    {
      format: 'Unknown or inconsistent project file.',
      introuvable: 'Item not found (deleted in another tab?).',
      cycle: 'Circular inheritance between sheets.',
      heritiers: 'Other sheets inherit from this one: detach them first.',
      'derniere-feuille': 'A calculation keeps at least one sheet.',
      deplacement: 'A folder cannot go into itself or one of its subfolders.',
    }[e.code] || e.message
  );
}

/* ------------------------------------------------------------------ */
/* Lecture, modification, enregistrement                              */
/* ------------------------------------------------------------------ */

async function modifier(fn) {
  try {
    const frais = await depot.lire(projet.id);
    if (frais) projet = frais;
    const r = fn(projet);
    P.toucher(projet);
    await depot.ecrire(projet);
    dessiner();
    return r;
  } catch (e) {
    signaler(messageDErreur(e));
    return undefined;
  }
}

async function ouvrir(id) {
  projet = id ? await depot.lire(id) : null;
  if (id && !projet) {
    location.hash = '#projets';
    return;
  }
  if (!projet) selection = null;
  dessiner();
}

function telecharger(nom, texte) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([texte], { type: 'application/json' }));
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const nomDeFichier = (p) => `${p.nom.replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-|-$/g, '') || 'projet'}.aedificium.json`;

/* ------------------------------------------------------------------ */
/* Liste des projets                                                  */
/* ------------------------------------------------------------------ */

async function dessinerListe() {
  let liste = [];
  try {
    liste = await depot.lister();
  } catch (e) {
    signaler(messageDErreur(e));
  }
  vue.innerHTML = `
    <div class="page-h"><div><div class="eyebrow">${T('Accueil', 'Home')} · ${T('Projets', 'Projects')}</div>
      <h1>${T('Mes projets', 'My projects')}</h1>
      <div class="sub">${T(
        'Un projet range vos calculs par dossiers et par élément ; chaque calcul garde ses feuilles. Tout reste dans ce navigateur : exportez le projet pour le sauvegarder ou le passer sur un autre poste.',
        'A project files your calculations by folder and by element; each calculation keeps its sheets. Everything stays in this browser: export the project to back it up or move it to another computer.'
      )}</div></div></div>
    <div class="pj-actions">
      <button class="pj-principal" data-action="nouveau">${T('Nouveau projet', 'New project')}</button>
      <label class="pj-bouton">${T('Importer un fichier…', 'Import a file…')}<input type="file" accept=".json,application/json" data-action="importer" hidden></label>
    </div>
    ${
      liste.length === 0
        ? `<p class="pj-vide">${T('Aucun projet dans ce navigateur.', 'No project in this browser.')}</p>`
        : `<ul class="pj-liste">${liste
            .map(
              (r) => `<li><a href="#projets/${ech(r.id)}"><span class="pj-nom">${ech(r.nom)}</span>
                <span class="pj-date">${T('modifié le', 'modified')} ${ech(date(r.modifie))}</span></a></li>`
            )
            .join('')}</ul>`
    }`;
}

/* ------------------------------------------------------------------ */
/* Projet ouvert : arborescence et detail                             */
/* ------------------------------------------------------------------ */

const ICONES = { dossier: '▸', element: '■', calcul: '·' };

function arbre(liste) {
  return `<ul>${liste
    .map((n) => {
      const sel = n.id === selection ? ' pj-sel' : '';
      const cp = n.id === coupe ? ' pj-coupe' : '';
      const ligne = `<button class="pj-noeud pj-${n.type}${sel}${cp}" data-sel="${ech(n.id)}">
          <span class="pj-ic" aria-hidden="true">${ICONES[n.type]}</span>${ech(n.nom)}</button>`;
      if (n.type === 'dossier') return `<li>${ligne}${n.enfants.length ? arbre(n.enfants) : ''}</li>`;
      const calculs = n.calculs
        .map(
          (c) => `<li><button class="pj-noeud pj-calcul${c.id === selection ? ' pj-sel' : ''}" data-sel="${ech(c.id)}">
            <span class="pj-ic" aria-hidden="true">${ICONES.calcul}</span>${ech(nomApp(c))}
            <span class="pj-compte">${c.feuilles.length} ${c.feuilles.length > 1 ? T('feuilles', 'sheets') : T('feuille', 'sheet')}</span></button></li>`
        )
        .join('');
      return `<li>${ligne}${calculs ? `<ul>${calculs}</ul>` : ''}</li>`;
    })
    .join('')}</ul>`;
}

function lienFeuille(c, f) {
  // L'adresse connue du hub d'abord (langue et serveur courants), celle du calcul sinon.
  const base = apps().find((a) => a.app === c.app)?.adresse || c.adresse || '';
  if (!base) return '';
  const q = new URLSearchParams({ projet: projet.id, calcul: c.id, feuille: f.id });
  return `${base}?${q}`;
}

function blocCalcul(c, avecActions) {
  const lignes = c.feuilles
    .map((f) => {
      const origine = f.origine ? c.feuilles.find((x) => x.id === f.origine)?.nom || '?' : '';
      const propres = Object.keys(f.surcharges).length;
      const lien = lienFeuille(c, f);
      return `<tr><td>${ech(f.nom)}</td>
        <td><span class="pj-statut pj-${f.statut}">${f.statut === 'justifier' ? T('à justifier', 'to justify') : T('étude', 'study')}</span></td>
        <td>${origine ? `${T("d'après", 'from')} ${ech(origine)} · ${propres} ${T('champ(s) propre(s)', 'own field(s)')}` : T('complète', 'complete')}</td>
        <td>${lien ? `<a href="${ech(lien)}" target="_blank" rel="noopener">${T('Ouvrir', 'Open')} ↗</a>` : ''}</td></tr>`;
    })
    .join('');
  return `<section class="pj-calc">
      <h3>${ech(nomApp(c))}${c.nom && c.nom !== nomApp(c) ? ` <small>${ech(c.nom)}</small>` : ''}</h3>
      ${avecActions ? actionsNoeud('calcul') : ''}
      <table class="pj-feuilles"><thead><tr><th>${T('Feuille', 'Sheet')}</th><th>${T('Statut', 'Status')}</th>
        <th>${T('Héritage', 'Inheritance')}</th><th></th></tr></thead><tbody>${lignes}</tbody></table>
    </section>`;
}

function actionsNoeud(type) {
  const coller = coupe && type === 'dossier' ? `<button data-action="coller">${T('Coller ici', 'Paste here')}</button>` : '';
  const couper = type !== 'calcul' ? `<button data-action="couper">${T('Couper', 'Cut')}</button>` : '';
  return `<div class="pj-actions">
      <button data-action="renommer">${T('Renommer', 'Rename')}</button>
      <button data-action="dupliquer">${T('Dupliquer', 'Duplicate')}</button>
      ${couper}${coller}
      <button data-action="supprimer" class="pj-danger">${T('Supprimer', 'Delete')}</button></div>`;
}

function detail() {
  if (!selection) {
    const coller = coupe ? `<div class="pj-actions"><button data-action="coller">${T('Coller à la racine', 'Paste at the root')}</button></div>` : '';
    return `<p class="pj-vide">${T(
      'Choisissez un dossier, un élément ou un calcul dans l’arborescence. Un élément est un repère de votre projet (P1, Po3, M1…) ; il regroupe les calculs de toutes les apps qui le concernent.',
      'Pick a folder, an element or a calculation in the tree. An element is a mark of your project (B1, C3, W1…); it gathers the calculations of every app that concerns it.'
    )}</p>${coller}`;
  }
  const place = P.trouverNoeud(projet, selection);
  if (place?.noeud.type === 'dossier') {
    const d = place.noeud;
    return `<div class="eyebrow">${T('Dossier', 'Folder')}</div><h2>${ech(d.nom)}</h2>${actionsNoeud('dossier')}
      <p class="pj-vide">${d.enfants.length} ${T('entrée(s)', 'item(s)')}.</p>`;
  }
  if (place?.noeud.type === 'element') {
    const e = place.noeud;
    const choix = apps()
      .map((a) => `<option value="${ech(a.app)}">${ech(a.nom)}</option>`)
      .join('');
    return `<div class="eyebrow">${T('Élément', 'Element')}</div><h2>${ech(e.nom)}</h2>${actionsNoeud('element')}
      ${e.calculs.map((c) => blocCalcul(c, false)).join('') || `<p class="pj-vide">${T('Aucun calcul pour cet élément.', 'No calculation for this element yet.')}</p>`}
      <div class="pj-ajout"><label>${T('Ajouter un calcul', 'Add a calculation')}
        <select data-role="app">${choix}</select></label>
        <button data-action="ajouter-calcul" ${choix ? '' : 'disabled'}>${T('Ajouter', 'Add')}</button></div>
      <p class="pj-note">${T(
        'Seules les apps déjà reliées aux projets sont proposées. Depuis une app, le bouton « Ranger dans un projet… » range le calcul en cours.',
        'Only the apps already linked to projects are listed. From an app, the “File in a project…” button files the current calculation.'
      )}</p>`;
  }
  const t = P.trouverCalcul(projet, selection);
  if (t) return `<div class="eyebrow">${T('Calcul', 'Calculation')} · ${ech(t.element.nom)}</div>${blocCalcul(t.calcul, true)}`;
  selection = null;
  return detail();
}

function dessinerProjet() {
  const parent = (() => {
    if (!selection) return null;
    const pl = P.trouverNoeud(projet, selection);
    if (pl?.noeud.type === 'dossier') return pl.noeud.id;
    if (pl) return pl.parent?.id ?? null;
    return null;
  })();
  vue.innerHTML = `
    <div class="page-h"><div><div class="eyebrow"><a href="#projets">${T('Mes projets', 'My projects')}</a> · ${T('Projet', 'Project')}</div>
      <h1>${ech(projet.nom)}</h1>
      <div class="sub">${T('Modifié le', 'Modified')} ${ech(date(projet.modifie))}</div></div></div>
    <div class="pj-actions">
      <button data-action="renommer-projet">${T('Renommer le projet', 'Rename project')}</button>
      <button data-action="exporter">${T('Exporter (fichier)', 'Export (file)')}</button>
      <button data-action="supprimer-projet" class="pj-danger">${T('Supprimer le projet', 'Delete project')}</button>
    </div>
    <div class="pj-cadre">
      <div class="pj-arbre">
        <div class="panel-h">${T('Arborescence', 'Tree')}</div>
        <div class="pj-actions pj-serre">
          <button data-action="ajouter-dossier" data-parent="${ech(parent ?? '')}">+ ${T('Dossier', 'Folder')}</button>
          <button data-action="ajouter-element" data-parent="${ech(parent ?? '')}">+ ${T('Élément', 'Element')}</button>
        </div>
        <button class="pj-noeud pj-racine${selection ? '' : ' pj-sel'}" data-sel="">${ech(projet.nom)}</button>
        ${projet.enfants.length ? arbre(projet.enfants) : `<p class="pj-vide">${T('Projet vide : ajoutez un dossier ou un élément.', 'Empty project: add a folder or an element.')}</p>`}
      </div>
      <div class="pj-detail">${detail()}</div>
    </div>`;
}

function dessiner() {
  if (!vue || !vue.isConnected) return;
  if (projet) dessinerProjet();
  else dessinerListe();
}

/* ------------------------------------------------------------------ */
/* Actions                                                            */
/* ------------------------------------------------------------------ */

async function agir(action, cible) {
  switch (action) {
    case 'nouveau': {
      const nom = await demander(T('Nom du projet', 'Project name'));
      if (!nom) return;
      const p = P.creerProjet(nom);
      await depot.ecrire(p);
      location.hash = `#projets/${p.id}`;
      return;
    }
    case 'renommer-projet': {
      const nom = await demander(T('Nom du projet', 'Project name'), projet.nom);
      if (nom) await modifier((p) => (p.nom = nom));
      return;
    }
    case 'exporter':
      telecharger(nomDeFichier(projet), P.exporterProjet(projet));
      return;
    case 'supprimer-projet':
      if (
        await confirmer(
          T(`Supprimer définitivement le projet « ${ech(projet.nom)} » et tous ses calculs ? Exportez-le d'abord si vous voulez en garder une copie.`,
            `Permanently delete the project “${ech(projet.nom)}” and all its calculations? Export it first if you want to keep a copy.`),
          T('Supprimer', 'Delete')
        )
      ) {
        await depot.supprimer(projet.id);
        location.hash = '#projets';
      }
      return;
    case 'ajouter-dossier':
    case 'ajouter-element': {
      const dossier = action === 'ajouter-dossier';
      const nom = await demander(dossier ? T('Nom du dossier (niveau, zone, lot…)', 'Folder name (level, zone, lot…)') : T('Repère de l’élément (P1, Po3, M1…)', 'Element mark (B1, C3, W1…)'));
      if (!nom) return;
      const parent = cible.dataset.parent || null;
      const n = await modifier((p) => (dossier ? P.ajouterDossier(p, parent, nom) : P.ajouterElement(p, parent, nom)));
      if (n) {
        selection = n.id;
        dessiner();
      }
      return;
    }
    case 'ajouter-calcul': {
      const choix = vue.querySelector('[data-role="app"]')?.value;
      const a = apps().find((x) => x.app === choix);
      if (!a) return;
      // Nom de calcul vide : le hub affiche le nom de l'app, dans sa langue.
      const c = await modifier((p) => P.ajouterCalcul(p, selection, { ...a, nom: '' }, null, T('Feuille 1', 'Sheet 1')));
      if (c) {
        selection = c.id;
        dessiner();
      }
      return;
    }
    case 'renommer': {
      const actuel = P.trouverNoeud(projet, selection)?.noeud.nom ?? P.trouverCalcul(projet, selection)?.calcul.nom ?? '';
      const nom = await demander(T('Nouveau nom', 'New name'), actuel);
      if (nom) await modifier((p) => P.renommer(p, selection, nom));
      return;
    }
    case 'dupliquer': {
      const id = await modifier((p) => P.dupliquer(p, selection, T(' (copie)', ' (copy)')));
      if (id) {
        selection = id;
        dessiner();
      }
      return;
    }
    case 'couper':
      coupe = selection;
      dessiner();
      return;
    case 'coller': {
      const vers = selection || null;
      const id = coupe;
      coupe = null;
      await modifier((p) => P.deplacer(p, id, vers));
      return;
    }
    case 'supprimer': {
      const nom = P.trouverNoeud(projet, selection)?.noeud.nom ?? nomApp(P.trouverCalcul(projet, selection)?.calcul ?? {});
      if (!(await confirmer(T(`Supprimer « ${ech(nom)} » et tout ce qu'il contient ?`, `Delete “${ech(nom)}” and everything in it?`), T('Supprimer', 'Delete')))) return;
      await modifier((p) => P.supprimerNoeud(p, selection));
      selection = null;
      dessiner();
      return;
    }
  }
}

async function importer(fichier) {
  try {
    const p = P.importerProjet(await fichier.text());
    if (await depot.lire(p.id)) {
      const remplacer = await confirmer(
        T(`Le projet « ${ech(p.nom)} » existe déjà dans ce navigateur. Le remplacer par le fichier ?`,
          `The project “${ech(p.nom)}” already exists in this browser. Replace it with the file?`),
        T('Remplacer', 'Replace')
      );
      if (!remplacer) return;
    }
    await depot.ecrire(p);
    location.hash = `#projets/${p.id}`;
  } catch (e) {
    signaler(messageDErreur(e));
  }
}

function brancher(v) {
  // Le routeur du hub reutilise le meme conteneur : brancher une seule fois.
  if (v.dataset.projetsBranche) return;
  v.dataset.projetsBranche = '1';
  v.addEventListener('click', (ev) => {
    if (!location.hash.startsWith('#projets')) return; // autre page du hub
    const sel = ev.target.closest('[data-sel]');
    if (sel) {
      selection = sel.dataset.sel || null;
      dessiner();
      return;
    }
    const b = ev.target.closest('button[data-action]');
    if (b) agir(b.dataset.action, b);
  });
  v.addEventListener('change', (ev) => {
    if (ev.target.matches('input[data-action="importer"]') && ev.target.files?.[0]) importer(ev.target.files[0]);
  });
}

/** Appelee par le routeur du hub : `#projets` ou `#projets/<id>`. */
export function renderProjets(conteneur, id) {
  vue = conteneur;
  brancher(conteneur);
  if (projet?.id !== id) selection = null;
  ouvrir(id || null);
}

// Une app a pu modifier le projet dans un autre onglet : on relit au retour.
window.addEventListener('focus', () => {
  if (projet && vue?.isConnected) ouvrir(projet.id);
  else if (vue?.isConnected) dessiner();
});

window.AedProjets = { renderProjets };
window.dispatchEvent(new Event('aed-projets-pret'));
