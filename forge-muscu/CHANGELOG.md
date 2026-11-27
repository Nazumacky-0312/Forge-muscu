# Changelog Forge Muscu

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
