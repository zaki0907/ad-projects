import {timingSafeEqual, createHash} from 'node:crypto';
export function authorized(req) {
  const key=process.env.STUDIO_ACCESS_KEY;
  if(!key || key.length<32)return false;
  const incoming=req.headers.authorization||'';
  const hash=x=>createHash('sha256').update(x).digest();
  return timingSafeEqual(hash(incoming),hash('Bearer '+key));
}
export function protect(req,res){
  res.setHeader('Cache-Control','no-store');
  if(!process.env.STUDIO_ACCESS_KEY){res.status(503).json({error:'工作室尚未完成設定'});return false;}
  if(!authorized(req)){res.status(401).json({error:'請輸入工作室存取碼'});return false;}
  return true;
}
