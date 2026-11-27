/* Logik für embeded-sonstige.html – frei gestaltbares Embed */
const form = $('#embedForm');
const DRAFT_KEY = 'mof-embed-draft';
let fields = []; // [{ name, value, inline }]

// Kleine Discord-Formatierung für die Vorschau: **fett**, *kursiv*, __unterstrichen__, `code`, [Text](Link)
function md(text) {
  return esc(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<u>$1</u>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

const val = id => $('#' + id).value.trim();
const safeUrl = u => (/^https?:\/\//i.test(u) ? u : ''); // nur echte Web-Links in die Vorschau

function data() {
  return {
    channel_id: $('#e_channel').value,
    ping: $('#e_ping').value,
    content: val('e_content'),
    author: val('e_author'),
    title: val('e_title'),
    url: val('e_url'),
    description: $('#e_desc').value,
    color: $('#e_color').value,
    footer: val('e_footer'),
    thumbnail: val('e_thumb'),
    image: val('e_image'),
    timestamp: $('#e_ts').checked,
    fields: fields.filter(f => f.name.trim() && f.value.trim()),
  };
}

function drawFields() {
  $('#fields').innerHTML = fields.length ? fields.map((f, i) => `
    <div class="row g-2 align-items-start mb-2" data-i="${i}">
      <div class="col-md-4"><input class="form-control" data-k="name" value="${esc(f.name)}" placeholder="Name" maxlength="256" aria-label="Feldname"></div>
      <div class="col-md-4"><textarea class="form-control" data-k="value" rows="1" placeholder="Wert" maxlength="1024" aria-label="Feldwert">${esc(f.value)}</textarea></div>
      <div class="col-8 col-md-3 pt-2 text-nowrap">
        <div class="form-check form-switch"><input class="form-check-input" type="checkbox" data-k="inline" id="in${i}" ${f.inline ? 'checked' : ''}><label class="form-check-label small" for="in${i}">Nebeneinander</label></div>
      </div>
      <div class="col-4 col-md-1 text-end"><button class="btn btn-outline-light btn-sm" type="button" data-del aria-label="Feld entfernen"><i class="ti ti-x" aria-hidden="true"></i></button></div>
    </div>`).join('') : '<p class="text-secondary small mb-0">Felder sind kleine Name/Wert-Blöcke, z. B. „Datum“ und „Samstag, 20 Uhr“.</p>';
}

function render() {
  const d = data();
  const ping = $('#e_ping').selectedOptions[0];
  $('#pv_content').innerHTML = (ping && ping.value ? `<span class="ping">${esc(ping.text)}</span> ` : '') + md(d.content);

  const [url, thumb, image] = [d.url, d.thumbnail, d.image].map(safeUrl);
  const title = d.title ? (url ? `<a class="live-title" href="${esc(url)}" target="_blank" rel="noopener">${esc(d.title)}</a>` : `<div class="text-white fw-bold">${esc(d.title)}</div>`) : '';
  const footer = [d.footer && esc(d.footer), d.timestamp && 'heute um ' + new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })].filter(Boolean).join(' • ');
  const empty = !(d.title || d.description || d.fields.length || d.image);

  $('#pv_embed').style.borderLeftColor = d.color;
  $('#pv_embed').innerHTML = empty ? '<span class="text-secondary">Noch leer – trag links einen Titel oder Text ein.</span>' : `
    <div class="live-embed-head">
      <div style="min-width:0">
        ${d.author ? `<div class="small text-white fw-semibold mb-1">${esc(d.author)}</div>` : ''}
        ${title}
        ${d.description ? `<div class="mt-1" style="white-space:pre-line">${md(d.description)}</div>` : ''}
      </div>
      ${thumb ? `<img class="live-thumb" src="${esc(thumb)}" alt="">` : ''}
    </div>
    ${d.fields.length ? `<div class="row g-2 mt-1">${d.fields.map(f => `
      <div class="${f.inline ? 'col-4' : 'col-12'}"><div class="text-white fw-bold small">${esc(f.name)}</div><div class="small" style="white-space:pre-line">${md(f.value)}</div></div>`).join('')}</div>` : ''}
    ${image ? `<img class="w-100 rounded mt-2" src="${esc(image)}" alt="">` : ''}
    ${footer ? `<div class="small mt-2">${footer}</div>` : ''}`;

  $('#descCount').textContent = $('#e_desc').value.length;
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...d, fields }));
}

form.addEventListener('input', e => {
  const row = e.target.closest('[data-i]');
  if (row) {
    const k = e.target.dataset.k;
    fields[+row.dataset.i][k] = k === 'inline' ? e.target.checked : e.target.value;
  }
  render();
});

$('#fields').addEventListener('click', e => {
  if (!e.target.closest('[data-del]')) return;
  fields.splice(+e.target.closest('[data-i]').dataset.i, 1);
  drawFields();
  render();
});

$('#addField').onclick = () => {
  if (fields.length >= 25) return toastError('Discord erlaubt maximal 25 Felder');
  fields.push({ name: '', value: '', inline: false });
  drawFields();
  $('#fields [data-i]:last-child input').focus();
};

$('#resetBtn').onclick = () => {
  const channel = $('#e_channel').value;
  form.reset();
  $('#e_channel').value = channel;
  fields = [];
  drawFields();
  render();
};

form.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = $('#sendBtn');
  btn.disabled = true;
  try {
    await apiFetch('/api/embed', 'POST', data());
    toast('Embed in Discord gesendet');
  } catch (err) { toastError(esc(err.message)); }
  finally { btn.disabled = false; }
});

(async () => {
  const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
  const map = { ping: 'e_ping', content: 'e_content', author: 'e_author', title: 'e_title', url: 'e_url', description: 'e_desc', color: 'e_color', footer: 'e_footer', thumbnail: 'e_thumb', image: 'e_image' };
  try {
    const roles = await apiFetch('/api/roles');
    $('#e_ping').insertAdjacentHTML('beforeend', roles.map(r => `<option value="${r.id}">@${esc(r.name)}</option>`).join(''));
    await fillChannels($('#e_channel'), draft.channel_id);
  } catch (err) { toastError(esc(err.message)); }
  Object.entries(map).forEach(([k, id]) => { if (draft[k] != null) $('#' + id).value = draft[k]; });
  $('#e_ts').checked = !!draft.timestamp;
  fields = Array.isArray(draft.fields) ? draft.fields : [];
  drawFields();
  render();
})();
