/**
 * La valeur par défaut du champ « date de publication », au format qu'attend
 * `datetime-local` : « YYYY-MM-DDTHH:mm ».
 *
 * Le back exige une date de publication à la création — elle est optionnelle à
 * la modification. Neuf heures le jour même est le choix par défaut : la quasi
 * totalité des événements sont publiés dès leur saisie, et l'admin garde la
 * main pour décaler une annonce.
 *
 * Tout est lu et rendu en heure locale. `toISOString()` donnerait la date UTC,
 * qui n'est pas le même jour aux deux extrémités de la journée : à l'est de
 * Greenwich elle rend la veille au petit matin — un admin parisien saisissant à
 * 00 h 30 se verrait proposer une publication déjà passée — et à l'ouest, le
 * lendemain en soirée.
 */
export function defaultPublishedAt(now) {
  const pad = value => String(value).padStart(2, '0');
  const date = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
  ].join('-');

  return `${date}T09:00`;
}
