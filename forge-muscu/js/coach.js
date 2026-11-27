/* Coach Forge autonome : réponses locales, sans API, sans clé et utilisable hors ligne. */
(function(w){
'use strict';
const F=w.FM,h=F.h;
let exerciceActif=null;
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const has=(s,re)=>re.test(norm(s));
function ouvrirPageCoach(ex,app){exerciceActif=ex||null;if(app&&typeof app.aller==='function')app.aller('#/coach');}
F.ouvrirCoach=ouvrirPageCoach;
function ajouterMessage(messages,type,content){
 const p=h('p',{class:type==='user'?'coach-user':'coach-bot'},content);
 messages.append(p);messages.scrollTop=messages.scrollHeight;return p;
}
function reponseLocale(question,ex){
 const q=norm(question),nom=ex&&ex.nom?ex.nom:'';
 const muscles=ex&&ex.muscles?String(ex.muscles):'';
 const cues=ex&&ex.consignes?String(ex.consignes):'';
 const erreurs=ex&&ex.erreurs?String(ex.erreurs):'';
 const contexte=nom?'\n\nPour '+nom+' : '+(muscles?'muscles concernés : '+muscles+'. ':'')+(cues?'Consignes : '+cues+'. ':'')+(erreurs?'À éviter : '+erreurs+'.':''):'';
 if(/^(salut|bonjour|hello|yo|coucou|bonsoir)\b/.test(q))return 'Salut ! Je suis Coach Forge. Je fonctionne directement dans ton application, sans compte, sans clé API et même hors connexion. Demande-moi un conseil sur tes séances, ta technique, tes charges, tes abdos, ta nutrition ou ta récupération.';
 if(has(q,/\b(douleur|mal au|blesse|blessure|fourmillement|vertige)\b/))return 'Ne force pas sur une douleur vive, inhabituelle ou qui augmente pendant le mouvement. Arrête la série, réduis la charge et vérifie ta technique. Si la douleur persiste, revient ou s’accompagne d’un gonflement, fais-toi examiner par un professionnel de santé. Une douleur n’est pas un signe de bonne séance.'+contexte;
 if(has(q,/(programme|planning|repart|split|organiser mes seances|combien de fois)/)){
  return 'Pour construire une routine efficace :\n\n• 3 séances/semaine : full body, avec au moins un jour de repos entre les séances.\n• 4 séances/semaine : haut du corps / bas du corps, deux fois chacun.\n• 5 séances : un split par groupes musculaires peut convenir si le volume et la récupération suivent.\n\nCommence par 2 à 4 séries par exercice. Vise environ 8 à 12 séries difficiles par groupe musculaire sur la semaine, puis ajuste selon tes progrès et ta récupération. Garde un carnet de charges et de répétitions. La régularité vaut mieux qu’un programme compliqué.';
 }
 if(has(q,/(progresser|progression|prendre.*charge|augmenter.*charge|stagne|plus lourd|force)/)){
  return 'Utilise la double progression :\n\n1. Choisis une plage, par exemple 8 à 12 répétitions.\n2. Garde la même charge et essaie de gagner des répétitions avec une technique propre.\n3. Quand tu atteins 12 répétitions sur toutes tes séries, augmente légèrement la charge (environ 2 à 5 %).\n4. Repars vers 8 à 10 répétitions et recommence.\n\nGarde généralement 1 à 3 répétitions en réserve sur tes séries de travail. Si ta technique se dégrade, la charge est trop lourde.';
 }
 if(has(q,/(abdo|ventre|tablette|six.?pack|gainage)/)){
  return 'Pour développer tes abdos, entraîne-les comme les autres muscles, 2 à 3 fois par semaine :\n\n• Crunch à la poulie : 3 × 10–15, en enroulant le bassin et les côtes.\n• Relevés de genoux ou de jambes : 3 × 8–15, sans balancer le corps.\n• Gainage : 3 × 30–60 secondes, bassin aligné.\n\nAugmente progressivement les répétitions ou la résistance. Pour rendre les abdos visibles, le développement musculaire compte, mais le niveau de masse grasse et l’alimentation jouent aussi un rôle. On ne peut pas perdre du gras uniquement au ventre.';
 }
 if(has(q,/(nutrition|manger|alimentation|proteine|protéine|repas|calorie|prise de masse|seche|sèche|perdre du gras)/)){
  return 'Les bases nutritionnelles pour progresser :\n\n• Protéines : environ 1,6 à 2,2 g par kilo de poids corporel par jour.\n• Prise de muscle : léger surplus calorique, autour de 150 à 300 kcal/jour, puis ajuste selon l’évolution du poids.\n• Perte de gras : déficit modéré, sans sacrifier les protéines ni les performances.\n• Répartis les protéines sur 3 à 5 repas et garde des glucides autour des entraînements pour l’énergie.\n• Bois régulièrement et privilégie des aliments simples et variés.\n\nLes compléments ne remplacent ni les repas ni le sommeil.';
 }
 if(has(q,/(creatine|créatine|whey|complement|complément|pre.?workout|booster)/)){
  return 'Les compléments sont facultatifs. Les plus utiles dans la plupart des cas :\n\n• Créatine monohydrate : 3 à 5 g chaque jour, y compris les jours sans entraînement. Pas besoin de phase de charge.\n• Whey : uniquement pratique pour atteindre ton quota de protéines si l’alimentation ne suffit pas.\n• Caféine : peut aider la performance, mais évite-la tard et si elle augmente ton anxiété ou perturbe ton sommeil.\n\nÉvite les mélanges opaques et demande conseil à un professionnel de santé en cas de maladie, traitement ou doute.';
 }
 if(has(q,/(recuper|repos|dorm|sommeil|courbature|fatigue)/)){
  return 'La progression se construit aussi pendant la récupération :\n\n• Vise 7 à 9 heures de sommeil par nuit.\n• Laisse environ 48 heures avant de retravailler très intensément le même groupe musculaire.\n• Repose-toi 2 à 3 minutes sur les exercices lourds et 60 à 120 secondes sur les isolations.\n• Si tes performances chutent plusieurs séances, que la fatigue s’accumule ou que les douleurs persistent, réduis temporairement le volume.';
 }
 if(has(q,/(serie|series|répétition|repetition|reps|combien.*rep|combien.*serie)/)){
  return 'Pour l’hypertrophie, une base simple :\n\n• Exercices polyarticulaires : 3 à 4 séries de 6 à 12 répétitions.\n• Exercices d’isolation : 2 à 4 séries de 10 à 20 répétitions.\n• Termine la plupart des séries avec 1 à 3 répétitions possibles en réserve.\n\nLa qualité des répétitions, l’amplitude contrôlée et la progression dans le temps comptent davantage qu’un chiffre magique.';
 }
 if(has(q,/(echauff|échauff|warm.?up)/)){
  return 'Fais 5 à 8 minutes d’échauffement général, puis 2 à 4 séries de montée en charge sur ton premier exercice. Commence léger, augmente progressivement et garde ces séries faciles : elles préparent le mouvement, elles ne doivent pas te fatiguer.';
 }
 if(has(q,/(technique|execution|exécution|comment faire|comment bien|position|mouvement|consigne)/)&&ex){
  return 'Pour réussir '+nom+' :\n\n'+(cues?'• '+cues.replace(/[.;]\s*/g,'\n• '):'• Installe-toi de façon stable et contrôle la position de départ.\n• Réalise la phase de montée sans élan.\n• Contrôle le retour et garde une amplitude confortable.')+'\n\nÀ surveiller : '+(erreurs||'évite les mouvements brusques, l’élan et les compensations. Arrête la série si tu perds le contrôle.')+'\n\nRespire régulièrement et privilégie une répétition propre à une répétition forcée.';
 }
 if(has(q,/(technique|execution|exécution|comment faire|comment bien|position|mouvement|consigne)/)){
  return 'Pour te corriger précisément, donne-moi le nom de l’exercice et ce qui te pose problème : position de départ, trajectoire, amplitude ou sensation musculaire. En attendant : mouvement contrôlé, posture stable, amplitude sans douleur et aucune répétition arrachée.';
 }
 if(has(q,/(motivation|pas envie|flemme|abandon|difficile)/)){
  return 'Quand la motivation baisse, simplifie la séance au lieu de tout annuler : échauffement, deux exercices principaux, puis un exercice que tu apprécies. Même une séance courte et propre entretient l’habitude. Ne cherche pas à battre un record à chaque entraînement.';
 }
 if(has(q,/(bonjour|merci|super|parfait|ok|d'accord)/))return 'Avec plaisir ! Dis-moi ce que tu veux améliorer en priorité et je te proposerai une méthode concrète.';
 if(ex)return 'Je peux t’aider sur cet exercice, ton programme, tes charges, les répétitions, la nutrition et la récupération. Pour '+nom+', dis-moi si tu veux travailler la technique, les sensations, le nombre de séries ou la progression.';
 return 'Je peux te conseiller sur :\n\n• Construire un programme selon ton nombre de séances.\n• Progresser en charge et en répétitions.\n• Développer les abdos et les autres groupes musculaires.\n• Améliorer la technique d’un exercice.\n• Gérer les séries, répétitions et temps de repos.\n• Adapter ton alimentation et ta récupération.\n\nPose-moi une question précise, par exemple : « Comment progresser au développé couché ? » ou « Fais-moi un programme sur 4 jours ».';
}
async function envoyer(messages,input,send,ex){
 const q=input.value.trim();if(!q||send.disabled)return;
 input.value='';ajouterMessage(messages,'user',q);
 const wait=ajouterMessage(messages,'bot',reponseLocale(q,ex));
 send.disabled=true;send.classList.add('is-loading');
 await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 wait.classList.add('coach-answer-ready');
 send.disabled=false;send.classList.remove('is-loading');messages.scrollTop=messages.scrollHeight;input.focus();
}
F.animationExercice=function(ex,mini){
 return h('div',{class:'forge-exercise-media'+(mini?' mini':''),'data-forge-demo':'1','data-exercise-name':ex.nom,'data-exercise-id':ex.id||'',role:'group','aria-label':'Démonstration animée : '+ex.nom});
};
function slugImageExercice(n){
 const rules=[
  [/presse.*(cuisse|jambe)|leg press/,'leg-press'],
  [/squat/,'squat'],
  [/developpe.*incline/,'incline-bench-press'],
  [/developpe.*couche|bench press|chest press barre|developpe couche barre/,'bench-press'],
  [/developpe.*halter/,'bench-press'],
  [/ecarte.*poulie|crossover|vis.?a.?vis|cable fly/,'cable-fly-high-to-low'],
  [/souleve.*terre.*halter|romanian deadlift|souleve roumain/,'dumbbell-romanian-deadlift'],
  [/souleve.*terre|deadlift/,'deadlift'],
  [/tirage vertical|lat pulldown|tirage poitrine/,'lat-pulldown'],
  [/tirage horizontal|rowing poulie|seated cable row/,'seated-cable-row'],
  [/rowing.*halter|dumbbell row/,'dumbbell-row'],
  [/traction|pull.?up/,'pull-up'],
  [/elevation laterale|lateral raise/,'lateral-raises'],
  [/curl.*barre|barbell curl/,'barbell-curl'],
  [/crunch.*poulie|cable crunch/,'cable-crunch'],
  [/crunch|releve.*buste/,'crunches'],
  [/gainage|planche|plank/,'plank'],
  [/pompe|push.?up/,'push-up']
 ];
 for(const [re,slug] of rules)if(re.test(n))return slug;
 return null;
}
function monterDemo(el){
 if(el.dataset.demoReady==='1')return;
 el.dataset.demoReady='1';
 const name=el.dataset.exerciseName||'',slug=slugImageExercice(norm(name))||slugImageExercice(norm(el.dataset.exerciseId))||String(el.dataset.exerciseId||'').trim();
 if(!slug){
  el.classList.add('forge-media-missing');
  const msg=document.createElement('div');msg.className='forge-media-fallback';
  msg.textContent='Illustration 3D bientôt disponible pour cet exercice.';
  el.replaceChildren(msg);return;
 }
 const frames=document.createElement('div');frames.className='forge-3d-frames';
 const mini=el.classList.contains('mini');
 const frameNames=slug==='plank'?['hold']:['start','end'];
 for(const frame of frameNames){
  const img=document.createElement('img');
  img.className='forge-3d-frame '+(frame==='start'?'frame-start':frame==='end'?'frame-end':'frame-hold');
  img.src='images/exercises/'+slug+'/'+frame+'.webp';
  img.alt=name+' — '+(frame==='start'?'position de départ':frame==='end'?'position finale':'position de gainage');
  img.decoding='async';img.loading=mini?'lazy':'eager';
  img.onerror=()=>{img.remove();if(!frames.querySelector('img')){const msg=document.createElement('div');msg.className='forge-media-fallback';msg.textContent='Illustration 3D indisponible pour cet exercice.';el.replaceChildren(msg);}};
  frames.append(img);
 }
 const title=document.createElement('div');title.className='forge-demo-title';title.textContent=name;
 const sub=document.createElement('div');sub.className='forge-demo-subtitle';sub.textContent=slug==='plank'?'Position de maintien':'Départ ↔ position finale';
 const phases=document.createElement('div');phases.className='forge-demo-phases';
 if(slug!=='plank'){const a=document.createElement('span');a.textContent='Départ';const b=document.createElement('span');b.textContent='Fin du mouvement';phases.append(a,b);}
 const note=document.createElement('p');note.className='forge-demo-note';note.textContent='Illustration 3D indicative • garde une exécution contrôlée et sans douleur.';
 el.replaceChildren(frames,title,sub,phases,note);
}
function ouvrirPageCoachDepuisEx(ex,app){ouvrirPageCoach(ex,app);}
F.vues.coach=function(app){
 const ex=exerciceActif;
 const messages=h('div',{class:'coach-messages','aria-live':'polite'},
  h('div',{class:'coach-welcome-mark'},'F'),
  h('p',{class:'coach-bot coach-welcome'},ex?'Salut ! Je suis ton coach Forge. On travaille sur '+ex.nom+'. Je peux t’aider sur la technique, les charges et les sensations.':'Salut ! Je suis Coach Forge. Je suis intégré à l’application : pas de clé API, pas de compte et pas besoin de connexion pour obtenir des conseils.'));
 const input=h('textarea',{rows:1,required:true,maxlength:1200,placeholder:'Pose ta question à Coach Forge…','aria-label':'Question au coach'});
 const send=h('button',{type:'submit',class:'coach-send','aria-label':'Envoyer le message'},'↑');
 const form=h('form',{class:'coach-compose'},input,send);
 form.addEventListener('submit',ev=>{ev.preventDefault();envoyer(messages,input,send,ex);});
 input.addEventListener('keydown',ev=>{if(ev.key==='Enter'&&!ev.shiftKey){ev.preventDefault();form.requestSubmit();}});
 const prompts=[['↗','Comment progresser en charge ?'],['◎','Comment développer mes abdos ?'],['⌁','Fais-moi un programme sur 4 jours'],['＋','Comment mieux récupérer ?']];
 const suggestions=h('div',{class:'coach-suggestions'},...prompts.map(([ico,q])=>F.btn(h('span',{class:'coach-prompt-content'},h('span',{class:'coach-prompt-icon'},ico),h('span',{},q)),()=>{input.value=q;form.requestSubmit();},'coach-prompt')));
 const header=h('div',{class:'coach-topbar'},h('div',{class:'coach-brand-mark'},'F'),h('div',{class:'coach-brand-copy'},h('strong',{},'FORGE AI'),h('span',{},'COACH INTÉGRÉ • HORS LIGNE')),h('span',{class:'coach-status'},h('i',{}),'SANS API'));
 const intro=h('div',{class:'coach-hero'},h('p',{class:'coach-kicker'},'TON ENTRAÎNEMENT, TES RÈGLES'),h('h1',{},'On construit du solide.'),h('p',{},'Des conseils pratiques sur tes exercices, ta progression, ta nutrition et ta récupération. Directement dans Forge Muscu.'));
 const panel=h('section',{class:'coach-chat-shell'},messages,suggestions,form);
 const content=[header,intro];
 if(ex)content.push(F.carte(h('div',{class:'coach-ex-head'},F.animationExercice(ex,true),h('div',{},h('span',{class:'coach-context-label'},'EXERCICE EN COURS'),h('strong',{},ex.nom)))));
 content.push(panel,h('p',{class:'coach-disclaimer'},'Coach Forge fonctionne avec une base de conseils intégrée. Il ne remplace pas un professionnel de santé.'));
 return h('div',{class:'forge-page forge-coach-page forge-ai-page'},...content);
};
const listBefore=F.vues.exercices;
/* Accès direct au coach depuis l'en-tête de la bibliothèque d'exercices. */

F.vues.exercices=function(app){
 const v=listBefore(app);
 const titre=v.querySelector('h1');
 if(titre&&!v.querySelector('.forge-exercises-heading')){
  const head=h('div',{class:'forge-exercises-heading'});
  titre.replaceWith(head);
  head.append(titre,F.btn('Coach Forge ↗',()=>ouvrirPageCoach(null,app),'petit primaire'));
 }
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
 if(t)t.after(F.carte(h('div',{class:'exercise-demo'},F.animationExercice(ex,false),h('p',{class:'discret'},'Illustration 3D du mouvement.'))),F.btn('Demander au coach',()=>ouvrirPageCoach(ex,app),'primaire geant'));
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
 v.append(F.carte(h('div',{class:'forge-card-head'},h('h2',{},'Coach Forge'),h('span',{class:'forge-tag'},'SANS API')),h('p',{class:'discret'},'Un coach intégré, disponible même sans connexion.'),F.btn('Ouvrir mon coach',()=>ouvrirPageCoach(null,app),'primaire geant')));
 return v;
};
const demoObserver=new MutationObserver(()=>document.querySelectorAll('.forge-exercise-media[data-forge-demo="1"]').forEach(monterDemo));
function start(){document.querySelectorAll('.forge-exercise-media[data-forge-demo="1"]').forEach(monterDemo);if(document.body)demoObserver.observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(window);
