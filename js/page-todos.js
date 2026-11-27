/* Logik für todos.html – gleiche todos.json wie der Bot */
let lists = {};  // { "Listenname": ["Todo", ...] }
let filter = localStorage.getItem('mof-todo-filter') || '';    // '' = alle Listen
let sort = localStorage.getItem('mof-todo-sort') || 'name';
const todosList = $('#todos');

function sortedNames() {
  const names = Object.keys(lists);
  return sort === 'count'
    ? names.sort((a, b) => lists[b].length - lists[a].length || a.localeCompare(b, 'de'))
    : names.sort((a, b) => a.localeCompare(b, 'de'));
}

function drawFilters(names) {
  const total = names.reduce((n, k) => n + lists[k].length, 0);
  const chip = (value, label, n) => `
    <button type="button" class="btn btn-sm ${filter === value ? 'btn-primary' : 'btn-outline-light'}" data-filter="${esc(value)}" aria-pressed="${filter === value}">
      ${esc(label)} <span class="opacity-75">${n}</span>
    </button>`;
  $('#filters').innerHTML = chip('', 'Alle', total) + names.map(n => chip(n, n, lists[n].length)).join('');
  $('#openCount').textContent = total + ' offen';
}

function drawTodos() {
  if (filter && !(filter in lists)) filter = ''; // Liste wurde komplett erledigt
  const names = sortedNames();
  drawFilters(names);
  $('#t_lists').innerHTML = names.map(n => `<option value="${esc(n)}">`).join('');
  $('#sort').value = sort;

  const shown = filter ? [filter] : names;
  todosList.innerHTML = shown.length ? shown.map(name => `
    <section class="card px-4 py-3">
      <div class="d-flex align-items-center gap-2 mb-1">
        <h6 class="mb-0">${esc(name)}</h6>
        <span class="tag">${lists[name].length}</span>
        <span class="small text-secondary ms-auto d-none d-md-inline">!done "${esc(name)}" &lt;Nr.&gt;</span>
      </div>
      ${lists[name].map((t, i) => `
        <div class="list-row">
          <input class="form-check-input mt-0" type="checkbox" data-done data-list="${esc(name)}" data-i="${i}" aria-label="Erledigt">
          <span class="text-secondary small" style="width:1.6rem">${i + 1}.</span>
          <span class="todo-text flex-grow-1" data-text>${esc(t)}</span>
          <button class="btn btn-outline-light btn-sm" data-edit data-list="${esc(name)}" data-i="${i}" aria-label="Bearbeiten"><i class="ti ti-pencil" aria-hidden="true"></i></button>
        </div>`).join('')}
    </section>`).join('')
    : '<div class="card p-4 text-secondary">Nichts zu tun. Trage oben ein neues Todo ein.</div>';
}

async function run(method, body, query = '') {
  try {
    lists = await apiFetch('/api/todos' + query, method, body);
  } catch (err) {
    toastError(esc(err.message));
    lists = await apiFetch('/api/todos').catch(() => lists); // nach Fehler frischen Stand zeigen
  }
  drawTodos();
}

// Bearbeiten direkt in der Zeile: Enter speichert, Esc bricht ab
function startEdit(btn) {
  const row = btn.closest('.list-row'), span = $('[data-text]', row);
  const list = btn.dataset.list, index = +btn.dataset.i;
  const input = document.createElement('input');
  input.className = 'form-control form-control-sm flex-grow-1';
  input.value = lists[list][index];
  input.maxLength = 500;
  span.replaceWith(input);
  input.focus();
  input.select();
  let done = false;
  const finish = save => {
    if (done) return;
    done = true;
    const v = input.value.trim();
    if (save && v && v !== lists[list][index]) run('PUT', { list, index, text: v });
    else drawTodos();
  };
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); finish(true); }
    if (e.key === 'Escape') finish(false);
  });
  input.addEventListener('blur', () => finish(true));
}

todosList.addEventListener('click', e => {
  const el = e.target.closest('[data-done],[data-edit]');
  if (!el) return;
  if ('done' in el.dataset) {
    const list = el.dataset.list, index = +el.dataset.i;
    el.closest('.list-row').classList.add('leaving'); // rausgleiten, dann löschen
    setTimeout(() => run('DELETE', undefined, `?list=${encodeURIComponent(list)}&index=${index}`), 250);
  } else {
    startEdit(el);
  }
});

$('#filters').addEventListener('click', e => {
  const b = e.target.closest('[data-filter]');
  if (!b) return;
  filter = b.dataset.filter;
  localStorage.setItem('mof-todo-filter', filter);
  if (filter) $('#t_list').value = filter; // neues Todo landet in der gefilterten Liste
  drawTodos();
});

$('#sort').addEventListener('change', e => {
  sort = e.target.value;
  localStorage.setItem('mof-todo-sort', sort);
  drawTodos();
});

$('#addTodo').addEventListener('submit', e => {
  e.preventDefault();
  const text = $('#t_text').value.trim(), list = $('#t_list').value.trim();
  if (!text || !list) return;
  run('POST', { list, text });
  $('#t_text').value = '';
});

if (filter) $('#t_list').value = filter;
run('GET');
