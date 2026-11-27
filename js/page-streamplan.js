/* Logik für streamplan.html – frei hinzufügbare Streams, als Tabelle gesendet */
const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const SPONTAN = 'Spontan';
let entries = []; // [{ day: 0-6, time: '19:30' | '', title: '' }]
const form = $('#planForm');

/* ---------- Einträge bearbeiten ---------- */
function drawEntries() {
  $('#entryCount').textContent = entries.length;
  $('#entries').innerHTML = entries.length ? entries.map((e, i) => `
    <div class="row g-2 align-items-center entry-row" data-i="${i}">
      <div class="col-6 col-md-3">
        <select class="form-select" data-k="day" aria-label="Tag">
          ${DAYS.map((d, n) => `<option value="${n}" ${n === e.day ? 'selected' : ''}>${d}</option>`).join('')}
        </select>
      </div>
      <div class="col-6 col-md-3">
        <input type="time" class="form-control" data-k="time" value="${esc(e.time)}" aria-label="Uhrzeit (leer = spontan)" title="Leer lassen für spontan">
      </div>
      <div class="col-10 col-md-5">
        <input class="form-control" data-k="title" value="${esc(e.title)}" maxlength="60" placeholder="Titel oder Spiel (leer = ${SPONTAN})" aria-label="Titel">
      </div>
      <div class="col-2 col-md-1 text-end">
        <button class="btn btn-outline-light btn-sm" type="button" data-del aria-label="Eintrag entfernen"><i class="ti ti-x" aria-hidden="true"></i></button>
      </div>
    </div>`).join('')
    : '<p class="text-secondary small my-2">Noch kein Stream eingetragen – leg los mit „Stream hinzufügen“.</p>';
}

$('#entries').addEventListener('input', e => {
  const row = e.target.closest('[data-i]'), k = e.target.dataset.k;
  if (!row || !k) return;
  entries[+row.dataset.i][k] = k === 'day' ? +e.target.value : e.target.value;
});

$('#entries').addEventListener('click', e => {
  if (!e.target.closest('[data-del]')) return;
  entries.splice(+e.target.closest('[data-i]').dataset.i, 1);
  drawEntries();
  updateStreamplan();
});

$('#addEntry').onclick = () => {
  if (entries.length >= 30) return toastError('Maximal 30 Streams');
  const last = entries[entries.length - 1];
  entries.push({ day: last ? Math.min(last.day + 1, 6) : 0, time: '', title: '' }); // nächster Tag als Vorschlag
  drawEntries();
  updateStreamplan();
  $('#entries [data-i]:last-child [data-k="time"]').focus();
};

$('#clearEntries').onclick = () => {
  if (entries.length && !confirm('Alle Streams aus dem Plan entfernen?')) return;
  entries = [];
  drawEntries();
  updateStreamplan();
};

/* ---------- Plan bauen: ein Embed-Feld pro Tag (Tag fett, Uhrzeiten in fester Breite) ---------- */
const NO_TIME = '--:--'; // gleiche Breite wie 19:30 -> Titel stehen bündig untereinander

function planFields() {
  const fields = [];
  DAYS.forEach((day, d) => {
    const today = entries
      .filter(e => e.day === d)
      .sort((a, b) => (a.time || '99').localeCompare(b.time || '99')); // spontan ans Ende
    if (today.length) {
      fields.push({ name: day, value: today.map(e => `\`${e.time || NO_TIME}\`  ${e.title.trim() || SPONTAN}`).join('\n') });
    } else if ($('#showPause').checked) {
      fields.push({ name: day, value: '*Pause*' });
    }
  });
  return fields;
}

// Discord-Formatierung für die Vorschau: `code` und *kursiv*
const fmt = t => esc(t).replace(/`(.+?)`/g, '<code class="dc-code">$1</code>').replace(/\*(.+?)\*/g, '<em>$1</em>');

function updateStreamplan() {
  $('#pv_title').textContent = $('#ptitle').value;
  const fields = planFields();
  $('#pv_lines').innerHTML = fields.length
    ? fields.map(f => `<div class="mb-2"><div class="text-white fw-bold small">${esc(f.name)}</div><div class="small" style="white-space:pre-line">${fmt(f.value)}</div></div>`).join('')
    : '<span class="text-secondary small">Noch keine Streams eingetragen.</span>';
  $('#pv_foot').textContent = $('#pfoot').value;
}

