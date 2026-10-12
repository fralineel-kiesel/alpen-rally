# Alpen Rally – Regeln für Claude Code

## Worum es geht
Retro-Pixel-Rallyspiel im Pseudo-3D-Stil (OutRun-Prinzip), das im Browser läuft.
Lies zuerst `KONZEPT.md` (Spielidee, Stil, Autos, Meilensteine), danach `STAND.md` (was schon fertig ist). Falls `STAND.md` fehlt, lege sie an.

## Wer mit dir arbeitet
Lino ist Informatik-Lehrling, aber kein Programmierer. Er testet das Spiel und gibt Rückmeldung, schreibt aber keinen Code selbst. Deshalb:
- Schreibe Code-Kommentare auf Deutsch, kurz, und erkläre das "Warum", nicht nur das "Was".
- Schreibe die Zusammenfassung am Ende in einfachem Deutsch, ohne unerklärte Fachbegriffe.

## Technik (nicht verhandelbar)
- Reines JavaScript und HTML5 Canvas. Keine Frameworks, kein npm, kein Build-Schritt, keine Bibliotheken von aussen.
- Normale `<script>`-Dateien, keine ES-Module (`import`/`export`). So läuft `index.html` auch per Doppelklick.
- `index.html` liegt im Hauptordner, damit GitHub Pages es direkt ausliefert.
- Interne Auflösung 320x180, hochskaliert mit scharfen Pixeln (CSS `image-rendering: pixelated`, Canvas-Glättung aus). Seitenverhältnis immer beibehalten.
- Alle Bewegungen laufen über deltaTime (Zeit seit dem letzten Frame), nicht "pro Frame". Das Spiel muss auf 60-Hz- und 144-Hz-Bildschirmen gleich schnell sein.
- Alle Tuning-Zahlen (Beschleunigung, Bremskraft, Lenkung, Höchsttempo usw.) stehen in `js/config.js`, jeweils mit einem Kommentar, was die Zahl bewirkt.

## Ordnerstruktur
```
index.html        Einstiegsseite
js/config.js      alle einstellbaren Werte
js/input.js       Tastatur (später Gamepad)
js/road.js        Strasse und Perspektive
js/car.js         Auto und Fahrphysik
js/render.js      Zeichnen (Himmel, Berge, Strasse, Auto, Anzeige)
js/main.js        Spielschleife, verbindet alles
assets/           Grafiken und Sounds (später)
KONZEPT.md        Spielidee
STAND.md          aktueller Fortschritt
```
Halte Dateien klein und übersichtlich. Neue Dateien nur, wenn sie wirklich Sinn machen.

## Arbeitsweise
- Mache nur, was im Auftrag steht. Keine Extras, kein Umbauen von bereits Fertigem. Fällt dir etwas Wichtiges auf, schreibe es in die Zusammenfassung, setze es aber nicht ungefragt um.
- Mache kleine, sinnvolle Commits mit deutscher Beschreibung.
- Prüfe vor der Abgabe jede JavaScript-Datei mit `node --check datei.js`, damit keine Syntaxfehler drin sind.
- Weisst du bei Fahrgefühl oder Optik nicht weiter, wähle einen vernünftigen Wert, mache ihn in `config.js` einstellbar und erwähne ihn in der Zusammenfassung.
- Am Ende jeder Aufgabe:
  1. `STAND.md` aktualisieren (was ist fertig, was ist offen, bekannte Macken).
  2. Kurze Zusammenfassung schreiben: Was ist neu? Wie teste ich es (Steuerung)? Was sind bekannte Macken? Was wäre der sinnvolle nächste Schritt?

## Inhalt und Recht
- Keine echten Marken, Logos oder Autonamen. Autos haben Fantasienamen (siehe `KONZEPT.md`).
- Keine fremden Grafiken, Sounds oder Schriften ohne Lizenzangabe in `assets/LIZENZEN.md`. Aktuell wird alles selbst per Code gezeichnet.
- Keine Passwörter, Schlüssel oder persönlichen Daten im Repo.
