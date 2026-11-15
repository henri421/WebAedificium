# Aedificium web — suite d'outils de calcul de structures (Eurocodes)

Suite généraliste d'outils de calcul de structures selon les Eurocodes — bases de calcul et actions, béton, acier, maçonnerie, géotechnique — destinée à un usage en bureau d'études. Tous les calculs s'exécutent localement dans le navigateur et aucune donnée n'est transmise. Chaque outil sort une note de calcul ; les projets rangent les calculs par dossier et par élément.

**Cette page relie les outils, elle ne les absorbe pas.** Chaque outil vit dans son propre dépôt, avec sa propre pile technique, sa propre suite de tests et son propre rythme de publication. C'est un choix : absorber ici un outil qui a des dépendances et des tests lui coûterait les deux.

## Les outils

Tableau généré depuis `GROUPES` de `hub.js` par `node scripts/readme.mjs` ; un test vérifie qu'il est à jour.

<!-- OUTILS:DEBUT (genere par scripts/readme.mjs, ne pas modifier a la main) -->
| Outil | Référentiel | Où | Ce qu'il fait |
|---|---|---|---|
| **Combinaisons d'actions** | EN 1990 | [dépôt](https://github.com/henri421/combinaisons-actions) · [ouvrir](https://henri421.github.io/combinaisons-actions/) | Combinaisons de l'EN 1990 pour les bâtiments : ELU EQU, STR/GEO (6.10 ou 6.10a/b), GEO, accidentelles, ELS caractéristiques, fréquentes et quasi permanentes ; groupes d'actions exclusives, valeurs combinées et enveloppes. Export CSV et Excel ; import des cas de neige et vent. |
| **Équilibre statique** | EN 1990 | [dépôt](https://github.com/henri421/equilibre-statique) · [ouvrir](https://henri421.github.io/equilibre-statique/) | Équilibre d'un élément plan à l'ELU : segments pesants (L, U, cadres), charges ponctuelles, réparties, triangulaires, trapézoïdales et moments. Bras de levier et rôle de chaque charge, renversement (EQU) avec tableau charge / distance / γ_f / moments stabilisants et déstabilisants, glissement, soulèvement (UPL), position de la résultante. |
| **Neige et vent** | EN 1991 | [dépôt](https://github.com/henri421/charges-climatiques) · [ouvrir](https://henri421.github.io/charges-climatiques/) | Charges de neige (EN 1991-1-3) et actions du vent (EN 1991-1-4) sur un bâtiment rectangulaire, zone par zone : pression de pointe, zonage des parois et des toitures, c_pe,1 et c_pe,10, cas de neige et accumulations. Profil normatif sourcé, v_b,0 et s_k saisis. |
| **Silos** | EN 1991 | [dépôt](https://github.com/henri421/silo) · [ouvrir](https://henri421.github.io/silo/) | Actions des matériaux ensilés sur les parois et les fonds des silos circulaires et rectangulaires (EN 1991-4:2006) : Janssen et Janssen modifié, vidange, action localisée, vidange à grand excentrement, fond plat et trémies (Walker). Profils en fonction de la profondeur et fichiers CSV par bandes pour un modèle aux éléments finis. |
| **Vérification de sections** | EN 1992 | [dépôt](https://github.com/henri421/section-uls) · [ouvrir](https://henri421.github.io/section-uls/) | Flexion composée droite et déviée à l'ELU, domaines d'interaction, vérifications de service (contraintes, ouverture de fissures, courbure), effort tranchant §6.2, dispositions constructives §9. |
| **Poutres continues** | EN 1992 | [dépôt](https://github.com/henri421/beam) · [ouvrir](https://henri421.github.io/beam/) | Poutres continues et hyperstatiques : appuis, ressorts, rotules, tassements ; charges G et Q. Enveloppes ELU et ELS avec charges alternées, puis béton armé (aciers, effort tranchant, épure d'arrêt, ancrages) ou acier (section, déversement, flèche, via sections-ec3). |
| **Colonne EC2** | EN 1992 | [dépôt](https://github.com/henri421/colonne_ec2) · [ouvrir](https://henri421.github.io/colonne_ec2/) | Poteaux en béton armé : flambement et effets du second ordre (EN 1992-1-1 §5.8, courbure nominale ou rigidité nominale), analyse P-&Delta; itérative, résistance de section N-M et flexion déviée. |
| **Poinçonnement** | EN 1992 | [dépôt](https://github.com/henri421/poinconnement) · [ouvrir](https://henri421.github.io/poinconnement/) | Dalles pleines au droit d'un poteau (§6.4) : périmètres de contrôle par construction géométrique, coefficient d'excentrement, résistance avec et sans armatures, écrasement au nu du poteau. |
| **Cisaillement à l'interface** | EN 1992 | [dépôt](https://github.com/henri421/cisaillement-interface) · [ouvrir](https://henri421.github.io/cisaillement-interface/) | Reprises de bétonnage, dalle sur prédalle : v_Edi et v_Rdi selon l'EN 1992-1-1:2004 (§6.2.5) ou 2023 (§8.2.6, armatures ancrées ou non, effet de goujon). Un bouton bascule d'une génération à l'autre sans ressaisie. |
| **Ancrages et recouvrements** | EN 1992 | [dépôt](https://github.com/henri421/dispositions-constructives) · [ouvrir](https://henri421.github.io/dispositions-constructives/) | Longueurs d'ancrage et de recouvrement (EN 1992-1-1 §8) : adhérence, coefficients α_1 à α_6 avec leur statut, borne 0,7, armatures de couture, paquets de barres, mandrins, cadres, synthèse par diamètre. |
| **Bielle-tirant** | EN 1992 | [dépôt](https://github.com/henri421/MBT) · [ouvrir](https://henri421.github.io/MBT/) | Zones D en 2D et 3D (semelles sur pieux) : solveur par la méthode des rigidités, vérifications §6.5, optimisation de Schlaich, choix des aciers HA, export DXF. Fonctionne hors ligne. |
| **Armature minimale de fissuration** | EN 1992 | sur cette page | Éléments massifs sous déformation gênée. Équation 7.1, réduction pour élément épais, vérification de l'ouverture de fissure. |
| **Murs en L** | EN 1992 | [dépôt](https://github.com/henri421/mur-en-l) · [ouvrir](https://henri421.github.io/mur-en-l/) | Murs de soutènement en L selon l'EN 1997 et l'EN 1992-1-1, deux générations : poussée (part de K_a réglable), charges en bande de largeur finie, renversement, glissement, portance, flexion et tranchant du voile, du patin et du talon. Un bouton bascule d'une génération à l'autre sans ressaisie. |
| **Sections acier** | EN 1993 | [dépôt](https://github.com/henri421/sections-ec3) · [ouvrir](https://henri421.github.io/sections-ec3/) | Profils IPE, HEA, HEB, PRS et tubes (EN 1993-1-1) : propriétés recalculées, classification sous la sollicitation réelle, sections efficaces de classe 4, résistances, flambement, déversement (M_cr hors norme signalé) et flexion composée. |
| **Assemblages soudés et boulonnés** | EN 1993 | [dépôt](https://github.com/henri421/assemblages-ec3) · [ouvrir](https://henri421.github.io/assemblages-ec3/) | Cordons d'angle et pénétrations (EN 1993-1-8 §4.5) : tête d'ancrage de tirant sur béton ou sur lierne, té, cruciforme, angle, recouvrement, profilé sur platine. Éclissage boulonné (§3.4 à §3.10) : cisaillement, pression diamétrale, groupe, section nette, cisaillement de bloc. Arrachement lamellaire, dispositions constructives. |
| **Regards en maçonnerie** | EN 1996 | [dépôt](https://github.com/henri421/regard) · [ouvrir](https://henri421.github.io/regard/) | Murs de regards enterrés en maçonnerie non armée sous poussée des terres et trafic (SLW 60, LM1 ou charge saisie) : prédimensionnement EN 1996-3, bande verticale, méthode complète EN 1996-1-1 (compression, flexion, voûte horizontale, charge concentrée, cisaillement, soulèvement). Tables normatives pré-remplies, à vérifier. |
| **Murs en maçonnerie** | EN 1996 | [dépôt](https://github.com/henri421/maconnerie) · [ouvrir](https://henri421.github.io/maconnerie/) | Mur en maçonnerie non armée : charge verticale avec coefficients Φ en tête, à mi-hauteur et en pied (6.1), charge concentrée (6.1.3), cisaillement de contreventement (6.2) et charge latérale (6.3). Coefficients de la norme pré-remplis et modifiables. |
| **Fondations superficielles** | EN 1997 | [dépôt](https://github.com/henri421/fondations-superficielles) · [ouvrir](https://henri421.github.io/fondations-superficielles/) | Semelle isolée ou filante selon l'EN 1997 et l'EN 1990, deux générations : portance drainée et non drainée sur la surface efficace, glissement, excentricité, tassement facultatif (élastique et œdométrique). Coupe et plan à l'échelle, cas gouvernant d'abord. Un bouton bascule d'une génération à l'autre sans ressaisie. |
| **Stabilité de talus** | EN 1997 | [dépôt](https://github.com/henri421/stabilite-talus) · [ouvrir](https://henri421.github.io/stabilite-talus/) | Stabilité générale d'un talus, d'un déblai ou d'un remblai par la méthode de Bishop selon l'EN 1997, deux générations : recherche du cercle critique par combinaison, couches drainées et non drainées, ligne piézométrique, surcharges en bande. Profil ANB 2022 au choix. Coupe à l'échelle et tableau des tranches. |
| **Mur en sol renforcé** | EN 1997 | [dépôt](https://github.com/henri421/sol-renforce) · [ouvrir](https://henri421.github.io/sol-renforce/) | Mur vertical en sol renforcé selon l'EN 1997 et l'EN 1990, deux générations : rupture et arrachement de chaque lit (gravité cohérente pour l'acier, corrosion comprise ; coin de Rankine pour les géosynthétiques), glissement, portance, basculement, excentricité, et stabilité générale par Bishop avec les forces des armatures. Coupe à l'échelle et tableau des lits. |
| **Pieux** | EN 1997 | [dépôt](https://github.com/henri421/pieux) · [ouvrir](https://henri421.github.io/pieux/) | Pieu sous charge axiale et groupe sous semelle rigide, EN 1997 des deux générations : compression, traction, frottement négatif, rupture en bloc et rendement, tassement simple. q_b et q_s saisis par couche et par profil. |
| **Parois** | EN 1997 | [dépôt](https://github.com/henri421/parois) · [ouvrir](https://henri421.github.io/parois/) | Paroi de soutènement encastrée par équilibre limite, EN 1997 des deux générations : console ou appuis multiples (tirants, butons, inclinés, efforts imposés), encastrement du pied réglable, fiche minimale, redistributions, charges variées. Diagrammes q, V, M et déplacement w, efforts des appuis et des liernes. |
| **Tirants de paroi** | EN 1997 | non publié | Vérification des tirants d'ancrage d'une paroi de soutènement (EN 1997-1 §8). En préparation. |
| **Schéma statique** | Outils | [dépôt](https://github.com/henri421/schema-statique) · [ouvrir](https://henri421.github.io/schema-statique/) | Schémas de poutres, portiques et consoles pour les notes de calcul : appuis, charges nommées, cotes, cas pratiques prêts à l'emploi et bibliothèque de modèles. Export SVG et PNG. Dessine, ne calcule pas. |
| **EC2 2e génération** | Outils | [dépôt](https://github.com/henri421/blog) · [ouvrir](https://henri421.github.io/blog/) | Ce qui change avec l'EN 1992-1-1:2023, mécanisme par mécanisme : effort tranchant, poinçonnement, fissuration, ancrages. Articles avec exemples chiffrés et calculateurs qui rendent côte à côte les deux générations et tous les niveaux d'approximation. |
<!-- OUTILS:FIN -->

## Architecture

La page tient dans `index.html` (et `en/index.html` pour l'anglais), qui charge `hub.js`, `asmin.js` et le module `projets/`. La navigation repose sur un routage par ancre (`#accueil`, `#en1992`, `#fissuration`, `#projets`…), sans serveur ni chargement de fragments externes.

Deux façons d'ajouter un outil.

**Sur cette page** — écrire une fonction `render(container)`, l'enregistrer dans `PAGES`, ajouter une entrée `route` dans `GROUPES`.

**Dans son propre dépôt** — publier l'outil sur GitHub Pages, ajouter son adresse à `OUTILS_EXTERNES` et une entrée `href` dans `GROUPES`, puis lancer `node scripts/readme.mjs`. C'est la règle dès qu'un outil a ses propres dépendances ou sa propre suite de tests.

## Identité graphique

Les couleurs, les rayons et les deux familles typographiques sont déclarés une fois pour toutes dans le `:root` de `index.html` : c'est le même jeu de jetons que les autres outils de la suite, recopié plutôt que partagé par un CDN, pour que chaque dépôt reste ouvrable hors ligne. Aucun code hexadécimal ne doit apparaître ailleurs. Le monoespace est réservé aux nombres, aux unités et aux cotes des tracés ; les surtitres, les libellés de panneau et les boutons sont en sans, majuscules espacées. Un tracé SVG engendré en JavaScript ne voit pas les variables CSS : `fissDraw()` lit donc les jetons une seule fois par `getComputedStyle` et les nomme en tête de fonction.

## Utilisation locale

Ouvrir `index.html` dans un navigateur récent, par double-clic. Aucune installation ni connexion n'est requise.

## Tests

Aucune dépendance, aucun build : le runner intégré à Node suffit.

```bash
node --test "tests/*.test.js"
```

Ils portent sur `asmin.js`, la chaîne d'armature minimale sous bridage centré, confrontée au cas de validation de `SPEC_correction_Asmin_bridage.md` §7 — dont toutes les valeurs ont été recalculées à la main de façon indépendante.

`asmin.js` est un **script classique**, pas un module : `index.html` porte des `onclick` en ligne qui exigent la portée globale, et son script en ligne ne peut donc pas devenir un module. Un garde d'export en fin de fichier — ignoré par le navigateur — permet néanmoins à Node de le charger. C'est ce qui donne des tests sans rien installer.

### Ce que ces tests verrouillent

- le cas §7 : `h_c,ef` = 240 mm, `σ_s` = 202,7 MPa, **27,44 cm²/m par nappe**, en convention EC2 comme en convention allemande ;
- l'**indépendance** de la méthode et de la convention de `k` — changer l'une ne doit pas bouger l'autre ;
- le **forçage** : toute grandeur imposée court-circuite sa formule, alimente la suite de la chaîne, et est marquée comme imposée ;
- un champ **vide** rend la main au calcul, un `0` impose bien zéro ;
- une valeur hors du domaine physique **avertit sans écrêter**.

## Déploiement sur GitHub Pages

1. Pousser le dépôt sur GitHub.
2. Ouvrir `Settings`, puis `Pages`.
3. Sous `Build and deployment`, choisir la source `GitHub Actions` : le workflow `pages.yml` lance les tests, puis publie.
4. Après une à deux minutes, l'application est accessible à `https://<compte>.github.io/WebAedificium/`.

Cette adresse s'ouvre depuis n'importe quel navigateur, y compris une workstation d'entreprise, sans droits d'administration.

## Base normative de l'outil de fissuration, et réserves

EN 1992-1-1:2004 + AC:2010, sections 7.3.2 et 7.3.4, tableau 3.1. Les valeurs recommandées (k3, k4, plancher de fct,eff) peuvent être modifiées par les Annexes Nationales belge (NBN) et luxembourgeoise (ILNAS) : vérifiez celle applicable au projet. La deuxième génération d'Eurocode (EN 1992-1-1:2023) révise la formulation de la maîtrise de la fissuration. Ces outils sont une aide au calcul ; la vérification finale relève de la responsabilité de l'ingénieur.
