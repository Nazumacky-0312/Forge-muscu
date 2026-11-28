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
  const AVATAR_ACCENT='#c5f36b',AVATAR_BASE='#87939d';
  function avatar3D(ranked,settings){
    const rankByMuscle={};
    MUSCLES.forEach(m=>{const score=ranked.filter(x=>m.test.test(x.name)).reduce((n,x)=>Math.max(n,x.score),0);rankByMuscle[m.id]=score?getRank(score).index:-1;});
    rankByMuscle.forearms=Math.max(rankByMuscle.biceps??-1,rankByMuscle.triceps??-1);
    rankByMuscle.obliques=rankByMuscle.abs??-1;
    rankByMuscle.traps=Math.max(rankByMuscle.shoulders??-1,rankByMuscle.back??-1);
    const initialSex=settings.sex==='f'?'f':'m';
    const color=id=>(rankByMuscle[id]??-1)>=0?AVATAR_ACCENT:AVATAR_BASE;
    const figure=(side,sex)=>{
      const female=sex==='f';
      const back=side==='back';
      const body=female
        ? 'M73 43 Q85 39 97 43 L106 56 Q115 65 111 82 L103 119 Q99 132 108 148 Q111 161 105 179 L99 222 L104 274 Q105 284 96 287 L88 286 Q83 282 85 270 L83 226 L80 180 L77 226 L75 270 Q77 282 70 286 L62 287 Q54 284 57 274 L62 222 L56 179 Q51 161 62 148 Q71 132 67 119 L59 82 Q55 65 64 56Z'
        : 'M69 43 Q85 37 101 43 L111 55 Q121 64 116 82 L106 119 Q102 134 109 149 Q113 163 106 180 L101 222 L105 274 Q106 284 97 287 L89 286 Q84 282 86 270 L84 226 L80 180 L76 226 L74 270 Q76 282 69 286 L61 287 Q52 284 55 274 L59 222 L54 180 Q47 163 61 149 Q68 134 64 119 L54 82 Q49 64 59 55Z';
      const arms='M61 55 Q51 54 46 67 L37 111 Q33 129 39 140 Q43 144 48 137 L59 101 L70 78Z M109 55 Q119 54 124 67 L133 111 Q137 129 131 140 Q127 144 122 137 L111 101 L100 78Z';
      const hands='M38 135 Q32 139 34 150 L38 162 Q43 166 47 158 L48 140Z M132 135 Q138 139 136 150 L132 162 Q127 166 123 158 L122 140Z';
      const base='<defs><linearGradient id="skin'+side+sex+'" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#f4f6f8"/><stop offset=".48" stop-color="#cbd3dc"/><stop offset="1" stop-color="#8f9ba8"/></linearGradient><linearGradient id="muscle'+side+sex+'" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".34"/><stop offset=".48" stop-color="#ffffff" stop-opacity=".04"/><stop offset="1" stop-color="#101820" stop-opacity=".28"/></linearGradient><filter id="shadow'+side+sex+'" x="-30%" y="-15%" width="160%" height="140%"><feGaussianBlur stdDeviation="3"/></filter></defs><ellipse cx="85" cy="292" rx="43" ry="5" fill="#05090e" opacity=".34" filter="url(#shadow'+side+sex+')"/><circle class="bf-base" cx="85" cy="25" r="13"/><path class="bf-base" d="M78 37 L92 37 L94 49 L76 49Z"/><path class="bf-base" d="'+body+'"/><path class="bf-base" d="'+arms+'"/><path class="bf-base" d="'+hands+'"/>';
      const frontMuscles='<g class="bf-muscles"><path fill="'+color('shoulders')+'" d="M62 57 Q69 54 75 61 L72 76 Q63 83 56 73Z M108 57 Q101 54 95 61 L98 76 Q107 83 114 73Z"/><path fill="'+color('chest')+'" d="M70 66 Q78 61 84 68 L84 87 Q75 92 67 83 Q63 74 70 66Z M100 66 Q92 61 86 68 L86 87 Q95 92 103 83 Q107 74 100 66Z"/><path fill="'+color('biceps')+'" d="M48 79 Q56 76 60 88 L55 113 Q49 120 44 108Z M122 79 Q114 76 110 88 L115 113 Q121 120 126 108Z"/><path fill="'+color('forearms')+'" d="M40 111 Q47 112 52 119 L47 143 Q41 148 37 138Z M130 111 Q123 112 118 119 L123 143 Q129 148 133 138Z"/><path fill="'+color('abs')+'" d="M77 91 Q85 87 93 91 L94 130 Q85 136 76 130Z"/><path fill="'+color('obliques')+'" d="M68 91 L76 94 L74 126 L66 120Z M102 91 L94 94 L96 126 L104 120Z"/><path fill="'+color('quads')+'" d="M65 151 Q75 146 83 156 L81 211 Q75 224 68 211 L61 177Z M105 151 Q95 146 87 156 L89 211 Q95 224 102 211 L109 177Z"/><path fill="'+color('calves')+'" d="M64 224 Q72 219 80 229 L77 267 Q72 277 65 265Z M106 224 Q98 219 90 229 L93 267 Q98 277 105 265Z"/></g>';
      const backMuscles='<g class="bf-muscles"><path fill="'+color('traps')+'" d="M73 49 Q85 44 97 49 L106 72 L85 94 L64 72Z"/><path fill="'+color('shoulders')+'" d="M62 57 Q69 54 75 61 L72 76 Q63 83 56 73Z M108 57 Q101 54 95 61 L98 76 Q107 83 114 73Z"/><path fill="'+color('back')+'" d="M68 77 Q76 73 84 88 L80 129 Q69 127 63 105Z M102 77 Q94 73 86 88 L90 129 Q101 127 107 105Z"/><path fill="'+color('triceps')+'" d="M48 79 Q56 76 60 88 L55 113 Q49 120 44 108Z M122 79 Q114 76 110 88 L115 113 Q121 120 126 108Z"/><path fill="'+color('forearms')+'" d="M40 111 Q47 112 52 119 L47 143 Q41 148 37 138Z M130 111 Q123 112 118 119 L123 143 Q129 148 133 138Z"/><path fill="'+color('glutes')+'" d="M67 132 Q85 126 103 132 L101 157 Q85 168 69 157Z"/><path fill="'+color('hamstrings')+'" d="M64 161 Q74 157 82 166 L80 215 Q74 227 67 215 L60 183Z M106 161 Q96 157 88 166 L90 215 Q96 227 103 215 L110 183Z"/><path fill="'+color('calves')+'" d="M64 224 Q72 219 80 229 L77 267 Q72 277 65 265Z M106 224 Q98 219 90 229 L93 267 Q98 277 105 265Z"/></g>';
      const detail=back
        ? '<g class="bf-contours"><path d="M85 57 L85 128 M67 82 Q85 91 103 82 M69 136 Q85 144 101 136 M74 165 Q85 171 96 165" /><path d="M78 94 Q85 101 92 94 M76 111 Q85 117 94 111"/></g>'
        : '<g class="bf-contours"><path d="M85 68 L85 88 M73 92 Q85 96 97 92 M85 96 L85 128 M78 104 L78 125 M92 104 L92 125 M72 151 Q85 157 98 151" /><path d="M70 67 Q78 64 84 70 M100 67 Q92 64 86 70"/></g>';
      return '<svg class="forge-bodygraph-figure" viewBox="0 0 170 302" role="img" aria-label="'+(back?'Vue de dos':'Vue de face')+' du corps '+(female?'féminin':'masculin')+'">'+base+(back?backMuscles:frontMuscles)+detail+'<path class="bf-highlight" d="'+body+'" fill="url(#muscle'+side+sex+')" /></svg>';
    };
    const initialButtons=h('div',{class:'forge-avatar-switch','aria-label':'Choisir le personnage'},
      h('button',{type:'button',class:'forge-avatar-choice'+(initialSex==='m'?' active':''),'data-sex':'m'},'Homme'),
      h('button',{type:'button',class:'forge-avatar-choice'+(initialSex==='f'?' active':''),'data-sex':'f'},'Femme'));
    const figures=h('div',{class:'forge-bodygraph-pair'});
    const draw=sex=>{figures.innerHTML='<div class="forge-bodygraph-person">'+figure('front',sex)+'<span>AVANT</span></div><div class="forge-bodygraph-person">'+figure('back',sex)+'<span>ARRIÈRE</span></div>';};
    draw(initialSex);
    const stage=h('div',{class:'forge-avatar-3d-stage','aria-label':'Avatar musculaire 3D interactif'});
    const muscleDetails=h('div',{class:'forge-avatar-muscle-details','aria-live':'polite'},
      h('span',{class:'surtitre'},'ANALYSE MUSCULAIRE'),
      h('h3',{},'Sélectionne un muscle'),
      h('p',{class:'discret'},'Quand le modèle 3D est chargé, touche un groupe musculaire pour afficher ses performances enregistrées.'));
    const viewControls=h('div',{class:'forge-avatar-3d-views','aria-label':'Orientation de l’avatar'},
      h('button',{type:'button',class:'forge-avatar-choice active','data-view':'front'},'Vue de face'),
      h('button',{type:'button',class:'forge-avatar-choice','data-view':'back'},'Vue de dos'));
    const legend='<span class="forge-avatar-legend-item"><i style="background:'+AVATAR_ACCENT+'"></i>Muscles suivis</span><span class="forge-avatar-legend-item"><i style="background:'+AVATAR_BASE+'"></i>À développer</span>';
    const section=h('section',{class:'carte forge-avatar-card forge-bodygraph-card forge-bodygraph-depth'},
      h('div',{class:'forge-card-head'},h('div',{},h('span',{class:'surtitre'},'BODYGRAPH'),h('h2',{},'Tes muscles')),
        h('span',{class:'forge-tag'},'AVATAR 3D')),
      h('p',{class:'discret'},'Fais glisser le modèle pour le faire pivoter. Utilise les vues avant et arrière pour observer les muscles suivis, mis en évidence dans une couleur unique.'),
      h('div',{class:'forge-avatar-controls'},initialButtons),
      stage,
      viewControls,
      muscleDetails,
      figures,
      h('div',{class:'forge-avatar-legend',innerHTML:legend}),
      h('p',{class:'forge-avatar-attribution'},'Anatomy: BodyParts3D © The Database Center for Life Science (CC BY 4.0); female organs: Human Reference Atlas 3D Reference Organs, HuBMAP (CC BY 4.0); female body: MakeHuman (CC0). Modified by open-anatomy-3d (github.com/MervinR07/open-anatomy-3d), CC BY 4.0. Illustration pédagogique, non destinée au diagnostic.'));
    let avatarApi=null,selectedSex=initialSex,mountScheduled=false;
    const ranksForModel={...rankByMuscle,upperarms:Math.max(rankByMuscle.biceps??-1,rankByMuscle.triceps??-1)};
    const mount3D=()=>{
      if(!root.ForgeAvatar3D||avatarApi)return;
      if(!stage.isConnected){
        if(!mountScheduled){
          mountScheduled=true;
          root.requestAnimationFrame(()=>{mountScheduled=false;if(stage.isConnected)mount3D();});
        }
        return;
      }
      try{avatarApi=root.ForgeAvatar3D.mount(stage,{sex:selectedSex,ranks:ranksForModel});}
      catch(error){console.warn('Forge Muscu — avatar 3D indisponible :',error);}
    };
    const stageObserver=new MutationObserver(()=>{
      if(stage.dataset.avatarLoaded==='true')section.classList.add('is-3d-ready');
    });
    stageObserver.observe(stage,{attributes:true,attributeFilter:['data-avatar-loaded']});
    if(root.ForgeAvatar3D)mount3D();
    else root.addEventListener('forge-avatar-ready',mount3D,{once:true});
    section.querySelectorAll('[data-sex]').forEach(button=>button.addEventListener('click',()=>{
      section.querySelectorAll('[data-sex]').forEach(b=>b.classList.toggle('active',b===button));
      selectedSex=button.dataset.sex;
      draw(selectedSex);
      avatarApi?.setSex(selectedSex);
    }));
    section.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{
      section.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b===button));
      avatarApi?.setView(button.dataset.view);
    }));
    stage.addEventListener('forge-muscle-select',event=>{
      const group=event.detail?.muscle||'';
      const labels={chest:'Pectoraux',shoulders:'Épaules',biceps:'Biceps',triceps:'Triceps',back:'Dos',abs:'Abdominaux',quads:'Quadriceps',hamstrings:'Ischio-jambiers',glutes:'Fessiers',calves:'Mollets',forearms:'Avant-bras',traps:'Trapèzes',upperarms:'Bras'};
      const related=group==='upperarms'?MUSCLES.filter(m=>m.id==='biceps'||m.id==='triceps'):MUSCLES.filter(m=>m.id===group);
      const entries=ranked.filter(x=>related.some(m=>m.test.test(x.name)));
      const best=entries[0],label=labels[group]||'Muscle sélectionné';
      muscleDetails.replaceChildren(
        h('div',{class:'forge-avatar-muscle-detail-head'},
          h('div',{},h('span',{class:'surtitre'},'GROUPE SÉLECTIONNÉ'),h('h3',{},label)),
          h('strong',{},best?best.rank.name:'Non classé')),
        h('p',{class:'discret'},best?'Meilleure performance : '+best.name+' · 1RM estimé '+best.oneRm.toFixed(1)+' kg · '+best.score+'/1000 points.':'Aucune performance classée n’est encore enregistrée pour ce groupe. Continue à enregistrer tes séries de travail pour le suivre.'),
        entries.length?h('ul',{class:'forge-avatar-muscle-exercises'},...entries.slice(0,3).map(x=>h('li',{},h('span',{},x.name),h('strong',{},x.rank.name+' · '+x.oneRm.toFixed(1)+' kg')))):h('p',{class:'discret'},'Les muscles sollicités indirectement ne sont pas assimilés à des performances directes.'));
    });
    const cleanupObserver=new MutationObserver(()=>{
      if(!section.isConnected){
        avatarApi?.dispose();
        stageObserver.disconnect();
        cleanupObserver.disconnect();
      }
    });
    cleanupObserver.observe(root.document.body,{childList:true,subtree:true});
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
