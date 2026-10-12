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
  abschnitte: [], // die Abschnitte aus track.js, aufbereitet (mit erstem Stück), für scenery.js
  laenge: 0,     // Gesamtlänge der Strecke in Metern
  brennweite: 0, // wie stark die Perspektive verkleinert (aus dem Sichtwinkel berechnet)

  start() {
    // Aus dem Sichtwinkel ausrechnen, wie viele Pixel ein Meter in 1 m
    // Entfernung breit ist. Grosser Winkel = kleine Brennweite = alles kleiner.
    const halberWinkel = (CONFIG.SICHTWINKEL / 2) * Math.PI / 180;
    this.brennweite = (CONFIG.BREITE / 2) / Math.tan(halberWinkel);
    this.streckeBauen();
    // Wie weit vor der Kamera das Auto auf der Strasse steht (Meter). Das Auto
    // wird immer unten im Bild gezeichnet; seine Hinterräder berühren die
    // Strasse dort, wo dieser Abstand im Bild hinfällt. Braucht man für die
    // Zusammenstösse und dafür, ob ein Objekt vor oder hinter dem Auto steht.
    const autoUnten = CONFIG.HOEHE - CONFIG.AUTO_ABSTAND_UNTEN;
    this.autoAbstand = CONFIG.KAMERA_HOEHE * this.brennweite / (autoUnten - CONFIG.HORIZONT_Y);
  },

  // Aus den Abschnitten in track.js die vielen kurzen Stücke bauen.
  streckeBauen() {
    const L = CONFIG.STUECK_LAENGE;
    const maxStaerke = CONFIG.KURVEN_GRENZTEMPO.length - 1;

    // 1) Abschnitte aufbereiten. Die Länge wird auf ganze Stücke gerundet.
    const abschnitte = STRECKE.map((a) => {
      const anzahl = Math.max(1, Math.round((a.laenge || 0) / L));
      return {
        name: String(a.name || ''),
        anzahl: anzahl,
        laenge: anzahl * L,
        kurve: Math.min(Math.max(a.kurve || 0, -maxStaerke), maxStaerke),
        auto: a.hoehe === 'auto',
        hoehe: a.hoehe === 'auto' ? 0 : (a.hoehe || 0),
        umgebung: a.umgebung || 'wiese', // Landschaft am Rand, siehe scenery.js
        dichte: a.dichte || 1,           // mehr (z. B. 1.5) oder weniger (0.5) Objekte als normal
        gelaende: a.gelaende || 'keins', // Hang / Abhang, siehe scenery.js
        hangHoehe: this.hangHoeheLesen(a), // Faktor für die Höhe des Hangs (hang_hoehe in track.js)
      };
    });

    // 2) Abschnitte mit hoehe: 'auto' bekommen den Rest, damit alle Höhen
    //    zusammen 0 ergeben (Ende = Start, Rundkurs ohne Sprung).
    //    Gibt es mehrere, teilen sie sich den Rest nach ihrer Länge.
    const autos = abschnitte.filter((a) => a.auto);
    if (autos.length > 0) {
      const summe = abschnitte.reduce((s, a) => s + a.hoehe, 0);
      const autoLaenge = autos.reduce((s, a) => s + a.laenge, 0);
      for (const a of autos) a.hoehe = -summe * a.laenge / autoLaenge;
    }
    // Steigung erst jetzt berechnen, damit sie zur gerundeten Länge passt
    for (const a of abschnitte) a.steigung = a.hoehe / a.laenge; // Meter hinauf pro Meter vorwärts

    // 3) Stücke anlegen. Kurve und Steigung kommen aus dem Abschnitt,
    //    werden aber an den Grenzen kurz weich übergeblendet (siehe mischen).
    this.stuecke = [];
    abschnitte.forEach((a, nr) => {
      a.erstesStueck = this.stuecke.length;
      for (let j = 0; j < a.anzahl; j++) {
        const i = this.stuecke.length;
        const o = (j + 0.5) * L; // Mitte des Stücks, gemessen ab Abschnittsbeginn
        const kurve = this.mischen(abschnitte, nr, o, 'kurve');
        const grenzKmh = this.grenztempoKmh(kurve);
        // Krümmung fürs Bild (1 / Radius in Metern). Kommt aus dem Grenztempo
        // im Quadrat: So sehen enge Kurven richtig eng und weite richtig weit aus.
        const kehrwert = grenzKmh === Infinity ? 0 : 3.6 / grenzKmh;
        this.stuecke.push({
          index: i,
          // Abwechselnd hell und dunkel, jeweils STREIFEN_LAENGE Stücke lang.
          // Diese Streifen rasen am Auto vorbei und zeigen so das Tempo.
          hell: Math.floor(i / CONFIG.STREIFEN_LAENGE) % 2 === 0,
          abschnitt: a.name,
          abschnittNr: nr,
          objekte: [],                      // Bäume, Felsen usw. auf diesem Stück (füllt scenery.js)
          kurve: kurve,                     // Kurvenstärke wie in track.js, aber weich übergeblendet
          grenztempo: grenzKmh / 3.6,       // in m/s, für die Kurven-Physik (siehe car.js); Infinity = gerade
          kruemmung: Math.sign(kurve) * CONFIG.KURVEN_OPTIK * kehrwert * kehrwert,
          steigung: this.mischen(abschnitte, nr, o, 'steigung'),
          y: 0,                             // Höhe am Anfang des Stücks, wird unten berechnet
        });
      }
    });
    this.laenge = this.stuecke.length * L;
    this.abschnitte = abschnitte;

    // 4) Höhen aufsummieren: Jedes Stück beginnt dort, wo das vorige endet.
    let y = 0;
    for (const s of this.stuecke) {
      s.y = y;
      y += s.steigung * L;
    }

    // 5) Rundkurs schliessen: Am Ende müssen wir wieder auf Höhe 0 sein.
    //    Mit 'auto' passt das schon. Sonst wird der Rest gleichmässig auf
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

  // Feld hang_hoehe eines Abschnitts aus track.js. Fehlt es, gilt 1 (volle Höhe).
  // Ist es keine Zahl ab 0 (Tippfehler), auch 1, mit Warnung in der Konsole.
  hangHoeheLesen(a) {
    if (a.hang_hoehe === undefined) return 1;
    if (typeof a.hang_hoehe === 'number' && a.hang_hoehe >= 0) return a.hang_hoehe;
    console.warn('Alpen Rally: hang_hoehe "' + a.hang_hoehe + '" bei "' + a.name +
      '" ist keine Zahl ab 0. Nehme 1.');
    return 1;
  },

  // Wert (Kurve oder Steigung) an Stelle o im Abschnitt Nummer nr.
  // Nahe an der Grenze zum vorigen oder nächsten Abschnitt wird weich
  // zwischen beiden Werten gemischt, statt ruckartig umzuschalten.
  // Die Überblendung dauert UEBERGANG_ANTEIL der Länge des kürzeren der
  // beiden Abschnitte und liegt je zur Hälfte in beiden. Weil sie
  // symmetrisch ist, bleibt die Gesamthöhe eines Abschnitts erhalten.
  mischen(abschnitte, nr, o, feld) {
    const n = abschnitte.length;
    const a = abschnitte[nr];
    const vor = abschnitte[(nr - 1 + n) % n];   // Rundkurs: vor dem ersten kommt der letzte
    const nach = abschnitte[(nr + 1) % n];
    const anteil = CONFIG.UEBERGANG_ANTEIL / 2;
    // Halbe Überblendlänge an der Grenze zum vorigen bzw. nächsten Abschnitt.
    // Nie mehr als die halbe Abschnittslänge, damit sich Anfang und Ende nicht überlappen.
    const hVor = Math.min(anteil * Math.min(a.laenge, vor.laenge), a.laenge / 2);
    const hNach = Math.min(anteil * Math.min(a.laenge, nach.laenge), a.laenge / 2);

    if (hVor > 0 && o < hVor) {
      return this.weich(vor[feld], a[feld], (o + hVor) / (2 * hVor));
    }
    if (hNach > 0 && o > a.laenge - hNach) {
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

  // Grenztempo in km/h für eine Kurvenstärke (Vorzeichen egal).
  // Zwischen zwei Stärken (z. B. 4.5 beim Überblenden) wird gleichmässig gemischt.
  // Unter Stärke 1 wird das Limit immer höher (Stärke 0.5 = doppeltes Grenztempo
  // von Stärke 1), bei 0 gibt es keins (Infinity = unendlich).
  grenztempoKmh(staerke) {
    const tabelle = CONFIG.KURVEN_GRENZTEMPO;
    const s = Math.min(Math.abs(staerke), tabelle.length - 1);
    if (s < 0.001) return Infinity;
    if (s < 1) return tabelle[1] / s;
    const unten = Math.floor(s);
    const oben = Math.min(unten + 1, tabelle.length - 1);
    return tabelle[unten] + (tabelle[oben] - tabelle[unten]) * (s - unten);
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
  // (echte Höhe in Metern, ohne die Verstärkung fürs Bild)
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
  //   horizontY: Bildzeile des Horizonts (verschiebt sich leicht mit der Steigung)
  // Ergebnis: x/y im Bild und "massstab" = Pixel pro Meter an dieser Stelle.
  projiziere(weltX, weltY, abstand, kameraX, kameraY, horizontY) {
    const massstab = this.brennweite / abstand;
    return {
      x: CONFIG.BREITE / 2 + (weltX - kameraX) * massstab,
      y: horizontY + (kameraY - weltY) * massstab,
      massstab: massstab,
    };
  },
};
