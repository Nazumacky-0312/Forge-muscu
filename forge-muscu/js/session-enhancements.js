/* Extensions de séance Forge : types de séries, RPE/RIR, notes et pause du repos.
   Compatible avec les sauvegardes v1 : les métadonnées sont optionnelles et conservées à l'import. */
(function (root) {
  'use strict';
  const FM = root.FM;
  if (!FM || !FM.normaliser || !FM.vues || !FM.timer) return;

  const TYPES = {
    travail: 'Travail',
    echauffement: 'Échauffement',
    degressive: 'Dégressive',
    echec: 'À l’échec',
    tension: 'Temps sous tension',
    distance: 'Distance'
  };
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const optionalNumber = (value, min, max, step) => {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    const rounded = step ? Math.round(n / step) * step : n;
    return Math.round(clamp(rounded, min, max) * 100) / 100;
  };

  /* La normalisation v1 d'origine reste la référence ; on restaure uniquement nos champs optionnels. */
  const normaliserOriginal = FM.normaliser;
  function conserverMetadonnees(destination, source) {
    if (!destination || !source || typeof source !== 'object') return destination;
    if (typeof source.note === 'string') destination.note = source.note.slice(0, 1000);
    const occurrences = Object.create(null);
    (destination.exercices || []).forEach((entry) => {
      const occurrence = occurrences[entry.exId] || 0;
      occurrences[entry.exId] = occurrence + 1;
      const candidates = (source.exercices || []).filter(x => x && x.exId === entry.exId);
      const original = candidates[occurrence];
      if (!original) return;
      if (typeof original.note === 'string') entry.note = original.note.slice(0, 500);
      entry.series.forEach((set, index) => {
        const old = (original.series || [])[index];
        if (!old || typeof old !== 'object') return;
        if (Object.prototype.hasOwnProperty.call(TYPES, old.type)) set.type = old.type;
        const rpe = optionalNumber(old.rpe, 5, 10, 0.5);
        const rir = optionalNumber(old.rir, 0, 5, 1);
        const distance = optionalNumber(old.distance, 0, 100000, 0.1);
        if (rpe !== null) set.rpe = rpe;
        if (rir !== null) set.rir = rir;
        if (distance !== null) set.distance = distance;
      });
    });
    return destination;
  }

  FM.normaliser = function (data) {
    const state = normaliserOriginal(data);
    if (!data || typeof data !== 'object') return state;
    if (data.active && state.active) conserverMetadonnees(state.active, data.active);
    const sources = new Map((Array.isArray(data.seances) ? data.seances : []).map(s => [s && s.id, s]));
    state.seances.forEach(s => conserverMetadonnees(s, sources.get(s.id)));
    if (state.repos && data.repos && data.repos.paused) {
      state.repos.paused = true;
      state.repos.remaining = optionalNumber(data.repos.remaining, 0, 900, 1) || 0;
    }
    return state;
  };

  /* Les séries d'échauffement ne gonflent ni les records, ni le volume de travail, ni la double progression. */
  const statsOriginal = FM.stats;
  FM.stats = function (series) {
    return statsOriginal((series || []).filter(s => s.type !== 'echauffement'));
  };
  const historiqueOriginal = FM.historiqueExercice;
  FM.historiqueExercice = function (seances, exId) {
    return historiqueOriginal(seances, exId)
      .map(passage => Object.assign({}, passage, { series: passage.series.filter(s => s.type !== 'echauffement') }))
      .filter(passage => passage.series.length > 0);
  };

  /* Une RPE très élevée ou un RIR nul/1 bloque une hausse de charge automatique. */
  const proposerOriginal = FM.proposer;
  FM.proposer = function (seances, exId, item) {
    const proposition = proposerOriginal(seances, exId, item);
    if (!proposition || proposition.type !== 'charge') return proposition;
    const historique = FM.historiqueExercice(seances, exId);
    const dernier = historique[historique.length - 1];
    if (!dernier) return proposition;
    const series = dernier.series.filter(s => s.type !== 'echauffement');
    const rpe = series.map(s => s.rpe).filter(Number.isFinite);
    const rir = series.map(s => s.rir).filter(Number.isFinite);
    const effortMax = rpe.length ? Math.max(...rpe) : null;
    const reserveMin = rir.length ? Math.min(...rir) : null;
    if ((effortMax !== null && effortMax >= 9) || (reserveMin !== null && reserveMin <= 1)) {
      const charge = Math.max(0, ...series.map(s => s.kg || 0));
      proposition.type = 'maintien';
      proposition.titre = 'Consolide avec plus de marge';
      proposition.raison = 'RPE/RIR indique un effort très élevé. Garde la charge actuelle et cherche une exécution plus maîtrisée avant de l’augmenter.';
      proposition.cible = { kg: charge, reps: item.min };
    }
    return proposition;
  };

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function champSelect(labelText, value, options, onChange) {
    const label = element('label', 'forge-meta-field', labelText);
    const select = element('select', 'forge-meta-input');
    options.forEach(([key, title]) => {
      const option = element('option', '', title);
      option.value = key;
      select.append(option);
    });
    select.value = value;
    select.addEventListener('change', () => onChange(select.value));
    label.append(select);
    return label;
  }
  function champNombre(labelText, value, min, max, step, onChange) {
    const label = element('label', 'forge-meta-field', labelText);
    const input = element('input', 'forge-meta-input');
    input.type = 'number';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.inputMode = 'decimal';
    input.value = value === null || value === undefined ? '' : String(value);
    input.addEventListener('change', () => onChange(input.value));
    label.append(input);
    return label;
  }

  const seanceOriginale = FM.vues.seance;
  FM.vues.seance = function (app) {
    const view = seanceOriginale(app);
    const active = app.etat && app.etat.active;
    if (!active || !active.echauffement || !active.exercices.length) return view;
    const entry = active.exercices[active.index];
    if (!entry || !entry.series.length) return view;
    const unfinished = entry.series.findIndex(s => !s.fait);
    const setIndex = unfinished >= 0 ? unfinished : entry.series.length - 1;
    const set = entry.series[setIndex];
    const panel = element('section', 'forge-set-details');
    panel.append(element('h3', '', 'Détails de la série'));
    panel.append(element('p', 'forge-meta-help', 'RPE 10 = échec. RIR 2 = environ deux répétitions encore possibles. Renseigne seulement ce que tu connais.'));
    panel.append(champSelect('Type de série', set.type || 'travail', Object.entries(TYPES), value => {
      if (value === 'travail') delete set.type;
      else set.type = value;
      app.sauver();
    }));
    const effort = element('div', 'forge-meta-grid');
    effort.append(champNombre('RPE (5 à 10)', set.rpe, 5, 10, 0.5, value => {
      const n = optionalNumber(value, 5, 10, 0.5);
      if (n === null) delete set.rpe; else set.rpe = n;
      app.sauver();
    }));
    effort.append(champNombre('RIR (0 à 5)', set.rir, 0, 5, 1, value => {
      const n = optionalNumber(value, 0, 5, 1);
      if (n === null) delete set.rir; else set.rir = n;
      app.sauver();
    }));
    panel.append(effort);
    const noteLabel = element('label', 'forge-meta-field', 'Note sur cet exercice');
    const note = element('textarea', 'forge-meta-input');
    note.rows = 2;
    note.maxLength = 500;
    note.placeholder = 'Technique, sensation, gêne, réglage…';
    note.value = entry.note || '';
    note.addEventListener('change', () => { entry.note = note.value.slice(0, 500); app.sauver(); });
    noteLabel.append(note);
    panel.append(noteLabel);
    const activeSet = view.querySelector('.serie.active');
    if (activeSet) activeSet.after(panel);
    else view.append(panel);

    const completed = view.querySelectorAll('.serie.faite');
    let completedIndex = 0;
    entry.series.forEach(s => {
      if (!s.fait) return;
      const line = completed[completedIndex++];
      if (!line || line.querySelector('.forge-set-summary')) return;
      const summary = element('small', 'forge-set-summary');
      const parts = [];
      if (s.type && TYPES[s.type] && s.type !== 'travail') parts.push(TYPES[s.type]);
      if (Number.isFinite(s.rpe)) parts.push('RPE ' + s.rpe);
      if (Number.isFinite(s.rir)) parts.push('RIR ' + s.rir);
      if (parts.length) summary.textContent = parts.join(' · ');
      if (parts.length) line.append(summary);
    });
    return view;
  };

  /* Pause/reprise du repos : la date de fin reste la référence, même après veille ou rechargement. */
  const timer = FM.timer;
  const restantOriginal = timer.restant;
  timer.restant = function () {
    const r = this.app && this.app.etat && this.app.etat.repos;
    if (!r) return 0;
    if (r.paused) return Math.max(0, Number(r.remaining) || 0);
    return restantOriginal.call(this);
  };
  const verifierOriginal = timer.verifier;
  timer.verifier = function () {
    const r = this.app && this.app.etat && this.app.etat.repos;
    if (r && r.paused) return;
    return verifierOriginal.call(this);
  };
  const resynchroniserOriginal = timer.resynchroniser;
  timer.resynchroniser = function () {
    const r = this.app && this.app.etat && this.app.etat.repos;
    if (r && r.paused) return;
    return resynchroniserOriginal.call(this);
  };
  const ajusterOriginal = timer.ajuster;
  timer.ajuster = function (delta) {
    const r = this.app && this.app.etat && this.app.etat.repos;
    if (!r || !r.paused) return ajusterOriginal.call(this, delta);
    const next = clamp(this.restant() + delta, 0, 900);
    if (next <= 0) return this.arreter();
    r.remaining = next;
    r.total = Math.max(next, Number(r.total) || next);
    r.signale = false;
    this.app.sauver();
    this.app.rafraichirRepos();
  };
  timer.pause = function () {
    const r = this.app && this.app.etat && this.app.etat.repos;
    if (!r || r.paused) return;
    const s = Math.ceil(this.restant());
    if (s <= 0) return this.verifier();
    r.remaining = s;
    r.paused = true;
    this.couperSon();
    this.app.sauver();
    this.app.rafraichirRepos();
  };
  timer.reprendre = function () {
    const r = this.app && this.app.etat && this.app.etat.repos;
    if (!r || !r.paused) return;
    const s = clamp(Number(r.remaining) || 0, 0, 900);
    if (s <= 0) return this.arreter();
    r.fin = Date.now() + s * 1000;
    r.paused = false;
    delete r.remaining;
    r.signale = false;
    this.armer();
    this.app.sauver();
    this.app.rafraichirRepos();
  };

  function installerControlesRepos() {
    const app = FM.app;
    if (!app || !document.querySelector('#repos .repos-boutons')) return;
    const bar = document.getElementById('repos');
    const actions = bar.querySelector('.repos-boutons');
    if (!actions.querySelector('[data-forge-pause]')) {
      const button = element('button', 'btn', 'Pause');
      button.type = 'button';
      button.dataset.forgePause = '1';
      button.setAttribute('aria-label', 'Mettre le minuteur de repos en pause ou reprendre');
      button.addEventListener('click', () => {
        const r = app.etat && app.etat.repos;
        if (!r) return;
        if (r.paused) timer.reprendre(); else timer.pause();
      });
      actions.insertBefore(button, actions.querySelector('[data-a=passer]'));
    }
    const renderOriginal = app.rafraichirRepos;
    if (!renderOriginal.__forgePauseWrapped) {
      const wrapped = function () {
        renderOriginal.call(this);
        const button = bar.querySelector('[data-forge-pause]');
        const r = this.etat && this.etat.repos;
        if (!button) return;
        button.hidden = !r || timer.restant() <= 0;
        if (r) button.textContent = r.paused ? 'Reprendre' : 'Pause';
        if (r && r.paused) {
          bar.classList.add('repos-pause');
          bar.querySelector('.titre').textContent = 'Repos en pause';
          bar.querySelector('.temps').textContent = FM.mmss(timer.restant());
          bar.querySelector('progress').value = 1 - timer.restant() / Math.max(1, r.total || timer.restant());
        } else {
          bar.classList.remove('repos-pause');
        }
      };
      wrapped.__forgePauseWrapped = true;
      app.rafraichirRepos = wrapped;
      app.rafraichirRepos();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installerControlesRepos, { once: true });
  } else {
    installerControlesRepos();
  }
})(typeof window !== 'undefined' ? window : globalThis);
