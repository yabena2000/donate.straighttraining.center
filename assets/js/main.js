// Straight Training Center – building fundraiser
// Reads data/config.json (goal & phases) and data/progress.json (numbers from the public ledger).
(function () {
  const lang = document.documentElement.lang === "de" ? "de" : "en";
  const base = document.documentElement.dataset.base || "";

  const T = {
    en: {
      of: (goal) => `raised and promised of ${goal}`,
      received: "received",
      stillPending: (v) => `of which ${v} still to arrive`,
      spent: "spent – every receipt is public",
      nextTitle: (gap, phase) => `${gap} still needed to fully fund ${phase}`,
      phase: (id) => `phase ${id}`,
      allFunded: "Every phase is funded – thank you!",
      unlockTitle: (label, v) => `${label}: ${v} needed now`,
      unlockText: (donor, v) => `Once it stands, ${donor} releases its final ${v}.`,
      funded: "funded",
      ofCost: (c) => `of ${c}`,
      status: { done: "Done", building: "Under construction", next: "Up next", planned: "Planned" },
      updated: (d, f) => `Live from our public ledger · last booking ${d} · checked ${f}`,
      eurNote: (r) => `* Our books are kept in Tanzanian shillings. Amounts marked * are converted at ${r} TZS = €1, the rate our budget is based on.`,
    },
    de: {
      of: (goal) => `gespendet und zugesagt von ${goal}`,
      received: "eingegangen",
      stillPending: (v) => `davon ${v} noch ausstehend`,
      spent: "ausgegeben – alle Belege öffentlich",
      nextTitle: (gap, phase) => `Noch ${gap}, um ${phase} voll zu finanzieren`,
      phase: (id) => `Phase ${id}`,
      allFunded: "Alle Phasen sind finanziert – danke!",
      unlockTitle: (label, v) => `${label}: Jetzt fehlen noch ${v}`,
      unlockText: (donor, v) => `Sobald es steht, gibt ${donor} die letzten ${v} frei.`,
      funded: "finanziert",
      ofCost: (c) => `von ${c}`,
      status: { done: "Erledigt", building: "Im Bau", next: "Als Nächstes", planned: "Geplant" },
      updated: (d, f) => `Live aus unserer öffentlichen Buchhaltung · letzte Buchung ${d} · geprüft ${f}`,
      eurNote: (r) => `* Unsere Buchhaltung läuft in tansanischen Schilling. Mit * markierte Beträge sind zum Kurs ${r} TZS = 1 € umgerechnet, auf dem unser Budget basiert.`,
    },
  }[lang];

  const eur = new Intl.NumberFormat(lang === "de" ? "de-DE" : "en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const eurx = (v) => eur.format(v) + "*"; // converted from shillings
  const fmt = (v, converted) => (converted ? eurx(v) : eur.format(v)); // * only if shillings are part of it
  const date = (s) => new Date(s).toLocaleDateString(lang === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const pct = (a, b) => (b > 0 ? Math.max(0, Math.min(100, (a / b) * 100)) : 0);

  // ---------- progress ----------
  Promise.all([
    fetch(base + "data/config.json", { cache: "no-cache" }).then((r) => r.json()),
    fetch(base + "data/progress.json", { cache: "no-cache" }).then((r) => r.json()),
  ])
    .then(([cfg, prog]) => render(cfg, prog))
    .catch((e) => console.warn("Progress data unavailable", e));

  function render(cfg, prog) {
    const rate = cfg.tsPerEur;
    // Ledger amounts per currency: EUR counts as EUR, TZS is converted at the budget rate (rate = thousand TZS per EUR)
    const toEur = (inv) => (inv.EUR || 0) + (inv.TZS || 0) / 1000 / rate + (inv.TS || 0) / rate;
    const total = (accounts) => Object.values(accounts || {}).reduce((a, inv) => a + toEur(inv), 0);
    // true if any of these ledger amounts contains shillings, i.e. was converted at the budget rate
    const conv = (...invs) => invs.some((i) => i && ((i.TZS || 0) !== 0 || (i.TS || 0) !== 0));
    const donorsX = conv(...Object.values(prog.donors || {}), ...Object.values(prog.pending || {}));
    const committed = total(prog.donors);
    const pledged = total(prog.pending);
    const received = committed - pledged;
    const spent = total(prog.expenses);
    const goal = cfg.phases.reduce((a, p) => a + p.cost, 0);

    $$("[data-goal]").forEach((el) => (el.textContent = eur.format(goal)));
    $$("[data-committed]").forEach((el) => (el.textContent = fmt(committed, donorsX)));
    $$("[data-received]").forEach((el) => (el.textContent = fmt(received, donorsX)));
    $$("[data-spent]").forEach((el) => (el.textContent = fmt(spent, conv(...Object.values(prog.expenses || {})))));
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
      $(".funded", li).textContent = fmt(p.funded, donorsX) + " " + T.funded;
      $(".cost", li).textContent = T.ofCost(eur.format(p.cost));
      requestAnimationFrame(() => ($(".bar i", li).style.width = pct(p.funded, p.cost) + "%"));
      li.classList.toggle("is-next", next === p);
    });

    // Money still missing up to and including a given phase, e.g. <b data-gap-until="1c">
    $$("[data-gap-until]").forEach((el) => {
      const upto = cfg.phases.findIndex((p) => p.id === el.dataset.gapUntil);
      const gap = cfg.phases.slice(0, upto + 1).reduce((a, p) => a + p.cost - p.funded, 0);
      el.textContent = fmt(gap, donorsX);
    });

    // A pledge that is only paid once a phase is built: show the cash needed now to build it
    const un = cfg.unlock;
    const unPhase = un && cfg.phases.find((p) => p.id === un.phase);
    const unPending = un ? toEur((prog.pending || {})[un.pending] || {}) : 0;
    const onHand = toEur(prog.cash || {}) + toEur(prog.liabilities || {}); // liabilities are negative
    const needNow = unPhase ? unPhase.cost - onHand : 0;

    const nm = $("[data-next-milestone]");
    if (nm) {
      const unlockActive = unPhase && unPhase.status !== "done" && unPending > 0 && needNow > 0;
      const rain = $(".rain", nm);
      if (rain) rain.hidden = !unlockActive;
      if (unlockActive) {
        const donor = cfg.donors[un.donor] || {};
        const dname = typeof donor.name === "object" ? donor.name[lang] : donor.name || "";
        $("strong", nm).textContent = T.unlockTitle(un.label[lang], fmt(needNow, conv(prog.cash, prog.liabilities)));
        $("span", nm).textContent = T.unlockText(dname.replace(/ e\.V\.$/, ""), eur.format(unPending));
      } else if (next) {
        const name = $(`.phase[data-phase="${next.id}"] h3`);
        $("strong", nm).textContent = T.nextTitle(fmt(next.cost - next.funded, donorsX), T.phase(next.id));
        $("span", nm).textContent = name ? name.dataset.short || name.firstChild.textContent.trim() : "";
      } else {
        $("strong", nm).textContent = T.allFunded;
        $("span", nm).textContent = "";
      }
    }

    // Where the money goes: everything spent is building cost except bank fees and exchange-rate losses
    if (spent > 0) {
      const fees = toEur(prog.expenses["Expenses:Fees"] || {}) / spent * 100;
      const fx = Math.max(0, toEur(prog.expenses[cfg.exchangeRateAccount] || {}) / spent * 100); // gains count as 0
      const share = { build: 100 - fees - fx, fees, fx };
      $$('[data-share-item="fx"]').forEach((el) => (el.hidden = fx < 0.05));
      const fmt = (v) => v.toLocaleString(lang === "de" ? "de-DE" : "en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
      $$("[data-share]").forEach((el) => {
        el.style.width = share[el.dataset.share] + "%";
        if (el.textContent) el.textContent = fmt(share[el.dataset.share]);
      });
      $$("[data-share-label]").forEach((el) => (el.textContent = fmt(share[el.dataset.shareLabel])));
    }

    // Spending by category
    const list = $("[data-categories]");
    if (list) {
      list.innerHTML = "";
      Object.entries(prog.expenses).forEach(([acc, inv]) => {
        const label = (cfg.expenseCategories[acc] || {})[lang] || acc;
        const row = document.createElement("div");
        row.className = "cat-row";
        row.innerHTML = `<span>${label}</span><b>${fmt(toEur(inv), conv(inv))}</b><div class="bar"><i></i></div>`;
        list.appendChild(row);
        requestAnimationFrame(() => ($("i", row).style.width = pct(toEur(inv), spent) + "%"));
      });
    }

    // Donor list
    const donors = $("[data-donors]");
    if (donors) {
      donors.innerHTML = "";
      Object.entries(prog.donors)
        .sort((a, b) => toEur(b[1]) - toEur(a[1]))
        .forEach(([acc, inv]) => {
          const d = cfg.donors[acc] || { name: acc.split(":").pop() };
          const key = acc.split(":").pop();
          const pl = Object.entries(prog.pending || {})
            .filter(([p]) => p.split(":").pop() === key)
            .reduce((a, [, v]) => a + toEur(v), 0);
          const row = document.createElement("div");
          row.className = "cat-row";
          row.innerHTML = `<span>${typeof d.name === "object" ? d.name[lang] : d.name}</span><b>${fmt(toEur(inv), conv(inv))}</b>` +
            (pl ? `<span class="small muted">${T.stillPending(eur.format(pl))}</span>` : "");
          donors.appendChild(row);
        });
    }
  }

  // ---------- share ----------
  const copyBtn = $("[data-share-copy]");
  if (copyBtn) {
    const label = copyBtn.textContent;
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(copyBtn.dataset.url).then(() => {
        copyBtn.textContent = lang === "de" ? "Link kopiert ✓" : "Link copied ✓";
        setTimeout(() => (copyBtn.textContent = label), 2000);
      });
    });
  }
  // The system share sheet only on phones/tablets; desktop browsers often fail silently
  const nativeBtn = $("[data-share-native]");
  if (nativeBtn && navigator.share && matchMedia("(pointer: coarse)").matches) {
    nativeBtn.hidden = false;
    nativeBtn.addEventListener("click", () =>
      navigator.share({ title: document.title, url: copyBtn ? copyBtn.dataset.url : location.href }).catch((e) => {
        if (e.name !== "AbortError" && copyBtn) copyBtn.click(); // fall back to copying the link
      })
    );
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
