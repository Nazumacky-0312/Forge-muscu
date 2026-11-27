/* Hub Progression : rassemble les outils de suivi déjà présents dans Forge Muscu. */
(function(root){
  'use strict';
  const FM=root.FM;
  if(!FM||!FM.vues)return;
  const make=(tag,cls,text)=>{
    const el=root.document.createElement(tag);
    if(cls)el.className=cls;
    if(text!==undefined)el.textContent=text;
    return el;
  };
  const icons={
    ranks:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v4a4 4 0 0 1-8 0V4ZM8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 12v5m-4 3h8m-7-3h6"/></svg>',
    stats:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 20V4m0 16h18M6 15l4-4 3 2 6-7"/></svg>',
    records:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 14.7 8.4 20.7 9.3 16.4 13.5 17.4 19.5 12 16.7 6.6 19.5 7.6 13.5 3.3 9.3 9.3 8.4 12 3Z"/></svg>',
    history:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8m0-5v5h5m4-1v5l3 2"/></svg>',
    measures:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16 12-12 4 4L8 20H4v-4ZM13 7l4 4m-7-1 2 2m-5 1 2 2"/></svg>',
    nutrition:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21c-4.5-2.2-7-6.2-7-10.2C5 6.5 8 4 12 4s7 2.5 7 6.8c0 4-2.5 8-7 10.2ZM12 4c0-1.2.7-2 2-2m-2 8c-2-2-4-2.3-6-2"/></svg>',
    recovery:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2"/></svg>'
  };
  const cards=[
    {key:'ranks',title:'Rangs Forge & Body Forge',description:'Tes niveaux, ton avatar musculaire et tes classements.',href:'#/classement'},
    {key:'stats',title:'Statistiques & photos',description:'Courbes, volume d’entraînement et photos de progression.',href:'#/suivi/progres'},
    {key:'records',title:'Records personnels',description:'Tes meilleures performances et tes 1RM estimés.',href:'#/suivi/records'},
    {key:'history',title:'Historique des séances',description:'Retrouve tes entraînements et compare tes périodes.',href:'#/suivi/historique'},
    {key:'measures',title:'Poids & mensurations',description:'Suis ton poids et tes mesures corporelles.',href:'#/profil'},
    {key:'recovery',title:'Récupération musculaire',description:'Estimation des groupes sollicités et du repos nécessaire.',href:'#/recuperation'},
    {key:'nutrition',title:'Nutrition',description:'Calories, protéines, glucides, lipides et repas.',href:'#/nutrition'}
  ];
  FM.vues.progression=function(){
    const page=make('div','forge-page forge-progression-hub');
    const header=make('header','forge-progression-header');
    header.append(make('p','surtitre','TON ÉVOLUTION'),make('h1','','Progression'));
    header.append(make('p','discret','Retrouve au même endroit tes performances, ton physique, tes records et ton alimentation.'));
    const grid=make('div','forge-progression-grid');
    cards.forEach(card=>{
      const link=make('a','forge-progression-card');
      link.href=card.href;
      link.setAttribute('aria-label',card.title+'. '+card.description);
      const icon=make('span','forge-progression-icon');
      icon.innerHTML=icons[card.key];
      const content=make('span','forge-progression-card-copy');
      content.append(make('strong','',card.title),make('small','',card.description));
      link.append(icon,content,make('span','forge-progression-arrow','→'));
      grid.append(link);
    });
    const note=make('aside','forge-progression-note');
    note.append(make('strong','','La régularité fait la différence'),make('span','','Enregistre tes séances et tes mesures pour que les analyses reflètent tes vraies données.'));
    page.append(header,grid,note);
    return page;
  };
})(window);
