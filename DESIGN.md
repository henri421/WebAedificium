# Aedificium — identité commune des outils EC2

Fichier de référence pour la passe d'application. Il fixe **un seul jeu de jetons**, copiable tel quel dans un `:root`, sans build ni dépendance partagée : chaque dépôt garde sa pile, aucune feuille servie depuis un CDN, le fonctionnement hors ligne de STM reste intact.

Périmètre : `WebAedificium`, `section-uls`, `poinconnement`, `STM`.
**Atlas reste dehors** — public différent, identité `--navy: #002147` + Barlow assumée. Ne pas y toucher.

## Deux natures de couleur

Le châssis (fond, texte, filets, surfaces) est de la dérive pure : cinq blancs cassés et quatre encres que personne n'a décidés. Il s'unifie sans discuter.

Les couleurs de sens portent de l'information. Elles s'alignent sur `section-uls`, qui devient la référence de la suite : la compression est bleue et la traction est rouge-terre **partout**, avec les mêmes valeurs.

Règle qui découle du choix fait sur l'accent : **une couleur de sens ne sert jamais de décor.** `--compression` ne doit plus apparaître dans un outline de focus (c'est le cas aujourd'hui dans `section-uls`), ni `--acier` dans une bordure d'interface. L'interface a son propre bleu, `--accent`.

## Le bloc à copier

```css
:root {
  /* ---- Châssis ---- */
  --fond: #f7f7f6;            /* fond de page */
  --surface: #ffffff;         /* cartes, panneaux, champs */
  --surface-appui: #f2f1ec;   /* en-têtes de tableau, boutons au repos, blocs d'attente */
  --texte: #1a1a1a;
  --texte-doux: #4a4842;      /* notes, libellés de ligne, corps secondaire */
  --texte-faible: #6a6862;    /* legend, sous-titres, surtitres */
  --bordure: #c8c6c0;         /* filet structurant : cadres, champs, séparateurs */
  --bordure-douce: #eceae4;   /* filet interne : lignes de liste, lignes de tableau */

  /* ---- Interface ---- */
  --accent: #1e5aa8;          /* focus, liens, état actif — JAMAIS une couleur de sens */
  --accent-doux: #eaf1f9;     /* fond d'un champ actif, surlignage de zone */

  /* ---- Couleurs de sens ---- */
  --compression: #2f5d8a;     /* bielle, béton comprimé, domaine résistant */
  --traction: #a8442a;        /* tirant, acier tendu, point sollicitant */
  --beton: #e7eaee;           /* aplat de matière dans les tracés */
  --neutre: #9a978f;          /* barre à effort nul, repères de cotation */

  /* ---- Verdicts : trois états, pas quatre ---- */
  --ok: #1f6f3f;      --ok-fond: #eaf4ee;
  --alerte: #8a6d00;  --alerte-fond: #fdf6e3;
  --refus: #a52121;   --refus-fond: #f8ecec;

  /* ---- Typographie ---- */
  --sans: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;

  /* ---- Rayons ---- */
  --rayon: 4px;        /* cartes, panneaux, fieldsets */
  --rayon-petit: 3px;  /* champs, boutons, pastilles */

  color-scheme: light;
}
```

Aucun jeton en dehors de cette liste. Si une valeur manque, elle se dérive de celles-ci ou elle est une erreur de conception à signaler, pas un hex de plus.

## Règles de composition

**Fond.** La page est sur `--fond`, tout ce qui contient de l'information est sur `--surface` avec un filet `--bordure` de 1px. C'est le seul mécanisme de séparation : pas d'ombre portée, pas de dégradé, pas de deuxième niveau de gris.

**Densité.** Base `14px/1.5` — la densité de `section-uls`. `poinconnement` (15px) et le hub (15px) descendent à 14px.

**Typographie.**
| Rôle | Style |
|---|---|
| `h1` | 1.1rem, `letter-spacing: .02em`, poids normal |
| `h2` | 0.95rem, poids 600 |
| surtitre / `legend` / `.sous-titre` | 0.72rem, majuscules, `letter-spacing: .08em`, `--texte-faible` |
| corps | 0.85rem |
| note | 0.8rem, `--texte-doux` |
| **tout nombre, toute unité** | `--mono`, `font-variant-numeric: tabular-nums` |

Le monoespace est réservé aux nombres : résultats, cellules de tableau, valeurs de champ, cotes des tracés SVG. Il ne sert pas de police de titre. Le hub doit donc perdre ses surtitres et ses libellés de panneau en mono — ils passent en sans, majuscules espacées.

**Libellés en flex.** Un `label` en `display: flex` fait de chacun de ses enfants un élément de grille : `d<sub>y</sub> (mm)` s'écarte alors en trois morceaux. Le texte du libellé doit tenir dans un `<span>` unique.

