const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const intro = document.querySelector(".intro");

if (!reducedMotion) {
  window.setTimeout(() => intro?.classList.add("done"), 1900);
} else {
  intro?.remove();
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.14 });

document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

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
    window.setTimeout(() => {
      copyButton.querySelector("span").textContent = "Copy email";
    }, 1800);
  } catch {
    window.location.href = `mailto:${email}`;
  }
});

if (!reducedMotion) {
  const cursor = document.querySelector(".cursor-light");
  window.addEventListener("pointermove", (event) => {
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
  }, { passive: true });

  const heroWord = document.querySelector(".hero-word");
  const route = document.querySelector(".route-system");
  window.addEventListener("pointermove", (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 12;
    const y = (event.clientY / window.innerHeight - 0.5) * 10;
    heroWord.style.transform = `translate3d(${x * -0.35}px,${y * -0.35}px,0)`;
    route.style.transform = `translate3d(${x}px,${y}px,0)`;
  }, { passive: true });
}

const canvas = document.querySelector("#atmosphere");
const context = canvas.getContext("2d");
let points = [];
let animationFrame;

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * ratio;
  canvas.height = window.innerHeight * ratio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  points = Array.from({ length: Math.min(54, Math.floor(window.innerWidth / 24)) }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    radius: Math.random() * 1.2 + 0.25,
    speed: Math.random() * 0.12 + 0.03,
    alpha: Math.random() * 0.32 + 0.08,
  }));
}

function drawAtmosphere() {
  context.clearRect(0, 0, window.innerWidth, window.innerHeight);
  points.forEach((point) => {
    point.y -= point.speed;
    if (point.y < -4) {
      point.y = window.innerHeight + 4;
      point.x = Math.random() * window.innerWidth;
    }
    context.beginPath();
    context.fillStyle = `rgba(62, 236, 143, ${point.alpha})`;
    context.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
    context.fill();
  });
  animationFrame = window.requestAnimationFrame(drawAtmosphere);
}

resizeCanvas();
if (!reducedMotion) drawAtmosphere();
window.addEventListener("resize", resizeCanvas, { passive: true });
window.addEventListener("pagehide", () => window.cancelAnimationFrame(animationFrame), { once: true });
