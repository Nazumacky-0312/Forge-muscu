/* Regroupe programme, bibliothèque d'exercices et suivi dans une seule page Séance. */
(function(w){
'use strict';
const F=w.FM;
if(!F||!F.vues||!F.h||!F.btn)return;
const h=F.h;
const vueProgramme=F.vues.programme;
const vues={
 programme:()=>vueProgramme,
 exercices:()=>F.vues.exercices,
 suivi:()=>F.vues.suivi
};
const labels={programme:'Programme',exercices:'Exercices',suivi:'Suivi'};
F.vues.programme=function(app){
 const root=h('div',{class:'forge-page forge-seance-hub'});
 const heading=h('div',{class:'forge-seance-heading'},
  h('div',{},h('p',{class:'forge-seance-kicker'},'TON ESPACE D’ENTRAÎNEMENT'),h('h1',{},'Séance'),h('p',{class:'discret'},'Ton programme, tes exercices et ta progression au même endroit.'))
 );
 const tabs=h('div',{class:'forge-seance-tabs',role:'tablist','aria-label':'Contenu de Séance'});
 const panel=h('section',{class:'forge-seance-panel','aria-live':'polite'});
 const tabButtons={};
 function afficher(key){
  Object.keys(tabButtons).forEach(k=>{
   const b=tabButtons[k];b.classList.toggle('active',k===key);
   b.setAttribute('aria-selected',k===key?'true':'false');
  });
  panel.replaceChildren();
  const render=vues[key]();
  const content=render(app);
  if(content)panel.append(content);
  panel.scrollTop=0;
 }
 Object.keys(labels).forEach(key=>{
  const b=F.btn(labels[key],()=>afficher(key),'forge-seance-tab');
  b.type='button';b.setAttribute('role','tab');b.setAttribute('aria-selected','false');
  tabs.append(b);tabButtons[key]=b;
 });
 root.append(heading,tabs,panel);
 afficher('programme');
 return root;
};
})(window);
