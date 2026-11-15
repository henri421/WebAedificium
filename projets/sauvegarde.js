// Sauvegarde des projets (audit du 10/11/2026, R7) : les projets ne vivent que
// dans ce navigateur, l'export en fichier est leur seule copie. La page des
// projets montre la date du dernier export, invite a exporter apres une
// modification et propose un export de tous les projets en un fichier.

import { importerProjet } from './projets.js';

export const FORMAT_GLOBAL = 'aedificium-projets/1';
const cle = (id) => `aedificium-export:${id}`;
const stockageParDefaut = () => (typeof localStorage === 'undefined' ? null : localStorage);

/** Date ISO du dernier export du projet, null si jamais exporte ou stockage indisponible. */
export function dernierExport(id, stockage = stockageParDefaut()) {
  try {
    return stockage?.getItem(cle(id)) ?? null;
  } catch {
    return null;
  }
}

/** Note l'export du projet ; sans effet si le stockage est indisponible (navigation privee). */
export function noterExport(id, dateIso, stockage = stockageParDefaut()) {
  try {
    stockage?.setItem(cle(id), dateIso);
  } catch {
    // Rien a faire : l'invitation restera affichee.
  }
}

/** Vrai si le projet n'a jamais ete exporte, ou modifie depuis son dernier export. */
export function aExporter(modifie, dernier) {
  return dernier === null || modifie > dernier;
}

/** Tous les projets en un fichier. */
export function exporterTous(projets, dateIso) {
  return JSON.stringify({ format: FORMAT_GLOBAL, exporte: dateIso, projets }, null, 2);
}

/**
 * Relit un fichier d'un projet ou de tous les projets. Chaque projet passe le
 * controle d'importerProjet ; un seul projet incoherent fait refuser le fichier.
 */
export function importerFichier(contenu) {
  let brut;
  try {
    brut = JSON.parse(contenu);
  } catch {
    return [importerProjet(contenu)]; // leve l'erreur de format du moteur
  }
  if (brut && brut.format === FORMAT_GLOBAL && Array.isArray(brut.projets)) {
    return brut.projets.map((p) => importerProjet(JSON.stringify(p)));
  }
  return [importerProjet(contenu)];
}
