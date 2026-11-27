/* Photos de progression : stockage local IndexedDB et synchronisation privée Supabase. */
(function(root){
  'use strict';
  const FM=root.FM;
  if(!FM||!FM.vues||!FM.vues.suivi)return;

  const DB_NAME='forge-muscu-media-v1';
  const STORE='photos';
  const BUCKET='forge-progress-photos';
  const TABLE='forge_progress_photos';
  const MAX_BYTES=15*1024*1024;
  const MAX_DIMENSION=1600;
  let activeUrls=[];
  let refreshToken=0;

  const node=(tag,cls,text)=>{
    const el=root.document.createElement(tag);
    if(cls)el.className=cls;
    if(text!==undefined)el.textContent=text;
    return el;
  };
  const today=()=>{
    const d=new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  };
  const openDb=()=>new Promise((resolve,reject)=>{
    if(!root.indexedDB){reject(new Error('Le stockage local des photos n’est pas disponible sur ce navigateur.'));return;}
    const request=root.indexedDB.open(DB_NAME,1);
    request.onupgradeneeded=()=>{
      const db=request.result;
      if(!db.objectStoreNames.contains(STORE)){
        const store=db.createObjectStore(STORE,{keyPath:'id'});
        store.createIndex('date','date',{unique:false});
      }
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error||new Error('Ouverture du stockage photo impossible.'));
  });
  const requestValue=request=>new Promise((resolve,reject)=>{
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error||new Error('Opération de stockage impossible.'));
  });
  async function getPhotos(){
    const db=await openDb();
    try{return await requestValue(db.transaction(STORE,'readonly').objectStore(STORE).getAll())||[];}
    finally{db.close();}
  }
  async function putPhoto(photo){
    const db=await openDb();
    try{
      await new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE,'readwrite');
        tx.objectStore(STORE).put(photo);
        tx.oncomplete=resolve;
        tx.onerror=()=>reject(tx.error||new Error('Enregistrement local impossible.'));
        tx.onabort=()=>reject(tx.error||new Error('Enregistrement local annulé.'));
      });
    }finally{db.close();}
  }
  async function removeLocal(id){
    const db=await openDb();
    try{
      await new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE,'readwrite');
        tx.objectStore(STORE).delete(id);
        tx.oncomplete=resolve;
        tx.onerror=()=>reject(tx.error||new Error('Suppression locale impossible.'));
        tx.onabort=()=>reject(tx.error||new Error('Suppression locale annulée.'));
      });
    }finally{db.close();}
  }
  async function compressImage(file){
    let bitmap=null,source=null,width=0,height=0;
    if(root.createImageBitmap){
      try{bitmap=await root.createImageBitmap(file);source=bitmap;width=bitmap.width;height=bitmap.height;}catch(_){}
    }
    if(!source){
      const url=root.URL.createObjectURL(file);
      try{
        const image=await new Promise((resolve,reject)=>{
          const img=new Image();
          img.onload=()=>resolve(img);
          img.onerror=()=>reject(new Error('Cette image ne peut pas être ouverte. Choisis un fichier JPG, PNG ou WebP.'));
          img.src=url;
        });
        source=image;width=image.naturalWidth;height=image.naturalHeight;
      }finally{root.URL.revokeObjectURL(url);}
    }
    if(!width||!height){bitmap?.close?.();throw new Error('Dimensions de photo invalides.');}
    const scale=Math.min(1,MAX_DIMENSION/Math.max(width,height));
    const canvas=root.document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(width*scale));
    canvas.height=Math.max(1,Math.round(height*scale));
    const context=canvas.getContext('2d',{alpha:false});
    if(!context){bitmap?.close?.();throw new Error('Compression d’image indisponible sur ce navigateur.');}
    context.fillStyle='#111820';
    context.fillRect(0,0,canvas.width,canvas.height);
    context.drawImage(source,0,0,canvas.width,canvas.height);
    bitmap?.close?.();
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',0.82));
    if(!blob)throw new Error('La compression de cette photo a échoué.');
    if(blob.size>MAX_BYTES)throw new Error('La photo reste trop volumineuse après compression (maximum 15 Mo).');
    return blob;
  }
  async function cloudSession(){
    if(!root.ForgeCloud||typeof root.ForgeCloud.getSession!=='function')return {client:null,user:null,error:'Le service cloud n’est pas initialisé.'};
    return root.ForgeCloud.getSession();
  }
  async function uploadPhoto(photo,client,user){
    if(!photo.blob||!user)throw new Error('Photo ou compte manquant.');
    const existing=await client.from(TABLE).select('path').eq('id',photo.id).maybeSingle();
    if(existing.error)throw existing.error;
    if(existing.data){
      photo.cloudPath=existing.data.path;
      photo.cloudUserId=user.id;
      photo.syncedAt=Date.now();
      await putPhoto(photo);
      return;
    }
    const extension=photo.blob.type==='image/png'?'png':photo.blob.type==='image/jpeg'?'jpg':'webp';
    const path=user.id+'/'+photo.date+'/'+photo.id+'.'+extension;
    const upload=await client.storage.from(BUCKET).upload(path,photo.blob,{
      contentType:photo.blob.type||'image/webp',
      cacheControl:'3600',
      upsert:false
    });
    if(upload.error)throw upload.error;
    const inserted=await client.from(TABLE).insert({
      id:photo.id,
      user_id:user.id,
      path:path,
      taken_at:photo.date,
      pose:photo.pose,
      note:photo.note||''
    });
    if(inserted.error){
      await client.storage.from(BUCKET).remove([path]);
      throw inserted.error;
    }
    photo.cloudPath=path;
    photo.cloudUserId=user.id;
    photo.syncedAt=Date.now();
    await putPhoto(photo);
  }
  async function syncPhotos(status,render){
    if(!root.navigator.onLine){status.textContent='Hors ligne : tes photos restent disponibles sur cet appareil. La synchronisation attendra le retour du réseau.';return;}
    const cloud=await cloudSession();
    if(!cloud.client||!cloud.user){
      status.textContent=cloud.error||'Connecte-toi depuis Profil pour synchroniser tes photos en privé. Les photos locales restent disponibles.';
      return;
    }
    status.textContent='Synchronisation des photos…';
    const local=await getPhotos();
    for(const photo of local){
      if(photo.blob&&!photo.cloudPath)await uploadPhoto(photo,cloud.client,cloud.user);
    }
    const result=await cloud.client.from(TABLE)
      .select('id,path,taken_at,pose,note,created_at')
      .eq('user_id',cloud.user.id)
      .order('taken_at',{ascending:false})
      .limit(100);
    if(result.error)throw result.error;
    const current=await getPhotos();
    for(const remote of (result.data||[])){
      const existing=current.find(photo=>photo.id===remote.id);
      if(existing){
        existing.cloudPath=remote.path;
        existing.cloudUserId=cloud.user.id;
        existing.date=remote.taken_at;
        existing.pose=remote.pose;
        existing.note=remote.note||'';
        await putPhoto(existing);
      }else{
        await putPhoto({
          id:remote.id,
          date:remote.taken_at,
          pose:remote.pose,
          note:remote.note||'',
          blob:null,
          cloudPath:remote.path,
          cloudUserId:cloud.user.id,
          createdAt:remote.created_at
        });
      }
    }
    status.textContent=(result.data||[]).length+' photo(s) dans ton espace privé. Les fichiers de cet appareil sont conservés localement.';
    if(render)await render(cloud);
  }
  async function signedUrl(client,path){
    const result=await client.storage.from(BUCKET).createSignedUrl(path,900);
    if(result.error)throw result.error;
    return result.data.signedUrl;
  }
  async function renderGallery(gallery,status,cloud){
    const token=++refreshToken;
    activeUrls.forEach(url=>root.URL.revokeObjectURL(url));
    activeUrls=[];
    gallery.replaceChildren();
    let photos=await getPhotos();
    photos=photos.filter(photo=>photo.blob|| (cloud&&cloud.user&&photo.cloudUserId===cloud.user.id&&photo.cloudPath));
    photos.sort((a,b)=>(b.date||'').localeCompare(a.date||'')||(new Date(b.createdAt||0).getTime()-new Date(a.createdAt||0).getTime()));
    if(!photos.length){
      gallery.append(node('p','forge-progress-photos-empty','Aucune photo pour le moment. Ajoute une photo de face, de profil ou de dos pour commencer ton suivi.'));
      return;
    }
    for(const photo of photos){
      if(token!==refreshToken)return;
      const card=node('article','forge-progress-photo');
      const image=node('img','forge-progress-photo-image');
      image.alt='Photo de progression · '+(photo.pose||'pose')+' · '+(photo.date||'');
      image.loading='lazy';
      let src='';
      if(photo.blob){
        src=root.URL.createObjectURL(photo.blob);
        activeUrls.push(src);
      }else if(cloud&&cloud.client&&photo.cloudPath){
        try{src=await signedUrl(cloud.client,photo.cloudPath);}catch(error){status.textContent='Lecture d’une photo distante impossible : '+error.message;}
      }
      if(src)image.src=src;
      else image.alt='Photo privée indisponible. Connecte-toi pour la charger.';
      const info=node('div','forge-progress-photo-info');
      const poseLabel={face:'Face',profil:'Profil',dos:'Dos'}[photo.pose]||'Photo';
      info.append(node('strong','',poseLabel),node('span','',photo.date||'Date inconnue'));
      if(photo.note)info.append(node('p','',photo.note));
      info.append(node('small',photo.cloudPath?'forge-progress-photo-synced':'forge-progress-photo-local',photo.cloudPath?'Synchronisée en privé':'Sur cet appareil · à synchroniser'));
      const actions=node('div','forge-progress-photo-actions');
      if(photo.blob){
        const download=node('a','btn petit','Télécharger');
        download.href=src;
        const extension=photo.blob.type==='image/png'?'png':photo.blob.type==='image/jpeg'?'jpg':'webp';
        download.download='forge-muscu-'+(photo.date||'photo')+'-'+poseLabel.toLowerCase()+'.'+extension;
        actions.append(download);
      }
      const remove=node('button','btn petit danger','Supprimer');
      remove.type='button';
      remove.addEventListener('click',()=>FM.confirmer('Supprimer cette photo ?',photo.cloudPath?'La photo sera supprimée de ton espace privé et de cet appareil.':'La photo sera supprimée de cet appareil.','Supprimer',()=>deletePhoto(photo,status,gallery,cloud),true));
      actions.append(remove);
      card.append(image,info,actions);
      gallery.append(card);
    }
  }
  async function deletePhoto(photo,status,gallery,cloud){
    try{
      if(photo.cloudPath){
        if(!root.navigator.onLine)throw new Error('Une connexion est nécessaire pour supprimer une photo synchronisée.');
        const active=cloud&&cloud.user?cloud:await cloudSession();
        if(!active.client||!active.user||active.user.id!==photo.cloudUserId)throw new Error('Connecte-toi au compte qui possède cette photo pour la supprimer du cloud.');
        const removed=await active.client.storage.from(BUCKET).remove([photo.cloudPath]);
        if(removed.error)throw removed.error;
        const row=await active.client.from(TABLE).delete().eq('id',photo.id).eq('user_id',active.user.id);
        if(row.error)throw row.error;
      }
      await removeLocal(photo.id);
      status.textContent='Photo supprimée.';
      await renderGallery(gallery,status,cloud);
    }catch(error){status.textContent='Suppression impossible : '+error.message;}
  }
  function buildSection(){
    const section=node('section','carte forge-progress-photos');
    section.append(node('p','surtitre','SUIVI VISUEL'),node('h2','','Photos de progression'));
    section.append(node('p','discret','Compare ton évolution dans le temps. Les photos restent privées : elles sont conservées sur cet appareil et peuvent être synchronisées dans ton espace Supabase personnel. Elles ne sont pas incluses dans l’export JSON des séances ; tu peux télécharger chaque photo individuellement.'));
    const status=node('p','forge-progress-photos-status','Les photos seront enregistrées localement. La synchronisation cloud est facultative.');
    status.setAttribute('role','status');
    status.setAttribute('aria-live','polite');
    const form=node('form','forge-progress-photo-form');
    const dateLabel=node('label','forge-progress-photo-field','Date de la photo');
    const date=node('input','');
    date.type='date';date.value=today();date.required=true;
    dateLabel.append(date);
    const poseLabel=node('label','forge-progress-photo-field','Vue');
    const pose=node('select','');
    [['face','Face'],['profil','Profil'],['dos','Dos']].forEach(([value,label])=>{
      const option=node('option','',label);option.value=value;pose.append(option);
    });
    poseLabel.append(pose);
    const noteLabel=node('label','forge-progress-photo-field','Note (facultatif)');
    const note=node('input','');
    note.type='text';note.maxLength=240;note.placeholder='Ex. : début de prise de masse';
    noteLabel.append(note);
    const fileLabel=node('label','forge-progress-photo-file','Choisir ou prendre une photo');
    const file=node('input','');
    file.type='file';file.accept='image/*';file.setAttribute('capture','environment');file.required=true;
    fileLabel.append(file);
    const add=node('button','btn primaire geant','Enregistrer la photo');
    add.type='submit';
    form.append(dateLabel,poseLabel,noteLabel,fileLabel,add);
    const toolbar=node('div','forge-progress-photos-toolbar');
    const sync=node('button','btn','Synchroniser avec mon compte');
    sync.type='button';
    const profile=node('a','btn petit','Ouvrir Profil');
    profile.href='#/profil';
    toolbar.append(sync,profile);
    const gallery=node('div','forge-progress-photos-grid');
    sync.addEventListener('click',async()=>{
      sync.disabled=true;
      try{await syncPhotos(status,cloud=>renderGallery(gallery,status,cloud));}
      catch(error){status.textContent='Synchronisation impossible : '+error.message;}
      finally{sync.disabled=false;}
    });
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      const selected=file.files&&file.files[0];
      if(!selected){status.textContent='Choisis une image avant de continuer.';return;}
      if(!selected.type.startsWith('image/')){status.textContent='Le fichier choisi n’est pas une image.';return;}
      if(selected.size>40*1024*1024){status.textContent='Cette image dépasse 40 Mo. Choisis une version moins volumineuse.';return;}
      add.disabled=true;
      status.textContent='Compression et enregistrement de la photo…';
      try{
        const blob=await compressImage(selected);
        const photo={
          id:root.crypto&&root.crypto.randomUUID?root.crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2),
          date:date.value||today(),
          pose:pose.value,
          note:note.value.trim(),
          blob,
          cloudPath:null,
          cloudUserId:null,
          createdAt:Date.now()
        };
        await putPhoto(photo);
        file.value='';
        note.value='';
        status.textContent='Photo enregistrée sur cet appareil.';
        const user=root.ForgeCloud&&root.ForgeCloud.getUser?root.ForgeCloud.getUser():null;
        if(user&&root.navigator.onLine){
          try{
            const cloud=await cloudSession();
            if(cloud.client&&cloud.user)await uploadPhoto(photo,cloud.client,cloud.user);
            status.textContent='Photo enregistrée et synchronisée en privé.';
            await renderGallery(gallery,status,cloud);
          }catch(error){status.textContent='Photo conservée localement. Synchronisation en attente : '+error.message;await renderGallery(gallery,status,null);}
        }else await renderGallery(gallery,status,null);
      }catch(error){status.textContent='Enregistrement impossible : '+error.message;}
      finally{add.disabled=false;}
    });
    section.append(form,status,toolbar,gallery);
    if(root.ForgeCloud&&root.ForgeCloud.getUser&&root.ForgeCloud.getUser()&&root.navigator.onLine){
      Promise.resolve().then(()=>syncPhotos(status,cloud=>renderGallery(gallery,status,cloud))).catch(error=>{status.textContent='Synchronisation des photos impossible : '+error.message;});
    }else{
      renderGallery(gallery,status,null).catch(error=>{status.textContent='Lecture des photos impossible : '+error.message;});
    }
    return section;
  }

  root.addEventListener('hashchange',()=>{
    activeUrls.forEach(url=>root.URL.revokeObjectURL(url));
    activeUrls=[];
  });

  const original=FM.vues.suivi;
  FM.vues.suivi=function(app,onglet){
    const view=original(app,onglet);
    if(onglet==='progres')view.append(buildSection());
    return view;
  };
})(typeof window!=='undefined'?window:globalThis);
