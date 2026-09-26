const {get,change,validate}=require('../lib/content-store.cjs');
const {authorized}=require('../lib/admin-auth.cjs');
const {fail}=require('../lib/calendar-store.cjs');
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 try{
  const url=new URL(req.url,'http://localhost');
  if(req.method==='GET'){
   const admin=url.searchParams.has('admin'),preview=url.searchParams.has('preview');
   if((admin||preview)&&!authorized(req))fail('Войдите в кабинет, чтобы открыть черновик.',401);
   const {state}=await get();
   return res.status(200).json(admin?{version:state.version,draft:state.draft,publishedAt:state.publishedAt}:{content:preview?state.draft:state.published,publishedAt:state.publishedAt,preview});
  }
  if(req.method!=='POST'){res.setHeader('Allow','GET, POST');fail('Method not allowed',405);}
  if(!authorized(req))fail('Войдите в кабинет, чтобы изменить сайт.',401);
  if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)fail('Запрос отклонён.',403);
  if(!String(req.headers['content-type']||'').startsWith('application/json'))fail('Ожидается JSON.',415);
  const data=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
  if(JSON.stringify(data).length>1400000)fail('Слишком большой объём содержимого.');
  const content=data.action==='save'?validate(data.content):null;
  await change(s=>{
   if(data.version!==s.version)fail('Черновик изменился в другом окне. Скопируйте свои правки и обновите редактор.',409);
   if(data.action==='save')s.draft=content;
   else if(data.action==='publish'){
    const clean=validate(s.draft);
    if(!clean.formats.some(f=>f.visible))fail('Оставьте хотя бы один видимый формат консультации.');
    s.published=structuredClone(clean);s.publishedAt=new Date().toISOString();
   }else fail('Неизвестное действие.');
  });
  const {state}=await get();return res.status(200).json({ok:true,version:state.version,publishedAt:state.publishedAt});
 }catch(e){return res.status(e.status||500).json({error:e.status?e.message:'Не удалось сохранить содержимое сайта. Попробуйте ещё раз.'});}
};
