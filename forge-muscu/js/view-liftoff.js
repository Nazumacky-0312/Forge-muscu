/* Modules Liftoff de Forge : bodygraph, 17 mensurations et journal nutritionnel. */
(function (root) {
  'use strict';
  const FM = root.FM, h = FM.h;
  const nombre = (v, max) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(0, n)) : 0; };
  const texte = (v, max) => typeof v === 'string' ? v.slice(0, max) : '';
  const objet = v => v && typeof v === 'object' && !Array.isArray(v);
  const tableau = v => Array.isArray(v) ? v : [];

  /* Étend la normalisation existante sans casser les anciennes sauvegardes. */
  const normaliserAvant = FM.normaliser;
  FM.normaliser = function (donnees) {
    const e = normaliserAvant(donnees);
    e.mesures = tableau(donnees.mesures).filter(m => objet(m) && Number.isFinite(Number(m.date))).map(m => {
      const base = e.mesures.find(x => x.id === m.id) || { id: FM.uid(), date: Number(m.date) };
      for (const [k, max] of Object.entries({ epaules:300, hanches:300, avantBras:100, cou:100, poignet:100, mollet:150, cheville:100, thorax:300, fessiers:300, avantCuisse:150, bicepsContracte:100 })) base[k] = nombre(m[k], max);
      return base;
    });
    e.nutrition = tableau(donnees.nutrition).filter(n => objet(n) && Number.isFinite(Number(n.date))).slice(-500).map(n => ({
      id: typeof n.id === 'string' ? n.id.slice(0,60) : FM.uid(), date:Number(n.date),
      repas:texte(n.repas,60)||'Repas', kcal:Math.round(nombre(n.kcal,10000)),
      proteines:nombre(n.proteines,1000), glucides:nombre(n.glucides,1500), lipides:nombre(n.lipides,1000)
    }));
    const o = objet(donnees.objectifsNutrition) ? donnees.objectifsNutrition : {};
    e.objectifsNutrition = { kcal:Math.round(nombre(o.kcal,10000)), proteines:nombre(o.proteines,1000), glucides:nombre(o.glucides,1500), lipides:nombre(o.lipides,1000) };
    return e;
  };

  const mesures = [
    ['poids','Poids (kg)',400], ['taille','Taille (cm)',300], ['poitrine','Tour de poitrine (cm)',300],
    ['epaules','Tour d’épaules (cm)',300], ['tailleCorps','Tour de taille (cm)',250], ['hanches','Tour de hanches (cm)',300],
    ['bras','Tour de bras (cm)',100], ['avantBras','Tour d’avant-bras (cm)',100], ['cou','Tour de cou (cm)',100],
    ['poignet','Tour de poignet (cm)',100], ['cuisse','Tour de cuisse (cm)',150], ['mollet','Tour de mollet (cm)',150],
    ['cheville','Tour de cheville (cm)',100], ['thorax','Tour de thorax (cm)',300], ['fessiers','Tour de fessiers (cm)',300],
    ['avantCuisse','Tour de cuisse haute (cm)',150], ['bicepsContracte','Tour de bras contracté (cm)',100]
  ];
  const volume = e => {
    const out = Object.fromEntries(Object.keys(FM.MUSCLES).map(k => [k,0]));
    const depuis = Date.now() - 28*864e5;
    for (const s of e.seances) if (s.debut >= depuis) for (const x of s.exercices) {
      const ex = FM.EX[x.exId]; if (!ex) continue;
      const n = x.series.filter(z => z.fait && z.reps > 0).length;
      for (const m of ex.muscles) if (out[m] !== undefined) out[m] += n;
    }
    return out;
  };
  const bodygraph = e => {
    const v = volume(e);
    const svg = h('svg',{viewBox:'0 0 180 330',role:'img','aria-label':'Silhouette musculaire schématique'});
    const add=(tag,attrs)=>svg.append(h(tag,attrs));
    add('circle',{cx:90,cy:22,r:17,class:'body-base'});
    add('path',{d:'M73 43 Q56 48 48 66 L30 122 Q27 132 36 135 Q44 137 48 126 L62 85 L64 145 L56 216 L47 300 Q46 311 56 311 Q65 311 67 300 L83 222 L97 222 L113 300 Q115 311 124 311 Q134 311 132 300 L124 216 L116 145 L118 85 L132 126 Q136 137 145 135 Q153 132 150 122 L132 66 Q124 48 107 43 Z',class:'body-base'});
    const zones=[
      'M64 54 Q90 47 116 54 L112 94 Q90 106 68 94 Z',
      'M62 50 Q49 54 46 72 L61 86 L72 70 Z M118 50 Q131 54 134 72 L119 86 L108 70 Z',
      'M68 97 L112 97 L108 145 L72 145 Z',
      'M52 78 L36 125 L45 129 L62 87 Z M128 78 L144 125 L135 129 L118 87 Z',
      'M37 132 L31 183 L42 186 L49 137 Z M143 132 L149 183 L138 186 L131 137 Z',
      'M65 150 L87 150 L80 214 L60 214 Z M93 150 L115 150 L120 214 L100 214 Z',
      'M60 218 L79 218 L66 296 L51 296 Z M101 218 L120 218 L129 296 L114 296 Z'
    ];
    zones.forEach(d=>add('path',{d,class:'body-muscle'}));
    const legende=h('div',{class:'forge-body-legend'},...Object.keys(FM.MUSCLES).map(m=>h('div',{class:'forge-body-legend-row'},h('i',{class:'forge-body-dot'}),h('span',{},FM.MUSCLES[m]),h('b',{},String(v[m]||0)))));
    return h('div',{class:'forge-bodygraph'},h('div',{class:'forge-body-side'},'AVANT',svg),legende);
  };

  FM.vues.corps = function(app) {
    const e=app.etat; e.mesures=e.mesures||[];
    const historique=[...e.mesures].sort((a,b)=>b.date-a.date), derniere=historique[0];
    const form=h('form',{class:'forge-measure-form'},
      h('h2',{},'Nouvelle mesure'),
      h('p',{class:'discret'},'Laisse vide les champs non mesurés. Reprends les mesures dans des conditions similaires.'),
      ...mesures.map(([k,label,max])=>FM.champ(label,h('input',{type:'number',name:k,min:0,max,step:'0.1',inputmode:'decimal',placeholder:'Facultatif'}))),
      FM.btn('Enregistrer mes mesures',()=>{},'primaire geant'));
    form.addEventListener('submit',ev=>ev.preventDefault());
    form.querySelector('button').addEventListener('click',ev=>{
      ev.preventDefault(); const f=new FormData(form), m={id:FM.uid(),date:Date.now()};
      for(const [k,,max] of mesures) m[k]=f.get(k)===''?0:nombre(f.get(k),max);
      if(!mesures.some(([k])=>m[k]>0)) return FM.toast('Renseigne au moins une mesure.');
      e.mesures.push(m); app.sauver(); app.rendre(); FM.toast('Mensurations enregistrées.');
    });
    return h('div',{class:'forge-page'},h('p',{class:'surtitre'},'SUIVI DU PHYSIQUE'),h('h1',{},'Mon physique'),
      FM.carte(h('div',{class:'forge-card-head'},h('h2',{},'Bodygraph'),h('span',{class:'forge-tag'},'28 JOURS')),
        h('p',{class:'discret'},'Carte schématique des muscles et séries validées sur 28 jours. Ce n’est ni une mesure de masse musculaire ni un diagnostic.'),bodygraph(e)),
      FM.carte(derniere?h('div',{class:'forge-card-head'},h('h2',{},'Dernier relevé'),h('span',{class:'forge-tag'},FM.dateCourte(derniere.date))):h('h2',{},'Commence ton suivi'),
        derniere?h('div',{class:'forge-stats-grid'},...mesures.filter(([k])=>derniere[k]>0).map(([k,label])=>h('div',{class:'forge-stat'},h('strong',{},String(derniere[k])),h('small',{},label.replace(/ \(.+\)/,''))))):h('p',{class:'discret'},'Enregistre tes mensurations pour voir ton évolution.')),
      FM.carte(form),
      historique.length?FM.carte(h('h2',{},'Historique'),...historique.slice(0,10).map(m=>h('p',{class:'forge-measure-history-line'},FM.dateCourte(m.date)+' · '+mesures.filter(([k])=>m[k]>0).map(([k,l])=>`${l.split(' (')[0]} ${m[k]}`).join(' · '))),
        FM.btn('Supprimer tout l’historique',()=>FM.confirmer('Supprimer les mesures ?','Cette action ne supprime que les mensurations.','Supprimer',()=>{e.mesures=[];app.sauver();app.rendre();},true),'danger geant')):null,
      h('p',{class:'discret'},'Tes mesures sont conservées sur cet appareil et incluses dans les sauvegardes.'));
  };

  const nfield=(label,name,step='1')=>FM.champ(label,h('input',{type:'number',name,min:0,max:10000,step,inputmode:'decimal',placeholder:'0'}));
  const jour=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime();
  FM.vues.nutrition=function(app) {
    const e=app.etat; e.nutrition=e.nutrition||[]; e.objectifsNutrition=e.objectifsNutrition||{kcal:0,proteines:0,glucides:0,lipides:0};
    const today=jour(new Date()), rows=e.nutrition.filter(x=>jour(new Date(x.date))===today);
    const sum={kcal:0,proteines:0,glucides:0,lipides:0}; rows.forEach(x=>Object.keys(sum).forEach(k=>sum[k]+=x[k]||0));
    const form=h('form',{class:'nutrition-form'},h('h2',{},'Ajouter un repas'),
      FM.champ('Nom du repas',h('input',{name:'repas',maxlength:60,placeholder:'Ex. déjeuner'})),
      nfield('Calories (kcal)','kcal'),nfield('Protéines (g)','proteines','0.1'),
      nfield('Glucides (g)','glucides','0.1'),nfield('Lipides (g)','lipides','0.1'),FM.btn('Ajouter',()=>{},'primaire geant'));
    form.addEventListener('submit',ev=>ev.preventDefault());
    form.querySelector('button').addEventListener('click',ev=>{ev.preventDefault();const f=new FormData(form),item={id:FM.uid(),date:Date.now(),repas:texte(f.get('repas'),60)||'Repas'};
      for(const k of Object.keys(sum)) item[k]=nombre(f.get(k),k==='kcal'?10000:1500);
      if(!Object.keys(sum).some(k=>item[k]>0)) return FM.toast('Renseigne au moins une valeur.');
      e.nutrition.push(item);app.sauver();app.rendre();FM.toast('Repas ajouté.');});
    const goals=h('form',{class:'nutrition-form'},h('h2',{},'Objectifs quotidiens'),
      nfield('Calories cibles','kcal'),nfield('Protéines cibles (g)','proteines','0.1'),
      nfield('Glucides cibles (g)','glucides','0.1'),nfield('Lipides cibles (g)','lipides','0.1'),FM.btn('Enregistrer les objectifs',()=>{},'geant'));
    goals.addEventListener('submit',ev=>ev.preventDefault());
    goals.querySelector('button').addEventListener('click',ev=>{ev.preventDefault();const f=new FormData(goals);for(const k of Object.keys(sum))e.objectifsNutrition[k]=nombre(f.get(k),k==='kcal'?10000:1500);app.sauver();app.rendre();FM.toast('Objectifs enregistrés.');});
    const macros=['proteines','glucides','lipides'];
    return h('div',{class:'forge-page'},h('p',{class:'surtitre'},'SUIVI ALIMENTAIRE'),h('h1',{},'Nutrition'),
      FM.carte(h('div',{class:'forge-card-head'},h('h2',{},'Aujourd’hui'),h('span',{class:'forge-tag'},FM.dateCourte(Date.now()))),
        h('div',{class:'nutrition-calories'},h('strong',{},String(Math.round(sum.kcal))),h('span',{},'kcal consommées')),
        ...macros.map(k=>h('div',{class:'nutrition-progress'},h('div',{class:'nutrition-progress-label'},h('span',{},k==='proteines'?'Protéines':k==='glucides'?'Glucides':'Lipides'),h('b',{},`${Math.round(sum[k])} / ${e.objectifsNutrition[k]||'—'} g`)),h('div',{class:'forge-progress'},h('i',{style:`width:${e.objectifsNutrition[k]?Math.min(100,sum[k]/e.objectifsNutrition[k]*100):0}%`})))),
        h('p',{class:'discret'},'Saisie manuelle : vérifie les valeurs sur les emballages ou dans une base alimentaire fiable.')),
      FM.carte(form),
      FM.carte(h('h2',{},'Journal du jour'),rows.length?rows.map(x=>h('div',{class:'nutrition-entry'},h('div',{},h('strong',{},x.repas),h('small',{},`${x.kcal} kcal · P ${x.proteines} g · G ${x.glucides} g · L ${x.lipides} g`)),FM.btn('Supprimer',()=>{e.nutrition=e.nutrition.filter(y=>y.id!==x.id);app.sauver();app.rendre();},'petit'))):h('p',{class:'discret'},'Aucun repas enregistré aujourd’hui.')),
      FM.carte(goals),h('p',{class:'discret'},'Forge Muscu ne scanne pas encore les aliments et ne génère pas de recommandations médicales ou diététiques.'));
  };
})(typeof window !== 'undefined' ? window : globalThis);
