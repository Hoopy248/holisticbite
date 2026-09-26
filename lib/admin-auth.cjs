const crypto = require('node:crypto');
const sign = value => crypto.createHmac('sha256', process.env.ADMIN_SESSION_SECRET || '').update(value).digest('hex');
function equal(a,b){return crypto.timingSafeEqual(crypto.createHash('sha256').update(a).digest(),crypto.createHash('sha256').update(b).digest());}
function authorized(req){
  if(!process.env.ADMIN_SESSION_SECRET)return false;
  const token=(req.headers.cookie||'').split(';').map(c=>c.trim()).find(c=>c.startsWith('hb_admin='))?.slice(9)||'';
  const [expiry,signature]=token.split('.');
  return Number(expiry)>Date.now()&&equal(signature||'',sign(expiry));
}
module.exports={sign,equal,authorized};
