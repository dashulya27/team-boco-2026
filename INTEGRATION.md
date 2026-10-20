# BOCO: Papier → Spiel → Geschenk

## Bestehender Einstieg

GitHub Pages antwortet unter https://dashulya27.github.io/team-boco-2026/.
Die neue index.html ersetzt die bisherige SYSTEM-LOCKED-Seite am gleichen Pfad.
Ein bereits gedruckter QR-Code bleibt verwendbar, WENN er genau auf diesen
Pfad verweist. Sein tatsächlicher Inhalt wurde noch nicht nachgewiesen.

## Projektdateien und tatsächlicher Stand

- index.html: fertiger Zugang mit dem Papier-Schlüssel SIMPLE; Groß-/Kleinschreibung
  und Leerzeichen werden normalisiert. Fehlende Spieldateien werden angezeigt.
- game.html, main.js, cat-island.js, styles.css, mission.js: integrierte Version 1.4.1.
- assets/rooms/cat-room/cat-room-structure.png: eigenständig gezeichneter,
  vollständiger Hintergrund, im Paket enthalten. Das ursprüngliche Raumbild wurde
  nicht mitgeliefert. Es kann später an genau diesem Pfad eingesetzt werden,
  sofern es zur vorhandenen 960×640-Kollisionskarte passt.
- room-background.js: dieselbe Raumstruktur als Canvas-Reserve; die Erzeugung
  des enthaltenen PNGs ist mit scripts/build-room.mjs reproduzierbar.
- Möbel, Spielfiguren, Katzenlogik und Beleuchtung stammen aus der gelieferten
  Katzeninsel. Das Paket benötigt keine zusätzlichen Dateien aus BocoGame.

Die Zugangskontrolle ist ein Rätselmechanismus, keine Zugriffssicherheit.

## Verbindung mit den bereits gedruckten Blättern

1. Caesar-Blatt + optionales Decoder-Rad: DER SCHLUESSEL IST SIMPLE.
2. SIMPLE in der Startseite eingeben und das vorhandene Spiel starten.
3. Vigenère erst nach Abschluss der Spielaufgaben freischalten. Die gedruckte
   Tabelle ist ein Werkzeug und kann benutzt werden. Den gedruckten Arbeitsbogen
   mit dem Geheimtext bis zu diesem Zeitpunkt zurückhalten.
4. Geheimtext: VIE VPWUPQCV MKB NTT FGUNHTXW I
   Schlüssel: SIMPLE. Ergebnis: DAS GESCHENK IST BEI BOMBSITE A.
5. Die abschließende Prüfung des physischen Koffer-Codes verwendet 3427.
   Vor Ort ebenfalls 3427 einstellen. Keine zusätzliche BOCO/2626-Abfrage einbauen.

Nach der dritten Katzenlieferung öffnet sich automatisch das Final-Terminal.
Nach richtiger Ortsantwort folgt ASCII/Binär mit vier Ziffern. Die finale Antwort
ist 3427. Fortschritt wird für den Browser-Tab in sessionStorage gespeichert.
Ein direkter Aufruf von game.html ohne Papier-Zugang führt zur Startseite zurück.

## Veröffentlichen und Prüfen

Das Projektpaket enthält keine .git- oder .idea-Verzeichnisse.
Seinen Inhalt in das bereits geklonte team-boco-2026 kopieren, Dateien ersetzen,
dann in diesem bestehenden Repository committen und pushen. Anleitung: START_HERE_RU.md.
Die GitHub-Verbindung von PhpStorm reicht dafür; eine ChatGPT-Verbindung ist nicht nötig.
GitHub Pages muss weiter aus dem bisherigen Projektpfad bereitstellen.
Danach inkognito prüfen: QR öffnen, falsches Wort testen, SIMPLE eingeben,
Spiel bis zum Ende spielen, Vigenère und Koffer-Code prüfen.

## Durchgeführte Prüfungen

- npm test: Cipher/ASCII-Abgleich, drei echte Katzenlieferungen in der Simulation,
  sichere Katzengrenzen, ein Abschluss-Callback und die tatsächlichen Formularhandler
  des Final-Terminals inklusive falscher Antworten und Wiederaufnahme bestanden.
- Eingang: falsche Wörter, SIMPLE in verschiedener Schreibweise und fehlende
  Spieldateien geprüft.
- Intro und Chase mit der tatsächlichen Zeichenfunktion gerendert.
- Chromium: tatsächliche Tastatureingabe, drei Lieferungen in der echten Spielinstanz,
  automatischer Übergang zum Final-Terminal, falsche/richtige Orts- und Codeantwort,
  Neuladen und Fortsetzen bestanden. Der Test fügt die Spiel-Automation nur im
  Testbrowser ein; das veröffentlichte main.js enthält keine Debug-/Cheat-Schnittstelle.
- GitHub-ähnlicher Unterpfad /team-boco-2026/, 1366×768, 1280×600 und 1024×600
  sowie Touch-Ansichten 390×844 und 844×390 geprüft; keine JS- oder HTTP-Fehler.
- Das sind Chromium-Tests einschließlich mobiler Emulation, kein Test auf einem
  physischen iPhone/Safari. Nach dem echten Push die veröffentlichte Adresse prüfen.

## Bereits gedruckte Materialien

- Ausgeben: Caesar und optionales Rad; die Vigenère-Tabelle als Werkzeug.
- Vigenère-Arbeitsblatt und Hinweiskarten erst am Final-Terminal ausgeben.
- Den alten Auftragstext korrigieren: „Löse zuerst das Caesar-Rätsel.
  Das Schlüsselwort brauchst du für den Spielzugang.“
- Geschenkkarte erst zum Geschenk legen. Das alte NAVI-Bonusrätsel gehört nicht
  zur Freischaltung; keine BOCO- oder NAVI-Zwischenantwort erforderlich.
- Bestehende physische Koffer auf 3427 einstellen.
