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
    const host=h('div',{class:'forge-avatar-3d-canvas','aria-label':'Avatar musculaire 3D interactif'});
    const sexButtons=h('div',{class:'forge-avatar-switch','aria-label':'Choisir le personnage'},
      h('button',{type:'button',class:'forge-avatar-choice'+(initialSex==='m'?' active':''),'data-sex':'m'},'Homme'),
      h('button',{type:'button',class:'forge-avatar-choice'+(initialSex==='f'?' active':''),'data-sex':'f'},'Femme'));
    const viewButtons=h('div',{class:'forge-avatar-switch forge-avatar-view-switch','aria-label':'Choisir la vue'},
      h('button',{type:'button',class:'forge-avatar-choice active','data-view':'front'},'Face'),
      h('button',{type:'button',class:'forge-avatar-choice','data-view':'back'},'Dos'));
    const legend=RANKS.map((r,i)=>'<span class="forge-avatar-legend-item"><i style="background:'+RANK_COLORS[i]+'"></i>'+r.name+'</span>').join('');
    const section=h('section',{class:'carte forge-avatar-card forge-avatar-3d-card'},
      h('div',{class:'forge-card-head'},h('div',{},h('span',{class:'surtitre'},'BODYGRAPH 3D'),h('h2',{},'Ton personnage')),
        h('span',{class:'forge-tag'},'3D INTERACTIF')),
      h('p',{class:'discret'},'Deux personnages sculptés en 3D. Fais glisser ton doigt sur le modèle pour le tourner : chaque muscle prend la couleur de son rang.'),
      h('div',{class:'forge-avatar-controls'},sexButtons,viewButtons),
      h('div',{class:'forge-avatar-3d-frame'},host),
      h('div',{class:'forge-avatar-legend',innerHTML:legend}),
      h('div',{class:'forge-avatar-customize'},h('span',{},'PERSONNALISATION'),h('b',{},'Prochaine étape'),h('small',{},'Visage, coiffure, morphologie et équipements à débloquer')));
    let attempts=0, mounted=false;
    const showLoadError=message=>{
      if(mounted||!host.isConnected)return;
      const panel=h('div',{class:'forge-avatar-load-error'},
        h('strong',{},'Avatar 3D indisponible'),
        h('span',{},message||'Le moteur 3D ne s’est pas chargé. Vérifie ta connexion puis réessaie.'),
        h('button',{type:'button',class:'btn primaire'},'Réessayer'));
      panel.querySelector('button').addEventListener('click',()=>root.location.reload());
      host.replaceChildren(panel);
    };
    const init=()=>{
      if(mounted)return;
      if(!host.isConnected){if(attempts++<120)root.requestAnimationFrame(init);return;}
      if(!root.ForgeAvatar3D){
        if(attempts++===0)root.addEventListener('forge-avatar-ready',init,{once:true});
        if(attempts<120)root.setTimeout(init,100);
        else showLoadError('Le moteur 3D ne répond pas. Recharge la page et réessaie.');
        return;
      }
      try{
        const avatar=root.ForgeAvatar3D.mount(host,{sex:initialSex,ranks:rankByMuscle});
        mounted=true;
        section.querySelectorAll('[data-sex]').forEach(button=>button.addEventListener('click',()=>{
          avatar.setSex(button.dataset.sex);
          section.querySelectorAll('[data-sex]').forEach(b=>b.classList.toggle('active',b===button));
        }));
        section.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{
          avatar.setView(button.dataset.view);
          section.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b===button));
        }));
      }catch(error){
        console.error('Body Forge avatar 3D:',error);
        showLoadError('Ton appareil n’a pas pu démarrer le rendu 3D. Appuie sur Réessayer.');
      }
    };
    root.addEventListener('forge-avatar-error',event=>showLoadError(String(event.detail||'')),{once:true});
    root.requestAnimationFrame(init);
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
})(typeof window!=='undefined'?window:globalThis);
