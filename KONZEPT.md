# Alpen Rally – Konzept

Arbeitstitel: **Alpen Rally** (Name kann sich noch ändern)

## Die Idee in einem Satz
Ein Retro-Pixel-Rallyspiel im Pseudo-3D-Stil (wie OutRun): Blick von hinten aufs Auto, die Strasse kommt auf dich zu. Gefahren wird auf kurvigen Schweizer Passstrassen mit Autos im Stil der Gruppe-B-Ära (80er/90er).

## Technik-Prinzip
- Läuft im Browser, reines JavaScript mit Canvas.
- Kein echtes 3D: Die Strasse besteht aus vielen horizontalen Streifen, die nach oben (Ferne) schmaler werden. Kurven = Streifen seitlich verschieben, Hügel = Streifen hoch/runter schieben. Objekte (Bäume, Schilder) werden je nach Distanz skaliert.
- Gespielt wird auf GitHub Pages (Link im Browser), auf Lenovo und Gaming-PC.

## Setting
- Schweizer Alpen: kurvige Passstrasse, Kehren, schöne Natur.
- Im Hintergrund Berge, am Strassenrand Tannen, Felsen, Leitplanken, Wegweiser, Holzzäune.
- Spätere Ideen: Schneegrenze weiter oben, Tunnel, Dorfdurchfahrt, Tageszeit (Sonnenuntergang).

## Look
- Retro-Pixel-Stil. Interne Auflösung klein (320x180), hochskaliert mit scharfen Pixeln.
- Farbpalette: erdig und rau (Schotterbraun, Steingrau, Tannengrün), aber mit sattem grünem Gras und blauem Himmel.
- Begrenzte Farbanzahl, keine weichen Verläufe ausser beim Himmel.
- Ziel-Optik angelehnt an GBA-Rallyspiele wie V-Rally 3.
- Das Auto wird später aus mehreren Blickwinkeln gezeichnet (Mitte, leicht links, stark links; für rechts gespiegelt), sodass man beim Lenken die Seite des Autos sieht.
- Die Strasse hat bewusst keine Rennstrecken-Randsteine (rot-weiss), sondern ein erdiges Bankett.

## Landschaft am Strassenrand
Jeder Abschnitt der Strecke hat eine Umgebung. Was dort genau steht, ist in `js/scenery.js` einstellbar:

| Umgebung | Wie sie aussieht |
|---|---|
| wald | dichte Fichten (ein paar Laubbäume) in zwei Reihen pro Seite, dazwischen Büsche, dahinter weiterer Wald |
| wiese | offene Weide mit Weidezaun (rechts), dahinter ab und zu Kühe, vereinzelt Bäume und Büsche, selten ein Wegweiser |
| fels | Felsbrocken, vereinzelt Fichten |
| lichtung | lichter Wald: wenige Bäume nah an der Strasse, weiter Blick, Wald erst weit hinten |

Dazu automatisch:
- **Leitplanken** an der Aussenseite enger Kurven (ab Stärke 4, oder ab Stärke 3 mit Gefälle) und auf jeder Talseite (siehe Gelände). Die Leitplanke wird wie die Strasse als durchgehendes Band gezeichnet (silbergrauer Balken, darunter alle 4 m ein dunkler Pfosten), damit sie auch in Kurven glatt durchläuft.
- **Temposchilder** ca. 120 m vor jeder Kurve ab Stärke 3, immer rechts der Strasse: runde weisse Scheibe mit rotem Rand und schwarzer Zahl. Stärke 3 = 80, 4 = 60, 5 = 50, 6 = 40. Reine Dekoration, kein Einfluss aufs Fahren. (Kurvenschilder mit Pfeil gibt es nicht mehr, die stehen an echten Passstrassen so nicht.)

### Gelände (Feld `gelaende` in `js/track.js`)
Jeder Abschnitt hat zusätzlich ein Alpen-Gelände. Es überdeckt die Umgebung auf der jeweiligen Seite, die andere Seite folgt weiter der Umgebung.

| gelaende | links | rechts |
|---|---|---|
| keins | Umgebung | Umgebung |
| wand_links_tal_rechts | Felswand | Abhang ins Tal |
| wand_rechts_tal_links | Abhang ins Tal | Felswand |
| tal_links | Abhang ins Tal | Umgebung |
| tal_rechts | Umgebung | Abhang ins Tal |

- **Felswand (Hangseite):** durchgehende Felswand, ca. 3,5-mal so hoch wie die Strasse breit ist, oben ausgefranst, erdiges Grau und Braun in Gesteinsschichten, ein paar Risse und Grasbüschel. Davor ein schmaler Geröllstreifen mit ab und zu einem Fels oder Busch, keine Bäume. Aufprall wie an einem Fels.
- **Abhang (Talseite):** hinter Randstreifen und Leitplanke fällt ein Hang zum Talboden ab, der deutlich tiefer liegt. Der Talboden ist ein Flickenteppich aus Wiesen und Waldstücken mit kleinen Bäumen, in der Ferne im Dunst. Ganz hinten eine Dunst-Landschaft aus blaugrünen und bläulich-grauen Streifen mit kleinen Baumwipfeln. Keine hohen Bäume nahe der Strasse.
- **Übergänge:** Die Wand wächst über ca. 40 m aus dem Boden und sinkt am Ende wieder, der Abhang öffnet und schliesst sich genauso.

