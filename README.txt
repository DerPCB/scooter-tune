TUNEPRO SCOOTER - INSTALLATIONSANLEITUNG
==========================================

Diese App ist eine PWA (Progressive Web App). Sie laeuft im Browser,
verhaelt sich aber wie eine echte App mit eigenem Icon auf dem Homescreen.

SCHRITT 1: Hosting einrichten (kostenlos)
------------------------------------------
Du brauchst eine HTTPS-Adresse, damit dein Handy die App installieren kann.
Empfehlung: GitHub Pages (komplett kostenlos).

1. Erstelle ein kostenloses GitHub-Konto (falls noch nicht vorhanden): github.com
2. Erstelle ein neues, oeffentliches Repository, z.B. "scooter-tune".
3. Lade den kompletten Inhalt dieses ZIP-Ordners (alle Dateien und Unterordner)
   direkt in das Repository hoch ("Add file" -> "Upload files").
4. Gehe zu Settings -> Pages.
5. Waehle bei "Branch" den Branch "main" und Ordner "/ (root)", dann Save.
6. Nach ca. 1-2 Minuten bekommst du eine Adresse wie:
   https://deinname.github.io/scooter-tune/

Alternativen (ebenfalls kostenlos, gehen genauso): Netlify.com oder Vercel.com
(Ordner per Drag & Drop hochladen, HTTPS-Link wird automatisch erstellt).

SCHRITT 2: App auf dem Handy oeffnen
------------------------------------------
1. Oeffne die Adresse aus Schritt 1 im Browser auf deinem Handy.
   - Android: am besten Chrome verwenden.
   - iPhone: Safari verwenden (Pflicht, andere Browser koennen auf iOS
     keine App installieren).

SCHRITT 3: Icon auf den Homescreen bringen
------------------------------------------
ANDROID (Chrome):
- Es erscheint automatisch ein Banner "App installieren" oder
- Tippe auf die drei Punkte oben rechts -> "App installieren" bzw.
  "Zum Startbildschirm hinzufuegen".
- Bestaetigen -> das Icon erscheint auf deinem Homescreen.

IPHONE (Safari):
- Tippe auf das Teilen-Symbol (Quadrat mit Pfeil nach oben) unten in der Leiste.
- Scrolle runter und tippe auf "Zum Home-Bildschirm".
- Tippe oben rechts auf "Hinzufuegen".
- Das Icon erscheint auf deinem Homescreen.

SCHRITT 4: App oeffnen
------------------------------------------
Tippe auf das neue Icon auf deinem Homescreen. Die App oeffnet sich
im Vollbild, ganz ohne Browser-Adressleiste - genau wie eine echte
installierte App.

WICHTIG
------------------------------------------
- Die App funktioniert komplett offline nach dem ersten Laden (Service Worker
  cached alle Dateien).
- Standardsprache ist Englisch, Deutsch ist vollstaendig uebersetzt und
  ueber das Zahnrad-Menue -> Language waehlbar.
- Alle Funktionen (Panic-Code, Geschwindigkeiten, Bluetooth-Scan, Firmware-
  Unlock, Wheelie Optimizer) sind rein visuell/kosmetisch und speichern nur
  lokal im Browser (localStorage) - es findet keine echte Kommunikation mit
  einem Scooter statt.
