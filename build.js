(() => {
  'use strict';
  const buttons=[...document.querySelectorAll('[data-filter]')];
  const cards=[...document.querySelectorAll('.tool-card')];
  const status=document.getElementById('filter-status');
  buttons.forEach(button=>button.addEventListener('click',()=>{
    const selected=button.dataset.filter;
    buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    cards.forEach(card=>{card.hidden=selected!=='all'&&!card.dataset.category.split(' ').includes(selected);});
    status.textContent=`Showing ${cards.filter(card=>!card.hidden).length} tool categories.`;
  }));
  async function copy(text,button,label){
    try{
      await navigator.clipboard.writeText(text);
      button.textContent='Copied';document.getElementById('copy-status').textContent=label+' copied.';
      setTimeout(()=>{button.textContent=button.dataset.label;},2200);
    }catch{
      document.getElementById('copy-status').textContent='Copy is unavailable. Select the text or copy the page address manually.';
      button.textContent='Select text to copy';
      setTimeout(()=>{button.textContent=button.dataset.label;},3000);
    }
  }
  document.querySelectorAll('[data-copy]').forEach(button=>{
    button.dataset.label=button.textContent;
    button.addEventListener('click',()=>copy(document.getElementById(button.dataset.copy).textContent,button,'Prompt'));
  });
  const share=document.getElementById('share-story');share.dataset.label=share.textContent;
  share.addEventListener('click',()=>copy(location.href.split('#')[0],share,'Page link'));
  const nav=[...document.querySelectorAll('.chapter-nav a')];
  const sections=nav.map(a=>document.querySelector(a.getAttribute('href')));
  let queued=false;
  function updateChapter(){
    queued=false;
    let current=null;
    for(let i=0;i<sections.length;i++)if(sections[i].getBoundingClientRect().top<170)current=nav[i];
    nav.forEach(a=>{if(a===current)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
  }
  addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(updateChapter);}},{passive:true});
  updateChapter();
})();
