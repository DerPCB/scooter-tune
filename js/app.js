
const BUTTONS = [
  { id:"brake",  label:{en:"Brake x3", de:"Bremse x3"} },
  { id:"throttle3", label:{en:"Throttle x3", de:"Gas x3"} },
  { id:"horn2", label:{en:"Horn x2", de:"Hupe x2"} },
  { id:"light2", label:{en:"Light toggle x2", de:"Licht x2"} },
  { id:"bell", label:{en:"Bell", de:"Klingel"} },
  { id:"kickstand", label:{en:"Kickstand tap", de:"Ständer-Tipp"} },
  { id:"power_hold", label:{en:"Power hold 3s", de:"Power halten 3s"} },
  { id:"brake_light", label:{en:"Brake + Light", de:"Bremse + Licht"} },
  { id:"double_tap", label:{en:"Double throttle tap", de:"Doppel-Gas-Tipp"} },
  { id:"mode_click", label:{en:"Mode button x2", de:"Modus-Taste x2"} },
  { id:"cruise", label:{en:"Cruise control tap", de:"Tempomat-Tipp"} },
  { id:"lock_hold", label:{en:"Lock button hold", de:"Sperrtaste halten"} }
];

const FAKE_DEVICES = [
  { name:"G3 Max", meta:"BLE 5.0", signal:"-46 dBm" },
  { name:"E3 Pro", meta:"BLE 5.0", signal:"-58 dBm" },
  { name:"Navee ST3 Pro", meta:"BLE 5.1", signal:"-63 dBm" }
];

const state = {
  lang: localStorage.getItem("tp_lang") || "en",
  theme: localStorage.getItem("tp_theme") || "dark",
  autoConnect: localStorage.getItem("tp_autoconnect") === "1",
  connected: localStorage.getItem("tp_connected") || "",
  panicSelection: JSON.parse(localStorage.getItem("tp_panic") || "[]"),
  wheelie: localStorage.getItem("tp_wheelie") === "1"
};

function navigate(screenId) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById("screen-" + screenId).classList.add("active");
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("tp_theme", theme);
  state.theme = theme;
}

function updateConnectionUI() {
  const dot = document.getElementById("statusDot");
  const val = document.getElementById("statusValue");
  if (state.connected) {
    dot.classList.remove("offline"); dot.classList.add("online");
    val.textContent = state.connected + " " + t("devices.connected", "Connected");
    val.removeAttribute("data-i18n");
  } else {
    dot.classList.remove("online"); dot.classList.add("offline");
    val.setAttribute("data-i18n", "home.disconnected");
    val.textContent = t("home.disconnected", "No scooter connected");
  }
}

function renderPanicChips() {
  const wrap = document.getElementById("panicChips");
  wrap.innerHTML = "";
  BUTTONS.forEach(btn => {
    const chip = document.createElement("div");
    chip.className = "chip" + (state.panicSelection.includes(btn.id) ? " active" : "");
    chip.textContent = btn.label[state.lang] || btn.label.en;
    chip.onclick = () => {
      const idx = state.panicSelection.indexOf(btn.id);
      if (idx >= 0) {
        state.panicSelection.splice(idx, 1);
      } else {
        if (state.panicSelection.length >= 12) return;
        state.panicSelection.push(btn.id);
      }
      renderPanicChips();
      updatePanicHint();
    };
    wrap.appendChild(chip);
  });
}

function updatePanicHint() {
  const hint = document.getElementById("panicHint");
  const n = state.panicSelection.length;
  const template = t("scooter.panic.hint", "{n} / 12 selected (min. 2 required)");
  hint.textContent = template.replace(/\d+ \/ 12|^0/, n + " / 12");
  hint.removeAttribute("data-i18n");
}

function genCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function realTopSpeed(setSpeed, weightKg) {
  const base = setSpeed;
  const penalty = Math.max(0, (weightKg - 60) * 0.28);
  const real = Math.max(4, Math.round(base - penalty));
  return Math.min(real, base);
}

function refreshSpeedUI() {
  const set = parseInt(document.getElementById("speedSlider").value, 10);
  const weight = parseInt(document.getElementById("weightInput").value, 10) || 75;
  document.getElementById("speedSetValue").textContent = set + " km/h";
  document.getElementById("realSpeedValue").textContent = realTopSpeed(set, weight) + " km/h";
}

