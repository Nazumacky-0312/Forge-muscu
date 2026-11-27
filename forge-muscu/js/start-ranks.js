/* Démarrage guidé et page des rangs Forge. */
(function(root){
  'use strict';
  const FM=root.FM,h=FM.h,carte=(...x)=>FM.carte(...x);
  const accueilAvant=FM.vues.accueil;
  FM.vues.accueil=function(app){
    const vue=accueilAvant(app),e=app.etat;
    const jours=e.programme.jours.filter(j=>j.items.length);
    let choisi=FM.prochainJour?FM.prochainJour(e):jours[0];
    const action=h('section',{class:'carte forge-launch-card'});
    const dessiner=()=>{
      action.replaceChildren();
      if(e.active){
        action.append(h('p',{class:'surtitre'},'ENTRAÎNEMENT EN COURS'),
          h('h2',{},e.active.nom||'Ta séance'),
          h('p',{class:'discret'},'Tu as déjà commencé. Reprends exactement là où tu en étais.'),
          FM.btn('Reprendre ma séance',()=>app.aller('#/seance'),'primaire geant forge-main-action'));
        return;
      }
      action.append(h('p',{class:'surtitre'},'PRÊT À T’ENTRAÎNER ?'),
        h('h2',{},choisi?choisi.nom:'Crée ton premier programme'),
        h('p',{class:'discret'},choisi?choisi.items.length+' exercices · environ '+FM.duree(choisi.items)+' minutes':'Configure ton programme pour obtenir tes séances personnalisées.'));
      if(!choisi){
        action.append(FM.btn('Créer mon programme',()=>app.aller('#/programme'),'primaire geant forge-main-action'));
        return;
      }
      action.append(FM.apercu(choisi));
      if(jours.length>1){
        const select=h('select',{class:'forge-day-select','aria-label':'Choisir une séance',onchange:ev=>{choisi=jours.find(j=>j.id===ev.target.value)||jours[0];dessiner();}},jours.map(j=>h('option',{value:j.id,selected:j.id===choisi.id},j.nom)));
        action.append(h('label',{class:'forge-day-label'},'Choisir une autre séance',select));
      }
      action.append(FM.btn('Commencer ma séance',()=>app.demarrerSeance(choisi),'primaire geant forge-main-action'),
        FM.lien('#/programme','Modifier mon programme ou mes exercices','forge-program-link'));
    };
    dessiner();
    const hero=vue.querySelector('.home-hero');
    if(hero) hero.after(action); else vue.prepend(action);
    return vue;
  };

  const programmeAvant=FM.vues.programme;
  FM.vues.programme=function(app){
    const vue=programmeAvant(app);
    app.etat.programme.jours.forEach(jour=>{
      if(!jour.items.length)return;
      const bloc=[...vue.querySelectorAll('.carte')].find(c=>c.querySelector('h2')?.textContent.trim()===jour.nom);
      if(!bloc)return;
      const bouton=FM.btn('Démarrer cette séance',()=>app.demarrerSeance(jour),'primaire geant forge-program-start');
      const entete=bloc.querySelector('.entete');
      if(entete)entete.after(bouton);else bloc.prepend(bouton);
    });
    return vue;
  };

  const paliers=[
    {nom:'Débutant',min:0,icone:'🌱'},
    {nom:'Bronze',min:250,icone:'🥉'},
    {nom:'Argent',min:600,icone:'🥈'},
    {nom:'Or',min:1100,icone:'🥇'},
    {nom:'Platine',min:1800,icone:'💠'},
    {nom:'Diamant',min:2700,icone:'💎'},
    {nom:'Légende',min:3900,icone:'🔥'},
    {nom:'Élite Forge',min:5400,icone:'🏆'}
  ];
  function stats(e){
    const sessions=e.seances||[];
    const sets=sessions.reduce((n,s)=>n+s.exercices.reduce((a,x)=>a+x.series.filter(y=>y.fait&&y.reps>0&&y.type!=='echauffement').length,0),0);
    const prs=sessions.reduce((n,s)=>n+FM.nouveauxRecords(sessions,s).length,0);
    const cardio=(e.cardio||[]).reduce((n,c)=>n+(Number(c.duree)||0),0);
    const xp=sessions.length*100+sets*10+prs*50+Math.floor(cardio/10)*5;
    let index=0;
    for(let i=0;i<paliers.length;i++)if(xp>=paliers[i].min)index=i;
    const current=paliers[index],next=paliers[index+1]||null;
    return {sessions,sets,prs,cardio,xp,index,current,next,progress:next?Math.min(100,(xp-current.min)/(next.min-current.min)*100):100};
  }
  FM.vues.classement=function(app){
    const s=stats(app.etat),e=app.etat;
    const bar=h('div',{class:'forge-rank-track'},h('i',{style:'width:'+s.progress+'%'}));
    const achievements=[
      ['Premier pas','Terminer une première séance',s.sessions.length>=1,'🏁'],
      ['Régulier','Terminer 5 séances',s.sessions.length>=5,'📅'],
      ['Habitué','Terminer 10 séances',s.sessions.length>=10,'💪'],
      ['Machine','Terminer 25 séances',s.sessions.length>=25,'⚡'],
      ['Centurion','Valider 100 séries',s.sets>=100,'🎯'],
      ['Volume','Valider 500 séries',s.sets>=500,'🔥'],
      ['Record personnel','Battre un record',s.prs>=1,'🏅'],
      ['Chasseur de records','Battre 10 records',s.prs>=10,'👑'],
      ['Endurant','Cumuler 300 minutes de cardio',s.cardio>=300,'🚴']
    ];
    const badges=achievements.map(a=>h('div',{class:'forge-achievement'+(a[2]?' unlocked':' locked')},
      h('span',{class:'forge-achievement-icon'},a[3]),
      h('div',{},h('strong',{},a[0]),h('small',{},a[1])),
      h('b',{class:'forge-achievement-state'},a[2]?'Obtenu':'À débloquer')));
    return h('div',{class:'forge-page forge-ranks-page'},
      h('p',{class:'surtitre'},'TA PROGRESSION PERSONNELLE'),
      h('h1',{},'Rangs Forge'),
      carte(h('div',{class:'forge-rank-hero'},
        h('div',{class:'forge-rank-emblem'},s.current.icone),
        h('div',{},h('p',{class:'surtitre'},'RANG ACTUEL'),h('h2',{},s.current.nom),h('strong',{class:'forge-rank-xp'},s.xp.toLocaleString('fr-FR')+' XP'))
      ),
      h('div',{class:'forge-rank-progress-head'},h('span',{},s.next?'Progression vers '+s.next.nom:'Rang maximum atteint'),h('b',{},s.next?(s.next.min-s.xp).toLocaleString('fr-FR')+' XP restants':'100 %')),
      bar,
      h('p',{class:'discret'},'Gagne de l’XP en terminant tes séances, en validant des séries, en battant tes records et en faisant du cardio.')),
      h('div',{class:'forge-rank-stats'},
        carte(h('strong',{},String(s.sessions.length)),h('span',{},'Séances terminées')),
        carte(h('strong',{},String(s.sets)),h('span',{},'Séries validées')),
        carte(h('strong',{},String(s.prs)),h('span',{},'Records battus')),
        carte(h('strong',{},s.cardio+' min'),h('span',{},'Cardio cumulé'))),
      carte(h('h2',{},'Tous les rangs'),h('div',{class:'forge-rank-list'},paliers.map((p,i)=>h('div',{class:'forge-rank-row'+(i===s.index?' current':i<s.index?' passed':'')},h('span',{class:'forge-rank-row-icon'},p.icone),h('strong',{},p.nom),h('small',{},p.min.toLocaleString('fr-FR')+' XP'),h('b',{},i<s.index?'✓':i===s.index?'Actuel':'🔒'))))),
      carte(h('h2',{},'Tes trophées'),h('p',{class:'discret'},'Débloque des trophées en progressant dans ton entraînement.'),h('div',{class:'forge-achievements'},badges)),
      FM.btn('Commencer une séance',()=>app.aller('#/accueil'),'primaire geant')
    );
  };
  FM.vues.rangs=FM.vues.classement;
})(typeof window!=='undefined'?window:globalThis);