form.addEventListener('input', () => {
  updateStreamplan();
  const e = $('#pv_embed'); // kurz aufleuchten, damit man sieht, was sich ändert
  e.classList.remove('flash'); void e.offsetWidth; e.classList.add('flash');
});

/* ---------- Gespeicherten Stand laden (auch aus älteren Formaten) ---------- */
function entriesFrom(f) {
  if (Array.isArray(f.entries)) return f.entries.map(e => ({ day: +e.day, time: e.time || '', title: e.title || '' }));
  const out = []; // älteres Format: ein Eintrag pro Tag (mode0 / on0, time0, title0)
  DAYS.forEach((_, d) => {
    const mode = f[`mode${d}`] || (f[`on${d}`] ? 'plan' : 'off');
    if (mode !== 'off') out.push({ day: d, time: mode === 'plan' ? f[`time${d}`] || '' : '', title: f[`title${d}`] || '' });
  });
  return out;
}

function restore(saved) {
  const f = saved.form;
  if (f) {
    entries = entriesFrom(f);
    if (f.ptitle != null) $('#ptitle').value = f.ptitle;
    if (f.pfoot != null) $('#pfoot').value = f.pfoot;
    $('#showPause').checked = f.show_pause !== false;
  }
  if (saved.updated_at) {
    $('#lastSent').textContent = 'Zuletzt gesendet: ' + new Date(saved.updated_at).toLocaleString('de-DE')
      + (saved.updated_by ? ' von ' + saved.updated_by.username : '');
  }
  drawEntries();
  updateStreamplan();
}

drawEntries();
updateStreamplan();

form.addEventListener('submit', async e => {
  e.preventDefault();
  if (!entries.length && !$('#showPause').checked) return toastError('Der Plan ist leer');
  const btn = $('#sendBtn');
  btn.disabled = true;
  try {
    const saved = await apiFetch('/api/streamplan', 'POST', {
      title: $('#ptitle').value,
      fields: planFields(),
      footer: $('#pfoot').value,
      replace: $('#replace').checked,
      form: { entries, show_pause: $('#showPause').checked, ptitle: $('#ptitle').value, pfoot: $('#pfoot').value },
    });
    restore(saved);
    toast('Streamplan in Discord gesendet');
  } catch (err) { toastError(esc(err.message)); }
  finally { btn.disabled = false; }
});

/* ---------- Pings & Erinnerung (eigene Speicherung, unabhängig vom Senden) ---------- */
let pingIds = [];

function drawPings(roles) {
  $('#pingRoles').innerHTML = roles.map(r => `
    <input type="checkbox" class="btn-check" id="pr${r.id}" value="${r.id}" ${pingIds.includes(r.id) ? 'checked' : ''} autocomplete="off">
    <label class="btn btn-outline-light btn-sm" for="pr${r.id}"><span class="dot me-1 d-inline-block" style="background:${r.color};width:8px;height:8px"></span>@${esc(r.name)}</label>`).join('');
  const names = Object.fromEntries(roles.map(r => [r.id, r.name]));
  const paint = () => {
    pingIds = $$('#pingRoles .btn-check:checked').map(c => c.value);
    $('#pv_ping').innerHTML = pingIds.map(id => `<span class="ping">@${esc(names[id] || 'Rolle')}</span>`).join(' ');
  };
  $('#pingRoles').addEventListener('change', paint);
  paint();
}

$('#saveSettings').onclick = async () => {
  try {
    await apiFetch('/api/streamplan/settings', 'PUT', {
      ping_roles: pingIds,
      reminder: { enabled: $('#remOn').checked, minutes: +$('#remMin').value },
    });
    toast('Pings & Erinnerung gespeichert');
  } catch (err) { toastError(esc(err.message)); }
};

(async () => {
  try {
    const [saved, roles] = await Promise.all([apiFetch('/api/streamplan'), apiFetch('/api/roles')]);
    restore(saved);
    pingIds = saved.ping_roles || [];
    $('#remOn').checked = !!saved.reminder?.enabled;
    if (saved.reminder?.minutes) $('#remMin').value = saved.reminder.minutes;
    drawPings(roles);
  } catch (err) { toastError(esc(err.message)); }
})();