function renderDeviceList() {
  const list = document.getElementById("deviceList");
  list.innerHTML = "";
  FAKE_DEVICES.forEach(dev => {
    const item = document.createElement("div");
    item.className = "device-item";
    item.innerHTML = `
      <div>
        <div class="device-name">${dev.name}</div>
        <div class="device-meta">${dev.meta}</div>
      </div>
      <div class="device-signal">${dev.signal}</div>
    `;
    item.onclick = () => {
      state.connected = dev.name;
      localStorage.setItem("tp_connected", dev.name);
      updateConnectionUI();
      navigate("home");
    };
    list.appendChild(item);
  });
}

function initEvents() {
  document.querySelectorAll("[data-nav]").forEach(btn => {
    btn.addEventListener("click", () => navigate(btn.getAttribute("data-nav")));
  });
  document.querySelectorAll("[data-back]").forEach(btn => {
    btn.addEventListener("click", () => navigate(btn.getAttribute("data-back")));
  });

  document.getElementById("openSettings").onclick = () => {
    document.getElementById("settingsDrawer").classList.add("show");
    document.getElementById("drawerOverlay").classList.add("show");
  };
  const closeDrawer = () => {
    document.getElementById("settingsDrawer").classList.remove("show");
    document.getElementById("drawerOverlay").classList.remove("show");
  };
  document.getElementById("closeSettings").onclick = closeDrawer;
  document.getElementById("drawerOverlay").onclick = closeDrawer;

  document.getElementById("btnWired").onclick = () => {
    document.getElementById("scanArea").classList.add("hidden");
    document.getElementById("deviceList").classList.add("hidden");
    document.getElementById("wiredArea").classList.remove("hidden");
    setTimeout(() => {
      state.connected = "Wired Scooter";
      localStorage.setItem("tp_connected", state.connected);
      updateConnectionUI();
      navigate("home");
    }, 1600);
  };

  document.getElementById("btnBluetooth").onclick = () => {
    document.getElementById("wiredArea").classList.add("hidden");
    document.getElementById("deviceList").classList.add("hidden");
    document.getElementById("scanArea").classList.remove("hidden");
    setTimeout(() => {
      document.getElementById("scanArea").classList.add("hidden");
      renderDeviceList();
      document.getElementById("deviceList").classList.remove("hidden");
    }, 1800);
  };

  document.getElementById("savePanic").onclick = () => {
    if (state.panicSelection.length < 2) return;
    localStorage.setItem("tp_panic", JSON.stringify(state.panicSelection));
    const code = genCode();
    localStorage.setItem("tp_recovery", code);
    document.getElementById("recoveryCode").textContent = code;
    document.getElementById("recoveryBox").classList.remove("hidden");
  };

  document.getElementById("speedSlider").oninput = refreshSpeedUI;
  document.getElementById("weightInput").oninput = refreshSpeedUI;

  document.querySelectorAll(".mode-slider").forEach(slider => {
    slider.oninput = () => {
      const mode = slider.getAttribute("data-mode");
      document.querySelector(`[data-mode-value="${mode}"]`).textContent = slider.value + " km/h";
    };
  });

  document.getElementById("wheelieToggle").checked = state.wheelie;
  document.getElementById("wheelieToggle").onchange = (e) => {
    state.wheelie = e.target.checked;
    localStorage.setItem("tp_wheelie", state.wheelie ? "1" : "0");
  };

  document.getElementById("autoConnectToggle").checked = state.autoConnect;
  document.getElementById("autoConnectToggle").onchange = (e) => {
    state.autoConnect = e.target.checked;
    localStorage.setItem("tp_autoconnect", state.autoConnect ? "1" : "0");
  };

  document.getElementById("themeToggle").checked = state.theme === "light";
  document.getElementById("themeToggle").onchange = (e) => {
    setTheme(e.target.checked ? "light" : "dark");
  };

  const langSelect = document.getElementById("languageSelect");
  populateLanguageSelect(langSelect);
  langSelect.onchange = async (e) => {
    state.lang = e.target.value;
    localStorage.setItem("tp_lang", state.lang);
    await loadLanguage(state.lang);
    renderPanicChips();
    updateConnectionUI();
  };
}

async function init() {
  setTheme(state.theme);
  renderPanicChips();
  updatePanicHint();
  refreshSpeedUI();
  initEvents();
  await loadLanguage(state.lang);
  updateConnectionUI();
  if (state.panicSelection.length) {
    const stored = localStorage.getItem("tp_recovery");
    if (stored) {
      document.getElementById("recoveryCode").textContent = stored;
      document.getElementById("recoveryBox").classList.remove("hidden");
    }
  }
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

document.addEventListener("DOMContentLoaded", init);
