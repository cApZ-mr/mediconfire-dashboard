/* Logik für join-roles.html – gespeichert wird beim Bot (on_member_join) */
let roles = [];          // [{ id, delay, exclude_bots }]
let guildRoles = {};     // id -> { name, color }
const rolesList = $('#roles');

function drawRoles() {
  rolesList.innerHTML = roles.length ? roles.map((r, i) => {
    const g = guildRoles[r.id] || { name: 'Unbekannte Rolle (' + r.id + ')', color: '#99aab5' };
    return `
    <div class="list-row">
      <span class="dot" style="background:${g.color}"></span>
      <div class="flex-grow-1">
        <div class="fw-semibold">@${esc(g.name)}</div>
        <small class="text-secondary">${r.delay ? 'nach ' + r.delay + ' Min.' : 'sofort'}${r.exclude_bots ? ' · ohne Bots' : ''}</small>
      </div>
      <button class="btn btn-outline-light btn-sm" data-del="${i}" aria-label="${esc(g.name)} entfernen">Entfernen</button>
    </div>`;
  }).join('') : '<p class="text-secondary mb-0">Noch keine Join Role. Füge rechts die erste hinzu.</p>';
}

rolesList.addEventListener('click', e => {
  const b = e.target.closest('[data-del]');
  if (b) { roles.splice(+b.dataset.del, 1); drawRoles(); }
});

$('#addRole').addEventListener('submit', e => {
  e.preventDefault();
  const id = $('#r_name').value;
  if (!id) return;
  if (roles.some(r => r.id === id)) return toast('Rolle ist schon in der Liste');
  roles.push({ id, delay: +$('#r_delay').value, exclude_bots: $('#r_bots').checked });
  drawRoles();
});

$('#saveRoles').onclick = async () => {
  try {
    roles = await apiFetch('/api/join-roles', 'PUT', roles);
    drawRoles();
    toast('Join Roles gespeichert – gilt ab dem nächsten Beitritt');
  } catch (err) { toast(esc(err.message)); }
};

(async () => {
  try {
    const [list, saved] = await Promise.all([apiFetch('/api/roles'), apiFetch('/api/join-roles')]);
    list.forEach(r => { guildRoles[r.id] = r; });
    $('#r_name').innerHTML = '<option value="">Rolle wählen</option>'
      + list.map(r => `<option value="${r.id}">${esc(r.name)}</option>`).join('');
    roles = saved;
    drawRoles();
  } catch (e) { toast(esc(e.message)); }
})();
