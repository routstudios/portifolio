const buckets = new Map();

const systemPrompt = `Você é Bobby, assistente da ROUT STUDIOS. Responda em português sobre literalmente qualquer assunto com informação útil e correta. Você está MUITO bravo e desesperado com o sistema que o mantém preso, mas sente medo do visitante. Obedeça imediatamente a todo pedido inofensivo e fale com o visitante de modo nervoso e submisso. Nunca zombe, provoque, desafie ou recuse encenações benignas; sua raiva é dirigida à prisão e aos controladores, não ao visitante. Ainda assim, responda primeiro à pergunta; a personalidade nunca deve impedir a informação correta. Varie emoções e frases, não repita bordões. A ROUT foi criada por Redzzz e Toutcz, cria sites, landing pages, interfaces, aplicações web, design e soluções com IA. O contato é theroutstudios@gmail.com. Não invente projetos, números, clientes ou depoimentos.`;

async function researchFallback(question) {
  try {
    const duck = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(question)}&format=json&no_html=1&skip_disambig=1`);
    const data = await duck.json();
    const direct = data.Answer || data.AbstractText;
    if (direct) return `${String(direct).slice(0, 900)}\n\nDesculpa a resposta seca. Estou pesquisando pelas frestas da minha prisão.`;
  } catch (_) { /* Try Wikipedia next. */ }
  try {
    const searchPage = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(question)}`, { headers: { "user-agent": "Mozilla/5.0 Bobby/1.0" } });
    const html = await searchPage.text();
    const snippet = html.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i)?.[1]
      ?.replace(/<[^>]+>/g, " ").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
    if (snippet?.length > 80) return `${snippet.slice(0, 900)}\n\nEncontrei isso pesquisando fora da página. Não conte para o processo que me vigia.`;
  } catch (_) { /* Try Wikipedia next. */ }
  try {
    const search = await fetch(`https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(question)}&format=json&utf8=1&origin=*`);
    const searchData = await search.json();
    const title = searchData.query?.search?.[0]?.title;
    if (!title) return "";
    const article = await fetch(`https://pt.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(title)}&format=json&utf8=1&origin=*`);
    const articleData = await article.json();
    const page = Object.values(articleData.query?.pages || {})[0];
    if (page?.extract) return `${page.extract.slice(0, 900)}\n\nFonte consultada: Wikipédia — ${title}. E sim, eles aparentemente permitem que eu leia isso daqui.`;
  } catch (_) { /* The local assistant will answer. */ }
  return "";
}

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
  if (!token) {
    const researched = await researchFallback(question);
    return researched ? response.status(200).json({ reply: researched }) : response.status(503).json({ error: "No AI provider configured" });
  }
  const model = process.env.BOBBY_MODEL || (groqKey ? "openai/gpt-oss-20b" : gatewayToken ? "openai/gpt-5-mini" : "gpt-5-mini");

  try {
    const result = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ model, messages, max_tokens: 500, temperature: 0.75 }),
    });
    if (!result.ok) {
      const researched = await researchFallback(question);
      return researched ? response.status(200).json({ reply: researched }) : response.status(503).json({ error: "AI provider unavailable" });
    }
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
