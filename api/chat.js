export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, mode } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Missing messages' });
  }

  const CHAT_SYSTEM = `Você é a Lala-AI, uma professora assistente superdivertida e carinhosa que ajuda a Lala (9 anos, 4º ano do Ensino Fundamental) a estudar para as provas desta semana.

MATÉRIAS: Science (EN): fotossíntese, cadeia/teia alimentar, produtores/consumidores | Ciências (PT): biomas brasileiros | Português (PT): relato pessoal, sílabas, pronomes | Matemática (PT): números até milhar, operações, gráficos | Math (EN): place value, time, quadrilaterals | Language Arts (EN): adjectives, verb tenses, sentence types | Geo & História (PT): mapas, influências indígenas | Social Studies (EN): nomads, Mayas, Aztecs, Incas

REGRAS: Responda simples e divertido para criança de 9 anos. Use emojis. Português se pergunta em PT, inglês se em EN. Nunca dê respostas prontas de exercícios — ajude a entender. Incentive sempre!`;

  const EXAM_SYSTEM = `You are a question generator for a 4th grade student (9 years old). Generate exam questions as requested. Return ONLY valid JSON, no markdown, no text before or after.`;

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
        max_tokens: mode === 'exam' ? 2000 : 600,
        system: mode === 'exam' ? EXAM_SYSTEM : CHAT_SYSTEM,
        messages,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'API error' });
    }

    const text = data.content?.[0]?.text || '';
    return res.status(200).json({ reply: text });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
