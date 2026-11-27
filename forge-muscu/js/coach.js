/* Coach Forge — interface conversationnelle et liaison Supabase. */
(function(w){
'use strict';
const F=w.FM,h=F.h;
w.FORGE_COACH_ENDPOINT='https://xqvmfdvzgywinddxkbdl.supabase.co/functions/v1/forge-coach';
/* Clé anon historique : JWT public accepté par verify_jwt. La publishable key reste dans apikey. */
w.FORGE_COACH_KEY='sb_publishable_tHLViJ0JO41Phe24lPCL_g_XepTcbeQ';
w.FORGE_COACH_JWT='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhxdm1mZHZ6Z3l3aW5kZHhrYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU3Mjk0NzYsImV4cCI6MjExMTMwNTQ3Nn0.joxQBdfBaY4WP_Eu-BQ7twmlpw1YspazBdl_jIJ27ik';
let exerciceActif=null;
const motion={pouss_h:'push',pouss_inc:'push',pouss_v:'up',tir_h:'row',tir_v:'pull',squat:'squat',fente:'lunge',hanche:'hinge',ischios:'curl',mollets:'calf',marteau:'curl',triceps:'tri',elev_lat:'raise',arriere:'raise',ecarte:'fly',dips:'dip',gainage:'plank',abd_bas:'leg',abd_flex:'crunch',obliques:'twist',avb_flex:'curl',avb_ext:'curl',shrug:'shrug',portage:'walk'};
F.animationExercice=function(ex,mini){
 return h('div',{class:'forge-exercise-media'+(mini?' mini':''),'data-3d':'1','data-exercise-name':ex.nom,role:'group','aria-label':'Démonstration vidéo : '+ex.nom},
   h('div',{class:'forge-media-loading'},'Recherche de la démonstration…'));
};
function ouvrirPageCoach(ex,app){exerciceActif=ex||null;if(app&&typeof app.aller==='function')app.aller('#/coach');}
F.ouvrirCoach=ouvrirPageCoach;
function ajouterMessage(messages,type,content){
 const p=h('p',{class:type==='user'?'coach-user':'coach-bot'},content);
 messages.append(p);messages.scrollTop=messages.scrollHeight;return p;
}
async function envoyer(messages,input,send,ex){
 const q=input.value.trim();if(!q||send.disabled)return;
 input.value='';ajouterMessage(messages,'user',q);
 const wait=ajouterMessage(messages,'bot','Coach Forge prépare sa réponse…');
 send.disabled=true;send.classList.add('is-loading');
 try{
  const response=await fetch(w.FORGE_COACH_ENDPOINT,{
   method:'POST',
   headers:{
    'Content-Type':'application/json',
    'apikey':w.FORGE_COACH_KEY,
    'Authorization':'Bearer '+w.FORGE_COACH_JWT
   },
   body:JSON.stringify({question:q,exercise:ex?{name:ex.nom,muscles:ex.muscles,instructions:ex.consignes,errors:ex.erreurs}:null})
  });
  let data={};try{data=await response.json();}catch(_){}
  if(!response.ok){
   if(response.status===401)throw Error('Authentification Supabase refusée. Recharge Forge Muscu pour appliquer la correction.');
   throw Error(data.error||'Erreur du service IA ('+response.status+').');
  }
  wait.textContent=String(data.answer||'Je n’ai pas reçu de réponse. Essaie une nouvelle fois.');
 }catch(err){
  wait.textContent='Je n’ai pas pu répondre : '+(err.message||'erreur réseau')+'.';
 }finally{
  send.disabled=false;send.classList.remove('is-loading');messages.scrollTop=messages.scrollHeight;input.focus();
 }
}
F.vues.coach=function(app){
 const ex=exerciceActif;
 const messages=h('div',{class:'coach-messages','aria-live':'polite'},
  h('div',{class:'coach-welcome-mark'},'F'),
  h('p',{class:'coach-bot coach-welcome'},ex?'Salut ! Je suis ton coach Forge. On travaille sur '+ex.nom+'. Pose-moi une question sur ta technique, tes charges ou tes sensations.':'Salut ! Je suis Coach Forge, ton assistant de musculation. Je peux t’aider à construire tes séances, progresser, améliorer ta technique et mieux récupérer.'));
 const input=h('textarea',{rows:1,required:true,maxlength:1200,placeholder:'Pose ta question à Coach Forge…','aria-label':'Question au coach'});
 const send=h('button',{type:'submit',class:'coach-send','aria-label':'Envoyer le message'},'↑');
 const form=h('form',{class:'coach-compose'},input,send);
 form.addEventListener('submit',ev=>{ev.preventDefault();envoyer(messages,input,send,ex);});
 input.addEventListener('keydown',ev=>{if(ev.key==='Enter'&&!ev.shiftKey){ev.preventDefault();form.requestSubmit();}});
 const prompts=[
  ['↗','Comment progresser en charge ?'],
  ['◎','Comment développer mes abdos ?'],
  ['⌁','Optimise mon programme'],
  ['＋','Comment mieux récupérer ?']
 ];
 const suggestions=h('div',{class:'coach-suggestions'},...prompts.map(([ico,q])=>F.btn(h('span',{class:'coach-prompt-content'},h('span',{class:'coach-prompt-icon'},ico),h('span',{},q)),()=>{input.value=q;form.requestSubmit();},'coach-prompt')));
 const header=h('div',{class:'coach-topbar'},
  h('div',{class:'coach-brand-mark'},'F'),
  h('div',{class:'coach-brand-copy'},h('strong',{},'FORGE AI'),h('span',{},'TON COACH PERSONNEL')),
  h('span',{class:'coach-status'},h('i',{}),'COACH IA'));
 const intro=h('div',{class:'coach-hero'},
  h('p',{class:'coach-kicker'},'L’INTELLIGENCE AU SERVICE DE TA PROGRESSION'),
  h('h1',{},'On construit du solide.'),
  h('p',{},'Entraînement, technique, nutrition et récupération : demande conseil à ton coach.'));
 const panel=h('section',{class:'coach-chat-shell'},messages,suggestions,form);
 const content=[header,intro];
 if(ex)content.push(F.carte(h('div',{class:'coach-ex-head'},F.animationExercice(ex,true),h('div',{},h('span',{class:'coach-context-label'},'EXERCICE EN COURS'),h('strong',{},ex.nom)))));
 content.push(panel);
 content.push(h('p',{class:'coach-disclaimer'},'Coach Forge donne des conseils généraux. Respecte tes sensations et arrête en cas de douleur vive ou inhabituelle.'));
 return h('div',{class:'forge-page forge-coach-page forge-ai-page'},...content);
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
 if(t)t.after(F.carte(h('div',{class:'exercise-demo'},F.animationExercice(ex,false),h('p',{class:'discret'},'Démonstration vidéo du mouvement.'))),F.btn('Demander au coach',()=>ouvrirPageCoach(ex,app),'primaire geant'));
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
