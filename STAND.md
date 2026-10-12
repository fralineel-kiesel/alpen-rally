# Alpen Rally – Stand

Letzte Aktualisierung: Meilenstein 3.6 abgeschlossen (gemeinsame Band-Funktion, Holzzaun als Band, Felswand wird zum Hang mit keilförmigen Enden).

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

### Meilenstein 3: Landschaft, Strassenrand-Objekte, Kollisionen
- **Vorab-Korrektur bergab** (Rückmeldung: bergab beschleunigt das Auto zu stark):
  - Antriebsbonus bergab `ANTRIEB_BERGAB` 3 → 1 (bei 10 % Gefälle +10 % statt +30 % Antrieb).
  - Erlaubtes Übertempo bergab `BERGAB_UEBERTEMPO` 0,08 → 0,03 (206 statt 216 km/h).
  - Neu `HANGABTRIEB_BERGAB` 7 (vorher galt bergab wie bergauf 9,81): Rollen und Schieben bergab etwas schwächer.
  - Nachgerechnet bei 10 % Gefälle (alt → neu): 0–150 km/h 6,9 → 8,4 s (flach: ca. 11 s), 100–195 km/h 7,0 → 8,8 s (flach 12,9 s), 5 s Rollen ab 150 km/h endet bei 107 → 102 km/h (flach 90).
- **Sprites** (`js/sprites.js`): Alles als Textraster im Code, beim Start einmal in kleine Bilder umgewandelt. Erdige Palette ohne reines Schwarz. Fichte gross/klein (je 2 Varianten), Laubbaum (2), Busch (2), Fels (2 Formen), Leitplanke, Kurvenschild (Pfeil links, für rechts gespiegelt; in 3.5 entfernt), Wegweiser (ohne Ortsnamen), Holzzaun, Kuh (2), dazu 3 Wolkenformen. Bäume, Büsche, Felsen, Kühe werden zufällig gespiegelt. Jeder Sprite hat Höhe in Metern, "fest" oder "weich" und eine Kollisionsbreite.
- **Platzierung** (`js/scenery.js`): Jeder Abschnitt in `track.js` hat ein Feld `umgebung` (wald, wiese, fels, lichtung) und optional `dichte` (das "Gefälle gerade" hat 1,5 = dichter Wald). Die Umgebungen stehen als gut lesbare Liste von "Reihen" in `scenery.js` (Abstand zum Bankett, im Schnitt alle wie viele Meter, welche Sprites wie häufig). Fester Zufalls-Seed (`SZENERIE_SEED`): Bei jedem Start steht alles am selben Ort (geprüft). Nichts steht auf Strasse oder Bankett (geprüft, mindestens `SZENERIE_MIN_ABSTAND` 0,3 m Luft). Objekte überlappen sich nicht am selben Platz; was zuerst steht (Leitplanke, Zaun, Schild), hat Vorrang. Insgesamt ca. 2440 Objekte auf der Runde.
- **Leitplanken** automatisch an der Aussenseite aller Kurven ab Stärke 4 (und ab Stärke 3 mit mind. 4 % Gefälle), 16 m vor bis 16 m nach der Kurve. (Seit 3.5 als durchgehendes Band gezeichnet, siehe unten.)
- ~~Kurvenschilder~~ (in 3.5 durch Temposchilder ersetzt).
- **Darstellung:** Objekte hängen an den Strassenstücken und werden mit derselben Perspektive gezeichnet (näher = grösser), ohne Glättung. Reihenfolge von weit nach nah. Hinter Kuppen wird jedes Objekt an der Bildzeile abgeschnitten, ab der nähere Strasse liegt (hohe Bäume hinter einer Kuppe zeigen also nur noch die Spitze, wie in echt). Objekte unter 2 Pixel Höhe werden weggelassen. Das Auto wird über die Objekte hinter ihm gezeichnet; Objekte, die näher an der Kamera sind als das Auto, kommen danach.
- **Hintergrund:** Waldlinie aus kleinen Pixel-Tannen (zwei Reihen, gezackt) direkt über dem Horizont, wandert in Kurven schneller als die Berge (`WALDLINIE_PARALLAX` 110, Berge 40/70). 5 Pixel-Wolken treiben langsam nach rechts und wandern in Kurven leicht mit (`WOLKEN_DRIFT`, `WOLKEN_PARALLAX`, Positionen in `WOLKEN`).
- **Kollisionen** (Werte in `config.js`): Fest (Baum, Fels, Leitplanke, Schild, Wegweiser, Zaun, Kuh): Tempo auf 25 %, 0,3 s Bildwackeln (2 Pixel), Auto wird auf die Strassenseite des Objekts versetzt, danach 1 s keine weitere Kollision. Das Getriebe schaltet von selbst passend herunter (meist in den 1. Gang). Weich (Busch): Tempo −15 %, jeder Busch nur einmal. Nachgerechnet (60 und 144 Hz gleich): mit 106 km/h in den Zaun → 26 km/h, Auto kommt frei und ist nach 4,4 s wieder auf der Strassenmitte.
- **Leistung:** Pro Bild je nach Stelle ca. 20 (Kehren) bis 280 (Wald) Objekte, gezeichnet in ca. 1,1 ms (Budget bei 60 Hz: 16,7 ms). Mit künstlich 4-fach gebremstem Prozessor 99 % der Bilder unter 13 ms. Sicherheitsgrenze `MAX_OBJEKTE` 300 (die nächsten zuerst), wird auf der aktuellen Strecke nie erreicht (höchstens 284).
- **Debug-Anzeige (F3):** zusätzlich "OBJEKTE" (gezeichnet in diesem Bild / Grenze).

