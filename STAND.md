# Alpen Rally – Stand

Letzte Aktualisierung: Meilenstein 2 abgeschlossen (Kurven und Hügel).

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

### Meilenstein 2: Kurven und Hügel
- **Strecke als Liste in `js/track.js`:** 21 Abschnitte mit Name, Länge (m), Kurvenstärke (-6 bis +6, minus = links) und Höhenänderung (m). Kann ohne anderen Code geändert werden. Daraus baut `road.js` beim Start 3000 Strassenstücke à 2 m.
- Rundkurs, genau 6,0 km. Zwischen zwei Abschnitten wird Kurve und Steigung auf 60 m weich übergeblendet (`UEBERGANG`). Ergeben die Höhen zusammen nicht 0, gleicht das Spiel den Rest aus und meldet es in der Browser-Konsole.
- Teststrecke: Start-Gerade, weite Kurven (1–2), S-Kurve links-rechts (3), Kuppe (+14/-14 m), Senke (-12/+12 m), Kehre links (6) bergab, Kehre rechts (5) bergauf, Passhöhe, langes Gefälle mit Kurven 2–4, Ziel-Gerade. Höchster Punkt 69 m über dem Start, steilste Stelle 8,8 %.
- **Darstellung:** Strasse biegt sich zum Horizont hin, steigt und fällt. Hinter Kuppen wird die Strasse verdeckt (gezeichnet wird von nah nach fern, nur was höher liegt als das bisher Gezeichnete). Kamera fährt mit der Strassenhöhe mit, der Horizont bleibt fix. Sichtweite 200 Stücke = 400 m (`SICHTWEITE`).
- Berge wandern in Kurven seitlich (vordere Lage schneller als hintere), abhängig von Kurve und Tempo.
- **Fahrgefühl:** Fliehkraft trägt das Auto in Kurven nach aussen (Kurvenwert x Tempo² x `FLIEHKRAFT_FAKTOR`). Grenztempo pro Kurvenstärke in `KURVEN_GRENZTEMPO`: Stärke 6 = 60, 5 = 75, 4 = 95, 3 = 120, 2 = 155, 1 = 200 km/h. Beim Grenztempo braucht man ca. 80 % Lenkeinschlag, ca. 25 % darüber wird man trotz vollem Einschlag hinausgetragen (nachgerechnet: Kehre 6 hält man bis ca. 76 km/h).
- Steigung bremst bergauf, schiebt bergab (`HANGABTRIEB`, bei 10 % Steigung 0,6 m/s pro Sekunde).
- Lenkung leicht träge (`LENK_TRAEGHEIT` 0,12 s).
- **Debug-Anzeige (F3):** FPS, Position auf der Strecke, Abschnittsname, aktuelle Kurvenstärke, Steigung in %. Die Pixelschrift kann dafür jetzt alle Grossbuchstaben und Ä, Ö, Ü.
- Nachgerechnet (Simulation mit dem echten Spielcode, 60 Hz und 144 Hz fast gleich): Mit Vollgas ohne Bremsen landet man in der S-Kurve, beiden Kehren und im Gefälle im Gras. Mit dem Grenztempo kommt man überall durch und weicht höchstens 0,8 m von der Mitte ab.

## Steuerung
| Taste | Wirkung |
|---|---|
| Pfeil hoch / W | Gas |
| Pfeil runter / S | Bremse |
| Pfeil links, rechts / A, D | Lenken |
| F3 | Debug-Anzeige ein/aus |

## Offen (nächste Meilensteine, siehe KONZEPT.md)
- Meilenstein 3: Untergründe (Asphalt/Schotter/Schlamm), Zeit, Checkpoints, Beifahrer.
- Danach: Objekte am Rand, Berg-Hintergrund, Menü, Auto-Sprites, Sound usw.

## Bekannte Macken
- Ganz hinten am Horizont flimmern die Streifen etwas (sie sind dort kleiner als ein Pixel). Bei Retro-Spielen normal.
- Die Mittellinie wirkt in engen Kurven nahe beim Auto etwas treppig (Pixel-Look, jede Bildzeile wird einzeln gerundet).
- Wie bei allen Pseudo-3D-Spielen sind Kurven nur "aufgemalt": Eine Kehre dreht sich nicht wirklich um 180 Grad, die Strasse biegt sich nur stark zur Seite. Das Auto steht immer gerade.
- Schaut man eine Senke hinunter, ist zwischen Horizont und Strasse einfach Wiese (es gibt noch keine Landschaft dazwischen).
- Die Berg-Silhouette wiederholt sich alle 320 Pixel. An der Nahtstelle passen die Höhen nicht ganz (1–2 Pixel Sprung), fällt kaum auf.
- Rutschen je nach Untergrund gibt es noch nicht (kommt mit Meilenstein 3).
- Der Luftwiderstand wirkt jetzt immer, also auch beim Ausrollen und Bremsen. Bei hohem Tempo rollt das Auto darum etwas schneller aus als vorher.
- Auf dem Tacho stehen die Zahlen 120 und 160 sehr knapp nebeneinander (das Zifferblatt ist nur 57 Pixel gross). Lesbar, aber eng.
- Die rote Nadel ist im roten Drehzahlbereich etwas schlechter zu sehen.
- Man kann neben der Strasse höchstens 10 m weit ins Gras fahren (`MAX_SEITLICH`), dann ist eine unsichtbare Wand.
