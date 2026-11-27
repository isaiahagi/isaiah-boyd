// live visitor count
(() => {
  const line = document.getElementById('visitors');
  let counted = false;
  // shows only the number the server returns; stays hidden if it can't be reached
  async function refresh() {
    if (document.hidden) return;
    try {
      const res = await fetch('/api/visitors', { method: counted ? 'GET' : 'POST' });
      if (!res.ok) return;
      const { count } = await res.json();
      if (!Number.isInteger(count)) return;
      counted = true;
      line.textContent = `${count.toLocaleString('en-US')} ${count === 1 ? 'Visitor' : 'Visitors'}`;
      line.hidden = false;
    } catch {}
  }
  refresh();
  setInterval(refresh, 15000);
  document.addEventListener('visibilitychange', refresh);
})();
