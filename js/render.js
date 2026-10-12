// Zeichnen: Himmel, Berge, Strasse, Auto und Tempoanzeige.
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

// Mini-Pixelschrift (3 Pixel breit, 5 hoch). "1" = Pixel an, "0" = aus.
// Eigene Schrift, weil normaler Canvas-Text bei 320x180 verschwommen aussieht.
const PIXEL_SCHRIFT = {
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '010', '010', '010'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
  'K': ['101', '101', '110', '101', '101'],
  'M': ['101', '111', '111', '101', '101'],
  'H': ['101', '101', '111', '101', '101'],
  '/': ['001', '001', '010', '100', '100'],
  ' ': ['000', '000', '000', '000', '000'],
};

const Render = {
  ctx: null,

  start(ctx) {
    this.ctx = ctx;
  },

  zeichneAlles() {
    this.himmel();
    this.berge(BERGE_HINTEN, CONFIG.FARBEN.BERG_HINTEN);
    this.berge(BERGE_VORNE, CONFIG.FARBEN.BERG_VORNE);
    this.strasse();
    this.auto();
    this.tempoanzeige();
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
      const y1 = Math.round(CONFIG.HORIZONT_Y * i / stufen);
      const y2 = Math.round(CONFIG.HORIZONT_Y * (i + 1) / stufen);
      this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      this.ctx.fillRect(0, y1, CONFIG.BREITE, y2 - y1);
    }
  },

  // Berge Spalte für Spalte zeichnen: Für jede Pixelspalte die Höhe aus
  // den beiden nächsten Punkten ausrechnen und einen senkrechten Strich ziehen.
  berge(punkte, farbe) {
    this.ctx.fillStyle = farbe;
    let p = 0;
    for (let x = 0; x < CONFIG.BREITE; x++) {
      while (p < punkte.length - 2 && x >= punkte[p + 1][0]) p++;
      const [x1, h1] = punkte[p];
      const [x2, h2] = punkte[p + 1];
      const hoehe = Math.round(h1 + (h2 - h1) * (x - x1) / (x2 - x1));
      this.ctx.fillRect(x, CONFIG.HORIZONT_Y - hoehe, 1, hoehe);
    }
  },

  strasse() {
    const ctx = this.ctx;
    const f = CONFIG.FARBEN;

    // Grund-Gras bis zum Horizont, damit ganz hinten keine Lücke bleibt
    ctx.fillStyle = f.GRAS_DUNKEL;
    ctx.fillRect(0, CONFIG.HORIZONT_Y, CONFIG.BREITE, CONFIG.HOEHE - CONFIG.HORIZONT_Y);

    const kameraZ = Car.z;
    const kameraX = Car.x;
    const ersterIndex = Math.floor(kameraZ / CONFIG.STUECK_LAENGE);
    // Bis zu welcher Bildzeile (von unten) schon gezeichnet ist.
    // Wir zeichnen von vorne nach hinten; Weiter-hinten-Liegendes darf
    // nichts Näheres übermalen.
    let maxY = CONFIG.HOEHE;

    for (let n = 0; n < CONFIG.SICHTWEITE; n++) {
      const index = ersterIndex + n;
      const stueck = Road.stueckBei(index * CONFIG.STUECK_LAENGE);

      // Abstand von Kamera zu Anfang und Ende des Stücks.
      // Das Stück direkt unter der Kamera beginnt hinter ihr; wir
      // schneiden es knapp vor der Kamera ab (sonst Division durch 0).
      const abstandVorne = Math.max(index * CONFIG.STUECK_LAENGE - kameraZ, 0.1);
      const abstandHinten = (index + 1) * CONFIG.STUECK_LAENGE - kameraZ;

      const nah = Road.projiziere(0, abstandVorne, kameraX);
      const fern = Road.projiziere(0, abstandHinten, kameraX);

      const oben = Math.max(Math.round(fern.y), CONFIG.HORIZONT_Y);
      const unten = Math.min(Math.round(nah.y), maxY);
      if (unten <= oben) continue; // Stück ist kleiner als ein Pixel oder verdeckt

      this.stueckZeichnen(stueck, nah, fern, oben, unten);
      maxY = oben;
    }
  },

  // Ein Strassenstück Zeile für Zeile zeichnen. Pro Zeile werden Mitte
  // und Massstab zwischen dem nahen und dem fernen Ende "gemischt".
  stueckZeichnen(stueck, nah, fern, oben, unten) {
    const f = CONFIG.FARBEN;
    const strasse = CONFIG.STRASSE_HALBE_BREITE;
    const rand = strasse + CONFIG.RANDSTREIFEN_BREITE;
    const linie = CONFIG.MITTELLINIE_BREITE / 2;

    for (let y = oben; y < unten; y++) {
      const t = (y + 0.5 - fern.y) / (nah.y - fern.y); // 0 = fern, 1 = nah
      const mitte = fern.x + (nah.x - fern.x) * t;
      const m = fern.massstab + (nah.massstab - fern.massstab) * t;

      this.zeile(0, CONFIG.BREITE, y, stueck.hell ? f.GRAS_HELL : f.GRAS_DUNKEL);
      this.zeile(mitte - rand * m, mitte + rand * m, y, stueck.hell ? f.RAND_WEISS : f.RAND_ROT);
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

  // Tempo als Zahl unten rechts: grosse Ziffern, daneben klein "KM/H"
  tempoanzeige() {
    const zahl = String(Car.kmh());
    const gross = 2; // Ziffern doppelt so gross zeichnen
    // Platz immer für 3 Ziffern, damit die Box beim Beschleunigen nicht hüpft
    const zahlBreite = 3 * 4 * gross - gross;
    const einheitBreite = 'KM/H'.length * 4 - 1;
    const rand = 4;
    const gesamt = zahlBreite + 3 + einheitBreite;
    const x = CONFIG.BREITE - rand - gesamt;
    const y = CONFIG.HOEHE - rand - 5 * gross;

    this.ctx.fillStyle = CONFIG.FARBEN.ANZEIGE_HINTERGRUND;
    this.ctx.fillRect(x - 3, y - 3, gesamt + 6, 5 * gross + 6);
    // Zahl rechtsbündig: bei weniger Ziffern weiter rechts anfangen
    this.text(zahl, x + (3 - zahl.length) * 4 * gross, y, gross);
    this.text('KM/H', x + zahlBreite + 3, y + 5 * gross - 5, 1);
  },

  text(text, x, y, gross) {
    this.ctx.fillStyle = CONFIG.FARBEN.ANZEIGE_TEXT;
    for (let i = 0; i < text.length; i++) {
      const zeichen = PIXEL_SCHRIFT[text[i]];
      if (!zeichen) continue;
      for (let zy = 0; zy < 5; zy++) {
        for (let zx = 0; zx < 3; zx++) {
          if (zeichen[zy][zx] === '1') {
            this.ctx.fillRect(x + (i * 4 + zx) * gross, y + zy * gross, gross, gross);
          }
        }
      }
    }
  },
};
