const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* =========================================================
   NAVIGATION
   ========================================================= */

const NAV = [
    { href: 'index.html', label: 'Übersicht' },
    { label: 'Stream', items: [
        ['streamplan.html', 'Streamplan'],
        ['ankuendigung.html', 'Ankündigung'],
    ]},
    { label: 'Nachrichten', items: [
        ['embeded-wardogs.html', 'Wardogs Code'],
        ['embeded-sonstige.html', 'Sonstige'],
    ]},
    { label: 'Rollen', items: [
        ['join-roles.html', 'Join Roles'],
        ['select-roles.html', 'Select Roles'],
    ]},
    { href: 'todos.html', label: 'Todos' },
    { label: 'Admin', danger: true, items: [
        ['admin-timeout.html', 'Timeout'],
        ['admin-kick.html', 'Kick'],
        ['admin-ban.html', 'Ban'],
        ['admin-delete.html', 'Delete'],
    ]},
];

// Alle Hrefs aus NAV in einer flachen Liste, u.a. um zu pruefen, ob ein
// Dropdown den aktuell aktiven Eintrag enthaelt.
function navRender(cur) {
    return NAV.map(entry => {
        if (!entry.items) {
            return `<li class="nav-item"><a class="nav-link ${entry.href === cur ? 'active' : ''}" href="${entry.href}">${entry.label}</a></li>`;
        }
        const hasActive = entry.items.some(([h]) => h === cur);
        return `
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle ${hasActive ? 'active' : ''} ${entry.danger ? 'nav-danger' : ''}" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">${entry.label}</a>
          <ul class="dropdown-menu ${entry.danger ? 'dropdown-menu-danger' : ''}">
            ${entry.items.map(([h, n]) => `<li><a class="dropdown-item ${h === cur ? 'active' : ''}" href="${h}">${n}</a></li>`).join('')}
          </ul>
        </li>`;
    }).join('');
}

function renderHeader(user) {
    const cur = location.pathname.split('/').pop() || 'index.html';

    $('#app-header').outerHTML = `
      <nav class="navbar navbar-expand-lg sticky-top app-nav">
        <div class="container">
          <a class="navbar-brand" href="index.html">
            <img src="img/MedicOnFire_Logo.png" alt="MedicOnFire Logo" width="32" height="32" class="d-inline-block align-text-top">
            MedicOnFire
          </a>

          <button class="navbar-toggler border-0"
                  data-bs-toggle="collapse"
                  data-bs-target="#nav"
                  aria-label="Menü">
              <span class="navbar-toggler-icon"></span>
          </button>

          <div class="collapse navbar-collapse" id="nav">
            <ul class="navbar-nav me-auto gap-1 py-3 py-lg-0">
              ${navRender(cur)}
            </ul>

            <div class="d-flex align-items-center gap-2" id="userBox">
                <div class="avatar">
                    ${
                        user.avatar
                            ? `<img src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64" alt="Profilbild">`
                            : esc(user.username[0].toUpperCase())
                    }
                </div>
                <span class="fw-semibold">${esc(user.username)}</span>
                <button class="btn btn-outline-light btn-sm" id="logoutBtn">
                    Abmelden
                </button>
            </div>
          </div>
        </div>
      </nav>`;

    $('#logoutBtn').onclick = () => {
        fetch('/auth/logout', {
            method: 'POST',
            credentials: 'include'
        })
        .then(() => {
            location.href = 'login.html';
        });
    };
}

function toast(msg) {
    let c = $('#toasts');
    if (!c) {
        c = document.createElement('div');
        c.id = 'toasts';
        c.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.append(c);
    }
    const t = document.createElement('div');
    t.className = 'toast border-0 text-bg-primary';
    t.innerHTML = `<div class="toast-body fw-semibold">${msg}</div>`;
    c.append(t);
    t.addEventListener('hidden.bs.toast', () => t.remove());
    new bootstrap.Toast(t, { delay: 2500 }).show();
}

const esc = s => s.replace(/[&<>"]/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
} [c]));

// Alle Formulare mit data-demo: Daten einsammeln und in der Konsole zeigen.
function bindForms() {
    $$('form[data-demo]').forEach(f => f.addEventListener('submit', e => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(f));
        console.log('Formulardaten:', data);
        toast(f.dataset.demo);
    }));
}

/* =========================================================
   API (FastAPI-Backend, siehe bot/web/server.py)
   ========================================================= */

async function apiFetch(path, method = 'GET', body) {
    const res = await fetch(path, {
        method,
        credentials: 'include',
        headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401) {
        location.href = 'login.html?next=' + encodeURIComponent(location.pathname);
        throw new Error('Nicht eingeloggt');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const d = data.detail;
        throw new Error(typeof d === 'string' ? d : Array.isArray(d) ? 'Ungültige Eingabe: ' + d.map(x => x.loc.at(-1)).join(', ') : 'Anfrage fehlgeschlagen');
    }
    return data;
}

// <select> mit den Textkanälen des Servers füllen.
async function fillChannels(select, selected) {
    const channels = await apiFetch('/api/channels');
    select.innerHTML = channels.map(c => `<option value="${c.id}">#${esc(c.name)}</option>`).join('');
    if (selected) select.value = selected;
}

/* =========================================================
   ZUGANGSSCHUTZ
   ========================================================= */

fetch('/auth/me', { credentials: 'include' })
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(data => {
        renderHeader(data.user);
        bindForms();
        document.documentElement.style.visibility = 'visible';
    })
    .catch(() => {
        location.href = 'login.html?next=' + encodeURIComponent(location.pathname);
    });