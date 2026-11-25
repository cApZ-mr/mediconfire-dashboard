/* Logik für lobby-code.html (Wardogs-Code) */
const API = '/api/wardogs-code';
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
  const stale = Date.now() - new Date(current.updated_at) > 3 * 3600 * 1000;
  box.innerHTML = `
    <div class="fs-3 fw-bold text-body mb-1" style="font-family:monospace">${esc(current.code)}</div>
    <div class="${stale ? 'text-warning' : ''}">${stale ? '⚠️ ' : ''}Gesetzt ${ago(current.updated_at)}${current.updated_by ? ' von ' + esc(current.updated_by.username) : ''}</div>
    <button class="btn btn-outline-light btn-sm mt-3" id="clearBtn">Code löschen</button>`;
  $('#clearBtn').onclick = clearCode;
}

async function api(method, body) {
  const res = await fetch(API, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    location.href = 'login.html?next=' + encodeURIComponent(location.pathname);
    throw new Error('401');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err.detail === 'string' ? err.detail : 'Speichern fehlgeschlagen');
  }
  return res.json();
}

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
  } catch (e) { toast(esc(e.message)); }
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
    toast(esc(err.message));
  } finally {
    btn.disabled = false;
  }
});

load();
setInterval(drawCurrent, 30000); // "vor X Minuten" aktuell halten
