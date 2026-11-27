/* Logik für benutzer.html – alle mit Zugang, Stufen und Rechte */
let info = null; // Antwort von /api/users
let me = null;   // eingeloggter Benutzer (mit level)
const PERM_ICON = { stream: 'broadcast', messages: 'message', roles: 'users', todos: 'checklist', moderation: 'shield', users: 'users-group' };
const LEVEL_STYLE = { owner: 'level-owner', supermod: 'level-supermod', list: 'level-list', role: 'level-role' };
let filter = '';

const isOwner = () => me?.level === 'owner';

function chips(p) {
  const locked = p.level === 'owner' || p.level === 'supermod' || p.level === 'role';
  return Object.entries(info.perms).map(([key, label]) => {
    const own = p.own_perms.includes(key), has = p.perms.includes(key);
    const fromRole = has && !own && !locked; // kommt über eine Discord-Rolle, hier nicht abschaltbar
    return `
      <input type="checkbox" class="btn-check" id="p_${p.id}_${key}" data-perm="${key}" ${has ? 'checked' : ''} ${locked || fromRole ? 'disabled' : ''} autocomplete="off">
      <label class="btn btn-outline-light btn-sm perm-chip" for="p_${p.id}_${key}" ${fromRole ? 'title="Kommt über eine Discord-Rolle"' : ''}><i class="ti ti-${PERM_ICON[key]}" aria-hidden="true"></i> ${esc(label)}</label>`;
  }).join('');
}

function actions(p) {
  if (p.fixed) return '<span class="small text-secondary"><i class="ti ti-lock" aria-hidden="true"></i> fest im Code</span>';
  const out = [];
  if (p.level === 'role') {
    out.push(`<button class="btn btn-outline-light btn-sm" type="button" data-add title="Zusätzliche Rechte vergeben"><i class="ti ti-user-plus" aria-hidden="true"></i> Zur Liste</button>`);
  } else {
    if (isOwner()) {
      out.push(p.level === 'supermod'
        ? `<button class="btn btn-outline-light btn-sm" type="button" data-level="list">Super-Mod entziehen</button>`
        : `<button class="btn btn-outline-light btn-sm" type="button" data-level="supermod"><i class="ti ti-star" aria-hidden="true"></i> Super-Mod</button>`);
    }
    if (p.level !== 'supermod' || isOwner()) {
      out.push(`<button class="btn btn-outline-light btn-sm" type="button" data-remove aria-label="Entfernen"><i class="ti ti-user-minus" aria-hidden="true"></i></button>`);
    }
  }
  return out.join('');
}

function drawUsers() {
  const q = filter.toLowerCase();
  const list = info.users.filter(p => !q || p.name.toLowerCase().includes(q));
  const count = lvl => info.users.filter(p => p.level === lvl).length;
  $('#userCount').textContent = info.users.length;
  $('#levelSummary').innerHTML = Object.entries(info.levels)
    .map(([lvl, name]) => `<span class="level-badge ${LEVEL_STYLE[lvl]}">${esc(name)}: ${count(lvl)}</span>`).join('');
  $('#users').innerHTML = list.length ? list.map(p => `
    <div class="list-row align-items-start" data-id="${p.id}">
      <img src="${esc(p.avatar)}" alt="" width="36" height="36" class="rounded-circle flex-none">
      <div class="flex-grow-1 min-w-0">
        <div class="d-flex flex-wrap align-items-center gap-2">
          <span class="fw-semibold">${esc(p.name)}</span>
          <span class="level-badge ${LEVEL_STYLE[p.level]}">${esc(info.levels[p.level])}</span>
          ${p.id === me?.id ? '<span class="tag">du</span>' : ''}
          ${p.on_server ? '' : '<span class="tag" title="Nicht (mehr) auf dem Discord-Server">nicht auf dem Server</span>'}
        </div>
        <div class="small text-secondary mb-2">${p.via_roles.length ? 'über Rolle ' + p.via_roles.map(esc).join(', ') : p.level === 'list' ? (p.perms.length ? p.perms.length + ' von ' + Object.keys(info.perms).length + ' Bereichen' : 'Nur ansehen') + (p.added_by ? ' · hinzugefügt von ' + esc(p.added_by) : '') : 'alle Rechte'}</div>
        ${p.level === 'owner' || p.level === 'supermod' ? '' : `<div class="d-flex flex-wrap gap-1">${chips(p)}</div>`}
      </div>
      <div class="d-flex flex-column align-items-end gap-1 flex-none">${actions(p)}</div>
    </div>`).join('')
    : '<p class="text-secondary small mb-0">Niemand gefunden.</p>';
}

