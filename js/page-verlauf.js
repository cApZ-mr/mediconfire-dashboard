/* Logik für verlauf.html */
const KIND_ICON = { message_delete: 'trash', voice: 'microphone', join_leave: 'user-plus' };
let actions = [], serverLog = []; // nicht "history" nennen – das ist schon window.history

const when = iso => new Date(iso).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' });

function drawHistory() {
  const q = $('#histSearch').value.trim().toLowerCase();
  const rows = actions.filter(h => !q || (h.text + ' ' + h.user).toLowerCase().includes(q));
  $('#history').innerHTML = rows.length ? rows.map(h => `
    <div class="list-row align-items-start">
      <span class="tag flex-none">${esc(h.user)}</span>
      <span class="flex-grow-1 min-w-0" style="word-break:break-word">${esc(h.text)}</span>
      <small class="text-secondary flex-none">${when(h.time)}</small>
    </div>`).join('') : '<p class="text-secondary small mb-0">Noch nichts passiert.</p>';
}

function drawServerLog() {
  const kind = $('#logKind').value;
  const rows = serverLog.filter(e => !kind || e.kind === kind);
  $('#serverLog').innerHTML = rows.length ? rows.map(e => `
    <div class="list-row align-items-start">
      <i class="ti ti-${KIND_ICON[e.kind] || 'point'} text-secondary flex-none mt-1" aria-hidden="true"></i>
      <span class="flex-grow-1 min-w-0" style="word-break:break-word">${esc(e.text)}${e.channel_name ? ` <span class="text-secondary">#${esc(e.channel_name)}</span>` : ''}</span>
      <small class="text-secondary flex-none">${when(e.time)}</small>
    </div>`).join('') : '<p class="text-secondary small mb-0">Keine Ereignisse.</p>';
}

$('#histSearch').addEventListener('input', drawHistory);
$('#logKind').addEventListener('change', drawServerLog);

(async () => {
  try {
    actions = await apiFetch('/api/history');
    drawHistory();
  } catch (err) { toastError(esc(err.message)); }
  try {
    serverLog = await apiFetch('/api/server-log');
    drawServerLog();
  } catch { /* nur Admins sehen Server-Ereignisse */ }
})();
