const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function makeSpring(value = 0, stiffness = 0.12, damping = 0.78) {
  return { value, target: value, velocity: 0, stiffness, damping };
}

function updateSpring(state) {
  state.velocity += (state.target - state.value) * state.stiffness;
  state.velocity *= state.damping;
  state.value += state.velocity;
  return state.value;
}

const pointer = {
  x: makeSpring(innerWidth / 2, 0.16, 0.72),
  y: makeSpring(innerHeight / 2, 0.16, 0.72),
  rawX: innerWidth / 2,
  rawY: innerHeight / 2,
  speed: 0,
};
const scrollSpring = makeSpring(0, 0.1, 0.78);
let lastPointerX = pointer.rawX;
let lastPointerY = pointer.rawY;

window.addEventListener("pointermove", (event) => {
  pointer.rawX = event.clientX;
  pointer.rawY = event.clientY;
  pointer.x.target = event.clientX;
  pointer.y.target = event.clientY;
  pointer.speed = Math.hypot(event.clientX - lastPointerX, event.clientY - lastPointerY);
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
}, { passive: true });

const intro = document.querySelector(".intro");
const cutsceneCanvas = document.querySelector("#cutscene-canvas");
const cutsceneContext = cutsceneCanvas?.getContext("2d");
const cutsceneStart = performance.now();
let cutsceneRunning = !reducedMotion;

function finishCutscene() {
  if (!cutsceneRunning) return;
  cutsceneRunning = false;
  intro?.classList.add("done");
  document.body.classList.remove("cutscene-playing");
}

if (reducedMotion) {
  intro?.remove();
} else {
  document.body.classList.add("cutscene-playing");
  window.setTimeout(finishCutscene, 5200);
  document.querySelector(".intro-skip")?.addEventListener("click", finishCutscene);
}

function resizeCutscene() {
  if (!cutsceneCanvas) return;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  cutsceneCanvas.width = innerWidth * ratio;
  cutsceneCanvas.height = innerHeight * ratio;
  cutsceneContext.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function drawCutscene(time) {
  if (!cutsceneContext || !cutsceneRunning) return;
  const elapsed = time - cutsceneStart;
  const progress = clamp(elapsed / 5000, 0, 1);
  cutsceneContext.clearRect(0, 0, innerWidth, innerHeight);
  const startX = -40;
  const endX = innerWidth + 40;
  const centerY = innerHeight * 0.53;
  const pathProgress = clamp((progress - 0.08) / 0.72, 0, 1);
  cutsceneContext.beginPath();
  cutsceneContext.moveTo(startX, centerY + 90);
  cutsceneContext.bezierCurveTo(innerWidth * .22, centerY - 150, innerWidth * .37, centerY + 130, innerWidth * .53, centerY - 30);
  cutsceneContext.bezierCurveTo(innerWidth * .67, centerY - 170, innerWidth * .8, centerY + 100, endX, centerY - 75);
  cutsceneContext.strokeStyle = "rgba(25,226,118,.13)";
  cutsceneContext.lineWidth = 1;
  cutsceneContext.stroke();
  cutsceneContext.save();
  cutsceneContext.beginPath();
  cutsceneContext.rect(0, 0, innerWidth * pathProgress, innerHeight);
  cutsceneContext.clip();
  cutsceneContext.beginPath();
  cutsceneContext.moveTo(startX, centerY + 90);
  cutsceneContext.bezierCurveTo(innerWidth * .22, centerY - 150, innerWidth * .37, centerY + 130, innerWidth * .53, centerY - 30);
  cutsceneContext.bezierCurveTo(innerWidth * .67, centerY - 170, innerWidth * .8, centerY + 100, endX, centerY - 75);
  cutsceneContext.strokeStyle = "rgba(38,238,132,.9)";
  cutsceneContext.shadowColor = "rgba(25,226,118,.85)";
  cutsceneContext.shadowBlur = 18;
  cutsceneContext.lineWidth = 1.4;
  cutsceneContext.stroke();
  cutsceneContext.restore();
  cutsceneContext.shadowBlur = 0;
  for (let index = 0; index < 24; index += 1) {
    const seed = index * 93.17;
    const x = (seed * 17.3 + elapsed * (0.014 + index % 3 * .003)) % (innerWidth + 120) - 60;
    const y = (Math.sin(seed) * .38 + .5) * innerHeight;
    const alpha = .05 + (index % 5) * .018;
    cutsceneContext.beginPath();
    cutsceneContext.fillStyle = `rgba(69,244,150,${alpha})`;
    cutsceneContext.arc(x, y, index % 4 === 0 ? 1.5 : .7, 0, Math.PI * 2);
    cutsceneContext.fill();
  }
}

const menuButton = document.querySelector(".menu");
const mobileNav = document.querySelector(".mobile-nav");
menuButton?.addEventListener("click", () => {
  const open = mobileNav?.classList.toggle("open") ?? false;
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.querySelector("span").textContent = open ? "Close" : "Menu";
});
mobileNav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
  mobileNav.classList.remove("open");
  menuButton?.setAttribute("aria-expanded", "false");
  const label = menuButton?.querySelector("span");
  if (label) label.textContent = "Menu";
}));

