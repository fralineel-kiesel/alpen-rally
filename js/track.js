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
//           1 = ganz leicht, 3 = mittel, 6 = Haarnadel/Kehre
//   hoehe:  wie viele Meter es über den ganzen Abschnitt hinauf (plus)
//           oder hinunter (minus) geht. 10 m auf 100 m = 10 % Steigung.
//
// Tipps:
// - Mehr als ca. 10 % Steigung wirkt schnell übertrieben.
// - Die Strecke ist ein Rundkurs: Alle "hoehe"-Werte zusammen sollten 0
//   ergeben, sonst passt das Ende nicht an den Anfang. Kleine Fehler gleicht
//   das Spiel selbst aus (und meldet es in der Browser-Konsole, Taste F12).
// - Zwischen zwei Abschnitten wird weich übergeblendet (UEBERGANG in config.js).
//   Sehr kurze Abschnitte (unter ca. 60 m) wirken darum schwächer.
// - Nach jeder Zeile ein Komma, sonst startet das Spiel nicht.

const STRECKE = [
  { name: 'Start-Gerade',       laenge: 650, kurve:  0, hoehe:   0 },
  { name: 'Weite Rechts',       laenge: 400, kurve:  1, hoehe:  12 },
  { name: 'Weite Links',        laenge: 450, kurve: -2, hoehe:  20 },
  { name: 'Flotte Rechts',      laenge: 300, kurve:  2, hoehe:  12 },
  { name: 'S-Kurve Links',      laenge: 160, kurve: -3, hoehe:   6 },
  { name: 'S-Kurve Rechts',     laenge: 160, kurve:  3, hoehe:   6 },
  { name: 'Kuppe hinauf',       laenge: 160, kurve:  0, hoehe:  14 },
  { name: 'Kuppe hinunter',     laenge: 160, kurve:  0, hoehe: -14 },
  { name: 'Kurze Gerade',       laenge: 200, kurve:  0, hoehe:   0 },
  { name: 'Senke hinunter',     laenge: 150, kurve:  0, hoehe: -12 },
  { name: 'Senke hinauf',       laenge: 150, kurve:  0, hoehe:  12 },
  { name: 'Anfahrt Kehre',      laenge: 250, kurve: -1, hoehe:  -6 },
  { name: 'Kehre Links',        laenge: 120, kurve: -6, hoehe: -10 },
  { name: 'Zwischengerade',     laenge: 200, kurve:  0, hoehe:   6 },
  { name: 'Kehre Rechts',       laenge: 120, kurve:  5, hoehe:  10 },
  { name: 'Passhöhe',           laenge: 250, kurve: -2, hoehe:   4 },
  { name: 'Gefälle Rechts 3',   laenge: 350, kurve:  3, hoehe: -18 },
  { name: 'Gefälle Links 4',    laenge: 320, kurve: -4, hoehe: -16 },
  { name: 'Gefälle Rechts 3',   laenge: 350, kurve:  3, hoehe: -16 },
  { name: 'Gefälle Links 2',    laenge: 350, kurve: -2, hoehe: -10 },
  { name: 'Ziel-Gerade',        laenge: 750, kurve:  0, hoehe:   0 },
];
