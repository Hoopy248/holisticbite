(() => {
 'use strict';
 const S=window.hbDesignSettings;
 const families={manrope:'Manrope,Arial,sans-serif',system:'system-ui,sans-serif',georgia:'Georgia,serif',arial:'Arial,sans-serif',cormorant:'"Cormorant Garamond",Georgia,serif'};
 const make=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
 function ink(hex){const c=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722>.179?'#111111':'#ffffff';}
 const textColor=s=>s.textColor!=='auto'?s.textColor:s.mode==='image'?'#ffffff':ink(s.color1);
 function background(s){if(s.mode==='color')return s.color1;if(s.mode==='gradient')return `linear-gradient(${s.angle}deg,${s.color1},${s.color2})`;if(s.mode==='image')return `linear-gradient(rgba(0,0,0,${s.overlay/100}),rgba(0,0,0,${s.overlay/100})),url("${s.image}") ${s.position} / cover no-repeat`;return null;}
 function editor(root,a,changed,run,message){
  if(!a.design){a.design=S.defaults();if(a.uniform){a.design.global.mode='color';a.design.global.color1=a.background;}if(a.font!=='original'){a.design.global.font=a.font;a.design.global.headingFont=a.font;}}
  const design=a.design;
  const intro=make('p','Общие настройки применяются ко всей главной странице. Для отдельного раздела или карточки выберите блок ниже. «Как в общих настройках» сохраняет наследование.');root.append(intro);
  const scopeLabel=make('label','Настраиваемый блок'),scope=make('select');scope.id='designScope';[['global','Вся страница — общие настройки'],...S.blocks].forEach(([id,label])=>{const option=make('option',label);option.value=id;scope.append(option);});scopeLabel.append(scope);root.append(scopeLabel);
  const panel=make('div');panel.className='cms-design-panel';root.append(panel);
  function draw(){
   panel.replaceChildren();const id=scope.value,s=id==='global'?design.global:(design.blocks[id]??=S.style());
   const controls=make('div');controls.className='cms-design-controls';const sample=make('div');sample.className='cms-design-sample';const heading=make('h3','Забота о себе'),paragraph=make('p','Пример текста: питание, энергия и восстановление. Your health · Sinu tervis');sample.append(heading,paragraph);
   function update(){
    const parentId={method1:'method',method2:'method',method3:'method',method4:'method',state:'requests',body:'requests',biochemistry:'requests',bookingForm:'booking'}[id];
    const chain=[design.global,design.blocks[parentId],s].filter(Boolean),resolved=S.style();
    for(const item of chain){if(item.mode!=='inherit')for(const key of ['mode','color1','color2','angle','image','overlay','position','textColor'])resolved[key]=item[key];for(const key of ['font','headingFont','textSize','headingSize'])if(item[key]!==null&&item[key]!=='inherit')resolved[key]=item[key];if(item.textColor!=='auto')resolved.textColor=item.textColor;}
    sample.style.background=background(resolved)||a.background;sample.style.color=textColor(resolved);sample.style.fontFamily=families[resolved.font]||'inherit';heading.style.fontFamily=families[resolved.headingFont]||sample.style.fontFamily;heading.style.fontSize=(resolved.headingSize||32)+'px';paragraph.style.fontSize=(resolved.textSize||16)+'px';
   }
   function select(label,key,options){const wrap=make('label',label),el=make('select');el.id='design-'+key;Object.entries(options).forEach(([v,t])=>{const option=make('option',t);option.value=v;el.append(option);});el.value=s[key];el.onchange=()=>{s[key]=el.value;changed();draw();};wrap.append(el);controls.append(wrap);return el;}
   function input(label,key,type,min,max){const wrap=make('label',label),el=make('input');el.id='design-'+key;el.type=type;el.value=s[key]??'';if(type==='number'){el.min=min;el.max=max;el.step=1;el.placeholder='Авто';}el.oninput=()=>{s[key]=type==='number'?(el.value===''?null:Number(el.value)):el.value;changed();update();};wrap.append(el);controls.append(wrap);return el;}
   select('Тип фона','mode',{inherit:id==='global'?'Исходное оформление':'Как в общих настройках',color:'Сплошной цвет',gradient:'Градиент',image:'Картинка'});
   if(s.mode==='color'||s.mode==='gradient')input(s.mode==='gradient'?'Первый цвет':'Цвет фона','color1','color');
   if(s.mode==='gradient'){input('Второй цвет','color2','color');input('Угол градиента, °','angle','number',0,360);}
   if(s.mode==='image'){
    const uploadLabel=make('label','Загрузить фон · JPG, PNG, WebP'),upload=make('input');upload.id='design-image';upload.type='file';upload.accept='image/jpeg,image/png,image/webp';uploadLabel.append(upload);controls.append(uploadLabel);
    upload.onchange=()=>{const file=upload.files[0];if(!file)return;run(async()=>{s.image=await window.hbAppearance.compress(file);changed();update();message('Фон подготовлен. Сохраните черновик и откройте предпросмотр.');});};
    input('Затемнение картинки, %','overlay','number',0,90);select('Положение картинки','position',{center:'По центру',top:'Сверху',bottom:'Снизу',left:'Слева',right:'Справа'});
    const remove=make('button','Убрать фоновую картинку');remove.type='button';remove.onclick=()=>{s.image='';s.mode='inherit';changed();draw();};controls.append(remove);
   }
   select('Шрифт основного текста','font',S.fonts);select('Шрифт заголовков','headingFont',S.fonts);
   input('Основной текст, px · компьютер','textSize','number',12,32);input('Заголовки, px · компьютер','headingSize','number',18,96);input('Основной текст, px · телефон','mobileTextSize','number',12,26);input('Заголовки, px · телефон','mobileHeadingSize','number',18,56);
   const autoLabel=make('label'),auto=make('input');auto.type='checkbox';auto.checked=s.textColor==='auto';autoLabel.className='cms-visibility';autoLabel.append(auto,document.createTextNode('Подбирать цвет текста автоматически'));controls.append(autoLabel);auto.onchange=()=>{s.textColor=auto.checked?'auto':textColor({...s,textColor:'auto'});changed();draw();};if(!auto.checked)input('Цвет текста','textColor','color');
   const hint=make('p','Пустой размер = наследовать. На телефоне крупные заголовки уменьшаются автоматически, если отдельный размер не задан. Для разноцветного фона проверьте читаемость текста в предпросмотре.');hint.className='muted';controls.append(hint);
   const reset=make('button',id==='global'?'Сбросить общие настройки':'Вернуть блоку общие настройки');reset.type='button';reset.onclick=()=>{if(id==='global'){design.global=S.style();a.uniform=false;a.font='original';}else delete design.blocks[id];changed();draw();};controls.append(reset);
   panel.append(controls,sample);update();
  }
  scope.onchange=draw;draw();
 }
 function apply(a){
  let sheet=document.getElementById('hb-block-design');if(!sheet){sheet=make('style');sheet.id='hb-block-design';document.head.append(sheet);}sheet.textContent='';
  const d=a?.design;if(!d)return;
  document.body.setAttribute('data-design-active','');
  const prefix='html body#hb-custom-theme[data-design-active]';
  S.blocks.forEach(([id,,selector])=>document.querySelector(selector)?.setAttribute('data-design-block',id));
  const rules=[];
  function rule(scope,s,isGlobal=false){
   const bg=background(s),color=textColor(s);
   if(bg){
    rules.push(`${scope}{background:${bg}!important;box-shadow:none!important} ${scope}::before,${scope}::after{display:none!important}`);
    if(isGlobal)rules.push(`${scope} main,${scope} main>section,${scope} .topbar{background:transparent!important;box-shadow:none!important} ${scope} main>section::before,${scope} main>section::after{display:none!important}`);
   }
   if(bg||s.textColor!=='auto'){
    rules.push(`${scope},${scope} :is(h1,h2,h3,h4,p,li,span,small,strong,label,legend,summary,a,button,input,textarea,select){color:${color}!important;text-shadow:none!important}`);
    rules.push(`${scope} :is(.button,.nav-button.primary,.modal-apply){background:#5a1026!important;color:white!important} ${scope} :is(input,textarea,select){background:${s.color1}!important;color:${ink(s.color1)}!important} ${scope} :is(input,textarea)::placeholder{color:${ink(s.color1)}!important;opacity:.75!important}`);
   }
   if(isGlobal&&bg)rules.push(`${scope} .request-column,${scope} .request-column *{color:white!important;text-shadow:0 1px 3px black!important} ${scope} #bookingDatePicker button[aria-pressed=true]{background:#5a1026!important;color:white!important}`);
   if(s.font!=='inherit')rules.push(`${scope},${scope} *{font-family:${families[s.font]}!important}`);
   if(s.headingFont!=='inherit')rules.push(`${scope} :is(h1,h2,h3,h4,.format-title),${scope} :is(h1,h2,h3,h4) *{font-family:${families[s.headingFont]}!important}`);
   const text=`${scope} :is(p,li,.format-text,.feedback-card p)`,head=`${scope} :is(h1,h2,h3,h4,.format-title),${scope} :is(h1,h2,h3,h4) span`;
   if(s.textSize!==null)rules.push(`${text}{font-size:${s.textSize}px!important;line-height:1.6!important}`);
   if(s.headingSize!==null)rules.push(`${head}{font-size:${s.headingSize}px!important;line-height:1.12!important;overflow-wrap:anywhere}`);
   const mobileText=s.mobileTextSize??(s.textSize===null?null:Math.min(s.textSize,20)),mobileHead=s.mobileHeadingSize??(s.headingSize===null?null:Math.min(s.headingSize,40));
   if(mobileText!==null)rules.push(`@media(max-width:760px){${text}{font-size:${mobileText}px!important}}`);
   if(mobileHead!==null)rules.push(`@media(max-width:760px){${head}{font-size:${mobileHead}px!important}}`);
  }
  rule(prefix,d.global,true);
  for(const [id] of S.blocks)if(d.blocks[id])rule(`${prefix} [data-design-block="${id}"]`,d.blocks[id]);
  rules.push(`${prefix} .cms-preview-banner,${prefix} .cms-preview-banner a{color:white!important}`);
  sheet.textContent=rules.join('\n');
 }
 window.hbBlockDesign={editor,apply};
})();
