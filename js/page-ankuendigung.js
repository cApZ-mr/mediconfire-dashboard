/* Logik für ankuendigung.html – Aufbau wie bot/live_embed.py */
const annForm = $('#annForm');
const DEFAULT_LIVE = '{name} ist jetzt LIVE auf Twitch!';
const streamer = 'm3diconfire'; // nur für die Vorschau

function updateAnkuendigung() {
  const ping = $('#a_ping').selectedOptions[0];
  $('#pv_ping').innerHTML = ping && ping.value ? `<span class="ping">${esc(ping.text)}</span>` : '';
  $('#pv_live').textContent = ($('#a_live').value || DEFAULT_LIVE).replaceAll('{name}', streamer);
  $('#pv_text').textContent = $('#a_text').value;
  $('#pv_embed').style.borderLeftColor = $('#a_color').value;
  annForm.classList.toggle('opacity-75', !$('#a_auto').checked);
}

annForm.addEventListener('input', () => {
  updateAnkuendigung();
  const e = $('#pv_embed');
  e.classList.remove('flash'); void e.offsetWidth; e.classList.add('flash');
});
updateAnkuendigung();

/* Anbindung an den Bot */
const payload = () => ({
  channel_id: $('#a_channel').value,
  ping: $('#a_ping').value,
  live_text: $('#a_live').value,
  text: $('#a_text').value,
  color: $('#a_color').value,
  auto: $('#a_auto').checked,
});

(async () => {
  try {
    const [saved, roles] = await Promise.all([apiFetch('/api/announcement'), apiFetch('/api/roles')]);
    $('#a_ping').insertAdjacentHTML('beforeend', roles.map(r => `<option value="${r.id}">@${esc(r.name)}</option>`).join(''));
    await fillChannels($('#a_channel'), saved.channel_id);
    if (saved.channel_id) {
      $('#a_ping').value = saved.ping ?? '';
      $('#a_live').value = saved.live_text ?? '';
      $('#a_text').value = saved.text ?? '';
      $('#a_color').value = saved.color || '#9b59b6';
      $('#a_auto').checked = saved.auto !== false;
    }
    updateAnkuendigung();
  } catch (e) { toastError(esc(e.message)); }
})();

annForm.addEventListener('submit', async e => {
  e.preventDefault();
  try {
    await apiFetch('/api/announcement', 'PUT', payload());
    toast($('#a_auto').checked ? 'Gespeichert – gilt beim nächsten Streamstart' : 'Gespeichert – automatische Ankündigung ist aus');
  } catch (err) { toastError(esc(err.message)); }
});

$('#testBtn').onclick = async () => {
  try {
    await apiFetch('/api/announcement/test', 'POST', payload());
    toast('Testnachricht in Discord gesendet');
  } catch (err) { toastError(esc(err.message)); }
};
