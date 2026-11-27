# Forge Muscu — suivi de la refonte

Dernière mise à jour : 27 novembre 2026

## État général

La refonte est en cours. Le dépôt a été audité en lecture et un point de retour arrière a été créé avant toute modification.

## Sauvegarde et branches

- Branche de référence : `main`
- Commit de référence : `9ba36389d6e6e21e302bfcd88f659f592a286c30`
- Branche de sauvegarde : `backup/pre-forge-premium-2026-11-27`
- Branche de travail : `forge-premium-upgrade`
- Premier commit de travail : `0278c084ed10370e4ab8b0f61fb3e57534b64460`

## Audit réalisé

- Application PWA JavaScript sans framework, avec modules chargés par scripts.
- La navigation principale est déclarée dans `index.html` : Accueil, Séance, Coach, Rangs.
- La page Séance regroupe Programme, Exercices et Suivi dans `js/view-seance.js`.
- Le dépôt contient une archive `forge-muscu.zip` et un dossier de surcharge `forge-muscu/`.
- Le workflow Pages extrait d'abord l'archive, puis superpose le dossier `forge-muscu/`. Il faut conserver cette chaîne tant qu'une migration complète de la source n'a pas été vérifiée.
- Le stockage de l'application est local ; le README conseille un export JSON manuel.
- Un service worker versionné gère le cache hors ligne.
- Le Coach Forge est implémenté localement et annonce explicitement ne pas nécessiter de clé API.
- Les illustrations sont des fichiers WebP locaux et une base `exercise-media.json` existe.
- Le test Playwright actuel couvre surtout la navigation Séance sur mobile et desktop.

## Terminé

- [x] Inspection du dépôt, de la branche principale, de la structure suivie et du workflow Pages.
- [x] Création d'une branche de sauvegarde et d'une branche de travail.
- [x] Vérification du projet Supabase existant : actif, région Paris, base publique initialement vide.
- [x] Première migration cloud locale-first créée et appliquée.
- [x] Vérification des tables, RLS, RPC, bucket privé et advisors Supabase.

## En cours / à faire

- [ ] Examiner la totalité du code source de l'archive de référence avant de modifier les modules centraux.
- [ ] Ajouter et tester la sauvegarde automatique et la reprise de séance sur tous les événements de cycle de vie.
- [ ] Améliorer l'éditeur de séries, RPE/RIR, douleur, notes et types de séries.
- [ ] Renforcer la bibliothèque et la correspondance des médias.
- [ ] Étendre les calculs de progression, records et volume musculaire.
- [ ] Relier le Coach Forge aux données réelles sans supprimer son moteur local.
- [ ] Ajouter les vues de suivi physique, calendrier et nutrition sans doublons.
- [ ] Implémenter l'authentification et le client de synchronisation Supabase dans l'application.
- [ ] Étendre les tests Playwright aux parcours de données et au hors-ligne.
- [ ] Vérifier le build et le déploiement Pages avant fusion dans main.

## Limites d'exécution rencontrées

- Le poste local connecté via Desktop Commander était hors ligne au moment de l'audit.
- Le navigateur cloud n'a pas pu démarrer : quota de crédits insuffisant.
- Le connecteur GitHub sait lire les fichiers texte suivis, mais l'archive ZIP binaire ne peut pas être extraite par ce connecteur. Les modules contenus uniquement dans l'archive doivent donc être récupérés dans un environnement de développement avant modification.
- Aucune clé secrète n'a été créée ni ajoutée au dépôt.

## Règle de reprise

Lire ce fichier avant toute reprise. Ne pas considérer les éléments non cochés comme terminés. Ne pas publier la branche de travail avant les tests de bout en bout.
