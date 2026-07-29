import { neon } from '@neondatabase/serverless';

const LINE_TOKEN = process.env.LINE_TOKEN;
const LINE_USER_ID = process.env.LINE_USER_ID;

async function sendLine(message) {
  await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LINE_TOKEN}`
    },
    body: JSON.stringify({
      to: LINE_USER_ID,
      messages: [{ type: 'text', text: message }]
    })
  });
}

const MS_NAMES = {
  script_draft: '腳本初稿', script_final: '腳本定案',
  acopy: 'A-Copy', bcopy: 'B-Copy', copy: '文案', release: '上片',
  photo_acopy: '照片A-Copy', photo_bcopy: '照片B-Copy', photo_delivery: '照片交檔'
};

export default async function handler(req, res) {
  const { type } = req.query;

  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`SELECT data FROM projects LIMIT 1`;
    const projects = rows.length ? rows[0].data : [];

    const twNow = new Date(Date.now() + 8 * 60 * 60 * 1000);
    const todayStr = twNow.toISOString().slice(0, 10);

    if (type === 'daily') {
      const todayEvents = [];
      projects.forEach(p => {
        if (p.status === 'completed') return;
        Object.entries(p.milestones || {}).forEach(([key, ms]) => {
          if (ms.date === todayStr && MS_NAMES[key]) {
            todayEvents.push(`📌 ${p.name}\n   → ${MS_NAMES[key]}`);
          }
        });
      });

      if (!todayEvents.length) {
        return res.status(200).json({ ok: true, sent: false, reason: '今天沒有節點' });
      }

      await sendLine(`🗓 早安 ZAKI！\n今天（${todayStr}）的重要節點：\n\n${todayEvents.join('\n\n')}\n\n加油！`);

    } else if (type === 'weekly') {
      const day = twNow.getDay();
      const monday = new Date(twNow);
      monday.setDate(twNow.getDate() - (day === 0 ? 6 : day - 1));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const monStr = monday.toISOString().slice(0, 10);
      const sunStr = sunday.toISOString().slice(0, 10);

      const weekEvents = [];
      projects.forEach(p => {
        if (p.status === 'completed') return;
        const evs = [];
        Object.entries(p.milestones || {}).forEach(([key, ms]) => {
          if (ms.date >= monStr && ms.date <= sunStr && MS_NAMES[key]) {
            evs.push(`   ${ms.date} → ${MS_NAMES[key]}`);
          }
        });
        if (evs.length) weekEvents.push(`📁 ${p.name}\n${evs.join('\n')}`);
      });

      if (!weekEvents.length) {
        return res.status(200).json({ ok: true, sent: false, reason: '本週沒有節點' });
      }

      await sendLine(`📅 本週時程總覽（${monStr} ~ ${sunStr}）\n\n${weekEvents.join('\n\n')}\n\n本週加油！`);
    }

    res.status(200).json({ ok: true, sent: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
