// Die Strecke als Liste von Abschnitten.
//
// Hier darf man frei ändern, ohne anderen Code anzufassen: Abschnitte
// hinzufügen, löschen, umstellen, Werte anpassen. Das Spiel baut daraus
// beim Start automatisch die vielen kurzen Strassenstücke (siehe road.js).
//
// Jeder Abschnitt hat:
//   name:   frei wählbarer Text, erscheint in der Debug-Anzeige (F3)
//   laenge: Länge in Metern
//   kurve:  Kurvenstärke von -6 bis +6, wie bei Rallye-Ansagen
//           minus = links, plus = rechts, 0 = gerade
//           1 = ganz leicht (fast Vollgas), 3 = mittel, 6 = Haarnadel/Kehre
//           Wie schnell man durch welche Stärke kommt: KURVEN_GRENZTEMPO in config.js
//   hoehe:  wie viele Meter es über den ganzen Abschnitt hinauf (plus)
//           oder hinunter (minus) geht. 10 m auf 100 m = 10 % Steigung.
//           'auto' = das Spiel rechnet die Höhe selbst aus, sodass das Ende
//           der Strecke genau auf der Höhe des Starts liegt.
//   umgebung: Landschaft links und rechts der Strasse:
//           'wald', 'wiese', 'fels' oder 'lichtung'. Was dort genau steht,
//           wird in scenery.js festgelegt.
//   dichte: (freiwillig) mehr oder weniger Objekte als normal,
//           z. B. 1.5 = anderthalbmal so viele, 0.5 = halb so viele.
//   gelaende: Alpen-Gelände neben der Strasse. Überdeckt die Umgebung auf der
//           jeweiligen Seite; die andere Seite folgt weiter der "umgebung".
//           'keins'                  = kein besonderes Gelände (nur Umgebung)
//           'wand_links_tal_rechts'  = links Hang, rechts Abhang ins Tal
//           'wand_rechts_tal_links'  = rechts Hang, links Abhang ins Tal
//           'tal_links'              = nur links Abhang ins Tal
//           'tal_rechts'             = nur rechts Abhang ins Tal
//           "wand" heisst seit Meilenstein 3.6: ein Hang mit steilem Felsfuss
//           unten und bewachsener Böschung oben (der Name ist geblieben).
//           Auf der Talseite steht immer eine Leitplanke. Hang und Abhang
//           wachsen an den Abschnittsgrenzen weich heraus, der Hang als Keil
//           (HANG_UEBERGANG und GELAENDE_UEBERGANG in config.js).
//           Einstellungen zu Hang und Tal: ebenfalls config.js.
//
// Tipps:
// - Die Strecke ist ein Rundkurs: Nach dem letzten Abschnitt kommt wieder
//   der erste. Darum hat der letzte Abschnitt hoehe: 'auto'. Ohne 'auto'
//   gleicht das Spiel kleine Fehler selbst aus (und meldet es in der
//   Browser-Konsole, Taste F12).
// - Mehr als ca. 15 % Steigung wirkt schnell übertrieben.
// - Zwischen zwei Abschnitten wird kurz weich übergeblendet
//   (UEBERGANG_ANTEIL in config.js, 20 % der Länge des kürzeren Abschnitts).
// - Nach jeder Zeile ein Komma, sonst startet das Spiel nicht.

const STRECKE = [
  { name: 'Start gerade',               laenge: 250, kurve:  0, hoehe:    0,    umgebung: 'wiese',             gelaende: 'keins' },
  { name: 'Rechts 2',                   laenge: 120, kurve:  2, hoehe:    0,    umgebung: 'wald',              gelaende: 'keins' },
  { name: 'Links 3',                    laenge:  90, kurve: -3, hoehe:    4,    umgebung: 'wald',              gelaende: 'wand_links_tal_rechts' },
  { name: 'Gerade bergauf',             laenge:  80, kurve:  0, hoehe:    6,    umgebung: 'wald',              gelaende: 'wand_links_tal_rechts' },
  { name: 'Rechts 4',                   laenge:  80, kurve:  4, hoehe:    3,    umgebung: 'wald',              gelaende: 'wand_rechts_tal_links' },
  { name: 'Links 4',                    laenge:  70, kurve: -4, hoehe:    0,    umgebung: 'wald',              gelaende: 'wand_links_tal_rechts' },
  { name: 'Haarnadel links',            laenge:  70, kurve: -6, hoehe:    8,    umgebung: 'fels',              gelaende: 'wand_links_tal_rechts' },
  { name: 'Aufstieg',                   laenge: 150, kurve:  0, hoehe:   14,    umgebung: 'wald',              gelaende: 'wand_links_tal_rechts' },
  { name: 'Rechts 3 weit',              laenge: 140, kurve:  3, hoehe:    6,    umgebung: 'lichtung',          gelaende: 'tal_links' },
  { name: 'Kuppe hoch',                 laenge: 100, kurve:  0, hoehe:   12,    umgebung: 'wiese',             gelaende: 'tal_links' },
  { name: 'Kuppe runter',               laenge: 100, kurve:  0, hoehe:  -16,    umgebung: 'wiese',             gelaende: 'tal_links' },
  { name: 'Links 5 nach Kuppe',         laenge:  80, kurve: -5, hoehe:   -6,    umgebung: 'fels',              gelaende: 'wand_links_tal_rechts' },
  { name: 'Rechts 2',                   laenge: 100, kurve:  2, hoehe:   -4,    umgebung: 'wald',              gelaende: 'keins' },
  { name: 'S links',                    laenge:  60, kurve: -3, hoehe:    0,    umgebung: 'wald',              gelaende: 'keins' },
  { name: 'S rechts',                   laenge:  60, kurve:  3, hoehe:    0,    umgebung: 'wald',              gelaende: 'keins' },
  { name: 'S links eng',                laenge:  60, kurve: -4, hoehe:   -2,    umgebung: 'wald',              gelaende: 'keins' },
  { name: 'Gefälle gerade',             laenge: 200, kurve:  0, hoehe:  -22,    umgebung: 'wald', dichte: 1.5, gelaende: 'wand_rechts_tal_links' },
  { name: 'Haarnadel rechts bergab',    laenge:  70, kurve:  6, hoehe:   -8,    umgebung: 'fels',              gelaende: 'wand_rechts_tal_links' },
  { name: 'Senke runter',               laenge: 100, kurve:  0, hoehe:  -14,    umgebung: 'wiese',             gelaende: 'keins' },
  { name: 'Senke hoch',                 laenge: 100, kurve:  0, hoehe:   14,    umgebung: 'wiese',             gelaende: 'keins' },
  { name: 'Rechts 5',                   laenge:  70, kurve:  5, hoehe:    2,    umgebung: 'fels',              gelaende: 'wand_rechts_tal_links' },
  { name: 'Links 2',                    laenge: 120, kurve: -2, hoehe:    0,    umgebung: 'lichtung',          gelaende: 'keins' },
  { name: 'Schnelle Gerade bergab',     laenge: 250, kurve:  0, hoehe:  -18,    umgebung: 'lichtung',          gelaende: 'tal_rechts' },
  { name: 'Links 4',                    laenge:  80, kurve: -4, hoehe:   -4,    umgebung: 'wald',              gelaende: 'wand_links_tal_rechts' },
  { name: 'Kehre rechts',               laenge:  70, kurve:  6, hoehe:   -6,    umgebung: 'fels',              gelaende: 'wand_rechts_tal_links' },
  { name: 'Rückweg zum Start',          laenge: 200, kurve:  0, hoehe: 'auto',  umgebung: 'wiese',             gelaende: 'keins' },
];
