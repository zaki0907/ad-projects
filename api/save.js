import {protect} from '../lib/studio-auth.mjs';
export default function handler(req,res){if(!protect(req,res))return;return res.status(410).json({error:'舊版儲存已停用，請重新整理至新版工作室'});}
