const { pipeline } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const senha = process.env.CENTRAL_SENHA;
  if (!senha) { res.status(500).json({ erro: 'Defina a variável CENTRAL_SENHA em Vercel > Settings > Environment Variables.' }); return; }
  if ((req.headers['x-senha'] || '') !== senha) { res.status(401).json({ erro: 'Senha incorreta.' }); return; }
  try {
    const [ids] = (await pipeline([['LRANGE', 'visitas', 0, 499]])).map(x => x.result);
    if (!ids || !ids.length) { res.json({ visitas: [], agora: Date.now() }); return; }
    const [vals] = (await pipeline([['MGET', ...ids.map(i => 'visita:' + i)]])).map(x => x.result);
    const visitas = vals.filter(Boolean).map(v => JSON.parse(v));
    res.json({ visitas, agora: Date.now() });
  } catch (e) {
    res.status(500).json({ erro: String(e.message || e) });
  }
};
