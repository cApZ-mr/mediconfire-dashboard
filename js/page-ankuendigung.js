/* Logik für ankuendigung.html */
const annForm = $('#annForm');

function updateAnkuendigung() {
  const g = id => $('#' + id).value;
  const ping = $('#a_ping').selectedOptions[0];
  $('#pv_ping').innerHTML = ping && ping.value ? `<span class="ping">${esc(ping.text)}</span> ` : '';
  $('#pv_title').textContent = g('a_title') || 'Titel';
  $('#pv_text').textContent = g('a_text') || 'Beschreibung';
  $('#pv_link').textContent = g('a_link');
  $('#pv_embed').style.borderLeftColor = g('a_color');
  const t = g('a_time');
  $('#pv_time').textContent = t ? 'Start: ' + new Date(t).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' }) + ' Uhr' : '';
}

annForm.addEventListener('input', updateAnkuendigung);
updateAnkuendigung();

/* Anbindung an den Bot */
const payload = () => ({
  channel_id: $('#a_channel').value,
  ping: $('#a_ping').value,
  title: $('#a_title').value,
  text: $('#a_text').value,
  time: $('#a_time').value,
  link: $('#a_link').value,
  color: $('#a_color').value,
  auto: $('#a_auto').checked,
});

(async () => {
  try {
    const [saved, roles] = await Promise.all([apiFetch('/api/announcement'), apiFetch('/api/roles')]);
    $('#a_ping').insertAdjacentHTML('beforeend', roles.map(r => `<option value="${r.id}">@${esc(r.name)}</option>`).join(''));
    await fillChannels($('#a_channel'), saved.channel_id);
    if (saved.channel_id) {
      $('#a_ping').value = saved.ping;
      ['title', 'text', 'time', 'link', 'color'].forEach(k => { $('#a_' + k).value = saved[k] ?? ''; });
      $('#a_auto').checked = saved.auto;
    }
    updateAnkuendigung();
  } catch (e) { toastError(esc(e.message)); }
})();

annForm.addEventListener('submit', async e => {
  e.preventDefault();
  try {
    await apiFetch('/api/announcement', 'PUT', payload());
    toast('Ankündigung gespeichert – der Bot nutzt sie beim nächsten Live-Start');
  } catch (err) { toastError(esc(err.message)); }
});

$('#testBtn').onclick = async () => {
  try {
    await apiFetch('/api/announcement/test', 'POST', payload());
    toast('Testnachricht in Discord gesendet');
  } catch (err) { toastError(esc(err.message)); }
};
