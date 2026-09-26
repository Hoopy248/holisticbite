const settings=require('../design-settings.js');
const {fail}=require('./calendar-store.cjs');
function validate(value){
 if(value===undefined)return undefined;
 if(!value||!value.global||!value.blocks||typeof value.blocks!=='object'||Array.isArray(value.blocks))fail('Проверьте оформление блоков.');
 let bytes=0;const color=x=>typeof x==='string'&&/^#[a-f\d]{6}$/i.test(x);
 function clean(input){
  if(!input||typeof input!=='object'||Array.isArray(input))fail('Проверьте настройки блока.');
  const s={...settings.style(),...input};
  if(!['inherit','color','gradient','image'].includes(s.mode)||!color(s.color1)||!color(s.color2)||!Object.hasOwn(settings.fonts,s.font)||!Object.hasOwn(settings.fonts,s.headingFont)||!(s.textColor==='auto'||color(s.textColor)))fail('Проверьте цвета и шрифты блока.');
  for(const [key,min,max,nullable] of [['angle',0,360,false],['overlay',0,90,false],['textSize',12,32,true],['headingSize',18,96,true],['mobileTextSize',12,26,true],['mobileHeadingSize',18,56,true]])if(!(nullable&&s[key]===null)&&(!Number.isFinite(s[key])||s[key]<min||s[key]>max))fail('Проверьте размеры текста, угол и затемнение.');
  if(!['center','top','bottom','left','right'].includes(s.position)||typeof s.image!=='string'||s.image.length>160000||(s.image&&!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(s.image)))fail('Проверьте фоновое изображение.');
  if(s.mode==='image'&&!s.image)fail('Загрузите фоновое изображение или выберите другой тип фона.');
  bytes+=s.image.length;
  return Object.fromEntries(Object.keys(settings.style()).map(key=>[key,s[key]]));
 }
 const global=clean(value.global),blocks={};
 for(const [id,s] of Object.entries(value.blocks)){if(!settings.blocks.some(b=>b[0]===id))fail('Неизвестный блок сайта.');blocks[id]=clean(s);}
 if(bytes>1800000)fail('Суммарный размер фоновых картинок слишком большой. Удалите неиспользуемые фоны.');
 return{global,blocks};
}
module.exports={validate};
