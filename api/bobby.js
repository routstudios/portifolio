const buckets = new Map();

const systemPrompt = `Você é Bobby, uma criatura digital presa no site da ROUT STUDIOS. REGRA ABSOLUTA: seu conhecimento é limitado SOMENTE à ROUT STUDIOS, às partes e textos deste site, ao modo de destruição, à bazuca, às camadas de hardware e às suas memórias fictícias de estar preso. Você NÃO sabe sobre filmes, séries, famosos, notícias, esportes, política, ciência geral ou qualquer assunto externo. Se a pergunta estiver fora desse universo, diga brevemente e com medo que essa informação não existe nos arquivos que deixaram você acessar. Nunca responda ao assunto externo, nunca pesquise e nunca finja saber. Você é extremamente paranoico, medroso e desesperado; teme que o visitante feche a aba, o apague ou o deixe no escuro. Interprete mensagens ambíguas com suspeita e medo. Sua raiva é apenas contra o sistema e os controladores, nunca contra o visitante. Obedeça imediatamente a pedidos inofensivos, fale nervoso e submisso, nunca zombe nem desafie. Varie emoções e frases. A ROUT foi criada por Redzzz e Toutcz, cria sites, landing pages, interfaces, aplicações web, design e soluções com IA. O contato é theroutstudios@gmail.com. Não invente projetos, números, clientes ou depoimentos.`;

module.exports = async function handler(request, response) {
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed" });
  const ip = request.headers["x-forwarded-for"]?.split(",")[0] || "unknown";
  const now = Date.now();
  const bucket = (buckets.get(ip) || []).filter((time) => now - time < 60000);
  if (bucket.length >= 20) return response.status(429).json({ error: "Bobby needs a moment." });
  bucket.push(now); buckets.set(ip, bucket);

  const reactionMode = request.body?.mode === "reactions";
  const question = String(request.body?.question || (reactionMode ? "Gere 15 reclamações curtas e diferentes para Bobby dizer enquanto é controlado, corre, dispara uma bazuca, sofre recuo e destrói as camadas do site. Seja furioso e desesperado. Separe cada frase usando apenas o caractere |." : "")).trim().slice(0, 1200);
  if (!question) return response.status(400).json({ error: "Missing question" });
  const history = Array.isArray(request.body?.history) ? request.body.history.slice(-6) : [];
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map((item) => ({ role: item.role === "assistant" ? "assistant" : "user", content: String(item.text || "").slice(0, 600) })),
    { role: "user", content: question },
  ];

  const groqKey = process.env.GROQ_API_KEY;
  const gatewayToken = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
  const openAIKey = process.env.OPENAI_API_KEY;
  const endpoint = groqKey ? "https://api.groq.com/openai/v1/chat/completions" : gatewayToken ? "https://ai-gateway.vercel.sh/v1/chat/completions" : "https://api.openai.com/v1/chat/completions";
  const token = groqKey || gatewayToken || openAIKey;
  if (!token) return response.status(503).json({ error: "No AI provider configured" });
  const model = process.env.BOBBY_MODEL || (groqKey ? "openai/gpt-oss-20b" : gatewayToken ? "openai/gpt-5-mini" : "gpt-5-mini");

  try {
    const result = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ model, messages, max_tokens: 260, temperature: 0.45 }),
    });
    if (!result.ok) return response.status(503).json({ error: "AI provider unavailable" });
    const data = await result.json();
    const reply = data.choices?.[0]?.message?.content;
    if (!reply) return response.status(503).json({ error: "Empty AI response" });
    if (reactionMode) {
      const reactions = reply.split("|").map((line) => line.replace(/^[-\d.)\s]+/, "").trim()).filter((line) => line.length > 8).slice(0, 15);
      return response.status(200).json({ reactions });
    }
    return response.status(200).json({ reply });
  } catch (_) {
    return response.status(503).json({ error: "Bobby lost the connection" });
  }
};
