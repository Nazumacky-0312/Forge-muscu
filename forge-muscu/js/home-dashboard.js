/* Accueil tableau de bord : statistiques, nutrition, défis et Forge Pro. */
(function(root){
  'use strict';
  const FM=root.FM,h=FM.h;
  const carte=(...args)=>FM.carte(...args);
  const jour=(ts)=>{const d=new Date(ts);d.setHours(0,0,0,0);return d.getTime();};
  const cle=(ts)=>FM.cleJour(ts);
  const pct=(v,max)=>max>0?Math.max(0,Math.min(100,v/max*100)):0;
  const nb=(v)=>Math.round(Number(v)||0);
  const barre=(label,value,target,unit)=>{
    const has=Number(target)>0;
    return h('div',{class:'home-macro'},
      h('div',{class:'home-macro-head'},h('span',{},label),h('strong',{},has?nb(value)+' / '+nb(target)+' '+unit:nb(value)+' '+unit)),
      h('div',{class:'forge-progress'},h('i',{style:'width:'+pct(value,target)+'%'}))
    );
  };
  function streak(e){
    const active=new Set(e.seances.map(s=>cle(s.debut)));
    let d=jour(Date.now()),n=0;
    if(!active.has(cle(d)))d-=86400000;
    while(active.has(cle(d))&&n<365){n++;d-=86400000;}
    return n;
  }
  function accueil(app){
    const e=app.etat,now=Date.now(),today=cle(now),start=jour(now);
    const weekStart=FM.lundi(new Date()).getTime();
    const sessionsWeek=e.seances.filter(s=>s.debut>=weekStart);
    const sets=s=>s.exercices.reduce((n,x)=>n+x.series.filter(y=>y.fait&&y.reps>0).length,0);
    const weeklySets=sessionsWeek.reduce((n,s)=>n+sets(s),0);
    const totalSets=e.seances.reduce((n,s)=>n+sets(s),0);
    const volume=e.seances.reduce((n,s)=>n+s.exercices.reduce((a,x)=>a+x.series.filter(y=>y.fait&&y.reps>0).reduce((b,y)=>b+(Number(y.kg)||0)*(Number(y.reps)||0),0),0),0);
    const records=e.seances.reduce((n,s)=>n+FM.nouveauxRecords(e.seances,s).length,0);
    const meals=(e.nutrition||[]).filter(x=>cle(x.date)===today);
    const sum={kcal:0,proteines:0,glucides:0,lipides:0};
    meals.forEach(m=>Object.keys(sum).forEach(k=>sum[k]+=Number(m[k])||0));
    const goals=e.objectifsNutrition||{};
    const targetSessions=Math.max(1,Number(e.profil&&e.profil.jours)||3);
    const targetSets=45;
    const targetRecords=1;
    const challenge=(title,desc,value,target,unit)=>carte(
      h('div',{class:'home-challenge-head'},h('strong',{},title),h('b',{},Math.min(value,target)+'/'+target)),
      h('p',{class:'discret'},desc),
      h('div',{class:'forge-progress'},h('i',{style:'width:'+pct(value,target)+'%'})),
      h('small',{class:'home-challenge-foot'},value>=target?'Défi terminé !':'Encore '+(target-value)+' '+unit)
    );
    const greeting=h('div',{class:'home-hero'},
      h('div',{},h('p',{class:'surtitre'},'TON TABLEAU DE BORD'),
        h('h1',{},'Forge. Suis ta progression.'),
        h('p',{class:'discret'},new Date(now).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'}))),
      h('a',{href:'#/programme',class:'btn primaire home-start'},'Lancer une séance')
    );
    const stats=carte(
      h('div',{class:'forge-card-head'},h('h2',{},'Tes statistiques'),h('a',{href:'#/stats',class:'home-link'},'Tout voir →')),
      h('div',{class:'home-kpi-grid'},
        h('div',{class:'home-kpi'},h('strong',{},String(e.seances.length)),h('span',{},'Séances au total')),
        h('div',{class:'home-kpi'},h('strong',{},String(weeklySets)),h('span',{},'Séries cette semaine')),
        h('div',{class:'home-kpi'},h('strong',{},String(records)),h('span',{},'Records détectés')),
        h('div',{class:'home-kpi'},h('strong',{},volume>=1000?(volume/1000).toFixed(1)+' t':nb(volume)+' kg'),h('span',{},'Volume cumulé'))
      ),
      h('div',{class:'home-stat-foot'},h('span',{},'🔥 '+streak(e)+' jour(s) de série'),h('span',{},totalSets+' séries validées'))
    );
    const nutrition=carte(
      h('div',{class:'forge-card-head'},h('h2',{},'Suivi nutritionnel'),h('a',{href:'#/nutrition',class:'home-link'},'Journal complet →')),
      h('div',{class:'home-calorie-line'},h('strong',{},nb(sum.kcal).toLocaleString('fr-FR')),h('span',{},'kcal consommées aujourd’hui'),
        h('b',{},goals.kcal?'/ '+nb(goals.kcal).toLocaleString('fr-FR')+' kcal':'Objectif à définir')),
      h('div',{class:'home-macros'},barre('Protéines',sum.proteines,goals.proteines,'g'),barre('Glucides',sum.glucides,goals.glucides,'g'),barre('Lipides',sum.lipides,goals.lipides,'g')),
      h('p',{class:'home-muted'},meals.length?meals.length+' aliment(s) enregistré(s) aujourd’hui.':'Aucun repas enregistré aujourd’hui. Ajoute tes repas pour suivre tes apports.')
    );
    const challenges=carte(
      h('div',{class:'forge-card-head'},h('h2',{},'Défis de la semaine'),h('a',{href:'#/defis',class:'home-link'},'Tous les défis →')),
      h('div',{class:'home-challenges'},
        challenge('Régularité','Atteindre ton objectif de séances',sessionsWeek.length,targetSessions,'séance(s)'),
        challenge('Volume','Valider 45 séries cette semaine',weeklySets,targetSets,'série(s)'),
        challenge('Records','Battre un record personnel',sessionsWeek.reduce((n,s)=>n+FM.nouveauxRecords(e.seances,s).length,0),targetRecords,'record')
      )
    );
    const pro=carte(
      h('div',{class:'home-pro-banner'},
        h('div',{class:'home-pro-mark'},'✦'),
        h('div',{},h('p',{class:'surtitre'},'ESPACE AVANCÉ'),h('h2',{},'Forge Pro'),h('p',{class:'discret'},'Analyse tes performances, affine ta progression et exploite tes données.')),
        h('a',{href:'#/pro',class:'btn primaire'},'Explorer Forge Pro')
      ),
      h('div',{class:'home-pro-links'},
        h('a',{href:'#/pro/analyses'},'Analyses avancées ↗'),
        h('a',{href:'#/pro/force'},'Calculateur 1RM ↗'),
        h('a',{href:'#/pro/aliments'},'Recherche alimentaire ↗')
      )
    );
    const shortcuts=h('div',{class:'home-quick-links'},
      h('a',{href:'#/defis'},'🔥 Défis'),
      h('a',{href:'#/nutrition'},'🥗 Nutrition'),
      h('a',{href:'#/stats'},'📈 Statistiques'),
      h('a',{href:'#/pro'},'✦ Forge Pro')
    );
    return h('div',{class:'forge-page forge-home-dashboard'},greeting,stats,nutrition,challenges,pro,shortcuts);
  }
  FM.vues.accueil=accueil;
})(typeof window!=='undefined'?window:globalThis);
