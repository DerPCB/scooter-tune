
const BUTTON_NAMES = {
  on_off: { de: "On/Off An/Aus-Knopf", en: "On/Off Power Button" },
  light: { de: "Licht-Button", en: "Headlight Button" },
  boost: { de: "Boost-Button (G3 Max)", en: "Boost Button (G3 Max)" },
  brake_r: { de: "Bremse rechts", en: "Right Brake Lever" },
  brake_l: { de: "Bremse links", en: "Left Brake Lever" },
  throttle: { de: "Gas durchdrücken", en: "Full Throttle Depress" }
};

const REALISTIC_DEVICES = [
  {
    guess: "G3 Max",
    bleName: "NB-N4GSD2139C4812",
    mac: "D4:36:39:B8:21:40",
    signal: "-46 dBm",
    fw: "DRV 0.1.72 • BLE 1.3.9",
    hasBoost: true
  },
  {
    guess: "Navee ST3 Pro",
    bleName: "NV-ST30284481C71",
    mac: "C2:4B:88:DF:52:19",
    signal: "-58 dBm",
    fw: "DRV 0.1.58 • BLE 1.1.2",
    hasBoost: false
  },
  {
    guess: "E3 Pro",
    bleName: "NB-E3P1904719A204",
    mac: "F8:8A:5E:11:09:A4",
    signal: "-63 dBm",
    fw: "DRV 0.2.04 • BLE 1.2.0",
    hasBoost: false
  }
];

const DEFAULT_RECOVERY_STEPS = [
  { btn: "brake_l", type: "short", value: 2 },
  { btn: "throttle", type: "short", value: 1 },
  { btn: "on_off", type: "long", value: 3 }
];

const DEFAULT_STEALTH_STEPS = [
  { btn: "brake_l", type: "short", value: 3 },
  { btn: "brake_r", type: "short", value: 1 },
  { btn: "on_off", type: "long", value: 2 }
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
  startSpeed: parseInt(localStorage.getItem("tp_start_speed") || "3", 10),
  modeSpeeds: JSON.parse(localStorage.getItem("tp_mode_speeds") || '{"eco":15,"normal":25,"sport":45,"race":127}'),
  activeMode: localStorage.getItem("tp_active_mode") || "normal",
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
  cruiseState: true,
  // Sequencer state
  activeSeqTab: "stealth",
  stealthSteps: JSON.parse(localStorage.getItem("tp_stealth_steps") || JSON.stringify(DEFAULT_STEALTH_STEPS)),
  recoverySteps: JSON.parse(localStorage.getItem("tp_recovery_steps") || JSON.stringify(DEFAULT_RECOVERY_STEPS)),
  editingStepIndex: -1
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

// ----------------------------------------------------
// SEQUENCER RENDERING & LOGIC
// ----------------------------------------------------
function getCurrentSteps() {
  return (appState.activeSeqTab === "stealth") ? appState.stealthSteps : appState.recoverySteps;
}

function saveCurrentSteps(steps) {
  if (appState.activeSeqTab === "stealth") {
    appState.stealthSteps = steps;
    localStorage.setItem("tp_stealth_steps", JSON.stringify(steps));
  } else {
    appState.recoverySteps = steps;
    localStorage.setItem("tp_recovery_steps", JSON.stringify(steps));
  }
}

function renderSequencer() {
  const container = document.getElementById("seqStepsContainer");
  const countBadge = document.getElementById("seqCountBadge");
  const steps = getCurrentSteps();
  const isDe = (appState.lang === "de");

  countBadge.textContent = `${steps.length} / 5 ${isDe ? "Schritte" : "Steps"}`;
  container.innerHTML = "";

  steps.forEach((step, idx) => {
    const card = document.createElement("div");
    card.className = "seq-step-card";

    const btnInfo = BUTTON_NAMES[step.btn] || { de: step.btn, en: step.btn };
    const btnLabel = btnInfo[appState.lang] || btnInfo.en;

    let durDesc = "";
    if (step.type === "short") {
      durDesc = `${step.value}x ${isDe ? "kurz drücken" : "short tap"}`;
    } else {
      durDesc = `${step.value}s ${isDe ? "lang halten" : "long hold"}`;
    }

    card.innerHTML = `
      <div class="seq-step-left">
        <div class="seq-num-badge">Nr.${idx + 1}</div>
        <div class="seq-step-details">
          <span class="seq-step-btn-name">${btnLabel}</span>
          <span class="seq-step-dur-desc">${durDesc}</span>
        </div>
      </div>
      <button class="seq-del-btn" title="Entfernen">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none"><path d="M5 12h14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
      </button>
    `;

    // Click card to edit step
    card.addEventListener("click", (e) => {
      if (e.target.closest(".seq-del-btn")) return;
      openStepModal(idx, step);
    });

    // Click minus to remove step
    const delBtn = card.querySelector(".seq-del-btn");
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const cur = getCurrentSteps();
      cur.splice(idx, 1);
      saveCurrentSteps(cur);
      renderSequencer();
    });

    container.appendChild(card);
  });
}

