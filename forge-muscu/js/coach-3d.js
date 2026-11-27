/* Démonstrations vidéo réelles : Exercise DB with Videos. */
(function(){
'use strict';
const API='https://exercise-database.zenithfits.com/api/v1/search?q=';
const cache=new Map();
const aliases=[
 [/developpe.*couche|bench press|chest press/,'barbell bench press'],
 [/developpe.*incline/,'incline dumbbell bench press'],
 [/developpe.*decline/,'decline bench press'],
 [/ecarte.*poulie|crossover|pec deck/,'cable chest fly'],
 [/pompe/,'push up'],[/dips?/,'chest dip'],
 [/tirage.*vertical|lat pulldown/,'lat pulldown'],[/traction/,'pull up'],
 [/rowing|tirage.*horizontal/,'seated cable row'],
 [/souleve.*terre|deadlift/,'barbell deadlift'],[/squat/,'barbell squat'],
 [/presse.*cuisse|leg press/,'leg press'],[/extension.*quadriceps|leg extension/,'leg extension'],
 [/curl.*ischio|leg curl/,'lying leg curl'],[/hip thrust|extension.*hanche/,'barbell hip thrust'],
 [/fente|lunge/,'dumbbell lunge'],[/mollet|calf raise/,'standing calf raise'],
 [/curl.*marteau|hammer curl/,'dumbbell hammer curl'],[/curl.*biceps|curl barre/,'barbell curl'],
 [/curl.*haltere|dumbbell curl/,'dumbbell biceps curl'],
 [/extension.*triceps.*corde|pushdown/,'cable rope triceps pushdown'],
 [/extension.*triceps|triceps/,'cable triceps extension'],
 [/elevation.*laterale|elevation.*laterale/,'dumbbell lateral raise'],
 [/oiseau|arriere.*epaule|rear delt/,'dumbbell rear delt fly'],
 [/shrug|haussement/,'dumbbell shrug'],
 [/crunch.*poulie|cable crunch/,'cable crunch'],[/crunch/,'crunch'],
 [/gainage|planche|plank/,'plank'],[/releve.*jambe|leg raise/,'lying leg raise'],
 [/rotation.*buste|russian twist|oblique/,'russian twist']
];
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function queries(name){const n=norm(name),out=[name];for(const [re,q] of aliases)if(re.test(n))out.push(q);return [...new Set(out)];}
function listFrom(d){return Array.isArray(d)?d:Array.isArray(d.data)?d.data:Array.isArray(d.results)?d.results:[];}
function score(item,q,name){
 const n=norm(name),title=norm(item.name),alias=(item.aliases||[]).map(norm),nq=norm(q);
 if(title===n||alias.includes(n))return 1;
 if(title===nq||alias.includes(nq))return .99;
 const tokens=x=>new Set(x.split(' ').filter(t=>t.length>2)),a=tokens(nq),b=tokens(title);
 if(!a.size||!b.size)return 0;let common=0;for(const t of a)if(b.has(t))common++;
 return common/Math.max(a.size,b.size);
}
async function find(name){
 if(cache.has(name))return cache.get(name);
 const task=(async()=>{for(const q of queries(name)){try{
  const r=await fetch(API+encodeURIComponent(q),{headers:{Accept:'application/json'}});if(!r.ok)continue;
  const items=listFrom(await r.json()),ranked=items.map(x=>({x,s:score(x,q,name)})).sort((a,b)=>b.s-a.s);
  if(ranked.length&&ranked[0].s>=.55&&ranked[0].x.videos&&(ranked[0].x.videos.male||ranked[0].x.videos.female))return ranked[0].x;
 }catch(_){}}return null;})();
 cache.set(name,task);return task;
}
function message(t){const p=document.createElement('div');p.className='forge-media-loading';p.textContent=t;return p;}
function show(el,item){
 const video=document.createElement('video');video.className='forge-demo-video';video.src=item.videos.male||item.videos.female;
 video.poster=item.thumbnails&&(item.thumbnails.male||item.thumbnails.female)||'';video.controls=true;video.playsInline=true;video.preload='metadata';video.loop=true;video.muted=true;
 video.setAttribute('aria-label','Démonstration vidéo : '+item.name);
 video.addEventListener('error',()=>el.replaceChildren(message('Cette vidéo est momentanément indisponible.')),{once:true});
 const label=document.createElement('div');label.className='forge-demo-caption';label.textContent='Démonstration : '+item.name;el.replaceChildren(video,label);
}
function mount(el){if(el.dataset.mediaReady==='1')return;el.dataset.mediaReady='1';const name=el.dataset.exerciseName||'';
 if(!name){el.replaceChildren(message('Démonstration non renseignée.'));return;}
 find(name).then(item=>{if(!el.isConnected)return;if(item)show(el,item);else el.replaceChildren(message('Aucune démonstration vidéo exacte trouvée pour cet exercice.'));});
}
const observer=new MutationObserver(()=>document.querySelectorAll('.forge-exercise-media[data-3d="1"]').forEach(mount));
function start(){document.querySelectorAll('.forge-exercise-media[data-3d="1"]').forEach(mount);observer.observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.Forge3D={mount};
})();