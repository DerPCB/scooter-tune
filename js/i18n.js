
const AVAILABLE_LANGS = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Espanol" },
  { code: "fr", label: "Francais" },
  { code: "tr", label: "Turkce" },
  { code: "pl", label: "Polski" },
  { code: "pt", label: "Portugues" },
  { code: "it", label: "Italiano" },
  { code: "ru", label: "Russian" }
];

let currentDict = {};

function getStoredLang() {
  return localStorage.getItem("tp_lang") || "en";
}

function getNested(obj, path) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined) ? acc[key] : undefined, obj);
}

async function fetchLangFile(code) {
  try {
    const res = await fetch(`i18n/${code}.json`);
    if (!res.ok) throw new Error("missing");
    return await res.json();
  } catch (e) {
    return null;
  }
}

async function loadLanguage(code) {
  let dict = await fetchLangFile(code);
  if (!dict) dict = await fetchLangFile("en");
  currentDict = dict || {};
  document.documentElement.lang = code;
  applyTranslations();
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    const value = getNested(currentDict, key);
    if (value) el.textContent = value;
  });
}

function t(key, fallback) {
  return getNested(currentDict, key) || fallback || key;
}

function populateLanguageSelect(selectEl) {
  selectEl.innerHTML = "";
  AVAILABLE_LANGS.forEach(l => {
    const opt = document.createElement("option");
    opt.value = l.code;
    opt.textContent = l.label;
    selectEl.appendChild(opt);
  });
  selectEl.value = getStoredLang();
}
