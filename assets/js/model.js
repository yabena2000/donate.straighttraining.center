// Interactive 3D model of the building, coloured by how much of each phase is funded.
// Geometry comes from the floor plan (floor plan v3 2026-04-22.xlsx): 1 unit = 1 foot,
// x = plot width (0–40), y = plot length from the back wall (0) to the gate (80), z = height.
// Funding per phase is sent by main.js in the "stc:phases" event.
(function () {
  const root = document.querySelector("[data-model]");
  if (!root) return;
  const lang = document.documentElement.lang === "de" ? "de" : "en";

  const T = {
    en: {
      built: "Built", funded: "Funded", partly: "Partly funded", open: "Not yet funded",
      of: (a, b) => `${a} of ${b} funded`, includes: "Includes", hint: "Hover over or tap a part of the building – or pick a phase:",
      phase: "Phase",
    },
    de: {
      built: "Gebaut", funded: "Finanziert", partly: "Teilweise finanziert", open: "Noch nicht finanziert",
      of: (a, b) => `${a} von ${b} finanziert`, includes: "Umfasst", hint: "Fahre über einen Teil des Gebäudes oder tippe darauf – oder wähle eine Phase:",
      phase: "Phase",
    },
  }[lang];

  // [phase, label en, label de, x0, y0, x1, y1, z0, height, kind]
  const W = 6, R = 10, U = 11, UH = 9; // outer wall height, room height, upper floor level, upper room height
  const parts = [
    // 1a – outer wall, gate, foundation
    ["1a", "Foundation", "Fundament", 1, 1, 39, 62, 0, 1, "slab"],
    ["1a", "Gate", "Tor", 1, 79.4, 16, 80, 0, 5, "gate"],
    // 1b – pillars and one large roof
    ["1b", "Roof", "Dach", -0.5, -0.5, 40.5, 64, 21, 0.6, "roof"],
    // 1c – classrooms 1–3, office, toilets, septic tank, well
    ["1c", "Office", "Büro", 7, 29, 23, 43, 1, R],
    ["1c", "Classroom 3", "Klassenzimmer 3", 24, 23, 39, 43, 1, R],
    ["1c", "Classroom 1", "Klassenzimmer 1", 7, 43, 23, 62, 1, R],
    ["1c", "Classroom 2", "Klassenzimmer 2", 24, 43, 39, 62, 1, R],
    ["1c", "Toilets", "Toiletten", 24, 1, 33, 8, 1, R],
    ["1c", "Septic tank", "Klärgrube", 19, 1, 23, 8, 0, 1.5, "tank"],
    ["1c", "Well", "Brunnen", 34, 73, 37, 76, 0, 2.5, "well"],
    // 2 – computer room (classroom 4), security room, stairs
    ["2", "Computer room (classroom 4)", "Computerraum (Klassenzimmer 4)", 1, 1, 18, 16, 1, R],
    ["2", "Security room", "Wachraum", 19, 8, 33, 16, 1, R],
    ["2", "Stairs", "Treppe", 19, 23, 23, 29, 1, R - 1, "stairs"],
    // 3 – upper floor: classrooms 5–7, assembly area, prayer room
    ["3", "Upper floor", "Obergeschoss", 7, 23, 39, 49, U, 0.5, "slab"],
    ["3", "Classroom 5", "Klassenzimmer 5", 8, 49, 18, 62, U, UH],
    ["3", "Classroom 6", "Klassenzimmer 6", 19, 49, 28, 62, U, UH],
    ["3", "Classroom 7", "Klassenzimmer 7", 29, 49, 39, 62, U, UH],
    ["3", "Prayer room", "Gebetsraum", 30, 23, 39, 29, U, UH],
    ["3", "Railing of the assembly area", "Geländer der Versammlungsfläche", 7, 48.4, 30, 49, U + 0.5, 3, "rail"],
    // 4 – volunteer rooms upstairs
    ["4", "Volunteer bedroom", "Zimmer für Freiwillige", 1, 1, 11, 16, U, UH],
    ["4", "Bathroom", "Bad", 12, 1, 21, 6, U, UH],
    ["4", "Bathroom", "Bad", 21, 1, 30, 6, U, UH],
    ["4", "Kitchen & living room", "Küche & Wohnraum", 11, 6, 30, 16, U, UH],
    ["4", "Volunteer bedroom", "Zimmer für Freiwillige", 30, 1, 39, 16, U, UH],
    // 5 – garden
    ["5", "Garden", "Garten", 1, 63, 39, 79, 0, 0.3, "garden"],
    ["5", "Tree", "Baum", 4, 66, 7, 69, 0, 7, "tree"],
    ["5", "Tree", "Baum", 28, 71, 31, 74, 0, 6, "tree"],
  ];
  // Outer wall in short segments so the drawing order stays correct
  const wall = (x0, y0, x1, y1) => parts.push(["1a", "Outer wall", "Außenmauer", x0, y0, x1, y1, 0, W, "wall"]);
  for (let y = 0; y < 80; y += 8) { wall(0, y, 1, Math.min(80, y + 8)); wall(39, y, 40, Math.min(80, y + 8)); }
  for (let x = 1; x < 39; x += 8) wall(x, 0, Math.min(39, x + 8), 1);
  for (let x = 16; x < 39; x += 8) wall(x, 79.4, Math.min(39, x + 8), 80);
  // Roof pillars (phase 1b)
  [[1, 1], [39, 1], [1, 62], [39, 62], [20, 1], [20, 62], [1, 31], [39, 31]].forEach(([x, y]) =>
    parts.push(["1b", "Concrete pillar", "Betonpfeiler", x - 0.6, y - 0.6, x + 0.6, y + 0.6, 0, 21, "pillar"]));

  // Isometric projection, seen from the gate side
  const C = Math.cos(Math.PI / 6), S = 0.5;
  const P = (x, y, z) => [(x - y) * C, (x + y) * S - z];
  const pts = (arr) => arr.map((p) => P(...p).map((v) => v.toFixed(2)).join(",")).join(" ");

  const COLORS = { built: [60, 122, 76], funded: [134, 186, 146], partly: [226, 165, 46], open: [222, 210, 190] };
  const shade = (rgb, k) => `rgb(${rgb.map((v) => Math.round(v * k)).join(",")})`;

  let phases = null, active = null, locked = null;

  function stateOf(ph) {
    if (!ph) return "open";
    if (ph.status === "done") return "built";
    if (ph.funded >= ph.cost - 0.5) return "funded";
    if (ph.funded > 0.5) return "partly";
    return "open";
  }

  function draw() {
    const level = (p) => (p[9] === "roof" ? 3 : p[7] >= U ? 2 : p[9] === "slab" && p[7] === 0 ? 0 : 1);
    const order = parts.slice().sort((a, b) => level(a) - level(b) || (a[3] + a[5] + a[4] + a[6]) - (b[3] + b[5] + b[4] + b[6]));
    let svg = "";
    for (const [ph, en, de, x0, y0, x1, y1, z0, h, kind] of order) {
      const st = stateOf(phases && phases.find((p) => p.id === ph));
      let base = COLORS[st];
      if (kind === "garden" && st === "open") base = [205, 222, 196];
      if (kind === "tree") base = st === "open" ? [176, 204, 168] : [70, 140, 80];
      if (kind === "tank") base = st === "open" ? [200, 190, 178] : shade(base, 0.8).match(/\d+/g).map(Number);
      const z1 = z0 + h;
      const top = pts([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]]);
      const right = pts([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]]);
      const front = pts([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]]);
      const label = lang === "de" ? de : en;
      const roof = kind === "roof";
      // The roof is drawn as a light outline only, so the rooms below keep their colours
      svg += roof
        ? `<g class="m-part m-roof" data-phase="${ph}" data-label="${label}">` +
          `<polygon points="${top}" fill="${shade(base, 1)}" fill-opacity="0.12" stroke="${shade(base, 0.6)}" stroke-width="0.35" stroke-dasharray="1.2 0.8"/></g>`
        : `<g class="m-part" data-phase="${ph}" data-label="${label}">` +
          `<polygon points="${front}" fill="${shade(base, 0.72)}"/>` +
          `<polygon points="${right}" fill="${shade(base, 0.86)}"/>` +
          `<polygon points="${top}" fill="${shade(base, 1)}"/></g>`;
    }
    // viewBox from the plot corners and the roof height
    const c = [P(0, 0, 0), P(40, 0, 0), P(0, 80, 0), P(40, 80, 0), P(0, 0, 22), P(40, 0, 22)];
    const xs = c.map((p) => p[0]), ys = c.map((p) => p[1]);
    const vb = [Math.min(...xs) - 2, Math.min(...ys) - 2, Math.max(...xs) - Math.min(...xs) + 4, Math.max(...ys) - Math.min(...ys) + 4];
    root.querySelector(".m-svg").innerHTML =
      `<svg viewBox="${vb.map((v) => v.toFixed(1)).join(" ")}" role="img" aria-label="${root.dataset.label}" ` +
      `stroke="rgba(35,30,26,.35)" stroke-width="0.12" stroke-linejoin="round">${svg}</svg>`;
  }

  function info(id) {
    const panel = root.querySelector(".m-info");
    const ph = phases && phases.find((p) => p.id === id);
    if (!id || !ph) { panel.innerHTML = `<p class="m-hint">${T.hint}</p>`; return; }
    const li = document.querySelector(`.phase[data-phase="${id}"]`);
    const title = li ? li.querySelector("h3").firstChild.textContent.trim() : "";
    const desc = li ? li.querySelector("h3 + p, div > p").textContent : "";
    const st = stateOf(ph);
    const names = [...new Set(parts.filter((p) => p[0] === id).map((p) => (lang === "de" ? p[2] : p[1])))];
    const pct = Math.max(0, Math.min(100, (ph.funded / ph.cost) * 100));
    panel.innerHTML =
      `<span class="m-badge m-${st}">${T[st]}</span>` +
      `<h3>${T.phase} ${id}: ${title}</h3><p>${desc}</p>` +
      (names.length ? `<p class="m-incl"><b>${T.includes}:</b> ${names.join(", ")}</p>` : "") +
      `<div class="m-bar"><i style="width:${pct}%"></i></div>` +
      `<p class="m-amt">${T.of(ph.fmt(ph.funded), ph.fmtCost)}</p>`;
  }

  function highlight(id) {
    active = id;
    root.querySelectorAll(".m-part").forEach((g) => g.classList.toggle("dim", !!id && g.dataset.phase !== id));
    root.querySelectorAll(".m-chip").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.phase === id)));
    info(id);
  }

  function chips() {
    const box = root.querySelector(".m-chips");
    box.innerHTML = phases
      .filter((p) => parts.some((q) => q[0] === p.id))
      .map((p) => `<button type="button" class="m-chip m-${stateOf(p)}" data-phase="${p.id}" aria-pressed="false">${p.id}</button>`)
      .join("");
  }

  function init(list) {
    phases = list;
    draw(); chips(); info(null);
    const svg = root.querySelector(".m-svg");
    svg.addEventListener("mouseover", (e) => { const g = e.target.closest(".m-part"); if (g && !locked) highlight(g.dataset.phase); });
    svg.addEventListener("mouseleave", () => { if (!locked) highlight(null); });
    svg.addEventListener("click", (e) => {
      const g = e.target.closest(".m-part");
      locked = g && locked !== g.dataset.phase ? g.dataset.phase : null;
      highlight(locked);
    });
    root.querySelector(".m-chips").addEventListener("click", (e) => {
      const b = e.target.closest(".m-chip"); if (!b) return;
      locked = locked === b.dataset.phase ? null : b.dataset.phase;
      highlight(locked);
    });
    root.querySelectorAll("[data-legend]").forEach((el) => (el.textContent = T[el.dataset.legend]));
  }

  if (window.__stcPhases) init(window.__stcPhases);
  else document.addEventListener("stc:phases", (e) => init(e.detail), { once: true });
})();
