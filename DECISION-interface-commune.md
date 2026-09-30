# Décision — infrastructure d'interface commune

*Prise le 2026-09-30, après le lot 9 d'`assemblages-ec3`, troisième usage.*

## Constat

Trois applications en TypeScript vanilla (`section-uls`, `poinconnement`,
`assemblages-ec3`) portent chacune `format`, `form`, `storage` et `export`.
La comparaison des trois montre deux natures de code très différentes.

**Primitives réellement communes**, à comportement identique attendu :

| Primitive | État |
| --- | --- |
| jetons CSS (`:root`) | identiques par règle (`DESIGN.md`), nommés `JETONS` ou `PALETTE` |
| `echapper` (HTML/SVG) | identique |
| nombre à la française (`nombreFr` / `formatNumber`) | **divergeait** : voir ci-dessous |
| taux arrondi vers le verdict | présent dans `section-uls` seulement ; ajouté à `assemblages-ec3` le 2026-09-30 |
| `telecharger` | identique aux commentaires près |
| `svgAutonome` (styles en CDATA) | identique aux commentaires près |
| CSV (point-virgule, BOM, aucune ligne omise) | mêmes règles, types de blocs différents |
| squelette de note HTML imprimable | même structure, blocs métier différents |

**Code accidentellement semblable**, à ne pas unifier : `form` (formulaire écrit
à la main dans `section-uls` et `poinconnement`, schéma déclaratif dans
`assemblages-ec3`), `storage` (format de modèle propre à chaque outil),
`expression` (propre à `section-uls`), les vues.

La divergence redoutée par l'audit s'est produite : `section-uls` arrondit un
taux **vers le verdict** (par défaut sous 1, par excès au-dessus), pour qu'un
« 1,00 » ne s'affiche jamais à côté d'un verdict contraire ; `assemblages-ec3`
arrondissait au plus proche. C'est corrigé, mais c'est précisément le défaut
qu'un module partagé aurait évité.

## Décision

1. **Extraire les seules primitives** du tableau ci-dessus dans un dépôt
   `aedificium-ui` (~250 lignes, testées), et **rien d'autre** : ni `form`, ni
   `storage`, ni `expression`.
2. Distribution par **dépendance Git épinglée sur une étiquette**
   (`"aedificium-ui": "github:henri421/aedificium-ui#v1.0.0"`) en
   `devDependencies` : Vite l'embarque à la construction, aucune dépendance de
   production n'apparaît, aucune publication npm n'est nécessaire, et `npm ci`
   reste reproductible.
3. Migration **au fil de l'eau**, à la prochaine modification des sorties de
   chaque outil — pas de campagne dédiée. `MBT` (React) n'est pas concerné.
4. Les coefficients partiels (`ec2Recommended`, `ec3Recommande`) **restent**
   dans chaque noyau : ils relèvent du métier et de normes différentes.

## Ce qui déclencherait une révision

Un quatrième outil qui aurait besoin d'une primitive absente de la liste, ou un
écart de comportement constaté entre deux outils sur une primitive extraite.

## Réalisation — 2026-10-01

Dépôt [`henri421/aedificium-ui`](https://github.com/henri421/aedificium-ui),
étiquette `v1.0.0`, 18 tests, CI. `assemblages-ec3`, `poinconnement` et
`section-uls` en tirent leurs primitives ; leurs suites de tests (267, 181,
725) passent inchangées. Effet de bord voulu : `section-uls` affiche désormais
un tiret au lieu de « NaN » pour une valeur absente. `assemblages-ec3` vérifie
par un test que le `:root` de sa feuille de style concorde avec `JETONS`.
