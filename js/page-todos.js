/* Logik für todos.html – gleiche todos.json wie der Bot */
let lists = {};  // { "Listenname": ["Todo", ...] }
const todosList = $('#todos');

function drawTodos() {
  const names = Object.keys(lists);
  $('#openCount').textContent = names.reduce((n, k) => n + lists[k].length, 0) + ' offen';
  $('#t_lists').innerHTML = names.map(n => `<option value="${esc(n)}">`).join('');
  todosList.innerHTML = names.length ? names.map(name => lists[name].map((t, i) => `
    <div class="list-row">
      <input class="form-check-input mt-0" type="checkbox" data-done data-list="${esc(name)}" data-i="${i}" aria-label="Erledigt">
      <span class="todo-text flex-grow-1">${esc(t)}</span>
      <span class="badge rounded-pill badge-prio">${esc(name)}</span>
      <button class="btn btn-outline-light btn-sm" data-edit data-list="${esc(name)}" data-i="${i}">Bearbeiten</button>
    </div>`).join('')).join('') : '<p class="text-secondary mb-0">Nichts zu tun. Trage oben ein neues Todo ein.</p>';
}

async function run(method, body, query = '') {
  try {
    lists = await apiFetch('/api/todos' + query, method, body);
  } catch (err) {
    toast(esc(err.message));
    lists = await apiFetch('/api/todos').catch(() => lists); // nach Fehler frischen Stand zeigen
  }
  drawTodos();
}

todosList.addEventListener('click', e => {
  const el = e.target.closest('[data-done],[data-edit]');
  if (!el) return;
  const list = el.dataset.list, index = +el.dataset.i;
  if ('done' in el.dataset) {
    run('DELETE', undefined, `?list=${encodeURIComponent(list)}&index=${index}`);
  } else {
    const v = prompt('Todo bearbeiten', lists[list][index]); // TODO: eigenes Modal
    if (v?.trim()) run('PUT', { list, index, text: v.trim() });
  }
});

$('#addTodo').addEventListener('submit', e => {
  e.preventDefault();
  const text = $('#t_text').value.trim(), list = $('#t_list').value.trim();
  if (!text || !list) return;
  run('POST', { list, text });
  $('#t_text').value = '';
});

run('GET');