const copyButton = document.querySelector(".copy-email");
copyButton?.addEventListener("click", async () => {
  const email = copyButton.dataset.email;
  if (!email) return;
  try {
    await navigator.clipboard.writeText(email);
    copyButton.querySelector("span").textContent = "Email copied";
    window.setTimeout(() => { copyButton.querySelector("span").textContent = "Copy email"; }, 1800);
  } catch {
    window.location.href = `mailto:${email}`;
  }
});

const revealStates = new Map();
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const state = revealStates.get(entry.target);
    if (state) {
      state.opacity.target = 1;
      state.y.target = 0;
    }
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((element) => {
  const state = { element, opacity: makeSpring(reducedMotion ? 1 : 0, 0.09, 0.8), y: makeSpring(reducedMotion ? 0 : 48, 0.08, 0.8) };
  revealStates.set(element, state);
  revealObserver.observe(element);
});

const cursor = document.querySelector(".cursor");
document.querySelectorAll("[data-cursor]").forEach((element) => {
  element.addEventListener("pointerenter", () => {
    cursor?.classList.add("active");
    if (cursor) cursor.querySelector("span").textContent = element.dataset.cursor;
  });
  element.addEventListener("pointerleave", () => cursor?.classList.remove("active"));
});

document.querySelectorAll(".magnetic").forEach((element) => {
  const x = makeSpring(0, 0.15, 0.7);
  const y = makeSpring(0, 0.15, 0.7);
  element._magnetic = { x, y };
  element.addEventListener("pointermove", (event) => {
    if (!finePointer) return;
    const rect = element.getBoundingClientRect();
    x.target = (event.clientX - rect.left - rect.width / 2) * 0.18;
    y.target = (event.clientY - rect.top - rect.height / 2) * 0.18;
  });
  element.addEventListener("pointerleave", () => { x.target = 0; y.target = 0; });
});

document.addEventListener("pointerdown", (event) => {
  if (!finePointer) return;
  const ripple = document.createElement("i");
  ripple.className = "click-ripple";
  ripple.style.left = `${event.clientX - 6}px`;
  ripple.style.top = `${event.clientY - 6}px`;
  document.body.append(ripple);
  ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
});

const heroCopy = document.querySelector(".hero-copy");
const routeSystem = document.querySelector(".route-system");
const serviceCards = [...document.querySelectorAll(".service")];
serviceCards.forEach((card) => {
  const rx = makeSpring(0, 0.1, 0.74);
  const ry = makeSpring(0, 0.1, 0.74);
  card._tilt = { rx, ry };
  card.addEventListener("pointermove", (event) => {
    if (!finePointer) return;
    const rect = card.getBoundingClientRect();
    rx.target = ((event.clientY - rect.top) / rect.height - 0.5) * -2.4;
    ry.target = ((event.clientX - rect.left) / rect.width - 0.5) * 2.4;
  });
  card.addEventListener("pointerleave", () => { rx.target = 0; ry.target = 0; });
});

