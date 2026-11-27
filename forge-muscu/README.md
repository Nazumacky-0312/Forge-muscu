# Forge Muscu — édition Liftoff

Application web progressive (PWA) en français pour Android, Windows et navigateur. Les données restent stockées localement sur l'appareil ; exporter régulièrement une sauvegarde JSON depuis Profil > Mes données.

## Android
1. Ouvrir https://nazumacky-0312.github.io/Forge-muscu/ dans Chrome.
2. Menu ⋮ puis « Installer l'application » ou « Ajouter à l'écran d'accueil ».
3. Lancer Forge Muscu depuis l'écran d'accueil. Après le premier chargement, les écrans principaux restent disponibles hors ligne.

## Windows
- En ligne : ouvrir le même lien dans Chrome ou Edge, puis menu > « Installer Forge Muscu » / « Installer cette page en tant qu'application ».
- En local : installer Python 3, extraire le dossier, puis double-cliquer sur demarrer-pc.bat. Le navigateur s'ouvre sur http://localhost:8000. Garder la fenêtre noire ouverte pendant l'utilisation.

## Fonctions
- Programmes et séances guidées, séries, répétitions, charges, minuteur de repos et progression double.
- Historique, records personnels, graphiques et export CSV.
- Rangs et XP Forge, défis hebdomadaires, série de jours actifs.
- Cycle d'entraînement progressif sur quatre semaines.
- Bodygraph schématique, suivi de 17 mensurations, journal nutritionnel et objectifs de macronutriments.
- Sauvegarde/import JSON et fonctionnement hors ligne via service worker.

## Limites
Les rangs Forge et les XP sont des indicateurs personnels, pas des classements officiels Liftoff ni des normes de force. Le bodygraph ne mesure pas la masse musculaire. La nutrition est saisie manuellement : aucun scan d'aliment, lecteur de code-barres ou catalogue connecté n'est intégré. Les classements mondiaux, amis, synchronisation multi-appareils, widgets natifs et Apple Watch nécessitent une infrastructure ou des API externes et ne sont pas simulés.