**Champs et boutons.**
```css
input, select, textarea {
  padding: .28rem .4rem; border: 1px solid var(--bordure);
  border-radius: var(--rayon-petit); background: var(--surface);
  color: inherit; font: inherit;
}
input[type='text'], input[type='number'] { font-family: var(--mono); text-align: right; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }

button {
  padding: .32rem .7rem; border: 1px solid var(--bordure);
  border-radius: var(--rayon-petit); background: var(--surface-appui);
  color: inherit; font: inherit; cursor: pointer;
}
button:hover { background: #e8e7e1; }
```
Un seul niveau de bouton : il n'y a pas d'action principale colorée dans ces outils, le résultat se recalcule en continu. Le champ reste blanc au repos ; `--accent-doux` ne l'habille que pendant la saisie. Le champ bleu-en-permanence du hub disparaît.

**Cartes, panneaux, fieldsets.**`background: var(--surface)`, `border: 1px solid var(--bordure)`, `border-radius: var(--rayon)`, `padding: 1rem`. Un `fieldset` porte en plus `min-inline-size: 0` (sans quoi les cadres ne font pas la même largeur) et un `legend` au style de surtitre.

**Verdicts.** Trois états, une seule forme : liséré gauche de 3px en couleur pleine, fond `*-fond`, texte en couleur pleine, poids 600, `--rayon`.
| État | Sens |
|---|---|
| `ok` | la vérification passe telle quelle |
| `alerte` | ça passe mais sous condition, ou une hypothèse mérite l'œil (armatures nécessaires, flexion déviée, méthode Meyer) |
| `refus` | ça ne passe pas, et aucune armature n'y remédie |

L'état « attente / pas encore de saisie » n'est pas un verdict : bloc gris sur `--surface-appui`, sans liséré coloré.

**Tableaux de grandeurs.** `border-collapse: collapse`, en-tête sur `--surface-appui`, lignes séparées par `--bordure-douce`, libellé à gauche en `--texte-doux`, valeur à droite en `--mono` + `tabular-nums`, **poids normal** — le monoespace tabulaire suffit à faire tenir la colonne, le gras en plus l'alourdit. Le gras est réservé aux verdicts.

**Barre commune.** Même barre dans les quatre outils : nom de la suite à gauche, un seul lien « Outils EC2 ↗ » à droite (`target="_blank"`, adresse absolue du hub). Un lien unique, c'est la surface d'échec minimale hors ligne — les autres outils ne sont pas listés dans la barre, le hub reste le carrefour. Libellés courts partout ailleurs : Sections · Bielle-tirant · Poinçonnement · Fissuration.

**Impression.** La barre disparaît, le fond passe en blanc, les filets restent. `@media print { --fond: #fff }` ne suffit pas : mettre `background: #fff` sur `body` et masquer la barre.

## Correspondance ancien → nouveau

### section-uls (`app/src/style.css`, `app/src/export.ts`)
| Ancien | Nouveau | Note |
|---|---|---|
| `--encre: #1a1a1a` | `--texte` | inchangé |
| `--papier: #fbfbf9` | `--fond: #f7f7f6` | légèrement moins jaune |
| `--trait: #c8c6c0` | `--bordure` | inchangé, devient la valeur de la suite |
| `--appui: #f2f1ec` | `--surface-appui` | inchangé |
| `--ok: #1f6f3f` | `--ok` | inchangé |
| `--non-ok: #a52121` | `--refus` | renommé |
| `--attention: #8a6d00` | `--alerte` | renommé, devient la valeur de la suite |
| `--compression`, `--traction` | inchangés | référence de la suite |
| `#fff` en dur (fieldset, svg, plot) | `--surface` | |
| `#4a4842` en dur (note, ligne, legende) | `--texte-doux` | |
| `#6a6862` en dur (legend, sous-titre) | `--texte-faible` | |
| `#eceae4` en dur (ligne) | `--bordure-douce` | |
| `#eaf4ee` / `#f8ecec` en dur | `--ok-fond` / `--refus-fond` | |
| `#fdf6e3` en dur (erreur, notes) | `--alerte-fond` | |
| `#9a978f` (`.repere`) | `--neutre` | |
| `outline: 2px solid var(--compression)` | `var(--accent)` | **la règle** : le focus n'est pas de la compression |
| `--libelle: 12rem` | conservé | jeton de gabarit, pas de couleur |
| base `14px` | inchangée | densité de la suite |

### poinconnement (`app/src/style.css`)
| Ancien | Nouveau | Note |
|---|---|---|
| `--encre: #1b1f24` | `--texte: #1a1a1a` | |
| `--encre-douce: #5a6470` | `--texte-doux: #4a4842` | passe du gris froid au gris chaud |
| `--fond: #f6f7f9` | `--fond: #f7f7f6` | |
| `--papier: #ffffff` | `--surface` | renommé — attention, `--papier` désignait ici le blanc et dans section-uls le fond |
| `--trait: #d3d8de` | `--bordure: #c8c6c0` | |
| `--beton: #e7eaee` | `--beton` | inchangé, devient la valeur de la suite |
| `--acier: #2f6f9f` | `--accent` pour les périmètres de contrôle | un périmètre est une construction géométrique, pas un effort |
| `--alerte: #b45309` / `--alerte-fond: #fef3c7` | `--alerte` / `--alerte-fond` | |
| `--refus: #b3261e` / `--refus-fond: #fdecea` | `--refus` / `--refus-fond` | |
| `--sur: #1a7f4b` / `--sur-fond: #e8f5ee` | `--ok` / `--ok-fond` | |
| `#7c3a06` en dur (`.alerte`) | `--alerte` | |
| rayons 5px / 6px | `--rayon: 4px` | |
| base `15px` | `14px` | |
| `h1: 1.6rem` | `1.1rem` | l'outil n'a pas besoin d'un titre deux fois plus gros que ses voisins |

