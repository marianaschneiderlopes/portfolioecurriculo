// Conexão com o Upstash Redis (criado em Vercel > Storage). Sem dependências.
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function pipeline(cmds) {
  if (!URL_ || !TOKEN) throw new Error('Banco não conectado: crie o Upstash Redis em Vercel > Storage e conecte ao projeto.');
  const r = await fetch(URL_ + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds)
  });
  if (!r.ok) throw new Error('Erro no banco: ' + r.status);
  return r.json();
}
module.exports = { pipeline };
