# Alpen Rally – Stand

Letzte Aktualisierung: Meilenstein 1.5 abgeschlossen (Überarbeitung von Meilenstein 1).

## Fertig
### Meilenstein 1: Gerade Strasse, Platzhalter-Auto, Steuerung
- `index.html` mit Canvas 320x180, hochskaliert auf Fenstergrösse, scharfe Pixel, Seitenverhältnis bleibt (schwarze Ränder).
- Pseudo-3D-Strasse aus Stücken, die zum Horizont schmaler werden. Abwechselnde Streifen bei Asphalt und Gras. Gestrichelte Mittellinie. Komplett gerade und flach, endlos (Strecke wiederholt sich).
- Himmel in 8 Farbstufen, zwei Lagen Platzhalter-Berge.
- Platzhalter-Auto von hinten (Karosserie, Dach, Heckscheibe, Räder, Rücklichter, Rallye-Streifen, Schatten).
- Steuerung: Gas, Bremse, Lenken. Ohne Gas rollt das Auto aus. Lenken nur beim Fahren, stärker bei mehr Tempo.
- Gras bremst das Auto auf ca. 58 km/h herunter.
- Alle Werte in `js/config.js`, inkl. Farben.
- Bewegung über deltaTime: 60 Hz und 144 Hz getestet, gleiches Ergebnis.

### Meilenstein 1.5: Fahrgefühl, Strasse, Tacho
- **Schweres 80er-Rallyauto statt Supercar:** Automatische 5-Gang-Schaltung (Höchsttempo pro Gang 50/85/125/165/200 km/h). Drehzahl ergibt sich aus Tempo und Gang (Leerlauf 1000, Begrenzer 7500 U/min). Hochschalten bei 92 % (6900 U/min), Herunterschalten unter 3000 U/min (beim starken Bremsen auch zwei Gänge auf einmal). Beim Schalten 0,2 s ohne Vortrieb, die Drehzahl fällt dabei sichtbar ab.
- Beschleunigung pro Gang einzeln einstellbar, dazu Luftwiderstand: oben raus zieht das Auto deutlich schwächer.
- Nachgerechnet (Vollgas ab Stand, Asphalt, Simulation mit dem echten Spielcode, 60 Hz und 144 Hz fast gleich): 0–100 km/h in 5,1 s, 0–150 km/h in 11,0 s, 200 km/h nach 18,8 s.
- **Strasse ohne Rennstrecken-Look:** keine rot-weissen Randstreifen mehr. Stattdessen links und rechts ein 0,8 m breites Schotter-/Erdbankett in zwei ähnlichen Brauntönen. Weisse gestrichelte Mittellinie bleibt.
- Bankett bremst leicht (auf ca. 140 km/h herunter), Gras bremst stark (auf ca. 58 km/h).
- **Analoge Anzeigen:** zwei runde Pixel-Zifferblätter unten links (Drehzahl 0–8 x1000 U/min, rot ab 7000, Gang in der Mitte, "N" im Stand) und unten rechts (Tempo 0–240 km/h, Strich alle 20, Zahl alle 40, kleine Digitalzahl). Nadeln leicht träge, damit sie nicht zittern. Grösse, Position und Farben in `js/config.js`.

## Steuerung
| Taste | Wirkung |
|---|---|
| Pfeil hoch / W | Gas |
| Pfeil runter / S | Bremse |
| Pfeil links, rechts / A, D | Lenken |

## Offen (nächste Meilensteine, siehe KONZEPT.md)
- Meilenstein 2: Kurven und Hügel.
- Danach: Untergründe, Zeit, Checkpoints, Objekte am Rand usw.

## Bekannte Macken
- Ganz hinten am Horizont flimmern die Streifen etwas (sie sind dort kleiner als ein Pixel). Bei Retro-Spielen normal.
- Die Berge bewegen sich beim Lenken nicht mit. Bei einer geraden Strasse fällt das kaum auf, mit Kurven (Meilenstein 2) sollten sie seitlich wandern.
- Lenken ist direkt, ohne Trägheit oder Rutschen. Kommt später mit den Untergründen.
- Der Luftwiderstand wirkt jetzt immer, also auch beim Ausrollen und Bremsen. Bei hohem Tempo rollt das Auto darum etwas schneller aus als vorher.
- Auf dem Tacho stehen die Zahlen 120 und 160 sehr knapp nebeneinander (das Zifferblatt ist nur 57 Pixel gross). Lesbar, aber eng.
- Die rote Nadel ist im roten Drehzahlbereich etwas schlechter zu sehen.
- Man kann neben der Strasse höchstens 10 m weit ins Gras fahren (`MAX_SEITLICH`), dann ist eine unsichtbare Wand.
