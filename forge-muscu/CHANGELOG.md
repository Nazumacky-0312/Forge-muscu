# Changelog Forge Muscu

## 27 novembre 2026 — Préparation de la refonte premium

- Création d'une branche de sauvegarde avant modification.
- Création de la branche de travail `forge-premium-upgrade`.
- Audit de l'architecture PWA, du déploiement Pages, des modules visibles et du test Playwright existant.
- Ajout du schéma cloud local-first Supabase : état JSON versionné par utilisateur, historique des révisions, contrôle de concurrence optimiste et bucket privé pour les photos de progression.
- Activation de RLS et de politiques d'accès par utilisateur sur les tables cloud et le stockage photo.
- Conservation du mode local comme mode de fonctionnement principal ; l'interface applicative n'est pas encore connectée au cloud.
