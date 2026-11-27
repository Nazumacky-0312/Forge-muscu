# Forge Muscu — suivi de la refonte

Dernière mise à jour : 27 novembre 2026

## État général

Refonte en cours. L'application de production sur `main` n'a pas été modifiée ni redéployée. Les travaux sont isolés dans une PR brouillon.

## Sauvegarde et branches

- Branche de référence : `main`
- Commit de référence : `9ba36389d6e6e21e302bfcd88f659f592a286c30`
- Branche de sauvegarde : `backup/pre-forge-premium-2026-11-27`
- Branche de travail : `forge-premium-upgrade`
- PR de travail : https://github.com/Nazumacky-0312/Forge-muscu/pull/2
- Dernier commit de travail validé par CI avant cette mise à jour documentaire : `2852879fa7646d6be3e3c7708d3818e69f5be677`

## Audit réalisé

- Application PWA JavaScript sans framework, avec modules chargés par scripts.
- Navigation principale : Accueil, Séance, Coach, Rangs.
- La page Séance regroupe Programme, Exercices et Suivi dans `js/view-seance.js`.
- Le dépôt contient une archive `forge-muscu.zip` et un dossier de surcharge `forge-muscu/`.
- Le workflow Pages extrait l'archive, puis superpose le dossier `forge-muscu/`. Ce mécanisme est conservé.
- Le code déployé a été extrait depuis l'artefact GitHub Actions de la branche de travail afin d'inspecter les modules qui ne sont pas directement suivis dans le dépôt.
- Le stockage local utilise `localStorage`, avec import/export JSON.
- Le service worker gère le cache hors ligne.
- Le Coach Forge est implémenté localement et ne nécessite pas de clé API.
- Les médias d'exercices sont référencés dans `data/exercise-media.json`.

## Terminé

- [x] Inspection du dépôt, de la branche principale, de la structure suivie et du workflow Pages.
- [x] Création d'une branche de sauvegarde et d'une branche de travail.
- [x] Extraction de l'artefact de site généré par CI pour inspecter les modules de l'archive.
- [x] Vérification du projet Supabase existant : actif, région Paris, base publique initialement vide.
- [x] Migrations cloud appliquées : état JSON, historique, RPC à contrôle de révision, RLS et bucket photo privé.
- [x] Politiques de suppression cloud limitées à l'utilisateur.
- [x] Bandeau « Reprendre » lorsqu'une séance est active et navigation vers la séance.
- [x] Sauvegarde de sécurité sur pagehide, beforeunload et passage en arrière-plan.
- [x] Préservation de la séance active lors d'une modification du stockage depuis un autre onglet.
- [x] Types de séries, RPE/RIR et note par exercice ajoutés à l'interface de séance.
- [x] Conservation de ces métadonnées à travers la normalisation et les rechargements.
- [x] Séries d'échauffement exclues des records, du volume de travail et de la double progression.
- [x] Proposition de progression bloquée si RPE/RIR indique un effort trop élevé.
- [x] Pause/reprise du minuteur avec état conservé après rechargement.
- [x] Client Supabase facultatif intégré : Magic Link, synchronisation manuelle, auto-sync opt-in, gestion explicite des conflits et suppression de la sauvegarde cloud.
- [x] Cache PWA incrémenté à v23.
- [x] Tests Playwright étendus : reprise, pagehide, métadonnées, échauffement, pause/reprise et profil hors ligne.
- [x] Finition responsive de l'espace Séance : hiérarchie visuelle, onglets sticky, états actifs/focus, prise en compte de `prefers-reduced-motion` et libellés de boutons maintenus sur une seule ligne sur mobile.

## En cours / à faire

- [x] CI verte sur le commit `2852879fa7646d6be3e3c7708d3818e69f5be677` : préparation, médias CC0, Playwright mobile + desktop, navigation responsive, libellés de boutons et captures QA ; déploiement ignoré.
- [ ] Configurer le Site URL et Redirect URL dans Supabase Auth.
- [ ] Tester réellement Magic Link, premier envoi cloud et restauration.
- [ ] Tester les conflits avec deux appareils / deux sessions authentifiées.
- [ ] Connecter l'envoi et la gestion des photos au bucket privé.
- [ ] Améliorer les filtres et les fiches de la bibliothèque d'exercices.
- [ ] Vérifier et enrichir les médias 3D exercice par exercice.
- [ ] Étendre les analyses de progression, le volume musculaire et les périodes.
- [ ] Relier plus profondément le Coach Forge aux données réelles sans supprimer son moteur local.
- [ ] Améliorer les vues de suivi physique, calendrier, nutrition et trophées.
- [ ] Étendre les tests d'import/export, hors-ligne, service worker et mise à jour PWA.
- [ ] Faire une vérification visuelle manuelle Android et ordinateur.
- [ ] Fusionner puis publier uniquement après validation complète.

## Limites d'exécution rencontrées

- Le poste local connecté via Desktop Commander était hors ligne.
- Le navigateur cloud n'a pas pu démarrer : quota de crédits insuffisant.
- La configuration Site URL / Redirect URLs Supabase doit être faite dans le Dashboard.
- Aucun compte de test ni e-mail utilisateur n'a été créé ou utilisé.
- Aucune clé secrète ou service-role n'a été ajoutée au dépôt.

## Règle de reprise

Lire ce fichier avant toute reprise. Ne pas considérer les éléments non cochés comme terminés. Ne pas fusionner la PR avant les tests complets et la configuration Auth.
