# Forge Muscu — suivi de la refonte

Dernière mise à jour : 27 novembre 2026 — contrôle après CI

## État général

Refonte en cours. L'application de production sur `main` n'a pas été modifiée ni redéployée. Les travaux sont isolés dans une PR brouillon.

## Sauvegarde et branches

- Branche de référence : `main`
- Commit de référence : `9ba36389d6e6e21e302bfcd88f659f592a286c30`
- Branche de sauvegarde : `backup/pre-forge-premium-2026-11-27`
- Branche de travail : `forge-premium-upgrade`
- PR de travail : https://github.com/Nazumacky-0312/Forge-muscu/pull/2
- Dernier commit de travail validé par CI avant cette mise à jour documentaire : `d6d2259cc9b9e020129056a72fea9ef25a714cf5`

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
- [x] Première couche de refonte visuelle globale : palette sombre premium, accent vert Forge, fonds et cartes en profondeur, typographie et boutons harmonisés, formulaires, navigation flottante mobile / intégrée desktop ; feuille dédiée chargée après les styles existants et incluse au cache hors ligne (v24).
- [x] Finition responsive de l'espace Séance : hiérarchie visuelle, onglets sticky, états actifs/focus, prise en compte de `prefers-reduced-motion` et boutons Modifier maintenus sur une seule ligne et actions Nouvelle séance / Régénérer sans chevauchement sur mobile.
- [x] Deuxième passe visuelle transversale : cartes et lignes de bibliothèque, tableaux, dialogues, formulaires, états désactivés, zones tactiles et prise en compte globale de la réduction des animations.
- [x] Correction du fallback des illustrations 3D dans les petites vignettes : le texte long ne déborde plus et laisse un repère compact « 3D » ; cache PWA incrémenté à v26.

## En cours / à faire

- [x] Validation CI de `premium.css` sur mobile et desktop : run `45942696341`, build et test Playwright réussis ; déploiement volontairement ignoré.
- [x] CI verte sur le commit `d6d2259cc9b9e020129056a72fea9ef25a714cf5` (run `45941941328`) : préparation, médias CC0, Playwright mobile + desktop, navigation responsive, bouton Modifier, absence de chevauchement des actions et captures QA ; déploiement ignoré.
- [ ] Configurer le Site URL et Redirect URL dans Supabase Auth.
- [ ] Tester réellement Magic Link, premier envoi cloud et restauration.
- [ ] Tester les conflits avec deux appareils / deux sessions authentifiées.
- [ ] Connecter l'envoi et la gestion des photos au bucket privé.
- [ ] Poursuivre la refonte visuelle écran par écran (Accueil, bibliothèque, Coach, suivi, rangs, profil) ; le thème global est posé mais les contrôles visuels détaillés de chaque écran restent à faire.
- [ ] Améliorer les filtres et les fiches de la bibliothèque d'exercices.
- [ ] Vérifier et enrichir les médias 3D exercice par exercice.
- [ ] Étendre les analyses de progression, le volume musculaire et les périodes.
- [ ] Relier plus profondément le Coach Forge aux données réelles sans supprimer son moteur local.
- [ ] Améliorer les vues de suivi physique, calendrier, nutrition et trophées.
- [ ] Étendre les tests d'import/export, hors-ligne, service worker et mise à jour PWA.
- [x] Rejouer la CI après les derniers changements : run 45944514105, tests Playwright mobile/desktop réussis, prévisualisation intégrée à l'artefact Pages construite avec succès. Déploiement Pages volontairement réservé à main.
- [ ] Rendre la prévisualisation accessible en URL publique indépendante (l'artefact de build seul n'est pas une URL de site).
- [ ] Faire une vérification visuelle manuelle Android et ordinateur.
- [ ] Fusionner puis publier uniquement après validation complète.

## Prévisualisation isolée en préparation

- Workflow ajusté pour les PR : reconstruire le site racine depuis `main`, puis placer la version de la branche sous `/preview/`.
- Objectif : permettre de voir la refonte dans Chrome sans remplacer le contenu de production à la racine.
- Le changement de workflow est enregistré dans le commit `0eb40c02db5a306b4999f1be90fde800f3de4c07`.
- **Non validé à ce stade** : le connecteur GitHub n'a pas déclenché de nouvelle exécution Actions après ce commit. Ne pas considérer le lien de prévisualisation comme disponible avant un run réussi et un contrôle HTTP réel.

## Dernière vérification CI