### Meilenstein 3.5: Leitplanke, Schilder, Alpen-Gelände
- **Leitplanke als durchgehendes Band.** Ursache der Treppen geprüft: Jedes 4-m-Stück war ein eigenes, flaches Bild, das immer zur Kamera schaut. Es kann der Strasse nicht folgen: In Kurven liegt das nächste Stück seitlich und höher versetzt, als waagrechtes Rechteck daneben, und weil jedes auf ganze Pixel gerundet wird, springen die Kanten noch dazu. Das Runden allein war also nicht schuld, sondern das flache Bild.
  - Neu wird die Planke wie die Strasse gezeichnet: pro Strassenstück (2 m) ein Viereck von seinem nahen bis zu seinem fernen Ende. Das nächste Stück beginnt genau an diesen Ecken, darum gibt es weder Spalt noch Versatz, und das Band folgt Kurven und Hügeln. Silbergrauer Balken in zwei Grautönen (oben hell, unten dunkler) mit heller Lichtlinie oben, weit hinten mindestens 1 Pixel hoch. Darunter alle 4 m ein dunkler Pfosten (kleines Bild, gleicher Ankerpunkt wie das Band). Hinter Kuppen wird das Band wie alles andere abgeschnitten.
  - Wo sie steht: wie bisher an der Aussenseite enger Kurven, neu zusätzlich überall auf der Talseite. Die Leitplanke links in der Umgebung "fels" ist weggefallen: Welche Seite die Talseite ist, sagt jetzt das Gelände (in der "Haarnadel links" wäre sie sonst vor der Felswand gestanden).
  - Kollision wie bisher (fest, ein Eintrag alle 2 m). Höhen und Farben in `config.js` (`PLANKE_...`, `PFOSTEN_...`).
- **Temposchilder statt Kurvenschilder.** Die gelben Pfeilschilder sind ganz weg. Neu: runde weisse Scheibe mit rotem Rand, schwarze Zahl, auf einem Pfosten, 120 m vor jeder Kurve ab Stärke 3, immer rechts. 3 = 80, 4 = 60, 5 = 50, 6 = 40 (einstellbar in `TEMPOSCHILD_ZAHLEN`, für jede Zahl wird das Bild beim Start selbst erzeugt). Die Ziffern kommen aus einer eigenen 3x5-Pixelschrift in `sprites.js`. 13 Schilder auf der Runde (4x 80, 4x 60, 2x 50, 3x 40). Fest wie die anderen Schilder; steht dort eine Leitplanke, steht das Schild dahinter. Kein Einfluss aufs Fahren. Die Scheibe ist mit 1,3 m bewusst grösser als in echt, damit man die Zahl lesen kann.
  - Wegweiser bleiben wie bisher.
