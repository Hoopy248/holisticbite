const {read,mutate,fail}=require('./calendar-store.cjs');
const defaults=require('../content-defaults.json');
const KEY='holisticbite:content:v1';
const initial=()=>({version:0,draft:structuredClone(defaults),published:structuredClone(defaults),publishedAt:null});
const get=()=>read(KEY,initial);
const change=fn=>mutate(fn,KEY,initial);
const languages=['ru','en','et'];
function localized(value,max,required=false){
 if(!value||typeof value!=='object'||Array.isArray(value))fail('Проверьте тексты и переводы.');
 const out={};for(const lang of languages){if(typeof value[lang]!=='string'||value[lang].length>max)fail(`Текст ${lang.toUpperCase()} должен быть не длиннее ${max} символов.`);out[lang]=value[lang].trim();}
 if(required&&!out.ru)fail('Заполните русскую версию названия или отзыва.');return out;
}
function validate(content){
 if(!content||!Array.isArray(content.texts)||content.texts.length!==defaults.texts.length)fail('Структура текстов сайта изменилась. Обновите страницу.');
 const ids=new Set();
 const checkId=(id)=>{if(typeof id!=='string'||!/^[-a-zA-Z0-9]{1,80}$/.test(id)||ids.has(id))fail('Проверьте идентификаторы записей.');ids.add(id);return id;};
 const texts=defaults.texts.map(def=>{const item=content.texts.find(t=>t.id===def.id);if(!item)fail('Не найден текст сайта.');return{...def,value:localized(item.value,10000)};});
 function collection(name,max,fn){if(!Array.isArray(content[name])||content[name].length>max)fail('Слишком много записей.');return content[name].map(item=>{if(typeof item.visible!=='boolean')fail('Проверьте видимость записи.');return{id:checkId(item.id),visible:item.visible,...fn(item)};});}
 const reviews=collection('reviews',100,r=>({body:localized(r.body,12000,r.visible),author:localized(r.author,150,r.visible),caption:localized(r.caption,500)}));
 const formats=collection('formats',20,f=>{for(const field of ['priceRub','priceEur'])if(!Number.isFinite(f[field])||f[field]<0||f[field]>10000000)fail('Цена должна быть числом от 0 до 10 000 000.');return{title:localized(f.title,150,f.visible),description:localized(f.description,5000),includes:localized(f.includes,5000),priceRub:f.priceRub,priceEur:f.priceEur};});
 return{texts,reviews,formats,appearance:require('./appearance.cjs').validate(content.appearance)};
}
module.exports={get,change,validate,defaults};
