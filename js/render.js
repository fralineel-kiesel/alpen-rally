// Zeichnen: Himmel, Berge, Strasse, Auto und Anzeigen (Drehzahl, Tempo).
// Wir zeichnen fast alles mit fillRect auf ganze Pixel. Schräge Linien
// würde der Browser sonst weichzeichnen, und das passt nicht zum Pixel-Look.

// Berg-Silhouetten als Liste von Punkten [x im Bild, Höhe über dem Horizont].
// Zwischen den Punkten wird gerade verbunden. Reine Platzhalter.
const BERGE_HINTEN = [
  [0, 22], [30, 38], [55, 28], [85, 50], [115, 30], [140, 36], [170, 26],
  [200, 44], [232, 56], [258, 34], [288, 42], [320, 24],
];
const BERGE_VORNE = [
  [0, 12], [25, 20], [50, 10], [80, 18], [110, 8], [150, 26], [180, 14],
  [210, 9], [245, 22], [275, 12], [300, 18], [320, 10],
];

// Mini-Pixelschrift (meist 3 Pixel breit, 5 hoch). "1" = Pixel an, "0" = aus.
// Die Eins ist schmaler, damit Zahlen wie "120" auf dem kleinen Tacho Platz haben.
// Eigene Schrift, weil normaler Canvas-Text bei 320x180 verschwommen aussieht.
const PIXEL_SCHRIFT = {
  '0': ['111', '101', '101', '101', '111'],
  '1': ['01', '11', '01', '01', '01'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '010', '010', '010'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
  'A': ['010', '101', '111', '101', '101'],
  'B': ['110', '101', '110', '101', '110'],
  'C': ['011', '100', '100', '100', '011'],
  'D': ['110', '101', '101', '101', '110'],
  'E': ['111', '100', '110', '100', '111'],
  'F': ['111', '100', '110', '100', '100'],
  'G': ['011', '100', '101', '101', '011'],
  'H': ['101', '101', '111', '101', '101'],
  'I': ['111', '010', '010', '010', '111'],
  'J': ['001', '001', '001', '101', '010'],
  'K': ['101', '101', '110', '101', '101'],
  'L': ['100', '100', '100', '100', '111'],
  'M': ['101', '111', '111', '101', '101'],
  'N': ['1001', '1101', '1011', '1001', '1001'],
  'O': ['010', '101', '101', '101', '010'],
  'P': ['110', '101', '110', '100', '100'],
  'Q': ['010', '101', '101', '110', '011'],
  'R': ['110', '101', '110', '101', '101'],
  'S': ['011', '100', '010', '001', '110'],
  'T': ['111', '010', '010', '010', '010'],
  'U': ['101', '101', '101', '101', '111'],
  'V': ['101', '101', '101', '101', '010'],
  'W': ['101', '101', '111', '111', '101'],
  'X': ['101', '101', '010', '101', '101'],
  'Y': ['101', '101', '010', '010', '010'],
  'Z': ['111', '001', '010', '100', '111'],
  'Ä': ['101', '010', '101', '111', '101'],
  'Ö': ['101', '000', '111', '101', '111'],
  'Ü': ['101', '000', '101', '101', '111'],
  '/': ['001', '001', '010', '100', '100'],
  '-': ['000', '000', '111', '000', '000'],
  '+': ['000', '010', '111', '010', '000'],
  '%': ['101', '001', '010', '100', '101'],
  '.': ['0', '0', '0', '0', '1'],
  ':': ['0', '1', '0', '1', '0'],
  ' ': ['000', '000', '000', '000', '000'],
};

const Render = {
  ctx: null,
  // Wohin die Nadeln gerade zeigen. Sie laufen dem echten Wert etwas
  // hinterher, damit sie ruhig wirken und nicht bei jedem Bild zittern.
  nadelDrehzahl: 0,
  nadelTempo: 0,
  // Fertig vorgezeichnete Zifferblätter (ohne Nadel), siehe zifferblattVorzeichnen
  blattDrehzahl: null,
  blattTempo: null,
  // Berg-Silhouetten als Höhe pro Pixelspalte (einmal ausgerechnet) und
  // wie weit sie gerade seitlich verschoben sind (Parallax in Kurven)
  hoehenHinten: null,
  hoehenVorne: null,
  bergVersatzHinten: 0,
  bergVersatzVorne: 0,
  // Horizont: kippt leicht mit der Steigung vor dem Auto (geglättet).
  // horizontVersatz ist der genaue Wert, horizont die gerundete Bildzeile,
  // auf der Himmel, Berge und Strasse in diesem Bild zusammentreffen.
  horizontVersatz: 0,
  horizont: CONFIG.HORIZONT_Y,

  start(ctx) {
    this.ctx = ctx;
    this.nadelDrehzahl = Car.drehzahl;
    this.blattDrehzahl = this.zifferblattVorzeichnen(
      CONFIG.DREHZAHL_SKALA_MAX / 1000, 1, 1, 0.5, CONFIG.DREHZAHL_ROT_AB / 1000);
    this.blattTempo = this.zifferblattVorzeichnen(CONFIG.TEMPO_SKALA_MAX, 40, 40, 20, null);
    this.hoehenHinten = this.bergHoehen(BERGE_HINTEN);
    this.hoehenVorne = this.bergHoehen(BERGE_VORNE);
  },

  // Nadeln nachführen. "Glätten" heisst: Pro Zeitschritt ein Stück des
  // restlichen Weges gehen. Mit Math.exp ist das auf 60 Hz und 144 Hz gleich schnell.
  update(dt) {
    const anteil = 1 - Math.exp(-dt / CONFIG.NADEL_TRAEGHEIT);
    this.nadelDrehzahl += (Car.drehzahl - this.nadelDrehzahl) * anteil;
    this.nadelTempo += (Car.tempo * 3.6 - this.nadelTempo) * anteil;

    // Berge in Kurven seitlich wandern lassen. "drehung" ist, wie stark
    // sich das Auto in diesem Zeitschritt dreht (Tempo x Krümmung).
    // Rechtskurve: Das Auto dreht nach rechts, die Berge wandern nach links.
    const drehung = Car.tempo * Road.stueckBei(Car.z).kruemmung * dt;
    this.bergVersatzHinten -= drehung * CONFIG.BERG_PARALLAX_HINTEN;
    this.bergVersatzVorne -= drehung * CONFIG.BERG_PARALLAX_VORNE;
    // Im Bereich 0 bis BREITE halten, damit die Zahl nicht endlos wächst
    const b = CONFIG.BREITE;
    this.bergVersatzHinten = ((this.bergVersatzHinten % b) + b) % b;
    this.bergVersatzVorne = ((this.bergVersatzVorne % b) + b) % b;

    // Horizont mit der Steigung kippen. Gemessen wird die Steigung über die
    // nächsten Meter vor dem Auto, damit man eine Steigung schon kommen sieht.
    // Bergauf rutscht der Horizont nach unten, als würde man hinaufschauen.
    const voraus = CONFIG.HORIZONT_VORSCHAU;
    const steigungVoraus = (Road.hoeheBei(Car.z + voraus) - Road.hoeheBei(Car.z)) / voraus;
    const max = CONFIG.HORIZONT_MAX_VERSATZ;
    const ziel = Math.min(Math.max(steigungVoraus * CONFIG.HORIZONT_NEIGUNG, -max), max);
    this.horizontVersatz += (ziel - this.horizontVersatz) * (1 - Math.exp(-dt / CONFIG.HORIZONT_TRAEGHEIT));
    // Auf ganze Pixel runden, sonst gibt es zwischen Bergen und Wiese eine Lücke
    this.horizont = CONFIG.HORIZONT_Y + Math.round(this.horizontVersatz);
  },

  // fps: Bilder pro Sekunde, nur für die Debug-Anzeige
  zeichneAlles(fps) {
    this.himmel();
    this.berge(this.hoehenHinten, this.bergVersatzHinten, CONFIG.FARBEN.BERG_HINTEN);
    this.berge(this.hoehenVorne, this.bergVersatzVorne, CONFIG.FARBEN.BERG_VORNE);
    this.strasse();
    this.auto();
    this.anzeigen();
    if (Input.debugAnzeige) this.debug(fps);
  },

  // Himmel in einigen Farbstufen von oben nach unten (Retro-Verlauf)
  himmel() {
    const f = CONFIG.FARBEN;
    const stufen = f.HIMMEL_STUFEN;
    for (let i = 0; i < stufen; i++) {
      const t = i / (stufen - 1); // 0 = oben, 1 = unten
      const r = Math.round(f.HIMMEL_OBEN[0] + (f.HIMMEL_UNTEN[0] - f.HIMMEL_OBEN[0]) * t);
      const g = Math.round(f.HIMMEL_OBEN[1] + (f.HIMMEL_UNTEN[1] - f.HIMMEL_OBEN[1]) * t);
      const b = Math.round(f.HIMMEL_OBEN[2] + (f.HIMMEL_UNTEN[2] - f.HIMMEL_OBEN[2]) * t);
      const y1 = Math.round(this.horizont * i / stufen);
      const y2 = Math.round(this.horizont * (i + 1) / stufen);
      this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      this.ctx.fillRect(0, y1, CONFIG.BREITE, y2 - y1);
    }
  },

  // Für jede Pixelspalte die Berghöhe aus den beiden nächsten Punkten
  // ausrechnen. Passiert nur einmal beim Start, nicht in jedem Bild.
  bergHoehen(punkte) {
    const hoehen = [];
    let p = 0;
    for (let x = 0; x < CONFIG.BREITE; x++) {
      while (p < punkte.length - 2 && x >= punkte[p + 1][0]) p++;
      const [x1, h1] = punkte[p];
      const [x2, h2] = punkte[p + 1];
      hoehen.push(Math.round(h1 + (h2 - h1) * (x - x1) / (x2 - x1)));
    }
    return hoehen;
  },

  // Berge Spalte für Spalte als senkrechte Striche zeichnen, um "versatz"
  // Pixel seitlich verschoben. Was rechts hinausläuft, kommt links wieder
  // herein (die Silhouette wiederholt sich rundherum).
  berge(hoehen, versatz, farbe) {
    this.ctx.fillStyle = farbe;
    const b = CONFIG.BREITE;
    const v = Math.round(versatz);
    for (let x = 0; x < b; x++) {
      const hoehe = hoehen[(((x - v) % b) + b) % b];
      this.ctx.fillRect(x, this.horizont - hoehe, 1, hoehe);
    }
  },

  strasse() {
    const ctx = this.ctx;
    const f = CONFIG.FARBEN;
    const horizont = this.horizont;

    // Grund-Gras bis zum Horizont, damit ganz hinten keine Lücke bleibt
    ctx.fillStyle = f.GRAS_DUNKEL;
    ctx.fillRect(0, horizont, CONFIG.BREITE, CONFIG.HOEHE - horizont);

    const L = CONFIG.STUECK_LAENGE;
    const kameraZ = Car.z;
    const kameraX = Car.x;
    // Höhen werden fürs Bild verstärkt (HOEHEN_OPTIK), damit Hügel gut sichtbar sind.
    // Die Kamera fährt mit der (verstärkten) Strasse hoch und runter.
    const hoehenOptik = CONFIG.HOEHEN_OPTIK;
    const bodenHoehe = Road.hoeheBei(kameraZ) * hoehenOptik;
    const kameraY = bodenHoehe + CONFIG.KAMERA_HOEHE;
    const ersterIndex = Math.floor(kameraZ / L);

    // Kurven: Die Strassenmitte wandert mit jedem Stück weiter zur Seite.
    // "versatz" = wie weit (Meter) die Mitte gerade neben der Blickrichtung
    // liegt, "neigung" = wie viel Versatz pro Meter dazukommt. Jedes Stück
    // ändert die Neigung um seine Krümmung. Aufsummiert ergibt das eine
    // Strasse, die sich zum Horizont hin immer stärker wegbiegt.
    let versatz = 0;
    let neigung = 0;

    // Bis zu welcher Bildzeile (von unten) schon gezeichnet ist.
    // Wir zeichnen von nah nach fern und nur, was höher liegt als diese
    // Zeile. Was hinter einer Kuppe tiefer liegt, wird so automatisch
    // verdeckt und taucht erst wieder auf, wenn es höher liegt.
    let maxY = CONFIG.HOEHE;

    for (let n = 0; n < CONFIG.SICHTWEITE && maxY > 0; n++) {
      const index = ersterIndex + n;
      const stueck = Road.stueck(index);

      // Abstand von Kamera zu Anfang und Ende des Stücks.
      // Das Stück direkt unter der Kamera beginnt hinter ihr; für die
      // Kurve rechnen wir ab der Kamera, fürs Bild schneiden wir es knapp
      // vor der Kamera ab (sonst Division durch 0).
      const abstandVorne = index * L - kameraZ;
      const abstandHinten = abstandVorne + L;
      const strecke = abstandHinten - Math.max(abstandVorne, 0);

      const versatzVorne = versatz;
      versatz += neigung * strecke + stueck.kruemmung * strecke * strecke / 2;
      neigung += stueck.kruemmung * strecke;

      const hoeheVorne = n === 0 ? bodenHoehe : stueck.y * hoehenOptik;
      const hoeheHinten = Road.stueck(index + 1).y * hoehenOptik;
      const nah = Road.projiziere(versatzVorne, hoeheVorne, Math.max(abstandVorne, 0.1), kameraX, kameraY, horizont);
      const fern = Road.projiziere(versatz, hoeheHinten, abstandHinten, kameraX, kameraY, horizont);

      const oben = Math.max(Math.round(fern.y), 0);
      const unten = Math.min(Math.round(nah.y), maxY);
      if (unten <= oben) continue; // kleiner als ein Pixel, verdeckt oder Rückseite einer Kuppe

      this.stueckZeichnen(stueck, nah, fern, oben, unten);
      maxY = oben;
    }
  },

  // Ein Strassenstück Zeile für Zeile zeichnen. Pro Zeile werden Mitte
  // und Massstab zwischen dem nahen und dem fernen Ende "gemischt".
  stueckZeichnen(stueck, nah, fern, oben, unten) {
    const f = CONFIG.FARBEN;
    const strasse = CONFIG.STRASSE_HALBE_BREITE;
    const bankett = strasse + CONFIG.BANKETT_BREITE;
    const linie = CONFIG.MITTELLINIE_BREITE / 2;

    for (let y = oben; y < unten; y++) {
      // 0 = fern, 1 = nah. Begrenzt, weil bei ganz flachen Stücken sonst Unsinn herauskommt
      const t = Math.min(Math.max((y + 0.5 - fern.y) / (nah.y - fern.y), 0), 1);
      const mitte = fern.x + (nah.x - fern.x) * t;
      const m = fern.massstab + (nah.massstab - fern.massstab) * t;

      this.zeile(0, CONFIG.BREITE, y, stueck.hell ? f.GRAS_HELL : f.GRAS_DUNKEL);
      // Bankett zuerst über die ganze Breite, dann den Asphalt darüber.
      // Übrig bleibt links und rechts ein schmaler Erdstreifen.
      this.zeile(mitte - bankett * m, mitte + bankett * m, y, stueck.hell ? f.BANKETT_HELL : f.BANKETT_DUNKEL);
      this.zeile(mitte - strasse * m, mitte + strasse * m, y, stueck.hell ? f.ASPHALT_HELL : f.ASPHALT_DUNKEL);
      if (stueck.hell) {
        this.zeile(mitte - linie * m, mitte + linie * m, y, f.MITTELLINIE, true);
      }
    }
  },

  // Eine waagrechte Linie auf ganze Pixel gerundet.
  // mindestensEinPixel: dünne Linien (Mittellinie) sollen hinten nicht verschwinden.
  zeile(x1, x2, y, farbe, mindestensEinPixel) {
    const a = Math.round(x1);
    let b = Math.round(x2);
    if (mindestensEinPixel && b <= a) b = a + 1;
    if (b <= a) return;
    this.ctx.fillStyle = farbe;
    this.ctx.fillRect(a, y, b - a, 1);
  },

  // Platzhalter-Auto von hinten, immer unten in der Bildmitte.
  // Die Kamera folgt dem Auto, darum bewegt sich beim Lenken die Strasse.
  auto() {
    const ctx = this.ctx;
    const f = CONFIG.FARBEN;
    const w = CONFIG.AUTO_BREITE;
    const h = CONFIG.AUTO_HOEHE;
    const x = Math.round((CONFIG.BREITE - w) / 2);
    const y = CONFIG.HOEHE - CONFIG.AUTO_ABSTAND_UNTEN - h;
    // Kleine Hilfsfunktion: Rechteck relativ zur Auto-Ecke, alles gerundet
    const rechteck = (farbe, rx, ry, rw, rh) => {
      ctx.fillStyle = farbe;
      ctx.fillRect(x + Math.round(rx), y + Math.round(ry), Math.round(rw), Math.round(rh));
    };

    const radB = w * 0.18;  // Radbreite
    const radH = h * 0.35;  // sichtbare Radhöhe
    const dachY = 0;
    const koerperY = h * 0.4; // ab hier beginnt die breite Karosserie

    rechteck(f.AUTO_SCHATTEN, -3, h - 3, w + 6, 5);                     // Schatten
    rechteck(f.AUTO_RAD, 1, h - radH, radB, radH);                       // Rad links
    rechteck(f.AUTO_RAD, w - 1 - radB, h - radH, radB, radH);            // Rad rechts
    rechteck(f.AUTO_KAROSSERIE, 0, koerperY, w, h * 0.45);               // Karosserie
    rechteck(f.AUTO_DACH, w * 0.17, dachY, w * 0.66, koerperY + 1);      // Dach/Kabine
    rechteck(f.AUTO_SCHEIBE, w * 0.22, dachY + 2, w * 0.56, koerperY - 3); // Heckscheibe
    rechteck(f.AUTO_STREIFEN, w * 0.44, koerperY, w * 0.12, h * 0.45);   // Rallye-Streifen
    rechteck(f.AUTO_RUECKLICHT, 2, koerperY + 3, w * 0.17, 3);           // Rücklicht links
    rechteck(f.AUTO_RUECKLICHT, w - 2 - w * 0.17, koerperY + 3, w * 0.17, 3); // Rücklicht rechts
  },

  // --- Analoge Anzeigen ---
  // Links Drehzahlmesser mit Gang, rechts Tempomesser mit kleiner Digitalzahl.
  anzeigen() {
    const r = CONFIG.ANZEIGE_RADIUS;
    const y = CONFIG.ANZEIGE_Y;
    const f = CONFIG.FARBEN;

    // Drehzahl (Skala in 1000 U/min)
    let x = CONFIG.DREHZAHL_ANZEIGE_X;
    this.ctx.drawImage(this.blattDrehzahl, x - r, y - r);
    // Gang unten in der Mitte: Dort kommt die Nadel nie hin (Lücke der Skala)
    const gang = Car.gangText();
    this.text(gang, x - Math.floor(this.textBreite(gang) * 2 / 2), y + 6, 2, f.ANZEIGE_SKALA);
    this.nadel(x, y, this.nadelDrehzahl / CONFIG.DREHZAHL_SKALA_MAX);

    // Tempo
    x = CONFIG.TEMPO_ANZEIGE_X;
    this.ctx.drawImage(this.blattTempo, x - r, y - r);
    const zahl = String(Car.kmh());
    // Rechtsbündig in einem festen Feld (11 Pixel = 3 Ziffern), damit nichts
    // hüpft. Tiefer als die Skalenzahlen, damit man sie nicht verwechselt.
    this.text(zahl, x + 6 - this.textBreite(zahl), y + 11, 1, f.ANZEIGE_SKALA);
    this.text('KM/H', x - 7, y + 18, 1, f.ANZEIGE_RAHMEN);
    this.nadel(x, y, this.nadelTempo / CONFIG.TEMPO_SKALA_MAX);
  },

  // --- Debug-Anzeige (Taste F3) ---
  // Hilft beim Testen und beim Bearbeiten der Strecke in track.js.
  debug(fps) {
    const f = CONFIG.FARBEN;
    const stueck = Road.stueckBei(Car.z);
    const kurve = stueck.kurve;
    let kurveText = 'GERADE';
    if (Math.abs(kurve) >= 0.05) {
      kurveText = (kurve < 0 ? 'LINKS ' : 'RECHTS ') + Math.abs(kurve).toFixed(1);
    }
    const steigung = stueck.steigung * 100;
    const auslastung = Math.round(Car.auslastung * 100);
    const zeilen = [
      'FPS ' + Math.round(fps),
      'STRECKE ' + Math.floor(Car.z) + ' / ' + Math.round(Road.laenge) + ' M',
      'ABSCHNITT ' + stueck.abschnitt.toUpperCase(),
      'KURVE ' + kurveText,
      'STEIGUNG ' + (steigung > 0.05 ? '+' : '') + steigung.toFixed(1) + ' %',
      // Wie viel vom Grenztempo der Kurve genutzt wird. Über 100 % untersteuert das Auto.
      'AUSLASTUNG ' + (auslastung > 0 ? auslastung + ' %' : '-'),
    ];
    let breite = 0;
    for (const z of zeilen) breite = Math.max(breite, this.textBreite(z));
    this.ctx.fillStyle = f.DEBUG_HINTERGRUND;
    this.ctx.fillRect(2, 2, breite + 4, zeilen.length * 7 + 2);
    zeilen.forEach((z, i) => this.text(z, 4, 4 + i * 7, 1, f.DEBUG_TEXT));
  },

  // Winkel (Bogenmass) für einen Anteil der Skala von 0 bis 1.
  // Die Skala ist unten offen: Sie beginnt links unten und läuft im
  // Uhrzeigersinn über oben nach rechts unten. 90 Grad zeigt im Bild nach unten.
  skalaWinkel(anteil) {
    const start = 90 + (360 - CONFIG.ANZEIGE_WINKEL) / 2;
    return (start + anteil * CONFIG.ANZEIGE_WINKEL) * Math.PI / 180;
  },

  // Rote Nadel vom Mittelpunkt nach aussen, plus kleine Nabe in der Mitte
  nadel(cx, cy, anteil) {
    const f = CONFIG.FARBEN;
    const w = this.skalaWinkel(Math.min(Math.max(anteil, 0), 1));
    const laenge = CONFIG.ANZEIGE_RADIUS - 5;
    this.pixelLinie(this.ctx, cx, cy,
      cx + Math.cos(w) * laenge, cy + Math.sin(w) * laenge, f.ANZEIGE_NADEL);
    this.ctx.fillStyle = f.ANZEIGE_NABE;
    this.ctx.fillRect(cx - 1, cy - 1, 3, 3);
    this.ctx.fillStyle = f.ANZEIGE_NADEL;
    this.ctx.fillRect(cx, cy, 1, 1);
  },

  // Ein Zifferblatt einmal auf eine unsichtbare Leinwand zeichnen.
  // Warum? Hintergrund, Ring, Striche und Zahlen ändern sich nie. So muss
  // man sie nicht in jedem Bild neu ausrechnen, sondern nur hinkopieren.
  //   max:         höchster Wert der Skala
  //   zahlAlle:    alle wie viel eine Zahl hingeschrieben wird
  //   strichAlle:  alle wie viel ein langer Strich kommt
  //   kleinAlle:   alle wie viel ein kurzer Zwischenstrich kommt (0 = keine)
  //   rotAb:       ab diesem Wert ist die Skala rot (null = nirgends)
  zifferblattVorzeichnen(max, zahlAlle, strichAlle, kleinAlle, rotAb) {
    const f = CONFIG.FARBEN;
    const r = CONFIG.ANZEIGE_RADIUS;
    const blatt = document.createElement('canvas');
    blatt.width = 2 * r + 1;
    blatt.height = 2 * r + 1;
    const c = blatt.getContext('2d');
    const startGrad = 90 + (360 - CONFIG.ANZEIGE_WINKEL) / 2;

    // Pixel für Pixel: Abstand zur Mitte entscheidet, ob Hintergrund,
    // Ring oder roter Bogen. So wird der Kreis sauber pixelig statt verschmiert.
    for (let py = 0; py <= 2 * r; py++) {
      for (let px = 0; px <= 2 * r; px++) {
        const dx = px - r;
        const dy = py - r;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > r + 0.3) continue; // ausserhalb des Kreises
        let farbe = f.ANZEIGE_HINTERGRUND;
        if (d > r - 1.5) {
          farbe = f.ANZEIGE_RAHMEN;
        } else if (rotAb !== null && d > r - 4 && d <= r - 2) {
          // Wo auf der Skala liegt dieses Pixel? (0 = Skalenanfang, 1 = Ende)
          const grad = Math.atan2(dy, dx) * 180 / Math.PI;
          const anteil = ((grad - startGrad + 720) % 360) / CONFIG.ANZEIGE_WINKEL;
          if (anteil >= rotAb / max && anteil <= 1) farbe = f.ANZEIGE_ROT;
        }
        c.fillStyle = farbe;
        c.fillRect(px, py, 1, 1);
      }
    }

    // Striche. Kleine Rechenfehler (z. B. 0.1 + 0.2) mit Math.round abfangen.
    const schritt = kleinAlle || strichAlle;
    for (let i = 0; i * schritt <= max + 1e-6; i++) {
      const wert = i * schritt;
      const lang = Math.abs(Math.round(wert / strichAlle) * strichAlle - wert) < 1e-6;
      const w = this.skalaWinkel(wert / max);
      const innen = lang ? r - 6 : r - 4;
      const farbe = rotAb !== null && wert >= rotAb ? f.ANZEIGE_ROT : f.ANZEIGE_SKALA;
      this.pixelLinie(c, r + Math.cos(w) * (r - 2), r + Math.sin(w) * (r - 2),
        r + Math.cos(w) * innen, r + Math.sin(w) * innen, farbe);
    }

    // Zahlen, etwas weiter innen als die Striche
    const zahlRadius = r - 11;
    for (let wert = 0; wert <= max; wert += zahlAlle) {
      const w = this.skalaWinkel(wert / max);
      const t = String(wert);
      const breite = this.textBreite(t);
      const tx = Math.round(r + Math.cos(w) * zahlRadius - breite / 2);
      const ty = Math.round(r + Math.sin(w) * zahlRadius - 2.5);
      const farbe = rotAb !== null && wert >= rotAb ? f.ANZEIGE_ROT : f.ANZEIGE_SKALA;
      this.text(t, tx, ty, 1, farbe, c);
    }
    return blatt;
  },

  // Gerade Linie aus einzelnen Pixeln (Bresenham-Verfahren).
  // Der Browser würde schräge Linien weichzeichnen; so bleiben sie scharf.
  pixelLinie(c, x1, y1, x2, y2, farbe) {
    let x = Math.round(x1);
    let y = Math.round(y1);
    const zx = Math.round(x2);
    const zy = Math.round(y2);
    const dx = Math.abs(zx - x);
    const dy = -Math.abs(zy - y);
    const sx = x < zx ? 1 : -1;
    const sy = y < zy ? 1 : -1;
    let fehler = dx + dy;
    c.fillStyle = farbe;
    for (;;) {
      c.fillRect(x, y, 1, 1);
      if (x === zx && y === zy) break;
      const f2 = 2 * fehler;
      if (f2 >= dy) { fehler += dy; x += sx; }
      if (f2 <= dx) { fehler += dx; y += sy; }
    }
  },

  // Text in der Pixelschrift. "c" ist die Leinwand, auf die gezeichnet
  // wird (ohne Angabe: das Spielbild).
  text(text, x, y, gross, farbe, c = this.ctx) {
    c.fillStyle = farbe;
    let links = 0; // wie weit (in Schrift-Pixeln) das nächste Zeichen nach rechts rückt
    for (const z of text) {
      const zeichen = PIXEL_SCHRIFT[z];
      if (!zeichen) continue;
      for (let zy = 0; zy < 5; zy++) {
        for (let zx = 0; zx < zeichen[zy].length; zx++) {
          if (zeichen[zy][zx] === '1') {
            c.fillRect(x + (links + zx) * gross, y + zy * gross, gross, gross);
          }
        }
      }
      links += zeichen[0].length + 1; // Zeichenbreite plus 1 Pixel Abstand
    }
  },

  // Breite eines Textes in Pixeln (bei normaler Grösse), z. B. zum Zentrieren
  textBreite(text) {
    let breite = 0;
    for (const z of text) {
      if (PIXEL_SCHRIFT[z]) breite += PIXEL_SCHRIFT[z][0].length + 1;
    }
    return Math.max(breite - 1, 0);
  },
};
