
const BUTTON_COMBINATIONS = [
  { id: "brake3", label: { en: "Brake Lever x3", de: "Bremshebel x3" } },
  { id: "throttle3", label: { en: "Throttle Double-Tap", de: "Doppel-Gashebel" } },
  { id: "horn2", label: { en: "Horn Signal x2", de: "Hupenimpuls x2" } },
  { id: "light2", label: { en: "Headlight Cycle x2", de: "Licht-Schalter x2" } },
  { id: "bell", label: { en: "Mechanical Bell", de: "Klingelimpuls" } },
  { id: "kickstand", label: { en: "Kickstand Switch", de: "Seitenständer-Sensor" } },
  { id: "power_hold", label: { en: "Power Long-Press (3s)", de: "Power-Taste lang (3s)" } },
  { id: "brake_light", label: { en: "Brake + Headlight", de: "Bremse + Licht zeitgleich" } },
  { id: "mode_cycle", label: { en: "Profile Button x2", de: "Modus-Taste doppelt" } },
  { id: "cruise_tap", label: { en: "Cruise Button Tap", de: "Tempomat-Taster" } },
  { id: "brake_hold", label: { en: "Brake Full-Hold (5s)", de: "Bremse voll halten (5s)" } },
  { id: "lock_pulse", label: { en: "Lock Switch x2", de: "Sperrschalter x2" } }
];

const SCAN_DEVICES = [
  { name: "G3 Max", mac: "D4:36:39:B8:21:40", signal: "-46 dBm", battery: 92, fw: "DRV 0.1.72" },
  { name: "E3 Pro", mac: "F8:8A:5E:11:09:A4", signal: "-58 dBm", battery: 84, fw: "DRV 0.2.04" },
  { name: "Navee ST3 Pro", mac: "C2:4B:88:DF:52:19", signal: "-63 dBm", battery: 78, fw: "DRV 0.1.58" }
];

const appState = {
  lang: localStorage.getItem("tp_lang") || "en",
  theme: localStorage.getItem("tp_theme") || "dark",
  activeTab: "dashboard",
  connectedDevice: localStorage.getItem("tp_connected_dev") || "",
  connectedMeta: JSON.parse(localStorage.getItem("tp_connected_meta") || "null"),
  connectionType: localStorage.getItem("tp_conn_type") || "ble",
  autoConnect: localStorage.getItem("tp_autoconnect") === "1",
  targetSpeed: parseInt(localStorage.getItem("tp_target_speed") || "127", 10),
  riderWeight: parseInt(localStorage.getItem("tp_rider_weight") || "75", 10),
  startSpeed: parseInt(localStorage.getItem("tp_start_speed") || "3", 10),
  modeSpeeds: JSON.parse(localStorage.getItem("tp_mode_speeds") || '{"eco":15,"normal":25,"sport":45,"race":127}'),
  activeMode: localStorage.getItem("tp_active_mode") || "normal",
  panicChips: JSON.parse(localStorage.getItem("tp_panic_chips") || "[]"),
  recoveryPin: localStorage.getItem("tp_recovery_pin") || "",
  phaseAmps: parseInt(localStorage.getItem("tp_phase_amps") || "32", 10),
  regenAmps: parseInt(localStorage.getItem("tp_regen_amps") || "18", 10),
  throttleCurve: localStorage.getItem("tp_throttle_curve") || "expo",
  wheelieAssist: localStorage.getItem("tp_wheelie_assist") === "1",
  wheelieAngle: parseInt(localStorage.getItem("tp_wheelie_angle") || "28", 10),
  fluxWeakening: localStorage.getItem("tp_flux_weakening") === "1",
  fluxCurrent: parseInt(localStorage.getItem("tp_flux_current") || "12", 10),
  thermalThrottle: localStorage.getItem("tp_thermal_throttle") !== "0",
  lightState: false,
  regenState: "MED",
  lockState: false,
  cruiseState: true
};

