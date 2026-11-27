/* Avatar 3D Body Forge — modèles musculaires homme/femme, couleurs liées aux rangs. */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const RANK_COLORS=['#8b929b','#b87945','#b9c0c9','#e4bd4c','#65c5c2','#59a8f4','#a17bf2','#f07855','#f4e3a0'];
const BASE='#29323b', EDGE='#111820';

function makeAvatar(sex, ranks){
  const root=new THREE.Group();
  const male=sex==='m', shoulder=male?0.76:0.66, hip=male?0.48:0.62, waist=male?0.43:0.39;
  const mats={};
  const mat=(color,rough=.58,metal=.02)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
  const baseMat=mat(BASE,.72), darkMat=mat('#1b242c',.66), skinMat=mat('#aeb6bd',.58), detailMat=mat('#687681',.65);
  const sphereGeo=new THREE.SphereGeometry(1,32,24);
  function part(group,x,y,z,sx,sy,sz,depth=0.16,material=null){
    const materialToUse=material||mat(RANK_COLORS[Math.max(0,Math.min(8,ranks[group]??-1))]||BASE,.52,.06);
    const mesh=new THREE.Mesh(sphereGeo,materialToUse);
    mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;mesh.receiveShadow=true;
    mesh.userData.muscle=group;root.add(mesh);return mesh;
  }
  function base(x,y,z,sx,sy,sz,material=baseMat){
    const mesh=new THREE.Mesh(sphereGeo,material);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);return mesh;
  }
  function muscle(group,x,y,z,sx,sy,sz,front=true){
    const rank=ranks[group];const color=rank===undefined||rank<0?BASE:RANK_COLORS[rank];
    return part(group,x,y,z,sx,sy,sz,.16,mat(color,.48,.07));
  }
  function capsule(x1,y1,z1,x2,y2,z2,r,material=baseMat){
    const a=new THREE.Vector3(x1,y1,z1),b=new THREE.Vector3(x2,y2,z2),dir=new THREE.Vector3().subVectors(b,a);
    const mesh=new THREE.Mesh(new THREE.CapsuleGeometry(r,Math.max(.05,dir.length()-2*r),6,16),material);
    mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);return mesh;
  }
  // Silhouette générale : une seule sculpture, avec volumes musculaires indépendants.
  base(0,1.42,0, .66,1.03,.30);
  base(0,2.02,0, .70, male?.48:.43,.29);
  base(0,1.15,0, hip,.44,.31);
  base(0,2.55,0,.19,.25,.19);
  base(0,2.91,0,.31,.40,.29,skinMat);
  base(0,3.00,.245,.18,.11,.07,detailMat);
  // Bras et avant-bras.
  for(const s of [-1,1]){
    base(s*shoulder,2.23,0,.24,.31,.25);
    capsule(s*shoulder,2.18,0,s*(shoulder+.18),1.69,0,.16);
    capsule(s*(shoulder+.18),1.69,0,s*(shoulder+.25),1.18,0,.12);
    base(s*(shoulder+.26),1.07,0,.13,.17,.12,darkMat);
    // Jambes et pieds.
    capsule(s*.29,1.00,0,s*.31,.22,0,.19);
    capsule(s*.31,.22,0,s*.32,-.66,0,.125);
    base(s*.32,-.78,.10,.16,.12,.27,darkMat);
  }
  // Torse et muscles antérieurs.
  muscle('shoulders',-.61,2.35,.20,.25,.25,.17);muscle('shoulders',.61,2.35,.20,.25,.25,.17);
  muscle('chest',-.31,2.05,.275,.34,.23,.105);muscle('chest',.31,2.05,.275,.34,.23,.105);
  muscle('biceps',-.79,1.86,.10,.15,.25,.15);muscle('biceps',.79,1.86,.10,.15,.25,.15);
  muscle('triceps',-.83,1.82,-.10,.14,.27,.14);muscle('triceps',.83,1.82,-.10,.14,.27,.14);
  muscle('forearms',-.90,1.39,.08,.115,.28,.12);muscle('forearms',.90,1.39,.08,.115,.28,.12);
  for(let i=0;i<4;i++){const y=1.77-i*.17;muscle('abs',-.105,y,.292,.095,.075,.045);muscle('abs',.105,y,.292,.095,.075,.045);}
  muscle('obliques',-.37,1.62,.19,.12,.29,.12);muscle('obliques',.37,1.62,.19,.12,.29,.12);
  muscle('quads',-.30,.68,.19,.22,.39,.17);muscle('quads',.30,.68,.19,.22,.39,.17);
  muscle('calves',-.32,-.30,.13,.15,.31,.13);muscle('calves',.32,-.30,.13,.15,.31,.13);
  // Dos et muscles postérieurs.
  muscle('back',-.30,2.04,-.245,.34,.46,.10,false);muscle('back',.30,2.04,-.245,.34,.46,.10,false);
  muscle('traps',0,2.42,-.22,.28,.28,.12,false);
  muscle('triceps',-.83,1.83,-.17,.14,.27,.12,false);muscle('triceps',.83,1.83,-.17,.14,.27,.12,false);
  muscle('glutes',-.25,1.12,-.25,.25,.24,.14,false);muscle('glutes',.25,1.12,-.25,.25,.24,.14,false);
  muscle('hamstrings',-.30,.62,-.17,.20,.38,.14,false);muscle('hamstrings',.30,.62,-.17,.20,.38,.14,false);
  muscle('calves',-.32,-.30,-.13,.14,.30,.12,false);muscle('calves',.32,-.30,-.13,.14,.30,.12,false);
  // Repères de séparation anatomique discrets.
  for(const s of [-1,1]){
    base(s*.11,1.98,.365,.012,.16,.008,detailMat);
    base(s*.30,1.56,.31,.012,.16,.008,detailMat);
  }
  return root;
}

