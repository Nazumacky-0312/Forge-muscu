/* Favoris alimentaires locaux : fonctionne sans compte ni API supplémentaire. */
(function(root){
  'use strict';
  const FM=root.FM;
  if(!FM||!FM.vues||typeof FM.vues.pro!=='function')return;
  const original=FM.vues.pro;
  const KEY='forge-nutrition-favorites-v1';
  const read=()=>{
    try{
      const data=JSON.parse(root.localStorage.getItem(KEY)||'[]');
      return Array.isArray(data)?data.filter(item=>item&&typeof item.name==='string'&&typeof item.key==='string'):[];
    }catch(_){return [];}
  };
  const write=data=>{
    try{root.localStorage.setItem(KEY,JSON.stringify(data.slice(0,40)));return true;}
    catch(_){return false;}
  };
  const el=(tag,cls,text)=>{
    const node=root.document.createElement(tag);
    if(cls)node.className=cls;
    if(text!==undefined)node.textContent=text;
    return node;
  };
  const keyFor=name=>String(name||'').trim().toLocaleLowerCase('fr-FR').replace(/\s+/g,' ');
  const macrosText=food=>food.kcal+' kcal · P '+food.proteines+' g · G '+food.glucides+' g · L '+food.lipides+' g / 100 g';
  function enhance(view,app){
    if(!view||view.dataset.forgeNutritionFavorites==='1')return view;
    view.dataset.forgeNutritionFavorites='1';
    const title=view.querySelector('h1');
    const panel=el('section','forge-nutrition-favorites');
    const renderPanel=()=>{
      panel.replaceChildren(el('div','forge-nutrition-favorites-head', 'Mes aliments favoris'));
      const favorites=read();
      if(!favorites.length){
        panel.append(el('p','forge-nutrition-favorites-empty','Enregistre un aliment depuis les résultats pour le retrouver ici. Favoris conservés sur cet appareil.'));
        return;
      }
      favorites.forEach(food=>{
        const item=el('article','forge-nutrition-favorite-item');
        const info=el('div','forge-nutrition-favorite-info');
        info.append(el('strong','',food.name),el('small','',macrosText(food)));
        const actions=el('div','forge-nutrition-favorite-actions');
        const add=el('button','btn petit primaire','Ajouter 100 g');
        add.type='button';
        add.addEventListener('click',()=>{
          app.etat.nutrition=Array.isArray(app.etat.nutrition)?app.etat.nutrition:[];
          app.etat.nutrition.push({id:FM.uid(),date:Date.now(),repas:food.name+' (100 g)',kcal:food.kcal,proteines:food.proteines,glucides:food.glucides,lipides:food.lipides});
          app.sauver();
          app.aller('#/nutrition');
        });
        const remove=el('button','btn petit','Retirer');
        remove.type='button';
        remove.addEventListener('click',()=>{
          write(read().filter(entry=>entry.key!==food.key));
          renderPanel();
          updateButtons();
        });
        actions.append(add,remove);
        item.append(info,actions);
        panel.append(item);
      });
      panel.append(el('small','forge-nutrition-favorites-foot','Favoris enregistrés localement sur cet appareil.'));
    };
    function updateButtons(){
      const favorites=read();
      view.querySelectorAll('.forge-nutrition-favorite-toggle').forEach(button=>{
        const saved=favorites.some(food=>food.key===button.dataset.foodKey);
        const label=saved?'★ Favori':'☆ Ajouter aux favoris';
        const pressed=saved?'true':'false';
        // Ne pas réécrire le texte à chaque passage du MutationObserver :
        // textContent déclenche lui-même une mutation childList et créerait une boucle.
        if(button.textContent!==label)button.textContent=label;
        if(button.getAttribute('aria-pressed')!==pressed)button.setAttribute('aria-pressed',pressed);
      });
    }
    function addButtons(){
      view.querySelectorAll('h3').forEach(heading=>{
        const card=heading.closest('.carte')||heading.parentElement;
        if(!card||card.dataset.forgeFavoriteAdded==='1')return;
        const description=card.querySelector('p');
        if(!description)return;
        const match=description.textContent.match(/(\d+)\s*kcal\s*·\s*P\s*(\d+)\s*g\s*·\s*G\s*(\d+)\s*g\s*·\s*L\s*(\d+)\s*g/i);
        if(!match)return;
        const name=heading.textContent.trim();
        const food={key:keyFor(name),name,kcal:Number(match[1]),proteines:Number(match[2]),glucides:Number(match[3]),lipides:Number(match[4])};
        if(!food.key)return;
        const button=el('button','btn petit forge-nutrition-favorite-toggle','☆ Ajouter aux favoris');
        button.type='button';
        button.dataset.foodKey=food.key;
        button.addEventListener('click',()=>{
          const favorites=read();
          if(favorites.some(item=>item.key===food.key))write(favorites.filter(item=>item.key!==food.key));
          else write([food,...favorites]);
          renderPanel();
          updateButtons();
        });
        card.append(button);
        card.dataset.forgeFavoriteAdded='1';
      });
      updateButtons();
    }
    if(title)title.insertAdjacentElement('afterend',panel);else view.prepend(panel);
    renderPanel();
    addButtons();
    const observer=new MutationObserver(()=>{
      if(!view.isConnected){observer.disconnect();return;}
      addButtons();
    });
    observer.observe(view,{childList:true,subtree:true});
    root.addEventListener('hashchange',()=>observer.disconnect(),{once:true});
    return view;
  }
  FM.vues.pro=function(app,sub){
    const view=original(app,sub);
    if(sub==='aliments')return enhance(view,app);
    return view;
  };
})(window);
