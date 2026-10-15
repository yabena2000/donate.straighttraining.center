// Interactive 3D model of the building, coloured by how much of each phase is funded.
// Geometry comes from the floor plan (floor plan v3 2026-04-22.xlsx): 1 unit = 1 foot,
// x = plot width (0–40), y = plot length from the back wall (0) to the gate (80), z = height.
// Rooms are drawn without ceilings, so you can look inside; doors and windows are taken from the plan.
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
  // kind: room (open box with doors/windows), box (solid), slab, wall, gate, roof, pillar, step, garden
  const W = 6, R = 10, U = 11, UH = 9; // outer wall height, room height, upper floor level, upper room height
  const parts = [
    // 1a – outer wall, gate, foundation
    ["1a", "Foundation", "Fundament", 1, 1, 39, 62, 0, 1, "foundation"],
    ["1a", "Gate", "Tor", 1, 79.4, 16, 80, 0, 5, "gate"],
    // 1b – pillars and one large roof
    ["1b", "Roof", "Dach", -0.5, -0.5, 40.5, 64, 21, 0.6, "roof"],
    // 1c – classrooms 1–3, office, toilets, septic tank, well
    ["1c", "Office", "Büro", 7, 29, 23, 43, 1, R, "room"],
    ["1c", "Classroom 3", "Klassenzimmer 3", 24, 23, 39, 43, 1, R, "room"],
    ["1c", "Classroom 1", "Klassenzimmer 1", 7, 43, 23, 62, 1, R, "room"],
    ["1c", "Classroom 2", "Klassenzimmer 2", 24, 43, 39, 62, 1, R, "room"],
    ["1c", "Toilets", "Toiletten", 24, 1, 33, 8, 1, R, "room"],
    ["1c", "Septic tank", "Klärgrube", 19, 1, 23, 8, 0, 1.5, "box"],
    ["1c", "Well", "Brunnen", 34, 73, 37, 76, 0, 2.5, "box"],
    // 2 – computer room (classroom 4), security room, stairs
    ["2", "Computer room (classroom 4)", "Computerraum (Klassenzimmer 4)", 1, 1, 18, 16, 1, R, "room"],
    ["2", "Security room", "Wachraum", 19, 8, 33, 16, 1, R, "room"],
    // 3 – upper floor: classrooms 5–7, assembly area, prayer room
    ["3", "Upper floor", "Obergeschoss", 7, 23, 39, 49, U - 0.5, 0.5, "slab"],
    ["3", "Classroom 5", "Klassenzimmer 5", 8, 49, 18, 62, U, UH, "room"],
    ["3", "Classroom 6", "Klassenzimmer 6", 19, 49, 28, 62, U, UH, "room"],
    ["3", "Classroom 7", "Klassenzimmer 7", 29, 49, 39, 62, U, UH, "room"],
    ["3", "Prayer room", "Gebetsraum", 30, 23, 39, 29, U, UH, "room"],
    ["3", "Railing of the assembly area", "Geländer der Versammlungsfläche", 7, 48.4, 30, 49, U, 3, "box"],
    // 4 – volunteer rooms upstairs
    ["4", "Volunteer bedroom", "Zimmer für Freiwillige", 1, 1, 11, 16, U, UH, "room"],
    ["4", "Bathroom", "Bad", 11, 1, 21, 6, U, UH, "room"],
    ["4", "Bathroom", "Bad", 21, 1, 30, 6, U, UH, "room"],
    ["4", "Kitchen & living room", "Küche & Wohnraum", 11, 6, 30, 16, U, UH, "room"],
    ["4", "Volunteer bedroom", "Zimmer für Freiwillige", 30, 1, 39, 16, U, UH, "room"],
    // 5 – garden
    ["5", "Garden", "Garten", 1, 63, 39, 79, 0, 0.3, "garden"],
  ];
  // Outer wall in short segments so the drawing order stays correct
  const wall = (x0, y0, x1, y1) => parts.push(["1a", "Outer wall", "Außenmauer", x0, y0, x1, y1, 0, W, "wall"]);
  for (let y = 0; y < 80; y += 8) { wall(0, y, 1, Math.min(80, y + 8)); wall(39, y, 40, Math.min(80, y + 8)); }
  for (let x = 1; x < 39; x += 8) wall(x, 0, Math.min(39, x + 8), 1);
  for (let x = 16; x < 39; x += 8) wall(x, 79.4, Math.min(39, x + 8), 80);
  // Roof pillars (phase 1b)
  [[1, 1], [39, 1], [1, 62], [39, 62], [20, 1], [20, 62], [1, 31], [39, 31]].forEach(([x, y]) =>
    parts.push(["1b", "Concrete pillar", "Betonpfeiler", x - 0.6, y - 0.6, x + 0.6, y + 0.6, 0, 21, "pillar"]));
  // Stairs (phase 2): 10 steps rising from the courtyard (y = 29) towards the back (y = 23)
  for (let i = 0; i < 10; i++) {
    const y1 = 29 - i * 0.6;
    parts.push(["2", "Stairs", "Treppe", 19, y1 - 0.6, 23, y1, 0, 1 + (i + 1) * 1.0, "step"]);
  }

  // Doors and windows from the floor plan: [floor, kind, h = wall along x at y / v = wall along y at x, at, from, to]
  const OPENINGS = [["ground","door","v",7,38,42],["ground","door","h",16,12,17],["ground","door","h",16,19,22],["ground","door","h",29,19,22],
    ["ground","door","h",62,19,23],["ground","door","v",24,1,4],["ground","door","h",23,24,28],["ground","door","h",62,24,28],["ground","door","v",32,1,4],
    ["ground","door","v",32,5,8],["up","door","h",49,8,18],["up","door","v",11,2,5],["up","door","v",11,11,15],["up","door","h",49,19,28],
    ["up","door","h",16,24,29],["up","door","v",29,2,5],["up","door","v",29,11,15],["up","door","v",29,24,28],["up","door","h",49,29,39],
    ["ground","win","h",16,1,11],["ground","win","v",7,30,37],["ground","win","v",7,45,57],["ground","win","h",29,9,18],["ground","win","h",62,10,18],
    ["ground","win","h",16,23,28],["ground","win","h",62,28,39],["ground","win","h",23,29,38],["up","win","h",16,2,10],
    ["up","win","v",7,51,61],["up","win","h",62,9,17],["up","win","h",16,13,23],["up","win","h",1,18,20],["up","win","h",62,20,27],["up","win","h",1,21,23],
    ["up","win","h",62,30,38],["up","win","h",16,31,38],["up","win","h",23,31,38],["up","win","v",39,24,29]];

  // Isometric projection, seen from the gate side
  const C = Math.cos(Math.PI / 6), S = 0.5;
  const P = (x, y, z) => [(x - y) * C, (x + y) * S - z];
  const pts = (arr) => arr.map((p) => P(...p).map((v) => v.toFixed(2)).join(",")).join(" ");
  const poly = (arr, fill, extra = "") => `<polygon points="${pts(arr)}" fill="${fill}"${extra}/>`;

  const COLORS = { built: [60, 122, 76], funded: [134, 186, 146], partly: [226, 165, 46], open: [222, 210, 190] };
  const RUBBLE = [150, 146, 139], GROUND = [214, 210, 203], GREEN = [130, 178, 110];
  const DOOR = "rgb(120,82,52)", WIN = "rgb(150,200,228)";
  const shade = (rgb, k) => `rgb(${rgb.map((v) => Math.min(255, Math.round(v * k))).join(",")})`;

  let phases = null, locked = null;

  function stateOf(ph) {
    if (!ph) return "open";
    if (ph.status === "done") return "built";
    if (ph.funded >= ph.cost - 0.5) return "funded";
    if (ph.funded > 0.5) return "partly";
    return "open";
  }

  // Openings that sit on one face of a room: face = "x0" | "x1" | "y0" | "y1"
  function openingsOn(face, x0, y0, x1, y1, z0) {
    const floor = z0 >= U ? "up" : "ground", near = (a, b) => Math.abs(a - b) <= 1.2;
    const out = [];
    for (const [fl, kind, dir, at, a, b] of OPENINGS) {
      if (fl !== floor) continue;
      if ((face === "y0" || face === "y1") && dir === "h" && near(at, face === "y0" ? y0 : y1)) {
        const s = Math.max(a, x0 + 0.3), e = Math.min(b, x1 - 0.3);
        if (e - s >= 0.8) out.push([kind, s, e]);
      }
      if ((face === "x0" || face === "x1") && dir === "v" && near(at, face === "x0" ? x0 : x1)) {
        const s = Math.max(a, y0 + 0.3), e = Math.min(b, y1 - 0.3);
        if (e - s >= 0.8) out.push([kind, s, e]);
      }
    }
    return out;
  }
  function openingPolys(face, x0, y0, x1, y1, z0) {
    return openingsOn(face, x0, y0, x1, y1, z0).map(([kind, s, e]) => {
      const zb = z0 + (kind === "door" ? 0 : 3.5), zt = z0 + 7;
      const fill = kind === "door" ? DOOR : WIN;
      if (face === "y0" || face === "y1") {
        const y = face === "y0" ? y0 : y1;
        return poly([[s, y, zb], [e, y, zb], [e, y, zt], [s, y, zt]], fill);
      }
      const x = face === "x0" ? x0 : x1;
      return poly([[x, s, zb], [x, e, zb], [x, e, zt], [x, s, zt]], fill);
    }).join("");
  }

  function draw() {
    const level = (p) => (p[9] === "roof" ? 3 : p[7] >= U - 0.5 ? 2 : (p[9] === "foundation" || p[9] === "garden") ? 0 : 1);
    const order = parts.slice().sort((a, b) => level(a) - level(b) || (a[3] + a[5] + a[4] + a[6]) - (b[3] + b[5] + b[4] + b[6]));
    let svg = "";
    for (const [ph, en, de, x0, y0, x1, y1, z0, h, kind] of order) {
      const pdata = phases && phases.find((p) => p.id === ph);
      const st = stateOf(pdata);
      let base = COLORS[st];
      if (kind === "foundation") base = st === "built" ? RUBBLE : COLORS.open;          // poured concrete and rubble
      if (kind === "garden") base = st === "built" ? GREEN : GROUND;                    // soft grey until the garden exists
      const z1 = z0 + h, label = lang === "de" ? de : en;
      const top = [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];
      const right = [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]];
      const front = [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]];
      const ground = kind === "foundation" || kind === "garden" ? " m-ground" : "";
      let g = "";
      if (kind === "roof") {
        g = poly(top, shade(base, 1), ` class="m-roof-top" stroke="${shade(base, 0.6)}" stroke-width="0.35" stroke-dasharray="1.2 0.8"`);
      } else if (kind === "room") {
        // open box: floor, inside of the back walls, then the outside of the front walls
        const backX = [[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]];
        const backY = [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]];
        g = poly([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], shade(base, 1.12)) +
          poly(backX, shade(base, 0.8)) + openingPolys("x0", x0, y0, x1, y1, z0) +
          poly(backY, shade(base, 0.92)) + openingPolys("y0", x0, y0, x1, y1, z0) +
          poly(right, shade(base, 0.86)) + openingPolys("x1", x0, y0, x1, y1, z0) +
          poly(front, shade(base, 0.72)) + openingPolys("y1", x0, y0, x1, y1, z0);
      } else {
        g = poly(front, shade(base, 0.72)) + poly(right, shade(base, 0.86)) + poly(top, shade(base, 1));
      }
      svg += `<g class="m-part${kind === "roof" ? " m-roof" : ""}${ground}" data-phase="${ph}" data-label="${label}">${g}</g>`;
    }
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
    const desc = li ? li.querySelector("h3 + p").textContent : "";
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
    root.querySelectorAll(".m-part").forEach((g) => g.classList.toggle("dim", !!id && g.dataset.phase !== id));
    root.querySelectorAll(".m-chip").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.phase === id)));
    root.classList.toggle("roof-on", id === "1b"); // the roof is solid only when its own phase is shown
    info(id);
  }

  function chips() {
    root.querySelector(".m-chips").innerHTML = phases
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
