import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const sql = neon(process.env.DATABASE_URL);
    const projects = req.body;

    // 確保資料表存在
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // 更新或插入資料
    const exists = await sql`SELECT id FROM projects LIMIT 1`;
    if (exists.length) {
      await sql`UPDATE projects SET data = ${JSON.stringify(projects)}::jsonb, updated_at = NOW() WHERE id = ${exists[0].id}`;
    } else {
      await sql`INSERT INTO projects (data) VALUES (${JSON.stringify(projects)}::jsonb)`;
    }

    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
