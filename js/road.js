// Strasse und Perspektive.
//
// Grundidee (Pseudo-3D wie bei OutRun): Die Strasse ist eine lange Kette
// von kurzen Stücken (je STUECK_LAENGE Meter). Jedes Stück wird mit einer
// einfachen Formel auf den Bildschirm "projiziert": Je weiter weg, desto
// näher am Horizont und desto schmaler. Es gibt kein echtes 3D.
//
// Jedes Stück kennt seine Kurvenstärke und seine Höhe. Beim Zeichnen
// werden die Kurven Stück für Stück aufsummiert (die Strasse biegt sich
// zum Horizont hin weg) und die Höhen verschieben die Stücke nach oben
// oder unten (Hügel). Die Stücke selbst baut start() aus der
// Abschnittsliste in track.js.

const Road = {
  stuecke: [],   // alle Strassenstücke der Strecke
  laenge: 0,     // Gesamtlänge der Strecke in Metern
  brennweite: 0, // wie stark die Perspektive verkleinert (aus dem Sichtwinkel berechnet)

  start() {
    // Aus dem Sichtwinkel ausrechnen, wie viele Pixel ein Meter in 1 m
    // Entfernung breit ist. Grosser Winkel = kleine Brennweite = alles kleiner.
    const halberWinkel = (CONFIG.SICHTWINKEL / 2) * Math.PI / 180;
    this.brennweite = (CONFIG.BREITE / 2) / Math.tan(halberWinkel);
    this.streckeBauen();
  },

  // Aus den Abschnitten in track.js die vielen kurzen Stücke bauen.
  streckeBauen() {
    const L = CONFIG.STUECK_LAENGE;
    const maxStaerke = CONFIG.KURVEN_GRENZTEMPO.length - 1;

    // 1) Abschnitte aufbereiten. Die Länge wird auf ganze Stücke gerundet,
    //    die Steigung danach berechnet, damit die Höhe genau stimmt.
    const abschnitte = STRECKE.map((a) => {
      const anzahl = Math.max(1, Math.round((a.laenge || 0) / L));
      const laenge = anzahl * L;
      return {
        name: String(a.name || ''),
        anzahl: anzahl,
        laenge: laenge,
        kurve: Math.min(Math.max(a.kurve || 0, -maxStaerke), maxStaerke),
        steigung: (a.hoehe || 0) / laenge, // Meter hinauf pro Meter vorwärts
      };
    });

    // 2) Stücke anlegen. Kurve und Steigung kommen aus dem Abschnitt,
    //    werden aber an den Grenzen weich übergeblendet (siehe mischen).
    this.stuecke = [];
    abschnitte.forEach((a, nr) => {
      for (let j = 0; j < a.anzahl; j++) {
        const i = this.stuecke.length;
        const o = (j + 0.5) * L; // Mitte des Stücks, gemessen ab Abschnittsbeginn
        const kurve = this.mischen(abschnitte, nr, o, 'kurve');
        const kurvenWert = this.kurvenWert(kurve);
        this.stuecke.push({
          index: i,
          // Abwechselnd hell und dunkel, jeweils STREIFEN_LAENGE Stücke lang.
          // Diese Streifen rasen am Auto vorbei und zeigen so das Tempo.
          hell: Math.floor(i / CONFIG.STREIFEN_LAENGE) % 2 === 0,
          abschnitt: a.name,
          kurve: kurve,                           // Kurvenstärke wie in track.js, aber weich übergeblendet
          kurvenWert: kurvenWert,                 // für die Fliehkraft (siehe car.js)
          // Krümmung fürs Bild (1 / Radius in Metern). Quadratisch, damit
          // enge Kurven richtig eng und weite richtig weit aussehen.
          kruemmung: Math.sign(kurvenWert) * CONFIG.KURVEN_OPTIK * kurvenWert * kurvenWert,
          steigung: this.mischen(abschnitte, nr, o, 'steigung'),
          y: 0,                                   // Höhe am Anfang des Stücks, wird unten berechnet
        });
      }
    });
    this.laenge = this.stuecke.length * L;

    // 3) Höhen aufsummieren: Jedes Stück beginnt dort, wo das vorige endet.
    let y = 0;
    for (const s of this.stuecke) {
      s.y = y;
      y += s.steigung * L;
    }

    // 4) Rundkurs schliessen: Am Ende müssen wir wieder auf Höhe 0 sein.
    //    Ergibt die Liste das nicht ganz, wird der Rest gleichmässig auf
    //    die ganze Strecke verteilt (fällt bei wenigen Metern nicht auf).
    const rest = y;
    if (Math.abs(rest) > 0.5) {
      console.warn('Alpen Rally: Die Höhen in track.js ergeben zusammen ' +
        rest.toFixed(1) + ' m statt 0. Wird automatisch ausgeglichen.');
    }
    const n = this.stuecke.length;
    for (const s of this.stuecke) {
      s.y -= rest * s.index / n;
      s.steigung -= rest / this.laenge;
    }
  },

  // Wert (Kurve oder Steigung) an Stelle o im Abschnitt Nummer nr.
  // Nahe an der Grenze zum vorigen oder nächsten Abschnitt wird weich
  // zwischen beiden Werten gemischt, statt ruckartig umzuschalten.
  // Die Überblendung liegt je zur Hälfte in beiden Abschnitten. Weil sie
  // symmetrisch ist, bleibt die Gesamthöhe eines Abschnitts erhalten.
  mischen(abschnitte, nr, o, feld) {
    const n = abschnitte.length;
    const a = abschnitte[nr];
    const vor = abschnitte[(nr - 1 + n) % n];   // Rundkurs: vor dem ersten kommt der letzte
    const nach = abschnitte[(nr + 1) % n];
    const halb = CONFIG.UEBERGANG / 2;
    // Nie mehr als die halbe Abschnittslänge, damit sich Anfang und Ende nicht überlappen
    const hVor = Math.min(halb, a.laenge / 2, vor.laenge / 2);
    const hNach = Math.min(halb, a.laenge / 2, nach.laenge / 2);

    if (o < hVor) {
      return this.weich(vor[feld], a[feld], (o + hVor) / (2 * hVor));
    }
    if (o > a.laenge - hNach) {
      return this.weich(a[feld], nach[feld], (o - (a.laenge - hNach)) / (2 * hNach));
    }
    return a[feld];
  },

  // Weicher Übergang von a nach b (t von 0 bis 1). Langsam los, schnell
  // in der Mitte, langsam am Ende. So gibt es keinen Knick.
  weich(a, b, t) {
    const s = t * t * (3 - 2 * t);
    return a + (b - a) * s;
  },

  // Kurvenwert für die Fliehkraft: 1 / Grenztempo (in m/s), mit Vorzeichen.
  // Zwischenwerte (z. B. 4.5 beim Überblenden) werden aus der Tabelle gemischt.
  kurvenWert(staerke) {
    const tabelle = CONFIG.KURVEN_GRENZTEMPO;
    const s = Math.min(Math.abs(staerke), tabelle.length - 1);
    if (s === 0) return 0;
    const wert = (i) => (i === 0 ? 0 : 3.6 / tabelle[i]); // km/h in m/s umrechnen, Kehrwert
    const unten = Math.floor(s);
    const oben = Math.min(unten + 1, tabelle.length - 1);
    const w = wert(unten) + (wert(oben) - wert(unten)) * (s - unten);
    return Math.sign(staerke) * w;
  },

  // Stück Nummer i. Die Strecke ist ein Ring: Nach dem letzten Stück
  // kommt wieder das erste (und vor dem ersten das letzte).
  stueck(i) {
    const n = this.stuecke.length;
    return this.stuecke[((i % n) + n) % n];
  },

  // Welches Stück liegt an Position z (in Metern)?
  stueckBei(z) {
    return this.stueck(Math.floor(z / CONFIG.STUECK_LAENGE));
  },

  // Höhe der Strasse an Position z, zwischen Anfang und Ende des Stücks gemischt
  hoeheBei(z) {
    const i = Math.floor(z / CONFIG.STUECK_LAENGE);
    const anteil = z / CONFIG.STUECK_LAENGE - i;
    const a = this.stueck(i).y;
    const b = this.stueck(i + 1).y;
    return a + (b - a) * anteil;
  },

  // Rechnet einen Punkt der Welt in Bildschirm-Koordinaten um.
  //   weltX, weltY: seitliche Position und Höhe des Punkts in Metern
  //   abstand:      wie weit der Punkt vor der Kamera liegt, in Metern
  //   kameraX, kameraY: seitliche Position und Höhe der Kamera
  // Ergebnis: x/y im Bild und "massstab" = Pixel pro Meter an dieser Stelle.
  projiziere(weltX, weltY, abstand, kameraX, kameraY) {
    const massstab = this.brennweite / abstand;
    return {
      x: CONFIG.BREITE / 2 + (weltX - kameraX) * massstab,
      y: CONFIG.HORIZONT_Y + (kameraY - weltY) * massstab,
      massstab: massstab,
    };
  },
};
