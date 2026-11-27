# Tests Forge Muscu

Dernière mise à jour : 27 novembre 2026

## Tests existants

Le dépôt contient `tests/seance-smoke.cjs`, exécuté par GitHub Actions après extraction de `forge-muscu.zip` et superposition des modules du dossier `forge-muscu/`.

Ce test vérifie actuellement :
- ouverture de la page Séance ;
- présence des quatre rubriques principales ;
- présence des trois onglets Programme / Exercices / Suivi ;
- recherche et ouverture d'une fiche exercice ;
- retour à la bibliothèque ;
- affichage de l'état vide du suivi ;
- navigation entre les onglets ;
- exécution sur un viewport mobile 390×844 et desktop 1365×900.

## Dernier résultat CI connu

- Workflow : Deploy Forge Muscu to GitHub Pages
- Commit : `9ba36389d6e6e21e302bfcd88f659f592a286c30`
- Résultat : succès
- Run : https://github.com/Nazumacky-0312/Forge-muscu/actions/runs/45938636091

Ce résultat concerne la version de référence sur `main`, pas les modifications de la branche de travail.

## Tests non exécutés pendant cet audit

Le poste distant était hors ligne et le navigateur cloud était indisponible faute de crédits. Aucun test visuel ou parcours utilisateur n'est donc revendiqué pour la nouvelle branche.

## Tests requis avant publication

- [ ] Reprendre une séance après actualisation et fermeture de l'onglet.
- [ ] Valider puis annuler une série.
- [ ] Vérifier le minuteur après changement d'onglet.
- [ ] Vérifier l'enregistrement de RPE/RIR, notes et douleur.
- [ ] Vérifier les records et le volume à partir des seules séries validées.
- [ ] Vérifier l'import/export CSV et JSON sans perte.
- [ ] Vérifier que Coach Forge répond sans réseau et sans API.
- [ ] Vérifier le cache PWA et l'activation d'une nouvelle version.
- [ ] Vérifier l'authentification, les conflits de révision et l'isolation RLS avec deux comptes de test.
- [ ] Vérifier les vues mobile et desktop.
