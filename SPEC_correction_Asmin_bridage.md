# Spécification de correction : armature minimale de maîtrise de la fissuration sous bridage centré (EN 1992-1-1)

## 0. Comment utiliser ce document

Ce fichier décrit la chaîne de calcul correcte de l'armature minimale `As,min` pour la maîtrise de la fissuration sous bridage centré (zentrischer Zwang), selon EN 1992-1-1 §7.3.2 et §7.3.3, avec les deux conventions de coefficients possibles (valeurs recommandées de l'Eurocode et annexe nationale allemande). Le programme actuel donne des résultats différents d'une feuille de référence vérifiée. Corrige le code pour qu'il respecte les formules ci-dessous et qu'il reproduise exactement le cas de test de la section 7. Toutes les valeurs attendues de la section 7 ont été recalculées à la main de façon indépendante.

Ne code aucune valeur en dur : tout ce qui figure en section 6 doit rester un paramètre d'entrée modifiable.

## 1. Contexte physique

Une section reste non fissurée tant que la contrainte de traction du béton n'atteint pas `fct,eff`. Dès la première fissure, l'acier doit reprendre sans plastifier l'effort que le béton relâche, sinon la fissure devient unique et large au lieu de rester fine et répartie. L'armature minimale garantit cette condition. Pour un radier massif, la fissuration est gouvernée par le bridage au jeune âge (hydratation), mais un ouvrage permanent subit aussi un bridage tardif qui mobilise la pleine résistance en traction. Le choix du scénario pilote `fct,eff` via le facteur temporel `kzt`.

## 2. Symboles et unités

Travailler en unités SI cohérentes. Recommandation : longueurs en m, contraintes en N/mm² (= MPa = MN/m²), aires en m², résultat converti en cm²/m.

```
h       hauteur (épaisseur) de l'élément                     [m]
b       largeur de calcul (1,0 m pour une dalle/radier)      [m]
cnom    enrobage nominal                                     [m]
phi     diametre de barre principale                         [m]
fck     resistance caracteristique en compression            [N/mm2]
fyk     limite d'elasticite de l'acier                       [N/mm2]
Es      module d'elasticite de l'acier (= 200000)            [N/mm2]
wk      ouverture de fissure admissible                      [mm]
kzt     facteur temporel sur fct,eff (fct,eff / fctm)        [-]
kc      coefficient de repartition des contraintes           [-]
fctm    resistance moyenne en traction                       [N/mm2]
fcteff  resistance en traction effective                     [N/mm2]
d       hauteur utile                                        [m]
d1      distance axe des aciers -> parement tendu            [m]
k       coefficient contraintes non lineaires                [-]
hcef    hauteur de la zone de beton tendu efficace           [m]
Act     aire de la section droite tendue                     [m2]
Aceff   aire de beton tendu efficace                         [m2]
phistar diametre limite modifie (controle §7.3.3)            [mm]
sigs    contrainte d'acier admissible                        [N/mm2]
Asmin   armature minimale                                    [cm2/m par nappe]
```

## 3. Erreurs probables du programme actuel (à vérifier en priorité)

1. Hauteur efficace. Le programme utilise très probablement la formule de la fissuration de flexion `hcef = min(2,5*(h-d) ; h/2)` (EN 1992-1-1 §7.3.4). C'est faux pour le bridage centré d'un élément épais. Il faut employer les branches fonction de `h/d1` de la section 4.5. Sur le cas de test, l'erreur fait passer `hcef` de 0,240 m à 0,1375 m, soit une sous-estimation d'environ 43 % de l'armature.
2. Coefficient `k`. Vérifier la convention retenue : valeurs recommandées EC2 (1,0 puis 0,65) ou annexe nationale allemande (0,8 puis 0,5). Ne pas mélanger la formule d'interpolation de l'une avec la valeur plafond de l'autre.
3. Facteur temporel `kzt`. Vérifier que `fcteff = kzt * fctm` et que `kzt` est bien un paramètre, pas une constante implicite. Ne pas confondre früher Zwang (kzt réduit) et später Zwang (`fcteff = fctm`, plancher 3,0 MPa).
4. Contrainte d'acier `sigs`. Vérifier la formule de la section 4.7 et surtout d'où vient `phistar`.
5. Logique de choix mince/épais. Le programme doit calculer les deux approches et retenir la plus petite, avec la borne inférieure de l'approche épaisse (section 4.8).

## 4. Chaîne de calcul correcte

### 4.1 Propriétés matériaux

```
fctm = 0.30 * fck**(2/3)          # valable jusqu'a C50/60 ; au-dela, autre formule
fcteff = kzt * fctm               # brige au jeune age
# si le brige tardif gouverne : fcteff = max(fctm, 3.0)
```

