// live discord profile from lanyard. the page already holds a saved copy, kept if lanyard can't be reached
(() => {
  const card = document.getElementById('discord');
  const part = (name) => card.querySelector(`[data-${name}]`);
  const id = card.dataset.id;
  const cdn = 'https://cdn.discordapp.com';
  const statuses = { online: 'online', idle: 'idle', dnd: 'do not disturb', offline: 'offline' };

  // only touch an image when it changes, so animated ones don't restart
  const show = (img, src) => { if (img.getAttribute('src') !== src) img.src = src; };

  async function refresh() {
    if (document.hidden) return;
    try {
      const res = await fetch(`https://api.lanyard.rest/v1/users/${id}`);
      const body = await res.json();
      if (!body.success) return;
      const { discord_user: user, discord_status: status } = body.data;
      show(part('avatar'), user.avatar ? `${cdn}/avatars/${id}/${user.avatar}.png?size=160` : `${cdn}/embed/avatars/0.png`);
      // no decoration means it was taken off, so hide the saved one
      const asset = user.avatar_decoration_data?.asset;
      part('decoration').hidden = !asset;
      if (asset) show(part('decoration'), `${cdn}/avatar-decoration-presets/${asset}.png?size=240&passthrough=true`);
      part('name').textContent = user.global_name ?? user.username;
      part('username').textContent = user.username;
      part('status').textContent = statuses[status] ? ` (${statuses[status]})` : '';
    } catch {}
  }
  refresh();
  setInterval(refresh, 30000);
  document.addEventListener('visibilitychange', refresh);
})();
