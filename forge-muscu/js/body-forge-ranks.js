/* Body Forge — rangs de force par exercice et rang général. */
(function(root){
  'use strict';
  const FM=root.FM,h=FM.h;
  if(!FM||!FM.vues)return;
  const KEY='forge-body-rank-settings-v1';
  const RANKS=[
    {name:'Wood',min:0,max:199,icon:'🪵'},
    {name:'Bronze',min:200,max:299,icon:'🥉'},
    {name:'Silver',min:300,max:399,icon:'🥈'},
    {name:'Gold',min:400,max:499,icon:'🥇'},
    {name:'Platinum',min:500,max:599,icon:'💠'},
    {name:'Diamond',min:600,max:699,icon:'💎'},
    {name:'Champion',min:700,max:799,icon:'🏆'},
    {name:'Titan',min:800,max:899,icon:'⚡'},
    {name:'Olympian',min:900,max:1000,icon:'👑'}
  ];
  /* Coefficients Forge indicatifs : les courbes propriétaires de Liftoff ne sont pas publiques. */
  const PROFILES=[
    {re:/développé couché|bench press|chest press|presse poitrine/i,factor:400,label:'Poussée horizontale'},
    {re:/squat|presse à cuisses|leg press|hack squat/i,factor:330,label:'Jambes'},
    {re:/soulevé de terre|deadlift|trap bar/i,factor:300,label:'Soulevé de terre'},
    {re:/développé militaire|shoulder press|overhead press|développé épaules/i,factor:750,label:'Poussée verticale'},
    {re:/rowing|tirage horizontal|barbell row|seated row/i,factor:420,label:'Tirage horizontal'},
    {re:/tirage vertical|lat pulldown|traction|pull.?up/i,factor:450,label:'Tirage vertical'},
    {re:/curl biceps|curl barre|curl haltères|biceps/i,factor:1200,label:'Biceps'},
    {re:/extension triceps|push.?down|barre au front|triceps/i,factor:1200,label:'Triceps'},
    {re:/élévation latérale|lateral raise/i,factor:1800,label:'Épaules'},
    {re:/leg curl|ischio|curl jambes/i,factor:1200,label:'Ischio-jambiers'},
    {re:/extension jambes|leg extension|quadriceps/i,factor:1200,label:'Quadriceps'},
    {re:/mollets|calf raise/i,factor:1600,label:'Mollets'}
  ];
  const readSettings=()=>{
    try{const x=JSON.parse(root.localStorage.getItem(KEY)||'{}');return{weight:Number(x.weight)||0,sex:x.sex==='f'?'f':x.sex==='m'?'m':''};}
    catch(_){return{weight:0,sex:''};}
  };
  const saveSettings=x=>{try{root.localStorage.setItem(KEY,JSON.stringify(x));}catch(_){}};
  const getRank=score=>{let i=0;for(let n=0;n<RANKS.length;n++)if(score>=RANKS[n].min)i=n;const r=RANKS[i],next=RANKS[i+1]||null,lp=i===0?Math.floor(score/2):Math.floor(score-r.min);return{...r,index:i,next,lp:Math.max(0,Math.min(100,lp)),progress:next?Math.max(0,Math.min(100,i===0?score/200*100:(score-r.min)/(next.min-r.min)*100)):100};};
  const classify=name=>PROFILES.find(p=>p.re.test(name))||null;
  const estimate=(kg,reps)=>kg*(1+Math.min(30,reps)/30);
  function exerciseRanks(state,settings){
    const best=new Map();
    (state.seances||[]).forEach(session=>(session.exercices||[]).forEach(item=>{
      const ex=FM.EX&&FM.EX[item.exId],name=ex&&ex.nom;
      if(!name)return;
      const profile=classify(name);if(!profile)return;
      (item.series||[]).forEach(set=>{
        const kg=Number(set.kg),reps=Number(set.reps);
        if(!set.fait||set.type==='echauffement'||!Number.isFinite(kg)||kg<=0||!Number.isFinite(reps)||reps<1||reps>30)return;
        const one=estimate(kg,reps),ratio=one/settings.weight;
        if(!Number.isFinite(ratio)||ratio<=0)return;
        const sexFactor=settings.sex==='f'?1.12:1;
        const score=Math.max(1,Math.min(1000,Math.round(ratio*profile.factor*sexFactor)));
        const old=best.get(item.exId);
        if(!old||score>old.score)best.set(item.exId,{id:item.exId,name,profile:profile.label,oneRm:one,score,ratio});
      });
    }));
    return [...best.values()].sort((a,b)=>b.score-a.score).map(x=>({...x,rank:getRank(x.score)}));
  }
  function card(...children){return FM.carte(...children);}
  function bodyForge(app){
    const settings=readSettings(),ranked=exerciseRanks(app.etat,settings);
    const overallScore=ranked.length?Math.round(ranked.slice(0,5).reduce((n,x)=>n+x.score,0)/Math.min(5,ranked.length)):0;
    const overall=getRank(overallScore);
    const page=h('div',{class:'forge-page forge-body-ranks'},
      h('nav',{class:'forge-seance-tabs forge-rank-tabs','aria-label':'Classements'},
        h('a',{class:'forge-seance-tab',href:'#/classement'},'Rangs Forge'),
        h('a',{class:'forge-seance-tab active',href:'#/classement/body','aria-current':'page'},'Body Forge')),
      h('p',{class:'surtitre'},'TES PERFORMANCES · TON NIVEAU'),
      h('h1',{},'Body Forge'),
      h('p',{class:'discret'},'Chaque exercice possède son propre rang. Fais progresser tes performances pour faire monter ton rang général.'),
      card(h('div',{class:'forge-body-overall'},
        h('div',{class:'forge-body-overall-icon'},overall.icon),
        h('div',{class:'forge-body-overall-main'},h('span',{class:'surtitre'},'RANG GÉNÉRAL'),h('h2',{},ranked.length?overall.name:'Pas encore classé'),h('strong',{},ranked.length?overallScore+'/1000':'—')),
        h('div',{class:'forge-body-overall-lp'},h('b',{},ranked.length?overall.lp+' LP':'0 LP'),h('span',{},'dans ce rang'))),
        h('div',{class:'forge-body-progress'},h('i',{style:'width:'+overall.progress+'%'})),
        h('div',{class:'forge-body-progress-label'},h('span',{},overall.next?'Progression vers '+overall.next.name:'Rang maximum'),h('b',{},overall.next?Math.max(0,100-overall.lp)+' LP':'MAX')),
        h('p',{class:'discret'},ranked.length?'Calculé à partir de tes cinq meilleurs exercices classés.':'Ajoute ton poids de corps, puis valide des séries de travail pour obtenir tes premiers rangs.')),
      card(h('div',{class:'forge-card-head'},h('h2',{},'Tes rangs par exercice'),h('span',{class:'forge-tag'},ranked.length+' CLASSÉ(S)')),
        ranked.length?h('div',{class:'forge-body-exercise-list'},...ranked.map(x=>h('div',{class:'forge-body-exercise'},
          h('div',{class:'forge-body-exercise-icon'},x.rank.icon),
          h('div',{class:'forge-body-exercise-info'},h('strong',{},x.name),h('span',{},x.profile+' · 1RM estimé '+x.oneRm.toFixed(1)+' kg'),h('div',{class:'forge-body-mini-track'},h('i',{style:'width:'+x.rank.progress+'%'}))),
          h('div',{class:'forge-body-exercise-result'},h('b',{},x.rank.name),h('strong',{},x.rank.lp+' LP'))))):h('p',{class:'discret'},'Aucun rang pour le moment. Les rangs apparaîtront dès que tu auras enregistré des séries de travail sur les exercices compatibles.')),
      card(h('div',{class:'forge-card-head'},h('h2',{},'Ton profil de force'),h('span',{class:'forge-tag'},'CONFIGURATION')),
        h('p',{class:'discret'},'Le poids de corps et le sexe servent à contextualiser les performances, comme dans Liftoff. Ils restent enregistrés sur cet appareil.'),
        h('form',{class:'forge-body-settings'},
          h('label',{},'Poids de corps (kg)',h('input',{name:'weight',type:'number',min:'25',max:'300',step:'0.1',inputmode:'decimal',required:true,value:settings.weight||'' ,placeholder:'Ex. 70'})),
          h('label',{},'Référence de classement',h('select',{name:'sex'},h('option',{value:'',selected:!settings.sex},'Choisir'),h('option',{value:'m',selected:settings.sex==='m'},'Homme'),h('option',{value:'f',selected:settings.sex==='f'},'Femme'))),
          h('button',{class:'btn primaire geant',type:'submit'},'Enregistrer mon profil'))),
      card(h('h2',{},'Les 9 rangs'),h('div',{class:'forge-body-rank-ladder'},...RANKS.map(r=>h('div',{class:'forge-body-rank-step'+(ranked.length&&overall.index===RANKS.indexOf(r)?' current':'')},h('span',{},r.icon),h('b',{},r.name),h('small',{},r.name==='Wood'?'0–199':r.min+'–'+r.max),h('i',{},ranked.length&&overall.index>RANKS.indexOf(r)?'✓':' '))))),
      h('p',{class:'forge-body-method-note'},'Les rangs Forge utilisent un 1RM estimé avec la formule d’Epley et des coefficients indicatifs propres aux familles d’exercices. Les seuils exacts de Liftoff reposent sur ses données privées : Body Forge possède donc son propre barème, sans prétendre reproduire leur score officiel.'));
    const form=page.querySelector('.forge-body-settings');
    form.addEventListener('submit',ev=>{
      ev.preventDefault();const weight=Number(form.elements.weight.value),sex=form.elements.sex.value;
      if(weight<25||weight>300||!sex){FM.toast('Renseigne ton poids de corps et sélectionne une référence.');return;}
      saveSettings({weight,sex});app.rendre();FM.toast('Profil Body Forge enregistré.');
    });
    if(!settings.weight||!settings.sex)page.querySelector('.forge-body-settings').classList.add('needs-setup');
    return page;
  }
  const old=FM.vues.classement;
  FM.vues.classement=function(app,sub){return sub==='body'?bodyForge(app):old(app,sub);};
  FM.vues.rangs=FM.vues.classement;
})(typeof window!=='undefined'?window:globalThis);
