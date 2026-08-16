(() => {
  const system = document.querySelector(".bobby-system");
  const bobby = document.querySelector(".bobby");
  const panel = document.querySelector(".bobby-panel");
  const dialog = document.querySelector(".bobby-dialog p");
  const form = document.querySelector(".bobby-form");
  const input = document.querySelector("#bobby-input");
  const layer = document.querySelector(".game-layer");
  const canvas = document.querySelector("#game-canvas");
  const ctx = canvas?.getContext("2d");
  if (!system || !bobby || !layer || !ctx) return;

  const clamp = (n, a, z) => Math.max(a, Math.min(z, n));
  const rand = (a, z) => Math.random() * (z - a) + a;
  const gameNames = {
    demolition: "DEMOLITION", hunt: "NODE HUNT", target: "TARGET RUSH",
    dodge: "METEOR DODGE", race: "ROUTE RACE", catch: "GRAVITY CATCH",
    glitch: "GLITCH CLEAN", memory: "SIGNAL MEMORY", laser: "LASER GRID",
    orbit: "ORBIT DEFENSE",
  };
  const gameHelp = {
    demolition: ["WASD + CLICK", "Move Bobby. Aim and destroy the interface."],
    hunt: ["WASD", "Collect 12 green route nodes."],
    target: ["CLICK / TAP", "Hit every target before the signal expires."],
    dodge: ["WASD", "Dodge corrupted data falling from above."],
    race: ["WASD", "Cross every checkpoint in the right order."],
    catch: ["WASD", "Catch green code. Avoid red corruption."],
    glitch: ["CLICK / TAP", "Clean unstable glitches before they spread."],
    memory: ["CLICK / TAP", "Repeat the signal sequence."],
    laser: ["WASD", "Survive inside the scanning laser grid."],
    orbit: ["CLICK / TAP", "Destroy threats before they reach the ROUT core."],
  };
  const keys = new Set();
  const pointer = { x: innerWidth / 2, y: innerHeight / 2 };
  const player = { x: innerWidth - 60, y: innerHeight - 60, radius: 24, speed: 5.2 };
  let ratio = 1;
  let active = "";
  let running = false;
  let score = 0;
  let timeLeft = 0;
  let last = performance.now();
  let spawnClock = 0;
  let entities = [];
  let particles = [];
  let bullets = [];
  let routeIndex = 0;
  let memorySequence = [];
  let memoryInput = 0;
  let memoryReveal = 0;
  let damage = new Map();
  let gameFrame = 0;

  function speak(text, action) {
    dialog.classList.add("thinking");
    dialog.textContent = "Calculando";
    window.setTimeout(() => {
      dialog.classList.remove("thinking");
      dialog.textContent = text;
      if (action) action();
    }, 330);
  }

  function ask(raw) {
    const q = raw.toLowerCase().trim();
    if (!q) return;
    if (/arcade|jogo|game|jogar|diversão/.test(q)) {
      speak("Os jogos estão espalhados pelas seções. Continue descendo e procure os pequenos portais GAME; cada área guarda uma mecânica diferente.");
    } else if (/serviço|fazem|site|landing|app|design|ia/.test(q)) {
      speak("Criamos web design, sites, landing pages, aplicações web e soluções com IA. Posso te levar até essa parte.", () => document.querySelector("#services")?.scrollIntoView({ behavior: "smooth" }));
    } else if (/contato|projeto|email|orçamento|preço|contratar/.test(q)) {
      speak("A rota mais direta é theroutstudios@gmail.com. Vou abrir a área de contato para você.", () => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" }));
    } else if (/fundador|redzzz|toutcz|quem/.test(q)) {
      speak("A ROUT STUDIOS foi criada por Redzzz e Toutcz: um estúdio pequeno, técnico e obcecado por design.", () => document.querySelector("#about")?.scrollIntoView({ behavior: "smooth" }));
    } else if (/bobby|você|seu nome/.test(q)) {
      speak("Eu sou Bobby, a entidade interativa da ROUT. Guia, copiloto e, quando necessário, agente do caos.");
    } else if (/olá|oi|hello|eai|salve/.test(q)) {
      speak("Oi! Quer conhecer a ROUT, iniciar um projeto ou encontrar algum dos jogos escondidos pelo site?");
    } else {
      speak("Ainda estou aprendendo essa rota. Posso explicar os serviços, apresentar a ROUT, abrir o contato ou iniciar um dos 10 jogos.");
    }
  }

  bobby.addEventListener("click", (event) => {
    if (running) return;
    event.stopPropagation();
    const open = system.classList.toggle("open");
    bobby.setAttribute("aria-expanded", String(open));
  });
  document.querySelector(".bobby-close")?.addEventListener("click", () => system.classList.remove("open"));
  document.querySelectorAll("[data-ask]").forEach((button) => button.addEventListener("click", () => ask(button.dataset.ask)));
  form?.addEventListener("submit", (event) => { event.preventDefault(); ask(input.value); input.value = ""; });
  document.querySelectorAll("[data-game]").forEach((button) => button.addEventListener("click", () => startGame(button.dataset.game)));

  function resize() {
    ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = innerWidth * ratio;
    canvas.height = innerHeight * ratio;
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    player.x = clamp(player.x, 30, innerWidth - 30);
    player.y = clamp(player.y, 85, innerHeight - 30);
  }

  function setScore(value) {
    score = Math.max(0, value);
    document.querySelector(".game-hud strong b").textContent = String(score).padStart(3, "0");
  }

  function positionBobby() {
    const baseX = innerWidth - (innerWidth < 800 ? 45 : 61);
    const baseY = innerHeight - (innerWidth < 800 ? 45 : 60);
    system.style.translate = `${player.x - baseX}px ${player.y - baseY}px`;
    const angle = Math.atan2(pointer.y - player.y, pointer.x - player.x) * 180 / Math.PI;
    document.body.style.setProperty("--gun-angle", `${angle}deg`);
  }

  function setupEntities(mode) {
    entities = []; particles = []; bullets = []; spawnClock = 0; routeIndex = 0;
    if (mode === "hunt") for (let i = 0; i < 12; i += 1) entities.push({ type: "node", x: rand(45, innerWidth - 45), y: rand(100, innerHeight - 55), r: 8, phase: rand(0, 6) });
    if (mode === "target") for (let i = 0; i < 5; i += 1) spawnTarget();
    if (mode === "race") for (let i = 0; i < 8; i += 1) entities.push({ type: "checkpoint", x: 70 + i * (innerWidth - 140) / 7, y: i % 2 ? innerHeight * .28 : innerHeight * .72, r: 22, index: i });
    if (mode === "memory") newMemoryRound();
    if (mode === "orbit") for (let i = 0; i < 5; i += 1) spawnThreat();
    if (mode === "laser") for (let i = 0; i < 4; i += 1) entities.push({ type: "laser", axis: i % 2, p: rand(100, i % 2 ? innerHeight : innerWidth), v: rand(1, 2.2) * (i < 2 ? 1 : -1), width: 6 });
  }

  function startGame(mode) {
    active = mode; running = true; setScore(0); timeLeft = mode === "demolition" ? 90 : mode === "memory" ? 60 : 45;
    player.x = innerWidth / 2; player.y = innerHeight * .75;
    document.body.classList.add("game-active");
    layer.classList.add("active");
    layer.classList.toggle("aiming", ["demolition", "target", "glitch", "orbit", "memory"].includes(mode));
    system.classList.remove("open");
    document.querySelector(".game-name").textContent = gameNames[mode];
    const help = gameHelp[mode];
    document.querySelector(".game-instructions strong").textContent = help[0];
    document.querySelector(".game-instructions span").textContent = help[1];
    setupEntities(mode); resize(); positionBobby(); last = performance.now();
  }

  function stopGame(message = "Arcade encerrado. O site voltou à rota normal.") {
    running = false; active = ""; keys.clear();
    document.body.classList.remove("game-active");
    layer.classList.remove("active", "aiming");
    system.style.translate = "";
    system.classList.add("open");
    speak(message);
  }

  function repairSite() {
    damage.forEach((_, element) => {
      element.classList.remove("site-damaged", "site-destroyed");
      element.style.removeProperty("--damage-opacity");
    });
    damage.clear();
    document.querySelectorAll(".impact-mark").forEach((mark) => mark.remove());
  }

  document.querySelector(".game-exit")?.addEventListener("click", () => stopGame());
  document.querySelector(".game-repair")?.addEventListener("click", repairSite);

  function burst(x, y, color = "#19e276", count = 10) {
    for (let i = 0; i < count; i += 1) particles.push({ x, y, vx: rand(-4, 4), vy: rand(-4, 4), life: rand(.45, 1), color, r: rand(1, 3) });
  }
  function spawnTarget() { entities.push({ type: "target", x: rand(45, innerWidth - 45), y: rand(100, innerHeight - 55), r: rand(14, 27), life: rand(2.2, 4.5), pulse: 0 }); }
  function spawnThreat() { const angle = rand(0, Math.PI * 2); const dist = Math.max(innerWidth, innerHeight) * .62; entities.push({ type: "threat", x: innerWidth / 2 + Math.cos(angle) * dist, y: innerHeight / 2 + Math.sin(angle) * dist, r: rand(9, 16), speed: rand(.45, 1.05) }); }
  function newMemoryRound() {
    memorySequence.push(Math.floor(Math.random() * 4)); memoryInput = 0; memoryReveal = memorySequence.length * .62 + .5;
    entities = Array.from({ length: 4 }, (_, i) => ({ type: "pad", x: innerWidth / 2 + (i % 2 ? 75 : -75), y: innerHeight / 2 + (i > 1 ? 75 : -75), r: 48, index: i }));
  }

  function shoot(x, y) {
    const angle = Math.atan2(y - player.y, x - player.x);
    bullets.push({ x: player.x, y: player.y, vx: Math.cos(angle) * 15, vy: Math.sin(angle) * 15, life: 1.2 });
    burst(player.x, player.y, "#baffd9", 4);
  }

  function damageSite(x, y) {
    const hiddenLayer = layer.style.visibility;
    layer.style.visibility = "hidden";
    const target = document.elementFromPoint(x, y)?.closest("article,.service,.step,.section-head,.services-intro,.process-title,.about-copy>p,.founders>span,.email-panel,footer>p,h1,h2");
    layer.style.visibility = hiddenLayer;
    if (!target || target.closest(".bobby-system,.game-layer")) return;
    const hits = (damage.get(target) || 0) + 1;
    damage.set(target, hits);
    target.classList.add("site-damaged");
    target.style.setProperty("--damage-opacity", String(Math.max(.12, 1 - hits * .2)));
    if (hits >= 5) { target.classList.add("site-destroyed"); setScore(score + 50); }
    else setScore(score + 10);
    const mark = document.createElement("i"); mark.className = "impact-mark"; mark.style.left = `${x - 14}px`; mark.style.top = `${y - 14}px`; document.body.append(mark);
    mark.addEventListener("animationend", () => mark.remove(), { once: true });
    burst(x, y, "#19e276", 16);
  }

  function pointerHit(x, y) {
    if (active === "demolition") { shoot(x, y); window.setTimeout(() => damageSite(x, y), 160); return; }
    const hit = entities.find((entity) => Math.hypot(entity.x - x, entity.y - y) < entity.r + 10);
    if (!hit) return;
    if (active === "target" && hit.type === "target") { setScore(score + 25); burst(hit.x, hit.y); entities.splice(entities.indexOf(hit), 1); spawnTarget(); }
    if (active === "glitch" && hit.type === "glitch") { setScore(score + 20); burst(hit.x, hit.y); entities.splice(entities.indexOf(hit), 1); }
    if (active === "orbit" && hit.type === "threat") { shoot(x, y); hit.r -= 6; if (hit.r < 5) { setScore(score + 30); burst(hit.x, hit.y); entities.splice(entities.indexOf(hit), 1); spawnThreat(); } }
    if (active === "memory" && hit.type === "pad" && memoryReveal <= 0) {
      if (hit.index === memorySequence[memoryInput]) {
        memoryInput += 1; burst(hit.x, hit.y, "#aaffcf", 7);
        if (memoryInput === memorySequence.length) { setScore(score + memorySequence.length * 15); window.setTimeout(newMemoryRound, 500); }
      } else { memorySequence = []; setScore(score - 20); newMemoryRound(); }
    }
  }

  window.addEventListener("keydown", (event) => {
    if (!running) return;
    if (["w", "a", "s", "d", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault();
    keys.add(event.key.toLowerCase());
    if (event.key === "Escape") stopGame();
  });
  window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
  window.addEventListener("pointermove", (event) => { pointer.x = event.clientX; pointer.y = event.clientY; document.querySelector(".game-crosshair").style.left = `${pointer.x}px`; document.querySelector(".game-crosshair").style.top = `${pointer.y}px`; });
  canvas.addEventListener("pointerdown", (event) => { if (running) pointerHit(event.clientX, event.clientY); });

  function movePlayer(dt) {
    const factor = dt * 60;
    let dx = 0, dy = 0;
    if (keys.has("a") || keys.has("arrowleft")) dx -= 1;
    if (keys.has("d") || keys.has("arrowright")) dx += 1;
    if (keys.has("w") || keys.has("arrowup")) dy -= 1;
    if (keys.has("s") || keys.has("arrowdown")) dy += 1;
    if (dx && dy) { dx *= .707; dy *= .707; }
    player.x = clamp(player.x + dx * player.speed * factor, player.radius, innerWidth - player.radius);
    player.y = clamp(player.y + dy * player.speed * factor, 82, innerHeight - player.radius);
    positionBobby();
  }

  function updateGame(dt) {
    movePlayer(dt); timeLeft -= dt; spawnClock += dt; gameFrame += dt;
    if (timeLeft <= 0) { stopGame(`Fim do protocolo. Score final: ${score}. Quer tentar outra rota?`); return; }
    document.querySelector(".game-time").textContent = timeLeft.toFixed(1);
    if (active === "hunt") entities.forEach((e) => { e.phase += dt * 2; if (Math.hypot(e.x - player.x, e.y - player.y) < e.r + player.radius) { setScore(score + 20); burst(e.x, e.y); entities.splice(entities.indexOf(e), 1); } });
    if (active === "hunt" && !entities.length) stopGame(`Todos os nós encontrados. Score: ${score}. Rota perfeita.`);
    if (active === "dodge" && spawnClock > .55) { spawnClock = 0; entities.push({ type: "meteor", x: rand(20, innerWidth - 20), y: 70, r: rand(10, 26), vy: rand(3, 7), spin: 0 }); }
    if (active === "catch" && spawnClock > .48) { spawnClock = 0; entities.push({ type: Math.random() > .28 ? "code" : "corrupt", x: rand(20, innerWidth - 20), y: 70, r: 10, vy: rand(2.5, 5.5) }); }
    if (active === "glitch" && spawnClock > .7) { spawnClock = 0; entities.push({ type: "glitch", x: rand(30, innerWidth - 30), y: rand(100, innerHeight - 35), r: rand(13, 25), life: 2.2 }); }
    if (active === "orbit" && spawnClock > 1.5) { spawnClock = 0; spawnThreat(); }
    if (active === "memory") memoryReveal = Math.max(0, memoryReveal - dt);

    entities.slice().forEach((e) => {
      if (e.type === "target" || e.type === "glitch") { e.life -= dt; e.pulse = (e.pulse || 0) + dt * 4; if (e.life < 0) { entities.splice(entities.indexOf(e), 1); if (e.type === "target") spawnTarget(); else setScore(score - 5); } }
      if (["meteor", "code", "corrupt"].includes(e.type)) {
        e.y += e.vy * dt * 60; e.spin = (e.spin || 0) + dt;
        if (Math.hypot(e.x - player.x, e.y - player.y) < e.r + player.radius) { if (e.type === "code") setScore(score + 15); else { setScore(score - 15); burst(player.x, player.y, "#ff455e", 14); } entities.splice(entities.indexOf(e), 1); }
        else if (e.y > innerHeight + 30) entities.splice(entities.indexOf(e), 1);
      }
      if (e.type === "checkpoint" && e.index === routeIndex && Math.hypot(e.x - player.x, e.y - player.y) < e.r + player.radius) { routeIndex += 1; setScore(score + 30); burst(e.x, e.y); if (routeIndex === entities.length) stopGame(`Route Race concluída. ${score} pontos e nenhum desvio.`); }
      if (e.type === "laser") { e.p += e.v * dt * 60; const max = e.axis ? innerHeight : innerWidth; if (e.p < 80 || e.p > max) e.v *= -1; const distance = e.axis ? Math.abs(player.y - e.p) : Math.abs(player.x - e.p); if (distance < player.radius + e.width && Math.sin(gameFrame * 5 + e.p) > .92) { setScore(score - 2); burst(player.x, player.y, "#ff455e", 3); } }
      if (e.type === "threat") { const angle = Math.atan2(innerHeight / 2 - e.y, innerWidth / 2 - e.x); e.x += Math.cos(angle) * e.speed * dt * 60; e.y += Math.sin(angle) * e.speed * dt * 60; if (Math.hypot(e.x - innerWidth / 2, e.y - innerHeight / 2) < 34) { setScore(score - 25); burst(e.x, e.y, "#ff455e", 18); entities.splice(entities.indexOf(e), 1); spawnThreat(); } }
    });
    bullets.forEach((b) => { b.x += b.vx * dt * 60; b.y += b.vy * dt * 60; b.life -= dt; }); bullets = bullets.filter((b) => b.life > 0);
    particles.forEach((p) => { p.x += p.vx * dt * 60; p.y += p.vy * dt * 60; p.vy += .08 * dt * 60; p.life -= dt * 1.6; }); particles = particles.filter((p) => p.life > 0);
  }

  function draw() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.save(); ctx.strokeStyle = "rgba(25,226,118,.08)"; ctx.lineWidth = 1;
    for (let x = 0; x < innerWidth; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, innerHeight); ctx.stroke(); }
    for (let y = 0; y < innerHeight; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(innerWidth, y); ctx.stroke(); } ctx.restore();
    if (active === "orbit") { ctx.beginPath(); ctx.arc(innerWidth / 2, innerHeight / 2, 31, 0, Math.PI * 2); ctx.fillStyle = "rgba(25,226,118,.22)"; ctx.fill(); ctx.strokeStyle = "#19e276"; ctx.stroke(); }
    entities.forEach((e) => {
      ctx.save();
      if (e.type === "node") { ctx.translate(e.x, e.y + Math.sin(e.phase) * 5); ctx.rotate(Math.PI / 4); ctx.fillStyle = "#19e276"; ctx.shadowColor = "#19e276"; ctx.shadowBlur = 18; ctx.fillRect(-e.r, -e.r, e.r * 2, e.r * 2); }
      if (e.type === "target") { ctx.beginPath(); ctx.arc(e.x, e.y, e.r + Math.sin(e.pulse) * 3, 0, Math.PI * 2); ctx.strokeStyle = "#19e276"; ctx.lineWidth = 2; ctx.stroke(); ctx.beginPath(); ctx.arc(e.x, e.y, e.r * .35, 0, Math.PI * 2); ctx.fillStyle = "#19e276"; ctx.fill(); }
      if (e.type === "meteor") { ctx.translate(e.x, e.y); ctx.rotate(e.spin * 3); ctx.fillStyle = "#ff455e"; ctx.shadowColor = "#ff455e"; ctx.shadowBlur = 16; ctx.fillRect(-e.r, -e.r, e.r * 2, e.r * 2); }
      if (e.type === "code" || e.type === "corrupt") { ctx.font = "700 13px monospace"; ctx.textAlign = "center"; ctx.fillStyle = e.type === "code" ? "#19e276" : "#ff455e"; ctx.fillText(e.type === "code" ? "</>" : "ERR", e.x, e.y); }
      if (e.type === "checkpoint") { ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.strokeStyle = e.index < routeIndex ? "#19e276" : e.index === routeIndex ? "#d9ffe9" : "rgba(25,226,118,.2)"; ctx.lineWidth = e.index === routeIndex ? 3 : 1; ctx.stroke(); ctx.fillStyle = ctx.strokeStyle; ctx.font = "9px monospace"; ctx.textAlign = "center"; ctx.fillText(String(e.index + 1).padStart(2, "0"), e.x, e.y + 3); }
      if (e.type === "glitch") { ctx.translate(e.x, e.y); ctx.strokeStyle = "#ff455e"; ctx.shadowColor = "#ff455e"; ctx.shadowBlur = 12; for (let i = 0; i < 4; i += 1) { ctx.strokeRect(rand(-e.r, 0), rand(-e.r, 0), rand(e.r, e.r * 2), rand(3, 9)); } }
      if (e.type === "pad") { const revealIndex = memorySequence[Math.floor((memorySequence.length * .62 + .5 - memoryReveal) / .62)]; const lit = memoryReveal > 0 && revealIndex === e.index; ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fillStyle = lit ? "#b4ffd5" : ["#087a40", "#0a5d35", "#106c40", "#06492a"][e.index]; ctx.shadowColor = "#19e276"; ctx.shadowBlur = lit ? 35 : 0; ctx.fill(); ctx.strokeStyle = "rgba(180,255,215,.5)"; ctx.stroke(); }
      if (e.type === "laser") { ctx.beginPath(); if (e.axis) { ctx.moveTo(0, e.p); ctx.lineTo(innerWidth, e.p); } else { ctx.moveTo(e.p, 0); ctx.lineTo(e.p, innerHeight); } ctx.strokeStyle = "rgba(255,55,82,.7)"; ctx.shadowColor = "#ff455e"; ctx.shadowBlur = 14; ctx.lineWidth = e.width; ctx.stroke(); }
      if (e.type === "threat") { ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fillStyle = "#ff455e"; ctx.shadowColor = "#ff455e"; ctx.shadowBlur = 16; ctx.fill(); }
      ctx.restore();
    });
    bullets.forEach((b) => { ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 2, b.y - b.vy * 2); ctx.strokeStyle = "#baffd9"; ctx.shadowColor = "#19e276"; ctx.shadowBlur = 12; ctx.lineWidth = 2; ctx.stroke(); });
    particles.forEach((p) => { ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.r, p.r); }); ctx.globalAlpha = 1;
  }

  function loop(now) {
    const dt = Math.min((now - last) / 1000, .033); last = now;
    if (running) { updateGame(dt); draw(); }
    else ctx.clearRect(0, 0, innerWidth, innerHeight);
    requestAnimationFrame(loop);
  }
  resize(); window.addEventListener("resize", resize, { passive: true }); requestAnimationFrame(loop);
})();
