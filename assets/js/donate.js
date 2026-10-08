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
      referenceRequired: "Reference (required)", intermediaryBic: "Intermediary BIC", revtag: "Revtag", note: "Note",
      soon: "details coming soon", copy: "Copy", copied: "Copied ✓",
      pending: "We are setting up this account right now. Until then, please choose the direct transfer to the school in Tanzania, Revolut or crypto – or come back in a few days.",
      approx: "≈ in your currency",
    },
    de: {
      holder: "Kontoinhaber", iban: "IBAN", bic: "BIC / SWIFT", swiftBic: "SWIFT / BIC", bank: "Bank", bankCode: "Bankleitzahl",
      bankAddress: "Adresse der Bank", accountNumber: "Kontonummer", sortCode: "Sort Code", routingNumber: "Routing Number (ACH)",
      accountType: "Kontotyp", reference: "Verwendungszweck", currency: "Währung", tigoPesa: "Tigo Pesa", receiver: "Empfänger",
      evm: "ETH · USDC (Ethereum / Base)", btc: "Bitcoin", recipientAddress: "Adresse Empfänger",
      referenceRequired: "Verwendungszweck (zwingend)", intermediaryBic: "Zwischenbank-BIC", revtag: "Revtag", note: "Notiz",
      soon: "Angaben folgen in Kürze", copy: "Kopieren", copied: "Kopiert ✓",
      pending: "Dieses Konto richten wir gerade ein. Bis dahin wähle bitte die Direktüberweisung an die Schule in Tansania, Revolut oder Krypto – oder schau in ein paar Tagen wieder vorbei.",
      approx: "≈ in deiner Währung",
    },
  }[lang];

  const picker = root.querySelector("[data-region-picker]");
  const panel = root.querySelector("[data-region-panel]");
  const partnerNote = root.querySelector("[data-partner-note]");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  fetch(base + "data/accounts.json")
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
      .map((r) => `<button type="button" role="radio" aria-checked="false" data-id="${r.id}"><b>${esc(r.label[lang])}</b><span>${esc(r.sub ? r.sub[lang] : r.currency)}</span></button>`)
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
