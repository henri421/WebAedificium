// Diffuse CONVENTIONS.md du hub dans tous les depots de la suite (audit I4).
// Lancement sur le poste de developpement, depuis WebAedificium :
//   node scripts/conventions.mjs          copie et liste les depots modifies
//   node scripts/conventions.mjs --verif  ne copie rien, sort en erreur si un depot differe
// Les depots sont cherches a cote du hub (dossier parent) ; un depot absent est signale.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Dossier local -> depot GitHub. Le hub n'y figure pas : il porte la source. */
export const DEPOTS = {
  'aedificium-ui': 'aedificium-ui',
  'sol-ec7': 'sol-ec7',
  'assemblages-ec3': 'assemblages-ec3',
  'charges-climatiques': 'charges-climatiques',
  'cisaillement-interface': 'cisaillement-interface',
  'colonne-ec2': 'colonne_ec2',
  'combinaisons-actions': 'combinaisons-actions',
  'dispositions-constructives': 'dispositions-constructives',
  'ec2-2e-generation': 'blog',
  'equilibre-statique': 'equilibre-statique',
  'fondations-superficielles': 'fondations-superficielles',
  'maconnerie': 'maconnerie',
  'maconnerie regard': 'regard',
  'MBT': 'MBT',
  'mur-en-l': 'mur-en-l',
  'parois': 'parois',
  'pieux': 'pieux',
  'poinconnement': 'poinconnement',
  'poutres-continues': 'beam',
  'schema': 'schema-statique',
  'section-uls': 'section-uls',
  'sections-ec3': 'sections-ec3',
  'silo': 'silo',
  'sol-renforce': 'sol-renforce',
  'stabilite-talus': 'stabilite-talus',
};

const hub = new URL('../', import.meta.url);
const normal = (t) => t.replace(/\r\n/g, '\n');

export function diffuser(verifSeulement = false) {
  const source = normal(readFileSync(new URL('CONVENTIONS.md', hub), 'utf8'));
  const rapport = { modifies: [], absents: [], aJour: [] };
  for (const dossier of Object.keys(DEPOTS)) {
    const racine = new URL(`../${dossier}/`, hub);
    if (!existsSync(racine)) {
      rapport.absents.push(dossier);
      continue;
    }
    const cible = new URL('CONVENTIONS.md', racine);
    const actuel = existsSync(cible) ? normal(readFileSync(cible, 'utf8')) : null;
    if (actuel === source) {
      rapport.aJour.push(dossier);
      continue;
    }
    rapport.modifies.push(dossier);
    if (!verifSeulement) writeFileSync(cible, source);
  }
  return rapport;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const verif = process.argv.includes('--verif');
  const r = diffuser(verif);
  console.log(`${verif ? 'A mettre a jour' : 'Copie dans'} : ${r.modifies.join(', ') || 'aucun'}`);
  if (r.absents.length) console.log(`Absents du poste : ${r.absents.join(', ')}`);
  console.log(`Deja a jour : ${r.aJour.length}`);
  if (verif && r.modifies.length) process.exitCode = 1;
}
