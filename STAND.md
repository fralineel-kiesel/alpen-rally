# Alpen Rally – Stand

Letzte Aktualisierung: Meilenstein 2.5 abgeschlossen (Kurven-Physik, neue Strecke, sichtbare Hügel).

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
(Strecke, Kurvenwerte und Fliehkraft wurden mit Meilenstein 2.5 ersetzt, siehe unten.)
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

### Meilenstein 2.5: Kurven-Physik, neue Strecke, sichtbare Hügel
- **Grenztempo pro Kurvenstärke** (`KURVEN_GRENZTEMPO`): Stärke 1 = 190, 2 = 150, 3 = 120, 4 = 95, 5 = 75, 6 = 55 km/h. Zwischenwerte werden gemischt, auf der Geraden gibt es kein Limit.
- **Auslastung** = Tempo / Grenztempo.
  - Bis 100 %: Das Auto hält die Spur, man muss etwas gegenlenken (genau am Limit ca. 80 % Einschlag, `KURVEN_LENKBEDARF`). Starkes Lenken kostet leicht Tempo (`LENK_TEMPOVERLUST`, 6 km/h pro Sekunde bei vollem Einschlag).
  - Über 100 % (Untersteuern): Mehr Lenken hilft nicht mehr. Das Auto rutscht nach aussen, mit dem Quadrat der Überschreitung (`UNTERSTEUERN_KRAFT`: 10 % zu schnell = kaum, 20 % = man kommt an den Rand, 50 % = sofort im Gras) und verliert Tempo (`UNTERSTEUERN_TEMPOVERLUST`: 50 km/h pro Sekunde bei doppeltem Grenztempo).
- **Neue Teststrecke** (`js/track.js`): 26 Abschnitte, Rundkurs 2,87 km. Zwei Haarnadeln, zwei Kehren, S-Kurven, Kuppe, Senke, Gefälle. Höchster Punkt 53 m, tiefster 30 m unter dem Start. Der letzte Abschnitt hat `hoehe: 'auto'` und gleicht die Höhe selbst aus (ergibt 31 m auf 200 m, also 15,5 % bergauf). Überblendung zwischen Abschnitten nur noch über 20 % der Länge des kürzeren Abschnitts (`UEBERGANG_ANTEIL`).
- **Kurven im Bild verstärkt** (`KURVEN_OPTIK` 20): Eine Kehre schwenkt die Strasse schon auf 40 m Entfernung um mehr als eine halbe Bildbreite weg.
- **Hügel im Bild verstärkt** (`HOEHEN_OPTIK` 1,6): Hinter der Kuppe verschwindet die Strasse klar, beim Gefälle sieht man sie nach unten wegtauchen, in der Senke sieht man die Gegensteigung.
- **Horizont kippt mit:** Horizont und Berge verschieben sich je nach Steigung der nächsten 25 m (bergauf nach unten, bergab nach oben), höchstens 10 Pixel, geglättet.
- **Steigung beim Fahren:** Bergauf weniger Antrieb (10 % Steigung = 35 % weniger), bergab mehr (10 % Gefälle = 30 % mehr). Dazu echte Schwerkraft (`HANGABTRIEB` 9,81): Ohne Gas rollt man bergab weiter und ist bergauf schnell langsam.
- **Kein harter Deckel bei 200 km/h mehr:** Bergab (ab 8 % Gefälle) bis 216 km/h, die Drehzahl geht dann bis 8100 in den roten Bereich. Danach bremst der Motor sanft auf 200 zurück (`MOTORBREMSE`). Die Schaltung wurde dafür nicht geändert.
- **Zeichenfehler am Horizont behoben:** Weit hinten sind Strassenstücke oft weniger als ein Pixel hoch und wurden weggelassen. In Kurven läuft die ferne Strasse aber fast waagrecht, viele Stücke liegen auf derselben Bildzeile nebeneinander – übrig blieben einzelne, abgerissene Striche. Jetzt werden diese Stücke nachgetragen, und jede Zeile deckt die ganze Spanne der Strasse ab. Die Mittellinie wird erst ab 10 Pixel Strassenbreite gezeichnet (`MITTELLINIE_AB_PIXEL`), damit hinten keine weissen Punkte schweben. Automatisch nachgezählt in 1722 Bildern über die ganze Strecke: vorher ca. 3300 abgerissene Stücke, jetzt 9 (das sind Stellen, wo die Strasse wirklich hinter einem Hügel verschwindet und daneben wieder auftaucht).
- Nebeneffekt: Die Mittellinie in engen Kurven ist nicht mehr treppig, sondern durchgehend.
- **Debug-Anzeige (F3):** zusätzlich "AUSLASTUNG" in Prozent (über 100 % = Untersteuern).
- Nachgerechnet (Simulation mit dem echten Spielcode, 60 Hz und 144 Hz gleich):
  - Haarnadel mit 200 km/h: Auto landet im Gras und fällt auf ca. 50 km/h. Mit 55 km/h: weicht höchstens 0,2 m von der Mitte ab. Mit 65 km/h: etwas weit (0,7 m).
  - Stärke 1 mit Vollgas (200 km/h): problemlos, 0,6 m Abweichung. Stärke 2 mit 200 km/h: knapp ins Gras.
  - Vollgas ohne Bremsen: Gras in 9 Abschnitten (beide Haarnadeln, beide Kehren, Links 4, Links 5, Rechts 4, Rechts 5, Rechts 2). Rundenzeit: Vollgas 105,7 s, wer vor den Kurven bremst und leicht über dem Limit fährt 103,5 s, ganz brav auf dem Limit 107,9 s.
  - Flach: 0–100 km/h weiterhin ca. 5 s, 200 km/h nach ca. 20 s. 10 % bergauf ab Stand: nach 20 s erst 121 km/h. 10 % bergab: 216 km/h nach 14 s.

