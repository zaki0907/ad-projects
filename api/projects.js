import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      SELECT data FROM projects LIMIT 1
    `;
    const projects = rows.length ? rows[0].data : [];
    res.status(200).json(projects);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
