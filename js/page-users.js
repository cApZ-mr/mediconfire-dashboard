/* Logik für benutzer.html – alle mit Zugang, Stufen und Rechte */
let info = null; // Antwort von /api/users
let me = null;   // eingeloggter Benutzer (mit level)
const PERM_ICON = { stream: 'broadcast', messages: 'message', roles: 'users', todos: 'checklist', moderation: 'shield', users: 'users-group' };
const LEVEL_STYLE = { owner: 'level-owner', supermod: 'level-supermod', moderator: 'level-moderator', list: 'level-list' };
const LIST_PERMS = () => Object.entries(info.perms).filter(([k]) => k !== 'users'); // Benutzer verwalten: nur Super-Mods
let filter = '';

const isOwner = () => me?.level === 'owner';
const label = p => p.title || info.levels[p.level];                      // z. B. "Techniker" statt "Inhaber"
const badgeClass = p => (p.title === 'Techniker' ? 'level-tech' : LEVEL_STYLE[p.level]);

function chips(p) {
  return LIST_PERMS().map(([key, label]) => `
      <input type="checkbox" class="btn-check" id="p_${p.id}_${key}" data-perm="${key}" ${p.perms.includes(key) ? 'checked' : ''} autocomplete="off">
      <label class="btn btn-outline-light btn-sm perm-chip" for="p_${p.id}_${key}"><i class="ti ti-${PERM_ICON[key]}" aria-hidden="true"></i> ${esc(label)}</label>`).join('');
}

function actions(p) {
  if (p.level === 'owner' || (p.level === 'supermod' && !isOwner())) return ''; // Super-Mods ändern nur Inhaber
  const options = [['list', 'Benutzerliste'], ['moderator', 'Moderator'], ...(isOwner() ? [['supermod', 'Super-Mod']] : [])];
  return `
    <select class="form-select form-select-sm" data-level-select aria-label="Stufe von ${esc(p.name)}" style="width:auto">
      ${options.map(([v, n]) => `<option value="${v}" ${p.level === v ? 'selected' : ''}>${n}</option>`).join('')}
    </select>
    <button class="btn btn-outline-light btn-sm" type="button" data-remove aria-label="Entfernen"><i class="ti ti-user-minus" aria-hidden="true"></i></button>`;
}

function summary(p) {
  if (p.level === 'list') return p.perms.length ? `${p.perms.length} von ${LIST_PERMS().length} Bereichen` : 'Nur ansehen';
  if (p.level === 'moderator') return 'alles außer Rechte verwalten';
  return 'alle Rechte';
}

function drawUsers() {
  const q = filter.toLowerCase();
  const list = info.users.filter(p => !q || p.name.toLowerCase().includes(q));
  $('#userCount').textContent = info.users.length;
  // Zählung nach angezeigter Bezeichnung (Techniker und Inhaber getrennt, gleiche Rechte)
  const labels = [...new Set(info.users.map(label))];
  $('#levelSummary').innerHTML = labels
    .map(l => `<span class="level-badge ${badgeClass(info.users.find(p => label(p) === l))}">${esc(l)}: ${info.users.filter(p => label(p) === l).length}</span>`).join('');
  $('#users').innerHTML = list.length ? list.map(p => `
    <div class="list-row align-items-start" data-id="${p.id}">
      <img src="${esc(p.avatar)}" alt="" width="36" height="36" class="rounded-circle flex-none">
      <div class="flex-grow-1 min-w-0">
        <div class="d-flex flex-wrap align-items-center gap-2">
          <span class="fw-semibold">${esc(p.name)}</span>
          <span class="level-badge ${badgeClass(p)}">${esc(label(p))}</span>
          ${p.id === me?.id ? '<span class="tag">du</span>' : ''}
        </div>
        <div class="small text-secondary mb-2">${summary(p)}${p.added_by ? ' · hinzugefügt von ' + esc(p.added_by) : ''}</div>
        ${p.level === 'list' ? `<div class="d-flex flex-wrap gap-1">${chips(p)}</div>` : ''}
      </div>
      <div class="d-flex flex-column align-items-end gap-1 flex-none">${actions(p)}</div>
    </div>`).join('')
    : '<p class="text-secondary small mb-0">Niemand gefunden.</p>';
}

