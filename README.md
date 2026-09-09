# Aedificium web — Outils de vérification béton armé (EC2)

Point d'entrée d'une suite d'outils de calcul de béton armé selon l'Eurocode 2 (EN 1992-1-1), destinée à un usage en bureau d'études. Tous les calculs s'exécutent localement dans le navigateur et aucune donnée n'est transmise.

**Cette page relie les outils, elle ne les absorbe pas.** Chaque outil vit dans son propre dépôt, avec sa propre pile technique, sa propre suite de tests et son propre rythme de publication. C'est un choix : absorber ici un outil qui a des dépendances et des tests lui coûterait les deux.

## Les outils

| Outil | Où | Ce qu'il fait |
|---|---|---|
| **Vérification de sections** | [dépôt séparé](https://github.com/henri421/section-uls) · [ouvrir](https://henri421.github.io/section-uls/) | Flexion composée droite et déviée à l'ELU, domaines d'interaction, vérifications de service (contraintes, ouverture de fissures, courbure), effort tranchant §6.2, dispositions constructives §9, fissuration des éléments massifs |
| **Bielle-tirant** | [dépôt séparé](https://github.com/henri421/STM) · [ouvrir](https://henri421.github.io/STM/) | Efforts normaux dans un treillis plan : solveur paramétrique, optimisation de géométrie, génération de topologie. Fonctionne hors ligne |
| **Poinçonnement** | [dépôt séparé](https://github.com/henri421/poinconnement) · [ouvrir](https://henri421.github.io/poinconnement/) | Dalles pleines au droit d'un poteau (§6.4) : périmètres de contrôle par construction géométrique, coefficient d'excentrement, résistance avec et sans armatures, écrasement au nu du poteau |
| **Armature minimale de fissuration** | sur cette page | Éléments massifs sous déformation gênée : équation 7.1, réduction pour élément épais, vérification de l'ouverture réelle (éq. 7.8 à 7.11), coupe de section redessinée en direct |
| Flambement de poteau | à venir | Effets du second ordre, élancement, moment amplifié (§5.8) |

La flexion simple et l'effort tranchant, autrefois réservés dans le menu de cette page, sont désormais couverts par l'outil de vérification de sections. Ils en ont été retirés plutôt que dupliqués.

## Architecture

L'ensemble tient dans `index.html`. La navigation repose sur un routage par ancre (`#accueil`, `#fissuration`, ...), ce qui fait fonctionner le site de façon identique en ouverture locale par le protocole `file://` et en ligne sur GitHub Pages, sans serveur ni chargement de fragments externes.

Deux façons d'ajouter un outil.

**Sur cette page** — écrire une fonction `render(container)`, l'enregistrer dans `PAGES`, ajouter une entrée dans `MENU`. Onglet actif, titre et routage sont automatiques.

**Dans son propre dépôt** — publier l'outil sur GitHub Pages, puis ajouter son adresse à `OUTILS_EXTERNES` et une entrée `{href, label}` dans `MENU`. C'est la règle dès qu'un outil a ses propres dépendances ou sa propre suite de tests.

## Identité graphique

Les couleurs, les rayons et les deux familles typographiques sont déclarés une fois pour toutes dans le `:root` de `index.html` : c'est le même jeu de jetons que les autres outils de la suite, recopié plutôt que partagé par un CDN, pour que chaque dépôt reste ouvrable hors ligne. Aucun code hexadécimal ne doit apparaître ailleurs. Le monoespace est réservé aux nombres, aux unités et aux cotes des tracés ; les surtitres, les libellés de panneau et les boutons sont en sans, majuscules espacées. Un tracé SVG engendré en JavaScript ne voit pas les variables CSS : `fissDraw()` lit donc les jetons une seule fois par `getComputedStyle` et les nomme en tête de fonction.

## Utilisation locale

Ouvrir `index.html` dans un navigateur récent, par double-clic. Aucune installation ni connexion n'est requise.

## Tests

Aucune dépendance, aucun build : le runner intégré à Node suffit.

```bash
node --test
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
3. Sous `Build and deployment`, choisir la source `Deploy from a branch`, la branche `main` et le dossier `/ (root)`, puis enregistrer.
4. Après une à deux minutes, l'application est accessible à `https://<compte>.github.io/WebAedificium/`.

Cette adresse s'ouvre depuis n'importe quel navigateur, y compris une workstation d'entreprise, sans droits d'administration.

## Base normative et réserves

EN 1992-1-1:2004 + AC:2010, sections 7.3.2 et 7.3.4, tableau 3.1. Les valeurs recommandées (k3, k4, plancher de fct,eff) peuvent être modifiées par les Annexes Nationales belge (NBN) et luxembourgeoise (ILNAS) : vérifiez celle applicable au projet. La deuxième génération d'Eurocode (EN 1992-1-1:2023) révise la formulation de la maîtrise de la fissuration. Ces outils sont une aide au calcul ; la vérification finale relève de la responsabilité de l'ingénieur.
