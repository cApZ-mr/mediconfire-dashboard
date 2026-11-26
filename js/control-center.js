document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("control-center");

  if (!container) {
    return;
  }

  /* =========================================================
     BEREICHE (11 Arme)
     ========================================================= */

  const areas = [
    {
      icon: "◷",
      title: "Streamplan",
      description: "Wochenplan mit Zeiten und Titeln anpassen.",
      value: "Mo · 19:00",
      link: "streamplan.html",
    },
    {
      icon: "◆",
      title: "Ankündigung",
      description: "Text und Ping für die Stream-Ankündigung festlegen.",
      value: "Bereit",
      link: "ankuendigung.html",
    },
    {
      icon: "◈",
      title: "Wardogs Nachrichten",
      description: "Embed-Nachrichten für den Wardogs-Bereich bearbeiten.",
      value: "2 Embeds",
      link: "embeded-wardogs.html",
    },
    {
      icon: "◇",
      title: "Sonstige",
      description: "Sonstige Embed-Nachrichten bearbeiten.",
      value: "1 Embed",
      link: "embeded-sonstige.html",
    },
    {
      icon: "◎",
      title: "Join Roles",
      description: "Rollen, die neue Mitglieder automatisch beim Beitritt bekommen.",
      value: "3 aktiv",
      link: "join-roles.html",
    },
    {
      icon: "⊙",
      title: "Select Roles",
      description: "Rollen, die sich Mitglieder selbst zuweisen können.",
      value: "4 aktiv",
      link: "select-roles.html",
    },
    {
      icon: "✓",
      title: "Todos",
      description: "Aufgaben, die noch auf dich oder dein Team warten.",
      value: "2 offen",
      link: "todos.html",
    },
    {
      icon: "◐",
      title: "Timeout",
      description: "Ein Mitglied vorübergehend stummschalten.",
      value: "Mod-Aktion",
      link: "admin-timeout.html",
      danger: true,
    },
    {
      icon: "⊘",
      title: "Kick",
      description: "Ein Mitglied vom Server entfernen.",
      value: "Mod-Aktion",
      link: "admin-kick.html",
      danger: true,
    },
    {
      icon: "⊗",
      title: "Ban",
      description: "Ein Mitglied dauerhaft sperren.",
      value: "Mod-Aktion",
      link: "admin-ban.html",
      danger: true,
    },
    {
      icon: "✖",
      title: "Delete",
      description: "Eine Nachricht löschen.",
      value: "Mod-Aktion",
      link: "admin-delete.html",
      danger: true,
    },
  ];

  const nodesHtml = areas
    .map(
      (a, i) => `
                <button
                    class="control-center-node node-slot-${i + 1}${a.danger ? " node-danger" : ""}"
                    data-title="${a.title}"
                    data-description="${a.description}"
                    data-value="${a.value}"
                    ${a.link ? `data-link="${a.link}"` : ""}
                >

                    <span class="node-icon">${a.icon}</span>

                    <span class="node-content">

                        <strong>${a.title}</strong>

                        <small>${a.value}</small>

                    </span>

                    <span class="node-status${a.online ? " online" : ""}"></span>

                </button>`
    )
    .join("");

  /* =========================================================
    CONTROL CENTER
    ========================================================= */

  container.innerHTML = `

        <section class="control-center">

            <div class="control-center-header">

                <div><span class="control-center-eyebrow">CONTROL CENTER</span></div>
                <span class="control-center-hint">Klicke auf einen Bereich</span>

            </div>


            <div class="control-center-map">


                <!-- =====================================================
                     VERBINDUNGSLINIEN (11 Arme, im Uhrzeigersinn ab 12 Uhr)
                ====================================================== -->

                <svg class="control-center-lines" viewBox="0 0 1000 600" preserveAspectRatio="none">

                    <line x1="500" y1="300" x2="500" y2="90" />

                    <line x1="500" y1="300" x2="705.4" y2="123.3" />

                    <line x1="500" y1="300" x2="845.6" y2="212.8" />

                    <line x1="500" y1="300" x2="876.1" y2="329.9" />

                    <line x1="500" y1="300" x2="787.2" y2="437.5" />

                    <line x1="500" y1="300" x2="607" y2="501.5" />

                    <line x1="500" y1="300" x2="393" y2="501.5" />

                    <line x1="500" y1="300" x2="212.8" y2="437.5" />

                    <line x1="500" y1="300" x2="123.9" y2="329.9" />

                    <line x1="500" y1="300" x2="154.4" y2="212.8" />

                    <line x1="500" y1="300" x2="294.6" y2="123.3" />

                </svg>


                <!-- =====================================================
                     ARME (aus dem areas-Array oben gerendert)
                ====================================================== -->

                ${nodesHtml}


                <!-- =====================================================
                     MEDICONFIRE ZENTRUM (klickbar → Aktualisieren)
                ====================================================== -->

                <div
                    class="control-center-core"
                    role="button"
                    tabindex="0"
                    aria-label="Aktualisieren"
                >

                    <div class="core-orbit orbit-one"></div>

                    <div class="core-orbit orbit-two"></div>

                    <strong>
                        MedicOnFire
                    </strong>

                    <span>

                        <i></i>

                        <em class="core-status-text">Online</em>

                    </span>

                </div>


                <!-- =====================================================
                     DETAIL PANEL
                ====================================================== -->

                <div
                    class="control-center-detail"
                    id="controlCenterDetail"
                >

                    <button
                        class="detail-close"
                        type="button"
                        aria-label="Schließen"
                    >
                        ×
                    </button>


                    <span class="detail-label">
                        DETAIL
                    </span>


                    <h3 id="detailTitle">
                        MedicOnFire
                    </h3>


                    <p id="detailDescription">
                        Wähle einen Bereich aus.
                    </p>


                    <div
                        class="detail-value"
                        id="detailValue"
                    >
                        ● Online
                    </div>


                    <a
                        id="detailLink"
                        class="detail-action"
                        href="#"
                        style="display: none;"
                    >

                        Öffnen

                        <span>
                            →
                        </span>

                    </a>

                </div>


            </div>

        </section>

    `;

  /* =========================================================
    ELEMENTE
    ========================================================= */

  const map = container.querySelector(".control-center-map");

  const nodes = container.querySelectorAll(".control-center-node");

  const core = container.querySelector(".control-center-core");

  const coreText = container.querySelector(".core-status-text");

  const detail = container.querySelector("#controlCenterDetail");

  const detailTitle = container.querySelector("#detailTitle");

  const detailDescription = container.querySelector("#detailDescription");

  const detailValue = container.querySelector("#detailValue");

  const detailLink = container.querySelector("#detailLink");

  const detailClose = container.querySelector(".detail-close");

  const hint = container.querySelector(".control-center-hint");

  /* =========================================================
    PULS-LINIEN (Kopie jeder Linie, wandert beim Aktualisieren
    vom Core zum jeweiligen Punkt)
    ========================================================= */

  const linesSvg = container.querySelector(".control-center-lines");

  const baseLines = Array.from(linesSvg.querySelectorAll("line"));

  baseLines.forEach((line, i) => {
    const pulse = line.cloneNode(true);

    pulse.classList.add("pulse-line");
    pulse.setAttribute("pathLength", "1");
    pulse.style.setProperty("--i", i);

    linesSvg.appendChild(pulse);
  });

  nodes.forEach((node, i) => {
    node.style.setProperty("--i", i);
  });

  /* =========================================================
    NODE KLICK
    ========================================================= */

  nodes.forEach((node) => {
    node.addEventListener("click", () => {
      const title = node.dataset.title;

      const description = node.dataset.description;

      const value = node.dataset.value;

      const link = node.dataset.link;

      detailTitle.textContent = title;

      detailDescription.textContent = description;

      detailValue.textContent = value;

      if (link) {
        detailLink.href = link;

        detailLink.style.display = "inline-flex";
      } else {
        detailLink.style.display = "none";
      }

      detail.classList.add("active");
    });
  });

  /* =========================================================
    DETAIL SCHLIESSEN
    ========================================================= */

  detailClose.addEventListener("click", () => {
    detail.classList.remove("active");
  });

  /* =========================================================
    AUSSERHALB KLICKEN
    ========================================================= */

  document.addEventListener("click", (event) => {
    if (
      detail.classList.contains("active") &&
      !detail.contains(event.target) &&
      !event.target.closest(".control-center-node")
    ) {
      detail.classList.remove("active");
    }
  });

  /* =========================================================
    ECHTE DATEN VOM BOT (/api/overview)
    ========================================================= */

  let onlineText = "Online";

  const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

  // Nächster eingeschalteter Tag aus dem gespeicherten Streamplan-Formular
  function nextStream(form) {
    if (!form) return null;
    const now = new Date();
    const today = (now.getDay() + 6) % 7; // 0 = Montag
    const hhmm = now.toTimeString().slice(0, 5);
    for (let k = 0; k < 8; k++) {
      const d = (today + k) % 7;
      const time = form[`time${d}`] || "";
      if (form[`on${d}`] && (k > 0 || time >= hhmm)) {
        return `${k === 0 ? "Heute" : WEEKDAYS[d]}${time ? ", " + time : ""}`;
      }
    }
    return null;
  }

  function setNode(title, value) {
    const node = container.querySelector(`.control-center-node[data-title="${title}"]`);
    if (!node) return;
    node.dataset.value = value;
    node.querySelector("small").textContent = value;
  }

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  async function loadOverview() {
    const o = await apiFetch("/api/overview");
    const stream = nextStream(o.streamplan && o.streamplan.form);
    const ann = o.announcement || {};

    onlineText = o.bot_online ? "Online" : "Offline";
    if (!map.classList.contains("is-refreshing")) coreText.textContent = onlineText;
    setText("botState", o.bot_online ? "Bot online" : "Bot offline");
    document.getElementById("botDot")?.classList.toggle("online", o.bot_online);
    document.getElementById("botDot")?.classList.toggle("offline", !o.bot_online);
    document.getElementById("botPill")?.classList.toggle("is-online", o.bot_online);
    document.getElementById("botPill")?.classList.toggle("is-offline", !o.bot_online);

    setText("statStream", stream || "Kein Plan");
    const count = (id, n) => { const el = document.getElementById(id); if (el) countTo(el, n); };
    count("statGuilds", o.guilds);
    count("statTodos", o.open_todos);
    count("statJoin", o.join_roles);

    setText("tagStream", stream || "");
    setText("tagAnn", !ann.channel_id ? "" : ann.auto ? "Automatisch" : "Aus");
    setText("tagWardogs", o.wardogs && o.wardogs.code ? o.wardogs.code : "");
    setText("tagJoin", `${o.join_roles} aktiv`);
    setText("tagTodos", `${o.open_todos} offen`);

    setNode("Streamplan", stream || "Kein Plan");
    setNode("Ankündigung", !ann.channel_id ? "Standard" : ann.auto ? "Automatisch" : "Aus");
    setNode("Wardogs Nachrichten", o.wardogs && o.wardogs.code ? `Code: ${o.wardogs.code}` : "Kein Code");
    setNode("Sonstige", "Bald");
    setNode("Join Roles", `${o.join_roles} aktiv`);
    setNode("Select Roles", "Bald");
    setNode("Todos", `${o.open_todos} offen`);
  }

  loadOverview().catch((e) => toastError(esc(e.message)));

  /* =========================================================
    CORE KLICK → AKTUALISIEREN
    ========================================================= */

  let refreshing = false;

  function runSimpleRefresh() {
    if (refreshing) return;
    refreshing = true;

    detail.classList.remove("active");
    map.classList.add("is-refreshing");
    coreText.textContent = "Aktualisiere…";

    setTimeout(() => {
      map.classList.remove("is-refreshing");
      map.classList.add("is-done");
      coreText.textContent = "Aktualisiert";

      const time = new Date().toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
      });

      hint.textContent = `Zuletzt aktualisiert: ${time} Uhr`;

      setTimeout(() => {
        map.classList.remove("is-done");
        coreText.textContent = onlineText;
        refreshing = false;
      }, 2400);
    }, 1800);
  }

  /* =========================================================
    AUFWENDIGE SEQUENZ
    1) Alle Bereiche werden in die Mitte eingezogen
    2) Der Core zündet (Shockwave), die Bereiche fahren wieder raus
    3) Wenn alle auf Position sind, fahren die Linien langsam aus
    4) Zum Schluss läuft die grüne "Aktualisiert"-Welle
    ========================================================= */

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Timing (in ms) – hier kannst du alles anpassen
  const IN_DUR = 800;        // Dauer pro Bereich beim Einziehen
  const IN_STAGGER = 55;     // Versatz zwischen den Bereichen (rein)
  const HOLD = 350;          // Pause, wenn alles im Core ist
  const OUT_DUR = 1000;      // Dauer pro Bereich beim Rausfahren
  const OUT_STAGGER = 60;    // Versatz zwischen den Bereichen (raus)
  const GAP = 350;           // Pause, bevor die Linien starten
  const LINE_DUR = 1400;     // Dauer pro Linie
  const LINE_STAGGER = 90;   // Versatz zwischen den Linien

  const nodeList = Array.from(nodes);
  const count = nodeList.length;

  const outStart = IN_DUR + IN_STAGGER * (count - 1) + HOLD;
  const outEnd = outStart + OUT_DUR + OUT_STAGGER * (count - 1);
  const lineStart = outEnd + GAP;
  const lineEnd = lineStart + LINE_DUR + LINE_STAGGER * (count - 1);

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  // leichtes Ausholen nach außen, dann schneller Sog nach innen
  const easeInBack = (u) => {
    const c1 = 0.8;
    return (c1 + 1) * u * u * u - c1 * u * u;
  };

  // federndes Ankommen mit kleinem Überschwingen
  const easeOutBack = (u) => {
    const c1 = 1.4;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
  };

  const easeInOutCubic = (u) =>
    u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;

  const lineTargets = baseLines.map((l) => ({
    x: parseFloat(l.getAttribute("x2")),
    y: parseFloat(l.getAttribute("y2")),
  }));

  // leuchtende Spitze, die vorne an jeder Linie mitwandert
  const heads = baseLines.map(() => {
    const h = document.createElement("span");
    h.className = "line-head";
    map.appendChild(h);
    return h;
  });

  // Abstand jedes Bereichs zur Mitte (in px)
  function measure() {
    const c = core.getBoundingClientRect();
    const cx = c.left + c.width / 2;
    const cy = c.top + c.height / 2;

    return nodeList.map((node) => {
      const r = node.getBoundingClientRect();
      return {
        dx: cx - (r.left + r.width / 2),
        dy: cy - (r.top + r.height / 2),
      };
    });
  }

  // p = 1 → Bereich auf Position, p = 0 → Bereich im Core
  function nodeProgress(i, t) {
    if (t < outStart) {
      const u = clamp((t - i * IN_STAGGER) / IN_DUR);
      return 1 - easeInBack(u);
    }

    const u = clamp((t - outStart - i * OUT_STAGGER) / OUT_DUR);
    return easeOutBack(u);
  }

  function lineProgress(i, t, p) {
    if (t < outStart) return clamp(p); // Linie folgt ihrem Bereich nach innen
    if (t < lineStart) return 0;       // eingefahren, wartet auf alle Bereiche

    return easeInOutCubic(
      clamp((t - lineStart - i * LINE_STAGGER) / LINE_DUR)
    );
  }

  function renderFrame(t, offsets) {
    let charge = 0;

    nodeList.forEach((node, i) => {
      const p = nodeProgress(i, t);
      const pc = clamp(p);
      const o = offsets[i];
      const k = 1 - p;

      charge += 1 - pc;

      const rotation = t < outStart ? -(1 - p) * 180 : -180 - p * 180;
      const scale = 0.15 + 0.85 * pc + (p > 1 ? (p - 1) * 0.4 : 0);

      node.style.translate = `${(o.dx * k).toFixed(2)}px ${(o.dy * k).toFixed(2)}px`;
      node.style.rotate = `${rotation.toFixed(1)}deg`;
      node.style.scale = scale.toFixed(3);
      node.style.opacity = clamp(p / 0.35).toFixed(3);

      // Linie
      const lp = lineProgress(i, t, p);
      const tg = lineTargets[i];
      const ex = 500 + (tg.x - 500) * lp;
      const ey = 300 + (tg.y - 300) * lp;

      baseLines[i].setAttribute("x2", ex.toFixed(2));
      baseLines[i].setAttribute("y2", ey.toFixed(2));

      // leuchtende Spitze (nur beim Ausfahren der Linien)
      const head = heads[i];

      if (t >= lineStart && lp > 0 && lp < 1) {
        head.style.opacity = clamp(Math.min(lp * 10, (1 - lp) * 10)).toFixed(2);
        head.style.left = `${ex / 10}%`;
        head.style.top = `${ey / 6}%`;
      } else {
        head.style.opacity = 0;
      }
    });

    core.style.setProperty("--charge", (charge / count).toFixed(3));
  }

  function shockwave() {
    const size = core.offsetWidth + "px";

    [
      { delay: 0, color: "rgba(255,106,0,.85)", end: 4.4 },
      { delay: 160, color: "rgba(255,255,255,.35)", end: 3.2 },
    ].forEach(({ delay, color, end }) => {
      const ring = document.createElement("div");

      ring.className = "core-shockwave";
      ring.style.width = size;
      ring.style.height = size;
      ring.style.borderColor = color;

      map.appendChild(ring);

      const anim = ring.animate(
        [
          { transform: "translate(-50%, -50%) scale(.9)", opacity: 0.9 },
          { transform: `translate(-50%, -50%) scale(${end})`, opacity: 0 },
        ],
        {
          duration: 1300,
          delay,
          easing: "cubic-bezier(.16, 1, .3, 1)",
          fill: "both",
        }
      );

      anim.onfinish = () => ring.remove();
    });

    core.animate(
      [
        { filter: "brightness(1)" },
        { filter: "brightness(2.2)", offset: 0.25 },
        { filter: "brightness(1)" },
      ],
      { duration: 700, easing: "ease-out" }
    );
  }

  function setUpdatedHint() {
    const time = new Date().toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });

    hint.textContent = `Zuletzt aktualisiert: ${time} Uhr`;
  }

  function finishSequence() {
    nodeList.forEach((node) => {
      node.style.translate = "";
      node.style.rotate = "";
      node.style.scale = "";
      node.style.opacity = "";
    });

    baseLines.forEach((line, i) => {
      line.setAttribute("x2", lineTargets[i].x);
      line.setAttribute("y2", lineTargets[i].y);
    });

    heads.forEach((h) => {
      h.style.opacity = 0;
    });

    core.style.removeProperty("--charge");

    map.classList.remove("is-refreshing");
    map.classList.add("is-done");
    coreText.textContent = "Aktualisiert";

    setUpdatedHint();

    setTimeout(() => {
      map.classList.remove("is-done");
      coreText.textContent = onlineText;
      refreshing = false;
    }, 2400);
  }

  function runSequence() {
    refreshing = true;

    detail.classList.remove("active");

    const offsets = measure();

    map.classList.add("is-refreshing");
    coreText.textContent = "Sammle…";

    let shockFired = false;
    let linesAnnounced = false;

    const start = performance.now();

    function frame(now) {
      const t = now - start;

      renderFrame(t, offsets);

      if (!shockFired && t >= outStart) {
        shockFired = true;
        coreText.textContent = "Lade…";
        shockwave();
      }

      if (!linesAnnounced && t >= lineStart) {
        linesAnnounced = true;
        coreText.textContent = "Verbinde…";
      }

      if (t < lineEnd) {
        requestAnimationFrame(frame);
      } else {
        finishSequence();
      }
    }

    requestAnimationFrame(frame);
  }

  function runRefresh() {
    if (refreshing) return;

    loadOverview().catch((e) => toastError(esc(e.message)));

    if (reduceMotion.matches) {
      runSimpleRefresh();
    } else {
      runSequence();
    }
  }

  core.addEventListener("click", runRefresh);

  core.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      runRefresh();
    }
  });
});