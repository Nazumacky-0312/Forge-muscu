/* Calculateur de disques : calcul local, sans API. */
(function(root){
  'use strict';
  const FM=root.FM;
  if(!FM||!FM.vues||typeof FM.vues.pro!=='function')return;
  const original=FM.vues.pro;
  const PLATES=[25,20,15,10,5,2.5,1.25,1,0.5];
  const el=(tag,cls,text)=>{
    const node=root.document.createElement(tag);
    if(cls)node.className=cls;
    if(text!==undefined)node.textContent=text;
    return node;
  };
  function renderBarCalculator(){
    const page=el('div','forge-page forge-bar-calculator');
    const header=el('header','forge-bar-header');
    header.append(el('p','surtitre','OUTIL DE SÉANCE'),el('h1','','Calculateur de barre'));
    header.append(el('p','discret','Trouve les disques à placer de chaque côté pour atteindre la charge totale souhaitée.'));
    const form=el('form','forge-bar-form');
    const targetLabel=el('label','forge-bar-field','Charge totale souhaitée (kg)');
    const target=el('input','');
    target.type='number';target.min='0.5';target.max='500';target.step='0.5';target.value='60';target.required=true;target.inputMode='decimal';
    targetLabel.append(target);
    const barLabel=el('label','forge-bar-field','Poids de la barre (kg)');
    const bar=el('select','');
    [[20,'20 kg · barre olympique'],[15,'15 kg'],[10,'10 kg'],[5,'5 kg']].forEach(([value,label])=>{
      const option=el('option','',label);option.value=String(value);bar.append(option);
    });
    barLabel.append(bar);
    const platesBox=el('fieldset','forge-bar-plates');
    platesBox.append(el('legend','','Disques disponibles (par côté)'));
    const checks=[];
    PLATES.forEach(weight=>{
      const label=el('label','forge-bar-plate');
      const input=el('input','');input.type='checkbox';input.value=String(weight);input.checked=true;
      label.append(input,el('span','',String(weight).replace('.',',')+' kg'));
      platesBox.append(label);
      checks.push(input);
    });
    const calculate=el('button','btn primaire geant','Calculer les disques');
    calculate.type='submit';
    const result=el('section','forge-bar-result');
    result.setAttribute('aria-live','polite');
    function compute(event){
      if(event)event.preventDefault();
      const wanted=Number(target.value),barKg=Number(bar.value);
      if(!Number.isFinite(wanted)||wanted<=0||wanted<barKg){
        result.replaceChildren(el('strong','forge-bar-error','La charge totale doit être supérieure ou égale au poids de la barre.'));
        return;
      }
      const available=checks.filter(input=>input.checked).map(input=>Number(input.value)).sort((a,b)=>b-a);
      let remaining=(wanted-barKg)/2;
      const perSide=remaining;
      const chosen=[];
      available.forEach(weight=>{
        const count=Math.floor((remaining+1e-8)/weight);
        if(count>0){
          chosen.push({weight,count});
          remaining=Math.round((remaining-count*weight)*1000)/1000;
        }
      });
      const achieved=barKg+2*(perSide-remaining);
      const difference=Math.round((wanted-achieved)*100)/100;
      const label=chosen.length?chosen.map(item=>item.count+' × '+String(item.weight).replace('.',',')+' kg').join(' + '):'Aucun disque';
      result.replaceChildren();
      result.append(el('strong','forge-bar-result-title',difference<=0.01?'Charge réalisable : '+achieved.toLocaleString('fr-FR')+' kg':'Charge la plus proche : '+achieved.toLocaleString('fr-FR')+' kg'));
      result.append(el('p','forge-bar-result-label','À placer de chaque côté'));
      result.append(el('p','forge-bar-result-plates',label));
      if(difference>0.01)result.append(el('small','forge-bar-warning','Il manque '+difference.toLocaleString('fr-FR')+' kg au total avec les disques sélectionnés.'));
      else result.append(el('small','forge-bar-success','Même combinaison à gauche et à droite.'));
    }
    form.addEventListener('submit',compute);
    target.addEventListener('input',compute);
    bar.addEventListener('change',compute);
    checks.forEach(input=>input.addEventListener('change',compute));
    form.append(targetLabel,barLabel,platesBox,calculate);
    page.append(header,form,result,el('p','forge-bar-note','Le calcul suppose une barre chargée de façon symétrique. Vérifie toujours le poids réel de la barre et les disques disponibles dans ta salle.'));
    compute();
    return page;
  }
  FM.vues.pro=function(app,sub){
    if(sub==='barre')return renderBarCalculator();
    const view=original(app,sub);
    if(!sub||sub==='home'){
      const link=el('a','forge-bar-home-link');
      link.href='#/pro/barre';
      link.append(el('strong','','Calculateur de barre'),el('span','','Trouve rapidement les disques à charger →'));
      view.append(link);
    }
    return view;
  };
})(window);
