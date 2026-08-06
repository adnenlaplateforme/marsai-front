# Sources de conception

Fichiers de travail conservés hors de `public/`, qui est recopié tel quel
dans le build : ces sources partiraient sinon en production sans jamais
être servies.

- `maquette-membres-jury.png` — maquette de la page `/jury`.
- `JV.png`, `AIKO.png`, `julie.png`, `marc.png` — cartes composées issues de
  la maquette, rôle et description incrustés dans le pixel.
- `i1.jpg` … `i4.jpg` — portraits d'origine en pleine résolution.
  `i1` Julie Masson, `i2` Marc Aubin, `i3` Julien Valros, `i4` Aiko Sato.

Les versions servies sont dans `public/images/jury/`, recadrées au ratio des
cartes (4/3 pour le président, 3/4 pour les membres) et rééchantillonnées.
