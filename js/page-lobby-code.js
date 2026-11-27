/* Logik für lobby-code.html (Wardogs-Code) */
const API = '/api/wardogs-code';
const STALE_AFTER_MS = 1 * 3600 * 1000; // wie STALE_AFTER_HOURS in bot/cogs/wardogs.py
let current = null;

function ago(iso) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso)) / 1000));
  if (s < 60) return 'gerade eben';
  const m = Math.floor(s / 60);
  if (m < 60) return `vor ${m} ${m === 1 ? 'Minute' : 'Minuten'}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} ${h === 1 ? 'Stunde' : 'Stunden'}`;
  const d = Math.floor(h / 24);
  return `vor ${d} ${d === 1 ? 'Tag' : 'Tagen'}`;
}

function drawCurrent() {
  const box = $('#current');
  if (!current || !current.code) {
    box.innerHTML = 'Noch kein Code hinterlegt.';
    return;
  }
  const age = Date.now() - new Date(current.updated_at);
  const stale = age > STALE_AFTER_MS;
  const expired = current.expire_hours && age >= current.expire_hours * 3600 * 1000;
  box.innerHTML = `
    <div class="fs-3 fw-bold text-body mb-1" style="font-family:monospace${expired ? ';text-decoration:line-through;opacity:.5' : ''}">${esc(current.code)}</div>
    <div class="${expired ? 'text-danger' : stale ? 'text-warning' : ''}">${expired ? 'Abgelaufen – !wardogs zeigt ihn nicht mehr. ' : stale ? '⚠️ ' : ''}Gesetzt ${ago(current.updated_at)}${current.updated_by ? ' von ' + esc(current.updated_by.username) : ''}</div>
    <button class="btn btn-outline-light btn-sm mt-3" id="clearBtn">Code löschen</button>`;
  $('#clearBtn').onclick = clearCode;
}

const api = (method, body) => apiFetch(API, method, body);

async function load() {
  try {
    current = await api('GET');
    drawCurrent();
  } catch (e) {
    $('#current').textContent = 'Konnte den Code nicht laden.';
  }
}

async function clearCode() {
  try {
    current = await api('DELETE');
    drawCurrent();
    toast('Code gelöscht');
  } catch (e) { toastError(esc(e.message)); }
}

$('#codeForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = $('#saveBtn');
  btn.disabled = true;
  try {
    current = await api('PUT', { code: $('#code').value });
    $('#code').value = '';
    drawCurrent();
    toast('Code gespeichert – !wardogs zeigt ihn jetzt an');
  } catch (err) {
    toastError(esc(err.message));
  } finally {
    btn.disabled = false;
  }
});

$('#expire').addEventListener('change', async e => {
  try {
    current = await apiFetch(API + '/expire', 'PUT', { hours: +e.target.value });
    drawCurrent();
    toast(+e.target.value ? `Code läuft jetzt nach ${e.target.selectedOptions[0].text} ab` : 'Code läuft nicht mehr automatisch ab');
  } catch (err) { toastError(esc(err.message)); }
});

load().then(() => { $('#expire').value = String(current?.expire_hours || 0); });
setInterval(drawCurrent, 30000); // "vor X Minuten" aktuell halten
