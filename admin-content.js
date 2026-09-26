(() => {
 'use strict';
 const root=document.querySelector('#contentEditor'),status=document.querySelector('#contentStatus');
 let draft=null,version=0,dirty=false,busy=false,kind='texts',language='ru',selectedId=null;
 const make=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
 function message(text,error=false){status.textContent=text;status.classList.toggle('error',error);}
 function markDirty(){dirty=true;document.querySelector('#draftState').textContent='Есть несохранённые изменения';}
 async function request(body){const r=await fetch('/api/content'+(body?'':'?admin=1'),body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});const result=await r.json();if(!r.ok)throw new Error(result.error||'Не удалось загрузить редактор.');return result;}
 async function run(fn){if(busy)return;busy=true;document.querySelectorAll('#cms button,#cms input,#cms textarea,#cms select').forEach(el=>el.disabled=true);message('');try{await fn();}catch(e){message(e.message,true);}finally{busy=false;document.querySelectorAll('#cms button,#cms input,#cms textarea,#cms select').forEach(el=>el.disabled=false);}}
 async function load(){const result=await request();draft=result.draft;version=result.version;dirty=false;selectedId=null;document.querySelector('#draftState').textContent=result.publishedAt?'Опубликовано: '+new Date(result.publishedAt).toLocaleString('ru'):'Сайт пока использует исходные тексты';render();}
 async function save(){if(!draft)throw new Error('Сначала загрузите редактор.');const result=await request({action:'save',version,content:draft});version=result.version;dirty=false;document.querySelector('#draftState').textContent='Черновик сохранён';message('Черновик сохранён. На сайте пока ничего не изменилось.');}
 function field(parent,label,value,onInput,{long=false,type='text',max=10000}={}){const wrapper=make('label',label),input=make(long?'textarea':'input');if(!long)input.type=type;input.value=value;input.maxLength=max;if(long)input.rows=4;if(type==='number'){input.min='0';input.max='10000000';input.step='0.01';}input.addEventListener('input',()=>{onInput(type==='number'?(input.value===''?null:Number(input.value)):input.value);markDirty();});wrapper.append(input);parent.append(wrapper);return input;}
 function multilingual(parent,item,key,label,max){field(parent,`${label} · ${language.toUpperCase()}`,item[key][language],v=>item[key][language]=v,{long:!['title','author'].includes(key),max});if(language!=='ru'){const hint=make('p',item[key][language]?'':'Перевод не заполнен — на сайте будет русский текст.');hint.className='muted';parent.append(hint);}}
 function render(){
  if(!draft)return;
  document.querySelectorAll('[data-content-kind]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.contentKind===kind)));
  root.replaceChildren();
  const languageSelect=document.querySelector('#contentLanguage');languageSelect.value=language;
  const add=document.querySelector('#addContentItem');add.hidden=kind==='texts';add.textContent=kind==='reviews'?'Добавить отзыв':'Добавить формат';
  const filter=document.querySelector('#contentGroup');filter.hidden=kind!=='texts';
  if(kind==='texts'){
   const groups=[...new Set(draft.texts.map(t=>t.group))],previous=filter.value;filter.replaceChildren();groups.forEach(g=>{const option=make('option',g);option.value=g;filter.append(option);});if(groups.includes(previous))filter.value=previous;
   const section=make('div');section.className='cms-fields';
   draft.texts.filter(t=>t.group===filter.value).forEach(t=>{const block=make('div');block.className='cms-text-field';multilingual(block,t,'value',t.label,10000);section.append(block);});root.append(section);return;
  }
  const items=draft[kind];if(!items.length){root.append(make('p',kind==='reviews'?'Пока нет отзывов. Нажмите «Добавить отзыв».':'Нажмите «Добавить формат», чтобы создать консультацию.'));return;}
  if(!items.some(i=>i.id===selectedId))selectedId=items[0].id;
  const layout=make('div');layout.className='cms-layout';const list=make('div');list.className='cms-item-list';
  items.forEach((item,index)=>{const button=make('button',`${index+1}. ${(kind==='reviews'?item.author.ru:item.title.ru)||'Новая запись'}${item.visible?'':' · скрыто'}`);button.type='button';button.setAttribute('aria-pressed',String(item.id===selectedId));button.onclick=()=>{selectedId=item.id;render();};list.append(button);});
  const form=make('div');form.className='cms-fields';const item=items.find(i=>i.id===selectedId);
  const visibility=make('label');visibility.className='cms-visibility';const checkbox=make('input');checkbox.type='checkbox';checkbox.checked=item.visible;checkbox.onchange=()=>{item.visible=checkbox.checked;markDirty();render();};visibility.append(checkbox,document.createTextNode('Показывать на сайте после публикации'));form.append(visibility);
  if(kind==='reviews'){multilingual(form,item,'author','Имя или инициалы клиента',150);multilingual(form,item,'body','Текст отзыва',12000);multilingual(form,item,'caption','Подпись / тема отзыва',500);}
  else{multilingual(form,item,'title','Название',150);multilingual(form,item,'description','Описание',5000);multilingual(form,item,'includes','Что входит — по одному пункту на строку',5000);const prices=make('div');prices.className='inline';field(prices,'Цена в рублях',item.priceRub,v=>item.priceRub=v,{type:'number'});field(prices,'Цена в евро',item.priceEur,v=>item.priceEur=v,{type:'number'});form.append(prices);}
  const actions=make('div');actions.className='actions';
  for(const [label,delta] of [['Поднять выше',-1],['Опустить ниже',1]]){const button=make('button',label);button.type='button';button.onclick=()=>{const index=items.indexOf(item),target=index+delta;if(target<0||target>=items.length)return;[items[index],items[target]]=[items[target],items[index]];markDirty();render();};actions.append(button);}form.append(actions);
  layout.append(list,form);root.append(layout);
 }
 document.querySelector('[data-tab="cms"]').addEventListener('click',()=>{if(!draft)run(load);});
 document.querySelectorAll('[data-content-kind]').forEach(b=>b.onclick=()=>{kind=b.dataset.contentKind;selectedId=null;render();});
 document.querySelector('#contentLanguage').onchange=e=>{language=e.target.value;render();};document.querySelector('#contentGroup').onchange=render;
 document.querySelector('#saveContent').onclick=()=>run(save);
 document.querySelector('#reloadContent').onclick=()=>{if(!dirty||confirm('Загрузить сохранённый черновик? Несохранённые правки будут потеряны.'))run(load);};
 document.querySelector('#previewContent').onclick=()=>{if(busy)return;const tab=window.open('about:blank','_blank');if(tab)tab.opener=null;run(async()=>{try{if(dirty)await save();if(tab)tab.location.href='/?content-preview=1';else throw new Error('Браузер заблокировал окно. Разрешите всплывающие окна и повторите.');}catch(error){if(tab)tab.close();throw error;}});};
 document.querySelector('#publishContent').onclick=()=>{if(!confirm('Опубликовать тексты, отзывы и форматы? Изменения появятся на сайте.'))return;run(async()=>{if(dirty)await save();const result=await request({action:'publish',version});version=result.version;document.querySelector('#draftState').textContent='Опубликовано: '+new Date(result.publishedAt).toLocaleString('ru');message('Опубликовано. Изменения появятся при обновлении страницы сайта.');});};
 document.querySelector('#addContentItem').onclick=()=>{if(!draft)return;const localized=()=>({ru:'',en:'',et:''});const item=kind==='reviews'?{id:crypto.randomUUID(),visible:true,author:localized(),body:localized(),caption:localized()}:{id:crypto.randomUUID(),visible:true,title:localized(),description:localized(),includes:localized(),priceRub:0,priceEur:0};draft[kind].push(item);selectedId=item.id;language='ru';markDirty();render();};
 window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
 window.addEventListener('admin:logout',()=>{draft=null;dirty=false;root.replaceChildren();message('');});
})();