const workArea = document.querySelector(".empty-work");
const workPreview = document.querySelector(".work-preview");
const workDrag = { x: makeSpring(0, 0.11, 0.72), y: makeSpring(0, 0.11, 0.72), active: false, startX: 0, origin: 0 };
workArea?.addEventListener("pointerdown", (event) => {
  if (event.target.closest("a")) return;
  workDrag.active = true;
  workDrag.startX = event.clientX;
  workDrag.origin = workDrag.x.target;
  workArea.classList.add("dragging");
  workArea.setPointerCapture(event.pointerId);
});
workArea?.addEventListener("pointermove", (event) => {
  const rect = workArea.getBoundingClientRect();
  if (workDrag.active) {
    workDrag.x.target = clamp(workDrag.origin + event.clientX - workDrag.startX, -55, 55);
  } else if (finePointer) {
    workDrag.x.target = ((event.clientX - rect.left) / rect.width - 0.5) * 22;
    workDrag.y.target = ((event.clientY - rect.top) / rect.height - 0.5) * 16;
  }
});
function releaseWork() {
  workDrag.active = false;
  workDrag.x.target = 0;
  workDrag.y.target = 0;
  workArea?.classList.remove("dragging");
}
workArea?.addEventListener("pointerup", releaseWork);
workArea?.addEventListener("pointercancel", releaseWork);
workArea?.addEventListener("pointerleave", () => { if (!workDrag.active) releaseWork(); });

const achievement = document.querySelector(".achievement");
let achievementTimer;
function showAchievement(label, text) {
  achievement.querySelector("small").textContent = label;
  achievement.querySelector("strong").textContent = text;
  achievement.classList.add("show");
  clearTimeout(achievementTimer);
  achievementTimer = window.setTimeout(() => achievement.classList.remove("show"), 3200);
}

let logoClicks = 0;
document.querySelector(".site-header .logo")?.addEventListener("click", (event) => {
  logoClicks += 1;
  if (logoClicks === 5) {
    event.preventDefault();
    showAchievement("SECRET ROUTE", "You found the studio frequency.");
    document.body.classList.add("frequency");
    window.setTimeout(() => document.body.classList.remove("frequency"), 2500);
    logoClicks = 0;
  }
});

const routeCanvas = document.querySelector("#route-canvas");
const routeContext = routeCanvas?.getContext("2d");
const routeNodes = [...document.querySelectorAll(".route-node")];
const visitedNodes = new Set();
routeNodes.forEach((node) => node.addEventListener("click", () => {
  visitedNodes.add(node.dataset.node);
  node.classList.add("visited");
  document.querySelector(".route-hint span").textContent = `${visitedNodes.size}/4`;
  if (visitedNodes.size === 4) showAchievement("ROUTE COMPLETE", "Idea connected to launch.");
}));

const lab = document.querySelector(".route-lab");
const labCanvas = document.querySelector("#lab-canvas");
const labContext = labCanvas?.getContext("2d");
const labModules = [...document.querySelectorAll(".lab-module")];
const labGoal = document.querySelector(".lab-goal");
const gravityToggle = document.querySelector("#gravity-toggle");
const labReset = document.querySelector(".lab-reset");
let labWidth = 0;
let labHeight = 0;
let gravityEnabled = false;
let labComplete = false;

const moduleStates = labModules.map((element) => ({
  element,
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  active: false,
  pointerId: null,
  lastX: 0,
  lastY: 0,
}));

function resizeLab() {
  if (!labCanvas || !lab) return;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  labWidth = lab.clientWidth;
  labHeight = lab.clientHeight;
  labCanvas.width = labWidth * ratio;
  labCanvas.height = labHeight * ratio;
  labContext.setTransform(ratio, 0, 0, ratio, 0, 0);
}

