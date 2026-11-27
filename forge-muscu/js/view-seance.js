/* Page Séance : regroupe les vues historiques sans dupliquer leurs fonctionnalités. */
(function (root) {
  'use strict';
  const FM = root.FM;
  if (!FM || !FM.vues || !FM.vues.programme || !FM.vues.exercices || !FM.vues.suivi) return;

  const h = FM.h;
  const vues = {
    programme: FM.vues.programme,
    exercices: FM.vues.exercices,
    suivi: FM.vues.suivi
  };
  const onglets = [
    ['programme', 'Programme'],
    ['exercices', 'Exercices'],
    ['suivi', 'Suivi']
  ];

  FM.vues.seanceHub = function (app, actif, sousOnglet) {
    const racine = h('div', { class: 'forge-seance-hub' });
    const entete = h('div', { class: 'forge-seance-heading' },
      h('p', { class: 'forge-seance-kicker' }, 'TON ESPACE D’ENTRAÎNEMENT'),
      h('h1', {}, 'Séance'),
      h('p', { class: 'discret' }, 'Programme, exercices et progression réunis au même endroit.')
    );
    const navigation = h('nav', {
      class: 'forge-seance-tabs',
      'aria-label': 'Rubriques de Séance'
    });

    onglets.forEach(([cle, titre]) => {
      const lien = h('a', {
        class: 'forge-seance-tab' + (actif === cle ? ' active' : ''),
        href: '#/' + cle,
        'aria-current': actif === cle ? 'page' : null
      }, titre);
      navigation.append(lien);
    });

    const contenu = vues[actif](app, sousOnglet || '');
    const panneau = h('section', { class: 'forge-seance-panel' }, contenu);
    racine.append(entete, navigation, panneau);
    return racine;
  };
})(typeof window !== 'undefined' ? window : globalThis);
