/* Logik für streamplan.html */
const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const MODES = [['off', 'Pause'], ['spontan', 'Spontan'], ['plan', 'Geplant']];
const NO_TITLE = 'Spontan'; // steht da, wenn bei "Geplant" kein Titel eingetragen ist

$('#days').innerHTML = DAYS.map((d, i) => `
  <div class="day row g-2 align-items-center py-3 border-bottom">
    <div class="col-12 d-flex align-items-center gap-2">
        <span class="fw-semibold flex-none" style="width:5.8rem">${d}</span>
        <div class="btn-group btn-group-sm mode-group" role="group" aria-label="${d}">
          ${MODES.map(([v, label]) => `
            <input type="radio" class="btn-check" name="mode${i}" id="m${v}${i}" value="${v}" ${v === 'off' ? 'checked' : ''}>
            <label class="btn btn-outline-light" for="m${v}${i}">${label}</label>`).join('')}
        </div>
    </div>
    <div class="col-4 col-md-3">
        <input type="time" class="form-control" name="time${i}" aria-label="Uhrzeit ${d}">
    </div>
    <div class="col-8 col-md-9">
        <input class="form-control" name="title${i}" placeholder="Titel oder Spiel" aria-label="Titel ${d}">
    </div>
  </div>`).join('');

const modeOf = r => $('input[type=radio]:checked', r).value;

function planLines() {
  return $$('.day').map((r, i) => {
    const mode = modeOf(r), [t, ti] = $$('input.form-control', r).map(x => x.value.trim());
    if (mode === 'spontan') return `${DAYS[i]}: Spontan${ti ? ' – ' + ti : ''}`;
    if (mode === 'plan') return `${DAYS[i]}: ${t ? t + ' Uhr – ' : ''}${ti || NO_TITLE}`;
    return `${DAYS[i]}: Pause`;
  }).join('\n');
}

function updateStreamplan() {
  $$('.day').forEach(r => {
    const mode = modeOf(r), time = $('input[type=time]', r), title = $('input[name^=title]', r);
    r.classList.toggle('on', mode !== 'off');
    time.disabled = mode !== 'plan';      // bei "Spontan" gibt es keine feste Uhrzeit
    time.required = mode === 'plan';      // Browser meldet halb ausgefüllte Uhrzeit (--:30) statt leer zu senden
    title.disabled = mode === 'off';
    title.placeholder = mode === 'plan' ? `Titel oder Spiel (leer = ${NO_TITLE})` : 'Titel oder Spiel (optional)';
  });
  $('#pv_title').textContent = $('#ptitle').value;
  $('#pv_lines').textContent = planLines();
  $('#pv_foot').textContent = $('#pfoot').value;
}

const form = $('#planForm');
form.addEventListener('input', () => {
  updateStreamplan();
  const e = $('#pv_embed'); // kurz aufleuchten, damit man sieht, was sich ändert
  e.classList.remove('flash'); void e.offsetWidth; e.classList.add('flash');
});
updateStreamplan();

/* Anbindung an den Bot: Vorschau wird genau so als Embed gepostet */
function restore(saved) {
  if (saved.form) {
    $('#replace').checked = false; // FormData enthält nur angehakte Checkboxen
    $$('input[type=radio][value=off]', form).forEach(c => { c.checked = true; });
    Object.entries(saved.form).forEach(([k, v]) => {
      const old = k.match(/^on(\d)$/); // älteres Format: Schalter an = geplant
      if (old) { k = 'mode' + old[1]; v = 'plan'; }
      const el = form.elements[k];
      if (!el) return;
      if (el.type === 'checkbox') el.checked = true;
      else el.value = v; // klappt auch für Radio-Gruppen
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
    restore(await apiFetch('/api/streamplan'));
  } catch (e) { toastError(esc(e.message)); }
})();

form.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = $('#sendBtn');
  btn.disabled = true;
  try {
    const saved = await apiFetch('/api/streamplan', 'POST', {
      title: $('#ptitle').value,
      lines: planLines(),
      footer: $('#pfoot').value,
      replace: $('#replace').checked,
      form: Object.fromEntries(new FormData(form)),
    });
    restore(saved);
    toast('Streamplan in Discord gesendet');
  } catch (err) { toastError(esc(err.message)); }
  finally { btn.disabled = false; }
});
