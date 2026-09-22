TUNEPRO TELEMETRY & ADVANCED SEQUENCER (V6)
============================================
NEUERUNGEN:
1. Sequencer-System (Reihenfolge Nr.1 bis Nr.5):
   - Umschaltbar zwischen:
     * "Tuning weg (sofort 20 km/h)" [Polizei-Notfallmodus]
     * "Tuning wieder da (Reaktivieren)"
   - Schritte hinzufügen (+) oben links bis max. 5 Schritte.
   - Jeder Schritt hat ein Minus-Symbol zum direkten Löschen.
   - Klick auf einen Schritt öffnet das Detail-Menü:
     * Taste wählen: On/Off-Knopf, Licht, Boost (NUR beim G3 Max sichtbar!),
       Bremse rechts, Bremse links, Gas durchdrücken.
     * Modus wählen: "Kurz drücken (wie oft 1-5x)" ODER "Lang halten (2-6 Sekunden)".
   - Genau wie in deinem Beispiel voreingestellt:
     Nr.1: Bremse links 2x kurz
     Nr.2: Gas durchdrücken 1x kurz
     Nr.3: On/Off-Knopf 3s lang halten!

2. BLE Connect Ablauf wie bei SHU:
   - Realistische Seriennummern (z.B. NB-N4GSD2139C4812) mit Label "Vermutlich: G3 Max".
   - Klick auf Connect öffnet Popup:
     * "Drücke den An/Aus-Knopf am Scooter zum Koppeln..."
     * "Checking region settings & UUID..."
     * "Synchronisiere Controller-Telemetrie..."
     * "BLE Handshake bestätigt!"

3. Modell-Benchmarks (65-75 kg Fahrer):
   - G3 Max: max. 55-70 km/h (Straße) • 127 km/h (Luft)
   - Navee ST3 Pro: max. 45-60 km/h (Straße) • 95 km/h (Luft)
   - E3 Pro: max. 40-50 km/h (Straße) • 75 km/h (Luft)

DATEIEN IM PAKET:
- index.html
- manifest.json
- sw.js
- README.txt
- css/style.css
- js/app.js
- js/i18n.js
- i18n/de.json, en.json
- icons/icon-512.png, icon-192.png, apple-touch-icon.png, favicon-32.png, icon-maskable-512.png