function showToast(msg) {
  const toast = document.getElementById("appToast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("tp_theme", theme);
  appState.theme = theme;
  document.getElementById("toggleTheme").checked = (theme === "light");
}

function switchTab(tabId) {
  appState.activeTab = tabId;
  document.querySelectorAll(".screen-view").forEach(view => {
    view.classList.toggle("active", view.id === `view-${tabId}`);
  });
  document.querySelectorAll(".tabbar-item").forEach(item => {
    item.classList.toggle("active", item.getAttribute("data-tab-target") === tabId);
  });
  document.querySelector(".content-scroll").scrollTop = 0;
}

function updateHeaderStatus() {
  const pillText = document.getElementById("headerStatusText");
  const dot = document.getElementById("headerDot");
  if (appState.connectedDevice) {
    pillText.textContent = appState.connectedDevice;
    dot.className = "pulse-indicator online";
  } else {
    pillText.textContent = i18n("dash.notConnected", "No controller link");
    dot.className = "pulse-indicator offline";
  }
}

function updateSpeedCalculations() {
  const set = appState.targetSpeed;
  const isDe = (appState.lang === "de");

  document.getElementById("valSpeedLimit").textContent = `${set} km/h (in der Luft)`;
  document.getElementById("valRealSpeed").textContent = isDe ? "KANN STARK ABWEICHEN" : "CAN DEVIATE HEAVILY";
  document.getElementById("gaugeChipTarget").textContent = `LUFT: ${set} KM/H`;
  document.getElementById("gaugeChipEffective").textContent = isDe ? "STRASSE: KANN STARK ABWEICHEN" : "ROAD: CAN DEVIATE HEAVILY";

  const penaltyNote = document.getElementById("valWeightPenaltyNote");
  penaltyNote.textContent = isDe
    ? `${set} km/h wird nur mit frei schwebendem Rad in der Luft erreicht. Auf Asphalt weicht die reale Geschwindigkeit durch dein Gewicht, Gegenwind und Rollwiderstand extrem stark nach unten ab.`
    : `127 km/h only reachable with wheel elevated in the air. On asphalt, road speed deviates significantly due to rider weight, tire friction, and battery voltage sag.`;
}

function renderPanicChips() {
  const container = document.getElementById("panicChipsContainer");
  container.innerHTML = "";
  BUTTON_COMBINATIONS.forEach(btn => {
    const chip = document.createElement("button");
    chip.type = "button";
    const isSelected = appState.panicChips.includes(btn.id);
    chip.className = `chip-item ${isSelected ? "selected" : ""}`;
    chip.textContent = btn.label[appState.lang] || btn.label.en;
    chip.onclick = () => {
      const idx = appState.panicChips.indexOf(btn.id);
      if (idx >= 0) {
        appState.panicChips.splice(idx, 1);
      } else {
        if (appState.panicChips.length >= 12) return;
        appState.panicChips.push(btn.id);
      }
      localStorage.setItem("tp_panic_chips", JSON.stringify(appState.panicChips));
      renderPanicChips();
      updatePanicHintText();
    };
    container.appendChild(chip);
  });
}

function updatePanicHintText() {
  const hint = document.getElementById("panicSelectionHint");
  const count = appState.panicChips.length;
  const tmpl = i18n("tuning.panicHint", "Selected: {n} / 12 (minimum 2 required)");
  hint.textContent = tmpl.replace("{n}", String(count));
}

function renderDeviceListing() {
  const container = document.getElementById("deviceListing");
  container.innerHTML = "";

  SCAN_DEVICES.forEach(dev => {
    const isConnected = (appState.connectedDevice === dev.name);
    const card = document.createElement("div");
    card.className = `device-row-card ${isConnected ? "connected-active" : ""}`;

    card.innerHTML = `
      <div class="dev-info">
        <span class="dev-title">${dev.name}</span>
        <span class="dev-meta">${dev.mac} • ${dev.fw}</span>
      </div>
      <div class="dev-right">
        <span class="dev-signal-val">${dev.signal}</span>
        <button class="btn-connect-pill ${isConnected ? "disconnect" : ""}">
          ${isConnected ? i18n("connect.disconnect", "Disconnect") : i18n("connect.pairDevice", "Connect")}
        </button>
      </div>
    `;

    card.onclick = () => {
      if (isConnected) {
        appState.connectedDevice = "";
        appState.connectedMeta = null;
        localStorage.removeItem("tp_connected_dev");
        localStorage.removeItem("tp_connected_meta");
        updateHeaderStatus();
        renderDeviceListing();
        showToast(i18n("toast.disconnected", "Disconnected from vehicle"));
      } else {
        appState.connectedDevice = dev.name;
        appState.connectedMeta = dev;
        localStorage.setItem("tp_connected_dev", dev.name);
        localStorage.setItem("tp_connected_meta", JSON.stringify(dev));
        updateHeaderStatus();
        renderDeviceListing();
        showToast(i18n("toast.connected", `Connected to ${dev.name}`).replace("{name}", dev.name));
        setTimeout(() => switchTab("dashboard"), 400);
      }
    };

    container.appendChild(card);
  });
}

function triggerHardwareScan(isWired) {
  const banner = document.getElementById("scanBanner");
  const label = document.getElementById("scanLabel");
  const list = document.getElementById("deviceListing");

  list.style.opacity = "0.3";
  banner.classList.remove("hidden");
  label.textContent = isWired
    ? i18n("connect.wiredProbing", "Probing COM ports (/dev/ttyUSB0)...")
    : i18n("connect.scanning", "Scanning 2.4 GHz spectrum...");

  setTimeout(() => {
    banner.classList.add("hidden");
    list.style.opacity = "1";
    renderDeviceListing();
  }, 1400);
}

function initEventHandlers() {
  document.querySelectorAll("[data-tab-target]").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.getAttribute("data-tab-target")));
  });

  document.getElementById("headerPillStatus").addEventListener("click", () => switchTab("connect"));

  const drawer = document.getElementById("settingsDrawer");
  const scrim = document.getElementById("drawerScrim");
  document.getElementById("openSettings").onclick = () => {
    drawer.classList.add("show");
    scrim.classList.add("show");
  };
  const closeSettings = () => {
    drawer.classList.remove("show");
    scrim.classList.remove("show");
  };
  document.getElementById("closeSettings").onclick = closeSettings;
  scrim.onclick = closeSettings;

  document.getElementById("protocolBLE").onclick = () => {
    document.getElementById("protocolBLE").classList.add("active");
    document.getElementById("protocolWired").classList.remove("active");
    appState.connectionType = "ble";
    localStorage.setItem("tp_conn_type", "ble");
    triggerHardwareScan(false);
  };

  document.getElementById("protocolWired").onclick = () => {
    document.getElementById("protocolWired").classList.add("active");
    document.getElementById("protocolBLE").classList.remove("active");
    appState.connectionType = "wired";
    localStorage.setItem("tp_conn_type", "wired");
    triggerHardwareScan(true);
  };

  document.querySelectorAll("[data-mode-select]").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll("[data-mode-select]").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      appState.activeMode = tab.getAttribute("data-mode-select");
      localStorage.setItem("tp_active_mode", appState.activeMode);
      showToast(`Riding profile: ${appState.activeMode.toUpperCase()}`);
    });
  });

  const btnLight = document.getElementById("btnLightToggle");
  btnLight.onclick = () => {
    appState.lightState = !appState.lightState;
    btnLight.classList.toggle("active", appState.lightState);
    document.getElementById("lightStateText").textContent = appState.lightState ? "ON" : "OFF";
  };

  const regenStates = ["OFF", "LOW", "MED", "HIGH"];
  const btnRegen = document.getElementById("btnRegenToggle");
  btnRegen.onclick = () => {
    const curIdx = regenStates.indexOf(appState.regenState);
    appState.regenState = regenStates[(curIdx + 1) % regenStates.length];
    document.getElementById("regenStateText").textContent = appState.regenState;
    btnRegen.classList.toggle("active", appState.regenState !== "OFF");
  };

  const btnLock = document.getElementById("btnLockToggle");
  btnLock.onclick = () => {
    appState.lockState = !appState.lockState;
    btnLock.classList.toggle("active", appState.lockState);
    document.getElementById("lockStateText").textContent = appState.lockState ? "LOCKED" : "UNLOCKED";
  };

  const btnCruise = document.getElementById("btnCruiseToggle");
  btnCruise.onclick = () => {
    appState.cruiseState = !appState.cruiseState;
    btnCruise.classList.toggle("active", appState.cruiseState);
    document.getElementById("cruiseStateText").textContent = appState.cruiseState ? "ACTIVE" : "OFF";
  };

  const sliderSpeed = document.getElementById("sliderSpeedLimit");
  sliderSpeed.value = appState.targetSpeed;
  sliderSpeed.oninput = (e) => {
    appState.targetSpeed = parseInt(e.target.value, 10);
    localStorage.setItem("tp_target_speed", appState.targetSpeed);
    updateSpeedCalculations();
  };

  const selectStart = document.getElementById("selectStartSpeed");
  selectStart.value = String(appState.startSpeed);
  selectStart.onchange = (e) => {
    appState.startSpeed = parseInt(e.target.value, 10);
    localStorage.setItem("tp_start_speed", appState.startSpeed);
  };

  const setupModeSlider = (id, key, labelId) => {
    const sl = document.getElementById(id);
    sl.value = appState.modeSpeeds[key];
    document.getElementById(labelId).textContent = `${sl.value} km/h`;
    sl.oninput = (e) => {
      appState.modeSpeeds[key] = parseInt(e.target.value, 10);
      document.getElementById(labelId).textContent = `${e.target.value} km/h`;
      localStorage.setItem("tp_mode_speeds", JSON.stringify(appState.modeSpeeds));
    };
  };
  setupModeSlider("sliderModeEco", "eco", "valModeEco");
  setupModeSlider("sliderModeDrive", "normal", "valModeDrive");
  setupModeSlider("sliderModeSport", "sport", "valModeSport");
  setupModeSlider("sliderModeRace", "race", "valModeRace");

  document.getElementById("btnSavePanic").onclick = () => {
    if (appState.panicChips.length < 2) {
      showToast("Select at least 2 triggers");
      return;
    }
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    appState.recoveryPin = pin;
    localStorage.setItem("tp_recovery_pin", pin);
    document.getElementById("pinDisplay").textContent = pin;
    document.getElementById("recoveryBadgeCard").classList.remove("hidden");
    showToast(i18n("tuning.recoverySaved", "PIN stored in controller NVRAM"));
  };

  const sliderPhase = document.getElementById("sliderPhaseCurrent");
  sliderPhase.value = appState.phaseAmps;
  sliderPhase.oninput = (e) => {
    appState.phaseAmps = parseInt(e.target.value, 10);
    localStorage.setItem("tp_phase_amps", appState.phaseAmps);
    document.getElementById("valPhaseCurrent").textContent = `${appState.phaseAmps} A`;
  };

  const sliderRegen = document.getElementById("sliderRegenCurrent");
  sliderRegen.value = appState.regenAmps;
  sliderRegen.oninput = (e) => {
    appState.regenAmps = parseInt(e.target.value, 10);
    localStorage.setItem("tp_regen_amps", appState.regenAmps);
    document.getElementById("valRegenCurrent").textContent = `${appState.regenAmps} A`;
  };

  const selectCurve = document.getElementById("selectThrottleCurve");
  selectCurve.value = appState.throttleCurve;
  selectCurve.onchange = (e) => {
    appState.throttleCurve = e.target.value;
    localStorage.setItem("tp_throttle_curve", appState.throttleCurve);
  };

  document.getElementById("btnApplyAll").onclick = () => {
    showToast(i18n("toast.saved", "Parameters committed to controller NVRAM"));
  };

  const toggleWheelie = document.getElementById("toggleWheelie");
  toggleWheelie.checked = appState.wheelieAssist;
  toggleWheelie.onchange = (e) => {
    appState.wheelieAssist = e.target.checked;
    localStorage.setItem("tp_wheelie_assist", appState.wheelieAssist ? "1" : "0");
  };

  const sliderWheelie = document.getElementById("sliderWheelieAngle");
  sliderWheelie.value = appState.wheelieAngle;
  sliderWheelie.oninput = (e) => {
    appState.wheelieAngle = parseInt(e.target.value, 10);
    localStorage.setItem("tp_wheelie_angle", appState.wheelieAngle);
    document.getElementById("valWheelieAngle").textContent = `${appState.wheelieAngle}°`;
  };

  const toggleFlux = document.getElementById("toggleFlux");
  toggleFlux.checked = appState.fluxWeakening;
  toggleFlux.onchange = (e) => {
    appState.fluxWeakening = e.target.checked;
    localStorage.setItem("tp_flux_weakening", appState.fluxWeakening ? "1" : "0");
  };

  const sliderFlux = document.getElementById("sliderFluxCurrent");
  sliderFlux.value = appState.fluxCurrent;
  sliderFlux.oninput = (e) => {
    appState.fluxCurrent = parseInt(e.target.value, 10);
    localStorage.setItem("tp_flux_current", appState.fluxCurrent);
    document.getElementById("valFluxCurrent").textContent = `${appState.fluxCurrent} A`;
  };

  const toggleThermal = document.getElementById("toggleThermal");
  toggleThermal.checked = appState.thermalThrottle;
  toggleThermal.onchange = (e) => {
    appState.thermalThrottle = e.target.checked;
    localStorage.setItem("tp_thermal_throttle", appState.thermalThrottle ? "1" : "0");
  };

  const toggleAuto = document.getElementById("toggleAutoConnect");
  toggleAuto.checked = appState.autoConnect;
  toggleAuto.onchange = (e) => {
    appState.autoConnect = e.target.checked;
    localStorage.setItem("tp_autoconnect", appState.autoConnect ? "1" : "0");
  };

  document.getElementById("toggleTheme").onchange = (e) => {
    applyTheme(e.target.checked ? "light" : "dark");
  };

  const langSelect = document.getElementById("selectAppLanguage");
  initLanguageDropdown(langSelect);
  langSelect.onchange = async (e) => {
    const code = e.target.value;
    localStorage.setItem("tp_lang", code);
    appState.lang = code;
    await setLanguage(code);
    renderPanicChips();
    updatePanicHintText();
    renderDeviceListing();
    updateHeaderStatus();
    updateSpeedCalculations();
  };
}

async function startApplication() {
  applyTheme(appState.theme);
  await setLanguage(appState.lang);
  updateHeaderStatus();
  updateSpeedCalculations();
  renderPanicChips();
  updatePanicHintText();
  renderDeviceListing();

  if (appState.recoveryPin) {
    document.getElementById("pinDisplay").textContent = appState.recoveryPin;
    document.getElementById("recoveryBadgeCard").classList.remove("hidden");
  }

  initEventHandlers();
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

document.addEventListener("DOMContentLoaded", startApplication);
