/* Coach Forge : animations SVG et fenêtre de conseils. */
(function(w){
'use strict';
const F=w.FM,h=F.h;
const motion={pouss_h:'push',pouss_inc:'push',pouss_v:'up',tir_h:'row',tir_v:'pull',squat:'squat',fente:'lunge',hanche:'hinge',ischios:'curl',mollets:'calf',marteau:'curl',triceps:'tri',elev_lat:'raise',arriere:'raise',ecarte:'fly',dips:'dip',gainage:'plank',abd_bas:'leg',abd_flex:'crunch',obliques:'twist',avb_flex:'curl',avb_ext:'curl',shrug:'shrug',portage:'walk'};
F.animationExercice=function(ex,mini){
 const el=h('div',{class:'forge3d'+(mini?' mini':''),'data-3d':'1','data-pattern':ex.pattern||'curl',role:'img','aria-label':'Démonstration 3D animée : '+ex.nom});
 return el;
}; Coach Forge : animations SVG et fenêtre de conseils. */
(function(w){
'use strict';
const F=w.FM,h=F.h;
const motion={pouss_h:'push',pouss_inc:'push',pouss_v:'up',tir_h:'row',tir_v:'pull',squat:'squat',fente:'lunge',hanche:'hinge',ischios:'curl',mollets:'calf',marteau:'curl',triceps:'tri',elev_lat:'raise',arriere:'raise',ecarte:'fly',dips:'dip',gainage:'plank',abd_bas:'leg',abd_flex:'crunch',obliques:'twist',avb_flex:'curl',avb_ext:'curl',shrug:'shrug',portage:'walk'};
F.animationExercice=function(ex,mini){
 const type=motion[ex.pattern]||'curl',svg=h('svg',{viewBox:'0 0 220 150',class:'forge-motion '+(mini?'mini':'')+' move-'+type,role:'img','aria-label':'Démonstration animée : '+ex.nom});
 svg.innerHTML='<path d="M12 128H208" stroke="#526174" stroke-width="2"/><g class="athlete" fill="none" stroke="#b8f34a" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><circle cx="110" cy="22" r="10" fill="#d9e8c1" stroke-width="2"/><path class="torso" d="M110 34L110 79"/><path class="arm a1" d="M108 45L83 61L69 83"/><path class="arm a2" d="M112 45L137 61L151 83"/><path class="leg l1" d="M108 79L91 103L83 126"/><path class="leg l2" d="M112 79L129 103L137 126"/></g><path class="bar" d="M55 82H165M62 75V89M158 75V89" stroke="#dce5ef" stroke-width="4" stroke-linecap="round"/><text x="110" y="145" fill="#aab7c8" font-size="8" text-anchor="middle">MOUVEMENT ILLUSTRATIF</text>';
 return svg;
};
F.ouvrirCoach=function(ex){
 const messages=h('div',{class:'coach-messages','aria-live':'polite'},h('p',{class:'coach-bot'},ex?'Je suis ton coach pour '+ex.nom+'. Pose une question sur la technique, le placement, la respiration, les charges ou les alternatives.':'Pose tes questions sur la musculation, tes exercices, ta progression ou ton programme.'));
 const input=h('textarea',{rows:2,required:true,maxlength:1200,placeholder:'Écris ta question…','aria-label':'Question au coach'});
 const send=F.btn('Envoyer',()=>{},'primaire');
 const form=h('form',{class:'coach-compose'},input,send);
 form.addEventListener('submit',async ev=>{
  ev.preventDefault();const q=input.value.trim();if(!q)return;input.value='';
  messages.append(h('p',{class:'coach-user'},q));const wait=h('p',{class:'coach-bot'},'Je réfléchis…');messages.append(wait);send.disabled=true;
  let answer='';const endpoint=w.FORGE_COACH_ENDPOINT;
  if(typeof endpoint==='string'&&endpoint.startsWith('https://')){
   try{const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:q,exercise:ex?{name:ex.nom,muscles:ex.muscles,instructions:ex.consignes,errors:ex.erreurs}:null})});if(!r.ok)throw Error();const d=await r.json();answer=String(d.answer||d.reply||'Aucune réponse reçue.');}
   catch(e){answer='Le serveur IA est indisponible. '+local(q,ex);}
  }else answer='Conseil intégré : '+local(q,ex)+'\n\nLe mode IA complet sera actif dès que le serveur sécurisé sera connecté.';
  wait.textContent=answer;send.disabled=false;messages.scrollTop=messages.scrollHeight;
 });
 const suggestions=h('div',{class:'coach-suggestions'},...['Comment bien faire le mouvement ?','Combien de séries et répétitions ?','Comment progresser en charge ?'].map(q=>F.btn(q,()=>{input.value=q;input.focus();},'petit')));
 return F.modale(ex?'Conseils du coach':'Coach Forge',h('div',{class:'coach-panel'},ex?F.carte(h('div',{class:'coach-ex-head'},F.animationExercice(ex,true),h('strong',{},ex.nom))):null,messages,suggestions,form));
};
function local(q,ex){
 const s=q.toLowerCase();
 if(/douleur|mal|bless|genou|dos|épaule|epaule/.test(s))return 'Arrête si la douleur est vive, inhabituelle ou augmente. Ne force pas à travers la douleur ; demande un avis médical si elle persiste. Je ne peux pas établir de diagnostic.';
 if(/combien|série|series|répét|repet/.test(s))return 'Repère général : 2 à 4 séries de 6 à 15 répétitions, en gardant 1 à 3 répétitions en réserve. Ajuste selon ton niveau et ta récupération.';
 if(/repos|pause/.test(s))return 'Prends environ 2 à 3 minutes sur les mouvements lourds et 60 à 120 secondes sur l’isolation. Reprends quand ta technique reste propre.';
 if(/charge|progres|augment|poids/.test(s))return 'Quand tu atteins le haut de ta fourchette de répétitions sur toutes tes séries avec une technique propre, augmente légèrement la charge.';
 if(ex)return ex.nom+' : '+(ex.consignes||[]).join(' ')+' À éviter : '+(ex.erreurs||[]).join(' ; ');
 return 'Je peux conseiller sur la technique, les séries, les répétitions, les charges, le repos, la récupération et les programmes. Précise ton objectif et ton contexte pour une réponse plus utile.';
}
const listBefore=F.vues.exercices;
F.vues.exercices=function(app){const v=listBefore(app);v.querySelectorAll('.liste .ligne').forEach(a=>{const id=(a.getAttribute('href')||'').split('/').pop(),ex=F.EX[id];if(!ex)return;a.classList.add('exercise-main');a.prepend(F.animationExercice(ex,true));const row=h('div',{class:'exercise-row'});a.replaceWith(row);row.append(a,F.btn('Conseils',()=>F.ouvrirCoach(ex),'petit'));});return v;};
const detailBefore=F.vues.exercice;
F.vues.exercice=function(app,id){const v=detailBefore(app,id),ex=F.EX[id];if(!ex)return v;const t=v.querySelector('h1');if(t)t.after(F.carte(h('div',{class:'exercise-demo'},F.animationExercice(ex,false),h('p',{class:'discret'},'Animation schématique du mouvement.'))),F.btn('Ouvrir les conseils du coach',()=>F.ouvrirCoach(ex),'primaire geant'));return v;};
const sessionBefore=F.vues.seance;
F.vues.seance=function(app){const v=sessionBefore(app),a=app.etat.active,e=a&&a.exercices[a.index],ex=e&&F.EX[e.exId];if(!ex)return v;const t=v.querySelector('h1');if(t)t.after(F.animationExercice(ex,true));const b=[...v.querySelectorAll('button')].find(x=>x.textContent.trim()==='Consignes');if(b){b.textContent='Conseils du coach';b.onclick=()=>F.ouvrirCoach(ex);}return v;};
F.vues.coach=function(){return h('div',{class:'forge-page'},h('p',{class:'surtitre'},'ACCOMPAGNEMENT'),h('h1',{},'Coach Forge'),F.carte(h('p',{},'Écris tes questions sur la technique, tes entraînements, la progression et la récupération.'),F.btn('Discuter avec le coach',()=>F.ouvrirCoach(null),'primaire geant')));};
})(window);