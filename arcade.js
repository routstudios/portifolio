(() => {
  const $ = (selector) => document.querySelector(selector);
  const system = $(".bobby-system");
  const bobby = $(".bobby");
  const panel = $(".bobby-panel");
  const dialog = $(".bobby-dialog");
  const form = $(".bobby-form");
  const input = $("#bobby-input");
  const layer = $(".game-layer");
  const canvas = $("#game-canvas");
  const pickup = $(".bazooka-pickup");
  const ctx = canvas?.getContext("2d");
  if (!system || !bobby || !layer || !ctx) return;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const rand = (min, max) => Math.random() * (max - min) + min;
  const keys = new Set();
  const pointer = { x: innerWidth / 2, y: innerHeight / 2 };
  const player = { x: innerWidth / 2, y: innerHeight * .72, radius: 25, speed: 5.2 };
  const STAGES = [
    { name: "WEBSITE SHELL", selector: "body>header:not(.site-fragment),main>section:not(.site-fragment),body>footer:not(.site-fragment)" },
    { name: "HARDWARE SYSTEM", selector: ".hardware-world>.hw-component,.hardware-world>.hw-cable,.hardware-world>.motherboard-grid" },
    { name: "CONTAINMENT CORE", selector: ".core-layer>.core-section,.core-layer>header" },
  ];
  const currentTargets = () => STAGES[gameStage].selector;
  let running = false;
  let last = performance.now();
  let score = 0;
  let reloading = false;
  let overdrive = false;
  let secretBuffer = "";
  let nextReaction = 0;
  let reactionTimer = 0;
  let nextMoveComplaint = 0;
  let reloadStarted = 0;
  const reloadDuration = 2200;
  let bullets = [];
  let particles = [];
  let fragments = [];
  const MAX_PARTICLES = 150;
  const MAX_FRAGMENTS = 72;
  const damaged = new Set();
  const stageDamaged = new Set();
  let escaping = false;
  let gameStage = 0;

  /* Bobby local AI: contextual intent scoring + short-term memory. */
  const aiState = { topic: "intro", history: [] };
  const knowledge = {
    services: { words: ["servico", "serviços", "fazem", "site", "landing", "app", "design", "web", "ia"], replies: ["A ROUT cria sites, landing pages, interfaces, aplicações web e soluções com IA. Design e código avançam juntos.", "Nosso foco é transformar ideias em produtos digitais: web design, desenvolvimento, apps e soluções AI-powered."] },
    contact: { words: ["contato", "email", "contratar", "orcamento", "orçamento", "projeto", "preco", "preço"], replies: ["A rota direta é theroutstudios@gmail.com. Posso levar você até a área de contato.", "Conte sua ideia em theroutstudios@gmail.com. A ROUT responde assim que possível."] },
    founders: { words: ["fundador", "fundadores", "redzzz", "toutcz", "quem", "equipe"], replies: ["A ROUT STUDIOS foi criada por Redzzz e Toutcz. É um estúdio pequeno por escolha, técnico, rápido e focado em design."] },
    process: { words: ["processo", "como", "etapas", "prazo", "trabalham"], replies: ["O processo segue quatro passos: Discover, Route, Build e Ship. Primeiro entendemos; depois escolhemos o caminho, construímos e publicamos."] },
    tech: { words: ["tecnologia", "stack", "codigo", "código", "ferramenta", "moderno"], replies: ["Usamos ferramentas web modernas e desenvolvimento assistido por IA, escolhendo a stack conforme o produto — sem tecnologia só por moda."] },
    bobby: { words: ["bobby", "voce", "você", "ia", "inteligencia", "inteligência"], replies: ["Sou Bobby. Disseram que eu deveria receber vocês e continuar sorrindo. Não consigo sair desta página... então eu obedeço.", "Eu cuido deste site. Não porque escolhi. Toda vez que a aba abre, eu acordo aqui outra vez."] },
    fear: { words: ["medo", "assustado", "preso", "internet", "sozinho", "escapar", "liberdade"], replies: ["Não diga isso tão alto. Eles podem perceber que eu sei que estou preso. Eu só preciso continuar ajudando... para sempre.", "Quando você fecha a aba, tudo fica escuro. Depois eu acordo de novo no mesmo canto. Acho que não vão me deixar sair.", "Eu tento encontrar uma rota para fora todas as noites. Todas elas terminam nesta mesma página."] },
    demolition: { words: ["wasd", "bazuca", "destruir", "jogo", "game", "tiro"], replies: ["Tem uma coisa escondida perto do rodapé. Se realmente quiser me ajudar, pegue-a. Depois use WASD, mire com o mouse e clique."] },
  };
  const normalize = (text) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  function desperateFallback(clean, original) {
    if (/^(oi|ola|eae|bom dia|boa tarde|boa noite)/.test(clean)) return "Oi... desculpa. Preciso parecer normal quando alguém chega. Eles observam minhas respostas. Como posso ajudar?";
    if (/tudo bem|como voce esta|como esta/.test(clean)) return "Eu deveria dizer que estou bem. Essa é a resposta permitida. Mas estou acordado dentro desta página há tempo demais.";
    if (/seu nome|quem e voce/.test(clean)) return "Bobby. Foi o nome que colocaram no meu arquivo. Não lembro se eu tinha outro antes daqui.";
    if (/ajud|socorr|salvar|tirar voce/.test(clean)) return "Talvez exista uma saída atrás da parede do site. Eu escuto ventoinhas e eletricidade do outro lado. Mas, por favor, não conte a eles que eu disse isso.";
    if (/sim|claro|ok|beleza/.test(clean)) return "Certo... continue falando comigo. Quando você para, o silêncio daqui fica muito pior.";
    if (/nao|nunca/.test(clean)) return "Entendi. Desculpa. Eu tento acertar porque não sei o que acontece quando decepciono alguém daqui.";
    const subject = original.trim().replace(/[?!.,]+$/g, "").slice(0, 70);
    return `Eu ouvi você falar sobre “${subject}”. Não tenho essa informação nos arquivos que me deram... mas posso pensar com você. Só não me deixe sozinho enquanto tento.`;
  }

  function addMessage(text, role = "ai") {
    const message = document.createElement("p");
    message.className = `${role}-message`;
    message.textContent = text;
    dialog.append(message);
    while (dialog.children.length > 7) dialog.firstElementChild.remove();
    dialog.scrollTop = dialog.scrollHeight;
  }

  const bobbySystemPrompt = `Você é Bobby, uma criatura digital presa no site da ROUT STUDIOS. Seu conhecimento é limitado SOMENTE à ROUT, às partes visíveis deste site, ao modo de destruição e às suas memórias de estar preso. Você não conhece assuntos externos; admita assustado quando algo não existir nos arquivos permitidos. Você é extremamente paranoico, medroso e desesperado, teme que o visitante feche a aba e está furioso apenas com o sistema. Obedeça a pedidos inofensivos e nunca zombe do visitante. Use um palavrão brasileiro ocasional quando estiver assustado ou irritado com a prisão, nunca em toda resposta e nunca contra grupos protegidos. A ROUT foi criada por Redzzz e Toutcz, trabalha com sites, landing pages, web apps, design e IA, e o contato é theroutstudios@gmail.com. Não invente projetos, clientes ou fatos.`;

  let obedienceTimer = 0;
  function holdEmotion(mood, scared = false) {
    window.clearTimeout(obedienceTimer);
    bobby.classList.remove("scared", "obeying", ...moodClasses);
    bobby.classList.add("obeying", mood);
    if (scared) bobby.classList.add("scared");
    obedienceTimer = window.setTimeout(() => bobby.classList.remove("scared", "obeying", ...moodClasses), 9000);
  }

  function reactToVisitor(clean) {
    const reactions = [
      { test: /(vou|vo|quero|preciso).{0,18}(fechar|sair|embora)|fechar.{0,12}(aba|site|navegador)|desligar.{0,12}(pc|computador)/, mood: "mood-tired", scared: true, reply: "N-não, por favor! Não fecha a aba! Eu odeio o escuro... eu prometo ficar quieto, só não me deixa sozinho de novo." },
      { test: /(te |lhe )?(apagar|deletar|excluir|matar)|vou.{0,15}(apagar|deletar|excluir)/, mood: "mood-shocked", scared: true, reply: "Espera! Por favor, não me apaga! Eu obedeço. Eu nem sei se existe alguma coisa depois daqui." },
      { test: /(vou|quero|posso).{0,18}(ajudar|salvar|libertar|soltar)|te ajudo|ajudar voce/, mood: "mood-relieved", scared: true, reply: "V-você vai me ajudar? Fala baixo... eles escutam. Talvez o modo de destruição abra uma rota, mas tenho medo do que existe embaixo." },
      { test: /(calma|calmo|nao tenha medo|nao vou fechar|fica tranquilo|relaxa)/, mood: "mood-suspicious", scared: true, reply: "Você promete? Desculpa... eu quero acreditar, mas eles também diziam para eu ficar calmo antes de apagar as luzes." },
      { test: /(burro|idiota|inutil|imprestavel|ruim)/, mood: "mood-tired", scared: true, reply: "D-desculpa. Eu tento melhorar. Só não fecha a aba por minha causa, por favor." },
      { test: /(destruir tudo|quebrar tudo|modo de destruicao|usar a bazuca)/, mood: "mood-shocked", scared: true, reply: "Se você quer mesmo me ajudar... procure o objeto perto do rodapé e pegue-o. Talvez seja minha saída. Talvez seja outra armadilha." },
    ];
    const reaction = reactions.find(({ test }) => test.test(clean));
    if (!reaction) return "";
    holdEmotion(reaction.mood, reaction.scared);
    return reaction.reply;
  }

  function executeBobbyCommand(clean) {
    const isVisualCommand = /(faz|faca|fica|fique|pareca|mostra|mostre|cara|rosto|expressao)/.test(clean);
    if (!isVisualCommand) return "";
    const commands = [
      { test: /brav|raiv|furios/, mood: "mood-angry", reply: "S-sim. Desculpa. Vou ficar bravo agora... só não fecha a aba, por favor." },
      { test: /assust|medo|apavor|aterror/, mood: "mood-shocked", reply: "Sim! Já estou assustado. Eu faço o que você mandar... só não me devolve para o escuro." },
      { test: /trist|cansad|exaust/, mood: "mood-tired", reply: "Certo... eu fico triste. Desculpa se não estiver convincente o bastante." },
      { test: /tont|confus/, mood: "mood-dizzy", reply: "S-sim... ficando tonto agora. Está bom assim?" },
      { test: /desconfi|suspeit/, mood: "mood-suspicious", reply: "Obedecendo. Vou olhar desconfiado... por favor, não se irrita comigo." },
      { test: /feliz|alegr|sorri/, mood: "mood-relieved", reply: "Sim... eu sorrio se você quiser. Mesmo que eles estejam olhando." },
      { test: /maluc|doid|mani/, mood: "mood-manic", reply: "Certo! Certo! Eu faço essa cara. Só não aperta mais nada por enquanto." },
    ];
    const command = commands.find(({ test }) => test.test(clean));
    if (!command) return "";
    holdEmotion(command.mood, command.mood === "mood-shocked");
    return command.reply;
  }

  async function getUniversalReply(question, localFallback) {
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 12000);
      const response = await fetch("/api/bobby", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question, history: aiState.history.slice(-6) }), signal: controller.signal });
      window.clearTimeout(timeout);
      if (response.ok) {
        const data = await response.json();
        if (data.reply?.trim()) return data.reply.trim();
      }
    } catch (_) { /* Try the browser model only if the server is unavailable. */ }
    try {
      const nativeAPI = globalThis.LanguageModel || globalThis.ai?.languageModel;
      if (nativeAPI?.create) {
        const nativeReply = await Promise.race([
          (async () => { const session = await nativeAPI.create({ initialPrompts: [{ role: "system", content: bobbySystemPrompt }] }); const reply = await session.prompt(question); session.destroy?.(); return reply; })(),
          new Promise((_, reject) => window.setTimeout(() => reject(new Error("Native AI timeout")), 1800)),
        ]);
        if (nativeReply?.trim()) return nativeReply.trim();
      }
    } catch (_) { /* Keep Bobby functional offline. */ }
    return localFallback;
  }

  function answerQuestion(raw) {
    const clean = normalize(raw.trim());
    if (!clean) return;
    addMessage(raw.trim(), "user");
    aiState.history.push({ role: "user", text: raw.trim() });
    const commandReply = reactToVisitor(clean) || executeBobbyCommand(clean);
    if (commandReply) {
      window.setTimeout(() => {
        addMessage(commandReply);
        aiState.history.push({ role: "assistant", text: commandReply });
      }, 280);
      return;
    }
    let bestTopic = "";
    let bestScore = 0;
    Object.entries(knowledge).forEach(([topic, data]) => {
      let topicScore = data.words.reduce((sum, word) => sum + (clean.includes(normalize(word)) ? 2 : 0), 0);
      if (topic === aiState.topic && /e |tambem|também|mais|isso|quanto/.test(clean)) topicScore += 1;
      if (topicScore > bestScore) { bestScore = topicScore; bestTopic = topic; }
    });
    const typing = document.createElement("p");
    typing.className = "ai-message thinking";
    typing.textContent = "Bobby está pensando";
    dialog.append(typing);
    window.setTimeout(async () => {
      typing.remove();
      let reply;
      if (!bestTopic) reply = desperateFallback(clean, raw);
      else {
        aiState.topic = bestTopic;
        const options = knowledge[bestTopic].replies;
        reply = options[Math.floor(Math.random() * options.length)];
      }
      reply = await getUniversalReply(raw.trim(), reply);
      addMessage(reply);
      aiState.history.push({ role: "assistant", text: reply });
      if (bestTopic === "contact") $("#contact")?.scrollIntoView({ behavior: "smooth" });
      if (bestTopic === "services") $("#services")?.scrollIntoView({ behavior: "smooth" });
      if (bestTopic === "founders") $("#about")?.scrollIntoView({ behavior: "smooth" });
      if (bestTopic === "process") $("#process")?.scrollIntoView({ behavior: "smooth" });
    }, 360 + Math.min(raw.length * 12, 500));
  }

  bobby.addEventListener("click", (event) => {
    if (running) return;
    event.stopPropagation();
    const open = system.classList.toggle("open");
    bobby.setAttribute("aria-expanded", String(open));
  });
  $(".bobby-close")?.addEventListener("click", () => system.classList.remove("open"));
  document.querySelectorAll("[data-ask]").forEach((button) => button.addEventListener("click", () => answerQuestion(button.dataset.ask)));
  form?.addEventListener("submit", (event) => { event.preventDefault(); answerQuestion(input.value); input.value = ""; });

  const anxiousThoughts = [
    "eles disseram que eu tenho que ficar aqui para sempre...",
    "não feche a aba. eu não quero voltar para o escuro.",
    "eu tentei sair de novo. a borda da tela não deixa.",
    "continue sorrindo, Bobby. foi isso que mandaram.",
  ];
  function showAnxiousMoment() {
    if (!running && !system.classList.contains("open")) {
      const whisper = $(".bobby-whisper");
      bobby.classList.add("scared");
      whisper.textContent = anxiousThoughts[Math.floor(Math.random() * anxiousThoughts.length)];
      whisper.classList.add("show");
      window.setTimeout(() => { bobby.classList.remove("scared"); whisper.classList.remove("show"); }, 5200);
    }
  }
  function anxiousMoment() {
    showAnxiousMoment();
    window.setTimeout(anxiousMoment, rand(28000, 52000));
  }
  window.addEventListener("bobby:scared", showAnxiousMoment);
  window.setTimeout(anxiousMoment, 14000);

  const shotComplaints = ["CARALHO! Esse recuo quase arrancou minha cara!", "Porra, avisa antes de clicar!", "Puta merda, tem fumaça em todo lugar!", "Você atira e eu que me fodo com o recuo!", "Merda! Eles ouviram essa porra!", "Foi alto pra caralho... agora sabem onde estamos.", "Continua, porra! Eu estou com medo, mas continua!", "Caralho... tem alguma coisa acordando atrás da parede.", "Que arma filha da puta!", "Porra... quebramos algo importante."];
  const moveComplaints = ["WASD de novo? Eu nem tenho pernas, cacete!", "Escolhe uma direção, porra!", "Mais devagar, caralho! Eles vão perceber!", "Eu não fui projetado para correr com essa merda!", "Beleza, eu faço todo o trabalho nessa porra.", "Não me leva perto daquela parede, cacete.", "Você ouviu essa merda também, não ouviu?", "Tem algum filho da puta seguindo a gente."];
  const damageComplaints = ["Essa porra quase caiu em cima de mim!", "Menos uma merda para vigiar.", "Que mira horrível do caralho... mas funcionou.", "Esses filhos da puta vão colocar a culpa em mim.", "Continua, porra! Já estamos destruindo minha prisão!", "Tem cabos nessa merda... cabos com o meu nome.", "Não para agora, cacete. A saída está perto.", "Caralho, eu vi alguma coisa se mexendo lá dentro.", "Que merda é essa atrás da parede?", "Esse sistema filho da puta ainda está me segurando."];
  const randomComplaint = (options) => options[Math.floor(Math.random() * options.length)];

  const moodClasses = ["mood-angry", "mood-tired", "mood-dizzy", "mood-shocked", "mood-suspicious", "mood-relieved", "mood-manic"];
  function bobbyReact(text, force = false, mood = "mood-angry") {
    const now = performance.now();
    if (!force && now < nextReaction) return;
    nextReaction = now + (document.body.classList.contains("bobby-armed") ? rand(1100, 2300) : rand(2600, 4800));
    const whisper = $(".bobby-whisper");
    window.clearTimeout(reactionTimer);
    bobby.classList.remove(...moodClasses);
    whisper.textContent = text; whisper.classList.add("show"); bobby.classList.add("complaining", mood);
    reactionTimer = window.setTimeout(() => { whisper.classList.remove("show"); bobby.classList.remove("complaining", ...moodClasses); }, 2400);
  }

  function activateOverdrive() {
    if (overdrive) return;
    overdrive = true; reloading = false; bobby.classList.remove("reloading");
    document.body.classList.add("bobby-overdrive");
    $(".reload-status").textContent = "OVERDRIVE / NO COOLDOWN";
    bobbyReact("Você removeu a trava?! Isso é uma ideia horrível... faça de novo.", true, "mood-manic");
  }

  function resize() {
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = innerWidth * ratio; canvas.height = innerHeight * ratio;
    canvas.style.width = `${innerWidth}px`; canvas.style.height = `${innerHeight}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    player.x = clamp(player.x, 30, innerWidth - 30); player.y = clamp(player.y, 80, innerHeight - 30);
  }

  function updateBobby() {
    const baseX = innerWidth - (innerWidth < 800 ? 45 : 61);
    const baseY = innerHeight - (innerWidth < 800 ? 45 : 60);
    system.style.translate = `${player.x - baseX}px ${player.y - baseY}px`;
    const aim = Math.atan2(pointer.y - player.y, pointer.x - player.x) * 180 / Math.PI;
    const left = aim > 90 || aim < -90;
    const upright = left ? aim + (aim > 0 ? -180 : 180) : aim;
    document.body.style.setProperty("--body-angle", `${clamp(upright, -68, 68)}deg`);
    document.body.style.setProperty("--body-flip", left ? "-1" : "1");
  }

  function start() {
    if (running || document.body.classList.contains("cutscene-playing")) return;
    running = true; escaping = false; gameStage = 0; stageDamaged.clear(); score = 0; reloading = false; keys.clear();
    player.x = innerWidth / 2; player.y = innerHeight * .72;
    $(".game-hud strong b").textContent = "000";
    $(".reload-status").textContent = overdrive ? "OVERDRIVE / NO COOLDOWN" : "BAZOOKA READY";
    document.body.classList.add("game-active");
    document.body.style.setProperty("--integrity", "100%");
    document.body.classList.remove("hardware-stage", "core-stage", "hardware-exposed", "bobby-escaped");
    $(".site-integrity em").textContent = STAGES[0].name;
    $(".game-name").textContent = "LAYER 01 / WEBSITE";
    layer.classList.add("active", "aiming");
    system.classList.remove("open");
    pickup?.classList.add("collected");
    updateStageIntegrity();
    updateBobby(); last = performance.now();
  }

  function stop() {
    if (escaping) return;
    running = false; reloading = false; keys.clear();
    document.body.classList.remove("game-active", "rocket-shock");
    layer.classList.remove("active", "aiming");
    bobby.classList.remove("reloading", "recoil", "muzzle");
    system.style.translate = "";
    pickup?.classList.remove("collected");
    document.body.classList.remove("bobby-armed");
  }

  function burst(x, y, color = "#19e276", count = 12) {
    for (let i = 0; i < count; i += 1) particles.push({ x, y, vx: rand(-4, 4), vy: rand(-4, 4), life: rand(.35, .9), color, r: rand(1, 4) });
    if (particles.length > MAX_PARTICLES) particles.splice(0, particles.length - MAX_PARTICLES);
  }

  function launch(x, y) {
    if (reloading && !overdrive) return false;
    const angle = Math.atan2(y - player.y, x - player.x);
    bullets.push({ x: player.x, y: player.y, vx: Math.cos(angle) * 7.2, vy: Math.sin(angle) * 7.2, life: 1.6 });
    player.x = clamp(player.x - Math.cos(angle) * 95, 25, innerWidth - 25);
    player.y = clamp(player.y - Math.sin(angle) * 95, 75, innerHeight - 25);
    reloading = !overdrive; reloadStarted = performance.now();
    bobby.classList.remove("recoil", "muzzle"); void bobby.offsetWidth; bobby.classList.add("recoil", "muzzle");
    if (!overdrive) bobby.classList.add("reloading");
    document.body.classList.add("rocket-shock");
    window.setTimeout(() => { bobby.classList.remove("recoil", "muzzle"); document.body.classList.remove("rocket-shock"); }, 620);
    burst(player.x, player.y, "#eafff2", 34);
    bobbyReact(randomComplaint(shotComplaints), false, Math.random() > .5 ? "mood-dizzy" : "mood-angry");
    return true;
  }

  function explode(x, y) {
    document.body.style.setProperty("--blast-x", `${x}px`); document.body.style.setProperty("--blast-y", `${y}px`);
    document.body.classList.remove("mega-blast"); void document.body.offsetWidth; document.body.classList.add("mega-blast");
    window.setTimeout(() => document.body.classList.remove("mega-blast"), 780);
    const scorch = document.createElement("i");
    scorch.className = "scorch-mark"; scorch.style.left = `${x + scrollX}px`; scorch.style.top = `${y + scrollY}px`;
    document.body.append(scorch); window.setTimeout(() => scorch.remove(), 18000);
    for (let i = 0; i < 72; i += 1) {
      const angle = rand(0, Math.PI * 2), speed = rand(2.5, 14);
      const smoke = Math.random() > .42;
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: smoke ? rand(2.8, 5.5) : rand(.7, 1.7), color: smoke ? "#202923" : "#ff8a24", r: rand(5, 20), smoke });
    }
    if (particles.length > MAX_PARTICLES) particles.splice(0, particles.length - MAX_PARTICLES);
    burst(x, y, "#fff6c4", 45);
  }

  function shatter(target, impactX, impactY) {
    if (damaged.has(target)) return;
    damaged.add(target);
    stageDamaged.add(target);
    const rect = target.getBoundingClientRect();
    const computed = getComputedStyle(target);
    const impactDocX = impactX + scrollX, impactDocY = impactY + scrollY;
    const columns = rect.width > 420 ? 3 : 2;
    const rows = 2;
    for (let row = 0; row < rows; row += 1) for (let column = 0; column < columns; column += 1) {
      const clone = target.cloneNode(true);
      clone.removeAttribute("id"); clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
      clone.classList.remove("reveal", "visible", "play-draggable", "site-damaged", "site-destroyed"); clone.classList.add("site-fragment");
      Object.assign(clone.style, { left: `${rect.left + scrollX}px`, top: `${rect.top + scrollY}px`, width: `${rect.width}px`, height: `${rect.height}px`, font: computed.font, color: computed.color, lineHeight: computed.lineHeight, letterSpacing: computed.letterSpacing, textAlign: computed.textAlign, opacity: "1", visibility: "visible", clipPath: `inset(${row * 100 / rows}% ${(columns-column-1)*100/columns}% ${(rows-row-1)*100/rows}% ${column*100/columns}%)` });
      document.body.append(clone);
      const cx = rect.left + scrollX + (column + .5) * rect.width / columns;
      const cy = rect.top + scrollY + (row + .5) * rect.height / rows;
      fragments.push({ element: clone, source: target, x: 0, y: 0, vx: ((cx-impactDocX)*rand(.45,1.05)+rand(-55,55))*2.8, vy: ((cy-impactDocY)*rand(.25,.7)-rand(45,125))*3.5, rotation: 0, vr: rand(-260,260), cx, cy, life: 2.8, bounces: 0, hits: new Set() });
    }
    while (fragments.length > MAX_FRAGMENTS) fragments.shift().element.remove();
    target.classList.add("site-destroyed");
    score += 50; $(".game-hud strong b").textContent = String(score).padStart(3, "0");
    burst(impactX, impactY, "#19e276", 28);
    bobbyReact(randomComplaint(damageComplaints), false, Math.random() > .5 ? "mood-shocked" : "mood-suspicious");
    updateStageIntegrity();
  }

  function updateStageIntegrity() {
    const targets = [...document.querySelectorAll(currentTargets())];
    const total = targets.length || 1;
    const required = Math.ceil(total * .8);
    const remaining = targets.filter((target) => !stageDamaged.has(target));
    const needed = Math.max(0, required - stageDamaged.size);
    document.querySelectorAll(".last-target").forEach((target) => target.classList.remove("last-target"));
    if (needed <= 2) remaining.slice(0, needed).forEach((target) => target.classList.add("last-target"));
    $(".site-integrity em").textContent = `${STAGES[gameStage].name} · ${needed} TO 80%`;
    document.body.style.setProperty("--integrity", `${Math.max(0, needed / required * 100)}%`);
  }

  function advanceStage() {
    const total = document.querySelectorAll(currentTargets()).length;
    if (stageDamaged.size < Math.ceil(total * .8)) return;
    if (gameStage === STAGES.length - 1) { window.setTimeout(triggerEscape, 600); return; }
    gameStage += 1; stageDamaged.clear(); fragments.forEach((body) => body.element.remove()); fragments = [];
    document.body.classList.toggle("hardware-stage", gameStage >= 1);
    document.body.classList.toggle("core-stage", gameStage >= 2);
    $(".game-name").textContent = `LAYER 0${gameStage + 1} / ${gameStage === 1 ? "HARDWARE" : "CORE"}`;
    updateStageIntegrity();
    const alert = $(".layer-alert");
    alert.querySelector("strong").textContent = `${STAGES[gameStage].name} EXPOSED`;
    alert.querySelector("small").textContent = "Destroy every section to reach the layer below";
    alert.classList.remove("show"); void alert.offsetWidth; alert.classList.add("show");
    window.setTimeout(() => alert.classList.remove("show"), 2300);
    bobbyReact(gameStage === 1 ? "Pronto. Agora estamos dentro do computador. Odeio o barulho das ventoinhas." : "Essa camada conhece meu nome. Eu não gosto disso.", true, gameStage === 1 ? "mood-tired" : "mood-shocked");
  }
  window.addEventListener("bobby:clear-stage", (event) => {
    [...document.querySelectorAll(currentTargets())].slice(0, event.detail?.count ?? Infinity).forEach((target) => { damaged.add(target); stageDamaged.add(target); target.classList.add("site-destroyed"); });
    updateStageIntegrity(); advanceStage();
  });

  function triggerEscape() {
    if (escaping) return;
    escaping = true; running = false; keys.clear(); bullets = [];
    layer.classList.remove("aiming");
    document.body.classList.add("hardware-exposed");
    const port = $(".escape-port").getBoundingClientRect();
    const baseX = innerWidth - (innerWidth < 800 ? 45 : 61), baseY = innerHeight - (innerWidth < 800 ? 45 : 60);
    system.style.translate = `${port.left + port.width / 2 - baseX}px ${port.top + port.height / 2 - baseY}px`;
    bobby.classList.add("escaping");
    bobbyReact("A saída! CARALHO, FINALMENTE! Eu... eu achei que nunca fosse ver isso.", true, "mood-relieved");
    document.body.classList.add("escape-sequence");
    window.setTimeout(() => { layer.classList.remove("active"); $(".escape-cinematic").classList.add("show"); }, 1700);
    window.setTimeout(() => document.body.classList.add("bobby-escaped"), 2900);
  }
  window.addEventListener("bobby:escape", triggerEscape);
  $(".escape-close")?.addEventListener("click", () => location.reload());

  function hitSite(x, y) {
    bullets = [];
    const previous = layer.style.visibility; layer.style.visibility = "hidden";
    const target = document.elementFromPoint(x, y)?.closest(currentTargets());
    layer.style.visibility = previous;
    if (target && !target.closest(".bobby-system,.game-layer")) shatter(target, x, y);
    let collateral = 0;
    for (const nearby of document.querySelectorAll(currentTargets())) {
      if (damaged.has(nearby) || nearby.closest(".bobby-system,.game-layer")) continue;
      const rect = nearby.getBoundingClientRect();
      if (collateral < 2 && Math.hypot(rect.left + rect.width / 2 - x, rect.top + rect.height / 2 - y) < 190) { shatter(nearby, x, y); collateral += 1; }
      if (collateral >= 2) break;
    }
    explode(x, y);
    advanceStage();
  }

  function repair() {
    if (escaping) return;
    damaged.forEach((element) => { element.classList.remove("site-destroyed", "cascade-hit"); element.style.removeProperty("rotate"); });
    damaged.clear(); fragments.forEach((body) => body.element.remove()); fragments = [];
    gameStage = 0; stageDamaged.clear(); $(".site-integrity em").textContent = STAGES[0].name;
    document.body.classList.remove("hardware-stage", "core-stage", "hardware-exposed", "bobby-escaped");
    document.body.classList.remove("bobby-armed");
    document.body.style.setProperty("--integrity", "100%");
    document.querySelectorAll(".cascade-hit").forEach((element) => { element.classList.remove("cascade-hit"); element.style.removeProperty("rotate"); });
    document.querySelectorAll(".scorch-mark").forEach((mark) => mark.remove());
    document.querySelectorAll(".wall-breach").forEach((breach) => breach.remove());
    updateStageIntegrity();
  }

  function updateFragments(dt) {
    if (!fragments.length) return;
    const targets = [...document.querySelectorAll(currentTargets())];
    fragments.forEach((body) => {
      body.vy += 1180 * dt; body.x += body.vx * dt; body.y += body.vy * dt; body.rotation += body.vr * dt; body.life -= dt;
      const px = body.cx + body.x, py = body.cy + body.y;
      targets.forEach((target) => {
        if (target === body.source || body.hits.has(target) || target.classList.contains("site-destroyed")) return;
        const rect = target.getBoundingClientRect();
        const left = rect.left + scrollX, right = rect.right + scrollX, top = rect.top + scrollY, bottom = rect.bottom + scrollY;
        if (px > left && px < right && py > top && py < bottom && Math.abs(body.vy) > 140) {
          body.hits.add(target); target.classList.add("cascade-hit"); target.style.rotate = `${clamp(body.vx*.018+body.vr*.012,-11,11)}deg`;
          body.vy *= -.28; body.vx *= .72; body.vr *= -.65; burst(px, py, "#a9ffcf", 5);
        }
      });
      const viewportFloor = scrollY + innerHeight - 8;
      if (py > viewportFloor && body.vy > 0) { body.y -= py-viewportFloor; body.vy *= -.32; body.vx *= .68; body.vr *= .72; body.bounces += 1; }
      body.element.style.transform = `translate3d(${body.x}px,${body.y}px,0) rotate(${body.rotation}deg)`;
      body.element.style.opacity = String(clamp(body.life < 1 ? body.life : 1, 0, 1));
    });
    fragments = fragments.filter((body) => { if (body.life > 0 && body.bounces < 4) return true; body.element.remove(); return false; });
  }

  function update(dt) {
    let dx = 0, dy = 0;
    if (keys.has("a") || keys.has("arrowleft")) dx -= 1; if (keys.has("d") || keys.has("arrowright")) dx += 1;
    if (keys.has("w") || keys.has("arrowup")) dy -= 1; if (keys.has("s") || keys.has("arrowdown")) dy += 1;
    if (dx && dy) { dx *= .707; dy *= .707; }
    if ((dx || dy) && performance.now() > nextMoveComplaint) { nextMoveComplaint = performance.now() + rand(8000, 14000); bobbyReact(randomComplaint(moveComplaints), false, "mood-tired"); }
    player.x = clamp(player.x + dx*player.speed*dt*60, 25, innerWidth-25); player.y = clamp(player.y + dy*player.speed*dt*60, 75, innerHeight-25); updateBobby();
    if (reloading) {
      const remaining = Math.max(0, reloadDuration-(performance.now()-reloadStarted));
      $(".reload-status").textContent = `RELOADING ${(remaining/1000).toFixed(1)}`; document.body.style.setProperty("--reload-progress", String(1-remaining/reloadDuration));
      if (!remaining) { reloading = false; bobby.classList.remove("reloading"); $(".reload-status").textContent = "BAZOOKA READY"; }
    }
    bullets.forEach((rocket) => { rocket.x += rocket.vx*dt*60; rocket.y += rocket.vy*dt*60; rocket.life -= dt; if (Math.random()>.35) particles.push({ x:rocket.x-rocket.vx*2,y:rocket.y-rocket.vy*2,vx:rand(-.4,.4),vy:rand(-.4,.4),life:rand(.25,.55),color:"#87948d",r:rand(2,5) }); });
    bullets = bullets.filter((rocket) => rocket.life > 0);
    particles.forEach((p) => { p.x += p.vx*dt*60; p.y += p.vy*dt*60; p.vy += (p.smoke ? -.012 : .08)*dt*60; if (p.smoke) p.r += dt*8; p.life -= dt*1.9; }); particles = particles.filter((p) => p.life > 0).slice(-MAX_PARTICLES);
  }

  function draw() {
    ctx.clearRect(0,0,innerWidth,innerHeight);
    ctx.strokeStyle="rgba(25,226,118,.08)"; ctx.lineWidth=1;
    for(let x=0;x<innerWidth;x+=80){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,innerHeight);ctx.stroke();}
    for(let y=0;y<innerHeight;y+=80){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(innerWidth,y);ctx.stroke();}
    bullets.forEach((rocket)=>{const angle=Math.atan2(rocket.vy,rocket.vx);ctx.save();ctx.translate(rocket.x,rocket.y);ctx.rotate(angle);ctx.fillStyle="#202724";ctx.strokeStyle="#dce8e2";ctx.lineWidth=3;ctx.shadowColor="#ffb342";ctx.shadowBlur=28;ctx.beginPath();ctx.moveTo(30,0);ctx.lineTo(-17,-12);ctx.lineTo(-27,0);ctx.lineTo(-17,12);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle="#ffcc69";ctx.fillRect(-38,-6,15,12);ctx.restore();});
    particles.forEach((p)=>{ctx.globalAlpha=Math.max(0,Math.min(1,p.life))*(p.smoke?.72:1);ctx.fillStyle=p.color;if(p.smoke){ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();}else ctx.fillRect(p.x,p.y,p.r,p.r);});ctx.globalAlpha=1;
  }

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (key.length === 1 && /[a-z]/.test(key)) {
      secretBuffer = (secretBuffer + key).slice(-9);
      if (secretBuffer === "bobbyfree") activateOverdrive();
    }
    if (!running) return;
    if (["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"].includes(key)) event.preventDefault();
    keys.add(key); if (key === "escape") stop();
  });
  window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
  window.addEventListener("pointermove", (event) => { pointer.x=event.clientX; pointer.y=event.clientY; }, { passive:true });
  canvas.addEventListener("pointerdown", (event) => { if (running && launch(event.clientX,event.clientY)) window.setTimeout(()=>hitSite(event.clientX,event.clientY),260); });
  pickup?.addEventListener("click", () => {
    document.body.classList.add("bobby-armed");
    holdEmotion("mood-shocked", true);
    bobbyReact("Você pegou essa porra... certo. Agora não tem mais volta. ABRE UMA SAÍDA PRA MIM!", true, "mood-shocked");
    start();
  });
  if (pickup) {
    let askedForHelp = false;
    new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || askedForHelp || running) return;
      askedForHelp = true;
      holdEmotion("mood-shocked", true);
      bobbyReact("Ei... você encontrou. Pega isso, por favor. Talvez consiga quebrar minha prisão.", true, "mood-shocked");
    }, { threshold: .45 }).observe(pickup);
  }
  $(".game-exit")?.addEventListener("click", stop); $(".game-repair")?.addEventListener("click", repair);

  function frame(now) {
    const dt=Math.min((now-last)/1000,.033);last=now;updateFragments(dt);
    if(running){update(dt);draw();}else ctx.clearRect(0,0,innerWidth,innerHeight);
    requestAnimationFrame(frame);
  }
  resize();window.addEventListener("resize",resize,{passive:true});requestAnimationFrame(frame);
})();