moduleStates.forEach((state) => {
  const { element } = state;
  element.addEventListener("pointerdown", (event) => {
    state.active = true;
    state.pointerId = event.pointerId;
    state.lastX = event.clientX;
    state.lastY = event.clientY;
    state.vx = 0;
    state.vy = 0;
    element.classList.add("dragging");
    element.setPointerCapture(event.pointerId);
  });
  element.addEventListener("pointermove", (event) => {
    if (!state.active || event.pointerId !== state.pointerId) return;
    const dx = event.clientX - state.lastX;
    const dy = event.clientY - state.lastY;
    state.x += dx;
    state.y += dy;
    state.vx = dx * 0.65;
    state.vy = dy * 0.65;
    state.lastX = event.clientX;
    state.lastY = event.clientY;
  });
  const release = (event) => {
    if (!state.active || event.pointerId !== state.pointerId) return;
    state.active = false;
    element.classList.remove("dragging");
  };
  element.addEventListener("pointerup", release);
  element.addEventListener("pointercancel", release);
});

gravityToggle?.addEventListener("change", () => {
  gravityEnabled = gravityToggle.checked;
  lab?.classList.toggle("gravity-on", gravityEnabled);
  document.querySelector(".lab-status span").textContent = gravityEnabled ? "GRAVITY ENABLED — THROW A MODULE" : "DRAG MODULES TO REROUTE";
});

labReset?.addEventListener("click", () => {
  moduleStates.forEach((state) => {
    state.vx += (0 - state.x) * 0.16;
    state.vy += (0 - state.y) * 0.16;
    state.x *= 0.25;
    state.y *= 0.25;
  });
  gravityToggle.checked = false;
  gravityEnabled = false;
  lab?.classList.remove("gravity-on", "complete");
  labComplete = false;
  document.querySelector(".lab-status span").textContent = "DRAG MODULES TO REROUTE";
});

function updateLabPhysics() {
  if (!lab) return;
  moduleStates.forEach((state) => {
    if (!state.active) {
      if (gravityEnabled && !reducedMotion) state.vy += 0.16;
      state.x += state.vx;
      state.y += state.vy;
      state.vx *= gravityEnabled ? 0.985 : 0.91;
      state.vy *= gravityEnabled ? 0.985 : 0.91;
    }
    const baseLeft = state.element.offsetLeft;
    const baseTop = state.element.offsetTop;
    const width = state.element.offsetWidth;
    const height = state.element.offsetHeight;
    const minX = -baseLeft + 8;
    const maxX = labWidth - baseLeft - width - 8;
    const minY = -baseTop + 84;
    const maxY = labHeight - baseTop - height - 38;
    if (state.x < minX) { state.x = minX; state.vx *= -0.58; }
    if (state.x > maxX) { state.x = maxX; state.vx *= -0.58; }
    if (state.y < minY) { state.y = minY; state.vy *= -0.58; }
    if (state.y > maxY) { state.y = maxY; state.vy *= -0.62; }
    state.element.style.transform = `translate3d(${state.x}px,${state.y}px,0) rotate(${clamp(state.vx * 0.32,-4,4)}deg)`;
  });
}

