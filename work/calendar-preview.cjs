// Local-only preview: never deploy this server or its demo credentials.
process.env.CALENDAR_DEMO = '1';
process.env.ADMIN_PASSWORD = 'demo-holisticbite';
process.env.ADMIN_SESSION_SECRET = require('node:crypto').randomBytes(32).toString('hex');
const http=require('node:http'), fs=require('node:fs'), path=require('node:path');
const root=path.resolve(__dirname,'..');
const handler=require('../api/calendar');
const {mutate}=require('../lib/calendar-store.cjs');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.pdf':'application/pdf'};
async function start(){
 await mutate(s=>{s.weekly=[[],['10:00','12:00','15:00'],['10:00','12:00'],['10:00','12:00'],['10:00','12:00'],['10:00'],[]];});
 http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  res.status=code=>{res.statusCode=code;return res;};res.json=data=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));};
  if(url.pathname==='/api/calendar'){
   let body='';for await(const chunk of req){body+=chunk;if(body.length>32000){res.status(413).json({error:'Too large'});return;}}req.body=body;return handler(req,res);
  }
  let name=decodeURIComponent(url.pathname);if(name==='/')name='/index.html';if(name==='/admin')name='/admin.html';
  if(!/^\/(?:[\w-]+\.(?:html|js|css)|assets\/[\w./ -]+)$/.test(name)){res.statusCode=404;return res.end('Not found');}
  const target=path.resolve(root,'.'+name);if(!target.startsWith(root+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile()){res.statusCode=404;return res.end('Not found');}
  res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');fs.createReadStream(target).pipe(res);
 }).listen(4188,'127.0.0.1',()=>console.log('Preview http://127.0.0.1:4188/admin.html (demo-holisticbite)'));
}start();
