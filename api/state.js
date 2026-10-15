import {neon} from '@neondatabase/serverless';
import {randomUUID} from 'node:crypto';
import {protect} from '../lib/studio-auth.mjs';
import {validate} from '../studio/model.mjs';
export default async function handler(req,res){
  if(!protect(req,res))return;
  if(!['GET','PUT','POST'].includes(req.method))return res.status(405).end();
  try{
    const sql=neon(process.env.DATABASE_URL);
    await sql`CREATE TABLE IF NOT EXISTS studio_state (id INTEGER PRIMARY KEY CHECK(id=1), data JSONB NOT NULL, revision TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS studio_backups (revision TEXT PRIMARY KEY, data JSONB NOT NULL, saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    if(req.method==='GET'){
      const rows=await sql`SELECT data,revision FROM studio_state WHERE id=1`;
      if(!rows.length)return res.status(503).json({error:'資料轉移尚未完成，請稍後再試'});
      return res.status(200).json({state:rows[0].data,revision:rows[0].revision});
    }
    const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
    if(Buffer.byteLength(JSON.stringify(body))>4e6)return res.status(413).json({error:'資料過大'});
    try{validate(body.state)}catch{return res.status(400).json({error:'資料格式不完整，未儲存'})}
    const raw=JSON.stringify(body.state),revision=randomUUID();
    if(req.method==='POST'){
      // One-time import only. Compare the live legacy snapshot in the same statement.
      if(!Array.isArray(body.legacy))return res.status(400).json({error:'缺少原始資料核對副本'});
      const rows=await sql`INSERT INTO studio_state(id,data,revision) SELECT 1,${raw}::jsonb,${revision} WHERE EXISTS(SELECT 1 FROM projects WHERE data=${JSON.stringify(body.legacy)}::jsonb) ON CONFLICT(id) DO NOTHING RETURNING revision`;
      if(!rows.length)return res.status(409).json({error:'已完成轉移或原始資料已變更，未覆寫'});
    }else{
      if(typeof body.revision!=='string')return res.status(400).json({error:'缺少資料版本'});
      const rows=await sql`WITH old AS MATERIALIZED (SELECT data,revision FROM studio_state WHERE id=1 AND revision=${body.revision} FOR UPDATE), changed AS (UPDATE studio_state SET data=${raw}::jsonb,revision=${revision},updated_at=NOW() WHERE id=1 AND revision=(SELECT revision FROM old) RETURNING revision), backed AS (INSERT INTO studio_backups(revision,data) SELECT old.revision,old.data FROM old WHERE EXISTS(SELECT 1 FROM changed) ON CONFLICT DO NOTHING) SELECT revision FROM changed`;
      if(!rows.length)return res.status(409).json({error:'另一個裝置已更新資料。請先下載目前備份並保留輸入，重新載入後再編輯。'});
    }
    return res.status(200).json({revision});
  }catch(e){console.error('Studio storage failed:',e.code||e.name);return res.status(500).json({error:'雲端儲存暫時無法使用，請保留輸入並稍後再試'});}
}
