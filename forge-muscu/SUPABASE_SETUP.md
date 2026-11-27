# Supabase — Forge Muscu

## Projet existant

- Projet : Forge Muscu
- Région : `eu-west-3` (Paris)
- Référence : `xqvmfdvzgywinddxkbdl`
- État observé : `ACTIVE_HEALTHY`

La base publique ne contenait aucune table ni migration lors de l'audit du 27 novembre 2026.

## Migrations appliquées

Fichiers source :
- `supabase/migrations/202611270001_forge_cloud_sync.sql`
- `supabase/migrations/202611270002_forge_user_data_delete.sql`

Migrations enregistrées dans Supabase :
- `forge_cloud_sync_v1`
- `forge_user_data_delete`

Tables :
- `public.forge_user_state` : dernière version du JSON de données Forge par utilisateur, avec numéro de révision et version de schéma.
- `public.forge_sync_revisions` : historique append-only des versions envoyées.

RPC :
- `public.save_forge_state(p_expected_revision, p_schema_version, p_payload, p_device_id)` : enregistrement atomique avec contrôle de révision. Si la révision distante n'est pas celle attendue, la fonction renvoie un conflit SQLSTATE `40001` au lieu d'écraser silencieusement les données.

Stockage :
- Bucket privé `forge-progress-photos`.
- Taille maximale : 15 Mo par fichier.
- Types autorisés : JPEG, PNG et WebP.
- Les chemins doivent commencer par l'UUID de l'utilisateur : `<auth.uid()>/nom-fichier.webp`.

Sécurité :
- RLS activé sur les deux tables.
- Policies SELECT / INSERT / UPDATE / DELETE limitées à `auth.uid() = user_id`.
- Bucket privé avec policies SELECT / INSERT / UPDATE / DELETE limitées au dossier de l'utilisateur.
- Aucun secret ou `service_role` dans le client.

## Client cloud intégré dans la branche de travail

Le module `js/cloud-sync.js` est chargé à la demande depuis Profil, uniquement quand le navigateur est en ligne. Il charge `supabase-js` depuis jsDelivr et utilise :
- l'URL du projet ;
- la clé publishable Supabase `sb_publishable_...`, conçue pour être utilisée dans un navigateur et protégée par les politiques RLS ;
- l'authentification e-mail par Magic Link ;
- la RPC `save_forge_state` pour enregistrer l'état complet de Forge ;
- un numéro de révision local par utilisateur pour détecter les conflits.

Le premier envoi est explicite. La synchronisation automatique est facultative et doit être activée après une première synchronisation réussie. En cas de conflit, l'application propose de restaurer le cloud ou de remplacer le cloud par les données locales ; aucun écrasement silencieux n'est effectué.

Le mode local reste utilisable sans compte, sans clé supplémentaire et hors connexion. Le client cloud n'est pas nécessaire au démarrage de l'application.

## Action manuelle indispensable dans Supabase

Le connecteur disponible ne permet pas de modifier la configuration URL de Supabase Auth. Il faut donc effectuer une seule configuration dans le Dashboard :

1. Ouvrir Supabase > Authentication > URL Configuration.
2. Définir le **Site URL** sur :
   `https://nazumacky-0312.github.io/Forge-muscu/`
3. Ajouter exactement cette URL dans **Redirect URLs** :
   `https://nazumacky-0312.github.io/Forge-muscu/`
4. Dans Authentication > Providers, vérifier que le fournisseur Email est activé. Les Magic Links e-mail sont activés par défaut sur un projet Supabase standard.
5. Enregistrer.

Ensuite, dans Forge, ouvrir Profil > Sauvegarde cloud, activer le service, saisir l'adresse e-mail, ouvrir le lien reçu sur le même appareil, puis choisir « Synchroniser maintenant ». L'activation de la sauvegarde automatique reste facultative.

## Contrat de synchronisation

- Forge reste utilisable sans compte et sans réseau.
- Le stockage local reste la source de travail pendant une séance.
- Une synchronisation ne se lance qu'après authentification explicite.
- Au premier envoi, utiliser `p_expected_revision = 0`.
- Aux envois suivants, fournir exactement la dernière révision confirmée.
- En cas de conflit, télécharger l'état distant et proposer une résolution explicite.
- Les suppressions cloud ne suppriment pas les données locales de l'appareil.
- Les payloads doivent être migrés par `schema_version` avant d'être utilisés par une version plus récente.

## Photos de progression

Le bucket privé est créé et protégé par RLS. L'interface d'envoi, de liste et de suppression des photos n'est pas encore reliée au bucket. Ne pas considérer la sauvegarde des photos comme opérationnelle.

## Vérification effectuée

Après application :
- les deux tables existent ;
- RLS est activé ;
- la RPC existe ;
- le bucket privé existe ;
- les politiques DELETE propres à l'utilisateur existent ;
- les advisors de sécurité ne signalent aucun problème ;
- l'advisor performance signale uniquement l'index récent non encore utilisé, ce qui est normal tant qu'aucune donnée de synchronisation n'a été écrite.

La connexion réelle par e-mail et la synchronisation entre deux appareils restent à tester avec un compte utilisateur après configuration de l'URL de redirection.
