/* Logik für select-roles.html – gleiche Daten wie bot/cogs/selfroles.py */
const PANEL_NAMES = { games: 'Games Rollen', social: 'News Rollen' };
const PANEL_CMDS = { games: '!srgames', social: '!srping' };
let panels = {};      // { games: { title, description, roles: [{ role_id, label, emoji_id, emoji_name }] } }
let guildRoles = [];  // [{ id, name, color }]
let emojis = [];      // [{ id, name, animated }]
let channelOptions = '';
let sentCount = {};   // { games: 2 } – übers Dashboard gesendete Panels

const rolesText = n => `${n} ${n === 1 ? 'Rolle' : 'Rollen'}`;
const emojiUrl = id => `https://cdn.discordapp.com/emojis/${id}.webp?size=48`;

function roleRow(key, r, i) {
  return `
    <div class="list-row align-items-center" data-key="${key}" data-i="${i}">
      <span class="emoji-box">${r.emoji_id ? `<img src="${emojiUrl(r.emoji_id)}" alt="" width="24" height="24">` : '<i class="ti ti-mood-smile text-secondary" aria-hidden="true"></i>'}</span>
      <div class="row g-2 flex-grow-1">
        <div class="col-md-4">
          <select class="form-select form-select-sm" data-k="emoji_id" aria-label="Emoji">
            <option value="">Kein Emoji</option>
            ${emojis.map(e => `<option value="${e.id}" ${e.id === r.emoji_id ? 'selected' : ''}>:${esc(e.name)}:</option>`).join('')}
          </select>
        </div>
        <div class="col-md-4">
          <select class="form-select form-select-sm" data-k="role_id" aria-label="Rolle">
            ${guildRoles.map(g => `<option value="${g.id}" ${g.id === r.role_id ? 'selected' : ''}>@${esc(g.name)}</option>`).join('')}
            ${guildRoles.some(g => g.id === r.role_id) ? '' : `<option value="${r.role_id}" selected>Unbekannte Rolle</option>`}
          </select>
        </div>
        <div class="col-md-4">
          <input class="form-control form-control-sm" data-k="label" value="${esc(r.label)}" maxlength="70" placeholder="Button-Text" aria-label="Button-Text">
        </div>
      </div>
      <button class="btn btn-outline-light btn-sm" type="button" data-del aria-label="Rolle entfernen"><i class="ti ti-x" aria-hidden="true"></i></button>
    </div>`;
}

function panelCard(key) {
  const p = panels[key];
  return `
    <div class="col-xl-6">
      <form class="card p-4 h-100" data-panel="${key}">
        <div class="d-flex align-items-center gap-2 mb-3">
          <h5 class="mb-0">${PANEL_NAMES[key] || key}</h5>
          <span class="tag">${PANEL_CMDS[key] || ''}</span>
          <span class="tag ms-auto" data-count>${rolesText(p.roles.length)}</span>
        </div>
        <div class="mb-3">
          <label class="form-label">Überschrift</label>
          <input class="form-control" data-p="title" value="${esc(p.title)}" maxlength="256" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Text</label>
          <textarea class="form-control" data-p="description" rows="3" maxlength="4096">${esc(p.description)}</textarea>
        </div>
        <div class="section-title mb-1">Rollen</div>
        <div data-roles>${p.roles.map((r, i) => roleRow(key, r, i)).join('') || '<p class="text-secondary small my-2">Noch keine Rolle.</p>'}</div>
        <button class="btn btn-outline-light btn-sm mt-2 align-self-start" type="button" data-add><i class="ti ti-plus" aria-hidden="true"></i> Rolle</button>
        <div class="d-flex flex-wrap gap-2 align-items-center mt-4 pt-3" style="border-top:1px solid var(--line)">
          <button class="btn btn-primary" type="submit">Speichern</button>
          <button class="btn btn-outline-light btn-sm" type="button" data-refresh ${sentCount[key] ? '' : 'disabled'} title="Überschrift und Text in allen übers Dashboard gesendeten Panels aktualisieren"><i class="ti ti-refresh" aria-hidden="true"></i> Gesendete aktualisieren (${sentCount[key] || 0})</button>
          <div class="input-group input-group-sm ms-auto" style="max-width:300px">
            <select class="form-select" data-channel aria-label="Kanal für das Panel">${channelOptions}</select>
            <button class="btn btn-outline-light" type="button" data-send title="Panel mit Button in diesen Kanal senden"><i class="ti ti-send" aria-hidden="true"></i> Panel senden</button>
          </div>
        </div>
      </form>
    </div>`;
}

