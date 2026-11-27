/* Démarrage, navigation, barre de repos, installation et hors ligne. */
(function (root) {
  'use strict';
  const FM = root.FM, h = FM.h;
  const app = FM.app = { etat: null, invite: null, horsLigne: false };
  let routeCourante = '';

  app.sauver = () => FM.store.sauver(app.etat);

  app.rendre = function () {
    const [nom, ...reste] = location.hash.replace(/^#\//, '').split('/');
    const vue = Object.prototype.hasOwnProperty.call(FM.vues, nom) ? nom : 'accueil';
    const main = document.getElementById('vue');
    const meme = routeCourante === location.hash;
    const y = window.scrollY;
    if (vue !== 'profil') FM.oublierBrouillonProfil();
    /* Programme, Exercices et Suivi sont trois onglets d'une même page.
       Les anciennes URL restent valides pour les liens internes et les favoris. */
    const sectionSeance = ['programme', 'exercices', 'suivi'].includes(vue);
    const contenu = sectionSeance
      ? FM.vues.seanceHub(app, vue, reste.join('/'))
      : FM.vues[vue](app, reste.join('/'));
    main.replaceChildren(contenu);

    /* Une séance active reste accessible depuis toutes les rubriques. */
    if (app.etat && app.etat.active && vue !== 'seance') {
      const reprise = document.createElement('section');
      reprise.className = 'forge-resume-banner';
      reprise.setAttribute('aria-label', 'Séance en cours');
      const texte = document.createElement('div');
      const titre = document.createElement('strong');
      titre.textContent = 'Séance en cours';
      const detail = document.createElement('span');
      detail.textContent = app.etat.active.nom || 'Reprendre là où tu en étais';
      texte.append(titre, detail);
      const bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.className = 'btn primaire';
      bouton.textContent = 'Reprendre';
      bouton.addEventListener('click', () => app.aller('#/seance'));
      reprise.append(texte, bouton);
      main.prepend(reprise);
    }

    routeCourante = location.hash;
    window.scrollTo(0, meme ? y : 0);
    const onglet = { programme: 'programme', exercices: 'programme', suivi: 'programme', exercice: 'programme', detail: 'programme', bilan: 'programme', seance: 'accueil' }[vue] || vue;
    document.querySelectorAll('#menu a').forEach(a => {
      if (a.dataset.vue === onglet) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    if (vue !== 'seance') FM.ecran(false);
    app.rafraichirRepos();
  };

  app.aller = function (hash) { if (location.hash === hash) app.rendre(); else location.hash = hash; };

  app.demarrerSeance = function (jour) {
    if (!app.etat.active) { app.etat.active = FM.nouvelleSeance(app.etat, jour); app.sauver(); }
    app.aller('#/seance');
  };

  app.exporter = function () {
    app.etat.dernierExport = Date.now();
    app.sauver();
    FM.telecharger(`forge-muscu-${FM.cleJour(Date.now())}.json`, FM.store.exporter(app.etat));
    FM.toast('Sauvegarde téléchargée.');
  };

  app.installer = async function () {
    const i = app.invite;
    if (!i) return;
    app.invite = null;
    i.prompt();
    await i.userChoice;
    app.rendre();
  };

  /* La barre de repos reste affichée sur tous les écrans. */
  app.rafraichirRepos = function () {
    const barre = document.getElementById('repos');
    const r = app.etat && app.etat.repos;
    barre.hidden = !r;
    document.body.classList.toggle('avec-repos', !!r);
    if (!r) return;
    const s = (r.fin - Date.now()) / 1000;
    const fini = s <= 0;
    barre.classList.toggle('fini', fini);
    barre.querySelector('.temps').textContent = fini ? '+' + FM.mmss(-s) : FM.mmss(Math.ceil(s));
    barre.querySelector('.titre').textContent = fini ? 'Repos terminé' : 'Repos';
    barre.querySelector('.libelle').textContent = r.libelle;
    barre.querySelector('progress').value = fini ? 1 : 1 - s / r.total;
    barre.querySelector('[data-a=moins]').hidden = fini;
    barre.querySelector('[data-a=passer]').textContent = fini ? 'OK' : 'Passer';
    /* Après un rechargement, le navigateur exige un appui avant de rejouer un son. */
    barre.querySelector('[data-a=son]').hidden = fini || !app.etat.reglages.son || !['aucun', 'bloque'].includes(FM.timer.mode);
  };

  function demarrer() {
    app.etat = FM.store.charger();
    FM.store.avertir = FM.toast;
    FM.timer.init(app);
    const barre = document.getElementById('repos');
    const actions = { moins: () => FM.timer.ajuster(-15), plus: () => FM.timer.ajuster(15), passer: () => FM.timer.arreter(), son: () => { FM.timer.armer(); app.rafraichirRepos(); } };
    barre.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', actions[b.dataset.a]));
    window.addEventListener('hashchange', () => { document.querySelectorAll('dialog').forEach(d => d.remove()); app.rendre(); });

    /* Dernière chance de sauvegarde avant fermeture, veille ou changement d'application. */
    const sauvegarderAvantSortie = () => {
      if (!app.etat) return;
      try { app.sauver(); }
      catch (error) { console.error('Forge : sauvegarde de sécurité impossible', error); }
    };
    window.addEventListener('pagehide', sauvegarderAvantSortie);
    window.addEventListener('beforeunload', sauvegarderAvantSortie);

    /* Autre onglet ouvert : ne jamais remplacer en mémoire une séance en cours. */
    window.addEventListener('storage', ev => {
      if (ev.key !== FM.store.CLE) return;
      if (app.etat && app.etat.active) {
        FM.toast('Une autre fenêtre a modifié Forge. Ta séance en cours est conservée ici.');
        return;
      }
      app.etat = FM.store.charger();
      app.rendre();
    });
    window.addEventListener('beforeinstallprompt', ev => { ev.preventDefault(); app.invite = ev; if (location.hash === '#/profil') app.rendre(); });
    window.addEventListener('appinstalled', () => { app.invite = null; FM.toast('Application installée.'); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) sauvegarderAvantSortie();
      else if (app.etat.active && location.hash === '#/seance') FM.ecran(app.etat.reglages.ecranAllume);
    });
    app.rendre();
    app.sauver();
    if (FM.store.erreur) FM.modale('Attention', h('p', {}, FM.store.erreur));
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    horsLigne();
  }

  function horsLigne() {
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
    const dejaControlee = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').then(reg => {
      const proposer = () => {
        if (!reg.waiting || !navigator.serviceWorker.controller) return;
        const b = document.getElementById('maj');
        b.hidden = false;
        b.onclick = () => reg.waiting && reg.waiting.postMessage('activer');
      };
      proposer();
      reg.addEventListener('updatefound', () => { const w = reg.installing; if (w) w.addEventListener('statechange', proposer); });
    }).catch(() => {});
    navigator.serviceWorker.ready.then(() => { app.horsLigne = true; if (location.hash === '#/profil') app.rendre(); });
    let recharge = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (dejaControlee && !recharge) {
        recharge = true;
        /* Flush avant le rechargement provoqué par une mise à jour PWA. */
        try { app.sauver(); } catch (error) { console.error('Forge : sauvegarde avant mise à jour impossible', error); }
        location.reload();
      }
    });
  }

  demarrer();
})(window);
