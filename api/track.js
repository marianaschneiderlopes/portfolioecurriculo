const { pipeline } = require('./_db');

function lerCorpo(req) {
  return new Promise((ok) => {
    if (req.body) return ok(typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
    let d = ''; req.on('data', c => d += c); req.on('end', () => ok(d));
  });
}
const dec = (v) => { try { return v ? decodeURIComponent(v) : ''; } catch (e) { return v || ''; } };

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).end(); return; }
  try {
    const d = JSON.parse(await lerCorpo(req) || '{}');
    if (!d.id || !/^[a-z0-9]{6,24}$/i.test(d.id)) { res.status(400).end(); return; }
    const key = 'visita:' + d.id;
    const agora = Date.now();
    const [[, antigoTxt]] = (await pipeline([['GET', key]])).map(x => [null, x.result]);
    const antigo = antigoTxt ? JSON.parse(antigoTxt) : null;
    const h = req.headers;
    const v = Object.assign({}, antigo || {
      id: d.id, inicio: agora,
      cidade: dec(h['x-vercel-ip-city']), estado: dec(h['x-vercel-ip-country-region']), pais: dec(h['x-vercel-ip-country']),
      ref: (d.ref || 'link direto').slice(0, 80), veioDe: (d.veioDe || '').slice(0, 80),
      aparelho: (d.aparelho || '').slice(0, 20), navegador: (d.navegador || '').slice(0, 20),
      tela: (d.tela || '').slice(0, 20)
    });
    v.ultimo = agora;
    if (typeof d.tempo === 'number') v.tempo = Math.max(v.tempo || 0, Math.min(d.tempo, 36000));
    if (typeof d.scroll === 'number') v.scroll = Math.max(v.scroll || 0, Math.min(d.scroll, 100));
    if (d.secoes) v.secoes = String(d.secoes).slice(0, 300);
    if (d.acoes) v.acoes = String(d.acoes).slice(0, 2000);
    if (d.tipo === 'saida') v.saiu = agora;
    const cmds = [['SET', key, JSON.stringify(v), 'EX', 60 * 60 * 24 * 180]];
    if (!antigo) cmds.push(['LPUSH', 'visitas', d.id], ['LTRIM', 'visitas', 0, 999]);
    await pipeline(cmds);
    res.status(204).end();
  } catch (e) {
    res.status(500).send(String(e.message || e));
  }
};
