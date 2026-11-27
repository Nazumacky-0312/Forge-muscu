/* Structures de séance : supersets, circuits, alternance et réorganisation. */
(function (root) {
  'use strict';
  const FM = root.FM, h = FM.h;
  const TYPES = ['superset', 'circuit'];
  const idValide = value => typeof value === 'string' && /^wg-[\w-]{1,60}$/.test(value);

  /* Le stockage historique filtre les propriétés inconnues : conserver uniquement
     les métadonnées de structure validées, sur les séances actives et terminées. */
  const normaliserOriginal = FM.normaliser;
  FM.normaliser = function (data) {
    const state = normaliserOriginal(data);
    const appliquer = (destinations, sources) => {
      if (!Array.isArray(destinations) || !Array.isArray(sources)) return;
      destinations.forEach((entry, index) => {
        const source = sources[index];
        if (!source || !idValide(source.structureId) || !TYPES.includes(source.structureType)) return;
        entry.structureId = source.structureId;
        entry.structureType = source.structureType;
      });
    };
    if (state.active && data.active) appliquer(state.active.exercices, data.active.exercices);
    if (Array.isArray(state.seances) && Array.isArray(data.seances)) {
      state.seances.forEach((session, index) => appliquer(session.exercices, data.seances[index] && data.seances[index].exercices));
    }
    return state;
  };

  function exercicesDuGroupe(a, id) {
    return a.exercices.map((entry, index) => ({ entry, index }))
      .filter(item => item.entry.structureId === id);
  }

  function configurerGroupe(app, a, courant) {
    const idActuel = courant.structureId;
    const selection = h('div', { class: 'forge-structure-options' },
      h('p', { class: 'discret' }, 'Choisis les exercices qui s’enchaîneront. Les séries alterneront automatiquement, puis le repos habituel démarrera.'),
      a.exercices.map((entry, index) => h('label', { class: 'forge-structure-option' },
        h('input', { type: 'checkbox', value: String(index), checked: idActuel ? entry.structureId === idActuel : index === a.index }),
        h('span', {}, `${index + 1}. ${FM.EX[entry.exId].nom}`))));
    const selectionner = type => {
      const indices = [...selection.querySelectorAll('input:checked')].map(input => Number(input.value));
      if (indices.length < 2) { FM.toast('Sélectionne au moins deux exercices.'); return false; }
      if (type === 'superset' && indices.length !== 2) { FM.toast('Un superset relie exactement deux exercices. Pour enchaîner trois exercices ou plus, choisis Circuit.'); return false; }
      const members = indices.map(index => a.exercices[index]).filter(Boolean);
      if (members.length !== indices.length) return false;
      const before = Math.min(...indices);
      const selected = new Set(members);
      const ordered = a.exercices.filter(entry => !selected.has(entry));
      ordered.splice(before, 0, ...members);
      const replacedGroups = new Set(members.map(entry => entry.structureId).filter(idValide));
      if (replacedGroups.size) a.exercices.forEach(entry => {
        if (replacedGroups.has(entry.structureId)) { delete entry.structureId; delete entry.structureType; }
      });
      a.exercices = ordered;
      /* Une entrée ne peut appartenir qu'à une seule structure à la fois. */
      const groupId = 'wg-' + FM.uid();
      members.forEach(entry => { entry.structureId = groupId; entry.structureType = type; });
      a.index = a.exercices.indexOf(courant);
      app.sauver(); app.rendre();
      return true;
    };
    FM.modale(idActuel ? 'Modifier l’enchaînement' : 'Créer un enchaînement', selection, [
      { texte: 'Créer un superset', classe: 'primaire', action: () => selectionner('superset') },
      { texte: 'Créer un circuit', action: () => selectionner('circuit') },
      ...(idActuel ? [{ texte: 'Dissocier', classe: 'danger', action: () => {
        exercicesDuGroupe(a, idActuel).forEach(({ entry }) => { delete entry.structureId; delete entry.structureType; });
        app.sauver(); app.rendre();
      } }] : []),
      { texte: 'Annuler' }
    ]);
  }

  const seanceOriginale = FM.vues.seance;
  FM.vues.seance = function (app) {
    const view = seanceOriginale(app);
    const a = app.etat && app.etat.active;
    if (!a || !Array.isArray(a.exercices) || !a.exercices.length || !view.querySelector('.entete')) return view;
    const current = a.exercices[a.index];
    if (!current) return view;

    const members = current.structureId ? exercicesDuGroupe(a, current.structureId) : [];
    const tour = members.length ? Math.min(...members.map(({ entry }) => entry.series.filter(set => set.fait).length)) + 1 : 0;
    const manager = h('section', { class: 'forge-workout-structure', 'aria-label': 'Supersets et circuits' });
    const heading = h('div', { class: 'forge-workout-structure-copy' },
      h('strong', {}, members.length ? (current.structureType === 'circuit' ? 'Circuit actif' : 'Superset actif') : 'Enchaînement d’exercices'),
      h('span', {}, members.length
        ? members.map(({ entry }) => FM.EX[entry.exId].nom).join(' → ') + ` · tour ${tour} · alternance automatique`
        : 'Lie deux exercices ou plus pour alterner leurs séries.'));
    manager.append(heading, FM.btn(members.length ? 'Modifier' : 'Créer', () => configurerGroupe(app, a, current), 'petit'));
    if (members.length) manager.append(FM.btn('Dissocier', () => {
      members.forEach(({ entry }) => { delete entry.structureId; delete entry.structureType; });
      app.sauver(); app.rendre();
    }, 'petit'));
    const header = view.querySelector('.entete');
    header.after(manager);

    const rearranger = index => {
      if (index < 0 || index >= a.exercices.length || index === a.index) return;
      const [entry] = a.exercices.splice(a.index, 1);
      a.exercices.splice(index, 0, entry);
      a.index = index;
      app.sauver(); app.rendre();
    };
    const controls = h('div', { class: 'forge-session-reorder', 'aria-label': 'Réorganiser les exercices de la séance' },
      FM.btn('↑ Exercice précédent', () => rearranger(a.index - 1), 'petit', { disabled: a.index === 0 }),
      FM.btn('↓ Exercice suivant', () => rearranger(a.index + 1), 'petit', { disabled: a.index === a.exercices.length - 1 }));
    manager.after(controls);

    /* Le clic de validation marque d’abord la série. Au premier rendu déclenché
       ensuite par le contrôleur, basculer vers le membre le moins avancé du groupe. */
    let valider = false;
    view.addEventListener('click', event => {
      if (event.target.closest('button')?.textContent.trim() === 'Valider la série' && current.structureId) {
        valider = true;
        const render = app.rendre;
        app.rendre = function () {
          if (valider) {
            valider = false;
            const group = exercicesDuGroupe(a, current.structureId);
            const pending = group.map(member => ({ ...member, done: member.entry.series.filter(set => set.fait).length }))
              .filter(member => member.entry.series.some(set => !set.fait));
            if (pending.length) {
              const leastDone = Math.min(...pending.map(member => member.done));
              const candidates = pending.filter(member => member.done === leastDone);
              const next = candidates.find(member => member.index > a.index) || candidates[0];
              a.index = next.index;
              if (app.etat.repos) app.etat.repos.libelle = 'Ensuite : ' + FM.EX[next.entry.exId].nom;
              app.sauver();
            }
          }
          app.rendre = render;
          return render.apply(this, arguments);
        };
      }
    }, true);
    return view;
  };

  /* Glisser-déposer au clavier ou à la souris dans l’éditeur ; les boutons
     Monter / Descendre restent disponibles sur écran tactile. */
  function enrichirProgramme(view, app) {
    const cards = view.querySelectorAll('.carte');
    app.etat.programme.jours.forEach((day, dayIndex) => {
      const card = cards[dayIndex];
      if (!card || !card.querySelector('input[aria-label="Nom de la séance"]')) return;
      const blocks = card.querySelectorAll('.bloc');
      const moveItem = (from, to) => {
        if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= day.items.length || to >= day.items.length || from === to) return;
        const [item] = day.items.splice(from, 1);
        day.items.splice(to, 0, item);
        app.sauver(); app.rendre();
      };
      blocks.forEach((block, index) => {
        let pointerDragging = false;
        block.draggable = true;
        block.dataset.forgeExerciseIndex = String(index);
        const exerciseName = FM.EX[day.items[index].exId].nom;
        block.setAttribute('aria-label', `${exerciseName}, déplaçable. Utilise aussi les boutons Monter et Descendre.`);
        const heading = block.querySelector('h3');
        if (heading) {
          let moved = false;
          const handle = FM.btn('⠿', () => {
            if (moved) { moved = false; return; }
            moveItem(index, index - 1);
          }, 'forge-drag-handle', { 'aria-label': `Déplacer ${exerciseName} vers le haut`, title: `Faire glisser pour déplacer ${exerciseName}` });
          heading.prepend(handle);
          let targetBlock = null;
          const pointermove = event => {
            const edge = 72;
            if (event.clientY > root.innerHeight - edge) root.scrollBy(0, Math.min(28, event.clientY - root.innerHeight + edge));
            else if (event.clientY < edge) root.scrollBy(0, -Math.min(28, edge - event.clientY));
            targetBlock?.classList.remove('forge-drop-target');
            targetBlock = document.elementFromPoint(event.clientX, event.clientY)?.closest('.bloc[data-forge-exercise-index]');
            if (!targetBlock || targetBlock.parentElement !== card) {
              targetBlock = [...card.querySelectorAll('.bloc[data-forge-exercise-index]')]
                .find(candidate => { const rect = candidate.getBoundingClientRect(); return event.clientY >= rect.top && event.clientY <= rect.bottom; }) || null;
            }
            if (targetBlock && targetBlock.parentElement === card) { targetBlock.classList.add('forge-drop-target'); if (targetBlock !== block) moved = true; }
            else targetBlock = null;
          };
          const pointerup = () => {
            document.removeEventListener('pointermove', pointermove);
            const targetIndex = targetBlock ? Number(targetBlock.dataset.forgeExerciseIndex) : index;
            targetBlock?.classList.remove('forge-drop-target');
            if (targetIndex === index) return;
            if (targetIndex !== index) moveItem(index, targetIndex);
          };
          handle.addEventListener('pointerdown', event => {
            if (event.button !== undefined && event.button !== 0) return;
            pointerDragging = true;
            moved = false;
            block.classList.add('forge-drag-source');
            document.addEventListener('pointermove', pointermove);
            document.addEventListener('pointerup', () => { pointerDragging = false; block.classList.remove('forge-drag-source'); pointerup(); }, { once: true });
          });
          handle.addEventListener('dragstart', event => event.preventDefault());
        }
        block.addEventListener('dragstart', event => {
          if (pointerDragging) { event.preventDefault(); return; }
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text/plain', String(index));
          block.classList.add('forge-drag-source');
        });
        block.addEventListener('dragend', () => block.classList.remove('forge-drag-source'));
        block.addEventListener('dragover', event => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; block.classList.add('forge-drop-target'); });
        block.addEventListener('dragleave', () => block.classList.remove('forge-drop-target'));
        block.addEventListener('drop', event => {
          event.preventDefault(); block.classList.remove('forge-drop-target');
          const from = Number(event.dataTransfer.getData('text/plain'));
          const to = Number(block.dataset.forgeExerciseIndex);
          if (!Number.isInteger(from) || !Number.isInteger(to) || from === to) return;
          const [item] = day.items.splice(from, 1);
          day.items.splice(to, 0, item);
          app.sauver(); app.rendre();
        });
      });
      const duplicate = FM.btn('Dupliquer cette séance', () => {
        if (app.etat.programme.jours.length >= 7) return;
        const copy = JSON.parse(JSON.stringify(day));
        copy.id = FM.uid();
        copy.nom = (day.nom + ' (copie)').slice(0, 60);
        app.etat.programme.jours.splice(dayIndex + 1, 0, copy);
        app.sauver(); app.rendre();
      }, '', { disabled: app.etat.programme.jours.length >= 7 });
      const addButton = [...card.querySelectorAll('button')].find(button => button.textContent.trim() === '+ Ajouter un exercice');
      if (addButton) addButton.after(duplicate);
    });
    return view;
  }
  const programmeOriginal = FM.vues.programme;
  FM.vues.programme = function (app) { return enrichirProgramme(programmeOriginal(app), app); };
  /* L’onglet Séance a capturé les vues avant le chargement des extensions. */
  const hubOriginal = FM.vues.seanceHub;
  if (hubOriginal) FM.vues.seanceHub = function (app, active, sub) {
    const view = hubOriginal(app, active, sub);
    if (active === 'programme') {
      const panel = view.querySelector('.forge-seance-panel');
      if (panel && panel.firstElementChild) enrichirProgramme(panel.firstElementChild, app);
    }
    return view;
  };
})(typeof window !== 'undefined' ? window : globalThis);
