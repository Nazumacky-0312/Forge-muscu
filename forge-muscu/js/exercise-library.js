/* Filtres pratiques et favoris locaux pour la bibliothèque d'exercices. */
(function (w) {
  'use strict';
  const FM = w.FM, h = FM.h, KEY = 'forge-exercise-favorites-v1';
  const state = { query: '', muscle: '', equipment: '', level: '', gear: false, favoritesOnly: false, sort: 'name', favorites: readFavorites() };
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  function readFavorites() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || '[]');
      return new Set(Array.isArray(value) ? value.filter(id => typeof id === 'string' && FM.EX && FM.EX[id]) : []);
    } catch (_) { return new Set(); }
  }

  function saveFavorites() {
    try { localStorage.setItem(KEY, JSON.stringify([...state.favorites])); }
    catch (_) { FM.toast('Impossible d’enregistrer les favoris sur cet appareil.'); }
  }

  function equipmentMatches(ex, value) {
    if (!value) return true;
    if (value === '__bodyweight__') return ex.equip.some(group => !group.length);
    return ex.equip.some(group => group.includes(value));
  }

  function activityByExercise(sessions) {
    const stats = new Map();
    (sessions || []).forEach(session => (session.exercices || []).forEach(entry => {
      const work = (entry.series || []).filter(set => set.fait && Number(set.reps) > 0 && set.type !== 'echauffement');
      if (!work.length) return;
      const stat = stats.get(entry.exId) || { sessions: 0, last: 0 };
      stat.sessions += 1;
      stat.last = Math.max(stat.last, Number(session.debut) || 0);
      stats.set(entry.exId, stat);
    }));
    return stats;
  }

  FM.vues.exercices = function (app) {
    const muscles = Object.entries(FM.MUSCLES);
    const equipment = Object.entries(FM.MATERIEL);
    const search = h('input', { type: 'search', placeholder: 'Rechercher un exercice', 'aria-label': 'Rechercher un exercice, muscle ou matériel', value: state.query });
    const muscle = h('select', { 'aria-label': 'Filtrer par groupe musculaire', value: state.muscle },
      h('option', { value: '' }, 'Tous les groupes'), ...muscles.map(([id, label]) => h('option', { value: id }, label)));
    const material = h('select', { 'aria-label': 'Filtrer par matériel', value: state.equipment },
      h('option', { value: '' }, 'Tout le matériel'), h('option', { value: '__bodyweight__' }, 'Poids du corps'),
      ...equipment.map(([id, label]) => h('option', { value: id }, label)));
    const level = h('select', { 'aria-label': 'Filtrer par niveau', value: state.level },
      h('option', { value: '' }, 'Tous les niveaux'), h('option', { value: '1' }, 'Débutant'), h('option', { value: '2' }, 'Intermédiaire'));
    const sort = h('select', { 'aria-label': 'Trier les exercices', value: state.sort },
      h('option', { value: 'name' }, 'Nom A à Z'), h('option', { value: 'recent' }, 'Récemment entraînés'), h('option', { value: 'often' }, 'Les plus entraînés'));
    const onlyGear = h('input', { type: 'checkbox', checked: state.gear, onchange: event => { state.gear = event.target.checked; render(); } });
    const gearLabel = h('label', { class: 'case forge-library-gear' }, onlyGear, 'Seulement avec mon matériel');
    const favoriteToggle = FM.btn('', () => { state.favoritesOnly = !state.favoritesOnly; render(); }, 'forge-library-favorite-filter');
    const reset = FM.btn('Effacer les filtres', () => {
      Object.assign(state, { query: '', muscle: '', equipment: '', level: '', gear: false, favoritesOnly: false, sort: 'name' });
      search.value = ''; muscle.value = ''; material.value = ''; level.value = ''; sort.value = 'name'; onlyGear.checked = false; render();
    }, 'petit');
    const count = h('p', { class: 'discret forge-library-count', 'aria-live': 'polite' });
    const list = h('div', { class: 'liste forge-library-list' });
    const activity = activityByExercise(app.etat.seances);

    function render() {
      favoriteToggle.textContent = `${state.favoritesOnly ? '★' : '☆'} Mes favoris (${state.favorites.size})`;
      favoriteToggle.setAttribute('aria-pressed', String(state.favoritesOnly));
      const q = normalize(state.query);
      let results = FM.EXERCICES.filter(ex => {
        const muscleIds = [...ex.muscles, ...ex.secondaires];
        const searchable = [ex.nom, ...muscleIds.map(id => FM.MUSCLES[id] || id), ...ex.equip.flat().map(id => FM.MATERIEL[id] || id), ...muscleIds, ...ex.equip.flat()].join(' ');
        return (!q || normalize(searchable).includes(q))
          && (!state.muscle || muscleIds.includes(state.muscle))
          && equipmentMatches(ex, state.equipment)
          && (!state.level || Number(ex.niveau) === Number(state.level))
          && (!state.gear || FM.faisable(ex, app.etat.profil.materiel))
          && (!state.favoritesOnly || state.favorites.has(ex.id));
      });
      results.sort((a, b) => {
        if (state.sort === 'recent') return ((activity.get(b.id) || {}).last || 0) - ((activity.get(a.id) || {}).last || 0) || a.nom.localeCompare(b.nom, 'fr');
        if (state.sort === 'often') return ((activity.get(b.id) || {}).sessions || 0) - ((activity.get(a.id) || {}).sessions || 0) || a.nom.localeCompare(b.nom, 'fr');
        return a.nom.localeCompare(b.nom, 'fr');
      });
      count.textContent = `${results.length} exercice${results.length === 1 ? '' : 's'}${state.favoritesOnly ? ' favori' + (results.length === 1 ? '' : 's') : ''}`;
      list.replaceChildren(...results.map(ex => {
        const primary = ex.muscles.map(id => FM.MUSCLES[id] || id).join(', ');
        const secondary = ex.secondaires.length ? ' · secondaires : ' + ex.secondaires.map(id => FM.MUSCLES[id] || id).join(', ') : '';
        const practiced = activity.get(ex.id);
        const trained = practiced ? ` · ${practiced.sessions} séance${practiced.sessions === 1 ? '' : 's'}` : ' · jamais entraîné';
        const link = h('a', { class: 'ligne exercise-main', href: '#/exercice/' + ex.id },
          FM.animationExercice ? FM.animationExercice(ex, true) : null,
          h('span', { class: 'forge-library-copy' }, h('strong', {}, ex.nom),
            h('small', {}, primary + secondary + ' · ' + FM.materielRequis(ex) + trained)));
        const row = h('div', { class: 'exercise-row forge-library-row' }, link,
          FM.btn(state.favorites.has(ex.id) ? '★' : '☆', () => {
            if (state.favorites.has(ex.id)) state.favorites.delete(ex.id); else state.favorites.add(ex.id);
            saveFavorites(); render();
            const selector = '.forge-library-star[data-exercise-id="' + (w.CSS && w.CSS.escape ? w.CSS.escape(ex.id) : ex.id.replace(/[^a-zA-Z0-9_-]/g, '')) + '"]';
            (list.querySelector(selector) || favoriteToggle).focus();
          }, 'petit forge-library-star', { 'data-exercise-id': ex.id, 'aria-label': (state.favorites.has(ex.id) ? 'Retirer des favoris : ' : 'Ajouter aux favoris : ') + ex.nom, 'aria-pressed': String(state.favorites.has(ex.id)), title: 'Favori' }),
          FM.btn('Coach', () => FM.ouvrirCoach(ex, app), 'petit'));
        return row;
      }));
    }

    search.addEventListener('input', event => { state.query = event.target.value; render(); });
    muscle.addEventListener('change', event => { state.muscle = event.target.value; render(); });
    material.addEventListener('change', event => { state.equipment = event.target.value; render(); });
    level.addEventListener('change', event => { state.level = event.target.value; render(); });
    sort.addEventListener('change', event => { state.sort = event.target.value; render(); });
    render();

    return h('div', { class: 'forge-page forge-exercise-library' },
      h('div', { class: 'forge-exercises-heading' }, h('h1', {}, 'Exercices'),
        FM.btn('Coach Forge ↗', () => FM.ouvrirCoach(null, app), 'petit primaire')),
      h('section', { class: 'forge-library-filters', 'aria-label': 'Filtres de la bibliothèque' },
        h('label', { class: 'forge-library-search' }, h('span', {}, 'Recherche'), search),
        h('div', { class: 'forge-library-fields' },
          h('label', { class: 'forge-library-field' }, h('span', {}, 'Groupe musculaire'), muscle),
          h('label', { class: 'forge-library-field' }, h('span', {}, 'Matériel'), material),
          h('label', { class: 'forge-library-field' }, h('span', {}, 'Niveau'), level),
          h('label', { class: 'forge-library-field' }, h('span', {}, 'Ordre'), sort)),
        h('div', { class: 'forge-library-actions' }, gearLabel, favoriteToggle, reset),
        h('small', { class: 'forge-library-note' }, 'Les favoris restent enregistrés sur cet appareil.')),
      count, list);
  };
})(window);
