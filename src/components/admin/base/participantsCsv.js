// L'export de la liste des participants, construit côté client.
//
// `GET /events/:id/bookings` rend déjà tout ce qu'il faut : le serveur n'a pas à
// fabriquer un second format pour la même donnée. Le fichier est destiné à un
// tableur — c'est ce que l'icône de téléchargement de la maquette promet — d'où
// les précautions ci-dessous, qui n'ont rien de théorique.

/** Excel lit un CSV en ANSI sans elle, et massacre tous les accents. */
const BOM = '﻿';

/**
 * Le fichier CSV des participants, en-têtes comprises.
 *
 * Les libellés de colonnes sont passés par l'appelant : la traduction reste dans
 * le composant, et cette fonction n'a besoin d'aucun contexte pour être testée.
 */
export function participantsCsv(bookings, headers) {
  const rows = bookings.map(booking => [
    booking.lastname,
    booking.firstname,
    booking.email,
    localDateTime(booking.created_at),
  ]);

  return (
    BOM +
    [headers, ...rows]
      .map(row => row.map(escapeField).join(','))
      .join('\r\n')
  );
}

/**
 * Un champ prêt à entrer dans une ligne CSV.
 *
 * L'apostrophe n'est pas une coquetterie : `POST /bookings` est une route
 * publique, un prénom saisi `=1+1` est donc à la portée de n'importe qui, et un
 * tableur l'exécute à l'ouverture du fichier. La neutraliser ici est le seul
 * endroit où on la voit encore passer.
 */
function escapeField(value) {
  if (value === null || value === undefined) return '';

  const text = String(value);
  const neutralized = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;

  return /[",\r\n]/.test(neutralized)
    ? `"${neutralized.replaceAll('"', '""')}"`
    : neutralized;
}

/**
 * La date d'inscription en heure locale, `2026-07-01 12:30`.
 *
 * Le serveur la sérialise en UTC ; l'administrateur la lit à l'heure du
 * festival. Le format n'est pas localisé exprès : « 01/07/2026, 12:30 » porte sa
 * propre virgule et ouvrirait une colonne de plus dans le tableur.
 */
function localDateTime(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const pad = n => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    ` ${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}
