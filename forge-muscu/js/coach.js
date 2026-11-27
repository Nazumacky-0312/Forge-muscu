/* Coach Forge : démonstrations 3D et fenêtre de conseils. */
(function(w){
'use strict';
const F=w.FM,h=F.h;
w.FORGE_COACH_ENDPOINT='https://xqvmfdvzgywinddxkbdl.supabase.co/functions/v1/forge-coach';
w.FORGE_COACH_KEY='sb_publishable_tHLViJ0JO41Phe24lPCL_g_XepTcbeQ';
const motion={pouss_h:'push',pouss_inc:'push',pouss_v:'up',tir_h:'row',tir_v:'pull',squat:'squat',fente:'lunge',hanche:'hinge',ischios:'curl',mollets:'calf',marteau:'curl',triceps:'tri',elev_lat:'raise',arriere:'raise',ecarte:'fly',dips:'dip',gainage:'plank',abd_bas:'leg',abd_flex:'crunch',obliques:'twist',avb_flex:'curl',avb_ext:'curl',shrug:'shrug',portage:'walk'};
F.animationExercice=function(ex,mini){
 const type=motion[ex.pattern]||'curl';
 return h('div',{class:'forge3d'+(mini?' mini':''),'data-3d':'1','data-pattern':type,role:'img','aria-label':'Démonstration 3D animée : '+ex.nom});
};
F.ouvrirCoach=function(ex){
 const messages=h('div',{class:'coach-messages','aria-live':'polite'},h('p',{class:'coach-bot'},ex?'Je suis ton coach pour '+ex.nom+'. Pose une question sur la technique, le placement, la respiration, les charges ou les alternatives.':'Pose tes questions sur la musculation, tes exercices, ta progression ou ton programme.'));
 const input=h('textarea',{rows:2,required:true,maxlength:1200,placeholder:'Écris ta question…','aria-label':'Question au coach'});
 const send=F.btn('Envoyer',()=>{},'primaire');
 const form=h('form',{class:'coach-compose'},input,send);
 form.addEventListener('submit',async ev=>{
  ev.preventDefault();const q=input.value.trim();if(!q)return;input.value='';
  messages.append(h('p',{class:'coach-user'},q));const wait=h('p',{class:'coach-bot'},'Je réfléchis…');messages.append(wait);send.disabled=true;
  try{
   const r=await fetch(w.FORGE_COACH_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','apikey':w.FORGE_COACH_KEY,'Authorization':'Bearer '+w.FORGE_COACH_KEY},body:JSON.stringify({question:q,exercise:ex?{name:ex.nom,muscles:ex.muscles,instructions:ex.consignes,errors:ex.erreurs}:null})});
   const d=await r.json();if(!r.ok)throw new Error(d.error||'Erreur du service IA ('+r.status+').');
   wait.textContent=String(d.answer||'Je n’ai pas reçu de réponse.'); 
  }catch(err){wait.textContent='Le coach IA ne répond pas : '+(err.message||'erreur réseau')+' Tu peux réessayer dans un instant.';}
  finally{send.disabled=false;messages.scrollTop=messages.scrollHeight;}
 });
 const suggestions=h('div',{class:'coach-suggestions'},...['Comment bien faire le mouvement ?','Combien de séries et répétitions ?','Comment progresser en charge ?'].map(q=>F.btn(q,()=>{input.value=q;input.focus();},'petit')));
 return F.modale(ex?'Conseils du coach':'Coach Forge',h('div',{class:'coach-panel'},ex?F.carte(h('div',{class:'coach-ex-head'},F.animationExercice(ex,true),h('strong',{},ex.nom))):null,messages,suggestions,form));
};
const listBefore=F.vues.exercices;
F.vues.exercices=function(app){
 const v=listBefore(app);
 v.querySelectorAll('.liste .ligne').forEach(a=>{
  const id=(a.getAttribute('href')||'').split('/').pop(),ex=F.EX[id];if(!ex)return;
  a.classList.add('exercise-main');a.prepend(F.animationExercice(ex,true));
  const row=h('div',{class:'exercise-row'});a.replaceWith(row);row.append(a,F.btn('Conseils',()=>F.ouvrirCoach(ex),'petit'));
 });
 return v;
};
const detailBefore=F.vues.exercice;
F.vues.exercice=function(app,id){
 const v=detailBefore(app,id),ex=F.EX[id];if(!ex)return v;
 const t=v.querySelector('h1');
 if(t)t.after(F.carte(h('div',{class:'exercise-demo'},F.animationExercice(ex,false),h('p',{class:'discret'},'Démonstration 3D animée du mouvement.'))),F.btn('Ouvrir les conseils du coach',()=>F.ouvrirCoach(ex),'primaire geant'));
 return v;
};
const sessionBefore=F.vues.seance;
F.vues.seance=function(app){
 const v=sessionBefore(app),a=app.etat.active,e=a&&a.exercices[a.index],ex=e&&F.EX[e.exId];if(!ex)return v;
 const t=v.querySelector('h1');if(t)t.after(F.animationExercice(ex,true));
 const b=[...v.querySelectorAll('button')].find(x=>x.textContent.trim()==='Consignes');
 if(b){b.textContent='Conseils du coach';b.onclick=()=>F.ouvrirCoach(ex);}
 return v;
};
F.vues.coach=function(){
 return h('div',{class:'forge-page'},h('p',{class:'surtitre'},'ACCOMPAGNEMENT'),h('h1',{},'Coach Forge'),F.carte(h('p',{},'Écris tes questions sur la technique, tes entraînements, la progression et la récupération.'),F.btn('Discuter avec le coach',()=>F.ouvrirCoach(null),'primaire geant')));
};
})(window);
