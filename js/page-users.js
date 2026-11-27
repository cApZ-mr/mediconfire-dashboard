/* Logik für benutzer.html – Benutzer und ihre Rechte */
let info = null; // Antwort von /api/users
let me = null;   // eingeloggter Benutzer
const PERM_ICON = { stream: 'broadcast', messages: 'message', roles: 'users', todos: 'checklist', moderation: 'shield', users: 'users-group' };
const defaultAvatar = id => `https://cdn.discordapp.com/embed/avatars/${Number(BigInt(id) >> 22n) % 6}.png`;

function drawUsers() {
  const list = [...info.users].sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id, 'de'));
  $('#userCount').textContent = list.length;
  $('#users').innerHTML = list.length ? list.map(u => `
    <div class="list-row align-items-start" data-id="${u.id}">
      <img src="${esc(u.avatar || defaultAvatar(u.id))}" alt="" width="36" height="36" class="rounded-circle flex-none">
      <div class="flex-grow-1 min-w-0">
        <div class="fw-semibold">${esc(u.name || 'Unbekannt')} ${u.id === me?.id ? '<span class="tag">du</span>' : ''}</div>
        <div class="small text-secondary mb-2">${u.perms.length ? u.perms.length + ' von ' + Object.keys(info.perms).length + ' Bereichen' : 'Nur ansehen'} · hinzugefügt von ${esc(u.added_by || '?')}</div>
        <div class="d-flex flex-wrap gap-1">
          ${Object.entries(info.perms).map(([key, label]) => `
            <input type="checkbox" class="btn-check" id="p_${u.id}_${key}" data-perm="${key}" ${u.perms.includes(key) ? 'checked' : ''} autocomplete="off">
            <label class="btn btn-outline-light btn-sm perm-chip" for="p_${u.id}_${key}"><i class="ti ti-${PERM_ICON[key]}" aria-hidden="true"></i> ${esc(label)}</label>`).join('')}
        </div>
      </div>
      <button class="btn btn-outline-light btn-sm" type="button" data-remove aria-label="${esc(u.name)} entfernen"><i class="ti ti-user-minus" aria-hidden="true"></i></button>
    </div>`).join('')
    : '<p class="text-secondary small mb-0">Noch niemand hinzugefügt. Such rechts nach einem Mitglied.</p>';
}

function drawRoleInfo() {
  const names = keys => keys.map(k => info.perms[k]).join(', ');
  $('#roleInfo').innerHTML = `
    <li><strong>Inhaber</strong> (${info.owners.length}, fest im Code): alle Rechte, können nicht entfernt werden.</li>
    <li>Rolle <strong>${info.dashboard_roles.map(esc).join(' / ')}</strong>: ${esc(names(info.role_perms))}.</li>
    <li>Rolle <strong>${info.admin_roles.map(esc).join(' / ')}</strong> oder Server-Admin: zusätzlich ${esc(info.perms.moderation)}.</li>
    <li>Rechte aus Rollen und aus dieser Liste werden zusammengezählt.</li>`;
}

async function save(id, perms, extra = {}) {
  const u = await apiFetch('/api/users', 'PUT', { id, perms, ...extra });
  info.users = [...info.users.filter(x => x.id !== id), u];
  return u;
}

$('#users').addEventListener('change', async e => {
  const box = e.target.closest('[data-perm]');
  if (!box) return;
  const row = box.closest('[data-id]'), id = row.dataset.id;
  const perms = $$('[data-perm]', row).filter(c => c.checked).map(c => c.dataset.perm);
  if (id === me?.id && box.dataset.perm === 'users' && !box.checked
      && !confirm('Damit nimmst du dir selbst das Recht, Benutzer zu verwalten. Fortfahren?')) {
    box.checked = true;
    return;
  }
  try {
    await save(id, perms);
    drawUsers();
    toast('Rechte gespeichert');
  } catch (err) { toastError(esc(err.message)); drawUsers(); }
});

$('#users').addEventListener('click', async e => {
  if (!e.target.closest('[data-remove]')) return;
  const id = e.target.closest('[data-id]').dataset.id, u = info.users.find(x => x.id === id);
  if (!confirm(`${u.name || id} aus dem Dashboard entfernen? Zugang über Discord-Rollen bleibt bestehen.`)) return;
  try {
    await apiFetch('/api/users/' + id, 'DELETE');
    info.users = info.users.filter(x => x.id !== id);
    drawUsers();
    toast(`${u.name || id} entfernt`);
  } catch (err) { toastError(esc(err.message)); }
});

/* ---------- Mitglied suchen und hinzufügen ---------- */
let timer, lastQuery = '', results = [];
$('#m_search').addEventListener('input', e => {
  clearTimeout(timer);
  const q = e.target.value.trim();
  if (!q) { $('#m_results').innerHTML = ''; return; }
  timer = setTimeout(async () => {
    lastQuery = q;
    try {
      const res = await apiFetch('/api/members?q=' + encodeURIComponent(q));
      if (q !== lastQuery) return;
      results = res.filter(m => !m.bot);
      $('#m_results').innerHTML = results.length ? results.map((m, i) => {
        const owner = info.owners.includes(m.id), added = info.users.some(u => u.id === m.id);
        return `<button type="button" class="member-item" data-i="${i}" ${owner || added ? 'disabled' : ''}>
          <img src="${esc(m.avatar)}" alt="" width="32" height="32" class="rounded-circle flex-none">
          <div class="min-w-0"><div class="fw-semibold text-truncate">${esc(m.display)}</div>
          <div class="small text-secondary">${owner ? 'Inhaber' : added ? 'Schon in der Liste' : '@' + esc(m.username)}</div></div>
        </button>`;
      }).join('') : '<div class="small text-secondary p-2">Niemand gefunden.</div>';
    } catch (err) { toastError(esc(err.message)); }
  }, 250);
});

$('#m_results').addEventListener('click', async e => {
  const b = e.target.closest('[data-i]');
  if (!b || b.disabled) return;
  const m = results[+b.dataset.i];
  try {
    await save(m.id, [], { name: m.display, avatar: m.avatar });
    $('#m_search').value = '';
    $('#m_results').innerHTML = '';
    drawUsers();
    toast(`${m.display} hinzugefügt – jetzt Rechte vergeben`);
  } catch (err) { toastError(esc(err.message)); }
});

(async () => {
  try {
    [info, me] = await Promise.all([apiFetch('/api/users'), apiFetch('/auth/me').then(r => r.user)]);
    drawUsers();
    drawRoleInfo();
  } catch (err) { toastError(esc(err.message)); }
})();
