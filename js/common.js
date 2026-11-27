const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* =========================================================
   NAVIGATION
   ========================================================= */

const NAV = [
    { href: 'index.html', label: 'Übersicht', icon: 'layout-dashboard' },
    { label: 'Stream', icon: 'broadcast', items: [
        ['streamplan.html', 'Streamplan', 'calendar-week'],
        ['ankuendigung.html', 'Ankündigung', 'speakerphone'],
    ]},
    { label: 'Nachrichten', icon: 'message', items: [
        ['embeded-wardogs.html', 'Wardogs Code', 'key'],
        ['embeded-sonstige.html', 'Eigenes Embed', 'layout-cards'],
    ]},
    { label: 'Rollen', icon: 'users', items: [
        ['join-roles.html', 'Join Roles', 'user-plus'],
        ['select-roles.html', 'Select Roles', 'hand-click'],
    ]},
    { href: 'todos.html', label: 'Todos', icon: 'checklist' },
    { href: 'verlauf.html', label: 'Verlauf', icon: 'history' },
    { label: 'Admin', icon: 'shield', danger: true, items: [
        ['admin-timeout.html', 'Timeout', 'clock-pause'],
        ['admin-kick.html', 'Kick', 'door-exit'],
        ['admin-ban.html', 'Ban', 'ban'],
        ['admin-delete.html', 'Delete', 'trash'],
    ]},
];

const icon = name => `<i class="ti ti-${name}" aria-hidden="true"></i>`;

function navRender(cur, user) {
    return NAV.filter(e => !e.danger || user.admin).map(entry => {
        if (!entry.items) {
            return `<li class="nav-item"><a class="nav-link ${entry.href === cur ? 'active' : ''}" href="${entry.href}">${icon(entry.icon)}${entry.label}</a></li>`;
        }
        const hasActive = entry.items.some(([h]) => h === cur);
        return `
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle ${hasActive ? 'active' : ''} ${entry.danger ? 'nav-danger' : ''}" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">${icon(entry.icon)}${entry.label}</a>
          <ul class="dropdown-menu ${entry.danger ? 'dropdown-menu-danger' : ''}">
            ${entry.items.map(([h, n, i]) => `<li><a class="dropdown-item d-flex align-items-center gap-2 ${h === cur ? 'active' : ''}" href="${h}">${icon(i)}${n}</a></li>`).join('')}
          </ul>
        </li>`;
    }).join('');
}

// Hintergrund-Pille gleitet zum Eintrag unter der Maus, sonst zum aktiven
function bindNavIndicator() {
    const bar = $('.nav-pills-bar'), ind = $('.nav-ind');
    const links = $$('.nav-pills-bar > .nav-item > .nav-link');
    const moveTo = a => {
        ind.style.opacity = a ? 1 : 0;
        if (a) { ind.style.left = a.parentElement.offsetLeft + a.offsetLeft + 'px'; ind.style.width = a.offsetWidth + 'px'; }
    };
    const home = () => moveTo(links.find(a => a.classList.contains('active')));
    links.forEach(a => a.addEventListener('mouseenter', () => moveTo(a)));
    bar.addEventListener('mouseleave', home);
    window.addEventListener('resize', home);
    document.fonts?.ready.then(home); // Breiten stimmen erst mit geladener Schrift
    home();
}

