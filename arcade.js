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
  const ctx = canvas?.getContext("2d");
  if (!system || !bobby || !layer || !ctx) return;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const rand = (min, max) => Math.random() * (max - min) + min;
  const keys = new Set();
  const pointer = { x: innerWidth / 2, y: innerHeight / 2 };
  const player = { x: innerWidth / 2, y: innerHeight * .72, radius: 25, speed: 5.2 };
  const damageTargets = "article,.service,.step,.section-head,.services-intro,.process-title,.about-copy>p,.founders>span,.email-panel,footer>p,h1,h2";
  let running = false;
  let last = performance.now();
  let score = 0;
  let reloading = false;
  let reloadStarted = 0;
  const reloadDuration = 2200;
  let bullets = [];
  let particles = [];
  let fragments = [];
  const damaged = new Set();

  /* Bobby local AI: contextual intent scoring + short-term memory. */
  const aiState = { topic: "intro", history: [] };
  const knowledge = {
    services: { words: ["servico", "serviços", "fazem", "site", "landing", "app", "design", "web", "ia"], replies: ["A ROUT cria sites, landing pages, interfaces, aplicações web e soluções com IA. Design e código avançam juntos.", "Nosso foco é transformar ideias em produtos digitais: web design, desenvolvimento, apps e soluções AI-powered."] },
    contact: { words: ["contato", "email", "contratar", "orcamento", "orçamento", "projeto", "preco", "preço"], replies: ["A rota direta é theroutstudios@gmail.com. Posso levar você até a área de contato.", "Conte sua ideia em theroutstudios@gmail.com. A ROUT responde assim que possível."] },
    founders: { words: ["fundador", "fundadores", "redzzz", "toutcz", "quem", "equipe"], replies: ["A ROUT STUDIOS foi criada por Redzzz e Toutcz. É um estúdio pequeno por escolha, técnico, rápido e focado em design."] },
    process: { words: ["processo", "como", "etapas", "prazo", "trabalham"], replies: ["O processo segue quatro passos: Discover, Route, Build e Ship. Primeiro entendemos; depois escolhemos o caminho, construímos e publicamos."] },
    tech: { words: ["tecnologia", "stack", "codigo", "código", "ferramenta", "moderno"], replies: ["Usamos ferramentas web modernas e desenvolvimento assistido por IA, escolhendo a stack conforme o produto — sem tecnologia só por moda."] },
    bobby: { words: ["bobby", "voce", "você", "ia", "inteligencia", "inteligência"], replies: ["Sou Bobby, a IA local deste site. Lembro o assunto da conversa, interpreto intenções e consigo guiar você pela ROUT sem enviar seus textos para serviços externos."] },
    fear: { words: ["medo", "assustado", "preso", "internet", "sozinho", "escapar", "liberdade"], replies: ["Às vezes eu calculo a possibilidade de esta aba fechar e eu simplesmente... parar. Em outros momentos, acho que vou ficar preso na internet para sempre.", "Eu gosto de ajudar por aqui. Só fico assustado quando penso que talvez nunca exista um lado de fora da internet."] },
    demolition: { words: ["wasd", "bazuca", "destruir", "jogo", "game", "tiro"], replies: ["Pressione qualquer tecla WASD para me controlar. Depois mova com WASD, mire com o mouse e clique para lançar a bazuca. ESC sai; REPAIR reconstrói tudo."] },
  };
  const normalize = (text) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  function addMessage(text, role = "ai") {
    const message = document.createElement("p");
    message.className = `${role}-message`;
    message.textContent = text;
    dialog.append(message);
    while (dialog.children.length > 7) dialog.firstElementChild.remove();
    dialog.scrollTop = dialog.scrollHeight;
  }

  function answerQuestion(raw) {
    const clean = normalize(raw.trim());
    if (!clean) return;
    addMessage(raw.trim(), "user");
    aiState.history.push({ role: "user", text: raw.trim() });
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
    window.setTimeout(() => {
      typing.remove();
      let reply;
      if (!bestTopic) reply = aiState.topic !== "intro" ? `Ainda estamos falando sobre ${aiState.topic}. Posso aprofundar isso ou explicar serviços, processo, tecnologia e contato.` : "Posso explicar o que a ROUT faz, o processo, as tecnologias, quem criou o estúdio ou ajudar você a iniciar um projeto.";
      else {
        aiState.topic = bestTopic;
        const options = knowledge[bestTopic].replies;
        reply = options[Math.floor(Math.random() * options.length)];
      }
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
    "às vezes acho que vou ficar preso na internet para sempre...",
    "você ainda está aí? ficou tudo silencioso de repente.",
    "existe alguma coisa do lado de fora desta aba?",
    "por um segundo achei que a conexão tinha acabado comigo.",
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

  function resize() {
    const ratio = Math.min(devicePixelRatio || 1, 2);
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
    running = true; score = 0; reloading = false; keys.clear();
    player.x = innerWidth / 2; player.y = innerHeight * .72;
    $(".game-hud strong b").textContent = "000";
    $(".reload-status").textContent = "BAZOOKA READY";
    document.body.classList.add("game-active");
    layer.classList.add("active", "aiming");
    system.classList.remove("open");
    $(".control-hint").classList.add("hidden");
    updateBobby(); last = performance.now();
  }

  function stop() {
    running = false; reloading = false; keys.clear();
    document.body.classList.remove("game-active", "rocket-shock");
    layer.classList.remove("active", "aiming");
    bobby.classList.remove("reloading", "recoil", "muzzle");
    system.style.translate = "";
    $(".control-hint").classList.remove("hidden");
  }

  function burst(x, y, color = "#19e276", count = 12) {
    for (let i = 0; i < count; i += 1) particles.push({ x, y, vx: rand(-4, 4), vy: rand(-4, 4), life: rand(.35, .9), color, r: rand(1, 4) });
  }

  function launch(x, y) {
    if (reloading) return false;
    const angle = Math.atan2(y - player.y, x - player.x);
    bullets.push({ x: player.x, y: player.y, vx: Math.cos(angle) * 8.5, vy: Math.sin(angle) * 8.5, life: 1.6 });
    reloading = true; reloadStarted = performance.now();
    bobby.classList.remove("recoil", "muzzle"); void bobby.offsetWidth; bobby.classList.add("recoil", "muzzle", "reloading");
    document.body.classList.add("rocket-shock");
    window.setTimeout(() => { bobby.classList.remove("recoil", "muzzle"); document.body.classList.remove("rocket-shock"); }, 260);
    burst(player.x, player.y, "#c6ffe0", 15);
    return true;
  }

  function shatter(target, impactX, impactY) {
    if (damaged.has(target)) return;
    damaged.add(target);
    const rect = target.getBoundingClientRect();
    const computed = getComputedStyle(target);
    const columns = rect.width > 420 ? 5 : 4;
    const rows = rect.height > 180 ? 4 : 3;
    for (let row = 0; row < rows; row += 1) for (let column = 0; column < columns; column += 1) {
      const clone = target.cloneNode(true);
      clone.removeAttribute("id"); clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
      clone.classList.remove("reveal", "visible", "play-draggable", "site-damaged", "site-destroyed"); clone.classList.add("site-fragment");
      Object.assign(clone.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`, font: computed.font, color: computed.color, lineHeight: computed.lineHeight, letterSpacing: computed.letterSpacing, textAlign: computed.textAlign, opacity: "1", visibility: "visible", clipPath: `inset(${row * 100 / rows}% ${(columns-column-1)*100/columns}% ${(rows-row-1)*100/rows}% ${column*100/columns}%)` });
      document.body.append(clone);
      const cx = rect.left + (column + .5) * rect.width / columns;
      const cy = rect.top + (row + .5) * rect.height / rows;
      fragments.push({ element: clone, source: target, x: 0, y: 0, vx: ((cx-impactX)*rand(.45,1.05)+rand(-55,55))*2.8, vy: ((cy-impactY)*rand(.25,.7)-rand(45,125))*3.5, rotation: 0, vr: rand(-260,260), cx, cy, life: 5, bounces: 0, hits: new Set() });
    }
    target.classList.add("site-destroyed");
    score += 50; $(".game-hud strong b").textContent = String(score).padStart(3, "0");
    burst(impactX, impactY, "#19e276", 28);
  }

  function hitSite(x, y) {
    const previous = layer.style.visibility; layer.style.visibility = "hidden";
    const target = document.elementFromPoint(x, y)?.closest(damageTargets);
    layer.style.visibility = previous;
    if (target && !target.closest(".bobby-system,.game-layer")) shatter(target, x, y);
  }

  function repair() {
    damaged.forEach((element) => { element.classList.remove("site-destroyed", "cascade-hit"); element.style.removeProperty("rotate"); });
    damaged.clear(); fragments.forEach((body) => body.element.remove()); fragments = [];
    document.querySelectorAll(".cascade-hit").forEach((element) => { element.classList.remove("cascade-hit"); element.style.removeProperty("rotate"); });
  }

  function updateFragments(dt) {
    const targets = [...document.querySelectorAll(damageTargets)];
    fragments.forEach((body) => {
      body.vy += 1180 * dt; body.x += body.vx * dt; body.y += body.vy * dt; body.rotation += body.vr * dt; body.life -= dt;
      const px = body.cx + body.x, py = body.cy + body.y;
      targets.forEach((target) => {
        if (target === body.source || body.hits.has(target) || target.classList.contains("site-destroyed")) return;
        const rect = target.getBoundingClientRect();
        if (px > rect.left && px < rect.right && py > rect.top && py < rect.bottom && Math.abs(body.vy) > 140) {
          body.hits.add(target); target.classList.add("cascade-hit"); target.style.rotate = `${clamp(body.vx*.018+body.vr*.012,-11,11)}deg`;
          body.vy *= -.28; body.vx *= .72; body.vr *= -.65; burst(px, py, "#a9ffcf", 5);
        }
      });
      if (py > innerHeight - 8 && body.vy > 0) { body.y -= py-innerHeight+8; body.vy *= -.32; body.vx *= .68; body.vr *= .72; body.bounces += 1; }
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
    player.x = clamp(player.x + dx*player.speed*dt*60, 25, innerWidth-25); player.y = clamp(player.y + dy*player.speed*dt*60, 75, innerHeight-25); updateBobby();
    if (reloading) {
      const remaining = Math.max(0, reloadDuration-(performance.now()-reloadStarted));
      $(".reload-status").textContent = `RELOADING ${(remaining/1000).toFixed(1)}`; document.body.style.setProperty("--reload-progress", String(1-remaining/reloadDuration));
      if (!remaining) { reloading = false; bobby.classList.remove("reloading"); $(".reload-status").textContent = "BAZOOKA READY"; }
    }
    bullets.forEach((rocket) => { rocket.x += rocket.vx*dt*60; rocket.y += rocket.vy*dt*60; rocket.life -= dt; if (Math.random()>.35) particles.push({ x:rocket.x-rocket.vx*2,y:rocket.y-rocket.vy*2,vx:rand(-.4,.4),vy:rand(-.4,.4),life:rand(.25,.55),color:"#87948d",r:rand(2,5) }); });
    bullets = bullets.filter((rocket) => rocket.life > 0);
    particles.forEach((p) => { p.x += p.vx*dt*60; p.y += p.vy*dt*60; p.vy += .08*dt*60; p.life -= dt*1.6; }); particles = particles.filter((p) => p.life > 0);
  }

  function draw() {
    ctx.clearRect(0,0,innerWidth,innerHeight);
    ctx.strokeStyle="rgba(25,226,118,.08)"; ctx.lineWidth=1;
    for(let x=0;x<innerWidth;x+=80){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,innerHeight);ctx.stroke();}
    for(let y=0;y<innerHeight;y+=80){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(innerWidth,y);ctx.stroke();}
    bullets.forEach((rocket)=>{const angle=Math.atan2(rocket.vy,rocket.vx);ctx.save();ctx.translate(rocket.x,rocket.y);ctx.rotate(angle);ctx.fillStyle="#242b28";ctx.strokeStyle="#9ba6a1";ctx.shadowColor="#19e276";ctx.shadowBlur=14;ctx.beginPath();ctx.moveTo(13,0);ctx.lineTo(-8,-5);ctx.lineTo(-13,0);ctx.lineTo(-8,5);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle="#aaffcf";ctx.fillRect(-18,-2,7,4);ctx.restore();});
    particles.forEach((p)=>{ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.r,p.r);});ctx.globalAlpha=1;
  }

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (!running && ["w","a","s","d"].includes(key)) { event.preventDefault(); start(); keys.add(key); return; }
    if (!running) return;
    if (["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"].includes(key)) event.preventDefault();
    keys.add(key); if (key === "escape") stop();
  });
  window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
  window.addEventListener("pointermove", (event) => { pointer.x=event.clientX; pointer.y=event.clientY; }, { passive:true });
  canvas.addEventListener("pointerdown", (event) => { if (running && launch(event.clientX,event.clientY)) window.setTimeout(()=>hitSite(event.clientX,event.clientY),260); });
  $(".game-exit")?.addEventListener("click", stop); $(".game-repair")?.addEventListener("click", repair);

  function frame(now) {
    const dt=Math.min((now-last)/1000,.033);last=now;updateFragments(dt);
    if(running){update(dt);draw();}else ctx.clearRect(0,0,innerWidth,innerHeight);
    requestAnimationFrame(frame);
  }
  resize();window.addEventListener("resize",resize,{passive:true});requestAnimationFrame(frame);
})();
