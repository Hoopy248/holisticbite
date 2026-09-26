(() => {
 'use strict';
 window.hbContentPreview=new URL(location.href).searchParams.get('content-preview')==='1';
 let content=null;
 const lang=()=>document.documentElement.lang||'ru';
 const pick=value=>value?.[lang()]||value?.ru||'';
 const make=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;};
 const price=f=>lang()==='ru'?`${f.priceRub} рублей`:`${f.priceEur} ${lang()==='et'?'eurot':'euro'}`;
 function syncFormats(){
  if(!content)return;
  const track=document.querySelector('#formatTrack');
  let checked=track.querySelector('input:checked')||track.querySelector('input');
  if(!checked)return;
  checked.checked=true;
  track.querySelectorAll('.format-card').forEach(card=>{const input=card.querySelector('input');card.setAttribute('aria-checked',String(input.checked));card.tabIndex=input.checked?0:-1;});
  document.querySelector('#service').value=checked.value;
  document.querySelector('#serviceId').value=checked.dataset.serviceId;
  document.querySelector('#selectedFormatTitle').textContent=checked.value;
  document.querySelector('#selectedFormatPrice').textContent=checked.dataset.price;
 }
 function renderFormats(){
  const track=document.querySelector('#formatTrack');if(!track)return;
  const selectedId=document.querySelector('#serviceId').value;
  const formats=content.formats.filter(f=>f.visible);const fragment=document.createDocumentFragment();
  formats.forEach((f,index)=>{
   const card=make('label','format-card is-visible');card.setAttribute('role','radio');
   const input=make('input');input.type='radio';input.name='formatChoice';input.value=pick(f.title);input.dataset.serviceId=f.id;input.dataset.price=price(f);input.dataset.priceEn=`${f.priceEur} euro`;input.dataset.priceEt=`${f.priceEur} eurot`;input.defaultChecked=f.id===selectedId||(!formats.some(f=>f.id===selectedId)&&index===0);
   card.append(input,make('span','format-badge',lang()==='ru'?'Выбрано':lang()==='et'?'Valitud':'Selected'),make('span','format-title',pick(f.title)),make('span','format-text',pick(f.description)));
   const lines=pick(f.includes).split('\n').filter(Boolean);if(lines.length){const ul=make('ul','format-list');lines.forEach(line=>ul.append(make('li','',line)));card.append(ul);}card.append(make('strong','',price(f)));fragment.append(card);
  });
  track.replaceChildren(fragment);track.classList.add('cms-format-track');syncFormats();
  document.querySelectorAll('#prevFormat,#nextFormat').forEach(button=>button.style.setProperty('display','none','important'));
  const noFormats=!formats.length;document.querySelector('#openFormatModal').disabled=noFormats;
  if(noFormats){document.querySelector('#serviceId').value='';document.querySelector('#service').value='';document.querySelector('#selectedFormatTitle').textContent='Запись временно закрыта';document.querySelector('#selectedFormatPrice').textContent='';}
 }
 function render(){
  if(!content)return;
  const values=new Map(content.texts.map(t=>[t.id,t.value]));
  document.querySelectorAll('[data-cms-text]').forEach(el=>{if(values.has(el.dataset.cmsText))el.textContent=pick(values.get(el.dataset.cmsText));});
  renderFormats();
  const track=document.querySelector('#feedbackTrack');
  const reviews=content.reviews.filter(r=>r.visible);
  if(track){const fragment=document.createDocumentFragment();reviews.forEach(r=>{const article=make('article','feedback-card'),footer=make('footer');footer.append(make('strong','',pick(r.author)),make('span','',pick(r.caption)));article.append(make('p','',pick(r.body)),footer);fragment.append(article);});track.replaceChildren(fragment);document.querySelector('#feedback').hidden=!reviews.length;}
  window.dispatchEvent(new CustomEvent('cms:updated'));
 }
 window.hbCMS={syncFormats,render};
 document.querySelector('#formatTrack')?.addEventListener('change',syncFormats);
 document.querySelector('#bookingForm')?.addEventListener('reset',()=>setTimeout(syncFormats,0));
 window.addEventListener('site:language',render);
 async function load(){
  const preview=new URL(location.href).searchParams.get('content-preview')==='1';
  try{
   const response=await fetch('/api/content'+(preview?'?preview=1':''),{cache:'no-store'});
   const result=await response.json();if(!response.ok)throw new Error(result.error);
   content=result.content;render();
   if(preview){const banner=make('div','cms-preview-banner','Предпросмотр черновика. Запись отключена. Клиенты видят опубликованную версию.');const link=make('a','','Вернуться в кабинет');link.href='/admin.html';banner.append(link);document.body.prepend(banner);}
  }catch(error){
   // Keep the shipped static content as a fallback, and never display an unauthorized draft.
   window.hbCMS=null;
   if(preview){const message=make('div','cms-preview-banner',error.message||'Не удалось открыть черновик. Войдите в кабинет.');document.body.prepend(message);}
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();
