# TEAM BOCO // DOMINIK 2026

Vollständiges statisches Geburtstagsspiel, Version **1.4.1**.
Die russische Anleitung zum Ersetzen des bestehenden Projekts steht in
[START_HERE_RU.md](START_HERE_RU.md).

**Ablauf:** Papier-Caesar → SIMPLE → Katzeninsel mit drei Lieferungen →
Vigenère → Binär/ASCII → Geschenk bei BOMBSITE A mit Koffer-Code 3427.
Enthalten sind eine spielbare Katzeninsel und das komplette Rätsel-Finale.

## Start und Veröffentlichung

Zieladresse: https://dashulya27.github.io/team-boco-2026/

Alle Laufzeitdateien, das Original-BOCO-Logo, ein QR-Code zur Zieladresse und
ein eigenständig gezeichneter Raumhintergrund sind enthalten. Kein Backend,
keine API-Schlüssel und kein Build-Schritt sind zum Spielen erforderlich.

In PhpStorm `index.html` mit **Open in Browser** öffnen. Die URL muss mit
`http://` beginnen, nicht mit `file://`.

Alternativ, wenn Node.js installiert ist:

```bash
npm start
```

Danach http://127.0.0.1:5500/ öffnen. Hierfür ist `npm install` nicht erforderlich.
Mit Python funktioniert auch `python -m http.server 5500` im Projektordner.

GitHub Pages: Dateien im Stamm des bestehenden Repositories veröffentlichen;
bei Veröffentlichung aus einem Branch `main` und `/(root)` wählen.
Die neue Version ist erst nach Commit, Push und erfolgreichem Pages-Deployment online.

## Steuerung und Fortschritt

Enter/Klick startet die Insel und das Intro; WASD/Pfeile bewegen Dominik.
E halten nimmt eine nahe Katze auf. Zur offenen Tür laufen, um sie abzugeben.
Die erste Katze kehrt einmal zurück: insgesamt drei Lieferungen.
R startet das Level neu, Esc öffnet die Karte. Touch-Geräte haben Bildschirmtasten.

Nach drei Lieferungen öffnet sich das Final-Terminal automatisch.
Fortschritt bleibt beim Neuladen im selben Browser-Tab erhalten (`sessionStorage`).
Für einen frischen Spieldurchlauf ein neues privates Browserfenster öffnen.
Der Zugang ist ein Spielrätsel, keine technische Zugriffssicherung.

## Prüfungen

```bash
npm test
```

Die Standardtests benötigen nur Node.js. Sie prüfen Antworten, den tatsächlichen
Spielablauf mit drei Lieferungen, das Finale, den Eingang, die Dateien und den lokalen Server.

Optionale Browserprüfung und Erzeugung des bereits enthaltenen Hintergrunds:

```bash
npm install
npx playwright install chromium
npm run test:browser
npm run build:room
```

Die Browserprüfung startet einen eigenen Testserver unter `/team-boco-2026/`.
Testbilder landen in `test-artifacts/` und gehören nicht in das veröffentlichte Paket.
Weitere Details und die Reihenfolge der Papiermaterialien: [INTEGRATION.md](INTEGRATION.md).

Quellen für den Veröffentlichungsweg:
[PhpStorm: Open in Browser](https://www.jetbrains.com/help/phpstorm/running-applications.html),
[GitHub Pages: Publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
