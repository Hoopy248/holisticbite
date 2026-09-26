(() => {
 'use strict';
 const defaults=()=>({uniform:false,background:'#111013',font:'original',images:{}});
 const fonts={original:'Исходные шрифты',manrope:'Manrope — современный',system:'Системный — нейтральный',georgia:'Georgia — с засечками',arial:'Arial — простой'};
 const families={manrope:'Manrope, Arial, sans-serif',system:'system-ui, sans-serif',georgia:'Georgia, serif',arial:'Arial, sans-serif'};
 const slots=[['portrait','Фото Даши','.profile-photo','./assets/darya-hero-photo.png'],['state','Карточка «Состояние»','.request-column:nth-child(1)','./assets/requests-card-state.png'],['body','Карточка «Тело»','.request-column:nth-child(2)','./assets/requests-card-body.png'],['biochemistry','Карточка «Биохимия»','.request-column:nth-child(3)','./assets/requests-card-biochemistry.png']];
 const make=(tag,text)=>{const el=document.createElement(tag);if(text)el.textContent=text;return el;};
 function ink(color){const rgb=color.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722>.179?'#111111':'#ffffff';}
 async function compress(file){
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Выберите JPG, PNG или WebP.');
  if(file.size>15000000)throw new Error('Размер исходного файла — не больше 15 МБ.');
  const url=URL.createObjectURL(file),img=new Image();
  try{img.src=url;await img.decode();let size=Math.min(1400,Math.max(img.width,img.height));
   for(let attempt=0;attempt<6;attempt++){
    const scale=Math.min(1,size/Math.max(img.width,img.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
    const src=canvas.toDataURL('image/webp',.8-attempt*.07);if(src.length<=150000)return src;size*=.8;
   }throw new Error('Не удалось уменьшить фото. Выберите изображение меньшего размера.');
  }finally{URL.revokeObjectURL(url);}
 }
 function editor(root,draft,changed,run,message){
  const a=draft.appearance??=defaults();
  window.hbBlockDesign.editor(root,a,changed,run,message);
  root.append(make('h3','Изображения'),make('p','JPG, PNG или WebP до 15 МБ. Фото автоматически уменьшается для сайта. Изменения сохраняются вместе с черновиком.'));
  const grid=make('div');grid.className='cms-image-grid';root.append(grid);
  slots.forEach(([id,title,selector,original])=>{
   const block=make('div'),heading=make('h4',title),preview=make('img');preview.src=a.images[id]?.src||original;preview.alt=title;block.append(heading,preview);
   const uploadLabel=make('label','Заменить изображение'),upload=make('input');upload.type='file';upload.accept='image/jpeg,image/png,image/webp';uploadLabel.append(upload);block.append(uploadLabel);
   const altLabel=make('label','Описание изображения'),alt=make('input');alt.type='text';alt.maxLength=300;alt.value=a.images[id]?.alt||'';altLabel.append(alt);block.append(altLabel);
   alt.oninput=()=>{a.images[id]={src:a.images[id]?.src||'',alt:alt.value};changed();};
   upload.onchange=()=>{const file=upload.files[0];if(!file)return;run(async()=>{const src=await compress(file);a.images[id]={src,alt:alt.value};preview.src=src;changed();message('Изображение подготовлено. Сохраните черновик.');});};
   const restore=make('button','Вернуть исходное фото');restore.type='button';restore.onclick=()=>{delete a.images[id];preview.src=original;alt.value='';upload.value='';changed();};block.append(restore);grid.append(block);
  });
 }
 function apply(value){
  const a={...(value||defaults())},body=document.body;if(a.design?.global.mode&&a.design.global.mode!=='inherit'){a.uniform=true;a.background=a.design.global.color1;}body.id='hb-custom-theme';body.classList.toggle('cms-uniform',a.uniform);body.classList.toggle('cms-font',a.font!=='original');
  document.documentElement.style.setProperty('--cms-background',a.background);body.style.setProperty('--cms-background',a.background);body.style.setProperty('--cms-ink',ink(a.background));body.style.setProperty('--cms-font',families[a.font]||'inherit');
  if(a.font!=='original'){body.style.setProperty('--vs-sans',families[a.font]);body.style.setProperty('--vs-serif',families[a.font]);}
  slots.forEach(([id,title,selector,original])=>{const el=document.querySelector(selector);if(!el)return;const item=a.images[id];if(id==='portrait'){el.src=item?.src||original;el.alt=item?.alt||'';}else{if(item?.alt)el.setAttribute('aria-description',item.alt);else el.removeAttribute('aria-description');if(item?.src&&(!a.design?.blocks[id]||a.design.blocks[id].mode==='inherit')){el.style.setProperty('background-image',`linear-gradient(180deg,rgba(0,0,0,.55),rgba(0,0,0,.8)),url("${item.src}")`,'important');}else el.style.removeProperty('background-image');}});
 }
 window.hbAppearance={editor,apply,compress};
})();
