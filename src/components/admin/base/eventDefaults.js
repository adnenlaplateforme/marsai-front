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
 * qui change de jour en fin de soirée pour un admin à l'est de Greenwich — un
 * événement saisi le 5 au soir serait proposé à la publication le 6.
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
