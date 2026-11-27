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

  const MUSCLES=[
    {id:'chest',label:'Pectoraux',test:/développé couché|bench press|chest press|presse poitrine|écarté|crossover/i},
    {id:'shoulders',label:'Épaules',test:/développé militaire|shoulder press|overhead press|développé épaules|élévation latérale|lateral raise/i},
    {id:'biceps',label:'Biceps',test:/curl biceps|curl barre|curl haltères|biceps/i},
    {id:'triceps',label:'Triceps',test:/extension triceps|push.?down|barre au front|triceps/i},
    {id:'back',label:'Dos',test:/rowing|tirage horizontal|barbell row|seated row|tirage vertical|lat pulldown|traction|pull.?up|soulevé de terre|deadlift/i},
    {id:'abs',label:'Abdominaux',test:/crunch|gainage|relevé de jambes|abdominaux/i},
    {id:'quads',label:'Quadriceps',test:/squat|presse à cuisses|leg press|hack squat|extension jambes|leg extension|quadriceps/i},
    {id:'hamstrings',label:'Ischio-jambiers',test:/leg curl|ischio|curl jambes|soulevé de terre/i},
    {id:'glutes',label:'Fessiers',test:/squat|soulevé de terre|deadlift|hip thrust|fessier/i},
    {id:'calves',label:'Mollets',test:/mollets|calf raise/i}
  ];
  const RANK_COLORS=['#8b929b','#b87945','#b9c0c9','#e4bd4c','#65c5c2','#59a8f4','#a17bf2','#f07855','#f4e3a0'];
  function muscleGraph(ranked){
    const scoreFor=m=>ranked.filter(x=>m.test.test(x.name)).reduce((n,x)=>Math.max(n,x.score),0);
    const colorFor=m=>scoreFor(m)?RANK_COLORS[getRank(scoreFor(m)).index]:'#39434d';
    const titleFor=m=>{const s=scoreFor(m);return m.label+' · '+(s?getRank(s).name:'Non classé');};
    const part=(id,d,extra='')=>{const m=MUSCLES.find(x=>x.id===id);return '<path class="forge-muscle-part '+extra+'" data-muscle="'+id+'" d="'+d+'" fill="'+colorFor(m)+'"><title>'+titleFor(m)+'</title></path>';};
    const front='<svg class="forge-avatar-svg" viewBox="0 0 220 390" role="img" aria-label="Personnage musculaire, vue de face">'+
      '<g class="forge-avatar-base" fill="#222b34" stroke="#66717d" stroke-width="2" stroke-linejoin="round">'+
      '<circle cx="110" cy="31" r="23"/><path d="M91 54 Q77 57 70 70 L54 125 Q50 140 61 146 L73 139 L84 105 L80 163 Q79 179 87 190 L83 257 L72 355 Q71 369 85 370 L98 367 L110 275 L122 367 L137 370 Q150 369 148 355 L137 257 L133 190 Q141 179 140 163 L136 105 L147 139 L159 146 Q170 140 166 125 L150 70 Q143 57 129 54 Q110 62 91 54Z"/></g>'+
      part('shoulders','M76 72 Q86 61 100 67 L97 94 Q83 101 70 91Z')+part('shoulders','M120 67 Q134 61 144 72 L150 91 Q137 101 123 94Z')+
      part('chest','M82 96 Q96 88 108 98 L108 127 Q94 135 80 119Z')+part('chest','M112 98 Q124 88 138 96 L140 119 Q126 135 112 127Z')+
      part('biceps','M68 100 Q77 94 83 105 L75 137 L65 139 Q60 124 68 100Z')+part('biceps','M137 105 Q143 94 152 100 Q160 124 155 139 L145 137Z')+
      part('triceps','M59 139 Q67 135 75 140 L70 165 L60 169 Q54 156 59 139Z')+part('triceps','M145 140 Q153 135 161 139 Q166 156 160 169 L150 165Z')+
      part('abs','M94 137 L108 133 L108 187 L91 183Z')+part('abs','M112 133 L126 137 L129 183 L112 187Z')+
      part('quads','M87 194 Q99 190 108 198 L103 267 L87 279 L82 253Z')+part('quads','M112 198 Q121 190 133 194 L138 253 L133 279 L117 267Z')+
      part('calves','M84 282 L101 277 L96 350 L82 351Z')+part('calves','M119 277 L136 282 L138 351 L124 350Z')+'</svg>';
    const back='<svg class="forge-avatar-svg" viewBox="0 0 220 390" role="img" aria-label="Personnage musculaire, vue de dos">'+
      '<g class="forge-avatar-base" fill="#222b34" stroke="#66717d" stroke-width="2" stroke-linejoin="round">'+
      '<circle cx="110" cy="31" r="23"/><path d="M91 54 Q77 57 70 70 L54 125 Q50 140 61 146 L73 139 L84 105 L80 163 Q79 179 87 190 L83 257 L72 355 Q71 369 85 370 L98 367 L110 275 L122 367 L137 370 Q150 369 148 355 L137 257 L133 190 Q141 179 140 163 L136 105 L147 139 L159 146 Q170 140 166 125 L150 70 Q143 57 129 54 Q110 62 91 54Z"/></g>'+
      part('shoulders','M76 72 Q86 61 100 67 L97 94 Q83 101 70 91Z')+part('shoulders','M120 67 Q134 61 144 72 L150 91 Q137 101 123 94Z')+
      part('back','M91 94 Q102 85 108 96 L108 177 Q96 185 85 169 L84 112Z')+part('back','M112 96 Q118 85 129 94 L136 112 L135 169 Q124 185 112 177Z')+
      part('biceps','M68 100 Q77 94 83 105 L75 137 L65 139 Q60 124 68 100Z')+part('biceps','M137 105 Q143 94 152 100 Q160 124 155 139 L145 137Z')+
      part('triceps','M59 139 Q67 135 75 140 L70 165 L60 169 Q54 156 59 139Z')+part('triceps','M145 140 Q153 135 161 139 Q166 156 160 169 L150 165Z')+
      part('glutes','M86 181 Q99 175 108 185 L108 222 Q93 226 84 207Z')+part('glutes','M112 185 Q121 175 134 181 L136 207 Q127 226 112 222Z')+
      part('hamstrings','M87 222 Q99 219 108 225 L103 280 L87 279 L82 253Z')+part('hamstrings','M112 225 Q121 219 133 222 L138 253 L133 279 L117 280Z')+
      part('calves','M84 282 L101 277 L96 350 L82 351Z')+part('calves','M119 277 L136 282 L138 351 L124 350Z')+'</svg>';
    const svgWrap=markup=>{const el=h('div',{class:'forge-avatar-svg-wrap'});el.innerHTML=markup;return el;};
    const legend=RANKS.map((r,i)=>'<span class="forge-avatar-legend-item"><i style="background:'+RANK_COLORS[i]+'"></i>'+r.name+'</span>').join('');
    const trained=MUSCLES.filter(m=>scoreFor(m)>0).length;
    return h('section',{class:'carte forge-avatar-card'},
      h('div',{class:'forge-card-head'},h('div',{},h('span',{class:'surtitre'},'BODYGRAPH'),h('h2',{},'Ton personnage')) ,h('span',{class:'forge-tag'},trained+'/'+MUSCLES.length+' GROUPES')),
      h('p',{class:'discret'},'Chaque zone prend la couleur du rang obtenu sur les exercices qui la sollicitent.'),
      h('div',{class:'forge-avatar-views'},h('div',{class:'forge-avatar-view'},h('span',{},'FACE'),svgWrap(front)),h('div',{class:'forge-avatar-view'},h('span',{},'DOS'),svgWrap(back))),
      h('div',{class:'forge-avatar-legend',innerHTML:legend}),
      h('div',{class:'forge-avatar-customize'},h('span',{},'PERSONNALISATION'),h('b',{},'Bientôt disponible'),h('small',{},'Style, apparence et équipements de ton personnage')) );
  }
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
      muscleGraph(ranked),
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
