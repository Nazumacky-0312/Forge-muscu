/* Body Forge — vrai atlas musculaire 3D Open Anatomy, homme et femme. */
let THREE, GLTFLoader, MeshoptDecoder;
async function loadEngine(base) {
  const [three, loader, meshopt] = await Promise.all([
    import(base === 'esm' ? 'https://esm.sh/three@0.160.0' : 'https://cdn.jsdelivr.net/npm/three@0.160.0/+esm'),
    import(base === 'esm' ? 'https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js' : 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js/+esm'),
    import(base === 'esm' ? 'https://esm.sh/three@0.160.0/examples/jsm/libs/meshopt_decoder.module.js' : 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/meshopt_decoder.module.js/+esm')
  ]);
  THREE = three;
  GLTFLoader = loader.GLTFLoader;
  MeshoptDecoder = meshopt.MeshoptDecoder;
}
try {
  await loadEngine('esm');
} catch (primaryError) {
  try { await loadEngine('jsdelivr'); }
  catch (secondaryError) {
    window.dispatchEvent(new CustomEvent('forge-avatar-error', {detail:'Le moteur 3D ne s’est pas chargé. Vérifie ta connexion puis recharge Body Forge.'}));
    throw secondaryError || primaryError;
  }
}

const RANK_COLORS=['#8b929b','#b87945','#b9c0c9','#e4bd4c','#65c5c2','#59a8f4','#a17bf2','#f07855','#f4e3a0'];
const BASE_COLOR='#87939d';
const MUSCLE_GROUP={
  abdominal_muscles:'abs', intercostals_l:'abs', intercostals_r:'abs',
  back_muscles_l:'back', back_muscles_r:'back',
  calf_l:'calves', calf_r:'calves', shin_muscles_l:'calves', shin_muscles_r:'calves',
  chest_muscles_l:'chest', chest_muscles_r:'chest',
  deltoid_l:'shoulders', deltoid_r:'shoulders',
  shoulder_muscles_l:'shoulders', shoulder_muscles_r:'shoulders',
  rotator_cuff_l:'shoulders', rotator_cuff_r:'shoulders',
  forearm_muscles_l:'forearms', forearm_muscles_r:'forearms',
  gluteal_l:'glutes', gluteal_r:'glutes',
  hamstrings_l:'hamstrings', hamstrings_r:'hamstrings',
  quadriceps_l:'quads', quadriceps_r:'quads',
  trapezius_l:'traps', trapezius_r:'traps',
  upper_arm_muscles_l:'upperarms', upper_arm_muscles_r:'upperarms'
};
const loader=new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
const modelCache=new Map();
async function getModel(sex,onProgress){
  const key=sex==='f'?'female':'male';
  if(modelCache.has(key))return modelCache.get(key);
  const url='https://cdn.jsdelivr.net/npm/open-anatomy-3d@0.1.0/models/anatomy-'+key+'.glb';
  const promise=loader.loadAsync(url,onProgress).then(gltf=>gltf.scene);
  modelCache.set(key,promise);
  try{return await promise;}catch(error){modelCache.delete(key);throw error;}
}
function rankColor(key,ranks){
  const group=MUSCLE_GROUP[key];
  if(!group)return BASE_COLOR;
  let rank=ranks[group]??-1;
  if(group==='upperarms')rank=Math.max(ranks.biceps??-1,ranks.triceps??-1);
  return rank>=0?RANK_COLORS[Math.min(8,rank)]:BASE_COLOR;
}
function makeAnatomy(source,ranks){
  const model=source.clone(true);
  model.name='forge-anatomy-model';
  model.traverse(node=>{
    if(node.parent===model){
      node.visible=node.name==='muscles';
    }
  });
  let muscleCount=0;
  model.traverse(node=>{
    if(!node.isMesh)return;
    let owner=node;
    while(owner&&owner!==model&&!Object.prototype.hasOwnProperty.call(MUSCLE_GROUP,owner.name))owner=owner.parent;
    if(!owner||owner===model)return;
    const color=rankColor(owner.name,ranks);
    node.material=new THREE.MeshStandardMaterial({
      color,roughness:.72,metalness:.015,side:THREE.DoubleSide
    });
    node.castShadow=true;
    node.receiveShadow=true;
    muscleCount++;
  });
  if(!muscleCount)throw new Error('Aucun muscle détecté dans le modèle anatomique.');
  model.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(model);
  const size=bounds.getSize(new THREE.Vector3());
  const center=bounds.getCenter(new THREE.Vector3());
  model.position.set(-center.x,-bounds.min.y,-center.z);
  model.userData.bodyHeight=size.y;
  return model;
}
function mount(container,initial){
  if(container.__forge3d?.dispose)container.__forge3d.dispose();
  const width=Math.max(220,container.clientWidth||300),height=Math.max(320,container.clientHeight||390);
  const scene=new THREE.Scene();
  scene.background=new THREE.Color('#111820');
  const camera=new THREE.PerspectiveCamera(31,width/height,.01,100);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.4));
  renderer.setSize(width,height);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.18;
  container.replaceChildren(renderer.domElement);
  const hemi=new THREE.HemisphereLight('#f0f5ff','#46505a',2.15);scene.add(hemi);
  const keyLight=new THREE.DirectionalLight('#fff4e8',3.1);keyLight.position.set(-2.8,4.2,4);scene.add(keyLight);
  const fill=new THREE.DirectionalLight('#8bb9df',1.45);fill.position.set(3,2,-3);scene.add(fill);
  const front=new THREE.DirectionalLight('#ffffff',.85);front.position.set(0,1,5);scene.add(front);
  const ground=new THREE.Mesh(new THREE.CircleGeometry(.72,64),new THREE.MeshStandardMaterial({color:'#202a33',roughness:.9,metalness:.05}));
  ground.rotation.x=-Math.PI/2;ground.position.y=-.018;ground.scale.set(1.3,1.3,1);scene.add(ground);
  let sex=initial.sex==='f'?'f':'m',ranks=initial.ranks||{},avatar=null,disposed=false,loadingToken=0,raf=0;
  let targetRotation=0,targetDistance=2.7,dragging=false,lastX=0;
  const status=document.createElement('div');status.className='forge-avatar-model-status';status.textContent='Chargement du modèle anatomique…';container.append(status);
  function frameModel(model){
    avatar=model;scene.add(avatar);
    const h=avatar.userData.bodyHeight||1.7;
    const targetY=h*.51;
    camera.position.set(0,targetY+h*.035,h*1.95);
    camera.lookAt(0,targetY,0);
    targetDistance=camera.position.z;
    targetRotation=0;
    avatar.rotation.y=0;
  }
  async function changeModel(nextSex){
    const token=++loadingToken;
    status.style.display='grid';status.textContent='Chargement du modèle anatomique…';
    try{
      const source=await getModel(nextSex,p=>{
        if(p.total&&status.isConnected)status.textContent='Chargement du modèle anatomique… '+Math.round(p.loaded/p.total*100)+' %';
      });
      if(disposed||token!==loadingToken)return;
      if(avatar){scene.remove(avatar);avatar.traverse(n=>{if(n.isMesh&&n.material)n.material.dispose();});}
      frameModel(makeAnatomy(source,ranks));
      sex=nextSex;
      status.remove();
    }catch(error){
      if(disposed||token!==loadingToken)return;
      console.error('Forge Muscu — modèle anatomique :',error);
      status.style.display='grid';
      status.textContent='Le modèle anatomique n’a pas pu être chargé. Vérifie ta connexion puis appuie sur Réessayer.';
      let retry=status.querySelector('button');
      if(!retry){retry=document.createElement('button');retry.type='button';retry.className='btn primaire';retry.textContent='Réessayer';retry.addEventListener('click',()=>changeModel(sex));status.append(retry);}
    }
  }
  const canvas=renderer.domElement;
  function pointerDown(e){dragging=true;lastX=e.clientX;canvas.setPointerCapture?.(e.pointerId);}
  function pointerMove(e){if(!dragging||!avatar)return;const dx=e.clientX-lastX;lastX=e.clientX;targetRotation+=dx*.009;}
  function pointerUp(){dragging=false;}
  function wheel(e){e.preventDefault();targetDistance=THREE.MathUtils.clamp(targetDistance+Math.sign(e.deltaY)*.12,1.65,4.8);}
  canvas.addEventListener('pointerdown',pointerDown);
  canvas.addEventListener('pointermove',pointerMove);
  canvas.addEventListener('pointerup',pointerUp);
  canvas.addEventListener('pointercancel',pointerUp);
  canvas.addEventListener('wheel',wheel,{passive:false});
  canvas.style.touchAction='pan-y';
  function animate(){
    if(disposed)return;
    raf=requestAnimationFrame(animate);
    if(avatar)avatar.rotation.y+=(targetRotation-avatar.rotation.y)*.09;
    const h=avatar?.userData.bodyHeight||1.7;
    const wantedZ=targetDistance;
    camera.position.z+=(wantedZ-camera.position.z)*.08;
    renderer.render(scene,camera);
  }
  animate();
  const resize=new ResizeObserver(()=>{
    if(disposed)return;
    const w=Math.max(220,container.clientWidth||300),h=Math.max(320,container.clientHeight||390);
    camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);
  });
  resize.observe(container);
  changeModel(sex);
  const api={
    setSex(value){const next=value==='f'?'f':'m';if(next!==sex)changeModel(next);},
    setView(value){targetRotation=value==='back'?Math.PI:0;},
    reset(){targetRotation=0;},
    dispose(){
      if(disposed)return;disposed=true;loadingToken++;cancelAnimationFrame(raf);resize.disconnect();
      canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointermove',pointerMove);
      canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointercancel',pointerUp);
      canvas.removeEventListener('wheel',wheel);
      if(avatar){scene.remove(avatar);avatar.traverse(n=>{if(n.isMesh&&n.material)n.material.dispose();});}
      renderer.dispose();container.replaceChildren();
    }
  };
  container.__forge3d=api;return api;
}
window.ForgeAvatar3D={mount};
window.dispatchEvent(new Event('forge-avatar-ready'));
