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

## Was NICHT ins Spiel kommt
- Kein Multiplayer, kein Online, keine Open World.
- Kein echtes 3D.
- Keine echten Marken, Logos oder Autonamen.
- Keine Frameworks oder externen Bibliotheken.

## Meilensteine
1. Gerade Strasse, Platzhalter-Auto, Gas/Bremse/Lenken, Tempoanzeige.
2. Kurven und Hügel.
2.5. Kurven-Physik (Grenztempo, Untersteuern) und neue, dichtere Teststrecke mit sichtbaren Hügeln.
3. Landschaft: Bäume, Büsche, Felsen, Leitplanken, Wegweiser, Waldkulisse im Hintergrund – dicht wie bei V-Rally 3.
4. Untergründe (Asphalt/Schotter/Schlamm), Zeit, Checkpoints, Beifahrer.
5. Berg-Hintergrund, Tageszeiten, schöne Alpen-Optik.
6. Menü, Autoauswahl, richtige Auto-Sprites.
7. Sound und Musik.
8. Mehrere Strecken, Bestzeiten.
