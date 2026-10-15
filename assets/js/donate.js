// Donate section: pick where you give from, see the matching account details.
// Channels live in data/accounts.json.
(function () {
  const root = document.getElementById("donate");
  if (!root) return;
  const lang = document.documentElement.lang === "de" ? "de" : "en";
  const base = document.documentElement.dataset.base || "";
  const locale = lang === "de" ? "de-DE" : "en-GB";

  const L = {
    en: {
      holder: "Account holder", iban: "IBAN", bic: "BIC / SWIFT", swiftBic: "SWIFT / BIC", bank: "Bank", bankCode: "Bank code",
      bankAddress: "Bank address", accountNumber: "Account number", sortCode: "Sort code", routingNumber: "Routing number (ACH)",
      accountType: "Account type", reference: "Reference", currency: "Currency", tigoPesa: "Tigo Pesa", receiver: "Receiver",
      evm: "ETH · USDC (Ethereum / Base)", btc: "Bitcoin", recipientAddress: "Recipient address",
      referenceRequired: "Reference (required)", intermediaryBic: "Intermediary BIC", revtag: "Revtag", note: "Note", paypal: "PayPal – send to",
      soon: "details coming soon", copy: "Copy", copied: "Copied ✓",
      pending: "We are setting up this account right now. Until then, please choose the direct transfer to the school in Tanzania, Revolut or crypto – or come back in a few days.",
      approx: "≈ in your currency",
    },
    de: {
      holder: "Kontoinhaber", iban: "IBAN", bic: "BIC / SWIFT", swiftBic: "SWIFT / BIC", bank: "Bank", bankCode: "Bankleitzahl",
      bankAddress: "Adresse der Bank", accountNumber: "Kontonummer", sortCode: "Sort Code", routingNumber: "Routing Number (ACH)",
      accountType: "Kontotyp", reference: "Verwendungszweck", currency: "Währung", tigoPesa: "Tigo Pesa", receiver: "Empfänger",
      evm: "ETH · USDC (Ethereum / Base)", btc: "Bitcoin", recipientAddress: "Adresse Empfänger",
      referenceRequired: "Verwendungszweck (zwingend)", intermediaryBic: "Zwischenbank-BIC", revtag: "Revtag", note: "Notiz", paypal: "PayPal – senden an",
      soon: "Angaben folgen in Kürze", copy: "Kopieren", copied: "Kopiert ✓",
      pending: "Dieses Konto richten wir gerade ein. Bis dahin wähle bitte die Direktüberweisung an die Schule in Tansania, Revolut oder Krypto – oder schau in ein paar Tagen wieder vorbei.",
      approx: "≈ in deiner Währung",
    },
  }[lang];


  // Small flags and logos for the donation tiles (inline SVG, no extra requests)
  const euStars = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return `<circle cx="${(12 + Math.cos(a) * 5).toFixed(2)}" cy="${(8 + Math.sin(a) * 5).toFixed(2)}" r="0.9" fill="#ffcc00"/>`;
  }).join("");
  const flag = (inner) => `<svg class="r-icon flag" viewBox="0 0 24 16" aria-hidden="true">${inner}</svg>`;
  const logo = (inner) => `<svg class="r-icon" viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;
  const ICONS = {
    tz: flag('<rect width="24" height="16" fill="#1eb53a"/><path d="M24 0v16H0z" fill="#00a3dd"/><path d="M-1 17 25 -1" stroke="#fcd116" stroke-width="7"/><path d="M-1 17 25 -1" stroke="#000" stroke-width="4.4"/>'),
    eu: flag(`<rect width="24" height="16" fill="#003399"/>${euStars}`),
    ch: `<svg class="r-icon flag square" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" fill="#da291c"/><path d="M13 6h6v7h7v6h-7v7h-6v-7H6v-6h7z" fill="#fff"/></svg>`,
    gb: flag('<rect width="24" height="16" fill="#012169"/><path d="M0 0l24 16M24 0L0 16" stroke="#fff" stroke-width="3.2"/><path d="M0 0l24 16M24 0L0 16" stroke="#c8102e" stroke-width="1.2"/><path d="M12 0v16M0 8h24" stroke="#fff" stroke-width="5"/><path d="M12 0v16M0 8h24" stroke="#c8102e" stroke-width="3"/>'),
    us: flag('<rect width="24" height="16" fill="#fff"/>' + [0, 2, 4, 6, 8, 10, 12].map((i) => `<rect y="${(i * 16) / 13}" width="24" height="${16 / 13}" fill="#b22234"/>`).join("") + '<rect width="10" height="8.6" fill="#3c3b6e"/>'),
    receipt: logo('<path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21z" fill="#fff" stroke="#b5532b" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 8h6M9 11.5h6M9 15h4" stroke="#b5532b" stroke-width="1.6" stroke-linecap="round"/>'),
    paypal: logo('<rect width="24" height="24" rx="6" fill="#003087"/><text x="12" y="17" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-style="italic" font-size="15" fill="#fff">P</text>'),
    revolut: logo('<rect width="24" height="24" rx="6" fill="#191c1f"/><text x="12" y="17" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="15" fill="#fff">R</text>'),
    tigo: logo('<rect width="24" height="24" rx="6" fill="#00377b"/><text x="12" y="12.2" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="8.4" fill="#fff">tigo</text><text x="12" y="19.4" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="6" fill="#ffd200">pesa</text>'),
    phone: logo('<rect x="7" y="2.5" width="10" height="19" rx="2.2" fill="#fff" stroke="#22306e" stroke-width="1.6"/><circle cx="12" cy="18.2" r="1" fill="#22306e"/><path d="M10.5 5h3" stroke="#22306e" stroke-width="1.4" stroke-linecap="round"/>'),
    eth: logo('<circle cx="12" cy="12" r="12" fill="#627eea"/><path d="M12 3.5v6.3l5.3 2.4z" fill="#fff" fill-opacity=".6"/><path d="M12 3.5 6.7 12.2 12 9.8z" fill="#fff"/><path d="M12 16.3v4.2l5.3-7.4z" fill="#fff" fill-opacity=".6"/><path d="M12 20.5v-4.2l-5.3-3.2z" fill="#fff"/><path d="M12 15.3l5.3-3.1L12 9.8z" fill="#fff" fill-opacity=".2"/><path d="M6.7 12.2 12 15.3V9.8z" fill="#fff" fill-opacity=".6"/>'),
    btc: logo('<circle cx="12" cy="12" r="12" fill="#f7931a"/><text x="12" y="17.2" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="15" fill="#fff">₿</text>'),
  };
  const ICON_FOR = { swift: "tz", eu: "eu", dsfa: "receipt", paypal: "paypal", ch: "ch", uk: "gb", us: "us", revolut: "revolut", tz: "tigo", crypto: "eth", btc: "btc" };

  const picker = root.querySelector("[data-region-picker]");
  const panel = root.querySelector("[data-region-panel]");
  const partnerNote = root.querySelector("[data-partner-note]");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  fetch(base + "data/accounts.json", { cache: "no-cache" })
    .then((r) => r.json())
    .then(init)
    .catch((e) => console.warn("Donation channels unavailable", e));

  function guessRegion(regions) {
    const codes = (navigator.languages || [navigator.language || ""])
      .map((l) => (l.split("-")[1] || "").toUpperCase())
      .filter(Boolean);
    let tz = "";
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
    const tzCode = { "Europe/Zurich": "CH", "Europe/Vaduz": "LI", "Europe/London": "GB", "Africa/Dar_es_Salaam": "TZ", "Africa/Nairobi": "KE" }[tz]
      || (tz.startsWith("America/") ? "US" : tz.startsWith("Europe/") ? "DE" : "");
    // Time zone first (where the visitor is), then browser language region
    for (const code of [tzCode, ...codes]) {
      const r = regions.find((x) => x.match.includes(code));
      if (r) return r;
    }
    return regions.find((x) => x.id === "swift") || regions[0];
  }

  function init(data) {
    const regions = data.regions;
    picker.innerHTML = regions
      .map((r) => `<button type="button" role="radio" aria-checked="false" data-id="${r.id}">${ICONS[ICON_FOR[r.id]] || ""}<b>${esc(r.label[lang])}</b><span>${esc(r.sub ? r.sub[lang] : r.currency)}</span></button>`)
      .join("");
    const buttons = Array.from(picker.querySelectorAll("button"));
    buttons.forEach((b, i) => {
      b.addEventListener("click", () => select(regions[i]));
      b.addEventListener("keydown", (e) => {
        const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
        if (d) { e.preventDefault(); const n = (i + d + regions.length) % regions.length; select(regions[n]); buttons[n].focus(); }
      });
    });
    let saved = null;
    try { saved = localStorage.getItem("donate-region"); } catch (e) {}
    select(regions.find((r) => r.id === saved) || guessRegion(regions), true);
  }

  function select(r, initial) {
    picker.querySelectorAll("button").forEach((b) => {
      const on = b.dataset.id === r.id;
      b.setAttribute("aria-checked", on);
      b.tabIndex = on ? 0 : -1;
    });
    if (!initial) { try { localStorage.setItem("donate-region", r.id); } catch (e) {} }

    const missing = r.fields.some((f) => f.value === null);
    const rows = r.fields.map((f) => {
      const val = f.value === null ? `<dd class="soon">${L.soon}</dd>` : `<dd>${esc(f.value)}</dd>`;
      const canCopy = f.value !== null && f.copy !== false;
      const btn = canCopy ? `<button class="copy" data-text="${esc(typeof f.copy === "string" ? f.copy : f.value)}">${L.copy}</button>` : "<span></span>";
      const links = f.links ? `<div class="field-links">${f.links.map(([t, u]) => `<a href="${esc(u)}" rel="noopener">${esc(t)}</a>`).join(" · ")}</div>` : "";
      return `<div class="field${f.qr ? " has-qr" : ""}"><dt>${L[f.key] || f.key}</dt>${val}${btn}${links}${f.qr ? `<img class="qr-inline" src="${base}${f.qr}" alt="QR code: ${esc(L[f.key])}" width="132" height="132">` : ""}</div>`;
    }).join("");
    const notes = r.notes.map((n) => `<div class="note${r.warn ? " warn" : ""}">${esc(n[lang])}</div>`).join("");

    panel.innerHTML =
      `<h3>${esc(r.method[lang])}</h3>` +
      (missing ? `<div class="note pending">${L.pending}</div>` : "") +
      `<dl class="fields">${rows}</dl>${notes}`;
    partnerNote.hidden = !r.viaPartner;

    panel.querySelectorAll(".copy").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const text = btn.dataset.text;
        try { await navigator.clipboard.writeText(text); }
        catch (e) {
          const ta = Object.assign(document.createElement("textarea"), { value: text });
          document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove();
        }
        btn.textContent = L.copied; btn.classList.add("done");
        setTimeout(() => { btn.textContent = L.copy; btn.classList.remove("done"); }, 1800);
      })
    );

    // Gift examples in the visitor's currency
    root.querySelectorAll("[data-eur]").forEach((el) => {
      const v = Number(el.dataset.eur) * r.rateFromEur;
      const rounded = r.currency === "TZS" ? Math.round(v / 1000) * 1000 : Math.round(v);
      const txt = new Intl.NumberFormat(locale, { style: "currency", currency: r.currency, maximumFractionDigits: 0 }).format(rounded);
      el.textContent = (r.currency === "EUR" ? "" : "≈ ") + txt;
    });
  }
})();