function redrawRefresh(key) {
  const b = $(`[data-panel="${key}"] [data-refresh]`);
  b.disabled = !sentCount[key];
  b.lastChild.textContent = ` Gesendete aktualisieren (${sentCount[key] || 0})`;
}

function draw() {
  $('#panels').innerHTML = Object.keys(panels).length
    ? Object.keys(panels).map(panelCard).join('')
    : '<div class="col-12"><div class="card p-4 text-secondary">Noch keine Daten – starte den Bot einmal mit der neuen Version neu.</div></div>';
}

function redrawRoles(key) {
  const form = $(`[data-panel="${key}"]`);
  $('[data-roles]', form).innerHTML = panels[key].roles.map((r, i) => roleRow(key, r, i)).join('') || '<p class="text-secondary small my-2">Noch keine Rolle.</p>';
  $('[data-count]', form).textContent = rolesText(panels[key].roles.length);
}

$('#panels').addEventListener('input', e => {
  const form = e.target.closest('[data-panel]');
  if (!form) return;
  const key = form.dataset.panel;
  if (e.target.dataset.p) { panels[key][e.target.dataset.p] = e.target.value; return; }

  const row = e.target.closest('[data-i]'), k = e.target.dataset.k;
  if (!row || !k) return;
  const r = panels[key].roles[+row.dataset.i];
  const before = guildRoles.find(g => g.id === r.role_id)?.name;
  r[k] = e.target.value;
  if (k === 'emoji_id') {
    r.emoji_name = emojis.find(x => x.id === r.emoji_id)?.name || '';
    $('.emoji-box', row).innerHTML = r.emoji_id ? `<img src="${emojiUrl(r.emoji_id)}" alt="" width="24" height="24">` : '<i class="ti ti-mood-smile text-secondary" aria-hidden="true"></i>';
  }
  if (k === 'role_id' && (!r.label || r.label === before)) { // Button-Text folgt der Rolle, solange er nicht eigen ist
    r.label = guildRoles.find(g => g.id === r.role_id)?.name || r.label;
    $('[data-k="label"]', row).value = r.label;
  }
});

$('#panels').addEventListener('click', async e => {
  const form = e.target.closest('[data-panel]');
  if (!form) return;
  const key = form.dataset.panel;

  if (e.target.closest('[data-del]')) {
    panels[key].roles.splice(+e.target.closest('[data-i]').dataset.i, 1);
    redrawRoles(key);
  } else if (e.target.closest('[data-add]')) {
    if (panels[key].roles.length >= 25) return toastError('Discord erlaubt maximal 25 Buttons');
    const free = guildRoles.find(g => !panels[key].roles.some(r => r.role_id === g.id));
    if (!free) return toastError('Keine freie Rolle mehr');
    panels[key].roles.push({ role_id: free.id, label: free.name, emoji_id: '', emoji_name: '' });
    redrawRoles(key);
  } else if (e.target.closest('[data-send]')) {
    try {
      await apiFetch(`/api/selfroles/${key}/send`, 'POST', { channel_id: $('[data-channel]', form).value });
      toast('Panel in Discord gesendet');
      sentCount[key] = (sentCount[key] || 0) + 1;
      redrawRefresh(key);
    } catch (err) { toastError(esc(err.message)); }
  } else if (e.target.closest('[data-refresh]')) {
    try {
      // erst speichern, damit die Panels den aktuellen Text bekommen
      panels[key] = await apiFetch(`/api/selfroles/${key}`, 'PUT', panels[key]);
      const res = await apiFetch(`/api/selfroles/${key}/refresh`, 'POST');
      sentCount[key] = res.updated;
      redrawRefresh(key);
      toast(`${res.updated} Panel${res.updated === 1 ? '' : 's'} aktualisiert`);
    } catch (err) { toastError(esc(err.message)); }
  }
});

$('#panels').addEventListener('submit', async e => {
  e.preventDefault();
  const key = e.target.dataset.panel;
  try {
    panels[key] = await apiFetch(`/api/selfroles/${key}`, 'PUT', panels[key]);
    toast('Gespeichert – gilt beim nächsten Klick auf „Rollen auswählen“');
  } catch (err) { toastError(esc(err.message)); }
});

(async () => {
  try {
    const [saved, roles, emo, channels, sent] = await Promise.all([
      apiFetch('/api/selfroles'), apiFetch('/api/roles'), apiFetch('/api/emojis'), apiFetch('/api/channels'),
      apiFetch('/api/selfroles/sent'),
    ]);
    sentCount = sent;
    panels = saved;
    guildRoles = roles;
    emojis = emo;
    channelOptions = channels.map(c => `<option value="${c.id}">#${esc(c.name)}</option>`).join('');
    draw();
  } catch (err) { toastError(esc(err.message)); }
})();