function openStepModal(idx, step) {
  appState.editingStepIndex = idx;
  const modal = document.getElementById("stepModal");
  const isDe = (appState.lang === "de");

  document.getElementById("stepModalTitle").textContent = (idx >= 0)
    ? `Nr.${idx + 1} ${isDe ? "Schritt konfigurieren" : "Configure Step"}`
    : `${isDe ? "Neuen Schritt hinzufügen" : "Add New Step"}`;

  // Hide or show Boost option depending on whether connected vehicle is G3 Max
  const optBoost = document.getElementById("optBoost");
  const isG3Max = appState.connectedMeta && (appState.connectedMeta.guess === "G3 Max" || appState.connectedMeta.hasBoost);
  if (isG3Max) {
    optBoost.style.display = "block";
    optBoost.disabled = false;
  } else {
    optBoost.style.display = "none";
    optBoost.disabled = true;
    if (step && step.btn === "boost") step.btn = "on_off";
  }

  // Populate form with existing or default
  const btnSelect = document.getElementById("modalSelectButton");
  btnSelect.value = (step && step.btn) ? step.btn : "on_off";

  const isShort = (!step || step.type === "short");
  setDurationType(isShort ? "short" : "long");

  if (step && step.type === "short") {
    document.getElementById("sliderShortCount").value = step.value || 2;
    document.getElementById("valShortCount").textContent = `${step.value || 2}x`;
  } else if (step && step.type === "long") {
    document.getElementById("sliderLongSeconds").value = step.value || 3;
    document.getElementById("valLongSeconds").textContent = `${step.value || 3}s`;
  }

  modal.classList.remove("hidden");
}

function setDurationType(type) {
  const tabShort = document.getElementById("durTabShort");
  const tabLong = document.getElementById("durTabLong");
  const blockShort = document.getElementById("blockShortCount");
  const blockLong = document.getElementById("blockLongSeconds");

  if (type === "short") {
    tabShort.classList.add("active");
    tabLong.classList.remove("active");
    blockShort.classList.remove("hidden");
    blockLong.classList.add("hidden");
  } else {
    tabLong.classList.add("active");
    tabShort.classList.remove("active");
    blockLong.classList.remove("hidden");
    blockShort.classList.add("hidden");
  }
}

function closeStepModal() {
  document.getElementById("stepModal").classList.add("hidden");
  appState.editingStepIndex = -1;
}

