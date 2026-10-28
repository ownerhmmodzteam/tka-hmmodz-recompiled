const materials = require('../materials.json');
module.exports = (req, res) => {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method tidak diizinkan' }); }
  const q = String(req.query.q || '').toLowerCase().trim();
  const type = String(req.query.type || 'semua').toLowerCase();
  const list = materials.filter(m => (!q || `${m.title} ${m.kind} ${m.description}`.toLowerCase().includes(q)) && (type === 'semua' || m.kind.toLowerCase() === type)).map(m => ({ ...m, hasPdf: Boolean(m.hasPdf) }));
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  return res.status(200).json({ total: list.length, materials: list });
};