Valeurs indicatives de `kzt` pour le früher Zwang (durée d'évacuation de la chaleur d'hydratation) : environ 0,65 à 3 jours, 0,75 à 5 jours, 0,85 à 7 jours. Un élément d'épaisseur `h <= 0,30 m` refroidit en environ 3 jours, un élément `h > 0,80 m` en environ 7 jours ou davantage. Pour un radier massif, le refroidissement dépasse 7 jours, donc `kzt` doit tendre vers 1,0 ; retenir une valeur haute est le choix prudent.

### 4.2 Géométrie

```
d  = h - cnom - phi/2
d1 = h - d                        # = cnom + phi/2
ratio = h / d1                    # selecteur de branche pour hcef
```

### 4.3 Coefficient k (deux conventions, paramétrables)

`h` est ici la plus petite dimension de la section, exprimée en mm dans les formules ci-dessous.

```
# valeurs recommandees Eurocode : 1,0 (h<=300 mm) -> 0,65 (h>=800 mm)
k_ec2 = min(1.0, max(0.65, 1.0 - (h_mm - 300)/500 * 0.35))

# annexe nationale allemande : 0,8 (h<=300 mm) -> 0,5 (h>=800 mm)
k_de  = min(0.8, max(0.5, 0.8 - (h_mm - 300)/500 * 0.30))
```

Le choix entre `k_ec2` et `k_de` dépend de l'annexe nationale applicable au projet (belge NBN, luxembourgeoise ILNAS, ou allemande). Exposer ce choix comme paramètre.

### 4.4 Coefficient kc

Traction pure (bridage centré) : `kc = 1.0`. En flexion, `kc` se calcule autrement ; hors périmètre de cette note.

### 4.5 Hauteur efficace hcef (POINT CRITIQUE)

Pour le bridage centré (zentrischer Zug), la hauteur efficace croît avec l'épaisseur, contrairement à la zone de rive figée de la flexion. Sélection par branches selon `ratio = h/d1`.

```
# TRACTION CENTREE (a utiliser ici)
if ratio < 5.0:
    hcef = 2.5 * d1
elif ratio < 30.0:
    hcef = 0.10 * h + 2.0 * d1
else:                      # ratio >= 30
    hcef = 5.0 * d1
```

Pour mémoire, les branches de la flexion sont différentes (seuils 10 et 60, coefficient 0,05) et ne doivent pas être employées ici :

```
# FLEXION (ne pas utiliser pour le brige centre)
if ratio < 10.0:   hcef = 2.5 * d1
elif ratio < 60.0: hcef = 0.05 * h + 2.0 * d1
else:              hcef = 5.0 * d1
```

Contrôle de garde : `hcef` ne doit pas dépasser `h/2`.

Justification physique : après la première fissure traversante, l'acier réintroduit l'effort dans le béton sur une longueur d'introduction. Dans un élément épais, les barres sont trop espacées pour agir sur tout le cœur ; il se forme des fissures secondaires près des barres, ce qui rend la zone d'influence des barres plus profonde que la zone de rive de flexion.

Source : Schneider, Bautabellen für Ingenieure ; Fingerloos, Hegger, Zilch, Eurocode 2 für Deutschland.

### 4.6 Aires

```
Act   = 0.5 * h * b          # section droite tendue (traction centree)
Aceff = hcef * b             # zone efficace par face
```

### 4.7 Contrainte d'acier sigs

`sigs` provient du contrôle d'ouverture de fissure par diamètre limite (EN 1992-1-1 §7.3.3, tableau NA.7.2). Formule confirmée, avec `wk` en mm, `Es` et `fcteff` en N/mm², `phistar` en mm :

```
sigs = sqrt(6 * wk * Es * fcteff / phistar)
```

`phistar` est le diamètre limite modifié. Pour la traction centrée, la source donne :

```
phistar = phi_mm * 8*(h - d) / (k * kc * hcr) * (fct0 / fcteff)
phistar <= phi_mm * (fct0 / fcteff)          # plafond
# fct0 = 2.9 N/mm2 (valeur de reference des tables)
# hcr  = hauteur de la zone tendue juste avant fissuration
```

RESERVE IMPORTANTE, à vérifier contre la source normative avant de figer le code. La reproduction numérique de la feuille de référence (`phistar = 13,54 mm`) n'est obtenue qu'avec `hcr = h` et sans appliquer le facteur `fct0/fcteff` dans `phistar`, alors que ce facteur apparaît déjà dans `sigs` via `fcteff`. Il y a donc une ambiguïté sur l'emplacement du rapport `fct0/fcteff` et sur la définition exacte de `hcr` pour la traction pure. Recommandation robuste : exposer `sigs` (ou `phistar`) comme donnée d'entrée issue du module de contrôle de fissuration existant, plutôt que de recalculer `phistar` ici, jusqu'à vérification de la clause exacte. Si tu implémentes `phistar`, marque cette partie comme à valider et documente l'hypothèse sur `hcr`.

