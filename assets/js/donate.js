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
  const flag = (inner) => `<svg class="r-icon flag" viewBox="0 0 24 16" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${inner}</svg>`;
  const flagL = (inner) => flag(inner).replace('xMidYMid', 'xMinYMid');
  const logo = (inner) => `<svg class="r-icon" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${inner}</svg>`;
  const brand = (bg, inner) => `<svg class="r-icon brand" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect x="-30" y="-30" width="84" height="84" fill="${bg}"/>${inner}</svg>`;
  const ICONS = {
    tz: flag('<rect width="24" height="16" fill="#1eb53a"/><path d="M24 0v16H0z" fill="#00a3dd"/><path d="M-1 17 25 -1" stroke="#fcd116" stroke-width="7"/><path d="M-1 17 25 -1" stroke="#000" stroke-width="4.4"/>'),
    eu: flag(`<rect width="24" height="16" fill="#003399"/>${euStars}`),
    ch: `<svg class="r-icon flag square" viewBox="0 0 32 32" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="32" height="32" fill="#da291c"/><path d="M13 6h6v7h7v6h-7v7h-6v-7H6v-6h7z" fill="#fff"/></svg>`,
    gb: flag('<rect width="24" height="16" fill="#012169"/><path d="M0 0l24 16M24 0L0 16" stroke="#fff" stroke-width="3.2"/><path d="M0 0l24 16M24 0L0 16" stroke="#c8102e" stroke-width="1.2"/><path d="M12 0v16M0 8h24" stroke="#fff" stroke-width="5"/><path d="M12 0v16M0 8h24" stroke="#c8102e" stroke-width="3"/>'),
    us: flagL('<rect width="24" height="16" fill="#fff"/>' + [0, 2, 4, 6, 8, 10, 12].map((i) => `<rect y="${(i * 16) / 13}" width="24" height="${16 / 13}" fill="#b22234"/>`).join("") + '<rect width="10" height="8.6" fill="#3c3b6e"/>'),
    receipt: logo('<path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21z" fill="#fff" stroke="#b5532b" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 8h6M9 11.5h6M9 15h4" stroke="#b5532b" stroke-width="1.6" stroke-linecap="round"/>'),
    tigo: logo('<rect width="24" height="24" rx="6" fill="#00377b"/><text x="12" y="12.2" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="8.4" fill="#fff">tigo</text><text x="12" y="19.4" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="6" fill="#ffd200">pesa</text>'),
    phone: logo('<rect x="7" y="2.5" width="10" height="19" rx="2.2" fill="#fff" stroke="#22306e" stroke-width="1.6"/><circle cx="12" cy="18.2" r="1" fill="#22306e"/><path d="M10.5 5h3" stroke="#22306e" stroke-width="1.4" stroke-linecap="round"/>'),
    eth: logo('<circle cx="12" cy="12" r="12" fill="#627eea"/><path d="M12 3.5v6.3l5.3 2.4z" fill="#fff" fill-opacity=".6"/><path d="M12 3.5 6.7 12.2 12 9.8z" fill="#fff"/><path d="M12 16.3v4.2l5.3-7.4z" fill="#fff" fill-opacity=".6"/><path d="M12 20.5v-4.2l-5.3-3.2z" fill="#fff"/><path d="M12 15.3l5.3-3.1L12 9.8z" fill="#fff" fill-opacity=".2"/><path d="M6.7 12.2 12 15.3V9.8z" fill="#fff" fill-opacity=".6"/>'),
    // Brand marks: Revolut, PayPal, Apple Pay, Google Pay and Visa are Simple Icons (CC0); the TWINT symbol is File:Twint.svg from Wikimedia Commons. Trademarks belong to their owners.
    revolut: brand('#fff', '<path fill="#111" transform="translate(5.1 5.1) scale(.58)" d="M20.9133 6.9566C20.9133 3.1208 17.7898 0 13.9503 0H2.424v3.8605h10.9782c1.7376 0 3.177 1.3651 3.2087 3.043.016.84-.2994 1.633-.8878 2.2324-.5886.5998-1.375.9303-2.2144.9303H9.2322a.2756.2756 0 0 0-.2755.2752v3.431c0 .0585.018.1142.052.1612L16.2646 24h5.3114l-7.2727-10.094c3.6625-.1838 6.61-3.2612 6.61-6.9494zM6.8943 5.9229H2.424V24h4.4704z"/>'),
    paypal: brand('#fff', '<path fill="#009cde" transform="translate(5.6 5.4) scale(.6)" d="M15.607 4.653H8.941L6.645 19.251H1.82L4.862 0h7.995c3.754 0 6.375 2.294 6.473 5.513-.648-.478-2.105-.86-3.722-.86m6.57 5.546c0 3.41-3.01 6.853-6.958 6.853h-2.493L11.595 24H6.74l1.845-11.538h3.592c4.208 0 7.346-3.634 7.153-6.949a5.24 5.24 0 0 1 2.848 4.686M9.653 5.546h6.408c.907 0 1.942.222 2.363.541-.195 2.741-2.655 5.483-6.441 5.483H8.714Z"/><path fill="#003087" transform="translate(4.6 4.4) scale(.6)" d="M15.607 4.653H8.941L6.645 19.251H1.82L4.862 0h7.995c3.754 0 6.375 2.294 6.473 5.513-.648-.478-2.105-.86-3.722-.86m6.57 5.546c0 3.41-3.01 6.853-6.958 6.853h-2.493L11.595 24H6.74l1.845-11.538h3.592c4.208 0 7.346-3.634 7.153-6.949a5.24 5.24 0 0 1 2.848 4.686M9.653 5.546h6.408c.907 0 1.942.222 2.363.541-.195 2.741-2.655 5.483-6.441 5.483H8.714Z"/>'),
    applepay: brand('#fff', '<path fill="#000" transform="translate(3 3) scale(.75)" d="M2.15 4.318a42.16 42.16 0 0 0-.454.003c-.15.005-.303.013-.452.04a1.44 1.44 0 0 0-1.06.772c-.07.138-.114.278-.14.43-.028.148-.037.3-.04.45A10.2 10.2 0 0 0 0 6.222v11.557c0 .07.002.138.003.207.004.15.013.303.04.452.027.15.072.291.142.429a1.436 1.436 0 0 0 .63.63c.138.07.278.115.43.142.148.027.3.036.45.04l.208.003h20.194l.207-.003c.15-.004.303-.013.452-.04.15-.027.291-.071.428-.141a1.432 1.432 0 0 0 .631-.631c.07-.138.115-.278.141-.43.027-.148.036-.3.04-.45.002-.07.003-.138.003-.208l.001-.246V6.221c0-.07-.002-.138-.004-.207a2.995 2.995 0 0 0-.04-.452 1.446 1.446 0 0 0-1.2-1.201 3.022 3.022 0 0 0-.452-.04 10.448 10.448 0 0 0-.453-.003zm0 .512h19.942c.066 0 .131.002.197.003.115.004.25.01.375.032.109.02.2.05.287.094a.927.927 0 0 1 .407.407.997.997 0 0 1 .094.288c.022.123.028.258.031.374.002.065.003.13.003.197v11.552c0 .065 0 .13-.003.196-.003.115-.009.25-.032.375a.927.927 0 0 1-.5.693 1.002 1.002 0 0 1-.286.094 2.598 2.598 0 0 1-.373.032l-.2.003H1.906c-.066 0-.133-.002-.196-.003a2.61 2.61 0 0 1-.375-.032c-.109-.02-.2-.05-.288-.094a.918.918 0 0 1-.406-.407 1.006 1.006 0 0 1-.094-.288 2.531 2.531 0 0 1-.032-.373 9.588 9.588 0 0 1-.002-.197V6.224c0-.065 0-.131.002-.197.004-.114.01-.248.032-.375.02-.108.05-.199.094-.287a.925.925 0 0 1 .407-.406 1.03 1.03 0 0 1 .287-.094c.125-.022.26-.029.375-.032.065-.002.131-.002.196-.003zm4.71 3.7c-.3.016-.668.199-.88.456-.191.22-.36.58-.316.918.338.03.675-.169.888-.418.205-.258.345-.603.308-.955zm2.207.42v5.493h.852v-1.877h1.18c1.078 0 1.835-.739 1.835-1.812 0-1.07-.742-1.805-1.808-1.805zm.852.719h.982c.739 0 1.161.396 1.161 1.089 0 .692-.422 1.092-1.164 1.092h-.979zm-3.154.3c-.45.01-.83.28-1.05.28-.235 0-.593-.264-.981-.257a1.446 1.446 0 0 0-1.23.747c-.527.908-.139 2.255.374 2.995.249.366.549.769.944.754.373-.014.52-.242.973-.242.454 0 .586.242.98.235.41-.007.667-.366.915-.733.286-.417.403-.82.41-.841-.007-.008-.79-.308-.797-1.209-.008-.754.615-1.113.644-1.135-.352-.52-.9-.578-1.09-.593a1.123 1.123 0 0 0-.092-.002zm8.204.397c-.99 0-1.606.533-1.652 1.256h.777c.072-.358.369-.586.845-.586.502 0 .803.266.803.711v.309l-1.097.064c-.951.054-1.488.484-1.488 1.184 0 .72.548 1.207 1.332 1.207.526 0 1.032-.281 1.264-.727h.019v.659h.788v-2.76c0-.803-.62-1.317-1.591-1.317zm1.94.072l1.446 4.009c0 .003-.073.24-.073.247-.125.41-.33.571-.711.571-.069 0-.206 0-.267-.015v.666c.06.011.267.019.335.019.83 0 1.226-.312 1.568-1.283l1.5-4.214h-.868l-1.012 3.259h-.015l-1.013-3.26zm-1.167 2.189v.316c0 .521-.45.917-1.024.917-.442 0-.731-.228-.731-.579 0-.342.278-.56.769-.593z"/>'),
    googlepay: brand('#fff', '<defs><clipPath id="gpc"><path transform="translate(2.9 2.9) scale(.76)" d="M3.963 7.235A3.963 3.963 0 00.422 9.419a3.963 3.963 0 000 3.559 3.963 3.963 0 003.541 2.184c1.07 0 1.97-.352 2.627-.957.748-.69 1.18-1.71 1.18-2.916a4.722 4.722 0 00-.07-.806H3.964v1.526h2.14a1.835 1.835 0 01-.79 1.205c-.356.241-.814.379-1.35.379-1.034 0-1.911-.697-2.225-1.636a2.375 2.375 0 010-1.517c.314-.94 1.191-1.636 2.225-1.636a2.152 2.152 0 011.52.594l1.132-1.13a3.808 3.808 0 00-2.652-1.033zm6.501.55v6.9h.886V11.89h1.465c.603 0 1.11-.196 1.522-.588a1.911 1.911 0 00.635-1.464 1.92 1.92 0 00-.635-1.456 2.125 2.125 0 00-1.522-.598zm2.427.85a1.156 1.156 0 01.823.365 1.176 1.176 0 010 1.686 1.171 1.171 0 01-.877.357H11.35V8.635h1.487a1.156 1.156 0 01.054 0zm4.124 1.175c-.842 0-1.477.308-1.907.925l.781.491c.288-.417.68-.626 1.175-.626a1.255 1.255 0 01.856.323 1.009 1.009 0 01.366.785v.202c-.34-.193-.774-.289-1.3-.289-.617 0-1.11.145-1.479.434-.37.288-.554.677-.554 1.165a1.476 1.476 0 00.525 1.156c.35.308.785.463 1.305.463.61 0 1.098-.27 1.465-.81h.038v.655h.848v-2.909c0-.61-.19-1.09-.568-1.44-.38-.35-.896-.525-1.551-.525zm2.263.154l1.946 4.422-1.098 2.38h.915L24 9.963h-.965l-1.368 3.391h-.02l-1.406-3.39zm-2.146 2.368c.494 0 .88.11 1.156.33 0 .372-.147.696-.44.973a1.413 1.413 0 01-.997.414 1.081 1.081 0 01-.69-.232.708.708 0 01-.293-.578c0-.257.12-.47.363-.647.24-.173.54-.26.9-.26Z"/></clipPath></defs><path fill="#5f6368" transform="translate(2.9 2.9) scale(.76)" d="M3.963 7.235A3.963 3.963 0 00.422 9.419a3.963 3.963 0 000 3.559 3.963 3.963 0 003.541 2.184c1.07 0 1.97-.352 2.627-.957.748-.69 1.18-1.71 1.18-2.916a4.722 4.722 0 00-.07-.806H3.964v1.526h2.14a1.835 1.835 0 01-.79 1.205c-.356.241-.814.379-1.35.379-1.034 0-1.911-.697-2.225-1.636a2.375 2.375 0 010-1.517c.314-.94 1.191-1.636 2.225-1.636a2.152 2.152 0 011.52.594l1.132-1.13a3.808 3.808 0 00-2.652-1.033zm6.501.55v6.9h.886V11.89h1.465c.603 0 1.11-.196 1.522-.588a1.911 1.911 0 00.635-1.464 1.92 1.92 0 00-.635-1.456 2.125 2.125 0 00-1.522-.598zm2.427.85a1.156 1.156 0 01.823.365 1.176 1.176 0 010 1.686 1.171 1.171 0 01-.877.357H11.35V8.635h1.487a1.156 1.156 0 01.054 0zm4.124 1.175c-.842 0-1.477.308-1.907.925l.781.491c.288-.417.68-.626 1.175-.626a1.255 1.255 0 01.856.323 1.009 1.009 0 01.366.785v.202c-.34-.193-.774-.289-1.3-.289-.617 0-1.11.145-1.479.434-.37.288-.554.677-.554 1.165a1.476 1.476 0 00.525 1.156c.35.308.785.463 1.305.463.61 0 1.098-.27 1.465-.81h.038v.655h.848v-2.909c0-.61-.19-1.09-.568-1.44-.38-.35-.896-.525-1.551-.525zm2.263.154l1.946 4.422-1.098 2.38h.915L24 9.963h-.965l-1.368 3.391h-.02l-1.406-3.39zm-2.146 2.368c.494 0 .88.11 1.156.33 0 .372-.147.696-.44.973a1.413 1.413 0 01-.997.414 1.081 1.081 0 01-.69-.232.708.708 0 01-.293-.578c0-.257.12-.47.363-.647.24-.173.54-.26.9-.26Z"/><g clip-path="url(#gpc)"><rect x="2" y="7" width="7" height="3.1" fill="#ea4335"/><rect x="2" y="10" width="2.8" height="3.4" fill="#fbbc05"/><rect x="4.8" y="10" width="4" height="3" fill="#4285f4"/><rect x="2" y="13.4" width="7" height="3" fill="#34a853"/></g>'),
    twint: brand('#000', '<svg x="5" y="3.5" width="14" height="17" viewBox="0 0 40.4 46"><defs><radialGradient cx="22.45%" cy="8.76%" fx="22.45%" fy="8.76%" r="113.287%" id="twa"><stop stop-color="#fc0" offset="0%"/><stop stop-color="#FF9100" offset="32.95%"/><stop stop-color="#FF4700" offset="47.86%"/><stop stop-color="#f00" offset="58.22%"/><stop stop-color="#f00" offset="100%"/></radialGradient><radialGradient cx="2.431%" cy="14.525%" fx="2.431%" fy="14.525%" r="139.175%" id="twb"><stop stop-color="#00B4E6" offset="0%"/><stop stop-color="#0292CD" offset="57.37%"/><stop stop-color="#054696" offset="100%"/></radialGradient></defs><path fill="#fff" d="M39.902 33.438c0 .59-.418 1.304-.933 1.599l-18.028 10.428c-.516.295-1.351.295-1.867 0l-18.028-10.428c-.516-.295-.933-1.008-.933-1.599v-20.856c0-.59.418-1.304.933-1.599l18.028-10.428c.516-.295 1.351-.295 1.867 0l18.028 10.428c.516.295.933 1.008.933 1.599v20.856z"/><path fill="url(#twa)" d="M29.414 23.059l-4.716 6.911-2.407-3.689 2.775-4.156c.516-.738 1.621-2.779.344-5.558-1.032-2.263-3.267-3.345-5.232-3.345-1.965 0-4.102 1.008-5.256 3.345-1.302 2.681-.172 4.771.319 5.485 0 0 1.547 2.263 2.825 4.181l2.088 3.025 3.144 4.821c.025.025.516.787 1.4.787.835 0 1.351-.762 1.425-.836l7.368-10.92h-4.077v-.049zm-9.26.172s-1.228-1.869-2.039-3.173c-.86-1.402.098-3.492 2.039-3.492 1.94 0 2.898 2.091 2.039 3.492-.786 1.304-2.039 3.173-2.039 3.173z"/><path fill="url(#twb)" d="M15.635 29.749l-4.618-6.493s-1.228-1.869-2.039-3.173c-.86-1.402.098-3.492 2.039-3.492.246 0 .467.025.688.098l1.621-2.976c-.737-.32-1.547-.492-2.284-.492-1.965 0-4.102 1.008-5.256 3.345-1.302 2.681-.172 4.771.319 5.485l8.081 11.978c.074.098.589.861 1.449.861.86 0 1.351-.738 1.425-.836l2.432-3.714-2.088-3.074-1.768 2.484z"/></svg>'),
    card: `<svg class="r-icon flag creditcard" viewBox="0 0 24 16" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="ccg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b2a78"/><stop offset=".55" stop-color="#4b3aa8"/><stop offset="1" stop-color="#b03a8c"/></linearGradient><clipPath id="mcc"><circle cx="7.4" cy="12" r="1.7"/></clipPath></defs><rect x="-30" y="-30" width="84" height="76" fill="url(#ccg)"/><rect x="6.2" y="3" width="3.4" height="2.6" rx=".6" fill="#f2c14e"/><path d="M6.2 4.3h3.4M7.9 3v2.6" stroke="#b8872a" stroke-width=".25"/>${[0,1,2,3,4,5,6,7].map((i) => `<circle cx="${6.4 + i * .85 + (i > 3 ? .5 : 0)}" cy="8.2" r=".33" fill="#fff" fill-opacity=".85"/>`).join("")}<circle cx="7.4" cy="12" r="1.7" fill="#eb001b"/><circle cx="9.2" cy="12" r="1.7" fill="#f79e1b"/><circle cx="9.2" cy="12" r="1.7" fill="#ff5f00" clip-path="url(#mcc)"/><path fill="#fff" transform="translate(11.9 9.2) scale(.285)" d="M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656l1.02-2.815.588 2.815zm-8.16-4.84l-1.603 7.496H8.34l1.605-7.496z"/></svg>`,
    btc: logo('<circle cx="12" cy="12" r="12" fill="#f7931a"/><text x="12" y="17.2" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="15" fill="#fff">₿</text>'),
  };
  const ICON_FOR = { swift: "tz", eu: "eu", dsfa: "receipt", paypal: "paypal", ch: "ch", uk: "gb", us: "us", revolut: "revolut", card: "card", twint: "twint", applepay: "applepay", googlepay: "googlepay", tz: "tigo", crypto: "eth", btc: "btc" };

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
    const byId = Object.fromEntries(data.regions.map((r) => [r.id, r]));
    // a region with "like" inherits everything it does not set itself (shared fees, timing, notes)
    const regions = data.regions.map((r) => (r.like ? { ...byId[r.like], ...r, like: undefined } : r));
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
    const notes = r.notes.map((n) => `<div class="note${r.warn || n.warn ? " warn" : ""}">${esc(n[lang])}</div>`).join("");

    const cta = r.cta
      ? `<div class="cta-box">${r.lead ? `<p class="lead-line"><strong>${esc(r.lead[lang])}</strong></p>` : ""}<p>${esc(r.cta.intro[lang])}</p><div class="pay-buttons"><a class="btn btn-primary pay-btn" href="${esc(r.cta.url[lang])}" target="_blank" rel="noopener">${ICONS[r.focus] || ""}<span>${esc(r.btn[lang])}</span></a></div><p class="small muted">${esc(r.cta.small[lang])}</p></div>`
      : "";
    const ft = r.feeTable;
    const fees = ft
      ? `<h4>${esc(ft.title[lang])}</h4><p>${esc(ft.intro[lang])}</p><table class="fee-table"><thead><tr>${ft.head[lang].map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${ft.rows[lang].map((row) => `<tr>${row.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table><p class="small muted">${esc(ft.foot[lang])}</p>`
      : "";

    panel.innerHTML =
      `<h3>${esc(r.method[lang])}</h3>` +
      (missing ? `<div class="note pending">${L.pending}</div>` : "") +
      cta + fees +
      (rows ? `<dl class="fields">${rows}</dl>` : "") + notes;
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
