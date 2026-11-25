/* Logik für streamplan.html */
const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

$('#days').innerHTML = DAYS.map((d, i) => `
  <div class="day row g-2 align-items-center py-3 border-bottom">
    <div class="col-12 col-md-3">
        <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" name="on${i}" id="on${i}">
            <label class="form-check-label fw-semibold" for="on${i}">${d}</label>
        </div>
    </div>
    <div class="col-5 col-md-3">
        <input type="time" class="form-control" name="time${i}" aria-label="Uhrzeit ${d}">
    </div>
    <div class="col-7 col-md-6">
        <input class="form-control" name="title${i}" placeholder="Titel oder Spiel" aria-label="Titel ${d}">
    </div>
  </div>`).join('');

function updateStreamplan() {
  $$('.day').forEach(r => $$('input.form-control', r).forEach(i => i.disabled = !$('input[type=checkbox]', r).checked));
  const [ci, cc] = [$('#ptitle').value, $('#pfoot').value];
  $('#preview').textContent = `${ci ? '**' + ci + '**\n\n' : ''}` + $$('.day').map((r, i) => {
    const on = $('input[type=checkbox]', r).checked, [t, ti] = $$('input.form-control', r).map(x => x.value);
    return on ? `${DAYS[i]}: ${t} Uhr – ${ti || 'Stream'}` : `${DAYS[i]}: Pause`;
  }).join('\n') + (cc ? '\n\n' + '-# ' + cc : '');
}

const form = $('#planForm');
form.addEventListener('input', updateStreamplan);
updateStreamplan();

/* Anbindung an den Bot: Vorschau-Text wird genau so in Discord gepostet */
function restore(saved) {
  if (saved.form) {
    $$('input[type=checkbox]', form).forEach(c => { c.checked = false; }); // FormData enthält nur angehakte
    Object.entries(saved.form).forEach(([k, v]) => {
      const el = form.elements[k];
      if (!el || k === 'channel') return;
      if (el.type === 'checkbox') el.checked = true;
      else el.value = v;
    });
  }
  if (saved.updated_at) {
    $('#lastSent').textContent = 'Zuletzt gesendet: ' + new Date(saved.updated_at).toLocaleString('de-DE')
      + (saved.updated_by ? ' von ' + saved.updated_by.username : '');
  }
  updateStreamplan();
}

(async () => {
  try {
    const saved = await apiFetch('/api/streamplan');
    await fillChannels($('#channel'), saved.channel_id);
    restore(saved);
  } catch (e) { toast(esc(e.message)); }
})();

form.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = $('#sendBtn');
  btn.disabled = true;
  try {
    const saved = await apiFetch('/api/streamplan', 'POST', {
      channel_id: $('#channel').value,
      content: $('#preview').textContent,
      replace: $('#replace').checked,
      form: Object.fromEntries(new FormData(form)),
    });
    restore(saved);
    toast('Streamplan in Discord gesendet');
  } catch (err) { toast(esc(err.message)); }
  finally { btn.disabled = false; }
});
