
const AVAILABLE_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "de", name: "Deutsch" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "it", name: "Italiano" },
  { code: "nl", name: "Nederlands" },
  { code: "pl", name: "Polski" },
  { code: "pt", name: "Português" },
  { code: "tr", name: "Türkçe" },
  { code: "ru", name: "Русский" },
  { code: "zh", name: "中文" }
];

let currentDictionary = {};

function getActiveLanguage() {
  return localStorage.getItem("tp_lang") || "de";
}

function resolvePath(obj, path) {
  if (!obj) return undefined;
  return path.split(".").reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
}

async function fetchLanguageFile(code) {
  try {
    const res = await fetch(`i18n/${code}.json`);
    if (!res.ok) throw new Error("not found");
    return await res.json();
  } catch (err) {
    return null;
  }
}

async function setLanguage(code) {
  let dict = await fetchLanguageFile(code);
  if (!dict) dict = await fetchLanguageFile("de");
  currentDictionary = dict || {};
  document.documentElement.lang = code;
  translateDOM();
}

function translateDOM() {
  document.querySelectorAll("[data-i18n]").forEach(node => {
    const key = node.getAttribute("data-i18n");
    const val = resolvePath(currentDictionary, key);
    if (val !== undefined) node.textContent = val;
  });
}

function i18n(key, fallback = "") {
  return resolvePath(currentDictionary, key) || fallback || key;
}

function initLanguageDropdown(selectEl) {
  selectEl.innerHTML = "";
  AVAILABLE_LANGUAGES.forEach(lang => {
    const opt = document.createElement("option");
    opt.value = lang.code;
    opt.textContent = lang.name;
    selectEl.appendChild(opt);
  });
  selectEl.value = getActiveLanguage();
}
