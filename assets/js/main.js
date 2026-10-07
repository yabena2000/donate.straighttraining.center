// Straight Training Center – building fundraiser
// Reads data/config.json (goal & phases) and data/progress.json (numbers from the public ledger).
(function () {
  const lang = document.documentElement.lang === "de" ? "de" : "en";
  const base = document.documentElement.dataset.base || "";

  const T = {
    en: {
      of: (goal) => `raised and promised of ${goal}`,
      received: "received",
      committed: "promised",
      spent: "spent – every receipt is public",
      nextTitle: (gap, phase) => `${gap} still needed to fully fund ${phase}`,
      phase: (id) => `phase ${id}`,
      allFunded: "Every phase is funded – thank you!",
      funded: "funded",
      ofCost: (c) => `of ${c}`,
      status: { done: "Done", building: "Under construction", next: "Up next", planned: "Planned" },
      updated: (d, f) => `Live from our public ledger · last booking ${d} · checked ${f}`,
      eurNote: (r) => `* Our books are kept in Tanzanian shillings. Amounts marked * are converted at ${r} TZS = €1, the rate our budget is based on.`,
    },
    de: {
      of: (goal) => `gespendet und zugesagt von ${goal}`,
      received: "eingegangen",
      committed: "zugesagt",
      spent: "ausgegeben – alle Belege öffentlich",
      nextTitle: (gap, phase) => `Noch ${gap}, um ${phase} voll zu finanzieren`,
      phase: (id) => `Phase ${id}`,
      allFunded: "Alle Phasen sind finanziert – danke!",
      funded: "finanziert",
      ofCost: (c) => `von ${c}`,
      status: { done: "Erledigt", building: "Im Bau", next: "Als Nächstes", planned: "Geplant" },
      updated: (d, f) => `Live aus unserer öffentlichen Buchhaltung · letzte Buchung ${d} · geprüft ${f}`,
      eurNote: (r) => `* Unsere Buchhaltung läuft in tansanischen Schilling. Mit * markierte Beträge sind zum Kurs ${r} TZS = 1 € umgerechnet, auf dem unser Budget basiert.`,
    },
  }[lang];

  const eur = new Intl.NumberFormat(lang === "de" ? "de-DE" : "en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const eurx = (v) => eur.format(v) + "*"; // converted from shillings
  const date = (s) => new Date(s).toLocaleDateString(lang === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const sum = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0);
  const pct = (a, b) => (b > 0 ? Math.max(0, Math.min(100, (a / b) * 100)) : 0);

  // ---------- progress ----------
  Promise.all([
    fetch(base + "data/config.json").then((r) => r.json()),
    fetch(base + "data/progress.json", { cache: "no-cache" }).then((r) => r.json()),
  ])
    .then(([cfg, prog]) => render(cfg, prog))
    .catch((e) => console.warn("Progress data unavailable", e));

  function render(cfg, prog) {
    const rate = cfg.tsPerEur;
    const committed = sum(prog.donorsTS) / rate;
    const pledged = sum(prog.pledgedTS) / rate;
    const received = committed - pledged;
    const spent = sum(prog.expensesTS) / rate;
    const goal = cfg.phases.reduce((a, p) => a + p.cost, 0);

    $$("[data-goal]").forEach((el) => (el.textContent = eur.format(goal)));
    $$("[data-committed]").forEach((el) => (el.textContent = eurx(committed)));
    $$("[data-received]").forEach((el) => (el.textContent = eurx(received)));
    $$("[data-spent]").forEach((el) => (el.textContent = eurx(spent)));
    $$("[data-of-goal]").forEach((el) => (el.textContent = T.of(eur.format(goal))));
    $$("[data-pct]").forEach((el) => (el.textContent = Math.round(pct(committed, goal)) + " %"));
    $$("[data-rate-note]").forEach((el) => (el.textContent = T.eurNote((rate * 1000).toLocaleString(lang === "de" ? "de-DE" : "en-GB"))));
    $$("[data-updated]").forEach((el) => (el.textContent = T.updated(date(prog.lastEntry), date(prog.fetchedAt))));

    requestAnimationFrame(() => {
      $$(".bar .committed").forEach((el) => (el.style.width = pct(committed, goal) + "%"));
      $$(".bar .received").forEach((el) => (el.style.width = pct(received, goal) + "%"));
      $$(".bar .spent-fill").forEach((el) => (el.style.width = pct(spent, goal) + "%"));
    });

    // Fill phases in order with the committed money (waterfall)
    let pot = committed;
    let next = null;
    cfg.phases.forEach((p) => {
      const funded = Math.min(p.cost, Math.max(0, pot));
      pot -= p.cost;
      p.funded = funded;
      if (!next && funded < p.cost - 0.5) next = p;
    });

    cfg.phases.forEach((p) => {
      const li = $(`.phase[data-phase="${p.id}"]`);
      if (!li) return;
      const badge = $(".badge", li);
      badge.className = "badge " + p.status;
      badge.textContent = T.status[p.status];
      $(".funded", li).textContent = eurx(p.funded) + " " + T.funded;
      $(".cost", li).textContent = T.ofCost(eur.format(p.cost));
      requestAnimationFrame(() => ($(".bar i", li).style.width = pct(p.funded, p.cost) + "%"));
      li.classList.toggle("is-next", next === p);
    });

    const nm = $("[data-next-milestone]");
    if (nm) {
      if (next) {
        const name = $(`.phase[data-phase="${next.id}"] h3`);
        $("strong", nm).textContent = T.nextTitle(eurx(next.cost - next.funded), T.phase(next.id));
        $("span", nm).textContent = name ? name.dataset.short || name.firstChild.textContent.trim() : "";
      } else {
        $("strong", nm).textContent = T.allFunded;
        $("span", nm).textContent = "";
      }
    }

    // Spending by category
    const list = $("[data-categories]");
    if (list) {
      const total = sum(prog.expensesTS);
      list.innerHTML = "";
      Object.entries(prog.expensesTS).forEach(([acc, ts]) => {
        const label = (cfg.expenseCategories[acc] || {})[lang] || acc;
        const row = document.createElement("div");
        row.className = "cat-row";
        row.innerHTML = `<span>${label}</span><b>${eurx(ts / rate)}</b><div class="bar"><i></i></div>`;
        list.appendChild(row);
        requestAnimationFrame(() => ($("i", row).style.width = pct(ts, total) + "%"));
      });
    }

    // Donor list
    const donors = $("[data-donors]");
    if (donors) {
      donors.innerHTML = "";
      Object.entries(prog.donorsTS)
        .sort((a, b) => b[1] - a[1])
        .forEach(([acc, ts]) => {
          const d = cfg.donors[acc] || { name: acc.split(":").pop() };
          const pl = (prog.pledgedTS || {})["A:Pledged:" + acc.split(":").pop()] || 0;
          const row = document.createElement("div");
          row.className = "cat-row";
          row.innerHTML = `<span>${d.name}</span><b>${eurx(ts / rate)}</b>` +
            (pl ? `<span class="small muted">${eurx(pl / rate)} ${T.committed}</span>` : "");
          donors.appendChild(row);
        });
    }
  }

  // ---------- diary scroll buttons ----------
  const track = $(".diary-track");
  $$("[data-scroll]").forEach((b) =>
    b.addEventListener("click", () => track.scrollBy({ left: Number(b.dataset.scroll) * track.clientWidth * 0.8, behavior: "smooth" }))
  );
  if (track) track.scrollLeft = track.scrollWidth; // start at the newest entry

  // ---------- Vimeo: load only on click (no third-party requests before consent) ----------
  $$(".vimeo-facade").forEach((btn) =>
    btn.addEventListener("click", () => {
      const wrap = document.createElement("div");
      wrap.className = "vimeo-wrap";
      wrap.innerHTML = `<iframe src="https://player.vimeo.com/video/${btn.dataset.vimeo}?autoplay=1&dnt=1" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="${btn.dataset.title}"></iframe>`;
      btn.replaceWith(wrap);
    })
  );
})();