- **Alpen-Gelände.** Neues Feld `gelaende` in `track.js` (Werte: `keins`, `wand_links_tal_rechts`, `wand_rechts_tal_links`, `tal_links`, `tal_rechts`), wie vorgegeben für alle 26 Abschnitte eingetragen. Unbekannte Werte (Tippfehler) werden zu `keins`, mit Warnung in der Konsole. Die andere Seite folgt weiter der Umgebung.
  - ~~**Felswand:**~~ (in 3.6 durch den Hang ersetzt, siehe unten) pro Strassenstück ein Viereck (gemeinsame Kanten), senkrecht, 28 m hoch (`WAND_HOEHE`, 3,5-mal die Strassenbreite). Oberkante ausgefranst (grobe Wellen plus feines Zittern, bei jedem Start gleich). 4 Gesteinsschichten in Grau und Braun mit leicht gewellten Grenzen, helle Linie an der Oberkante, ein paar dunkle Risse und Grasbüschel. Davor 3 m Geröllstreifen (`WAND_ABSTAND`) mit ab und zu einem Fels oder Busch, keine Bäume. Aufprall an der Wand wie an einem Fels (Tempo auf 25 %, Wackeln, Auto wird Richtung Strassenmitte versetzt).
  - **Abhang:** hinter 2,2 m Grasstreifen (`TAL_RANDSTREIFEN`, dort steht die Leitplanke) eine erdige Abbruchkante. Dahinter fällt ein Hang ab (dunkelgrün mit Streifen) zum Talboden 35 m unter der Strasse (`TAL_TIEFE`). Hang und Talboden sind wie die Strasse Vierecke pro Stück. Der Talboden ist ein blaugrüner Flickenteppich aus Wiesen und Waldstücken mit kleinen bläulichen Bäumen, in der Ferne in 4 Stufen heller (Dunst). Ganz hinten eine Dunst-Landschaft unter dem Horizont: 5 Streifen von bläulich-grau (weit) bis blaugrün (näher) mit sanften Hügelketten und kleinen Baumwipfeln. Sie wandert in Kurven seitlich mit. Auf der Talseite stehen bis 15 m ab Strassenmitte keine hohen Bäume (`TAL_BAUMFREI`).
  - **Übergänge:** Die Wand wächst an der Abschnittsgrenze über 40 m aus dem Boden und sinkt am Ende wieder (`GELAENDE_UEBERGANG`). Der Abhang öffnet sich genauso: Die Kante kommt von weit draussen heran, gleichzeitig wird das Tal tiefer. Folgen zwei Abschnitte mit gleichem Gelände auf derselben Seite, läuft es ohne Übergang weiter. Kurze Abschnitte (unter 80 m) erreichen die volle Höhe nur in der Mitte.
  - Hinter Kuppen wird alles verdeckt wie die Strasse (auf Bildschirmfotos an Kuppe, Senke, Gefälle und den Kehren geprüft, nichts scheint durch; keine Prüfung Bild für Bild über die ganze Runde).
  - Liegt die Strasse weiter vorne tiefer als der nähere Talboden (Gefälle hinunter in die Senke), bleibt der Talboden davor sichtbar, statt von der fernen Wiese übermalt zu werden.
