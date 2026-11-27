# Changelog Forge Muscu

## 28 novembre 2026 — Enchaînements et édition rapide des programmes

- Ajout des supersets (deux exercices) et circuits (deux exercices ou plus) pendant une séance.
- Les séries alternent automatiquement entre les exercices du groupe ; l'état et l'ordre restent sauvegardés après rechargement.
- Ajout du glisser-déposer des exercices dans l'éditeur de programme, avec des contrôles de déplacement accessibles en complément.
- Ajout de la duplication d'une séance modèle pour construire un programme plus vite.
- Ajout de tests Playwright mobile et ordinateur pour vérifier ces parcours réels ; cache PWA incrémenté à v34.
- La validation de ces changements et leur publication restent en attente du résultat complet des contrôles.

## 27 novembre 2026 — Première tranche de la refonte premium

- Création d'une branche de sauvegarde et de la branche `forge-premium-upgrade`, avec PR brouillon #2.
- Audit de l'architecture PWA, du déploiement Pages, des modules et de la sauvegarde locale.
- Extraction de l'artefact CI pour inspecter les modules fournis dans l'archive ZIP.
- Ajout du schéma cloud local-first Supabase : état JSON versionné, historique des révisions, RPC avec contrôle optimiste, RLS et bucket privé photo.
- Ajout des politiques DELETE limitées à l'utilisateur pour permettre la suppression de ses propres données cloud.
- Ajout d'un bandeau persistant pour reprendre une séance active depuis les autres rubriques.
- Ajout de sauvegardes de sécurité à la fermeture, à la mise en arrière-plan et avant le rechargement PWA.
- Préservation de la séance active lors d'une mise à jour du stockage inter-onglets.
- Ajout des types de séries : travail, échauffement, dégressive, échec, temps sous tension et distance.
- Ajout des champs RPE/RIR et de la note par exercice, avec conservation dans les sauvegardes.
- Exclusion des séries d'échauffement des records, du volume de travail et des recommandations de double progression.
- Prise en compte d'un RPE élevé ou d'un RIR très faible pour éviter une hausse de charge inadaptée.
- Ajout de la pause/reprise du minuteur et de la persistance de son état.
- Ajout du client cloud facultatif : Magic Link, synchronisation manuelle, auto-sync activable, gestion explicite des conflits et suppression de la sauvegarde cloud.
- Ajout des tests Playwright correspondants et incrément du cache PWA jusqu'à v22.

La branche reste en brouillon. La connexion e-mail réelle, la synchronisation multi-appareils et l'envoi des photos doivent encore être validés.

## 27 novembre 2026 — Finition de l'espace Séance

- Amélioration de la hiérarchie visuelle de l'espace Séance et de son en-tête.
- Navigation Programme / Exercices / Suivi mise en évidence, sticky et adaptée aux petits écrans.
- États actif, survol et focus clavier clarifiés ; animations désactivées si l'utilisateur préfère réduire les mouvements.
- Ajout d'assertions Playwright sur la navigation responsive, l'onglet actif, les débordements horizontaux et les libellés de boutons sur une seule ligne.
- Inspection des captures Playwright : correction du retour à la ligne du bouton « Modifier » en mobile, sans forcer les autres boutons à déborder.
- Les actions « Nouvelle séance » et « Régénérer le programme » conservent leur espace et ne se chevauchent plus.
- Validation CI réussie sur mobile et desktop (runs `45941596067`, `45941761861` et `45941941328`, derniers commits `b0eed459`, `2852879f` et `d6d2259`).


## 27 novembre 2026 — Première couche du nouveau design Forge

- Ajout de `css/premium.css`, une feuille de style globale chargée après les styles existants pour harmoniser les couleurs, la profondeur des cartes, la typographie, les boutons, les formulaires et les composants de suivi.
- Palette sombre graphite avec accent vert Forge, fonds atmosphériques, cartes plus lisibles et navigation mobile flottante ; navigation desktop replacée dans le flux.
- Ajout de la feuille au précache PWA et incrément du cache de v23 à v24.
- Ajout d'une assertion Playwright vérifiant le chargement du thème, la couleur d'accent et le positionnement de la navigation sur mobile et desktop.
- Cette première couche constitue la base du relooking ; les ajustements visuels détaillés de chaque écran restent à faire après inspection des nouvelles captures.


## 27 novembre 2026 — Validation de la couche visuelle globale

- Confirmation du run CI `45942696341` : build du site, médias CC0, tests Playwright mobile (390×844) et desktop (1365×900) réussis.
- L'artefact Pages est construit et conservé pour QA ; le déploiement reste ignoré sur la branche de travail afin de protéger la production.
