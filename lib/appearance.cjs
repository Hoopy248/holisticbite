const {fail}=require('./calendar-store.cjs');
const defaults={uniform:false,background:'#111013',font:'original',images:{}};
const slots=['portrait','state','body','biochemistry'];
function validate(value){
 if(value===undefined)return structuredClone(defaults);
 if(!value||typeof value.uniform!=='boolean'||!/^#[\da-f]{6}$/i.test(value.background)||!['original','manrope','system','georgia','arial'].includes(value.font))fail('Проверьте цвет фона и шрифт.');
 if(!value.images||typeof value.images!=='object'||Array.isArray(value.images))fail('Проверьте изображения.');
 const images={};let total=0;
 for(const id of Object.keys(value.images)){
  if(!slots.includes(id))fail('Неизвестное изображение.');
  const item=value.images[id];
  if(!item||typeof item.src!=='string'||typeof item.alt!=='string'||item.alt.length>300)fail('Проверьте описание изображения.');
  const src=item.src;
  if(src && !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(src))fail('Загрузите изображение в формате JPG, PNG или WebP.');
  if(src.length>160000)fail('Изображение слишком большое. Загрузите его заново.');
  total+=src.length;images[id]={src,alt:item.alt.trim()};
 }
 if(total>600000)fail('Слишком большой общий размер изображений.');
 const design=require('./block-design.cjs').validate(value.design);
 return{uniform:value.uniform,background:value.background.toLowerCase(),font:value.font,images,...(design?{design}:{})};
}
module.exports={defaults,validate};