### Hintergrund
Drei Berg-Ebenen: ganz hinten helle Dunst-Berge (wandern am langsamsten), davor hohe, schroffe Berge mit Schneekappen auf den höchsten Gipfeln, ganz vorne dunklere Berge. Dazu eine Waldlinie am Horizont und treibende Wolken.

Sprites (alle selbst per Code gezeichnet, in `js/sprites.js`):
- fest (harter Aufprall): Fichte gross und klein (je 2 Varianten), Laubbaum (2), Fels (2 Formen), Temposchild (80, 60, 50, 40; die Zahlen kommen aus einer kleinen 3x5-Pixelschrift), Wegweiser, Holzzaun, Kuh (2)
- weich (bremst nur): Busch (2)
- Leitplanke und Felswand sind keine Bilder, sondern werden wie die Strasse als Flächen gezeichnet (zählen beim Aufprall aber als fest).

## Autos (Fantasienamen, Arbeitsnamen)
Inspiriert von Gruppe-B-Legenden, aber mit erfundenen Namen und eigenem Design. Keine echten Marken, Logos oder Originaldesigns.

| Arbeitsname | Charakter | Inspiration |
|---|---|---|
| Corvo R037 | Heckantrieb, leicht, schwer zu fahren, driftfreudig | Lancia 037 |
| Aquila Gamma | Allrad, kompakt, ausgewogen | Lancia Delta |
| Ringwerk RT4 | Allrad, stark, stabil, etwas schwer | Audi Quattro |
| Plejad Boxer | Allrad, wendig, gute Traktion auf Schotter | Subaru Impreza |
| Falkner Vanguard RS | Heckantrieb, direkt, ehrlich, anspruchsvoll | Ford Escort |

Am Anfang gibt es nur ein Platzhalter-Auto aus einfachen Formen. Richtige Autos kommen in späteren Etappen.

## Steuerung
- Pfeil hoch / W: Gas
- Pfeil runter / S: Bremse
- Pfeil links, rechts / A, D: Lenken
- Später: Handbremse (Leertaste), Gamepad-Unterstützung (für den Gaming-PC)

## Spielziel
- Zeitfahren auf einer Strecke mit Checkpoints, die Zeit gibt.
- Beifahrer macht Ansagen ("Rechts 4, Kuppe!").
- Später: mehrere Strecken, Bestzeiten, Geister-Fahrer, Auto-Upgrades.

## Fahrgefühl (wichtig)
- Arcade, nicht Simulation: Es muss sich gut anfühlen, nicht realistisch sein.
- Lenkträgheit und Rutschen in Kurven, je nach Untergrund (Asphalt, Schotter, Schlamm).
- Alle Fahrwerte stehen in `js/config.js`, damit sie leicht zu verstellen sind.

## Offene Ideen
- Staubwolken hinten am Auto.
- Seitenansicht des Autos beim Lenken (siehe Look).
- Asphalt/Schotter-Wechsel auf der Strecke (Untergründe kommen in Meilenstein 4).

## Was NICHT ins Spiel kommt
- Kein Multiplayer, kein Online, keine Open World.
- Kein echtes 3D.
- Keine echten Marken, Logos oder Autonamen.
- Keine Frameworks oder externen Bibliotheken.

## Meilensteine
1. Gerade Strasse, Platzhalter-Auto, Gas/Bremse/Lenken, Tempoanzeige.
2. Kurven und Hügel.
2.5. Kurven-Physik (Grenztempo, Untersteuern) und neue, dichtere Teststrecke mit sichtbaren Hügeln.
3. Landschaft und Kollisionen: Bäume, Büsche, Felsen, Leitplanken, Schilder, Zäune, Kühe, Waldlinie und Wolken im Hintergrund – dicht wie bei V-Rally 3. Aufprall an festen Objekten.
3.5. Überarbeitung: Leitplanke als durchgehendes Band, Temposchilder statt Kurvenschilder, Alpen-Gelände (Felswand, Abhang ins Tal), höhere Berge mit Schnee und ferne Dunst-Berge.
4. Untergründe (Schotter, Wiese), Abzweigung mit Rally-Absperrung.
5. Zeit, Checkpoints, Beifahrer.
6. Tageszeiten, weitere Alpen-Optik.
7. Menü, Autoauswahl, richtige Auto-Sprites.
8. Sound und Musik.
9. Mehrere Strecken, Bestzeiten.
