# Changelog Forge Muscu

## 27 novembre 2026 — Préparation de la refonte premium

- Création d'une branche de sauvegarde avant modification.
- Création de la branche de travail `forge-premium-upgrade` et de la PR brouillon #2.
- Audit de l'architecture PWA, du déploiement Pages, des modules visibles et du test Playwright existant.
- Ajout du schéma cloud local-first Supabase : état JSON versionné, historique des révisions, contrôle de concurrence optimiste et bucket privé pour les photos.
- Activation de RLS et de politiques d'accès par utilisateur sur les tables cloud et le stockage photo.
- Ajout d'un bandeau persistant pour reprendre une séance active depuis les autres rubriques.
- Ajout de sauvegardes de sécurité à la fermeture, à la mise en arrière-plan et avant le rechargement lié à une mise à jour PWA.
- Prévention du remplacement de l'état mémoire d'une séance active par un événement de stockage inter-onglets.
- Incrément du cache PWA de v19 à v20.
- Extension du test Playwright pour couvrir le rappel de reprise et la sauvegarde pagehide.
- Ajout d'un déclenchement CI sur la branche de travail et les pull requests, avec déploiement limité à main.
- Documentation de l'audit, de l'avancement, des tests et de la configuration Supabase.

La synchronisation cloud n'est pas encore intégrée à l'interface. Le fonctionnement local reste prioritaire.