function drawLab() {
  if (!labContext || !lab || !labGoal) return;
  labContext.clearRect(0, 0, labWidth, labHeight);
  const labRect = lab.getBoundingClientRect();
  const points = moduleStates.map((state) => {
    const rect = state.element.getBoundingClientRect();
    return { x: rect.left - labRect.left + rect.width / 2, y: rect.top - labRect.top + rect.height / 2 };
  });
  const goalRect = labGoal.getBoundingClientRect();
  points.push({ x: goalRect.left - labRect.left + goalRect.width / 2, y: goalRect.top - labRect.top + goalRect.height / 2 });
  let connected = true;
  labContext.lineCap = "round";
  for (let index = 0; index < points.length - 1; index += 1) {
    const a = points[index];
    const b = points[index + 1];
    const distance = Math.hypot(b.x - a.x, b.y - a.y);
    const active = distance < Math.min(265, labWidth * 0.3);
    if (!active) connected = false;
    labContext.beginPath();
    labContext.moveTo(a.x, a.y);
    labContext.bezierCurveTo((a.x + b.x) / 2, a.y, (a.x + b.x) / 2, b.y, b.x, b.y);
    labContext.setLineDash(active ? [] : [4, 8]);
    labContext.strokeStyle = active ? "rgba(25,226,118,.72)" : "rgba(109,255,179,.14)";
    labContext.lineWidth = active ? 1.4 : 1;
    labContext.shadowColor = active ? "rgba(25,226,118,.55)" : "transparent";
    labContext.shadowBlur = active ? 12 : 0;
    labContext.stroke();
  }
  labContext.setLineDash([]);
  labContext.shadowBlur = 0;
  if (connected && !labComplete) {
    labComplete = true;
    lab.classList.add("complete");
    document.querySelector(".lab-status span").textContent = "ROUTE COMPLETE — PRODUCT ONLINE";
    showAchievement("SYSTEM CONNECTED", "You built a better route.");
  } else if (!connected && labComplete) {
    labComplete = false;
    lab.classList.remove("complete");
  }
}

let routeWidth = 0;
let routeHeight = 0;
function resizeRoute() {
  if (!routeCanvas || !routeSystem) return;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  routeWidth = routeSystem.clientWidth;
  routeHeight = routeSystem.clientHeight;
  routeCanvas.width = routeWidth * ratio;
  routeCanvas.height = routeHeight * ratio;
  routeContext.setTransform(ratio, 0, 0, ratio, 0, 0);
}

const atmosphere = document.querySelector("#atmosphere");
const atmosphereContext = atmosphere.getContext("2d");
let particles = [];
function resizeAtmosphere() {
  const ratio = Math.min(devicePixelRatio || 1, 2);
  atmosphere.width = innerWidth * ratio;
  atmosphere.height = innerHeight * ratio;
  atmosphere.style.width = `${innerWidth}px`;
  atmosphere.style.height = `${innerHeight}px`;
  atmosphereContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  particles = Array.from({ length: Math.min(62, Math.floor(innerWidth / 22)) }, () => ({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    vx: 0,
    vy: -(Math.random() * 0.1 + 0.025),
    radius: Math.random() * 1.1 + 0.25,
    alpha: Math.random() * 0.28 + 0.07,
  }));
}

function drawRoute(time) {
  if (!routeContext || !routeSystem) return;
  routeContext.clearRect(0, 0, routeWidth, routeHeight);
  const parentRect = routeSystem.getBoundingClientRect();
  const influenceX = finePointer ? (pointer.x.value - parentRect.left - routeWidth / 2) * 0.025 : 0;
  const influenceY = finePointer ? (pointer.y.value - parentRect.top - routeHeight / 2) * 0.025 : 0;
  const points = routeNodes.map((node, index) => {
    const rect = node.getBoundingClientRect();
    return {
      x: rect.left - parentRect.left + rect.width / 2 + influenceX * (index % 2 ? 1 : -0.6),
      y: rect.top - parentRect.top + rect.height / 2 + influenceY * (index < 2 ? -0.6 : 1),
    };
  });
  if (points.length < 2) return;
  routeContext.lineCap = "round";
  routeContext.lineJoin = "round";
  routeContext.beginPath();
  routeContext.moveTo(points[0].x, points[0].y);
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const middleX = (current.x + next.x) / 2;
    routeContext.bezierCurveTo(middleX, current.y, middleX, next.y, next.x, next.y);
  }
  routeContext.strokeStyle = "rgba(25,226,118,.78)";
  routeContext.lineWidth = 1.2;
  routeContext.shadowColor = "rgba(25,226,118,.65)";
  routeContext.shadowBlur = 12;
  routeContext.stroke();
  const progress = (time * 0.00013) % 1;
  const segment = Math.min(Math.floor(progress * 3), 2);
  const local = progress * 3 - segment;
  const a = points[segment];
  const b = points[segment + 1];
  const x = a.x + (b.x - a.x) * local;
  const y = a.y + (b.y - a.y) * local;
  routeContext.beginPath();
  routeContext.arc(x, y, 3.5, 0, Math.PI * 2);
  routeContext.fillStyle = "#75ffb6";
  routeContext.shadowBlur = 20;
  routeContext.fill();
  routeContext.shadowBlur = 0;
}

