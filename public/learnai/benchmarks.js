// benchmark table on the pro page
(() => {
  const status = document.getElementById('bench-status');
  const search = document.getElementById('search');
  const sorts = document.querySelector('.sorts');
  const table = document.querySelector('.table');
  let models = [], sort = 'intelligence';

  const order = {
    intelligence: (a, b) => (b.intelligence ?? -1) - (a.intelligence ?? -1),
    speed: (a, b) => (b.speed ?? -1) - (a.speed ?? -1),
    price: (a, b) => (a.output ?? Infinity) - (b.output ?? Infinity),
  };

  const show = (value, digits) => value == null ? '-' : value.toFixed(digits);

  function draw() {
    const query = search.value.trim().toLowerCase();
    const matches = models
      .filter((m) => `${m.name} ${m.creator}`.toLowerCase().includes(query))
      .sort(order[sort]);

    const rows = matches.slice(0, 25).map((m) => {
      const row = document.createElement('tr');
      const name = row.insertCell();
      name.textContent = m.name;
      name.appendChild(document.createElement('small')).textContent = m.creator;
      for (const text of [show(m.intelligence, 1), show(m.speed, 0), show(m.input, 2), show(m.output, 2)]) {
        row.insertCell().textContent = text;
      }
      return row;
    });

    table.querySelector('tbody').replaceChildren(...rows);
    status.textContent = `showing ${rows.length} of ${matches.length} models. data: artificial analysis.`;
  }

  sorts.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;
    sort = button.dataset.sort;
    for (const b of sorts.children) b.setAttribute('aria-pressed', b === button);
    draw();
  });
  search.addEventListener('input', draw);

  fetch('/api/benchmarks')
    .then((res) => res.ok ? res.json() : Promise.reject())
    .then((data) => {
      if (!data.models?.length) return Promise.reject();
      models = data.models;
      search.hidden = sorts.hidden = table.hidden = false;
      draw();
    })
    .catch(() => { status.textContent = "the live table isn't available right now. use the full leaderboard below."; });
})();
