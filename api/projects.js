import {protect} from '../lib/studio-auth.mjs';
export default function handler(req,res){if(!protect(req,res))return;return res.status(410).json({error:'請使用新版工作室'});}
