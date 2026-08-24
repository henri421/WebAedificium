# Béton armé · EC2 — Outils de vérification

Suite d'outils de calcul de béton armé selon l'Eurocode 2 (EN 1992-1-1), destinée à un usage en bureau d'études. Application web à plusieurs pages, en fichier unique, sans aucune dépendance externe : tous les calculs s'exécutent localement dans le navigateur et aucune donnée n'est transmise.

## Outils disponibles

Le premier module, actif, calcule l'armature minimale de maîtrise de la fissuration pour les éléments massifs sous déformation gênée (radiers, poutres épaisses, voiles bridés) : équation 7.1, réduction pour élément épais selon la logique de l'EN 1992-3, contrôle de non-fragilité, et vérification de l'ouverture de fissure réelle par les équations 7.8 à 7.11. Une coupe de section se redessine en direct avec la zone tendue effective et les armatures à l'échelle. Trois modules supplémentaires (flexion simple, flambement de poteau, effort tranchant) sont réservés dans le menu et à compléter.

## Architecture

L'ensemble tient dans `index.html`. La navigation repose sur un routage par ancre (`#accueil`, `#fissuration`, ...), ce qui fait fonctionner le site de façon identique en ouverture locale par le protocole `file://` et en ligne sur GitHub Pages, sans serveur ni chargement de fragments externes.

Pour ajouter un outil, il suffit d'écrire une fonction `render(container)`, de l'enregistrer dans l'objet `PAGES`, puis d'ajouter une entrée dans le tableau `MENU`. La gestion de l'onglet actif, du titre et du routage est automatique.

## Utilisation locale

Ouvrir `index.html` dans un navigateur récent, par double-clic. Aucune installation ni connexion n'est requise.

## Déploiement sur GitHub Pages

1. Pousser le dépôt sur GitHub.
2. Ouvrir `Settings`, puis `Pages`.
3. Sous `Build and deployment`, choisir la source `Deploy from a branch`, la branche `main` et le dossier `/ (root)`, puis enregistrer.
4. Après une à deux minutes, l'application est accessible à `https://<compte>.github.io/beton-arme-ec2/`.

Cette adresse s'ouvre depuis n'importe quel navigateur, y compris une workstation d'entreprise, sans droits d'administration.

## Base normative et réserves

EN 1992-1-1:2004 + AC:2010, sections 7.3.2 et 7.3.4, tableau 3.1. Les valeurs recommandées (k3, k4, plancher de fct,eff) peuvent être modifiées par les Annexes Nationales belge (NBN) et luxembourgeoise (ILNAS) : vérifiez celle applicable au projet. La deuxième génération d'Eurocode (EN 1992-1-1:2023) révise la formulation de la maîtrise de la fissuration. Ces outils sont une aide au calcul ; la vérification finale relève de la responsabilité de l'ingénieur.