## Steuerung
| Taste | Wirkung |
|---|---|
| Pfeil hoch / W | Gas |
| Pfeil runter / S | Bremse |
| Pfeil links, rechts / A, D | Lenken |
| F3 | Debug-Anzeige ein/aus |

## Offen (nächste Meilensteine, siehe KONZEPT.md)
- Meilenstein 3: Landschaft (Bäume, Büsche, Felsen, Leitplanken, Wegweiser, Waldkulisse im Hintergrund).
- Meilenstein 4: Untergründe (Asphalt/Schotter/Schlamm), Zeit, Checkpoints, Beifahrer.
- Danach: Berg-Hintergrund, Menü, Auto-Sprites, Sound usw.

## Bekannte Macken
- Ganz hinten am Horizont flimmern die Streifen etwas (sie sind dort kleiner als ein Pixel). Bei Retro-Spielen normal.
- Wie bei allen Pseudo-3D-Spielen sind Kurven nur "aufgemalt": Eine Kehre dreht sich nicht wirklich um 180 Grad, die Strasse biegt sich nur stark zur Seite. Das Auto steht immer gerade.
- Schaut man ein Gefälle hinunter, ist zwischen Horizont und Strasse eine grosse leere Wiese (es gibt noch keine Landschaft dazwischen). Mit den verstärkten Höhen fällt das jetzt stärker auf. Kommt mit Meilenstein 3.
- Die Berg-Silhouette wiederholt sich alle 320 Pixel. An der Nahtstelle passen die Höhen nicht ganz (1–2 Pixel Sprung), fällt kaum auf.
- Rutschen je nach Untergrund gibt es noch nicht (kommt mit Meilenstein 4).
- Der Luftwiderstand wirkt jetzt immer, also auch beim Ausrollen und Bremsen. Bei hohem Tempo rollt das Auto darum etwas schneller aus als vorher.
- Auf dem Tacho stehen die Zahlen 120 und 160 sehr knapp nebeneinander (das Zifferblatt ist nur 57 Pixel gross). Lesbar, aber eng.
- Die rote Nadel ist im roten Drehzahlbereich etwas schlechter zu sehen.
- Man kann neben der Strasse höchstens 10 m weit ins Gras fahren (`MAX_SEITLICH`), dann ist eine unsichtbare Wand.
- Vollgas durch alle Kurven ist nur ca. 2 s pro Runde langsamer als sauberes Bremsen (gemessen mit einem "perfekten" Computer-Fahrer; ein Mensch verliert im Gras mehr). Grund: Das Gras bremst nur auf 58 km/h, und das Untersteuern bremst einen "gratis" mit. Falls es sich zu billig anfühlt: `UNTERSTEUERN_KRAFT` erhöhen.
- Knapp über dem Grenztempo kann man plötzlich nicht mehr nach innen lenken (die Reifen sind am Limit). Das ist gewollt, fühlt sich aber an der Grenze etwas abrupt an.
- Der "Rückweg zum Start" ist mit 15,5 % sehr steil (ergibt sich aus der Höhenliste) und darum zäh, man fährt dort ca. 60–75 km/h.
- In Kurven, die sich weit hinten fast waagrecht durchs Bild ziehen, sieht man ganz am Horizont eine lange, 1 Pixel dünne graue Linie. Das ist die echte Strasse, die zur Seite wegläuft.
- Die Automatik schaltet nur nach Drehzahl. Bergauf bleibt sie darum manchmal zu lange in einem hohen Gang, bevor sie herunterschaltet.
- Sehr knapp unter dem Horizont kann man die Strasse hinter einem Hügel verschwinden und daneben wieder auftauchen sehen, mit 1 Pixel Wiese dazwischen (das ist richtig so, sieht aber ohne Landschaft etwas seltsam aus).