- Run `45942696341` sur le commit `5a0504330e299a65d9ca46510ac0fcf1f846c34b` : job `build` réussi, préparation du site, médias CC0, tests Playwright mobile/desktop et artefacts QA générés ; job `deploy` ignoré car la branche n'est pas `main`.
- La PR #2 est toujours ouverte, brouillon et mergeable. Aucun déploiement de production n'a été déclenché.

## Limites d'exécution rencontrées

- Le poste local connecté via Desktop Commander était hors ligne.
- Le navigateur cloud n'a pas pu démarrer : quota de crédits insuffisant.
- La configuration Site URL / Redirect URLs Supabase doit être faite dans le Dashboard.
- Aucun compte de test ni e-mail utilisateur n'a été créé ou utilisé.
- Aucune clé secrète ou service-role n'a été ajoutée au dépôt.

## Règle de reprise

Lire ce fichier avant toute reprise. Ne pas considérer les éléments non cochés comme terminés. Ne pas fusionner la PR avant les tests complets et la configuration Auth.


---

## Mise à jour du 27 novembre 2026 — reprise effective

Les sections historiques ci-dessus décrivent un état antérieur. L'état vérifié aujourd'hui est le suivant.

### État du code de référence

- La branche `main` contient déjà le tableau de bord, les modules de séance, le suivi, le coach, la nutrition, la synchronisation cloud et les rangs de base.
- Les branches historiques `forge-home-dashboard` et `forge-premium-upgrade` contiennent plusieurs fichiers déjà identiques à `main`. La branche `forge-intuitive-workout-ranks` contient une ancienne version de certains modules : ne pas la fusionner telle quelle.
- Le travail nouveau est isolé sur `forge-avatar-3d-integration`, PR #5. Ne pas confondre une prévisualisation de PR avec la production.

### Modifications de la branche PR #5

- Body Forge : modèles anatomiques 3D masculin/féminin, rotation, vues avant/arrière, sélection des groupes musculaires, rang et performances disponibles, bodygraph SVG de secours, crédits de licence.
- Photos de progression : galerie locale-first, compression, IndexedDB, téléchargement, suppression et synchronisation facultative vers le bucket privé Supabase.
- Progression : nouvelle destination principale regroupant rangs, Body Forge, statistiques/photos, records, historique, mensurations, récupération musculaire et nutrition.
- Récupération : estimation locale par groupe musculaire, séries validées, effort récent, volume 72 h / 7 jours et groupes peu sollicités ; les limites du modèle sont affichées.
- Séance : tempo par série, suivi gauche/droite/alterné, conservation après rechargement et calculateur de disques accessible pendant l'entraînement. Les types échauffement/dégressif, RPE/RIR et notes restent disponibles.
- PWA : cache v32 avec les nouveaux modules et feuilles de style.
- Supabase : table `forge_progress_photos` créée avec RLS ; migration appliquée en version `20261127121314`. Le bucket `forge-progress-photos` reste privé et limité au dossier de l'utilisateur.

### Validation

- Les suites Playwright Séance, Body Forge et Photos/Progression/Récupération ont réussi sur mobile et ordinateur.
- Séance vérifie aussi la conservation du tempo et du côté après rechargement, le sélecteur de type de série et le calculateur de barre.
- Photos vérifie l'ajout local, IndexedDB après rechargement, le mode hors ligne et la suppression.
- Dernière CI : run #318, succès complet ; prévisualisation de la branche construite et artefact Pages généré. Cela ne signifie pas que la version publique a été remplacée.

### Limites externes restantes

- La configuration Supabase Auth `Site URL` / `Redirect URLs` n'est pas modifiable via les actions Supabase disponibles. Valeur attendue par Forge : `https://nazumacky-0312.github.io/Forge-muscu/`.
- La synchronisation réelle des photos entre deux comptes/appareils n'a pas été testée avec un compte utilisateur authentifié.
- Les enchaînements Superset/Circuit avec alternance automatique des séries, le glisser-déposer des exercices, les classements entre amis et Health Connect restent à développer.
- Les favoris alimentaires dédiés ne sont pas encore ajoutés ; la recherche Open Food Facts et le scanner quand BarcodeDetector est disponible existent déjà.
- L'advisor Supabase signale que la protection contre les mots de passe compromis est désactivée. À activer dans le Dashboard si l'authentification par mot de passe est utilisée.
- La vérification visuelle sur un vrai téléphone Android, la configuration Auth externe et la publication en production restent à effectuer après validation finale.

### Règle de reprise

Continuer depuis la branche `forge-avatar-3d-integration`. Ne pas fusionner les anciennes branches PR #2, #3 ou #4 sans nouvelle comparaison. Ne pas annoncer la publication tant que le déploiement `main` et le site public n'ont pas été vérifiés.