// ----------------------------------------------------
// BLE SCANNING & REALISTIC SHU PAIRING
// ----------------------------------------------------
function renderDeviceListing() {
  const container = document.getElementById("deviceListing");
  container.innerHTML = "";

  REALISTIC_DEVICES.forEach(dev => {
    const isConnected = (appState.connectedDevice === dev.bleName);
    const card = document.createElement("div");
    card.className = `device-row-card ${isConnected ? "connected-active" : ""}`;

    const guessLabel = (appState.lang === "de") ? `Vermutlich: ${dev.guess}` : `Suspected: ${dev.guess}`;

    card.innerHTML = `
      <div class="dev-info">
        <span class="dev-guess-label">${guessLabel}</span>
        <span class="dev-title">${dev.bleName}</span>
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
        executeShuPairingWorkflow(dev);
      }
    };

    container.appendChild(card);
  });
}

function executeShuPairingWorkflow(dev) {
  const modal = document.getElementById("pairingModal");
  const title = document.getElementById("pairingModalTitle");
  const desc = document.getElementById("pairingModalDesc");
  const bar = document.getElementById("pairingProgressBar");

  modal.classList.remove("hidden");
  bar.style.width = "15%";

  // Step 1: Prompt power button press
  title.textContent = (appState.lang === "de") ? "Authentifizierung..." : "Pairing verification...";
  desc.textContent = i18n("connect.pairingPrompt", "Press power button on scooter to confirm pairing...");

  setTimeout(() => {
    bar.style.width = "50%";
    title.textContent = "DRV Region Probe";
    desc.textContent = i18n("connect.checkingRegion", "Checking region settings & UUID...");
  }, 1400);

  setTimeout(() => {
    bar.style.width = "85%";
    title.textContent = "Syncing Telemetry";
    desc.textContent = i18n("connect.checkingData", "Synchronizing controller telemetry...");
  }, 2600);

  setTimeout(() => {
    bar.style.width = "100%";
    title.textContent = "Handshake OK";
    desc.textContent = i18n("connect.handshakeComplete", "BLE handshake verified!");

    setTimeout(() => {
      modal.classList.add("hidden");
      appState.connectedDevice = dev.bleName;
      appState.connectedMeta = dev;
      localStorage.setItem("tp_connected_dev", dev.bleName);
      localStorage.setItem("tp_connected_meta", JSON.stringify(dev));
      updateHeaderStatus();
      renderDeviceListing();
      showToast(i18n("toast.connected", `Connected to ${dev.bleName}`).replace("{name}", dev.bleName));
      setTimeout(() => switchTab("dashboard"), 350);
    }, 600);
  }, 3600);
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
  }, 1200);
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
    document.getElementById("valSpeedLimit").textContent = `${appState.targetSpeed} km/h (in der Luft)`;
    document.getElementById("gaugeChipTarget").textContent = `LUFT: ${appState.targetSpeed} KM/H`;
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

  // ----------------------------------------------------
  // SEQUENCER SUB-TABS & ACTIONS
  // ----------------------------------------------------
  const tabStealth = document.getElementById("seqTabStealth");
  const tabRecovery = document.getElementById("seqTabRecovery");

  tabStealth.onclick = () => {
    appState.activeSeqTab = "stealth";
    tabStealth.classList.add("active");
    tabRecovery.classList.remove("active");
    renderSequencer();
  };

  tabRecovery.onclick = () => {
    appState.activeSeqTab = "recovery";
    tabRecovery.classList.add("active");
    tabStealth.classList.remove("active");
    renderSequencer();
  };

  document.getElementById("btnAddSeqStep").onclick = () => {
    const cur = getCurrentSteps();
    if (cur.length >= 5) {
      showToast((appState.lang === "de") ? "Maximal 5 Schritte möglich" : "Maximum 5 steps reached");
      return;
    }
    // Open modal to add step at end
    openStepModal(-1, { btn: "on_off", type: "short", value: 1 });
  };

  document.getElementById("btnSaveSequence").onclick = () => {
    showToast(i18n("tuning.sequenceSaved", "Sequence written to controller NVRAM!"));
  };

  // Step modal controls
  document.getElementById("btnCloseStepModal").onclick = closeStepModal;
  document.getElementById("btnCancelStepModal").onclick = closeStepModal;

  document.getElementById("durTabShort").onclick = () => setDurationType("short");
  document.getElementById("durTabLong").onclick = () => setDurationType("long");

  const sliderShort = document.getElementById("sliderShortCount");
  sliderShort.oninput = (e) => {
    document.getElementById("valShortCount").textContent = `${e.target.value}x`;
  };

  const sliderLong = document.getElementById("sliderLongSeconds");
  sliderLong.oninput = (e) => {
    document.getElementById("valLongSeconds").textContent = `${e.target.value}s`;
  };

  document.getElementById("btnSaveStepModal").onclick = () => {
    const btnChoice = document.getElementById("modalSelectButton").value;
    const isShort = document.getElementById("durTabShort").classList.contains("active");

    const newStep = {
      btn: btnChoice,
      type: isShort ? "short" : "long",
      value: isShort
        ? parseInt(document.getElementById("sliderShortCount").value, 10)
        : parseInt(document.getElementById("sliderLongSeconds").value, 10)
    };

    const cur = getCurrentSteps();
    if (appState.editingStepIndex >= 0 && appState.editingStepIndex < cur.length) {
      cur[appState.editingStepIndex] = newStep;
    } else {
      if (cur.length < 5) cur.push(newStep);
    }

    saveCurrentSteps(cur);
    renderSequencer();
    closeStepModal();
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
    renderSequencer();
    renderDeviceListing();
    updateHeaderStatus();
  };
}

async function startApplication() {
  applyTheme(appState.theme);
  await setLanguage(appState.lang);
  updateHeaderStatus();
  renderSequencer();
  renderDeviceListing();
  document.getElementById("valSpeedLimit").textContent = `${appState.targetSpeed} km/h (in der Luft)`;
  document.getElementById("gaugeChipTarget").textContent = `LUFT: ${appState.targetSpeed} KM/H`;
  initEventHandlers();
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

document.addEventListener("DOMContentLoaded", startApplication);
