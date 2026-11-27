/* Logik für admin-*.html – welche Aktion, steht in <body data-action="…"> */
const ACTION = document.body.dataset.action;
let target = null; // ausgewähltes Mitglied

const memberHtml = m => `
  <img src="${esc(m.avatar)}" alt="" width="36" height="36" class="rounded-circle flex-none">
  <div class="min-w-0">
    <div class="fw-semibold text-truncate">${esc(m.display)} ${m.bot ? '<span class="dc-bot">BOT</span>' : ''}</div>
    <div class="small text-secondary text-truncate">@${esc(m.username)}${timeoutText(m)}</div>
  </div>`;

function timeoutText(m) {
  if (!m.timeout_until || new Date(m.timeout_until) < new Date()) return '';
  return ' · <span class="text-warning">im Timeout bis ' + new Date(m.timeout_until).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }) + '</span>';
}

/* ---------- Mitglied suchen ---------- */
function setupPicker() {
  const input = $('#m_search'), box = $('#m_results'), chosen = $('#m_chosen');
  if (!input) return;
  let timer, last = '';

  input.addEventListener('input', () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (!q) { box.innerHTML = ''; return; }
    timer = setTimeout(async () => {
      last = q;
      try {
        const res = await apiFetch('/api/members?q=' + encodeURIComponent(q));
        if (q !== last) return; // langsame alte Antwort ignorieren
        box.innerHTML = res.length
          ? res.map((m, i) => `<button type="button" class="member-item" data-i="${i}">${memberHtml(m)}</button>`).join('')
          : '<div class="small text-secondary p-2">Niemand gefunden.</div>';
        box._results = res;
      } catch (err) { toastError(esc(err.message)); }
    }, 250);
  });

  box.addEventListener('click', e => {
    const b = e.target.closest('[data-i]');
    if (!b) return;
    choose(box._results[+b.dataset.i]);
    box.innerHTML = '';
    input.value = '';
  });

  chosen.addEventListener('click', e => { if (e.target.closest('[data-clear]')) choose(null); });
}

function choose(m) {
  target = m;
  $('#m_chosen').innerHTML = m
    ? `<div class="member-item is-chosen">${memberHtml(m)}<button type="button" class="btn btn-outline-light btn-sm ms-auto" data-clear aria-label="Auswahl entfernen"><i class="ti ti-x" aria-hidden="true"></i></button></div>`
    : '';
  $('#m_search').closest('.picker').classList.toggle('d-none', !!m);
  $('#untimeoutBtn')?.classList.toggle('d-none', !(m && timeoutText(m)));
  $('#actBtn').disabled = !m;
}

/* ---------- Bestätigen + ausführen ---------- */
async function act(path, body, confirmText, doneText) {
  if (!confirm(confirmText)) return null;
  const btn = $('#actBtn');
  btn.disabled = true;
  try {
    const res = await apiFetch(path, 'POST', body);
    if (doneText) toast(doneText);
    return res;
  } catch (err) {
    toastError(esc(err.message));
    return null;
  } finally {
    btn.disabled = !target && ACTION !== 'delete';
  }
}

const reason = () => $('#reason')?.value.trim() || '';

const ACTIONS = {
  timeout() {
    $('#actForm').addEventListener('submit', async e => {
      e.preventDefault();
      const minutes = +$('#duration').value, label = $('#duration').selectedOptions[0].text;
      const m = await act('/api/admin/timeout', { user_id: target.id, name: target.display, minutes, reason: reason() },
        `${target.display} für ${label} stummschalten?`, `${target.display} ist für ${label} im Timeout`);
      if (m) choose(m);
    });
    $('#untimeoutBtn').onclick = async () => {
      const m = await act('/api/admin/timeout', { user_id: target.id, name: target.display, minutes: 0, reason: reason() || 'Timeout aufgehoben' },
        `Timeout von ${target.display} aufheben?`, 'Timeout aufgehoben');
      if (m) choose(m);
    };
  },

  kick() {
    $('#actForm').addEventListener('submit', async e => {
      e.preventDefault();
      const ok = await act('/api/admin/kick', { user_id: target.id, name: target.display, reason: reason() },
        `${target.display} wirklich vom Server kicken?`, `${target.display} wurde gekickt`);
      if (ok) { choose(null); $('#reason').value = ''; }
    });
  },

  ban() {
    const loadBans = async () => {
      try {
        const bans = await apiFetch('/api/admin/bans');
        $('#banCount').textContent = bans.length;
        $('#bans').innerHTML = bans.length ? bans.map(b => `
          <div class="list-row">
            <div class="d-flex align-items-center gap-2 flex-grow-1 min-w-0">${memberHtml(b)}</div>
            <small class="text-secondary text-truncate d-none d-md-block" style="max-width:40%">${esc(b.reason || '')}</small>
            <button class="btn btn-outline-light btn-sm" type="button" data-unban="${b.id}" data-name="${esc(b.display)}">Entbannen</button>
          </div>`).join('') : '<p class="text-secondary small mb-0">Niemand gebannt.</p>';
      } catch (err) { toastError(esc(err.message)); }
    };

    $('#actForm').addEventListener('submit', async e => {
      e.preventDefault();
      const ok = await act('/api/admin/ban', { user_id: target.id, name: target.display, reason: reason(), delete_days: +$('#delDays').value },
        `${target.display} wirklich bannen?`, `${target.display} wurde gebannt`);
      if (ok) { choose(null); $('#reason').value = ''; loadBans(); }
    });

    $('#bans').addEventListener('click', async e => {
      const b = e.target.closest('[data-unban]');
      if (!b || !confirm(`${b.dataset.name} entbannen?`)) return;
      try {
        await apiFetch('/api/admin/bans/' + b.dataset.unban, 'DELETE');
        toast(`${b.dataset.name} wurde entbannt`);
        loadBans();
      } catch (err) { toastError(esc(err.message)); }
    });
    loadBans();
  },

  delete() {
    $('#linkForm').addEventListener('submit', async e => {
      e.preventDefault();
      if (!confirm('Diese Nachricht löschen?')) return;
      try {
        await apiFetch('/api/admin/delete-message', 'POST', { link: $('#msgLink').value.trim() });
        toast('Nachricht gelöscht');
        $('#msgLink').value = '';
      } catch (err) { toastError(esc(err.message)); }
    });

    $('#actForm').addEventListener('submit', async e => {
      e.preventDefault();
      const n = +$('#purgeCount').value, ch = $('#purgeChannel').selectedOptions[0].text;
      const res = await act('/api/admin/purge', { channel_id: $('#purgeChannel').value, count: n },
        `Die letzten ${n} Nachrichten in ${ch} löschen?`, '');
      if (res) toast(`${res.deleted} gelöscht` + (res.skipped_old ? `, ${res.skipped_old} ${res.skipped_old === 1 ? 'war' : 'waren'} älter als 14 Tage und ${res.skipped_old === 1 ? 'blieb' : 'blieben'} stehen` : ''));
    });
    fillChannels($('#purgeChannel')).catch(err => toastError(esc(err.message)));
  },
};

setupPicker();
ACTIONS[ACTION]();
