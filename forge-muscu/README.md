# Forge Muscu — édition Liftoff

Application web progressive (PWA) en français pour Android, Windows et navigateur. Le fonctionnement local reste disponible sans compte et sans connexion ; exporter régulièrement une sauvegarde JSON depuis Profil > Mes données.

## Application

- Production actuelle : https://nazumacky-0312.github.io/Forge-muscu/
- Dépôt : https://github.com/Nazumacky-0312/Forge-muscu
- Branche de travail refonte : `forge-premium-upgrade`
- PR de travail : https://github.com/Nazumacky-0312/Forge-muscu/pull/2

## Android

1. Ouvrir https://nazumacky-0312.github.io/Forge-muscu/ dans Chrome.
2. Menu ⋮ puis « Installer l'application » ou « Ajouter à l'écran d'accueil ».
3. Lancer Forge Muscu depuis l'écran d'accueil. Après le premier chargement, les écrans principaux restent disponibles hors ligne.

## Windows

- En ligne : ouvrir le même lien dans Chrome ou Edge, puis menu > « Installer Forge Muscu » / « Installer cette page en tant qu'application ».
- En local : installer Python 3, extraire le dossier, puis double-cliquer sur demarrer-pc.bat. Le navigateur s'ouvre sur http://localhost:8000. Garder la fenêtre noire ouverte pendant l'utilisation.

## Fonctions existantes et améliorations de la branche

- Programmes et séances guidées, séries, répétitions, charges, minuteur de repos et progression double.
- Rappel permanent pour reprendre une séance active depuis les autres rubriques.
- Sauvegarde de sécurité sur fermeture, arrière-plan et mise à jour PWA.
- Types de séries : travail, échauffement, dégressive, échec, temps sous tension et distance.
- Champs RPE/RIR et note par exercice, conservés dans les sauvegardes JSON.
- Séries d'échauffement exclues du volume de travail, des records et des propositions de progression.
- Le coach de progression évite de proposer une hausse de charge quand les indicateurs RPE/RIR montrent un effort excessif.
- Minuteur de repos avec pause/reprise et conservation de l'état après rechargement.
- Historique, records personnels, graphiques et export CSV.
- Rangs et XP Forge, défis hebdomadaires, série de jours actifs.
- Cycle d'entraînement progressif sur quatre semaines.
- Bodygraph schématique, suivi de 17 mensurations, journal nutritionnel et objectifs de macronutriments.
- Sauvegarde/import JSON et fonctionnement hors ligne via service worker.
- Coach Forge local, sans clé API obligatoire.
- Illustrations d'exercices intégrées sous forme de ressources WebP.
- Sauvegarde cloud Supabase facultative par lien e-mail, synchronisation manuelle ou automatique opt-in, gestion explicite des conflits et suppression de la sauvegarde cloud.

Les améliorations de cette branche ne sont pas encore déployées sur le site public. Le détail des tests et limites figure dans [PROGRESS.md](PROGRESS.md) et [TESTS.md](TESTS.md).

## Architecture de publication

Le workflow GitHub Pages extrait `forge-muscu.zip`, puis superpose le dossier `forge-muscu/`. L'archive est donc encore une source de référence importante. Ne pas la supprimer ou remplacer le mécanisme de déploiement avant d'avoir migré et testé l'intégralité des modules.

## Supabase

Le projet Supabase Forge Muscu existe en région Paris (`eu-west-3`). Deux migrations créent :
- un état JSON versionné par utilisateur ;
- un historique de révisions ;
- une RPC d'enregistrement avec contrôle optimiste de concurrence ;
- des politiques RLS par utilisateur ;
- un bucket privé pour les photos de progression.

Le client cloud est dans `js/cloud-sync.js`. Il utilise uniquement une clé publishable prévue pour le navigateur, jamais une clé `secret` ou `service_role`. L'authentification se fait par lien magique envoyé par e-mail. Il faut encore autoriser l'URL de GitHub Pages dans Supabase > Authentication > URL Configuration ; voir [SUPABASE_SETUP.md](SUPABASE_SETUP.md).

Le stockage photo privé est créé, mais l'interface d'envoi des photos n'est pas encore intégrée. Le cloud ne remplace jamais le stockage local.

## Documentation de développement

- [PROGRESS.md](PROGRESS.md) — état du travail et tâches restantes.
- [CHANGELOG.md](CHANGELOG.md) — modifications par date.
- [TESTS.md](TESTS.md) — couverture et résultats de tests.
- [SUPABASE_SETUP.md](SUPABASE_SETUP.md) — schéma, sécurité et configuration cloud.

## Limites

Les rangs Forge et les XP sont des indicateurs personnels, pas des classements officiels Liftoff ni des normes de force. Le bodygraph ne mesure pas la masse musculaire. La nutrition est saisie manuellement et les valeurs Open Food Facts doivent être vérifiées. Les classements mondiaux, amis, widgets natifs et Apple Watch nécessitent une infrastructure ou des API externes et ne sont pas simulés.

## Illustrations des exercices

Les images de démonstration intégrées dans `images/exercises/` proviennent du projet [Open Exercise Illustrations](https://github.com/hitmanrepo/open-exercise-illustrations), diffusé sous licence CC0 1.0. Elles sont fournies à titre indicatif : les détails de certains équipements ou trajectoires peuvent être imparfaits. Vérifie toujours la technique d'un mouvement avec une source qualifiée.
