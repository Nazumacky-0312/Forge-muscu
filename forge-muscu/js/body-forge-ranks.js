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
  /* Repères moyens estimés par rapport au poids de corps.
     100 % du repère = Gold. Ce sont des références Forge, pas une statistique mondiale mesurée. */
  const PROFILES=[
    {re:/développé couché|bench press|chest press|presse poitrine/i,label:'Poussée horizontale',avgM:.60,avgF:.35},
    {re:/squat|presse à cuisses|leg press|hack squat/i,label:'Jambes',avgM:.90,avgF:.60},
    {re:/soulevé de terre|deadlift|trap bar/i,label:'Soulevé de terre',avgM:1.10,avgF:.70},
    {re:/développé militaire|shoulder press|overhead press|développé épaules/i,label:'Poussée verticale',avgM:.35,avgF:.22},
    {re:/rowing|tirage horizontal|barbell row|seated row/i,label:'Tirage horizontal',avgM:.55,avgF:.35},
    {re:/tirage vertical|lat pulldown|traction|pull.?up/i,label:'Tirage vertical',avgM:.60,avgF:.40},
    {re:/curl biceps|curl barre|curl haltères|biceps/i,label:'Biceps',avgM:.18,avgF:.12},
    {re:/extension triceps|push.?down|barre au front|triceps/i,label:'Triceps',avgM:.16,avgF:.11},
    {re:/élévation latérale|lateral raise/i,label:'Épaules',avgM:.10,avgF:.07},
    {re:/leg curl|ischio|curl jambes/i,label:'Ischio-jambiers',avgM:.30,avgF:.22},
    {re:/extension jambes|leg extension|quadriceps/i,label:'Quadriceps',avgM:.40,avgF:.28},
    {re:/crunch|gainage|relevé de jambes|abdominaux|abdos/i,label:'Abdominaux',avgM:.20,avgF:.14},
    {re:/mollets|calf raise/i,label:'Mollets',avgM:.30,avgF:.22}
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
        const averageRatio=settings.sex==='f'?profile.avgF:profile.avgM;
        const benchmark=settings.weight*averageRatio;
        /* 100 % du repère moyen = 400 points, donc rang Gold. */
        const relative=one/benchmark;
        const score=Math.max(1,Math.min(1000,Math.round(relative*400)));
        const old=best.get(item.exId);
        if(!old||score>old.score)best.set(item.exId,{id:item.exId,name,profile:profile.label,oneRm:one,score,ratio,benchmark,relative});
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
  function avatar3D(ranked,settings){
    const rankByMuscle={};
    MUSCLES.forEach(m=>{const score=ranked.filter(x=>m.test.test(x.name)).reduce((n,x)=>Math.max(n,x.score),0);rankByMuscle[m.id]=score?getRank(score).index:-1;});
    rankByMuscle.forearms=Math.max(rankByMuscle.biceps??-1,rankByMuscle.triceps??-1);
    rankByMuscle.obliques=rankByMuscle.abs??-1;
    rankByMuscle.traps=Math.max(rankByMuscle.shoulders??-1,rankByMuscle.back??-1);
    const initialSex=settings.sex==='f'?'f':'m';
    const color=id=>RANK_COLORS[Math.max(0,rankByMuscle[id]??-1)]||'#d4dae3';
    const figure=(side,sex)=>{
      const female=sex==='f';
      const torso=female
        ?'M70 49 Q85 44 100 49 L108 75 L102 119 Q101 132 108 146 L62 146 Q69 132 68 119 L62 75Z'
        :'M66 49 Q85 43 104 49 L112 75 L106 120 Q101 137 96 147 L74 147 Q69 137 64 120 L58 75Z';
      const legs=female
        ?'M65 141 Q60 155 64 180 L70 222 L67 271 Q66 283 74 285 L82 285 Q87 281 85 271 L89 224 L92 180 Q94 156 105 141Z'
        :'M72 141 Q63 155 66 180 L70 222 L67 271 Q66 283 74 285 L82 285 Q87 281 85 271 L89 224 L94 180 Q96 155 98 141Z';
      const arms='<path class="bf-base" d="M62 54 C51 55 46 66 43 82 L35 126 Q33 137 40 140 Q47 141 50 131 L62 94 L73 77Z"/><path class="bf-base" d="M108 54 C119 55 124 66 127 82 L135 126 Q137 137 130 140 Q123 141 120 131 L108 94 L97 77Z"/>';
      const base='<circle class="bf-base" cx="85" cy="25" r="13"/><path class="bf-base" d="M78 37 L92 37 L94 52 L76 52Z"/><path class="bf-base" d="'+torso+'"/>'+arms+'<path class="bf-base" d="'+legs+'"/><path class="bf-base" d="M67 278 Q72 274 82 279 L83 291 Q78 296 65 294 Q61 291 67 278Z M88 279 Q98 274 103 278 L109 294 Q96 296 87 291Z"/>';
      const muscles=side==='front'
        ?'<g class="bf-muscles"><ellipse fill="'+color('shoulders')+'" cx="62" cy="61" rx="11" ry="10"/><ellipse fill="'+color('shoulders')+'" cx="108" cy="61" rx="11" ry="10"/><path fill="'+color('chest')+'" d="M69 66 Q84 61 84 81 Q78 91 68 84 Q63 77 69 66Z M101 66 Q86 61 86 81 Q92 91 102 84 Q107 77 101 66Z"/><path fill="'+color('biceps')+'" d="M48 82 Q57 80 60 91 L55 115 Q48 119 45 109Z M122 82 Q113 80 110 91 L115 115 Q122 119 125 109Z"/><path fill="'+color('abs')+'" d="M77 91 Q85 88 93 91 L94 129 Q85 134 76 129Z"/><path fill="'+color('quads')+'" d="M70 151 Q79 147 84 157 L82 210 Q77 220 72 211 L67 179Z M100 151 Q91 147 86 157 L88 210 Q93 220 98 211 L103 179Z"/><path fill="'+color('calves')+'" d="M71 225 Q78 221 82 229 L79 268 Q75 275 70 266Z M99 225 Q92 221 88 229 L91 268 Q95 275 100 266Z"/></g>'
        :'<g class="bf-muscles"><path fill="'+color('traps')+'" d="M72 53 Q85 47 98 53 L105 77 L85 94 L65 77Z"/><ellipse fill="'+color('shoulders')+'" cx="61" cy="62" rx="11" ry="10"/><ellipse fill="'+color('shoulders')+'" cx="109" cy="62" rx="11" ry="10"/><path fill="'+color('back')+'" d="M67 80 Q76 75 84 92 L80 129 Q69 126 64 105Z M103 80 Q94 75 86 92 L90 129 Q101 126 106 105Z"/><path fill="'+color('triceps')+'" d="M47 83 Q55 79 60 92 L54 116 Q47 119 44 108Z M123 83 Q115 79 110 92 L116 116 Q123 119 126 108Z"/><path fill="'+color('glutes')+'" d="M70 132 Q85 127 100 132 L98 158 Q85 166 72 158Z"/><path fill="'+color('hamstrings')+'" d="M70 161 Q79 157 84 166 L82 215 Q77 225 72 215 L67 184Z M100 161 Q91 157 86 166 L88 215 Q93 225 98 215 L103 184Z"/><path fill="'+color('calves')+'" d="M71 226 Q78 222 82 230 L79 268 Q75 275 70 266Z M99 226 Q92 222 88 230 L91 268 Q95 275 100 266Z"/></g>';
      return '<svg class="forge-bodygraph-figure" viewBox="0 0 170 302" role="img" aria-label="'+(side==='front'?'Vue de face':'Vue de dos')+' du corps '+(female?'féminin':'masculin')+'">'+base+muscles+'</svg>';
    };
    const initialButtons=h('div',{class:'forge-avatar-switch','aria-label':'Choisir le personnage'},
      h('button',{type:'button',class:'forge-avatar-choice'+(initialSex==='m'?' active':''),'data-sex':'m'},'Homme'),
      h('button',{type:'button',class:'forge-avatar-choice'+(initialSex==='f'?' active':''),'data-sex':'f'},'Femme'));
    const figures=h('div',{class:'forge-bodygraph-pair'});
    const draw=sex=>{figures.innerHTML='<div class="forge-bodygraph-person">'+figure('front',sex)+'<span>AVANT</span></div><div class="forge-bodygraph-person">'+figure('back',sex)+'<span>ARRIÈRE</span></div>';};
    draw(initialSex);
    const legend=RANKS.map((r,i)=>'<span class="forge-avatar-legend-item"><i style="background:'+RANK_COLORS[i]+'"></i>'+r.name+'</span>').join('');
    const section=h('section',{class:'carte forge-avatar-card forge-bodygraph-card'},
      h('div',{class:'forge-card-head'},h('div',{},h('span',{class:'surtitre'},'BODYGRAPH'),h('h2',{},'Tes muscles')),
        h('span',{class:'forge-tag'},'VUE SIMPLIFIÉE')),
      h('p',{class:'discret'},'Repère rapidement tes groupes musculaires et leurs rangs, avec une silhouette claire de face et de dos.'),
      h('div',{class:'forge-avatar-controls'},initialButtons),
      figures,
      h('div',{class:'forge-avatar-legend',innerHTML:legend}));
    section.querySelectorAll('[data-sex]').forEach(button=>button.addEventListener('click',()=>{
      section.querySelectorAll('[data-sex]').forEach(b=>b.classList.toggle('active',b===button));
      draw(button.dataset.sex);
    }));
    return section;
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
      h('p',{class:'discret'},'Chaque exercice est comparé à un repère moyen estimé selon ton poids de corps et ton profil. Atteindre ce repère correspond à Gold ; dépasser ce niveau fait monter ton rang.'),
      card(h('div',{class:'forge-body-overall'},
        h('div',{class:'forge-body-overall-icon'},overall.icon),
        h('div',{class:'forge-body-overall-main'},h('span',{class:'surtitre'},'RANG GÉNÉRAL'),h('h2',{},ranked.length?overall.name:'Pas encore classé'),h('strong',{},ranked.length?overallScore+'/1000':'—')),
        h('div',{class:'forge-body-overall-lp'},h('b',{},ranked.length?overall.lp+' LP':'0 LP'),h('span',{},'dans ce rang'))),
        h('div',{class:'forge-body-progress'},h('i',{style:'width:'+overall.progress+'%'})),
        h('div',{class:'forge-body-progress-label'},h('span',{},overall.next?'Progression vers '+overall.next.name:'Rang maximum'),h('b',{},overall.next?Math.max(0,100-overall.lp)+' LP':'MAX')),
        h('p',{class:'discret'},ranked.length?'Rang général calculé à partir de tes cinq meilleurs exercices. Gold correspond au repère moyen Forge estimé.':'Ajoute ton poids de corps et ton profil, puis valide des séries de travail pour obtenir tes premiers rangs.')),
      avatar3D(ranked,settings),
      card(h('div',{class:'forge-card-head'},h('h2',{},'Tes rangs par exercice'),h('span',{class:'forge-tag'},ranked.length+' CLASSÉ(S)')),
        ranked.length?h('div',{class:'forge-body-exercise-list'},...ranked.map(x=>h('div',{class:'forge-body-exercise'},
          h('div',{class:'forge-body-exercise-icon'},x.rank.icon),
          h('div',{class:'forge-body-exercise-info'},h('strong',{},x.name),h('span',{},x.profile+' · 1RM '+x.oneRm.toFixed(1)+' kg · repère Gold '+x.benchmark.toFixed(1)+' kg · '+Math.round(x.relative*100)+' % du repère'),h('div',{class:'forge-body-mini-track'},h('i',{style:'width:'+x.rank.progress+'%'}))),
          h('div',{class:'forge-body-exercise-result'},h('b',{},x.rank.name),h('strong',{},x.rank.lp+' LP'))))):h('p',{class:'discret'},'Aucun rang pour le moment. Les rangs apparaîtront dès que tu auras enregistré des séries de travail sur les exercices compatibles.')),
      card(h('div',{class:'forge-card-head'},h('h2',{},'Ton profil de force'),h('span',{class:'forge-tag'},'CONFIGURATION')),
        h('p',{class:'discret'},'Le poids de corps et le sexe servent à contextualiser les performances, comme dans Liftoff. Ils restent enregistrés sur cet appareil.'),
        h('form',{class:'forge-body-settings'},
          h('label',{},'Poids de corps (kg)',h('input',{name:'weight',type:'number',min:'25',max:'300',step:'0.1',inputmode:'decimal',required:true,value:settings.weight||'' ,placeholder:'Ex. 70'})),
          h('label',{},'Référence de classement',h('select',{name:'sex'},h('option',{value:'',selected:!settings.sex},'Choisir'),h('option',{value:'m',selected:settings.sex==='m'},'Homme'),h('option',{value:'f',selected:settings.sex==='f'},'Femme'))),
          h('button',{class:'btn primaire geant',type:'submit'},'Enregistrer mon profil'))),
      card(h('h2',{},'Les 9 rangs'),h('div',{class:'forge-body-rank-ladder'},...RANKS.map(r=>h('div',{class:'forge-body-rank-step'+(ranked.length&&overall.index===RANKS.indexOf(r)?' current':'')},h('span',{},r.icon),h('b',{},r.name),h('small',{},r.name==='Wood'?'0–199':r.min+'–'+r.max),h('i',{},ranked.length&&overall.index>RANKS.indexOf(r)?'✓':' '))))),
      h('p',{class:'forge-body-method-note'},'Gold correspond à 100 % du repère moyen Forge estimé pour ton poids de corps et ton profil. Les autres rangs évoluent par paliers au-dessus ou en dessous. Ces repères sont des estimations de référence, pas une moyenne mondiale mesurée : les données mondiales complètes ne sont pas publiquement disponibles. Les charges des machines peuvent aussi varier selon les modèles.'));
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
  if(root.FM.app&&typeof root.FM.app.rendre==='function')root.FM.app.rendre();
})(typeof window!=='undefined'?window:globalThis);