function drawParticles() {
  atmosphereContext.clearRect(0, 0, innerWidth, innerHeight);
  particles.forEach((particle) => {
    const dx = particle.x - pointer.x.value;
    const dy = particle.y - pointer.y.value;
    const distance = Math.hypot(dx, dy);
    if (finePointer && distance < 95 && distance > 0) {
      const force = (95 - distance) / 95 * 0.025;
      particle.vx += (dx / distance) * force;
      particle.vy += (dy / distance) * force;
    }
    particle.vx *= 0.98;
    particle.vy *= 0.995;
    particle.x += particle.vx;
    particle.y += particle.vy;
    if (particle.y < -5) particle.y = innerHeight + 5;
    if (particle.x < -5) particle.x = innerWidth + 5;
    if (particle.x > innerWidth + 5) particle.x = -5;
    atmosphereContext.beginPath();
    atmosphereContext.fillStyle = `rgba(62,236,143,${particle.alpha})`;
    atmosphereContext.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    atmosphereContext.fill();
  });
}

function frame(time) {
  const cursorX = updateSpring(pointer.x);
  const cursorY = updateSpring(pointer.y);
  if (cursor && finePointer) {
    const size = cursor.classList.contains("active") ? 58 : 18;
    cursor.style.transform = `translate3d(${cursorX - size / 2}px,${cursorY - size / 2}px,0)`;
  }
  const maxScroll = Math.max(document.documentElement.scrollHeight - innerHeight, 1);
  scrollSpring.target = scrollY / maxScroll;
  document.querySelector(".scroll-progress i").style.transform = `scaleY(${updateSpring(scrollSpring)})`;

  if (!reducedMotion && heroCopy && routeSystem) {
    const nx = pointer.x.value / innerWidth - 0.5;
    const ny = pointer.y.value / innerHeight - 0.5;
    heroCopy.style.transform = `translate3d(${nx * -7}px,${ny * -5 + scrollY * 0.035}px,0)`;
    routeSystem.style.setProperty("--route-scroll", `${scrollY * -0.02}px`);
  }
  revealStates.forEach((state) => {
    state.element.style.opacity = updateSpring(state.opacity);
    state.element.style.transform = `translate3d(0,${updateSpring(state.y)}px,0)`;
  });
  document.querySelectorAll(".magnetic").forEach((element) => {
    const state = element._magnetic;
    element.style.transform = `translate3d(${updateSpring(state.x)}px,${updateSpring(state.y)}px,0)`;
  });
  serviceCards.forEach((card) => {
    const state = card._tilt;
    card.style.transform = `perspective(900px) rotateX(${updateSpring(state.rx)}deg) rotateY(${updateSpring(state.ry)}deg)`;
  });
  if (workPreview) workPreview.style.transform = `perspective(900px) translate3d(${updateSpring(workDrag.x)}px,${updateSpring(workDrag.y)}px,0) rotateY(${workDrag.x.value * 0.035}deg)`;
  if (!reducedMotion) {
    drawCutscene(time);
    drawParticles();
    drawRoute(time);
  }
  updateLabPhysics();
  drawLab();
  pointer.speed *= 0.9;
  window.requestAnimationFrame(frame);
}

resizeAtmosphere();
resizeRoute();
resizeLab();
resizeCutscene();
if (reducedMotion) drawRoute(0);
window.addEventListener("resize", () => { resizeAtmosphere(); resizeRoute(); resizeLab(); resizeCutscene(); }, { passive: true });
window.requestAnimationFrame(frame);
