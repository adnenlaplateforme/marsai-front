// Page /jury : contenu statique, aucun appel API.
//
// `photo` attend un fichier déposé dans `public/images/jury/`, référencé
// depuis la racine du site (ex. '/images/jury/aiko-sato.jpg'). Tant que la
// valeur est nulle, la carte affiche un aplat avec les initiales — c'est
// volontaire, ça évite une image cassée en attendant les portraits.
//
// `key` pointe vers `jury.members.<key>` dans les traductions, où vivent le
// rôle et la description. Les noms ne sont pas traduits.

export const president = {
  name: 'Julien Valros',
  photo: null,
};

export const members = [
  { key: 'aikoSato', name: 'Aiko Sato', photo: null },
  { key: 'julieMasson', name: 'Julie Masson', photo: null },
  { key: 'marcAubin', name: 'Marc Aubin', photo: null },
];
