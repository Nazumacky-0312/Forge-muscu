/* Coach Forge : page dédiée et démonstrations 3D. */
(function(w){
'use strict';
const F=w.FM,h=F.h;
w.FORGE_COACH_ENDPOINT='https://xqvmfdvzgywinddxkbdl.supabase.co/functions/v1/forge-coach';
w.FORGE_COACH_KEY='sb_publishable_tHLViJ0JO41Phe24lPCL_g_XepTcbeQ';
let exerciceActif=null;
const motion={pouss_h:'push',pouss_inc:'push',pouss_v:'up',tir_h:'row',tir_v:'pull',squat:'squat',fente:'lunge',hanche:'hinge',ischios:'curl',mollets:'calf',marteau:'curl',triceps:'tri',elev_lat:'raise',arriere:'raise',ecarte:'fly',dips:'dip',gainage:'plank',abd_bas:'leg',abd_flex:'crunch',obliques:'twist',avb_flex:'curl',avb_ext:'curl',shrug:'shrug',portage:'walk'};
F.animationExercice=function(ex,mini){
 return h('div',{class:'forge-exercise-media'+(mini?' mini':''),'data-3d':'1','data-exercise-name':ex.nom,role:'group','aria-label':'Démonstration vidéo : '+ex.nom},
   h('div',{class:'forge-media-loading'},'Recherche de la démonstration…'));
};
function ouvrirPageCoach(ex,app){exerciceActif=ex||null;if(app&&typeof app.aller==='function')app.aller('#/coach');}
F.ouvrirCoach=ouvrirPageCoach;
function envoyer(messages,input,send,ex){
 const q=input.value.trim();if(!q)return;
 input.value='';messages.append(h('p',{class:'coach-user'},q));
 const wait=h('p',{class:'coach-bot'},'Je réfléchis…');messages.append(wait);send.disabled=true;
 fetch(w.FORGE_COACH_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','apikey':w.FORGE_COACH_KEY,'Authorization':'Bearer '+w.FORGE_COACH_KEY},body:JSON.stringify({question:q,exercise:ex?{name:ex.nom,muscles:ex.muscles,instructions:ex.consignes,errors:ex.erreurs}:null})})
 .then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||'Erreur du service IA ('+r.status+').');wait.textContent=String(d.answer||'Je n’ai pas reçu de réponse.');})
 .catch(err=>{wait.textContent='Le coach IA ne répond pas : '+(err.message||'erreur réseau')+'. Tu peux réessayer.';})
 .finally(()=>{send.disabled=false;messages.scrollTop=messages.scrollHeight;});
}
F.vues.coach=function(app){
 const ex=exerciceActif,messages=h('div',{class:'coach-messages','aria-live':'polite'},h('p',{class:'coach-bot'},ex?'Je suis ton coach pour '+ex.nom+'. Pose une question sur la technique, le placement, la respiration, les charges ou les alternatives.':'Salut ! Je suis ton coach Forge. Pose-moi tes questions sur tes entraînements, tes exercices, ta progression ou ta récupération.'));
 const input=h('textarea',{rows:3,required:true,maxlength:1200,placeholder:'Écris ta question…','aria-label':'Question au coach'});
 const send=F.btn('Envoyer',()=>{},'primaire');const form=h('form',{class:'coach-compose'},input,send);
 form.addEventListener('submit',ev=>{ev.preventDefault();envoyer(messages,input,send,ex);});
 const suggestions=h('div',{class:'coach-suggestions'},...['Comment progresser en charge ?','Comment mieux développer mes abdos ?','Comment organiser ma récupération ?'].map(q=>F.btn(q,()=>{input.value=q;input.focus();},'petit')));
 const content=[h('div',{class:'coach-page-intro'},h('div',{},h('p',{class:'surtitre'},'ACCOMPAGNEMENT PERSONNALISÉ'),h('h1',{},'Coach Forge'),h('p',{class:'discret'},'Un coach disponible pour t’aider à progresser intelligemment.')))];
 if(ex)content.push(F.carte(h('div',{class:'coach-ex-head'},F.animationExercice(ex,true),h('strong',{},ex.nom))));
 content.push(F.carte(h('div',{class:'coach-panel'},messages,suggestions,form)));
 content.push(h('p',{class:'discret'},'Les conseils sont généraux : adapte toujours les charges à ta technique, à tes sensations et à ton niveau.'));
 return h('div',{class:'forge-page forge-coach-page'},...content);
};
const listBefore=F.vues.exercices;
F.vues.exercices=function(app){
 const v=listBefore(app);
 v.querySelectorAll('.liste .ligne').forEach(a=>{
  const id=(a.getAttribute('href')||'').split('/').pop(),ex=F.EX[id];if(!ex)return;
  a.classList.add('exercise-main');a.prepend(F.animationExercice(ex,true));
  const row=h('div',{class:'exercise-row'});a.replaceWith(row);row.append(a,F.btn('Coach',()=>ouvrirPageCoach(ex,app),'petit'));
 });
 return v;
};
const detailBefore=F.vues.exercice;
F.vues.exercice=function(app,id){
 const v=detailBefore(app,id),ex=F.EX[id];if(!ex)return v;
 const t=v.querySelector('h1');
 if(t)t.after(F.carte(h('div',{class:'exercise-demo'},F.animationExercice(ex,false),h('p',{class:'discret'},'Démonstration 3D animée du mouvement.'))),F.btn('Demander au coach',()=>ouvrirPageCoach(ex,app),'primaire geant'));
 return v;
};
const sessionBefore=F.vues.seance;
F.vues.seance=function(app){
 const v=sessionBefore(app),a=app.etat.active,e=a&&a.exercices[a.index],ex=e&&F.EX[e.exId];if(!ex)return v;
 const t=v.querySelector('h1');if(t)t.after(F.animationExercice(ex,true));
 const b=[...v.querySelectorAll('button')].find(x=>x.textContent.trim()==='Consignes');
 if(b){b.textContent='Demander au coach';b.onclick=()=>ouvrirPageCoach(ex,app);}
 return v;
};
const homeBefore=F.vues.accueil;
F.vues.accueil=function(app){
 const v=homeBefore(app);
 v.append(F.carte(h('div',{class:'forge-card-head'},h('h2',{},'Coach Forge'),h('span',{class:'forge-tag'},'IA')),h('p',{class:'discret'},'Technique, progression, programme et récupération : retrouve ton coach sur une page dédiée.'),F.btn('Ouvrir mon coach',()=>ouvrirPageCoach(null,app),'primaire geant')));
 return v;
};
})(window);