function drawRoleInfo() {
  $('#roleInfo').innerHTML = `
    <li><strong>Inhaber</strong> und <strong>Techniker</strong>: alles, auch Super-Mods vergeben.</li>
    <li><strong>Super-Mod</strong>: alles inkl. Benutzer verwalten – aber Inhaber und Super-Mods nicht ändern. Vergeben nur Inhaber.</li>
    <li><strong>Moderator</strong>: alles außer Rechte verwalten – sieht diesen Reiter nicht.</li>
    <li><strong>Benutzerliste</strong>: nur die angehakten Bereiche – sieht diesen Reiter nicht.</li>
    <li>Discord-Rollen und Server-Rechte geben <strong>keinen</strong> Zugang – nur diese Liste zählt. Bots können nicht hinzugefügt werden.</li>`;
}

async function reload() {
  info = await apiFetch('/api/users');
  drawUsers();
}

async function save(p, changes) {
  await apiFetch('/api/users', 'PUT', {
    id: p.id, name: p.name, avatar: p.avatar,
    perms: p.level === 'list' ? p.perms : [], level: p.level, ...changes,
  });
  await reload();
}

const byId = id => info.users.find(p => p.id === id);

const LEVEL_TEXT = { list: 'Benutzerliste (einzelne Rechte)', moderator: 'Moderator', supermod: 'Super-Mod' };

$('#users').addEventListener('change', async e => {
  const sel = e.target.closest('[data-level-select]');
  if (sel) {
    const p = byId(sel.closest('[data-id]').dataset.id), level = sel.value;
    if (!confirm(`${p.name} auf „${LEVEL_TEXT[level]}“ setzen?`)) { sel.value = p.level; return; }
    try {
      // beim Herabstufen auf die Liste bisherige Bereiche behalten (ohne Benutzer verwalten)
      await save(p, { level, perms: level === 'list' ? p.perms.filter(x => x !== 'users') : [] });
      toast(`${p.name} ist jetzt ${LEVEL_TEXT[level]}`);
    } catch (err) { toastError(err.message); sel.value = p.level; }
    return;
  }
  const box = e.target.closest('[data-perm]');
  if (!box) return;
  const p = byId(box.closest('[data-id]').dataset.id);
  const perms = box.checked ? [...p.perms, box.dataset.perm] : p.perms.filter(x => x !== box.dataset.perm);
  if (p.id === me?.id && box.dataset.perm === 'users' && !box.checked
      && !confirm('Damit nimmst du dir selbst das Recht, Benutzer zu verwalten. Fortfahren?')) {
    box.checked = true;
    return;
  }
  try {
    await save(p, { perms });
    toast('Rechte gespeichert');
  } catch (err) { toastError(err.message); drawUsers(); }
});

$('#users').addEventListener('click', async e => {
  const row = e.target.closest('[data-id]');
  if (!row) return;
  const p = byId(row.dataset.id);
  try {
    if (e.target.closest('[data-remove]')) {
      if (!confirm(`${p.name} aus dem Dashboard entfernen? Danach hat ${p.name} keinen Zugang mehr.`)) return;
      await apiFetch('/api/users/' + p.id, 'DELETE');
      await reload();
      toast(`${p.name} entfernt`);
    }
  } catch (err) { toastError(err.message); }
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
      results = res.filter(m => !m.bot); // Bots bekommen keinen Zugang
      $('#m_results').innerHTML = results.length ? results.map((m, i) => {
        const known = byId(m.id);
        const blocked = !!known;
        return `<button type="button" class="member-item" data-i="${i}" ${blocked ? 'disabled' : ''}>
          <img src="${esc(m.avatar)}" alt="" width="32" height="32" class="rounded-circle flex-none">
          <div class="min-w-0"><div class="fw-semibold text-truncate">${esc(m.display)}</div>
          <div class="small text-secondary">${blocked ? esc(info.levels[known.level]) : '@' + esc(m.username)}</div></div>
        </button>`;
      }).join('') : '<div class="small text-secondary p-2">Niemand gefunden.</div>';
    } catch (err) { toastError(err.message); }
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
  } catch (err) { toastError(err.message); }
});

(async () => {
  try {
    me = (await apiFetch('/auth/me')).user;
    await reload();
    drawRoleInfo();
  } catch (err) { toastError(err.message); }
})();
