/* Estimation locale de récupération musculaire à partir des séries réellement validées. */
(function(root){
  'use strict';
  const FM=root.FM;
  if(!FM||!FM.vues)return;
  const DAY=24*60*60*1000;
  const GROUPS=[
    {id:'chest',label:'Pectoraux',test:/développé couché|bench press|chest press|presse poitrine|écarté|crossover|pec fly/i},
    {id:'shoulders',label:'Épaules',test:/développé militaire|shoulder press|overhead press|élévation latérale|lateral raise|oiseau|reverse fly/i},
    {id:'biceps',label:'Biceps',test:/curl.*biceps|curl barre|curl haltères|biceps/i},
    {id:'triceps',label:'Triceps',test:/extension triceps|push.?down|barre au front|triceps/i},
    {id:'back',label:'Dos',test:/rowing|tirage horizontal|tirage vertical|lat pulldown|traction|pull.?up|deadlift|soulevé de terre/i},
    {id:'abs',label:'Abdominaux',test:/crunch|gainage|relevé de jambes|abdominaux|abdos/i},
    {id:'quads',label:'Quadriceps',test:/squat|presse à cuisses|leg press|hack squat|extension jambes|leg extension|quadriceps/i},
    {id:'hamstrings',label:'Ischio-jambiers',test:/leg curl|ischio|curl jambes|soulevé de terre|romanian deadlift|hip hinge/i},
    {id:'glutes',label:'Fessiers',test:/squat|soulevé de terre|deadlift|hip thrust|fessier|glute bridge/i},
    {id:'calves',label:'Mollets',test:/mollets|calf raise/i}
  ];
  const el=(tag,cls,text)=>{
    const node=root.document.createElement(tag);
    if(cls)node.className=cls;
    if(text!==undefined)node.textContent=text;
    return node;
  };
  const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
  function collect(state){
    const now=Date.now();
    const stats=GROUPS.map(group=>({id:group.id,label:group.label,last:0,sets7d:0,sets72:0,highEffort:false}));
    (state.seances||[]).forEach(session=>{
      const time=Number(session.debut||session.date||0);
      if(!Number.isFinite(time)||time<=0||time>now+5*60*1000)return;
      (session.exercices||[]).forEach(item=>{
        const exercise=FM.EX&&FM.EX[item.exId];
        const name=exercise&&exercise.nom;
        if(!name)return;
        const sets=(item.series||[]).filter(set=>set.fait&&Number(set.reps)>0&&set.type!=='echauffement');
        if(!sets.length)return;
        const matches=GROUPS.filter(group=>group.test.test(name));
        matches.forEach(group=>{
          const stat=stats.find(entry=>entry.id===group.id);
          stat.last=Math.max(stat.last,time);
          const age=now-time;
          if(age<=7*DAY)stat.sets7d+=sets.length;
          if(age<=3*DAY){
            stat.sets72+=sets.length;
            if(sets.some(set=>(Number.isFinite(set.rpe)&&set.rpe>=9)||(Number.isFinite(set.rir)&&set.rir<=1)))stat.highEffort=true;
          }
        });
      });
    });
    return stats.map(stat=>{
      if(!stat.last)return Object.assign(stat,{hours:null,target:48,readiness:0,remaining:null,state:'empty',label:'Pas encore de données',lastLabel:'Aucune séance enregistrée'});
      const hours=Math.max(0,(now-stat.last)/3600000);
      const target=clamp(48+(stat.sets72>=10?24:stat.sets72>=6?12:0)+(stat.highEffort?12:0),48,84);
      const readiness=clamp(hours/target*100,0,100);
      const remaining=Math.max(0,Math.ceil(target-hours));
      const stateName=hours<24?'fresh':hours<target?'recovering':'ready';
      const label=stateName==='fresh'?'Récupération récente':stateName==='recovering'?'En récupération':'Disponible selon l’estimation';
      const lastLabel=hours<1?'Il y a moins d’une heure':hours<24?'Il y a '+Math.floor(hours)+' h':'Il y a '+Math.floor(hours/24)+' j';
      return Object.assign(stat,{hours,target,readiness,remaining,state:stateName,label,lastLabel});
    });
  }
  function muscleCard(stat){
    const card=el('article','forge-recovery-muscle forge-recovery-'+stat.state);
    const head=el('div','forge-recovery-card-head');
    head.append(el('strong','',stat.label),el('span','forge-recovery-state',stat.label));
    const bar=el('div','forge-recovery-track');
    const fill=el('i','');
    fill.style.width=stat.readiness+'%';
    bar.append(fill);
    const details=el('div','forge-recovery-details');
    details.append(el('span','',stat.lastLabel),el('span','',stat.sets7d+' série(s) validée(s) sur 7 jours'));
    const estimate=stat.remaining===null?'Enregistre des séances pour obtenir une estimation.':stat.remaining>0?'Encore environ '+stat.remaining+' h selon le modèle.':'Le délai indicatif est atteint ; écoute aussi tes sensations.';
    card.append(head,bar,details,el('p','forge-recovery-estimate',estimate));
    if(stat.sets72>=10||stat.highEffort)card.append(el('small','forge-recovery-warning','Volume ou effort récent élevé : privilégie la technique et ajuste selon ta fatigue.'));
    return card;
  }
  FM.vues.recuperation=function(app){
    const stats=collect(app.etat||{});
    const page=el('div','forge-page forge-recovery-page');
    const header=el('header','forge-recovery-header');
    header.append(el('p','surtitre','RÉCUPÉRATION'),el('h1','','Récupération musculaire'));
    header.append(el('p','discret','Une estimation par groupe musculaire, basée sur tes séries validées et le temps écoulé depuis tes dernières séances.'));
    const grid=el('div','forge-recovery-grid');
    stats.forEach(stat=>grid.append(muscleCard(stat)));
    const forgotten=stats.filter(stat=>stat.sets7d===0);
    const neglected=el('aside','forge-recovery-neglected');
    if(stats.some(stat=>stat.last)&&forgotten.length){
      neglected.append(el('strong','','Groupes peu sollicités cette semaine'),el('p','',forgotten.map(stat=>stat.label).join(' · ')));
    }
    const note=el('aside','forge-recovery-note');
    note.append(el('strong','','À savoir'),el('p','','Ce calcul est indicatif, pas une mesure physiologique ou médicale. Il ne connaît pas ton sommeil, ton stress, tes douleurs ni toute ta fatigue. La récupération varie selon les personnes et les exercices. Ne retravaille pas intensément un muscle douloureux ou insuffisamment récupéré.'));
    const links=el('div','forge-recovery-links');
    const programme=el('a','btn primaire','Voir mon programme');programme.href='#/programme';
    const statsLink=el('a','btn','Voir mes statistiques');statsLink.href='#/suivi/progres';
    links.append(programme,statsLink);
    page.append(header,grid);
    if(stats.some(stat=>stat.last)&&forgotten.length)page.append(neglected);
    page.append(note,links);
    return page;
  };
})(window);
