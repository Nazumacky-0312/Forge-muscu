/* Sauvegarde cloud facultative et locale-first via Supabase Auth + RPC.
   La clé publishable est destinée au navigateur ; aucune clé service_role n'est utilisée. */
(function (root) {
  'use strict';
  const FM = root.FM;
  if (!FM || !FM.vues || !FM.vues.profil) return;

  const CONFIG = {
    url: 'https://xqvmfdvzgywinddxkbdl.supabase.co',
    publishableKey: 'sb_publishable_tHLViJ0JO41Phe24lPCL_g_XepTcbeQ'
  };
  const state = {
    client: null, loading: false, error: '', user: null, remote: null,
    message: 'Tes données restent enregistrées localement. Le cloud est facultatif.',
    busy: false, auto: false, timer: null
  };
  const revisionKey = userId => 'forge-muscu:cloud-revision:' + userId;
  const autoKey = userId => 'forge-muscu:cloud-auto:' + userId;
  const safeGet = key => { try { return root.localStorage.getItem(key); } catch (_) { return null; } };
  const safeSet = (key, value) => { try { root.localStorage.setItem(key, value); return true; } catch (_) { return false; } };
  const safeRemove = key => { try { root.localStorage.removeItem(key); } catch (_) { /* stockage local indisponible */ } };
  const getRevision = () => {
    if (!state.user) return null;
    const value = safeGet(revisionKey(state.user.id));
    return value === null ? null : Number(value);
  };
  const setRevision = value => { if (state.user) safeSet(revisionKey(state.user.id), String(value)); };
  const autoEnabled = () => !!(state.user && safeGet(autoKey(state.user.id)) === '1');
  const setAuto = value => {
    state.auto = !!value;
    if (state.user) safeSet(autoKey(state.user.id), state.auto ? '1' : '0');
  };
  const element = (tag, cls, value) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (value !== undefined) node.textContent = value;
    return node;
  };
  const refresh = () => {
    const app = FM.app;
    if (app && location.hash.startsWith('#/profil')) app.rendre();
  };
  const deviceId = () => {
    let id = safeGet('forge-muscu:device-id');
    if (!id) {
      id = root.crypto && root.crypto.randomUUID ? root.crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
      safeSet('forge-muscu:device-id', id);
    }
    return id;
  };

  async function loadRemote() {
    if (!state.client || !state.user || !root.navigator.onLine) return null;
    const { data, error } = await state.client
      .from('forge_user_state')
      .select('schema_version,revision,payload,updated_at')
      .maybeSingle();
    if (error) throw error;
    state.remote = data ? {
      schemaVersion: data.schema_version,
      revision: Number(data.revision),
      payload: data.payload,
      updatedAt: data.updated_at
    } : null;
    const localRevision = getRevision();
    if (!state.remote && localRevision === null) state.message = 'Aucune sauvegarde cloud. Tu peux envoyer les données de cet appareil.';
    else if (state.remote && localRevision === state.remote.revision) state.message = 'Cloud synchronisé · révision ' + state.remote.revision + '.';
    else state.message = 'Conflit à résoudre : les données locales et cloud ne sont pas sur la même révision.';
    return state.remote;
  }

  async function initClient() {
    if (state.client || state.loading) return;
    if (!root.navigator.onLine) { state.message = 'Hors ligne : Forge continue de fonctionner localement. Le cloud sera disponible au retour du réseau.'; refresh(); return; }
    state.loading = true;
    state.message = 'Connexion au service de sauvegarde…';
    refresh();
    try {
      const module = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      state.client = module.createClient(CONFIG.url, CONFIG.publishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' }
      });
      state.client.auth.onAuthStateChange((event, session) => {
        if (event === 'INITIAL_SESSION') return;
        state.user = session && session.user ? session.user : null;
        state.remote = null;
        if (state.user) {
          state.auto = autoEnabled();
          Promise.resolve().then(async () => {
            try { await loadRemote(); if (autoEnabled()) scheduleAutoSync(); }
            catch (error) { state.message = 'Lecture cloud impossible : ' + error.message; }
            refresh();
          });
        } else {
          state.auto = false;
          state.message = 'Déconnecté. Tes données locales restent intactes.';
          refresh();
        }
      });
      const { data, error } = await state.client.auth.getSession();
      if (error) throw error;
      state.user = data.session ? data.session.user : null;
      state.auto = autoEnabled();
      if (state.user) { await loadRemote(); if (autoEnabled()) scheduleAutoSync(); }
      else state.message = 'Connecte-toi par lien envoyé par e-mail pour activer la sauvegarde cloud.';
      state.error = '';
    } catch (error) {
      state.error = error && error.message ? error.message : String(error);
      state.message = 'Service cloud indisponible. Le mode local reste opérationnel.';
    } finally {
      state.loading = false;
      refresh();
    }
  }

  async function sendMagicLink(email) {
    if (!state.client) throw new Error('Le service cloud n’est pas initialisé.');
    const { error } = await state.client.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: root.location.origin + root.location.pathname
      }
    });
    if (error) throw error;
    state.message = 'Lien de connexion envoyé. Ouvre l’e-mail sur cet appareil pour terminer la connexion.';
    refresh();
  }

  async function pushLocal(app, expectedRevision) {
    const payload = JSON.parse(JSON.stringify(app.etat));
    const { data, error } = await state.client.rpc('save_forge_state', {
      p_expected_revision: expectedRevision,
      p_schema_version: 1,
      p_payload: payload,
      p_device_id: deviceId()
    });
    if (error) {
      if (error.code === '40001') {
        await loadRemote();
        throw new Error('Conflit de synchronisation : rien n’a été écrasé. Choisis explicitement quelle version conserver.');
      }
      throw error;
    }
    const row = Array.isArray(data) ? data[0] : data;
    const revision = Number(row && row.saved_revision);
    if (!Number.isFinite(revision) || revision < 1) throw new Error('Réponse de sauvegarde cloud invalide.');
    setRevision(revision);
    state.remote = { schemaVersion: 1, revision, payload, updatedAt: row.saved_at };
    state.message = 'Sauvegarde cloud réussie · révision ' + revision + '.';
    return true;
  }

  async function syncNow(app, automatic) {
    if (!state.client || !state.user || state.busy) return false;
    if (!root.navigator.onLine) {
      state.message = 'Hors ligne : la sauvegarde cloud attend le retour du réseau.';
      if (automatic) refresh();
      return false;
    }
    state.busy = true;
    try {
      await loadRemote();
      const localRevision = getRevision();
      let expected;
      if (!state.remote && localRevision === null) expected = 0;
      else if (state.remote && localRevision !== null && localRevision === state.remote.revision) expected = localRevision;
      else {
        state.message = 'Conflit : restaure le cloud ou remplace-le explicitement par les données locales.';
        if (automatic) setAuto(false);
        return false;
      }
      await pushLocal(app, expected);
      state.auto = autoEnabled();
      return true;
    } catch (error) {
      state.message = error && error.message ? error.message : String(error);
      if (automatic) setAuto(false);
      return false;
    } finally {
      state.busy = false;
      refresh();
    }
  }

  async function overwriteCloud(app) {
    if (!state.client || !state.user) return;
    state.busy = true;
    try {
      await loadRemote();
      await pushLocal(app, state.remote ? state.remote.revision : 0);
    } catch (error) {
      state.message = error && error.message ? error.message : String(error);
    } finally {
      state.busy = false;
      refresh();
    }
  }

  function restoreCloud(app) {
    if (!state.remote) return;
    try {
      const restored = FM.normaliser(state.remote.payload);
      app.etat = restored;
      setRevision(state.remote.revision);
      const old = state.auto;
      setAuto(false);
      app.sauver();
      setAuto(old);
      state.message = 'Sauvegarde cloud restaurée sur cet appareil · révision ' + state.remote.revision + '.';
      app.rendre();
    } catch (error) {
      state.message = 'Restauration impossible : ' + error.message;
      refresh();
    }
  }

  async function deleteCloud(app) {
    if (!state.client || !state.user) return;
    state.busy = true;
    try {
      const history = await state.client.from('forge_sync_revisions').delete().eq('user_id', state.user.id);
      if (history.error) throw history.error;
      const current = await state.client.from('forge_user_state').delete().eq('user_id', state.user.id);
      if (current.error) throw current.error;
      state.remote = null;
      safeRemove(revisionKey(state.user.id));
      setAuto(false);
      state.message = 'Sauvegarde cloud supprimée. Les données de cet appareil n’ont pas été modifiées.';
    } catch (error) {
      state.message = 'Suppression cloud impossible : ' + error.message;
    } finally {
      state.busy = false;
      refresh();
    }
  }

  function scheduleAutoSync() {
    if (!state.user || !autoEnabled() || !state.client) return;
    if (state.timer) root.clearTimeout(state.timer);
    state.timer = root.setTimeout(() => {
      const app = FM.app;
      if (app) syncNow(app, true);
    }, 5000);
  }

  function installAutoSync() {
    const app = FM.app;
    if (!app || app.sauver.__forgeCloudWrapped) return;
    const saveOriginal = app.sauver;
    const wrapped = function () {
      const result = saveOriginal.call(this);
      if (result !== false) scheduleAutoSync();
      return result;
    };
    wrapped.__forgeCloudWrapped = true;
    app.sauver = wrapped;
  }

  function card(app) {
    const box = element('section', 'carte forge-cloud-card');
    box.append(element('h2', '', 'Sauvegarde cloud'));
    box.append(element('p', 'discret', 'Le stockage local reste prioritaire. Le cloud est une copie synchronisée facultative, protégée par ton compte.'));
    box.append(element('p', 'forge-cloud-status', state.message));
    if (state.error) box.append(element('p', 'alerte', state.error));
    if (!state.client) {
      const retry = element('button', 'btn geant', state.loading ? 'Connexion…' : 'Activer la sauvegarde cloud');
      retry.type = 'button';
      retry.disabled = state.loading;
      retry.addEventListener('click', () => initClient());
      box.append(retry);
      return box;
    }
    if (!state.user) {
      const label = element('label', 'forge-meta-field', 'Adresse e-mail');
      const email = element('input', 'forge-meta-input');
      email.type = 'email';
      email.autocomplete = 'email';
      email.placeholder = 'ton-adresse@email.fr';
      email.required = true;
      label.append(email);
      const send = element('button', 'btn primaire geant', 'Recevoir mon lien de connexion');
      send.type = 'button';
      send.addEventListener('click', async () => {
        if (!email.value.trim() || !email.checkValidity()) { email.reportValidity(); return; }
        send.disabled = true;
        try { await sendMagicLink(email.value.trim()); }
        catch (error) { state.message = 'Envoi impossible : ' + error.message; refresh(); }
        finally { send.disabled = false; }
      });
      box.append(label, send);
      return box;
    }

    box.append(element('p', '', 'Connecté : ' + (state.user.email || 'compte Supabase')));
    const conflict = (state.remote && getRevision() !== state.remote.revision) || (!state.remote && getRevision() !== null);
    if (conflict) {
      box.append(element('p', 'alerte', state.remote ? ('La version cloud (' + state.remote.revision + ') et la version locale (' + (getRevision() === null ? 'non synchronisée' : getRevision()) + ') diffèrent.') : 'La sauvegarde cloud est absente alors que cet appareil possède une ancienne révision locale. Tu peux créer une nouvelle sauvegarde cloud à partir de cet appareil.'));
      if (state.remote) {
        const restore = element('button', 'btn geant', 'Restaurer la version cloud');
        restore.type = 'button';
        restore.addEventListener('click', () => FM.confirmer('Restaurer la sauvegarde cloud ?', 'Les données locales de cet appareil seront remplacées par cette version. Elles ne seront pas supprimées du cloud.', 'Restaurer', () => restoreCloud(app), true));
        box.append(restore);
      }
      const replace = element('button', 'btn geant', state.remote ? 'Remplacer le cloud par cet appareil' : 'Créer une nouvelle sauvegarde cloud');
      replace.type = 'button';
      replace.addEventListener('click', () => FM.confirmer(state.remote ? 'Remplacer la sauvegarde cloud ?' : 'Créer une nouvelle sauvegarde cloud ?', 'Les données locales de cet appareil deviendront la nouvelle version cloud. Cette action est volontaire et sera enregistrée comme une nouvelle révision.', state.remote ? 'Remplacer le cloud' : 'Créer la sauvegarde', () => overwriteCloud(app), true));
      box.append(replace);
    } else {
      const sync = element('button', 'btn primaire geant', state.busy ? 'Synchronisation…' : 'Synchroniser maintenant');
      sync.type = 'button';
      sync.disabled = state.busy;
      sync.addEventListener('click', () => syncNow(app, false));
      box.append(sync);
    }

    const autoLabel = element('label', 'case forge-cloud-auto');
    const auto = element('input');
    auto.type = 'checkbox';
    auto.checked = autoEnabled();
    auto.disabled = state.busy || conflict;
    auto.addEventListener('change', async () => {
      if (!auto.checked) { setAuto(false); state.message = 'Sauvegarde automatique désactivée.'; refresh(); return; }
      const ok = await syncNow(app, false);
      if (ok) { setAuto(true); state.message = 'Sauvegarde automatique activée.'; scheduleAutoSync(); }
      else { setAuto(false); }
      refresh();
    });
    autoLabel.append(auto, document.createTextNode(' Sauvegarder automatiquement après les modifications'));
    box.append(autoLabel);

    const remove = element('button', 'btn danger geant', 'Supprimer ma sauvegarde cloud');
    remove.type = 'button';
    remove.addEventListener('click', () => FM.confirmer('Supprimer la sauvegarde cloud ?', 'Seules les données cloud de ce compte seront supprimées. Les données locales de cet appareil seront conservées.', 'Supprimer le cloud', () => deleteCloud(app), true));
    const logout = element('button', 'btn geant', 'Déconnecter ce compte');
    logout.type = 'button';
    logout.addEventListener('click', async () => {
      const { error } = await state.client.auth.signOut();
      if (error) { state.message = 'Déconnexion impossible : ' + error.message; refresh(); }
    });
    box.append(remove, logout);
    return box;
  }

  const profileOriginal = FM.vues.profil;
  FM.vues.profil = function (app) {
    const view = profileOriginal(app);
    view.append(card(app));
    if (!state.client && !state.loading && !state.error && root.navigator.onLine) Promise.resolve().then(() => initClient());
    return view;
  };

  root.addEventListener('online', () => {
    if (state.user && autoEnabled()) scheduleAutoSync();
    if (location.hash.startsWith('#/profil') && !state.client) initClient();
  });
  root.addEventListener('offline', () => {
    if (state.timer) root.clearTimeout(state.timer);
    state.message = 'Hors ligne : les données restent sur cet appareil. Synchronisation en attente.';
    refresh();
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installAutoSync, { once: true });
  else installAutoSync();
})(typeof window !== 'undefined' ? window : globalThis);
