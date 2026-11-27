/* Modules avancés Forge : régularité, défis, statistiques et export CSV. */
(function (root) {
  'use strict';
  const FM = root.FM, h = FM.h;
  const carte = (...x) => FM.carte(...x);
  const validees = s => s.exercices.reduce((n, x) => n + x.series.filter(y => y.fait && y.reps > 0).length, 0);
  const jours = e => [...new Set(e.seances.map(s => FM.cleJour(s.debut)))].sort();
  const debutJour = ts => { const d = new Date(ts); d.setHours(0,0,0,0); return d.getTime(); };
  const serie = e => e.seances.reduce((n,s)=>n+validees(s),0);
  const streak = e => {
    const set = new Set(jours(e)); let d = debutJour(Date.now()), n = 0;
    if (!set.has(FM.cleJour(d))) d -= 864e5;
    while (set.has(FM.cleJour(d))) { n++; d -= 864e5; }
    return n;
  };
  const csv = rows => rows.map(row => row.map(v => '"' + String(v ?? '').replace(/"/g,'""') + '"').join(';')).join('\r\n');
  const telechargerCSV = (name, rows) => {
    const blob = new Blob(['\ufeff' + csv(rows)], {type:'text/csv;charset=utf-8'}), url = URL.createObjectURL(blob);
    const a = h('a',{href:url,download:name}); document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),4000);
  };
  const format = n => Math.round(n*10)/10;
  const serieSemaine = e => {
    const debut = debutJour(Date.now()) - 6*864e5;
    return Array.from({length:7},(_,i)=>{
      const d = debut + i*864e5, ss=e.seances.filter(s=>debutJour(s.debut)===d);
      return {d, n:ss.length, sets:ss.reduce((t,s)=>t+validees(s),0)};
    });
  };
  FM.vues.defis = function(app) {
    const e=app.etat, semaine=e.seances.filter(s=>s.debut>=FM.lundi(new Date()).getTime()), sets=semaine.reduce((n,s)=>n+validees(s),0);
    const objectifs=[{titre:'Régularité',desc:'Terminer 3 séances cette semaine',v:semaine.length,max:3,unite:'séances'},{titre:'Volume',desc:'Valider 45 séries cette semaine',v:sets,max:45,unite:'séries'},{titre:'Records',desc:'Battre un record personnel',v:semaine.reduce((n,s)=>n+FM.nouveauxRecords(e.seances,s).length,0),max:1,unite:'record'}];
    return h('div',{class:'forge-page'},h('p',{class:'surtitre'},'MOTIVATION & RÉGULARITÉ'),h('h1',{},'Défis & séries'),
      carte(h('div',{class:'forge-card-head'},h('h2',{},'Série actuelle'),h('span',{class:'forge-tag'},'JOURS CONSÉCUTIFS')),h('div',{class:'forge-rank-large'},h('div',{class:'forge-emblem'},'🔥'),h('div',{},h('strong',{class:'forge-streak-number'},String(streak(e))),h('p',{class:'discret'},'jour(s) consécutif(s) avec une séance'))),h('p',{class:'discret'},'Une journée sans séance remet la série à zéro. Le repos fait partie de la progression : cette série est un indicateur de régularité, pas une obligation de s’entraîner tous les jours.')),
      objectifs.map(o=>carte(h('div',{class:'forge-card-head'},h('h2',{},o.titre),h('span',{class:'forge-tag'},`${Math.min(o.v,o.max)}/${o.max}`)),h('p',{class:'discret'},o.desc),h('div',{class:'forge-progress'},h('i',{style:`width:${Math.min(100,o.v/o.max*100)}%`})),h('p',{class:'discret'},o.v>=o.max?'Défi validé !':`Encore ${o.max-o.v} ${o.unite}.`))),
      carte(h('h2',{},'Historique de régularité'),h('p',{class:'discret'},`Tu as réalisé ${jours(e).length} jours actifs depuis le début de ton suivi.`),h('p',{},`Total : ${e.seances.length} séances · ${serie(e)} séries validées.`)));
  };
  FM.vues.stats = function(app) {
    const e=app.etat, semaine=serieSemaine(e), total=serie(e), records=e.seances.reduce((n,s)=>n+FM.nouveauxRecords(e.seances,s).length,0);
    const max=Math.max(1,...semaine.map(x=>x.sets));
    const lignes=semaine.map(x=>h('div',{class:'forge-week-row'},h('span',{},new Date(x.d).toLocaleDateString('fr-FR',{weekday:'short'})),h('div',{class:'forge-track'},h('i',{style:`width:${x.sets/max*100}%`})),h('b',{},String(x.sets))));
    const exIds=[...new Set(e.seances.flatMap(s=>s.exercices.map(x=>x.exId)))];
    const meilleurs=exIds.map(id=>({id,records:FM.records(e.seances,id)})).filter(x=>x.records.length).sort((a,b)=>Math.max(...b.records.map(r=>r.valeur))-Math.max(...a.records.map(r=>r.valeur))).slice(0,8);
    const bestContent = meilleurs.length ? meilleurs.map(x=>carte(h('h3',{},FM.EX[x.id].nom),...x.records.map(r=>h('p',{class:'forge-measure-history-line'},`${r.nom} : ${format(r.valeur)} ${r.unite} · ${r.date?FM.dateCourte(r.date):'—'}`)))) : h('p',{class:'discret'},'Tes records apparaîtront après tes premières séances.');
    const exportCard = carte(h('h2',{},'Exporter ton historique'),h('p',{class:'discret'},'Télécharge les séances et séries au format CSV pour Excel, Google Sheets ou un autre outil.'),FM.btn('Exporter les séances en CSV',()=>{
      const rows=[['Date','Séance','Exercice','Série','Charge kg','Répétitions','Validée','Ressenti','Douleur']];
      e.seances.slice().sort((a,b)=>a.debut-b.debut).forEach(s=>s.exercices.forEach(x=>x.series.forEach((y,i)=>rows.push([new Date(s.debut).toISOString(),s.nom,FM.EX[x.exId]?.nom||x.exId,i+1,y.kg,y.reps,y.fait?'oui':'non',x.ressenti||'',x.douleur?'oui':'non']))));
      telechargerCSV('forge-muscu-historique.csv',rows);
    },'primaire geant'));
    return h('div',{class:'forge-page'},h('p',{class:'surtitre'},'ANALYSE DES PERFORMANCES'),h('h1',{},'Statistiques'),
      h('div',{class:'forge-stats-grid'},h('div',{class:'forge-stat'},h('strong',{},String(e.seances.length)),h('small',{},'Séances')),h('div',{class:'forge-stat'},h('strong',{},String(total)),h('small',{},'Séries validées')),h('div',{class:'forge-stat'},h('strong',{},String(records)),h('small',{},'Records détectés'))),
      carte(h('h2',{},'Volume des 7 derniers jours'),h('p',{class:'discret'},'Nombre de séries validées par jour.'),...lignes),
      carte(h('h2',{},'Meilleures performances'),bestContent), exportCard);
  };
  const accueilAvant=FM.vues.accueil;
  FM.vues.accueil=function(app){
    const vue=accueilAvant(app);
    vue.append(h('div',{class:'forge-shortcuts'},h('a',{href:'#/stats'},h('b',{},'📊'),h('strong',{},'Statistiques'),h('small',{},'Analyse & export CSV')),h('a',{href:'#/defis'},h('b',{},'🔥'),h('strong',{},'Défis'),h('small',{},'Série & objectifs'))));
    return vue;
  };
})(typeof window !== 'undefined' ? window : globalThis);