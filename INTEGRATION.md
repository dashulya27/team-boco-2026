# BOCO 1.7.0: Papier und Welt sind verbunden

## Ein zusammenhängender Weg

Papier-Caesar (SIMPLE) → ein einziger Eingang → Weltkarte und Insel 1 →
Insel 2 mit Vigenère → PC und Geburtstagsgruß. Insel 3 bleibt ein besuchbarer
Zukunftsort ohne zusätzliche Pflichtaufgabe.

index.html leitet nur zur gemeinsamen game.html weiter; die Eingabe befindet sich
dort in paper-entry. Auch ein direkter Aufruf von game.html verwendet denselben
Controller statt einer zweiten Sperre oder Redirect-Schleife.
Der Schlüssel wird im Browser-Tab unter boco.paper-access.v1 gemerkt.
Ist Browser-Speicher nicht nutzbar, gilt die Freischaltung während der geladenen Seite.
BOCO_PREVIEW.html ist ausdrücklich eine separate Vorschau mit eigenem Speicher.

## Übereinstimmung mit Papier und Geschenk

- Vereinbartes Caesar-Ergebnis: DER SCHLUESSEL IST SIMPLE.
- SIMPLE öffnet die Welt. Die ganze Antwort sowie abweichende Großschreibung
  und Leerzeichen werden ebenfalls akzeptiert.
- Das Decoder-Rad ist ein Werkzeug, keine zweite Aufgabe.
- Das BOSE-Zubehör kann vor Ort nach der Papiermission übergeben werden.
- Insel 1 verlangt drei Katzenlieferungen; nach dem ersten Mal kommt eine Katze zurück.
- Insel 2 verwendet den vorhandenen Schlüssel direkt: keine zweite Schlüssel-Eingabe.
- Geheimtext: VIE VPWUPQCV MKB NTT FGUNHTXW I.
- Klartext: DAS GESCHENK IST BEI BOMBSITE A.
- Ort BOMBSITE A enthüllt den PC und den persönlichen deutschen Geburtstagsgruß.
- 3427 bleibt als optionaler Hinweis für den physischen Koffer im fertigen Gruß.
  Das frühere ASCII-Formular wird nicht als zusätzlicher Zugang verlangt.

Die eigentlichen gedruckten Rätselblätter und ein Scan des alten QR sind hier
nicht vorhanden. Die Übereinstimmung wurde mit dem zuvor vereinbarten Schlüssel,
nicht mit einer behaupteten Sichtprüfung einer Papierkopie umgesetzt.

## Grafische Verbindung

world-camera.js enthält Fokus, Zoom, Pan und die passende Rücktransformation
für Klicks. Nur die Weltansicht bewegt sich; linke Navigation und obere Leiste
bleiben lesbar. Die Neonverbindungen und Lichtpunkte reisen mit der Kamera.
island-decor.js ergänzt Bücher, Lesestand, Decoder-Rad, Pflanzen und Werkstatt.
Alle Inseln und der neue Eingangsplatz benutzen die gleiche 480×320-Pixelbasis.

## Veröffentlichung und Tests

Dateien in den bestehenden Klon kopieren, .git behalten, Commit und Push in PhpStorm.
Ziel: https://dashulya27.github.io/team-boco-2026/
Das enthaltene Projekt wurde nicht automatisch auf GitHub veröffentlicht.

npm test und npm run test:render prüfen den tatsächlichen zusammenhängenden Ablauf.
Das Rendern läuft in Canvas ohne Browser; die Bilder sind keine CSS-/Safari-Prüfung.
tests/browser.cjs enthält die erweiterte Browser-Prüfung für den eigenen Computer.