- **Bergkulisse:** hintere Berge höher und schroffer (bis 68 Pixel), die 7 höchsten Gipfel mit Schneekappen aus weissen und hellblauen Pixeln, auf der Schattenseite mehr Hellblau, Schneegrenze unregelmässig (`SCHNEE_AB`, `SCHNEE_MENGE`). Neu ganz hinten eine dritte, helle Dunst-Bergebene, die sich am langsamsten verschiebt (`BERG_PARALLAX_FERN` 20). Alle drei Ebenen werden beim Start einmal vorgezeichnet und dann nur noch hinkopiert.
- **Debug-Anzeige (F3):** zusätzlich "GELÄNDE" links und rechts, z. B. "L WAND 100%  R TAL 45%" (unter 100 % = im Übergang).
- **Leistung** (gemessen in Chromium ohne Grafikkarte, also eher langsamer als im echten Browser, je ein Bild alle 2,5 m über die ganze Runde):
  - Normal: Median 3,3 ms pro Bild, 99 % unter 6,9 ms (vorher 1,5 / 3,2 ms). Budget bei 60 Hz: 16,7 ms.
  - Mit künstlich 4-fach gebremstem Prozessor: Median 11,9 ms, 99 % unter 29 ms (vorher mit derselben Messung 8,0 / 22 ms). Die Zahlen sind höher als die 13 ms im Stand von Meilenstein 3, weil diese Messung jedes Bild wirklich fertig zeichnen lässt.
  - Massnahmen, damit es flüssig bleibt: Hang ein Viereck pro Farbstreifen (8 m) statt pro Stück (2 m), Farbe nur einmal pro Viereck setzen, Talboden nur bis 300 m (`TAL_BODEN_SICHT`), Felder nur bis 140 m (`TAL_FELDER_BIS`), Wand ab 220 m einfarbig ohne Schichten und Risse (`WAND_DETAIL_BIS`), Berge vorgezeichnet statt Spalte für Spalte. Damit ging die Zahl der Zeichenbefehle an der teuersten Stelle von ca. 5800 auf 3300 pro Bild zurück.
- Nachgeprüft (mit dem echten Spielcode): Aufprall an Felswand, Leitplanke und Temposchild funktioniert (Tempo auf 25 %, Wackeln, zurückversetzt). Kein Objekt steht auf Strasse oder Bankett, keins halb in der Wand, kein hoher Baum nahe der Talseite. Insgesamt ca. 1240 sichtbare Objekte (vorher 2440; weniger, weil vor Felswänden und an Abhängen keine Bäume mehr stehen).

### Meilenstein 3.6: Holzzaun als Band, Felswand wird zum Hang
- **Gemeinsame Band-Funktion** (`bandZeichnen` in `render.js`): Die Technik der Leitplanke (ein Viereck pro Strassenstück, gemeinsame Kanten zum Nachbarstück, Pfosten als kleine Bilder) ist jetzt eine Funktion mit Werten aus `BAENDER` in `config.js`: Abstand zur Strasse, eine oder mehrere Latten (Höhe, Farben, Lichtlinie), Pfostenabstand, Pfostenbreite und -höhe, Pfosten-Bild, fest ja/nein.
  - **Leitplanke** läuft über diese Funktion, Werte unverändert (Balken 0,45–0,8 m, Pfosten alle 4 m). Geprüft: Bild für Bild über die ganze Runde mit dem alten Stand verglichen (nur Strasse, Gelände, Leitplanke). Unterschied nur bei einzelnen Pfosten-Pixeln: Die Pfosten werden jetzt mit derselben Rechnung wie das Band platziert und sitzen dadurch in Kurven nie mehr ein Pixel daneben.
  - **Pfosten** stehen jetzt auch mitten in einem Strassenstück, wenn der Abstand kein Vielfaches von 2 m ist. Ober- und Unterkante werden aus den Ecken des Bands und demselben Anteil pro Bildspalte berechnet, nicht separat gerundet.
  - **Holzzaun** (wiese, rechts, Abstand zur Strasse wie bisher 2 m): zwei Latten (untere 0,3–0,45 m, obere 0,75–0,9 m, oben helles, unten dunkles Holzbraun), alle 3 m ein Holzpfosten, 1 m hoch. Kollision wie bisher fest. Läuft auch in Kurven ohne Stufen oder Spalten (getestet, indem im Test kurz die S-Kurven zur Wiese gemacht wurden).
  - Andere Objekte, die als Kette gedacht sind, gibt es nicht: Nur Leitplanke und Zaun waren aus aneinandergereihten Bildern gebaut. Wegweiser, Schilder, Kühe usw. sind Einzelstücke.
  - Objekte auf einem Strassenstück werden jetzt nach ihrem Abstand zur Strasse sortiert gezeichnet (aussen zuerst). Das ersetzt die alte Sonderregel "hinter der Planke" und gilt für alle Bänder.
