// Le back pagine à 20 et ne renvoie pas cette valeur : le contrat de
// `GET /movies` et `GET /movies/sort` est `{ total, data }`, sans perPage.
// Le nombre est donc dupliqué entre les deux dépôts et c'est marsai-back
// (`src/models/movie.model.ts`, `LIMIT 20` lignes 51 et 198) qui fait foi.
//
// On ne peut pas le déduire de la réponse : `data.length` vaut perPage sur
// une page pleine mais pas sur la dernière, soit précisément le cas où le
// calcul du nombre de pages compte.
//
// À supprimer le jour où la réponse porte l'information elle-même.
export const MOVIES_PER_PAGE = 20;
