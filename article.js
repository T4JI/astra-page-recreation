(async () => {
  'use strict';
  const esc=window.escapeHTML,article=document.getElementById('article');
  try {
    const [content,manifest,assets,quotes]=await Promise.all(['./article-content.json','./media-manifest.json','./asset-map.json','./quote-logos.json'].map(async u=>{const r=await fetch(u);if(!r.ok)throw Error('Could not load '+u);return r.json();}));
    const abs=u=>u?.startsWith('//')?'https:'+u:u,local=u=>assets[abs(u)]||abs(u);
    const findTab=label=>manifest.tabs.find(t=>t.label===label);
    const caption=(text,cls='caption')=>text?`<div class="${cls}">${esc(text.replace(/\(opens in a new window\)/g,'')).replace(/\[\[fn:(\d+)(?::\d+)?\]\]/g,'<sup><a href="#citation-bottom-$1">$1</a></sup>')}</div>`:'';
    const nested={'Excel competition':['4x sped up','Real-time view'],'Game development':['Aerial view','Gameplay'],'Car transmission':['Gear motion','FreeCAD model'],'Formatting a legal document':['Legal memo','Will']};
    function media(m){const file=m.asset?.file;if(m.videoEmbedUrl)return {src:m.videoEmbedUrl,type:'vimeo',title:m.alt||m.asset?.title};if(file?.url)return {src:local(file.url),type:file.contentType?.startsWith('video/')?'video':'image',title:m.alt||m.asset?.title};return null;}
    function renderTab(tab){const wrap=document.createElement('div');if(nested[tab.label]){wrap.append(window.createTabs(nested[tab.label].map(findTab),renderTab));wrap.querySelector('.tabs-block').classList.add('nested-tabs');return wrap;}
      if(tab.chartIndices.length){wrap.innerHTML=tab.chartIndices.map(n=>`<div data-chart="${n}" data-title="${esc(tab.label)}"></div>`).join('')+caption(tab.captions.join(' '));return wrap;}
      const docs=tab.urls.filter(u=>/\.pdf(?:\?|$)/.test(u));
      if(docs.length){let labels=tab.label==='Gaia presentation'?['Reference file','GPT‑6 Astra output']:tab.label==='Document styling'?['Reference style','Original document','GPT‑6 Astra output']:['GPT‑6 Astra output'];wrap.innerHTML=`<div class="wide ${docs.length===2?'comparison-grid':docs.length===3?'document-grid':''}">${docs.map((u,i)=>`<div><h4 class="media-label">${labels[i]||'Document'}</h4>${window.mediaHTML({src:local(u),original:u,type:'pdf',title:labels[i]||tab.label})}</div>`).join('')}</div>`+caption(tab.captions.join(' '),'media-caption');return wrap;}
      const game=tab.urls.find(u=>u.includes('.chatgpt.site/'));
      if(game){wrap.innerHTML=`<div class="wide game-frame">${window.mediaHTML({type:'game',src:game,title:tab.label==='Spaceship'?'Interactive spaceship explorer':'Interactive Tidal Rush kart-racing game'})}<a class="open-demo" href="${esc(game)}" target="_blank" rel="noopener">Open ${esc(tab.label)} ↗</a></div>`+caption(tab.captions.join(' ')||'Interactive experience created with GPT‑6 Astra. Credit: Pietro Schirano.','media-caption');return wrap;}
      const items=tab.media.map(media).filter(Boolean);wrap.innerHTML=`<div class="wide">${items.map((m,i)=>`<div class="media-item">${window.mediaHTML(m)}</div>`).join('')}</div>`+caption(tab.captions.join(' '),'media-caption');return wrap;
    }
    const frag=document.createDocumentFragment();let prose=null,tableSection=null,footnotes=null,footnoteNumber=0,quotePair=null;const seenQuotes=new Set();
    const reset=()=>{prose=null;};const getProse=()=>{if(!prose){prose=document.createElement('div');prose.className='prose';frag.append(prose);}return prose;};
    const appendHTML=(parent,html)=>parent.insertAdjacentHTML('beforeend',html);
    function scene(shape){const d=document.createElement('div');d.className='interlude';d.innerHTML=`<canvas role="button" tabindex="0" data-shape="${shape}" aria-label="Move your pointer to disturb the stars. Drag or use arrow keys to rotate the ${shape==='blossom'?'OpenAI blossom':'cursor'}"></canvas>`;frag.append(d);}
    function standalone(index,description){reset();const d=document.createElement('div');d.className='tabs-block standalone-chart';d.innerHTML=`<div id="benchmark-${index}" data-chart="${index}"></div>${caption(description)}`;frag.append(d);}
    for(let i=3;i<content.article.length;i++){const b=content.article[i];
      if(b.type==='heading'&&b.text==='FOOTNOTES'){reset();footnotes=document.createElement('section');footnotes.className='prose footnotes';footnotes.id='footnotes';footnotes.innerHTML='<h2>FOOTNOTES</h2><ol></ol>';frag.append(footnotes);continue;}
      if(footnotes&&b.type==='paragraph'){footnoteNumber++;const li=document.createElement('li');li.id='citation-bottom-'+footnoteNumber;li.innerHTML=b.html||esc(b.text);footnotes.querySelector('ol').append(li);continue;}
      if(b.type==='heading'){
        if(b.level===3){reset();if(!tableSection){scene('blossom');tableSection=document.createElement('section');tableSection.className='data-section';tableSection.id='benchmarks';frag.append(tableSection);}appendHTML(tableSection,`<h3>${esc(b.text)}</h3>`);}
        else{reset();appendHTML(getProse(),`<h2 id="${esc(b.id||b.text.toLowerCase().replace(/[^a-z0-9]+/g,'-'))}">${esc(b.text)}</h2>`);}continue;
      }
      if(b.type==='paragraph'){if(tableSection&&i===92){appendHTML(tableSection,`<p class="data-note">${esc(b.text)}</p>`);continue;}appendHTML(getProse(),`<p>${b.html||esc(b.text)}</p>`);continue;}
      if(b.type==='tabs'){reset();frag.append(window.createTabs(b.labels.map(findTab),renderTab));continue;}
      if(b.type==='quote'){if(seenQuotes.has(b.quote))continue;seenQuotes.add(b.quote);reset();const q=quotes.find(q=>q.attribution===b.attribution)||b,logo=q.logos?.[0];const d=document.createElement('figure');d.className='quote';d.innerHTML=(logo?`<img src="${esc(local(logo.url))}" alt="${esc(logo.name)}" loading="lazy">`:'')+`<blockquote><p>${esc(q.quote)}</p></blockquote><cite>${esc(q.attribution)}</cite>`;if(i===35){quotePair=document.createElement('div');quotePair.className='quote-pair wide';frag.append(quotePair);}if((i===35||i===36)&&quotePair)quotePair.append(d);else frag.append(d);continue;}
      if(b.type==='figure'){if(i===9){standalone(14,'');scene('cursor');}else if(i===61)standalone(25,b.text);else if(i===65)standalone(27,b.text);continue;}
      if(b.type==='table'){const format=value=>esc(value).replace(/(%)(\d+)$/,'$1<sup><a href="#citation-bottom-$2">$2</a></sup>').replace(/(Sol)(2)$/,'$1<sup><a href="#citation-bottom-2">2</a></sup>');appendHTML(tableSection,`<div class="table-scroll" tabindex="0" role="region" aria-label="${esc(b.rows[0][0])} benchmark results"><table class="results-table"><thead><tr>${b.rows[0].map(c=>`<th scope="col">${format(c)}</th>`).join('')}</tr></thead><tbody>${b.rows.slice(1).map(row=>`<tr>${row.map((c,j)=>j===0?`<th scope="row">${format(c)}</th>`:`<td>${format(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);}
    }
    article.replaceChildren(frag);
    // Restore local citation anchors while leaving all outbound references on their original sites.
    window.fixCitations=(root=article)=>root.querySelectorAll('a[href^="#citation-bottom-"]').forEach(a=>{const n=a.hash.replace('#citation-bottom-','');if(!document.getElementById('citation-top-'+n)){const section=a.closest('.tabs-block');if(section){const anchor=document.createElement('span');anchor.id='citation-top-'+n;anchor.className='citation-anchor';anchor.setAttribute('aria-hidden','true');section.prepend(anchor);}else a.id='citation-top-'+n;}});
    window.fixCitations();
    article.addEventListener('click',e=>{const a=e.target.closest('a[href^="#citation-top-"]');if(!a)return;const n=a.hash.match(/citation-top-(\d+)/)?.[1];if(!n)return;e.preventDefault();const targetId='citation-top-'+n;const existing=document.getElementById(targetId);if(existing){existing.scrollIntoView({behavior:'smooth'});return;}const tab=manifest.tabs.find(t=>t.captions.some(c=>new RegExp('\\[\\[fn:'+n+'(?::|\\])').test(c)));const button=tab&&[...article.querySelectorAll('[role="tab"]')].find(b=>b.textContent===tab.label);if(button){button.click();document.getElementById(targetId)?.scrollIntoView({behavior:'smooth'});}else document.getElementById('introduction').scrollIntoView({behavior:'smooth'});});
    window.initCharts();window.initDecks();window.initStarScenes();
    if(location.hash){const target=document.getElementById(decodeURIComponent(location.hash.slice(1)));if(target?.getAttribute('role')==='tab')target.click();target?.scrollIntoView();}
    document.dispatchEvent(new CustomEvent('article-ready'));
  }catch(error){console.error(error);article.innerHTML='<div class="prose"><p>The article could not load. Please refresh the page or <a href="https://openai.com/index/gpt-6-astra/" target="_blank" rel="noopener">open the original article</a>.</p></div>';}
})();
