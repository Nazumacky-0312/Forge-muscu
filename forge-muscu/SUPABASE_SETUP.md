# Supabase — Forge Muscu

## Projet existant

- Projet : Forge Muscu
- Région : `eu-west-3` (Paris)
- Référence : `xqvmfdvzgywinddxkbdl`
- État observé : `ACTIVE_HEALTHY`

Le projet existait déjà. Sa base publique ne contenait aucune table ni migration lors de l'audit du 27 novembre 2026.

## Migration appliquée

Fichier source : `supabase/migrations/202611270001_forge_cloud_sync.sql`

Migration appliquée : `forge_cloud_sync_v1`

Tables :
- `public.forge_user_state` : dernière version du JSON de données Forge par utilisateur, avec numéro de révision et version de schéma.
- `public.forge_sync_revisions` : historique append-only des versions envoyées.

RPC :
- `public.save_forge_state(expected_revision, schema_version, payload, device_id)` : enregistrement atomique avec contrôle de révision. Si la révision distante n'est pas celle attendue, la fonction renvoie un conflit SQLSTATE `40001` au lieu d'écraser silencieusement les données.

Stockage :
- Bucket privé `forge-progress-photos`.
- Taille maximale : 15 Mo par fichier.
- Types autorisés : JPEG, PNG et WebP.
- Les chemins doivent commencer par l'UUID de l'utilisateur : `<auth.uid()>/nom-fichier.webp`.

Sécurité :
- RLS activé sur les deux tables.
- Policies limitées à `auth.uid() = user_id`.
- Bucket privé avec policies SELECT / INSERT / UPDATE / DELETE limitées au dossier de l'utilisateur.
- Aucun service-role ou secret key dans le client.

## Configuration restante

1. Dans Supabase Dashboard > Authentication > URL Configuration, définir l'URL de production : `https://nazumacky-0312.github.io/Forge-muscu/`.
2. Ajouter cette même origine à la liste des redirect URLs autorisées, avec les chemins de retour nécessaires.
3. Choisir les fournisseurs de connexion souhaités (email / magic link) dans Authentication > Providers.
4. Récupérer l'URL du projet et la clé publishable dans Project Settings > API Keys.
5. Les injecter dans le client via une configuration publique dédiée. Une clé publishable est destinée au navigateur ; ne jamais y mettre la clé secret ou service_role.

## Contrat de synchronisation attendu

- Forge reste utilisable sans compte et sans réseau.
- Le stockage local reste la source de travail pendant une séance.
- Une synchronisation ne se lance qu'après authentification explicite.
- Au premier envoi, utiliser `p_expected_revision = 0`.
- Aux envois suivants, fournir exactement la dernière révision confirmée.
- En cas de conflit, télécharger l'état distant et proposer une résolution/une sauvegarde distincte ; ne jamais écraser silencieusement l'un des deux états.
- Conserver les photos dans le bucket privé ; ne jamais enregistrer des URL publiques pour des photos privées.
- Les payloads doivent être migrés par `schema_version` avant d'être utilisés par une version plus récente.

## Vérification effectuée

Après application :
- les deux tables existent ;
- RLS est activé ;
- la fonction RPC existe ;
- le bucket privé existe ;
- les advisors de sécurité ne signalent aucun problème ;
- l'advisor performance signale uniquement l'index récent non encore utilisé, ce qui est normal tant qu'aucune donnée de synchronisation n'a été écrite.

Le client JavaScript de l'application n'est pas encore relié à ce schéma. L'infrastructure de base est prête, mais la synchronisation multi-appareils n'est pas annoncée comme opérationnelle tant que l'authentification et le client ne sont pas intégrés et testés.
