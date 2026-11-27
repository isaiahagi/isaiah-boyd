// theme button, contents sidebar and scroll wheel
// light and dark mode
const button = document.querySelector('#theme');
const root = document.documentElement;
const preference = matchMedia('(prefers-color-scheme: dark)');
const current = () => root.dataset.theme || (preference.matches ? 'dark' : 'light');
function update() { button.textContent = current() === 'dark' ? 'light mode' : 'dark mode'; }
button.addEventListener('click', () => {
  root.dataset.theme = current() === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch {}
  update();
});
preference.addEventListener('change', update);
update();
button.hidden = false;

// contents sidebar: open on wide screens, highlights the section you're reading
(() => {
  const side = document.getElementById('side'), wide = matchMedia('(min-width: 1040px)');
  const items = [...side.querySelectorAll('a:not(.brand)')];
  const sync = () => { side.open = wide.matches; };
  wide.addEventListener('change', sync); sync();
  side.addEventListener('click', e => { if (!wide.matches && e.target.closest('a')) side.open = false; });
  let current, frame = 0;
  function mark() {
    frame = 0;
    const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
    let active = items[0];
    for (const a of items.slice(1)) {
      if (atEnd || document.querySelector(a.hash).getBoundingClientRect().top <= 120) active = a;
    }
    if (active === current) return;
    current?.removeAttribute('aria-current');
    active.setAttribute('aria-current', 'location');
    current = active;
    // keep the highlighted entry visible inside the sidebar without moving the page
    if (wide.matches) {
      const r = active.getBoundingClientRect();
      if (r.top < 80 || r.bottom > innerHeight - 16) side.scrollTop += r.top - innerHeight / 2;
    }
  }
  addEventListener('scroll', () => { frame ||= requestAnimationFrame(mark); }, { passive: true });
  addEventListener('resize', mark);
  mark();
})();

// scroll wheel made of lines
(() => {
  if (!matchMedia('(pointer: fine)').matches) return; // touch screens keep their own scrollbar
  const root = document.documentElement, wheel = document.getElementById('wheel'), thumb = document.getElementById('thumb');
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const COUNT = 8, GAP = 16, SIZE = COUNT * GAP, EDGE = 12;
  const lines = Array.from({ length: COUNT }, () => thumb.appendChild(document.createElement('i')));
  const max = () => Math.max(0, root.scrollHeight - innerHeight);
  const travel = () => Math.max(1, innerHeight - SIZE - EDGE * 2);
  let shown = scrollY, frame = 0;

  function draw() {
    frame = 0;
    shown += (scrollY - shown) * (still.matches ? 1 : 0.18); // ease toward the real position
    if (Math.abs(scrollY - shown) < 0.5) shown = scrollY;
    wheel.hidden = max() === 0;
    const progress = max() ? Math.min(1, Math.max(0, shown / max())) : 0;
    thumb.style.transform = `translateY(${EDGE + progress * travel()}px)`;
    const roll = still.matches ? 0 : shown * 0.12;
    lines.forEach((line, i) => {
      const y = (((i * GAP - roll) % SIZE) + SIZE) % SIZE;
      const curve = Math.sin(Math.PI * y / SIZE); // 0 at the ends, 1 in the middle
      line.style.transform = `translate(${-10 * curve}px, ${y}px) scaleX(${0.7 + 0.3 * curve})`;
      line.style.opacity = Math.min(1, curve * 2.2);
    });
    if (shown !== scrollY) queue();
  }
  function queue() { if (!frame) frame = requestAnimationFrame(draw); }

  const jump = top => scrollTo({ top, behavior: 'instant' });
  let drag = null;
  wheel.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    e.preventDefault();
    if (!thumb.contains(e.target)) jump((e.clientY - EDGE - SIZE / 2) / travel() * max());
    drag = { y: e.clientY, top: scrollY };
    wheel.setPointerCapture(e.pointerId);
  });
  wheel.addEventListener('pointermove', e => { if (drag) jump(drag.top + (e.clientY - drag.y) / travel() * max()); });
  wheel.addEventListener('lostpointercapture', () => { drag = null; });

  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  new ResizeObserver(queue).observe(document.body);
  root.classList.add('has-wheel');
  draw();
})();
