// Adresse d'un calcul importe : seules les pages de la suite sont ouvertes
// (audit du 10/11/2026, R9 : un fichier de projet piege ne doit pas fournir
// un lien « Ouvrir » vers un autre site ou en javascript:).
export const ORIGINE_SUITE = 'https://henri421.github.io';

/** Rend l'adresse si elle est sure (suite publiee ou origine courante), '' sinon. */
export function adresseSure(adresse, origineCourante) {
  if (typeof adresse !== 'string' || adresse === '') return '';
  let u;
  try {
    u = new URL(adresse);
  } catch {
    return '';
  }
  const ok = (u.origin === ORIGINE_SUITE && u.pathname.startsWith('/')) || (origineCourante && u.origin === origineCourante && /^https?:$/.test(u.protocol));
  return ok ? u.href : '';
}
