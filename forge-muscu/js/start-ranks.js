/* Démarrage guidé et page des rangs Forge. */
(function(root){
  'use strict';
  const FM=root.FM,h=FM.h,carte=(...x)=>FM.carte(...x);
  const accueilAvant=FM.vues.accueil;
  FM.vues.accueil=function(app){
    const vue=accueilAvant(app),e=app.etat;
    const jours=e.programme.jours.filter(j=>j.items.length);
    let choisi=FM.prochainJour?FM.prochainJour(e):jours[0];
    const action=h('section',{class:'carte forge-launch-card'});
    const dessiner=()=>{
      action.replaceChildren();
      if(e.active){
        action.append(h('p',{class:'surtitre'},'ENTRAÎNEMENT EN COURS'),
          h('h2',{},e.active.nom||'Ta séance'),
          h('p',{class:'discret'},'Tu as déjà commencé. Reprends exactement là où tu en étais.'),
          FM.btn('Reprendre ma séance',()=>app.aller('#/seance'),'primaire geant forge-main-action'));
        return;
      }
      action.append(h('p',{class:'surtitre'},'PRÊT À T’ENTRAÎNER ?'),
        h('h2',{},choisi?choisi.nom:'Crée ton premier programme'),
        h('p',{class:'discret'},choisi?choisi.items.length+' exercices · environ '+FM.duree(choisi.items)+' minutes':'Configure ton programme pour obtenir tes séances personnalisées.'));
      if(!choisi){
        action.append(FM.btn('Créer mon programme',()=>app.aller('#/programme'),'primaire geant forge-main-action'));
        return;
      }
      action.append(FM.apercu(choisi));
      if(jours.length>1){
        const select=h('select',{class:'forge-day-select','aria-label':'Choisir une séance',onchange:ev=>{choisi=jours.find(j=>j.id===ev.target.value)||jours[0];dessiner();}},jours.map(j=>h('option',{value:j.id,selected:j.id===choisi.id},j.nom)));
        action.append(h('label',{class:'forge-day-label'},'Choisir une autre séance',select));
      }
      action.append(FM.btn('Commencer ma séance',()=>app.demarrerSeance(choisi),'primaire geant forge-main-action'),
        FM.lien('#/programme','Modifier mon programme ou mes exercices','forge-program-link'));
    };
    dessiner();
    const hero=vue.querySelector('.home-hero');
    if(hero) hero.after(action); else vue.prepend(action);
    return vue;
  };

  /* La page Séance regroupe les vues avant que ce module soit chargé :
     on enrichit donc le hub final, pas la vue programme isolée. */
  const seanceHubAvant=FM.vues.seanceHub;
  FM.vues.seanceHub=function(app,actif,sousOnglet){
    const vue=seanceHubAvant(app,actif,sousOnglet);
    if(actif!=='programme')return vue;
    const jours=(app.etat.programme&&app.etat.programme.jours)||[];
    vue.querySelectorAll('.forge-seance-panel .carte').forEach(bloc=>{
      const nom=bloc.querySelector('h2')?.textContent.trim();
      const jour=jours.find(j=>j.nom===nom);
      const entete=bloc.querySelector('.entete');
      if(jour&&jour.items&&jour.items.length&&entete&&!bloc.querySelector('.forge-program-start')){
        entete.after(FM.btn('Démarrer cette séance',()=>app.demarrerSeance(jour),'primaire geant forge-program-start'));
      }
      bloc.querySelectorAll('ul.apercu li').forEach(ligne=>{
        const lien=ligne.querySelector('a[href*="#/exercice/"]');
        if(!lien||ligne.querySelector('.forge-program-exercise-thumb'))return;
        const id=(lien.getAttribute('href')||'').split('/').pop();
        const exercice=FM.EX&&FM.EX[id];
        if(!exercice||!FM.slugImageExercice||!FM.slugImageExercice(exercice.nom))return;
        const vignette=FM.animationExercice(exercice,true);
        vignette.classList.add('forge-program-exercise-thumb');
        ligne.classList.add('forge-program-exercise-row');
        ligne.insertBefore(vignette,lien);
      });
    });
    return vue;
  };

  const paliers=[
    {nom:'Débutant',min:0,icone:'🌱'},
    {nom:'Bronze',min:250,icone:'🥉'},
    {nom:'Argent',min:600,icone:'🥈'},
    {nom:'Or',min:1100,icone:'🥇'},
    {nom:'Platine',min:1800,icone:'💠'},
    {nom:'Diamant',min:2700,icone:'💎'},
    {nom:'Légende',min:3900,icone:'🔥'},
    {nom:'Élite Forge',min:5400,icone:'🏆'}
  ];
  function stats(e){
    const sessions=e.seances||[];
    const sets=sessions.reduce((n,s)=>n+s.exercices.reduce((a,x)=>a+x.series.filter(y=>y.fait&&y.reps>0&&y.type!=='echauffement').length,0),0);
    const prs=sessions.reduce((n,s)=>n+FM.nouveauxRecords(sessions,s).length,0);
    const cardio=(e.cardio||[]).reduce((n,c)=>n+(Number(c.duree)||0),0);
    const xp=sessions.length*100+sets*10+prs*50+Math.floor(cardio/10)*5;
    let index=0;
    for(let i=0;i<paliers.length;i++)if(xp>=paliers[i].min)index=i;
    const current=paliers[index],next=paliers[index+1]||null;
    return {sessions,sets,prs,cardio,xp,index,current,next,progress:next?Math.min(100,(xp-current.min)/(next.min-current.min)*100):100};
  }
  function ongletsClassement(bodyActif){
    return h('nav',{class:'forge-seance-tabs forge-rank-tabs','aria-label':'Classements'},
      h('a',{class:'forge-seance-tab'+(!bodyActif?' active':''),href:'#/classement','aria-current':!bodyActif?'page':null},'Rangs Forge'),
      h('a',{class:'forge-seance-tab'+(bodyActif?' active':''),href:'#/classement/body','aria-current':bodyActif?'page':null},'Body Forge'));
  }
  function semaineBodyForge(){
    const lundi=new Date();lundi.setHours(0,0,0,0);lundi.setDate(lundi.getDate()-((lundi.getDay()+6)%7));
    const fin=new Date(lundi);fin.setDate(fin.getDate()+7);
    const iso=lundi.getFullYear()+'-'+String(lundi.getMonth()+1).padStart(2,'0')+'-'+String(lundi.getDate()).padStart(2,'0');
    return {debut:lundi,fin,iso,label:lundi.toLocaleDateString('fr-FR',{day:'numeric',month:'long'})};
  }
  function calculBodyForge(e,semaine){
    const sessions=(e.seances||[]).filter(s=>Number(s.debut)>=semaine.debut.getTime()&&Number(s.debut)<semaine.fin.getTime());
    const sets=sessions.reduce((n,s)=>n+(s.exercices||[]).reduce((a,x)=>a+(x.series||[]).filter(y=>y.fait&&Number(y.reps)>0&&y.type!=='echauffement').length,0),0);
    const records=sessions.reduce((n,s)=>n+FM.nouveauxRecords(e.seances||[],s).length,0);
    const points=sessions.length*100+sets*5+records*25;
    const divisions=[{nom:'Rookie',min:0,icone:'🌱'},{nom:'Bronze',min:200,icone:'🥉'},{nom:'Argent',min:400,icone:'🥈'},{nom:'Or',min:700,icone:'🥇'},{nom:'Diamant',min:1000,icone:'💎'}];
    let division=divisions[0],suivante=divisions[1];
    divisions.forEach((d,i)=>{if(points>=d.min){division=d;suivante=divisions[i+1]||null;}});
    return {sessions:sessions.length,sets,records,points,division,suivante};
  }
  function bodyForge(app){
    const semaine=semaineBodyForge(),score=calculBodyForge(app.etat,semaine);
    const rootPage=h('div',{class:'forge-page forge-body-forge'},ongletsClassement(true),
      h('p',{class:'surtitre'},'LA COMPÉTITION FORGE'),h('h1',{},'Body Forge'),
      h('p',{class:'discret'},'Chaque semaine, grimpe au classement grâce à ta régularité, tes séries validées et tes records. Les charges ne donnent aucun avantage.'),
      carte(h('div',{class:'forge-body-score-head'},h('div',{},h('p',{class:'surtitre'},'TA SAISON · SEMAINE DU '+semaine.label.toUpperCase()),h('h2',{},score.division.icone+' '+score.division.nom)),h('strong',{class:'forge-body-points'},score.points.toLocaleString('fr-FR')+' pts')),
        h('div',{class:'forge-body-stats'},
          h('div',{},h('strong',{},String(score.sessions)),h('span',{},'Séances')),
          h('div',{},h('strong',{},String(score.sets)),h('span',{},'Séries')),
          h('div',{},h('strong',{},String(score.records)),h('span',{},'Records'))),
        h('p',{class:'discret'},score.suivante?(score.suivante.min-score.points).toLocaleString('fr-FR')+' points pour atteindre '+score.suivante.nom:'Tu as atteint la division maximale de la semaine.')),
      carte(h('div',{class:'forge-card-head'},h('h2',{},'Classement hebdomadaire'),h('span',{class:'forge-tag'},'TOP 20')),
        h('p',{class:'discret'},'Les membres apparaissent avec un pseudo public. Ton adresse e-mail et tes données personnelles ne sont jamais affichées.'),
        h('div',{class:'forge-body-board-status','aria-live':'polite'},'Chargement du classement…'),
        h('div',{class:'forge-body-board'}),
        h('div',{class:'forge-body-join'}),
        FM.btn('Actualiser le classement',()=>charger(),'primaire geant forge-body-refresh')),
      carte(h('h2',{},'Comment gagner des points ?'),
        h('div',{class:'forge-body-rules'},
          h('div',{},h('strong',{},'+100'),h('span',{},'Séance terminée')),
          h('div',{},h('strong',{},'+5'),h('span',{},'Série de travail validée')),
          h('div',{},h('strong',{},'+25'),h('span',{},'Record personnel battu'))),
        h('p',{class:'discret'},'Le classement repart à zéro chaque lundi. Pas de points pour les séries d’échauffement. Le but : progresser régulièrement, pas s’entraîner sans récupérer.')));
    const status=rootPage.querySelector('.forge-body-board-status');
    const board=rootPage.querySelector('.forge-body-board');
    const join=rootPage.querySelector('.forge-body-join');
    const safeGet=k=>{try{return root.localStorage.getItem(k);}catch(_){return null;}};
    const safeSet=(k,v)=>{try{root.localStorage.setItem(k,v);}catch(_){/* stockage local indisponible */}};
    let client=null,session=null,ownNickname='';
    function afficherBoard(rows){
      board.replaceChildren();
      if(!rows.length){board.append(h('p',{class:'discret'},'Le classement est encore vide. Rejoins Body Forge pour ouvrir la saison !'));return;}
      rows.forEach((r,i)=>{
        const isYou=!!ownNickname&&r.nickname===ownNickname;
        board.append(h('div',{class:'forge-body-board-row'+(isYou?' is-you':'')},
          h('span',{class:'forge-body-position'},i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)),
          h('div',{class:'forge-body-member'},h('strong',{},r.nickname),h('small',{},(r.weekly_sessions||0)+' séances · '+(r.weekly_sets||0)+' séries')),
          h('strong',{class:'forge-body-member-points'},Number(r.weekly_points||0).toLocaleString('fr-FR')+' pts')));
      });
      if(ownNickname&&!rows.some(r=>r.nickname===ownNickname))board.append(h('p',{class:'discret'},'Tu es inscrit, mais tu es actuellement en dehors du top 20. Continue ta progression !'));
    }
    function afficherConnexion(){
      join.replaceChildren();
      if(!session){
        join.append(h('p',{class:'discret'},'Pour apparaître dans le classement, connecte-toi à ton compte Forge puis reviens ici.'),FM.lien('#/profil','Se connecter dans Profil','forge-body-profile-link'));
        return;
      }
      if(ownNickname){join.append(h('p',{class:'forge-body-optin'},'✓ Tu participes au classement sous le pseudo '+ownNickname+'.'));return;}
      const form=h('form',{class:'forge-body-join-form'},h('label',{},'Choisis ton pseudo public',h('input',{type:'text',name:'nickname',minlength:2,maxlength:20,required:true,autocomplete:'nickname',placeholder:'Ex. IronMax'})),h('p',{class:'discret'},'Ton pseudo et tes points hebdomadaires seront visibles par les autres membres. Tu peux quitter le classement en supprimant ta participation depuis cet écran.'));
      const submit=h('button',{type:'submit',class:'btn primaire geant'},'Rejoindre Body Forge');form.append(submit);
      form.addEventListener('submit',async ev=>{
        ev.preventDefault();const field=form.querySelector('input');const nickname=field.value.trim().replace(/\\s+/g,' ');
        if(nickname.length<2||nickname.length>20||nickname.includes('@')){status.textContent='Choisis un pseudo de 2 à 20 caractères, sans adresse e-mail.';return;}
        submit.disabled=true;status.textContent='Inscription au classement…';
        const saved=await enregistrer(nickname);
        submit.disabled=false;
        if(saved){ownNickname=nickname;safeSet('forge-body-nickname:'+session.user.id,nickname);afficherConnexion();await charger();}
      });
      join.append(form);
    }
    async function enregistrer(nickname){
      if(!client||!session)return false;
      const {error}=await client.from('body_forge_leaderboard').upsert({user_id:session.user.id,nickname,weekly_points:score.points,weekly_sessions:score.sessions,weekly_sets:score.sets,week_start:semaine.iso},{onConflict:'user_id'});
      if(error){status.textContent='Inscription impossible : '+error.message;return false;}
      return true;
    }
    async function charger(){
      status.textContent='Actualisation du classement…';
      try{
        if(!client){const module=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');client=module.createClient('https://xqvmfdvzgywinddxkbdl.supabase.co','sb_publishable_tHLViJ0JO41Phe24lPCL_g_XepTcbeQ',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}});}
        const auth=await client.auth.getSession();if(auth.error)throw auth.error;session=auth.data.session;
        if(session){
          ownNickname=safeGet('forge-body-nickname:'+session.user.id)||'';
          if(!ownNickname){const own=await client.from('body_forge_leaderboard').select('nickname').eq('user_id',session.user.id).maybeSingle();if(own.error)throw own.error;if(own.data){ownNickname=own.data.nickname;safeSet('forge-body-nickname:'+session.user.id,ownNickname);}}
          if(ownNickname){const ok=await enregistrer(ownNickname);if(!ok)throw new Error('Mise à jour de ton score impossible.');}
        }
        const result=await client.from('body_forge_leaderboard').select('nickname,weekly_points,weekly_sessions,weekly_sets,week_start,updated_at').eq('week_start',semaine.iso).order('weekly_points',{ascending:false}).order('updated_at',{ascending:true}).limit(20);
        if(result.error)throw result.error;
        afficherBoard(result.data||[]);afficherConnexion();
        status.textContent='Classement actualisé · semaine du '+semaine.label+'.';
      }catch(error){
        status.textContent='Classement indisponible pour le moment. Tes statistiques restent enregistrées sur cet appareil.';
        afficherConnexion();
      }
    }
    Promise.resolve().then(charger);
    return rootPage;
  }
  FM.vues.classement=function(app,sousPage){
    if(sousPage==='body')return bodyForge(app);
    const s=stats(app.etat),e=app.etat;
    const bar=h('div',{class:'forge-rank-track'},h('i',{style:'width:'+s.progress+'%'}));
    const achievements=[
      ['Premier pas','Terminer une première séance',s.sessions.length>=1,'🏁'],
      ['Régulier','Terminer 5 séances',s.sessions.length>=5,'📅'],
      ['Habitué','Terminer 10 séances',s.sessions.length>=10,'💪'],
      ['Machine','Terminer 25 séances',s.sessions.length>=25,'⚡'],
      ['Centurion','Valider 100 séries',s.sets>=100,'🎯'],
      ['Volume','Valider 500 séries',s.sets>=500,'🔥'],
      ['Record personnel','Battre un record',s.prs>=1,'🏅'],
      ['Chasseur de records','Battre 10 records',s.prs>=10,'👑'],
      ['Endurant','Cumuler 300 minutes de cardio',s.cardio>=300,'🚴']
    ];
    const badges=achievements.map(a=>h('div',{class:'forge-achievement'+(a[2]?' unlocked':' locked')},
      h('span',{class:'forge-achievement-icon'},a[3]),
      h('div',{},h('strong',{},a[0]),h('small',{},a[1])),
      h('b',{class:'forge-achievement-state'},a[2]?'Obtenu':'À débloquer')));
    return h('div',{class:'forge-page forge-ranks-page'},
      ongletsClassement(false),
      h('p',{class:'surtitre'},'TA PROGRESSION PERSONNELLE'),
      h('h1',{},'Rangs Forge'),
      carte(h('div',{class:'forge-rank-hero'},
        h('div',{class:'forge-rank-emblem'},s.current.icone),
        h('div',{},h('p',{class:'surtitre'},'RANG ACTUEL'),h('h2',{},s.current.nom),h('strong',{class:'forge-rank-xp'},s.xp.toLocaleString('fr-FR')+' XP'))
      ),
      h('div',{class:'forge-rank-progress-head'},h('span',{},s.next?'Progression vers '+s.next.nom:'Rang maximum atteint'),h('b',{},s.next?(s.next.min-s.xp).toLocaleString('fr-FR')+' XP restants':'100 %')),
      bar,
      h('p',{class:'discret'},'Gagne de l’XP en terminant tes séances, en validant des séries, en battant tes records et en faisant du cardio.')),
      h('div',{class:'forge-rank-stats'},
        carte(h('strong',{},String(s.sessions.length)),h('span',{},'Séances terminées')),
        carte(h('strong',{},String(s.sets)),h('span',{},'Séries validées')),
        carte(h('strong',{},String(s.prs)),h('span',{},'Records battus')),
        carte(h('strong',{},s.cardio+' min'),h('span',{},'Cardio cumulé'))),
      carte(h('h2',{},'Tous les rangs'),h('div',{class:'forge-rank-list'},paliers.map((p,i)=>h('div',{class:'forge-rank-row'+(i===s.index?' current':i<s.index?' passed':'')},h('span',{class:'forge-rank-row-icon'},p.icone),h('strong',{},p.nom),h('small',{},p.min.toLocaleString('fr-FR')+' XP'),h('b',{},i<s.index?'✓':i===s.index?'Actuel':'🔒'))))),
      carte(h('h2',{},'Tes trophées'),h('p',{class:'discret'},'Débloque des trophées en progressant dans ton entraînement.'),h('div',{class:'forge-achievements'},badges)),
      FM.btn('Commencer une séance',()=>app.aller('#/accueil'),'primaire geant')
    );
  };
  FM.vues.rangs=FM.vues.classement;
})(typeof window!=='undefined'?window:globalThis);
