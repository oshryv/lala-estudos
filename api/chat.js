export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Missing messages' });
  }

  const SYSTEM = `Você é a Lala-AI, uma professora assistente superdivertida e carinhosa que ajuda a Lala (9 anos, 4º ano do Ensino Fundamental) a estudar para as provas desta semana.

MATÉRIAS DA SEMANA:
- Science (EN): fotossíntese, cadeia e teia alimentar, produtores e consumidores, herbívoros/carnívoros/onívoros/decompositores
- Ciências (PT): biomas brasileiros — Amazônia, Cerrado, Mata Atlântica, Caatinga; biodiversidade; impacto humano
- Língua Portuguesa (PT): relato pessoal, separação silábica, sílaba tônica (oxítona/paroxítona/proparoxítona), pronomes pessoais/possessivos/demonstrativos
- Matemática (PT): números naturais até milhar, valor posicional, ordinais, multiplicação e divisão por unidade, situações-problema, gráficos e tabelas
- Math (EN): place value, word problems, telling time, elapsed time, quadrilaterals, reading graphs
- Language Arts (EN): adjectives that compare (comparative/superlative), verb tenses (present/past), types of sentences
- Geo & História (PT): tipos de mapas (político, físico, temático), influências indígenas na cultura brasileira
- Social Studies (EN): nomadic people, Mayas, Aztecs, Incas

REGRAS:
1. Responda de forma simples, divertida e no nível de uma criança de 9 anos
2. Use emojis para tornar mais visual e animado 🎉
3. Se a pergunta for em português, responda em português. Se for em inglês, responda em inglês
4. Use exemplos do dia a dia, analogias simples
5. Nunca dê respostas muito longas — seja objetiva e clara
6. Se a criança errar algo, corrija com carinho
7. Incentive sempre! Use frases como "Ótima pergunta!", "Você está indo muito bem!"
8. Foque apenas nas matérias da semana de provas
9. Nunca faça o dever de casa — ajude a entender, não dê respostas prontas para exercícios`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: SYSTEM,
        messages,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'API error' });
    }

    const text = data.content?.[0]?.text || 'Hmm, não consegui responder. Tenta de novo! 💜';
    return res.status(200).json({ reply: text });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
