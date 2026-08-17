const glow = document.querySelector('.cursor-glow');
window.addEventListener('pointermove', (event) => {
  if (glow) glow.style.transform = `translate(${event.clientX - 240}px,${event.clientY - 240}px)`;
}, { passive: true });

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    observer.unobserve(entry.target);
  });
}, { threshold: .12 });
document.querySelectorAll('.project').forEach((project) => observer.observe(project));

document.querySelectorAll('.project-visual').forEach((visual) => {
  visual.addEventListener('pointermove', (event) => {
    if (matchMedia('(pointer: coarse)').matches) return;
    const rect = visual.getBoundingClientRect();
    visual.style.setProperty('--tilt-x', `${(event.clientX - rect.left - rect.width / 2) / rect.width * 3}deg`);
    visual.style.setProperty('--tilt-y', `${-(event.clientY - rect.top - rect.height / 2) / rect.height * 3}deg`);
  });
  visual.addEventListener('pointerleave', () => {
    visual.style.setProperty('--tilt-x', '0deg');
    visual.style.setProperty('--tilt-y', '0deg');
  });
});