function renderHeader(user) {
    const cur = location.pathname.split('/').pop() || 'index.html';

    $('#app-header').outerHTML = `
      <nav class="navbar navbar-expand-lg sticky-top app-nav">
        <div class="container">
          <a class="navbar-brand" href="index.html">
            <img src="img/MedicOnFire_Logo.png" alt="MedicOnFire Logo" width="30" height="30">
            MedicOnFire
          </a>

          <button class="navbar-toggler border-0" data-bs-toggle="collapse" data-bs-target="#nav" aria-label="Menü">
              <span class="navbar-toggler-icon"></span>
          </button>

          <div class="collapse navbar-collapse" id="nav">
            <ul class="navbar-nav nav-pills-bar mx-lg-auto gap-1 my-3 my-lg-0">
              <li class="nav-ind" aria-hidden="true"></li>
              ${navRender(cur, user)}
            </ul>

            <div class="d-flex align-items-center gap-2" id="userBox">
                <div class="avatar">
                    ${user.avatar
                        ? `<img src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64" alt="Profilbild">`
                        : esc(user.username[0].toUpperCase())}
                </div>
                <span class="fw-semibold">${esc(user.username)}</span>
                <button class="btn btn-outline-light btn-sm ms-1" id="logoutBtn" title="Abmelden" aria-label="Abmelden">${icon('logout')}</button>
            </div>
          </div>
        </div>
      </nav>`;

    bindNavIndicator();

    $('#logoutBtn').onclick = () => {
        fetch('/auth/logout', { method: 'POST', credentials: 'include' })
            .then(() => { location.href = 'login.html'; });
    };
}

function toast(msg, isError = false) {
    let c = $('#toasts');
    if (!c) {
        c = document.createElement('div');
        c.id = 'toasts';
        c.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.append(c);
    }
    const t = document.createElement('div');
    t.className = 'toast' + (isError ? ' is-error' : '');
    t.setAttribute('role', isError ? 'alert' : 'status');
    t.innerHTML = `<div class="toast-body fw-semibold">${icon(isError ? 'alert-circle' : 'circle-check')}<span>${msg}</span></div>`;
    c.append(t);
    t.addEventListener('hidden.bs.toast', () => t.remove());
    new bootstrap.Toast(t, { delay: isError ? 4500 : 2500 }).show();
}

const toastError = msg => toast(msg, true);

const esc = s => s.replace(/[&<>"]/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
} [c]));

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
   KLEINE ANIMATIONEN
   ========================================================= */

// Zahl von 0 hochzählen (für Statistik-Karten)
function countTo(el, end) {
    if (typeof end !== 'number' || matchMedia('(prefers-reduced-motion: reduce)').matches) {
        el.textContent = end ?? '–';
        return;
    }
    const t0 = performance.now();
    (function step(now) {
        const p = Math.min(1, (now - t0) / 900);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
    })(t0);
}

// Inhalte nacheinander einblenden; Klasse danach entfernen, damit Hover-Effekte wieder greifen
function revealPage() {
    const items = $$('main > *:not(.row):not(form), main .row > [class*="col"], main > form > .row > [class*="col"]');
    items.forEach((el, i) => {
        el.style.setProperty('--d', Math.min(i, 12));
        el.classList.add('reveal');
        el.addEventListener('animationend', () => el.classList.remove('reveal'), { once: true });
    });
}

// Welle beim Klick auf Haupt-Buttons
document.addEventListener('pointerdown', e => {
    const b = e.target.closest('.btn-primary');
    if (!b) return;
    const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height), w = document.createElement('span');
    w.className = 'ripple';
    Object.assign(w.style, { width: s + 'px', height: s + 'px', left: e.clientX - r.left - s / 2 + 'px', top: e.clientY - r.top - s / 2 + 'px' });
    b.append(w);
    setTimeout(() => w.remove(), 600);
});

/* =========================================================
   ZUGANGSSCHUTZ
   ========================================================= */

fetch('/auth/me', { credentials: 'include' })
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(data => {
        document.body.classList.toggle('is-admin', !!data.user.admin);
        if (!data.user.admin && /admin-/.test(location.pathname)) { location.href = 'index.html'; return; } // Server prüft zusätzlich
        renderHeader(data.user);
        const h = new Date().getHours(), g = $('#greeting');
        if (g) g.textContent = `${h < 11 ? 'Guten Morgen' : h < 18 ? 'Hallo' : 'Guten Abend'}, ${data.user.username}`;
        revealPage();
        document.documentElement.style.visibility = 'visible';
    })
    .catch(() => {
        location.href = 'login.html?next=' + encodeURIComponent(location.pathname);
    });