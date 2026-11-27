# Tests Forge Muscu

Dernière mise à jour : 27 novembre 2026

## Couverture Playwright ajoutée

Le test `tests/seance-smoke.cjs` est exécuté sur deux viewports :
- mobile : 390×844 ;
- ordinateur : 1365×900.

Parcours couverts :
- ouverture de Séance et vérification des quatre rubriques principales ;
- vérification des trois onglets Programme / Exercices / Suivi ;
- vérification du style responsive de la navigation Séance : position sticky, trois colonnes, onglet actif et absence de débordement horizontal sur mobile et desktop ;
- vérification que le bouton « Modifier » reste sur une seule ligne et que son libellé tient dans sa zone sur mobile et desktop ;
- vérification que les boutons « Nouvelle séance » et « Régénérer le programme » ne se chevauchent pas ;
- recherche, ouverture d'une fiche exercice et retour ;
- affichage de l'état vide du suivi ;
- rappel de reprise d'une séance active ;
- déclenchement de la sauvegarde de sécurité sur pagehide ;
- saisie du type de série, RPE, RIR et note d'exercice ;
- conservation de ces champs après rechargement ;
- exclusion des séries d'échauffement du volume de travail ;
- pause du minuteur, rechargement et reprise ;
- ouverture du profil et présence du mode hors ligne malgré le module cloud facultatif.

## CI

- Workflow : Deploy Forge Muscu to GitHub Pages
- Dernier run de référence main : succès, commit `9ba36389d6e6e21e302bfcd88f659f592a286c30`
- Run de référence : https://github.com/Nazumacky-0312/Forge-muscu/actions/runs/45938636091
- Les runs de la branche de travail sont déclenchés sur les pull requests. Le dernier résultat doit être vérifié avant de déclarer les nouveaux parcours validés.
- Les jobs de la branche ne déploient pas sur GitHub Pages ; le déploiement est limité à `main`.

## Tests non encore effectués

- [ ] Connexion réelle avec Magic Link sur l'URL GitHub Pages.
- [ ] Première sauvegarde cloud avec un compte de test.
- [ ] Restauration d'une sauvegarde distante.
- [ ] Conflit de révision avec deux sessions/appareils.
- [ ] Suppression de la sauvegarde cloud avec vérification que le local reste intact.
- [ ] Upload et suppression de photos dans le bucket privé (interface non intégrée).
- [ ] Import/export CSV et JSON sans perte des nouveaux champs.
- [ ] Coach Forge sans réseau et sans API après les dernières modifications.
- [ ] Vérification visuelle manuelle sur un vrai Android et sur ordinateur.

## Limites

Le poste distant était hors ligne et le navigateur cloud était indisponible faute de crédits. Les tests de navigateur sont automatisés par GitHub Actions ; aucun test manuel sur un appareil physique n'est revendiqué.