- **Felswand wird Hang** (alle Abschnitte mit `wand_links_tal_rechts` und `wand_rechts_tal_links`, Namen in `track.js` unverändert). Die alte Wand-Zeichnung ist entfernt.
  - **Querschnitt** (`HANG_PROFIL` in `config.js`, Punkte in Strassenbreiten ab Bankettrand): Geröllstreifen bis P0, steiler Felsfuss (dunkelgrau-braun) bis P1, helleres Gestein mit Grasflecken bis P2, grüne Böschung bis P3, dunkelgrüner Hangkamm bis P4. Zwischen den Punkten je ein Band mit eigener Farbe (`FARBEN.HANG_BAENDER`), hell/dunkel abwechselnd wie die Strasse.
  - **Profil angepasst:** Mit dem Startprofil (Fels 13,6 m hoch, oben flacher werdend) verdeckt der Fels von der Strasse aus alles darüber, man sah wieder eine Wand mit Baumspitzen dahinter. Darum ist der Fels jetzt niedriger (bis 6,8 m) und die Böschung steigt weiter an: P0 (0,15 | 0), P1 (0,35 | 0,45), P2 (0,65 | 0,85), P3 (1,6 | 1,7), P4 (3,2 | 3,0). Der Kamm liegt so 24 m über der Strasse. In `config.js` steht eine Faustregel, wie man das Profil ändern kann, ohne dass die Böschung verschwindet.
  - **Zeichnen:** Jedes Band ist pro Strassenstück ein Viereck mit gemeinsamen Kanten zu den Nachbarn (die Bildpunkte jedes Stückanfangs werden einmal pro Bild ausgerechnet und von beiden Nachbarn benutzt). Gezeichnet wird pro Stück von fern nach nah: zuerst die Hang-Vierecke (von aussen nach innen), dann die Objekte dieses Stücks. Dadurch verdeckt der Hang alles dahinter (Bäume, Tal, die Strasse hinter einer Kurve). Hinter Kuppen wird er abgeschnitten wie die Strasse.
  - **Details:** Kamm mit leichtem Rauschen (±10 %, `HANG_KAMM_RAUSCHEN`), drei leicht schräg laufende Gesteinsschichten im Fels (rötlich-braun, grau, hell; `HANG_SCHICHTEN`, wandern auf 120 m einmal auf und ab), dunkle Risse (7 % der Stücke) und Grasflecken (5 %), alles mit festem Zufall. Die Zufallszahlen fürs Tal werden in derselben Reihenfolge gezogen wie vorher: Felder und Bäume im Tal liegen genau gleich (geprüft).
  - **Keilförmige Enden:** Am Anfang und Ende wachsen Abstand und Höhe aller Punkte über 80 m (`HANG_UEBERGANG`) weich von 0 auf 100 %. Bei 0 liegt der Hang flach am Bankett. Keine senkrechten Kanten mehr. Gleiche Seite hintereinander: läuft ohne Unterbruch weiter. Seitenwechsel: Der alte Hang läuft am Ende seines Abschnitts aus, der neue wächst am Anfang des nächsten heraus. Maximales Wachstum in kurzen Abschnitten: Rechts 4, Links 5 nach Kuppe, Links 4 (zweites) je 50 %, Rechts 5 und Kehre rechts je 39 %.
  - **Bewuchs auf dem Hang** (`HANG_BEWUCHS` in `scenery.js`, eigene Liste pro Umgebung): Fichten, Laubbäume und Büsche stehen auf der Böschung (P2 bis P4), auf dem Fels (P0 bis P2) nur Felsen und vereinzelt Büsche. Der Fusspunkt liegt auf der Hangfläche, nicht auf Strassenhöhe. Dichte: wald dicht (alle 3 m ein Baum), lichtung mittel, fels und wiese locker. Erst ab 35 % Wachstum (`HANG_BEWUCHS_AB`), nie über dem Kamm (geprüft). Eigener Zufall (Seed aus `SZENERIE_SEED`). Auf der Hangseite stehen keine normalen Objekte mehr zwischen Bankett und Kamm (geprüft); nur am Keilende, wo der Hang noch schmal ist, darf hinter dem Kamm etwas stehen. Insgesamt 278 Objekte auf den Hängen, 815 sonst.
  - **Kollision:** Der Felsfuss ist fest wie ein Fels (Tempo auf 25 %, Wackeln, Auto zurück Richtung Strassenmitte, 1 s Schonzeit). Die Aufprallkante wandert mit dem Wachstum: am Keilende 5,1 m ab Strassenmitte (knapp hinter dem Bankett), bei vollem Hang 6,0 m. Unter 15 % Wachstum (`HANG_KOLLISION_AB`) kracht es nicht. Nachgerechnet mit dem echten Fahrcode an 7 Stellen (mit ca. 100 km/h voll in den Hang gelenkt): jedes Mal Aufprall, danach 23–27 km/h. Bäume und Felsen auf dem Hang haben keine Kollision (man kommt wegen des Felsfusses nicht hin).
  - **Leistung** (Chromium ohne Grafikkarte, jedes Bild alle 2,5 m über die ganze Runde, fertig gezeichnet): Median 1,7–1,9 ms pro Bild, 99 % unter 4,6 ms (vorher 1,4 / 3,2 ms). Mit 4-fach gebremstem Prozessor Median ca. 7,7 ms, 99 % unter ca. 20 ms (vorher 6,7 / 16,5 ms). Höchstens ca. 5000 Zeichenbefehle pro Bild (vorher 4400). Budget bei 60 Hz: 16,7 ms, also flüssig. Massnahmen in der Ferne: ab 40 m ein Viereck pro Farbstreifen (8 m) statt pro Stück (`HANG_GRUPPE_AB`), ab 120 m ohne Schichten, Risse und Grasflecken (`HANG_DETAIL_BIS`), ab 200 m (100 Stücke) nur noch 2 Bänder statt 5 (`HANG_EINFACH_AB`). Das Rauschen des Kamms wird dadurch in der Ferne automatisch gröber.