function drawRoleInfo() {
  const names = keys => keys.map(k => info.perms[k]).join(', ');
  $('#roleInfo').innerHTML = `
    <li><strong>Inhaber</strong>: alles, auch Super-Mods vergeben. Nur im Code änderbar.</li>
    <li><strong>Super-Mod</strong>: alles inkl. Benutzer verwalten – aber Inhaber und Super-Mods nicht ändern. Vergeben nur Inhaber.</li>
    <li><strong>Benutzerliste</strong>: nur die angehakten Bereiche.</li>
    <li>Rolle <strong>${info.dashboard_roles.map(esc).join(' / ')}</strong>: ${esc(names(info.role_perms))}.</li>
    <li>Rolle <strong>${info.admin_roles.map(esc).join(' / ')}</strong> oder Server-Admin: zusätzlich ${esc(info.perms.moderation)}.</li>
    <li>Rechte aus Rollen und aus der Liste werden zusammengezählt.</li>`;
}

async function reload() {
  info = await apiFetch('/api/users');
  drawUsers();
}

async function save(p, changes) {
  await apiFetch('/api/users', 'PUT', {
    id: p.id, name: p.name, avatar: p.avatar,
    perms: p.own_perms, level: p.level === 'supermod' ? 'supermod' : 'list', ...changes,
  });
  await reload();
}

const byId = id => info.users.find(p => p.id === id);

$('#users').addEventListener('change', async e => {
  const box = e.target.closest('[data-perm]');
  if (!box) return;
  const p = byId(box.closest('[data-id]').dataset.id);
  const perms = box.checked ? [...p.own_perms, box.dataset.perm] : p.own_perms.filter(x => x !== box.dataset.perm);
  if (p.id === me?.id && box.dataset.perm === 'users' && !box.checked
      && !confirm('Damit nimmst du dir selbst das Recht, Benutzer zu verwalten. Fortfahren?')) {
    box.checked = true;
    return;
  }
  try {
    await save(p, { perms });
    toast('Rechte gespeichert');
  } catch (err) { toastError(esc(err.message)); drawUsers(); }
});

$('#users').addEventListener('click', async e => {
  const row = e.target.closest('[data-id]');
  if (!row) return;
  const p = byId(row.dataset.id);
  try {
    if (e.target.closest('[data-add]')) {
      await save(p, { perms: [], level: 'list' });
      toast(`${p.name} steht jetzt in der Liste – zusätzliche Rechte anhaken`);
    } else if (e.target.closest('[data-level]')) {
      const level = e.target.closest('[data-level]').dataset.level;
      if (!confirm(level === 'supermod' ? `${p.name} zum Super-Mod machen?` : `${p.name} die Super-Mod-Rechte entziehen?`)) return;
      await save(p, { level });
      toast(level === 'supermod' ? `${p.name} ist jetzt Super-Mod` : `${p.name} ist kein Super-Mod mehr`);
    } else if (e.target.closest('[data-remove]')) {
      if (!confirm(`${p.name} aus dem Dashboard entfernen? Zugang über Discord-Rollen bleibt bestehen.`)) return;
      await apiFetch('/api/users/' + p.id, 'DELETE');
      await reload();
      toast(`${p.name} entfernt`);
    }
  } catch (err) { toastError(esc(err.message)); }
});

$('#userFilter').addEventListener('input', e => { filter = e.target.value.trim(); drawUsers(); });

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
        const known = byId(m.id);
        const blocked = known && known.level !== 'role';
        return `<button type="button" class="member-item" data-i="${i}" ${blocked ? 'disabled' : ''}>
          <img src="${esc(m.avatar)}" alt="" width="32" height="32" class="rounded-circle flex-none">
          <div class="min-w-0"><div class="fw-semibold text-truncate">${esc(m.display)}</div>
          <div class="small text-secondary">${blocked ? esc(info.levels[known.level]) : '@' + esc(m.username)}</div></div>
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
    await apiFetch('/api/users', 'PUT', { id: m.id, name: m.display, avatar: m.avatar, perms: [] });
    $('#m_search').value = '';
    $('#m_results').innerHTML = '';
    await reload();
    toast(`${m.display} hinzugefügt – jetzt Rechte vergeben`);
  } catch (err) { toastError(esc(err.message)); }
});

(async () => {
  try {
    me = (await apiFetch('/auth/me')).user;
    await reload();
    drawRoleInfo();
  } catch (err) { toastError(esc(err.message)); }
})();