function mount(container, initial){
  if(container.__forge3d?.dispose)container.__forge3d.dispose();
  const width=Math.max(220,container.clientWidth||300),height=Math.max(320,container.clientHeight||410);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#10171e');
  const camera=new THREE.PerspectiveCamera(34,width/height,.1,100);camera.position.set(0,1.45,8.2);camera.lookAt(0,1.15,0);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));renderer.setSize(width,height);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  container.replaceChildren(renderer.domElement);
  scene.add(new THREE.HemisphereLight('#dceaff','#26313a',2.0));
  const key=new THREE.DirectionalLight('#ffffff',3.2);key.position.set(-3,5,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);scene.add(key);
  const rim=new THREE.DirectionalLight('#83a9bf',2.0);rim.position.set(3,3,-4);scene.add(rim);
  const floor=new THREE.Mesh(new THREE.CircleGeometry(1.35,64),new THREE.MeshStandardMaterial({color:'#1b2730',roughness:.9,metalness:.1}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-.93;floor.scale.set(1.15,1.15,1);floor.receiveShadow=true;scene.add(floor);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.92,.012,8,90),new THREE.MeshBasicMaterial({color:'#4c626e',transparent:true,opacity:.45}));
  ring.rotation.x=Math.PI/2;ring.position.y=-.91;ring.scale.set(1.2,1.2,1);scene.add(ring);
  let sex=initial.sex==='f'?'f':'m',ranks=initial.ranks||{},avatar=makeAvatar(sex,ranks);scene.add(avatar);
  let targetY=0,dragging=false,lastX=0,lastY=0,raf=0,disposed=false;
  const canvas=renderer.domElement;
  function pointerDown(e){dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture?.(e.pointerId);}
  function pointerMove(e){if(!dragging)return;const dx=e.clientX-lastX;lastX=e.clientX;lastY=e.clientY;avatar.rotation.y+=dx*.009;}
  function pointerUp(){dragging=false;}
  canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerUp);
  canvas.style.touchAction='pan-y';
  function animate(){if(disposed)return;raf=requestAnimationFrame(animate);avatar.rotation.y+=(targetY-avatar.rotation.y)*.08;renderer.render(scene,camera);}
  animate();
  const resize=new ResizeObserver(()=>{if(disposed)return;const w=Math.max(220,container.clientWidth||300),h=Math.max(320,container.clientHeight||410);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);});
  resize.observe(container);
  const api={
    setSex(value){sex=value==='f'?'f':'m';scene.remove(avatar);avatar=makeAvatar(sex,ranks);avatar.rotation.y=targetY;scene.add(avatar);},
    setView(value){targetY=value==='back'?Math.PI:0;},
    reset(){targetY=0;avatar.rotation.y=0;},
    dispose(){disposed=true;cancelAnimationFrame(raf);resize.disconnect();canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerup',pointerUp);renderer.dispose();container.replaceChildren();}
  };
  container.__forge3d=api;return api;
}
window.ForgeAvatar3D={mount};
window.dispatchEvent(new Event('forge-avatar-ready'));
