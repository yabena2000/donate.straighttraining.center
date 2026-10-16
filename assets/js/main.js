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
      spentTotal: "spent in total",
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
      spentTotal: "insgesamt ausgegeben",
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
      li.classList.toggle("is-funded", p.status === "done" || p.funded >= p.cost - 0.5);
    });

    // Hand the phases to the 3D model (model.js)
    window.__stcPhases = cfg.phases.map((p) => ({
      id: p.id, cost: p.cost, funded: p.funded, status: p.status,
      fmt: (v) => fmt(v, donorsX), fmtCost: eur.format(p.cost),
    }));
    document.dispatchEvent(new CustomEvent("stc:phases", { detail: window.__stcPhases }));

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

    // Spending by category: donut + legend. Each category keeps its colour (config order), hover or tap shows its share
    const list = $("[data-categories]");
    if (list && spent > 0) {
      const COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#6250d6", "#e87ba4"]; // checked for colour-blind separation
      const order = Object.keys(cfg.expenseCategories);
      const cats = Object.entries(prog.expenses)
        .map(([acc, inv]) => ({ acc, inv, eur: toEur(inv), i: order.indexOf(acc) }))
        .filter((c) => c.eur > 0)
        .sort((a, b) => (a.i < 0 ? 99 : a.i) - (b.i < 0 ? 99 : b.i));
      const sum = cats.reduce((a, c) => a + c.eur, 0);
      const pctFmt = (v) => v.toLocaleString(lang === "de" ? "de-DE" : "en-GB", { maximumFractionDigits: v < 10 ? 1 : 0 }) + " %";
      const R = 80, C = 2 * Math.PI * R, GAP = 2.5;
      let at = 0;
      const arcs = cats.map((c, k) => {
        const len = (c.eur / sum) * C;
        const dash = Math.max(1.5, len - GAP);
        const color = c.i >= 0 && c.i < COLORS.length ? COLORS[c.i] : "#8a8178";
        const arc = `<circle class="seg" data-k="${k}" r="${R}" cx="100" cy="100" stroke="${color}" stroke-dasharray="${dash} ${C - dash}" stroke-dashoffset="${-at}"></circle>`;
        at += len;
        c.color = color;
        c.label = (cfg.expenseCategories[c.acc] || {})[lang] || c.acc.split(":").pop();
        c.amount = fmt(c.eur, conv(c.inv));
        c.share = pctFmt((c.eur / sum) * 100);
        return arc;
      }).join("");
      list.innerHTML = `<div class="spend"><div class="donut"><svg viewBox="0 0 200 200" aria-hidden="true"><g transform="rotate(-90 100 100)">${arcs}</g></svg>` +
        `<div class="donut-center"><b></b><span></span></div></div><ul class="spend-legend">` +
        cats.map((c, k) => `<li tabindex="0" data-k="${k}"><i style="background:${c.color}"></i><span>${c.label}</span><b>${c.amount}</b><em>${c.share}</em></li>`).join("") +
        `</ul></div>`;
      const center = $(".donut-center", list);
      const show = (k) => {
        const c = cats[k];
        $("b", center).textContent = c ? c.share : fmt(spent, conv(...Object.values(prog.expenses || {})));
        $("span", center).textContent = c ? c.label : T.spentTotal;
        $$("[data-k]", list).forEach((el) => el.classList.toggle("dim", k != null && el.dataset.k != k));
      };
      show(null);
      $$("[data-k]", list).forEach((el) => {
        const k = +el.dataset.k;
        el.addEventListener("mouseenter", () => show(k));
        el.addEventListener("focus", () => show(k));
        el.addEventListener("click", (e) => { e.stopPropagation(); show(k); });
        el.addEventListener("mouseleave", () => show(null));
        el.addEventListener("blur", () => show(null));
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

  // ---------- gift amounts: shrink to one line (e.g. long shilling amounts on phones) ----------
  const fitGifts = () => $$(".gift b").forEach((b) => {
    b.style.fontSize = "";
    let size = parseFloat(getComputedStyle(b).fontSize);
    while (b.scrollWidth > b.clientWidth + 1 && size > 11) { size -= 1; b.style.fontSize = size + "px"; }
  });
  new MutationObserver(fitGifts).observe(document.querySelector(".gifts") || document.body, { subtree: true, characterData: true, childList: true });
  addEventListener("resize", fitGifts);

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

  // ---------- in-page links: correct the position once lazy images above the target have loaded ----------
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    const target = a && a.getAttribute("href").length > 1 && document.querySelector(a.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    history.pushState(null, "", a.getAttribute("href"));
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    // If images loaded during the scroll and pushed the target down, land on it precisely
    setTimeout(() => {
      const off = target.getBoundingClientRect().top - parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop || 0);
      if (Math.abs(off) > 4) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 1200);
  });

  // ---------- phases: short rows, details open with the + button ----------
  $$(".phase").forEach((li) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "phase-toggle";
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", lang === "de" ? "Details anzeigen" : "Show details");
    btn.textContent = "+";
    li.appendChild(btn);
    li.classList.add("collapsible");
    const det = document.createElement("div");
    det.className = "phase-details";
    const inner = document.createElement("div");
    inner.className = "phase-details-inner";
    $$(":scope > div > p", li).forEach((p) => inner.appendChild(p));
    det.appendChild(inner);
    li.appendChild(det);
    const toggle = () => {
      const open = li.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
      btn.textContent = open ? "−" : "+";
    };
    btn.addEventListener("click", toggle);
    const h3 = $("h3", li);
    if (h3) { h3.style.cursor = "pointer"; h3.addEventListener("click", toggle); }
  });

  // ---------- why cards: on phones only title and icon, tap to read ----------
  $$("#why .card").forEach((card) => {
    const h3 = $("h3", card);
    if (!h3) return;
    card.classList.add("foldable");
    const btn = document.createElement("span");
    btn.className = "why-plus"; btn.setAttribute("aria-hidden", "true"); btn.textContent = "+";
    h3.appendChild(btn);
    card.addEventListener("click", () => {
      if (!matchMedia("(max-width: 700px)").matches) return;
      const open = card.classList.toggle("open");
      btn.textContent = open ? "−" : "+";
    });
  });

  // ---------- diary: live photos play on hover (desktop) or on tap (phones), never on data saver ----------
  // Browsers that block autoplay (e.g. Firefox "Block audio and video") still allow play on click,
  // so a click on the photo starts or stops the clip as well.
  const desktop = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const saveData = navigator.connection && (navigator.connection.saveData || /2g/.test(navigator.connection.effectiveType || ""));
  if (!saveData) {
    const video = (fig) => {
      let vid = $("video", fig);
      if (!vid) {
        vid = document.createElement("video");
        vid.muted = true; vid.loop = true; vid.playsInline = true; vid.preload = "auto";
        vid.setAttribute("muted", ""); vid.setAttribute("playsinline", ""); vid.setAttribute("aria-hidden", "true");
        vid.innerHTML = `<source src="${fig.dataset.live}.webm" type="video/webm"><source src="${fig.dataset.live}.mp4" type="video/mp4">`;
        vid.addEventListener("playing", () => fig.classList.add("playing"));
        vid.addEventListener("pause", () => fig.classList.remove("playing"));
        fig.insertBefore(vid, fig.querySelector("figcaption"));
        vid.load();
      }
      return vid;
    };
    $$("[data-live]").forEach((fig) => {
      fig.classList.add("is-live");
      if (desktop) {
        fig.addEventListener("mouseenter", () => video(fig).play().catch(() => fig.classList.add("needs-click")));
        fig.addEventListener("mouseleave", () => { const v = $("video", fig); if (v) v.pause(); });
      }
      // phones: a tap plays or stops the clip – nothing loads before that tap
      fig.addEventListener("click", () => { const v = video(fig); v.paused ? v.play().catch(() => {}) : v.pause(); });
    });
  }

  // ---------- timeline: items fade in as they scroll into view ----------
  const tl = $(".timeline");
  if (tl && "IntersectionObserver" in window) {
    tl.classList.add("anim");
    let fired = false;
    const io = new IntersectionObserver((entries) => {
      fired = true;
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    $$(".tl-item", tl).forEach((li) => io.observe(li));
    // Safety net: if the observer never reports (some embedded or headless browsers), just show everything
    setTimeout(() => { if (!fired) $$(".tl-item", tl).forEach((li) => li.classList.add("in")); }, 2000);
  }

  // ---------- diary scroll buttons ----------
  const track = $(".diary-track");
  $$("[data-scroll]").forEach((b) =>
    b.addEventListener("click", () => track.scrollBy({ left: Number(b.dataset.scroll) * track.clientWidth * 0.8, behavior: "smooth" }))
  );
  if (track) track.scrollLeft = track.scrollWidth; // start at the newest entry

  // ---------- student voices: handwriting drawn from the original pen strokes ----------
  const vTrack = $(".voices-track");
  if (vTrack) {
    $$("[data-vscroll]").forEach((b) =>
      b.addEventListener("click", () => vTrack.scrollBy({ left: Number(b.dataset.vscroll) * vTrack.clientWidth * 0.8, behavior: "smooth" }))
    );
    const NS = "http://www.w3.org/2000/svg";
    const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    let data = null;
    const load = () => data || (data = fetch(base + "data/handwriting.json").then((r) => r.json()));
    const render = (fig, hw) => {
      const svg = $("svg", fig);
      svg.setAttribute("viewBox", `0 0 ${hw.w} ${hw.h}`);
      const frag = document.createDocumentFragment();
      hw.s.forEach(([, , d]) => { const p = document.createElementNS(NS, "path"); p.setAttribute("d", d); frag.appendChild(p); });
      svg.appendChild(frag);
      fig._hw = hw;
      fig._ink = $$("path", svg).reduce((sum, p) => sum + p.getTotalLength(), 0);
    };
    // Replay in the students' own rhythm, at the same writing speed for every page:
    // the page with the most ink takes 25 s, a short one about 10 s
    let maxInk = 1;
    const play = (fig) => {
      const hw = fig._hw;
      if (!hw || fig.classList.contains("writing")) return;
      const paths = $$("path", fig);
      const len = paths.map((p) => p.getTotalLength() || 0.1);
      paths.forEach((p, i) => { p.style.strokeDasharray = len[i]; p.style.strokeDashoffset = len[i]; });
      const speed = hw.ms / (10000 + 15000 * fig._ink / maxInk);
      fig.classList.add("writing");
      const t0 = performance.now();
      let next = 0;
      const step = (now) => {
        const t = (now - t0) * speed;
        while (next < paths.length && t >= hw.s[next][0] + hw.s[next][1]) { paths[next].style.strokeDashoffset = 0; next++; }
        for (let i = next; i < paths.length && hw.s[i][0] <= t; i++) {
          const f = (t - hw.s[i][0]) / hw.s[i][1];
          paths[i].style.strokeDashoffset = len[i] * (1 - Math.min(1, f));
        }
        if (next < paths.length) requestAnimationFrame(step);
        else { paths.forEach((p) => { p.style.strokeDasharray = ""; p.style.strokeDashoffset = ""; }); fig.classList.remove("writing"); }
      };
      requestAnimationFrame(step);
    };
    const figs = $$(".voice", vTrack);
    let started = false;
    const init = () => {
      if (started) return;
      started = true;
      removeEventListener("scroll", near);
      load().then((all) => {
        figs.forEach((f) => all[f.dataset.hw] && render(f, all[f.dataset.hw]));
        maxInk = Math.max(1, ...figs.map((f) => f._ink || 0));
      }).catch(() => {});
    };
    // Load the strokes only when the section comes close (checked on scroll; works in every browser)
    const near = () => { if (vTrack.getBoundingClientRect().top < innerHeight + 800) init(); };
    addEventListener("scroll", near, { passive: true });
    near();
    const hover = window.matchMedia && matchMedia("(hover: hover)").matches;
    figs.forEach((f) => {
      if (hover && !reduce) f.addEventListener("mouseenter", () => play(f));
      $(".voice-paper", f).addEventListener("click", () => play(f));
    });
  }

  // ---------- films: only one plays at a time ----------
  const films = $$("video.film");
  films.forEach((v) => v.addEventListener("play", () => films.forEach((o) => o !== v && o.pause())));
})();