- **Debug-Anzeige (F3):** neue Zeile "HANG L 45 %  R 0 %" (Wachstum links und rechts). In der Zeile "GELÄNDE" steht jetzt "HANG" statt "WAND".

## Steuerung
| Taste | Wirkung |
|---|---|
| Pfeil hoch / W | Gas |
| Pfeil runter / S | Bremse |
| Pfeil links, rechts / A, D | Lenken |
| F3 | Debug-Anzeige ein/aus |

## Offen (nächste Meilensteine, siehe KONZEPT.md)
- Meilenstein 4: Untergründe (Schotter, Wiese), Abzweigung mit Rally-Absperrung (kann die Band-Funktion nutzen), Zeit, Checkpoints, Beifahrer.
- Danach: Tageszeiten, Menü, Auto-Sprites, Sound usw.
- Offene Ideen (siehe KONZEPT.md): Staubwolken hinten am Auto, Seitenansicht des Autos beim Lenken.

## Bekannte Macken
- Ganz hinten am Horizont flimmern die Streifen etwas (sie sind dort kleiner als ein Pixel). Bei Retro-Spielen normal.
- Wie bei allen Pseudo-3D-Spielen sind Kurven nur "aufgemalt": Eine Kehre dreht sich nicht wirklich um 180 Grad, die Strasse biegt sich nur stark zur Seite. Das Auto steht immer gerade.
- Schaut man ein Gefälle hinunter, ist zwischen Horizont und Strasse viel Wiese. Mit Bäumen und Waldlinie ist das jetzt deutlich besser, in "wiese"-Abschnitten bleibt es aber gewollt offen.
- Die Berg-Silhouetten wiederholen sich alle 320 Pixel (die Naht selbst passt seit 3.5 genau).
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
- Sehr knapp unter dem Horizont kann man die Strasse hinter einem Hügel verschwinden und daneben wieder auftauchen sehen, mit 1 Pixel Wiese dazwischen (das ist richtig so).
- Alle Objekte sind flache Bilder, die immer zur Kamera schauen (typisch Pseudo-3D). Leitplanke und Holzzaun sind Bänder und laufen glatt durch.
- Objekte stehen nur an Stückgrenzen (alle 2 m). Fällt im Spiel nicht auf.
- Hält man nach einem Aufprall weiter auf die Leitplanke zu, kracht es jede Sekunde erneut (jedes Mal Tempo auf 25 %). Man muss also aktiv zurück auf die Strasse lenken.
- Nach einem Aufprall im Wald wird das Auto nur bis knapp vor das getroffene Objekt versetzt, nicht ganz auf die Strasse. Steht dort gleich der nächste Baum, kracht es nach 1 s wieder.
- Bei Bäumen zählt beim Aufprall nur Stamm und untere Äste (ca. 1 m breit), nicht die ganze Krone. Fährt man knapp an einem Baum vorbei, kann das Auto optisch kurz "in" der Krone sein.
- Die grüne "Wand" vor dem steilen Rückweg zum Start (nach der Kehre rechts) gibt es weiterhin; jetzt stehen immerhin Bäume drauf.
- Die Waldlinie und die Berge wiederholen sich alle 320 Pixel.
- Ganz selten kurze Ruckler sind möglich, wenn der Browser im Hintergrund aufräumt (pro Bild werden ein paar hundert kleine Listen-Einträge neu angelegt). Bisher nur in der Messung ohne Grafikkarte gesehen (einzelne Bilder mit 20–80 ms, bei der alten Version genauso).
- Hang und Abhang sind nur "aufgemalt" wie die Kurven: Der Hang hat keinen Schatten, der Talboden ist eine flache Ebene 35 m unter der Strasse, die mit der Strasse mitsteigt und mitfällt.
- Fährt man das "Gefälle gerade" hinunter, sieht man weit vorne die Wiese der Senke in kräftigem Grün, darunter den dunstigen Talboden. Das ist richtig gerechnet (die Strasse führt dort ins Tal hinunter), sieht aber etwas hart aus, weil weit entfernte Wiese nicht im Dunst liegt.
- Die Seiten wechseln auf der Strecke oft (z. B. "Rechts 4" / "Links 4": Hang und Tal tauschen alle 70–80 m die Seite). Mit 80 m Keil erreichen diese kurzen Abschnitte nur 39–50 % Wachstum, der Hang ist dort ein flacher Hügel. Wer dort höhere Hänge will: `HANG_UEBERGANG` kleiner machen (z. B. 50), dann werden die Keile aber kürzer und steiler.
- In den Haarnadeln und Kehren liegt der Hang auf der Innenseite. Weil die Strasse dort im Bild so stark zur Seite schwenkt, liegt der Hang meistens ausserhalb des Bilds, man sieht ihn kaum (früher bei der Wand genauso).
- Der Hang verdeckt, was hinter ihm liegt, auch die Strasse nach einer Kurve auf der Hangseite ("blinde Kurve"). Das ist gewollt und echt, macht aber einzelne Kurven schwerer einsehbar.
- Bei vollem Hang ragt der Kamm in der Nähe oben aus dem Bild hinaus (24 m hoch). Gewollt, man fährt ja direkt am Berg.
- Fährt man ganz nah am Hang (Auto am Bankett), versteckt der Fels einen Teil der Böschung, weil man dann flacher hinaufschaut.
- In der Ferne (ab 40 m) werden je 4 Stücke zu einem Viereck zusammengefasst. Dabei kann der Fuss eines fernen Baums auf dem Hang ein, zwei Pixel zu weit abgedeckt werden. Fällt kaum auf.
- Bäume und Büsche auf der Nicht-Hangseite stehen teilweise an anderen Stellen als in 3.5 (die alte Fels-Reihe vor der Wand ist weggefallen, dadurch verschiebt sich der Zufall). Bei jedem Start steht aber alles wieder gleich.
- Im Übergang zum Abhang steht die Leitplanke schon, während die Kante noch weit draussen ist (dazwischen Gras). Gewollt, damit die Planke nicht mitten im Abhang beginnt.
- Wolken können jetzt hinter den höheren Bergen teilweise verschwinden.
- Fährt man nach einem Aufprall am Felsfuss weiter gegen den Hang, kracht es wie an der Leitplanke jede Sekunde erneut.
