# Alpen Rally – Stand

Letzte Aktualisierung: Meilenstein 1 abgeschlossen.

## Fertig
### Meilenstein 1: Gerade Strasse, Platzhalter-Auto, Steuerung
- `index.html` mit Canvas 320x180, hochskaliert auf Fenstergrösse, scharfe Pixel, Seitenverhältnis bleibt (schwarze Ränder).
- Pseudo-3D-Strasse aus Stücken, die zum Horizont schmaler werden. Abwechselnde Streifen bei Asphalt, Randstreifen (rot/weiss) und Gras. Gestrichelte Mittellinie. Komplett gerade und flach, endlos (Strecke wiederholt sich).
- Himmel in 8 Farbstufen, zwei Lagen Platzhalter-Berge.
- Platzhalter-Auto von hinten (Karosserie, Dach, Heckscheibe, Räder, Rücklichter, Rallye-Streifen, Schatten).
- Steuerung: Gas, Bremse, Lenken. Ohne Gas rollt das Auto aus. Lenken nur beim Fahren, stärker bei mehr Tempo.
- Gras bremst das Auto auf ca. 58 km/h herunter.
- Tempoanzeige in km/h unten rechts (eigene Pixelschrift).
- Alle Werte in `js/config.js`, inkl. Farben.
- Bewegung über deltaTime: 60 Hz und 144 Hz getestet, gleiches Ergebnis.

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
- Man kann neben der Strasse höchstens 10 m weit ins Gras fahren (`MAX_SEITLICH`), dann ist eine unsichtbare Wand.