### 4.8 Armature minimale (choix mince / épais)

La norme ne fixe pas de frontière nette entre éléments minces et épais. Calculer les deux et retenir la plus petite, l'approche épaisse étant bornée inférieurement pour empêcher la plastification de l'acier à la fissuration.

```
As_mince = k * kc * fcteff * Act / sigs

terme1   = fcteff * Aceff / sigs               # reduction pour element epais
borne    = k * fcteff * Act / fyk              # borne inferieure anti-plastification
As_epais = max(terme1, borne)

Asmin_m2 = min(As_mince, As_epais)             # [m2/m]
Asmin    = Asmin_m2 * 1e4                       # [cm2/m par nappe]
```

## 5. Structure de code suggérée

Une fonction pure prenant un dictionnaire d'entrées et renvoyant un dictionnaire de résultats intermédiaires et finaux, sans effet de bord, afin de faciliter les tests unitaires. Séparer clairement le module de contrôle de fissuration (qui produit `sigs`) du module d'armature minimale (qui le consomme). Exposer la convention de `k` et le scénario de bridage comme paramètres.

## 6. Paramètres d'entrée à exposer (rien en dur)

`h`, `b`, `cnom`, `phi`, `fck`, `fyk`, `Es`, `wk`, `kzt`, `kc`, convention de `k` (ec2 ou de), scénario de bridage (früher ou später), et soit `sigs` soit `phistar` selon le choix de la section 4.7.

## 7. Cas de test de validation (valeurs vérifiées)

Entrées :

```
h = 1.30 m, b = 1.0 m, cnom = 0.045 m, phi = 0.020 m
fck = 30 N/mm2, fyk = 500 N/mm2, Es = 200000 N/mm2
wk = 0.20 mm, kzt = 0.80, kc = 1.0
phistar = 13.54 mm     (issu du controle §7.3.3 ; sert a obtenir sigs)
```

Valeurs intermédiaires attendues (tolérance 1 %) :

| Grandeur | Valeur attendue | Unité |
|---|---|---|
| fctm | 2,896 | N/mm2 |
| fcteff = kzt*fctm | 2,317 | N/mm2 |
| d | 1,245 | m |
| d1 | 0,055 | m |
| h/d1 | 23,6 | - |
| hcef (branche 5 a 30) | 0,240 | m |
| Act | 0,650 | m2 |
| Aceff | 0,240 | m2 |
| k_ec2 | 0,65 | - |
| k_de | 0,50 | - |
| sigs | 202,7 | N/mm2 |

Résultats d'armature attendus (cm²/m par nappe) :

| Convention | As_mince | As_epais | Asmin retenu |
|---|---|---|---|
| annexe allemande (k=0,50) | 37,16 | 27,44 | 27,44 |
| valeurs EC2 (k=0,65) | 48,30 | 27,44 | 27,44 |

Lecture du résultat : sur ce cas, l'élément est épais, donc l'approche épaisse (27,44) gouverne dans les deux conventions. Le terme `terme1 = fcteff*Aceff/sigs` vaut 27,44 et ne dépend pas de `k` ; la borne inférieure (15,06 en convention allemande, 19,58 en EC2) ne gouverne pas. Conséquence : sur ce cas précis, l'écart avec la feuille de référence provient de `fcteff` (donc `kzt`) et surtout de `hcef`, pas de `k`. Le coefficient `k` ne change le résultat que si l'approche mince devient déterminante (éléments moins épais) ou si la borne inférieure gouverne.

## 8. Réserves normatives

1. Base : EN 1992-1-1:2004, §7.3.2 (équation 7.1) et §7.3.3. La deuxième génération EN 1992-1-1:2023 réorganise ces clauses ; vérifier la numérotation si elle est citée.
2. Le coefficient `k` (1,0/0,65 recommandé, 0,8/0,5 allemand) est un paramètre national. Confirmer la valeur imposée par l'annexe applicable au projet.
3. Le plancher `fct,eff >= 3,0 MPa` du bridage tardif est une valeur recommandée, modifiable en annexe nationale.
4. Pour un ouvrage étanche en béton (WU), la WU-Richtlinie du DAfStb gouverne le scénario de bridage et l'ouverture de fissure admissible.
5. La formule de `phistar` et la définition de `hcr` restent à confirmer (voir section 4.7).

Cet outil est une aide au calcul. La vérification finale et la responsabilité incombent à l'ingénieur du projet.
