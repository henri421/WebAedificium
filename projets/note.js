// Note de projet : synthese imprimable, qui suit l'arborescence et ne retient
// que les feuilles a justifier. Fonction pure (ni DOM ni stockage).
//
// Le detail de chaque verification reste dans la note de calcul de son app :
// le hub ne connait que le JSON des feuilles et leur dernier verdict.
import * as P from './projets.js';

const ech = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const ORDRE = ['ko', 'perime', 'alerte', 'ok', 'aucun'];

/**
 * @param projet  projet du moteur
 * @param T       (fr, en) => texte dans la langue de la page
 * @param nomApp  (calcul) => nom de l'app a afficher
 * @param date    date deja mise en forme
 */
export function noteDeProjetHtml(projet, T, nomApp, date) {
  const LIBELLES = {
    ok: `✓ ${T('Vérifié', 'Verified')}`,
    alerte: `! ${T('À examiner', 'To review')}`,
    ko: `✗ ${T('Non vérifié', 'Not verified')}`,
    perime: `↻ ${T('À recalculer', 'To recompute')}`,
    aucun: `– ${T('Sans verdict', 'No verdict')}`,
  };
  const compte = Object.fromEntries(ORDRE.map((k) => [k, 0]));
  const sections = [];
  for (const e of P.elements(projet)) {
    const lignes = [];
    for (const c of e.calculs) {
      for (const f of c.feuilles) {
        if (f.statut !== 'justifier') continue;
        const v = P.verdictDeFeuille(c, f.id) ?? 'aucun';
        compte[v] += 1;
        const origine = f.origine ? c.feuilles.find((x) => x.id === f.origine)?.nom : null;
        const propres = Object.entries(f.surcharges)
          .map(([k, val]) => `${ech(P.clesDuChemin(k).join(' › '))} = ${ech(JSON.stringify(val))}`)
          .join('<br>');
        const base = origine ? `${T("D'après", 'Based on')} ${ech(origine)}${propres ? `<br>${propres}` : ''}` : T('Feuille complète', 'Complete sheet');
        lignes.push(
          `<tr><td>${ech(nomApp(c))}</td><td>${ech(f.nom)}</td><td class="v-${v}">${LIBELLES[v]}</td><td>${base}</td></tr>`,
        );
      }
    }
    if (lignes.length === 0) continue;
    sections.push(
      `<h2>${ech(P.cheminDuNoeud(projet, e.id).join(' › '))}</h2>
<table><thead><tr><th>${T('Calcul', 'Calculation')}</th><th>${T('Feuille', 'Sheet')}</th><th>${T('Verdict', 'Verdict')}</th><th>${T('Données', 'Data')}</th></tr></thead>
<tbody>${lignes.join('')}</tbody></table>`,
    );
  }
  const total = ORDRE.reduce((n, k) => n + compte[k], 0);
  const bilan = ORDRE.filter((k) => compte[k] > 0)
    .map((k) => `<span class="v-${k}">${LIBELLES[k]} : ${compte[k]}</span>`)
    .join(' · ');
  const reserve =
    total > compte.ok
      ? `<p class="reserve">${T(
          'Toutes les feuilles ne sont pas vérifiées : voir les lignes signalées.',
          'Not every sheet is verified: see the flagged rows.',
        )}</p>`
      : '';
  return `<!doctype html>
<html lang="${T('fr', 'en')}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${T('Note de projet', 'Project note')} — ${ech(projet.nom)}</title>
<style>
body{font:14px/1.45 system-ui,sans-serif;color:#1d1c1a;background:#fff;max-width:900px;margin:0 auto;padding:24px 16px}
h1{font-size:22px;margin:0 0 2px}h2{font-size:15px;margin:22px 0 6px}
.sous{color:#6a6862;margin:0 0 12px}.reserve{font-weight:600;color:#b3261e}
table{border-collapse:collapse;width:100%}th,td{border:1px solid #c8c6c0;padding:5px 8px;text-align:left;vertical-align:top}th{background:#f4f3ef}
.v-ok{color:#2e7d4f}.v-alerte{color:#b26a00}.v-ko{color:#b3261e}.v-perime,.v-aucun{color:#6a6862}
.portee{margin-top:22px;color:#6a6862;font-size:12px}
button{font:inherit;padding:5px 12px;margin-bottom:12px}
@media print{button{display:none}tr{break-inside:avoid}}
</style></head><body>
<button onclick="print()">${T('Imprimer', 'Print')}</button>
<h1>${ech(projet.nom)}</h1>
<p class="sous">${T('Note de projet', 'Project note')} · ${ech(date)} · ${total} ${T('feuille(s) à justifier', 'sheet(s) to justify')}</p>
${total ? `<p>${bilan}</p>${reserve}` : `<p>${T('Aucune feuille à justifier dans ce projet.', 'No sheet to justify in this project.')}</p>`}
${sections.join('\n')}
<p class="portee">${T(
    'Synthèse des dernières valeurs enregistrées. Le détail des vérifications figure dans la note de calcul de chaque outil.',
    'Summary of the last saved values. Detailed checks are in the calculation note of each tool.',
  )}</p>
</body></html>`;
}