### STM (`index.html`)
| Ancien | Nouveau | Note |
|---|---|---|
| `--bg: #eef1f5` | `--fond` | |
| `--panel: #ffffff` | `--surface` | |
| `--line: #d3d9e2` | `--bordure` | |
| `--line2: #e6eaf0` | `--bordure-douce` | |
| `--ink: #161c28` | `--texte` | |
| `--ink2: #5a6576` | `--texte-doux` | |
| `--ink3: #8a94a6` | `--texte-faible` | |
| `--strut: #2e5eaa` | `--compression: #2f5d8a` | **le point de la passe** : la bielle prend la couleur de la compression de section-uls |
| `--tie: #c42b2b` | `--traction: #a8442a` | idem pour le tirant |
| `--nul: #9aa3b2` | `--neutre` | |
| `--sup: #157a6e` / `--load` / `--accent: #22303f` | `--texte` | **tranché** : l'appui est une condition aux limites, pas un effort. Il se dessine en encre comme la charge. Deux couleurs de sens dans toute la suite, pas trois |
| `--ok: #157a6e` / `--warn: #b26a00` / `--err: #c42b2b` | `--ok` / `--alerte` / `--refus` | |
| `#f0d9b5` / `#fdf7ec` (`.instab`) | `--alerte` / `--alerte-fond` | |
| `#eef1f5` en dur (`code`) | `--surface-appui` | |
| rayons 6 / 7 / 8 / 10 / 20px | `--rayon` et `--rayon-petit` ; 20px seulement pour une pastille pleinement arrondie | quatre rayons pour un même outil, c'est de la dérive |

### WebAedificium (`index.html`)
| Ancien | Nouveau | Note |
|---|---|---|
| `--paper: #F4F6F8` | `--fond` | |
| `--panel: #FFFFFF` | `--surface` | |
| `--ink: #14202E` | `--texte` | |
| `--muted: #5B6773` | `--texte-doux` | |
| `--line: #D5DCE3` | `--bordure-douce` | le filet du hub est plus clair que celui de la suite |
| `--line-strong: #B8C2CC` | `--bordure` | |
| `--blue: #1E5AA8` | `--accent` | inchangé, devient l'accent de la suite |
| `--blue-soft: #EAF1F9` | `--accent-doux` | inchangé |
| `--green` / `--green-soft` | `--ok` / `--ok-fond` | |
| `--red` / `--red-soft` | `--refus` / `--refus-fond` | |
| `--amber` / `--amber-soft` | `--alerte` / `--alerte-fond` | |
| `--nav: 252px` | conservé | gabarit |
| base `15px` | `14px` | |
| bordure de nav `2px solid var(--ink)` | `1px solid var(--bordure)` | le trait noir épais est le seul endroit de la suite qui en porte un |
| `main { background-image: quadrillage 22px }` | supprimé | le fond est plat dans les quatre outils |
| `input, select { color: var(--blue); background: var(--blue-soft) }` | `--texte` sur `--surface` | le champ n'est bleu que pendant la saisie |
| surtitres, libellés de panneau, boutons en `--mono` | `--sans`, majuscules `.08em` | le mono est réservé aux nombres |
| couleurs en dur dans `fissDraw()` (`#EAF1F9`, `#14202E`, `#1E5AA8`, `#5B6773`) | lire les jetons via `getComputedStyle` ou constantes nommées en tête de fonction | un SVG généré en JS ne voit pas les variables CSS : déclarer les constantes une fois |

## Ordre de la passe

1. Poser le `:root` identique dans les quatre dépôts (dont `export.ts` de section-uls, qui embarque sa propre copie pour l'impression).
2. Renommer par correspondance, outil par outil. Mécanique.
3. Purger les hex en dur — c'est là que se cache le reste de la dérive, notamment dans les fonctions de dessin SVG.
4. Aligner densité, rayons et usage du mono.
5. Poser la barre commune et le lien vers le hub.
6. Vérifier l'impression de chaque outil, et l'ouverture de STM hors ligne.

## Réserves

`--accent` (#1e5aa8) et `--compression` (#2f5d8a) sont deux bleus voisins. Ils ne se rencontrent jamais dans le même rôle : l'un est du châssis d'interface, l'autre est dans les tracés et leurs légendes. Si un écran finit par les mettre côte à côte dans une même liste de pastilles, c'est le signe qu'un tracé emprunte une couleur d'interface, ou l'inverse — corriger l'usage, pas le jeton.
