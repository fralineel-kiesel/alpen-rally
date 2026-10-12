// Zeichnen: Himmel, Wolken, Berge, Waldlinie, Tal, Strasse, Hang,
// Bänder (Leitplanke, Zaun), Objekte am Rand, Auto und Anzeigen (Drehzahl, Tempo).
// Wir zeichnen fast alles mit fillRect auf ganze Pixel. Schräge Linien
// würde der Browser sonst weichzeichnen, und das passt nicht zum Pixel-Look.
//
// Reihenfolge in jedem Bild (was später kommt, liegt oben):
//  1. Himmel, Wolken, drei Berg-Ebenen, Waldlinie
//  2. Grund: Gras, oder (wenn irgendwo ein Abhang offen ist) Dunst-Landschaft
//     und Talboden, von fern nach nah
//  3. Pro Strassenstück von fern nach nah ("Maleralgorithmus"): zuerst
//     Strasse mit Bankett und Gras, dann die Flächen des Hangs (mit Flanke
//     bis zum Bildrand und Waldkante), dann alles, was auf diesem Stück
//     steht, von aussen nach innen (Bäume auf dem Hang, Objekte hinter dem
//     Band, Band mit Pfosten, übrige Objekte). So verdeckt jedes nähere
//     Stück alles dahinter, auch den Hang hinter einer Kuppe.
//     Welche Bildzeilen jedes Stück Strasse bekommt, wird vorher von nah
//     nach fern ausgerechnet (siehe strasse()), damit ganz hinten am
//     Horizont keine Lücken entstehen.
//  4. Auto, Anzeigen, Debug

// Berg-Silhouetten als Liste von Punkten [x im Bild, Höhe über dem Horizont].
// Zwischen den Punkten wird gerade verbunden. Erster und letzter Punkt sind
// gleich hoch, damit die Naht beim Wiederholen (alle 320 Pixel) kaum auffällt.
// Ganz ferne Berge im Dunst: breit und ruhig, schauen zwischen den hinteren hervor
const BERGE_FERN = [
  [0, 40], [24, 50], [46, 45], [72, 58], [98, 49], [122, 55], [150, 44],
  [180, 60], [206, 51], [236, 47], [262, 57], [292, 46], [320, 40],
];
// Hintere Berge: hoch und schroff. Gipfel über SCHNEE_AB (config.js) tragen Schnee.
const BERGE_HINTEN = [
  [0, 30], [16, 42], [28, 37], [46, 64], [55, 54], [62, 57], [80, 35], [98, 46],
  [110, 40], [130, 68], [141, 56], [149, 59], [168, 36], [188, 49], [202, 42],
  [222, 58], [233, 50], [250, 66], [266, 46], [282, 38], [300, 51], [320, 30],
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

// Wolken laufen über so viele Pixel rundherum (breiter als das Bild,
// damit sie ganz verschwinden, bevor sie auf der anderen Seite auftauchen)
const WOLKEN_BEREICH = 480;

const Render = {
  ctx: null,
  // Wohin die Nadeln gerade zeigen. Sie laufen dem echten Wert etwas
  // hinterher, damit sie ruhig wirken und nicht bei jedem Bild zittern.
  nadelDrehzahl: 0,
  nadelTempo: 0,
  // Fertig vorgezeichnete Zifferblätter (ohne Nadel), siehe zifferblattVorzeichnen
  blattDrehzahl: null,
  blattTempo: null,
  // Berg-Ebenen, einmal vorgezeichnet ({ bild, hoehe }), und wie weit sie
  // gerade seitlich verschoben sind (Parallax in Kurven)
  bergFern: null,
  bergHinten: null,
  bergVorne: null,
  bergVersatzFern: 0,
  bergVersatzHinten: 0,
  bergVersatzVorne: 0,
  // Dunst-Landschaft tief unten im Tal (einmal vorgezeichnet) und ihre
  // seitliche Verschiebung; Farben des Talbodens nach Entfernung
  dunst: null,
  dunstVersatz: 0,
  talFarben: null,
  hangFarben: null,
  viereckX: [0, 0, 0, 0], // Hilfsspeicher für viereck()
  viereckY: [0, 0, 0, 0],
  fleckPunkte: [0, 0, 0, 0, 0, 0, 0, 0], // Hilfsspeicher für hangFleck()
  talSichtbar: false, // ist in diesem Bild irgendwo ein Abhang offen?
  fernX: 0,           // Strassenmitte (x im Bild) ganz hinten, trennt Gras und Dunst am Horizont
  fernTal: [false, false], // ist beim hintersten sichtbaren Stück links / rechts ein Abhang?
  // Pro Bildzeile und Seite: Wie weit (x) reicht dort schon Hang oder Talboden
  // in Richtung Strasse, und wie weit weg (Meter) ist er? Damit malt eine
  // weit entfernte, tiefer liegende Strasse den näheren Talboden nicht zu.
  bodenX: [new Float32Array(CONFIG.HOEHE), new Float32Array(CONFIG.HOEHE)],
  bodenZ: [new Float32Array(CONFIG.HOEHE), new Float32Array(CONFIG.HOEHE)],
  // Horizont: kippt leicht mit der Steigung vor dem Auto (geglättet).
  // horizontVersatz ist der genaue Wert, horizont die gerundete Bildzeile,
  // auf der Himmel, Berge und Strasse in diesem Bild zusammentreffen.
  horizontVersatz: 0,
  horizont: CONFIG.HORIZONT_Y,
  // Waldlinie am Horizont (einmal vorgezeichnet) und ihre seitliche Verschiebung
  waldlinie: null,
  waldVersatz: 0,
  // Wolken: aktuelle x-Position jeder Wolke (treiben langsam nach rechts)
  wolkenX: [],
  // Alle Strassenstücke bis zur Sichtweite mit ihrer Lage im Bild (rechnet
  // strasse() aus, nutzen danach Tal, Hang, Bänder und Objekte), und
  // die Kamera dazu. Die Einträge werden in jedem Bild wiederverwendet,
  // statt neu angelegt (weniger Aufräumarbeit für den Browser).
  sichtbar: [],
  anzahlSichtbar: 0,
  kameraX: 0,
  kameraY: 0,
  objekteGezeichnet: 0, // für die Debug-Anzeige
  // Querschnitt des Hangs im Bild: für jeden Stückanfang bis zur Sichtweite
  // (ein Platz mehr für das ferne Ende des letzten Stücks) und jede Seite die
  // Bildpunkte aller Querschnitt-Punkte. Zwei Nachbarstücke benutzen so genau
  // dieselben Zahlen für ihre gemeinsame Kante: keine Spalten, keine Stufen.
  hangX: [],
  hangY: [],
  hangSeite: [false, false], // ist in diesem Bild links / rechts irgendwo ein Hang?
  ebene: [],            // Hilfsliste für objekteVorbereiten (alles auf einem Stück)
  // Nachträge für die Strasse ganz hinten (Stücke dünner als ein Pixel, siehe
  // strasse()). Werden in jedem Bild wiederverwendet.
  nachtraege: [],
  nachAnzahl: 0,
  // Waldkante: Für jede Bildspalte und Seite die Oberkante des Bergs (y), welches
  // Stück sie bildet (Nummer in "sichtbar", -1 = keins), wo das in der Welt ist
  // (Meter, damit die Zacken beim Fahren nicht flimmern) und der Massstab dort.
  kanteY: [new Float32Array(CONFIG.BREITE), new Float32Array(CONFIG.BREITE)],
  kanteN: [new Int16Array(CONFIG.BREITE), new Int16Array(CONFIG.BREITE)],
  kanteA: [new Float32Array(CONFIG.BREITE), new Float32Array(CONFIG.BREITE)],
  kanteM: [new Float32Array(CONFIG.BREITE), new Float32Array(CONFIG.BREITE)],

  start(ctx) {
    this.ctx = ctx;
    this.nadelDrehzahl = Car.drehzahl;
    this.blattDrehzahl = this.zifferblattVorzeichnen(
      CONFIG.DREHZAHL_SKALA_MAX / 1000, 1, 1, 0.5, CONFIG.DREHZAHL_ROT_AB / 1000);
    this.blattTempo = this.zifferblattVorzeichnen(CONFIG.TEMPO_SKALA_MAX, 40, 40, 20, null);
    const f = CONFIG.FARBEN;
    this.bergFern = this.bergVorzeichnen(BERGE_FERN, f.BERG_FERN, false);
    this.bergHinten = this.bergVorzeichnen(BERGE_HINTEN, f.BERG_HINTEN, true);
    this.bergVorne = this.bergVorzeichnen(BERGE_VORNE, f.BERG_VORNE, false);
    this.waldlinie = this.waldlinieVorzeichnen();
    this.dunst = this.dunstVorzeichnen();
    this.talFarben = this.talFarbenMischen(); // setzt auch hangFarben
    this.wolkenX = CONFIG.WOLKEN.map((w) => w.x);
    // Ein Platz mehr als der Querschnitt Punkte hat: die Verlängerung bis zum Bildrand
    const plaetze = Scenery.hangPunkte + 1;
    for (let n = 0; n <= CONFIG.SICHTWEITE; n++) {
      this.hangX.push([new Float32Array(plaetze), new Float32Array(plaetze)]);
      this.hangY.push([new Float32Array(plaetze), new Float32Array(plaetze)]);
    }
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
    this.bergVersatzFern -= drehung * CONFIG.BERG_PARALLAX_FERN;
    this.bergVersatzHinten -= drehung * CONFIG.BERG_PARALLAX_HINTEN;
    this.bergVersatzVorne -= drehung * CONFIG.BERG_PARALLAX_VORNE;
    this.waldVersatz -= drehung * CONFIG.WALDLINIE_PARALLAX; // Waldlinie: näher, also noch schneller
    this.dunstVersatz -= drehung * CONFIG.TAL_PARALLAX;
    // Im Bereich 0 bis BREITE halten, damit die Zahl nicht endlos wächst
    const b = CONFIG.BREITE;
    this.bergVersatzFern = ((this.bergVersatzFern % b) + b) % b;
    this.bergVersatzHinten = ((this.bergVersatzHinten % b) + b) % b;
    this.bergVersatzVorne = ((this.bergVersatzVorne % b) + b) % b;
    this.waldVersatz = ((this.waldVersatz % b) + b) % b;
    this.dunstVersatz = ((this.dunstVersatz % b) + b) % b;

    // Wolken treiben von selbst langsam nach rechts und wandern in Kurven
    // ein wenig mit (weniger als die Berge, sie sind ja weiter weg).
    // Sie laufen rundherum über WOLKEN_BEREICH Pixel, also auch ausserhalb des Bilds.
    for (let i = 0; i < this.wolkenX.length; i++) {
      let x = this.wolkenX[i] + CONFIG.WOLKEN_DRIFT * dt - drehung * CONFIG.WOLKEN_PARALLAX;
      this.wolkenX[i] = ((x % WOLKEN_BEREICH) + WOLKEN_BEREICH) % WOLKEN_BEREICH;
    }

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
    this.wolken();
    this.berge(this.bergFern, this.bergVersatzFern);
    this.berge(this.bergHinten, this.bergVersatzHinten);
    this.berge(this.bergVorne, this.bergVersatzVorne);
    this.waldlinieZeichnen();
    this.strasse();
    // Strasse, Hang, Bänder und Objekte von weit nach nah zeichnen, damit
    // nahe die fernen überdecken. Das Auto kommt dazwischen: alles hinter dem
    // Auto zuerst (und die ganze Strasse), dann das Auto, dann was noch näher
    // an der Kamera ist.
    const liste = this.objekteVorbereiten();
    this.objekteZeichnen(liste, true);
    this.auto();
    this.objekteZeichnen(liste, false);
    this.wackeln();
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

  // Eine Berg-Ebene einmal auf eine eigene Leinwand zeichnen (so breit wie
  // das Bild). In jedem Bild wird sie dann nur noch hinkopiert, das ist viel
  // schneller als Spalte für Spalte. schnee: true = hohe Gipfel bekommen Schnee.
  bergVorzeichnen(punkte, farbe, schnee) {
    const f = CONFIG.FARBEN;
    const B = CONFIG.BREITE;
    const hoehen = this.bergHoehen(punkte);
    const H = Math.max(...hoehen);
    const leinwand = document.createElement('canvas');
    leinwand.width = B;
    leinwand.height = H;
    const c = leinwand.getContext('2d');
    c.fillStyle = farbe;
    for (let x = 0; x < B; x++) c.fillRect(x, H - hoehen[x], 1, hoehen[x]);
    if (schnee) {
      // Eigener kleiner Zufall mit fester Startzahl: jedes Mal gleicher Schnee
      let zahl = 4242;
      const zufall = () => {
        zahl = (zahl * 1103515245 + 12345) % 2147483648;
        return zahl / 2147483648;
      };
      for (let x = 0; x < B; x++) {
        const ueber = hoehen[x] - CONFIG.SCHNEE_AB;
        if (ueber <= 0) continue;
        // Wie weit der Schnee hinunterreicht, mit etwas Zufall: so ist die
        // Schneegrenze unregelmässig abgesetzt statt schnurgerade.
        const tiefe = Math.max(1, Math.round(ueber * CONFIG.SCHNEE_MENGE + zufall() * 3 - 1));
        // Wo der Berg nach rechts abfällt, liegt der Schnee im Schatten
        // (die Sonne kommt von links): dort hellblau, sonst weiss mit
        // vereinzelten hellblauen Pixeln.
        const schatten = hoehen[(x + 1) % B] < hoehen[x];
        for (let r = 0; r < tiefe; r++) {
          c.fillStyle = (schatten && r > 0) || zufall() < 0.18 ? f.SCHNEE_SCHATTEN : f.SCHNEE;
          c.fillRect(x, H - hoehen[x] + r, 1, 1);
        }
      }
    }
    return { bild: leinwand, hoehe: H };
  },

  // Eine Berg-Ebene zweimal nebeneinander zeichnen, um "versatz" Pixel
  // verschoben. Was rechts hinausläuft, kommt links wieder herein.
  berge(berg, versatz) {
    const v = Math.round(versatz);
    const y = this.horizont - berg.hoehe;
    this.ctx.drawImage(berg.bild, v, y);
    this.ctx.drawImage(berg.bild, v - CONFIG.BREITE, y);
  },

  strasse() {
    const ctx = this.ctx;
    const f = CONFIG.FARBEN;
    const horizont = this.horizont;

    // Höhen werden fürs Bild verstärkt (HOEHEN_OPTIK), damit Hügel gut sichtbar sind.
    // Die Kamera fährt mit der (verstärkten) Strasse hoch und runter.
    const bodenHoehe = Road.hoeheBei(Car.z) * CONFIG.HOEHEN_OPTIK;
    this.kameraX = Car.x;
    this.kameraY = bodenHoehe + CONFIG.KAMERA_HOEHE;

    // 1) Alle Stücke bis zur Sichtweite: wo liegen sie im Bild?
    const anzahl = this.stueckeProjizieren(Car.z, bodenHoehe);
    const sichtbar = this.sichtbar;

    // 2) Grund bis zum Horizont, damit ganz hinten keine Lücke bleibt.
    //    Ist irgendwo ein Abhang offen, liegt darunter das Tal: Dunst-Landschaft
    //    und der Talboden. Die Strasse kommt danach und deckt alles zu, was
    //    eigentlich hinter der Abbruchkante versteckt ist.
    if (this.talSichtbar) {
      this.dunstZeichnen();
      // Ganz hinten (über Kuppen, Gefällen, am Horizont) zählt das hinterste
      // sichtbare Stück: Hat es auf einer Seite keinen Abhang, kommt dort
      // Gras hin (getrennt an seiner Strassenmitte), sonst sähe man dort
      // Dunst statt Wiese.
      ctx.fillStyle = f.GRAS_DUNKEL;
      const trenn = Math.min(Math.max(Math.round(this.fernX), 0), CONFIG.BREITE);
      if (!this.fernTal[0]) ctx.fillRect(0, horizont, trenn, CONFIG.HOEHE - horizont);
      if (!this.fernTal[1]) ctx.fillRect(trenn, horizont, CONFIG.BREITE - trenn, CONFIG.HOEHE - horizont);
      this.talboden(anzahl);
    } else {
      ctx.fillStyle = f.GRAS_DUNKEL;
      ctx.fillRect(0, horizont, CONFIG.BREITE, CONFIG.HOEHE - horizont);
    }

    // 3) Strasse von nah nach fern: Hier wird nur ausgerechnet, welche
    // Bildzeilen jedes Stück bekommt. Gezeichnet wird später, von fern nach
    // nah zusammen mit Hang und Objekten (strasseStueck). So verdeckt die
    // Strasse vor einer Kuppe auch den Hang dahinter genau dort, wo sie liegt,
    // und der Hang bleibt über der Kuppe sichtbar.
    // maxY: bis zu welcher Bildzeile (von unten) nähere Stücke schon alles
    // belegen. Ein Stück bekommt nur Zeilen darüber. Was hinter einer Kuppe
    // tiefer liegt, bekommt keine Zeilen und taucht erst wieder auf, wenn es
    // höher liegt.
    let maxY = CONFIG.HOEHE;
    let besitzer = null; // Stück, dem die Zeile maxY gehört (Nachträge kommen zu ihm)
    this.nachAnzahl = 0;

    for (let n = 0; n < anzahl; n++) {
      const e = sichtbar[n];
      const stueck = e.stueck;
      const nah = e.nah;
      const fern = e.fern;

      // "clip" ist die oberste Bildzeile, die nähere Stücke schon belegen.
      // Bänder und Objekte auf Strassenhöhe werden dort abgeschnitten.
      e.clip = maxY;
      e.zeileVon = 0;
      e.zeileBis = 0;
      e.nachVon = 0;
      e.nachBis = 0;
      if (maxY <= 0) continue; // das ganze Bild ist schon voll

      const oben = Math.max(Math.round(fern.y), 0);
      const unten = Math.min(Math.round(nah.y), maxY);
      if (unten > oben) {
        e.zeileVon = oben;
        e.zeileBis = unten;
        // Ragt das nahe Ende noch ein Stück in die schon belegte Zeile
        // darunter, auch diesen Rest nachtragen. Sonst bleibt dort, wo die
        // Strasse fast waagrecht läuft, eine Lücke von ein, zwei Pixeln.
        if (unten === maxY && maxY < CONFIG.HOEHE && nah.y > unten) {
          const x1 = this.mitteBei(nah, fern, unten);
          const x2 = this.mitteBei(nah, fern, Math.min(nah.y, unten + 1));
          this.nachtragMerken(besitzer, stueck, Math.min(x1, x2), Math.max(x1, x2), nah.massstab, unten);
        }
        maxY = oben;
        besitzer = e;
        e.nachVon = e.nachBis = this.nachAnzahl;
      } else if (oben === maxY && maxY < CONFIG.HOEHE) {
        // Weit hinten ist ein Stück oft weniger als ein Pixel hoch. Früher
        // fiel es dann einfach weg. In einer Kurve läuft die ferne Strasse
        // aber fast waagrecht durchs Bild: Viele solche Stücke liegen auf
        // derselben Bildzeile nebeneinander. Ohne sie blieben nur einzelne,
        // abgerissene Striche übrig ("schwebende" graue Striche am Horizont).
        // Darum tragen wir sie in die oberste schon gezeichnete Zeile nach.
        // Liegt das nahe Ende tiefer als diese Zeile, ist es hinter einer
        // Kuppe verdeckt. Dann zählt nur das ferne Ende.
        const vonX = Math.round(nah.y) === maxY ? nah.x : fern.x;
        this.nachtragMerken(besitzer, stueck, Math.min(vonX, fern.x), Math.max(vonX, fern.x), fern.massstab, maxY);
      }
      // Sonst: liegt hinter einer Kuppe und ist verdeckt.
    }
  },

  // Einen Nachtrag (Asphalt in einer schon belegten Zeile) merken. Er gehört zum
  // Stück "besitzer", dem die Zeile gehört, und wird direkt nach dessen Zeilen
  // gezeichnet (sonst würde dessen Gras ihn wieder übermalen).
  nachtragMerken(besitzer, stueck, x1, x2, m, y) {
    if (!this.nachtraege[this.nachAnzahl]) this.nachtraege[this.nachAnzahl] = {};
    const r = this.nachtraege[this.nachAnzahl++];
    r.stueck = stueck; r.x1 = x1; r.x2 = x2; r.m = m; r.y = y;
    besitzer.nachBis = this.nachAnzahl;
  },

  // Die Zeilen eines Strassenstücks zeichnen (siehe strasse()), dazu die
  // Nachträge der ferneren, dünnen Stücke in seiner obersten Zeile.
  strasseStueck(e) {
    if (e.zeileBis > e.zeileVon) this.stueckZeichnen(e, e.zeileVon, e.zeileBis);
    for (let i = e.nachVon; i < e.nachBis; i++) {
      const r = this.nachtraege[i];
      this.asphaltNachtragen(r.stueck, r.x1, r.x2, r.m, r.y);
    }
  },

  // Rechnet für alle Stücke bis zur Sichtweite aus, wo ihr nahes und ihr
  // fernes Ende im Bild liegen, und merkt sich das Gelände dazu.
  // Ergebnis: Anzahl Einträge in this.sichtbar (von nah nach fern).
  stueckeProjizieren(kameraZ, bodenHoehe) {
    const L = CONFIG.STUECK_LAENGE;
    const hoehenOptik = CONFIG.HOEHEN_OPTIK;
    const ersterIndex = Math.floor(kameraZ / L);
    this.talSichtbar = false;
    this.hangSeite[0] = false;
    this.hangSeite[1] = false;
    let hoechstesY = Infinity; // höchste Stelle der Strasse im Bild bisher

    // Kurven: Die Strassenmitte wandert mit jedem Stück weiter zur Seite.
    // "versatz" = wie weit (Meter) die Mitte gerade neben der Blickrichtung
    // liegt, "neigung" = wie viel Versatz pro Meter dazukommt. Jedes Stück
    // ändert die Neigung um seine Krümmung. Aufsummiert ergibt das eine
    // Strasse, die sich zum Horizont hin immer stärker wegbiegt.
    let versatz = 0;
    let neigung = 0;

    for (let n = 0; n < CONFIG.SICHTWEITE; n++) {
      const index = ersterIndex + n;
      const stueck = Road.stueck(index);
      const naechstes = Road.stueck(index + 1);

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

      if (!this.sichtbar[n]) {
        const neu = this.neuerEintrag();
        neu.strasseEintrag = { typ: 'strasse', s: neu, abstand: 0 };
        neu.hangEintrag = { typ: 'hang', s: neu, abstand: 0 };
        this.sichtbar[n] = neu;
      }
      const e = this.sichtbar[n];
      e.n = n;
      e.stueck = stueck;
      e.abstand = abstandVorne;            // kann beim ersten Stück negativ sein
      e.nahZ = Math.max(abstandVorne, 0.1);
      e.fernZ = abstandHinten;
      e.mitteNah = versatzVorne;           // Strassenmitte (Meter seitlich) am nahen ...
      e.mitteFern = versatz;               // ... und am fernen Ende
      e.bodenNah = n === 0 ? bodenHoehe : stueck.y * hoehenOptik; // Höhe der Strasse (fürs Bild verstärkt)
      e.bodenFern = naechstes.y * hoehenOptik;
      this.projizierenIn(e.nah, e.mitteNah, e.bodenNah, e.nahZ);
      this.projizierenIn(e.fern, e.mitteFern, e.bodenFern, e.fernZ);
      // Gelände am nahen Ende (gehört zu diesem Stück) und am fernen Ende
      // (gehört zum nächsten Stück). So passen Nachbarn lückenlos aneinander.
      for (let nr = 0; nr < 2; nr++) {
        e.hangNah[nr] = stueck.hang[nr];
        e.hangFern[nr] = naechstes.hang[nr];
        if (e.hangNah[nr] > 0 || e.hangFern[nr] > 0) this.hangSeite[nr] = true;
        e.talNah[nr] = stueck.tal[nr];
        e.talFern[nr] = naechstes.tal[nr];
        // Unendlich weit weg geht beim Rechnen schief, darum "nur" 10 km
        e.kanteNah[nr] = Math.min(stueck.kante[nr], 10000);
        e.kanteFern[nr] = Math.min(naechstes.kante[nr], 10000);
        if (e.talNah[nr] > 0 || e.talFern[nr] > 0) this.talSichtbar = true;
      }
      // Das hinterste Stück, das noch über allen näheren liegt, ist das
      // letzte sichtbare. Seine Mitte trennt am Horizont die beiden Seiten.
      if (e.fern.y < hoechstesY) {
        hoechstesY = e.fern.y;
        this.fernX = e.fern.x;
        this.fernTal[0] = e.talFern[0] > 0;
        this.fernTal[1] = e.talFern[1] > 0;
      }
    }
    this.anzahlSichtbar = CONFIG.SICHTWEITE;
    this.hangProjizieren(CONFIG.SICHTWEITE);
    return CONFIG.SICHTWEITE;
  },

  // Querschnitt des Hangs für jeden Stückanfang ins Bild umrechnen (nur auf
  // Seiten, wo in diesem Bild ein Hang ist). Platz n = nahes Ende von Stück n,
  // der letzte Platz = fernes Ende des letzten Stücks.
  hangProjizieren(anzahl) {
    const B = CONFIG.BREITE;
    for (let nr = 0; nr < 2; nr++) {
      if (!this.hangSeite[nr]) continue;
      const seite = nr === 0 ? -1 : 1;
      for (let n = 0; n <= anzahl; n++) {
        const ende = n === anzahl;
        const e = this.sichtbar[ende ? n - 1 : n];
        const stueck = ende ? Road.stueck(e.stueck.index + 1) : e.stueck;
        const z = ende ? e.fernZ : e.nahZ;
        const mitte = ende ? e.mitteFern : e.mitteNah;
        const boden = ende ? e.bodenFern : e.bodenNah;
        const m = Road.brennweite / z;
        const U = stueck.hangU[nr], H = stueck.hangH[nr];
        const X = this.hangX[n][nr], Y = this.hangY[n][nr];
        for (let j = 0; j < U.length; j++) {
          X[j] = B / 2 + (mitte + seite * U[j] - this.kameraX) * m;
          Y[j] = this.horizont + (this.kameraY - boden - H[j]) * m;
        }
        // Verlängerung: vom letzten Punkt waagrecht bis über den Bildrand hinaus
        // (gleiche Höhe = in der Welt eine waagrechte Linie, im Bild auch)
        const letzter = U.length - 1;
        X[letzter + 1] = seite < 0 ? Math.min(X[letzter], -2) : Math.max(X[letzter], B + 2);
        Y[letzter + 1] = Y[letzter];
      }
    }
  },

  neuerEintrag() {
    return {
      n: 0, stueck: null, abstand: 0, nahZ: 0, fernZ: 0, mitteNah: 0, mitteFern: 0,
      bodenNah: 0, bodenFern: 0, clip: 0,
      zeileVon: 0, zeileBis: 0, nachVon: 0, nachBis: 0, // Bildzeilen der Strasse, Nachträge (siehe strasse())
      kanteVon: [0, 0], kanteBis: [0, 0], // Bildspalten der Waldkante [links, rechts]
      strasseEintrag: null, hangEintrag: null, // wiederverwendete Einträge für objekteVorbereiten
      nah: { x: 0, y: 0, massstab: 0 }, fern: { x: 0, y: 0, massstab: 0 },
      // [links, rechts]
      hangNah: [0, 0], hangFern: [0, 0], talNah: [0, 0], talFern: [0, 0],
      kanteNah: [0, 0], kanteFern: [0, 0],
    };
  },

  // Wie Road.projiziere, schreibt aber in ein vorhandenes Objekt p
  // (x, y im Bild und massstab = Pixel pro Meter an dieser Stelle).
  projizierenIn(p, weltX, weltY, abstand) {
    const m = Road.brennweite / abstand;
    p.x = CONFIG.BREITE / 2 + (weltX - this.kameraX) * m;
    p.y = this.horizont + (this.kameraY - weltY) * m;
    p.massstab = m;
  },

  // x im Bild der Abbruchkante zum Tal (nr: 0 = links, 1 = rechts) auf
  // Bildzeile y. Wie die Strassenmitte zwischen nahem und fernem Ende gemischt.
  kanteBei(e, nr, y) {
    const seite = nr === 0 ? -1 : 1;
    const a = this.anteilBei(e.nah, e.fern, y);
    const xNah = e.nah.x + seite * e.kanteNah[nr] * e.nah.massstab;
    const xFern = e.fern.x + seite * e.kanteFern[nr] * e.fern.massstab;
    return xFern + (xNah - xFern) * a;
  },

  // Ein Strassenstück Zeile für Zeile zeichnen. Pro Zeile werden Mitte
  // und Massstab zwischen dem nahen und dem fernen Ende "gemischt".
  // Neben dem Bankett: Gras, und auf der Talseite hört das Gras an der
  // Abbruchkante auf (dahinter sieht man das Tal, das schon vorher gezeichnet
  // wurde). Der Hang kommt später darüber (siehe hangZeichnen).
  stueckZeichnen(e, oben, unten) {
    const f = CONFIG.FARBEN;
    const stueck = e.stueck;
    const nah = e.nah;
    const fern = e.fern;
    const hell = stueck.hell;
    const strasse = CONFIG.STRASSE_HALBE_BREITE;
    const bankett = strasse + CONFIG.BANKETT_BREITE;
    const linie = CONFIG.MITTELLINIE_BREITE / 2;
    // Gibt es auf dieser Seite eine Abbruchkante (am nahen oder fernen Ende)?
    const talL = e.talNah[0] > 0 || e.talFern[0] > 0;
    const talR = e.talNah[1] > 0 || e.talFern[1] > 0;

    for (let y = oben; y < unten; y++) {
      const m = fern.massstab + (nah.massstab - fern.massstab) * this.anteilBei(nah, fern, y + 0.5);
      // Wo liegt die Strassenmitte am oberen und am unteren Rand dieser
      // Bildzeile? In engen Kurven können das mehrere Pixel Unterschied sein.
      // Wir zeichnen die Zeile über die ganze Spanne, sonst entstehen Lücken
      // und Treppen zwischen den Zeilen.
      const m1 = this.mitteBei(nah, fern, y);
      const m2 = this.mitteBei(nah, fern, y + 1);
      const links = Math.min(m1, m2);
      const rechts = Math.max(m1, m2);

      // Gras, auf der Talseite nur bis zur Abbruchkante (dort ein Streifen Erde)
      let grasL = 0;
      let grasR = CONFIG.BREITE;
      if (talL) grasL = Math.min(this.kanteBei(e, 0, y), this.kanteBei(e, 0, y + 1));
      if (talR) grasR = Math.max(this.kanteBei(e, 1, y), this.kanteBei(e, 1, y + 1));
      // Liegt in dieser Zeile Hang oder Talboden näher als dieses Stück
      // (die Strasse ist weiter vorne tiefer hinunter gefahren als der
      // Talboden), dann bleibt er sichtbar: Das Gras hört davor auf.
      let kanteL = talL;
      let kanteR = talR;
      // (Erst ab zwei Stücken Unterschied: Der eigene Hang beginnt ja auch
      // in dieser Zeile und soll natürlich nicht zählen.)
      if (this.talSichtbar) {
        const z = Road.brennweite / m - 2 * CONFIG.STUECK_LAENGE;
        if (this.bodenZ[0][y] < z && this.bodenX[0][y] > grasL) { grasL = this.bodenX[0][y]; kanteL = false; }
        if (this.bodenZ[1][y] < z && this.bodenX[1][y] < grasR) { grasR = this.bodenX[1][y]; kanteR = false; }
      }
      this.zeile(grasL, grasR, y, hell ? f.GRAS_HELL : f.GRAS_DUNKEL);
      const erde = Math.max(1, 0.4 * m);
      if (kanteL) this.zeile(grasL, grasL + erde, y, f.TAL_KANTE);
      if (kanteR) this.zeile(grasR - erde, grasR, y, f.TAL_KANTE);
      // Bankett zuerst über die ganze Breite, dann den Asphalt darüber.
      // Übrig bleibt links und rechts ein schmaler Erdstreifen.
      this.zeile(links - bankett * m, rechts + bankett * m, y, hell ? f.BANKETT_HELL : f.BANKETT_DUNKEL);
      this.zeile(links - strasse * m, rechts + strasse * m, y, hell ? f.ASPHALT_HELL : f.ASPHALT_DUNKEL);
      // Mittellinie nur, wo die Strasse breit genug ist. Ganz hinten wäre
      // sie nur noch ein einzelner weisser Punkt, der in der Luft zu hängen scheint.
      if (hell && 2 * strasse * m >= CONFIG.MITTELLINIE_AB_PIXEL) {
        this.zeile(links - linie * m, rechts + linie * m, y, f.MITTELLINIE, true);
      }
    }
  },

  // Wo zwischen fernem (0) und nahem Ende (1) eines Stücks liegt die
  // Bildhöhe y? Begrenzt, weil bei ganz flachen Stücken sonst Unsinn herauskommt.
  anteilBei(nah, fern, y) {
    const hoehe = nah.y - fern.y;
    return hoehe > 1e-6 ? Math.min(Math.max((y - fern.y) / hoehe, 0), 1) : 0;
  },

  // Strassenmitte (x im Bild) eines Stücks auf der Bildhöhe y
  mitteBei(nah, fern, y) {
    return fern.x + (nah.x - fern.x) * this.anteilBei(nah, fern, y);
  },

  // Einen Teil eines Stücks in eine schon gezeichnete Bildzeile y
  // nachtragen, wenn die Strassenmitte dort von x1 bis x2 läuft. Nur der
  // Asphalt, ohne Gras (das Gras der Zeile ist schon da und würde sonst die
  // Strasse daneben übermalen). Das Bankett lassen wir weg: So weit hinten
  // ist es schmaler als ein Pixel und gäbe nur braune Sprenkel im Asphalt.
  asphaltNachtragen(stueck, x1, x2, m, y) {
    const f = CONFIG.FARBEN;
    const strasse = CONFIG.STRASSE_HALBE_BREITE;
    this.zeile(x1 - strasse * m, x2 + strasse * m, y, stueck.hell ? f.ASPHALT_HELL : f.ASPHALT_DUNKEL);
  },

  // Eine waagrechte Linie auf ganze Pixel gerundet.
  // mindestensEinPixel: dünne Linien (Mittellinie) sollen hinten nicht verschwinden.
  zeile(x1, x2, y, farbe, mindestensEinPixel) {
    let a = Math.round(x1);
    let b = Math.round(x2);
    if (mindestensEinPixel && b <= a) b = a + 1;
    // Auf das Bild beschränken (Kanten weit draussen ergeben riesige Zahlen)
    a = Math.max(a, 0);
    b = Math.min(b, CONFIG.BREITE);
    if (b <= a) return;
    this.ctx.fillStyle = farbe;
    this.ctx.fillRect(a, y, b - a, 1);
  },

  // --- Objekte am Strassenrand (Bäume, Felsen, Schilder ...) ---
  // Rechnet für alle sichtbaren Objekte aus, wo und wie gross sie im Bild
  // sind. Ergebnis: Liste von nah nach fern (wird rückwärts gezeichnet).
  // Höchstens MAX_OBJEKTE Bilder, die nächsten zuerst: Fällt etwas weg,
  // dann ganz hinten, wo es kaum auffällt.
  // Dazwischen stehen Einträge für Strasse, Hang und Bänder (Leitplanke, Zaun)
  // des jeweiligen Stücks, damit auch sie richtig von fern nach nah gezeichnet werden.
  objekteVorbereiten() {
    const liste = [];
    const B = CONFIG.BREITE;
    const rand = CONFIG.STRASSE_HALBE_BREITE + CONFIG.BANKETT_BREITE;
    const ebene = this.ebene;
    let bilder = 0;
    this.waldkanteVorbereiten();
    for (let n = 0; n < this.anzahlSichtbar; n++) {
      const s = this.sichtbar[n];
      if (s.clip <= 0) break; // ab hier ist alles verdeckt
      const st = s.stueck;
      // Alles, was auf diesem Stück steht, kommt zuerst in "ebene" und wird
      // nach dem Abstand zur Strassenmitte sortiert ("tiefe"): Was weiter
      // draussen steht, wird zuerst gezeichnet und vom Näheren verdeckt.
      ebene.length = 0;
      if (s.abstand >= CONFIG.OBJEKT_MIN_ENTFERNUNG && bilder < CONFIG.MAX_OBJEKTE) {
        // Gleiche Perspektive wie die Strasse: massstab = Pixel pro Meter
        const massstab = Road.brennweite / s.abstand;
        // Normale Objekte und die auf dem Hang (die stehen höher: o.boden)
        for (let k = 0; k < 2 && bilder < CONFIG.MAX_OBJEKTE; k++) for (const o of (k === 0 ? st.objekte : st.hangObjekte)) {
          if (o.unsichtbar) continue; // Bänder und Hang werden eigens gezeichnet
          const bodenY = this.horizont + (this.kameraY - s.bodenNah - o.boden) * massstab;
          const hoehe = o.hoehe * massstab;
          if (hoehe < CONFIG.OBJEKT_MIN_PIXEL) continue; // winzig, weglassen
          const breite = o.breite * massstab;
          const ankerX = B / 2 + (s.mitteNah + o.x - this.kameraX) * massstab;
          // 'innen': die strassenseitige Kante steht am Anker, das Bild geht nach aussen
          let links = ankerX - breite / 2;
          if (o.anker === 'innen') links = o.seite > 0 ? ankerX : ankerX - breite;
          // Auf ganze Pixel runden (scharfe Kanten)
          const x = Math.round(links);
          const y = Math.round(bodenY - hoehe);
          const w = Math.max(1, Math.round(links + breite) - x);
          const h = Math.max(1, Math.round(bodenY) - y);
          if (x >= B || x + w <= 0 || y >= CONFIG.HOEHE) continue; // neben dem Bild
          // Hinter einer Kuppe: nur den Teil über der Clip-Linie zeigen. Was auf
          // Hang oder Flanke steht (boden > 0), nicht abschneiden: Es liegt höher
          // als die Strasse, und was davor liegt, wird ohnehin später darüber gezeichnet.
          const sichtbarH = o.boden > 0 ? h : Math.min(h, s.clip - y);
          if (sichtbarH <= 0) continue;
          ebene.push({ o: o, x: x, y: y, w: w, h: h, sichtbarH: sichtbarH, abstand: s.abstand, tiefe: Math.abs(o.x) });
          if (++bilder >= CONFIG.MAX_OBJEKTE) break;
        }
      }
      // Bänder: Was genau gleich weit draussen steht wie das Band, steht dahinter
      for (let nr = 0; nr < 2; nr++) {
        for (const name of st.baender[nr]) {
          const tiefe = rand + CONFIG.BAENDER[name].abstand - 0.001;
          ebene.push({ typ: 'band', s: s, nr: nr, band: CONFIG.BAENDER[name], abstand: s.abstand, tiefe: tiefe });
        }
      }
      // Innen zuerst in die Liste: Rückwärts gezeichnet kommt dann aussen zuerst
      if (ebene.length > 1) ebene.sort((a, b) => a.tiefe - b.tiefe);
      for (const eintrag of ebene) liste.push(eintrag);
      // Der Hang liegt hinter allem auf diesem Stück: als Letztes in die
      // Liste, also als Erstes gezeichnet. (Auch wenn der Hang erst ein paar
      // Stücke weiter beginnt: In der Ferne zeichnet ein Stück den Hang für
      // seinen ganzen Farbstreifen, siehe hangZeichnen.)
      if (this.hangInDerNaehe(st.index)) {
        s.hangEintrag.abstand = s.abstand;
        liste.push(s.hangEintrag);
      }
      // Die Strasse dieses Stücks liegt unter allem: als Erstes gezeichnet
      liste.push(s.strasseEintrag);
    }
    this.objekteGezeichnet = bilder;
    return liste;
  },

  // Objekte zeichnen, von fern nach nah (die Liste ist nah nach fern, darum rückwärts).
  // hinterAuto: true = nur die hinter dem Auto, false = nur die davor.
  objekteZeichnen(liste, hinterAuto) {
    for (let i = liste.length - 1; i >= 0; i--) {
      const e = liste[i];
      // Die Strasse kommt immer vor dem Auto (es fährt ja darauf)
      if (e.typ === 'strasse') {
        if (hinterAuto) this.strasseStueck(e.s);
        continue;
      }
      if ((e.abstand >= Road.autoAbstand) !== hinterAuto) continue;
      if (e.typ === 'hang') {
        this.hangZeichnen(e.s);
        continue;
      }
      if (e.typ === 'band') {
        this.bandZeichnen(e.s, e.nr, e.band);
        continue;
      }
      const bilder = Sprites.bilder[e.o.name][e.o.variante];
      const bild = e.o.gespiegelt ? bilder.gespiegelt : bilder.normal;
      // Beim Abschneiden nur den oberen Teil des Bilds nehmen. Die Leinwand
      // hat die Glättung aus, darum bleiben die Pixel auch vergrössert scharf.
      const quellH = bild.height * e.sichtbarH / e.h;
      this.ctx.drawImage(bild, 0, 0, bild.width, quellH, e.x, e.y, e.w, e.sichtbarH);
    }
  },

  // --- Hang (Bergseite) ---
  // Der Hang besteht aus mehreren Flächenbändern von der Strasse nach aussen
  // und oben (Querschnitt aus HANG_PROFIL, siehe Scenery.hangQuerschnitt):
  // Fels, Böschung, Kamm und dahinter die Bergflanke. Der letzte Punkt wird
  // waagrecht bis an den Bildrand verlängert, darum gibt es auf der Hangseite
  // kein "dahinter" mehr.
  // Jedes Band wird wie die Strasse gezeichnet: pro Strassenstück ein
  // Viereck vom Querschnitt am nahen Ende zum Querschnitt am fernen Ende.
  // Das nächste Stück beginnt genau an diesen Ecken. Weil nähere Stücke
  // (auch ihre Strasse) später gezeichnet werden, verdecken sie alles
  // dahinter. Darum braucht der Hang keine Clip-Linie: Über einer Kuppe
  // bleibt er sichtbar, darunter malt die nähere Strasse ihn zu.
  // In der Ferne wird gespart: ab HANG_GRUPPE_AB ein Viereck pro Farbstreifen
  // (4 Stücke) statt pro Stück, ab HANG_DETAIL_BIS ohne Schichten, Risse und
  // Gras, ab HANG_EINFACH_AB unten nur noch 2 Bänder (Fels und Böschung).
  hangZeichnen(e) {
    const f = CONFIG.FARBEN;
    const n = e.n;
    const st = e.stueck;
    const k = this.hangEinheit(n);
    const flanke = this.flankeEinheit(n); // setzt this.flankeA / this.flankeB
    if (k === 0 && !flanke) return;
    const fa = this.flankeA, fb = this.flankeB;
    const H = CONFIG.HOEHE;
    const dunkel = st.hell ? 0 : 1;
    const p = Scenery.hangPunktNr;
    const flaechen = Scenery.hangFlaechen;
    const letzter = Scenery.hangPunkte - 1;
    const kamm = CONFIG.HANG_KAMM;
    const flankeFarben = f.HANG_FLANKE[st.hangUmgebung] || f.HANG_FLANKE.wald;
    // Farbe von Band b (zwischen Punkt b-1 und b): bis zum Kamm aus HANG_BAENDER,
    // dahinter die Flanke je nach Umgebung
    const farbe = (b) => (b <= kamm ? f.HANG_BAENDER[b][dunkel] :
      flankeFarben[Math.min(b - kamm - 1, flankeFarben.length - 1)][dunkel]);
    for (let nr = 0; nr < 2; nr++) {
      // Flanke (alles hinter dem Kamm) und Verlängerung bis zum Bildrand,
      // von Querschnitt fa bis fb. Von aussen nach innen.
      if (flanke && this.hangDaVonBis(fa, fb, nr)) {
        const xa = this.hangX[fa][nr], ya = this.hangY[fa][nr];
        const xb = this.hangX[fb][nr], yb = this.hangY[fb][nr];
        const band = (i, j, farbe) => this.flaeche(farbe,
          xa[i], ya[i], xa[j], ya[j], xb[j], yb[j], xb[i], yb[i], H, false);
        band(letzter, letzter + 1, farbe(p.length - 1));
        if (this.sichtbar[fa].nahZ > CONFIG.HANG_DETAIL_BIS) {
          // In der Ferne: Rückseite des Grats, dann die ganze Flanke vom Kamm bis
          // zum Grat in einem Band (den Knick dazwischen sieht man dort nicht)
          const grat = CONFIG.HANG_GRAT;
          for (let b = p.length - 1; b > grat; b--) band(p[b - 1], p[b], farbe(b));
          band(p[kamm], p[grat], farbe(grat));
        } else {
          for (let b = p.length - 1; b > kamm; b--) band(p[b - 1], p[b], farbe(b));
        }
        if (this.sichtbar[fa].nahZ <= CONFIG.HANG_FLECKEN_BIS) this.flankeFlecken(nr, fa, fb);
        this.waldkanteZeichnen(e, nr, fa, fb);
      }
      if (k === 0 || !this.hangDa(n, k, nr)) continue;
      // Fels, Böschung und Kamm, von Querschnitt n bis n + k
      const xa = this.hangX[n][nr], ya = this.hangY[n][nr];
      const xb = this.hangX[n + k][nr], yb = this.hangY[n + k][nr];
      // Ein Band zwischen Punkt i und j des Querschnitts als Viereck
      const band = (i, j, farbe) => this.flaeche(farbe,
        xa[i], ya[i], xa[j], ya[j], xb[j], yb[j], xb[i], yb[i], H, false);
      // Von aussen nach innen: Liegt ein inneres Band im Bild vor einem
      // äusseren (z. B. Fels vor der Böschung), verdeckt es dieses richtig.
      if (e.nahZ > CONFIG.HANG_EINFACH_AB) {
        band(p[2], p[kamm], farbe(3));
        band(p[0], p[2], farbe(1));
      } else if (e.nahZ > CONFIG.HANG_DETAIL_BIS) {
        for (let b = kamm; b >= 0; b--) band(b === 0 ? 0 : p[b - 1], p[b], farbe(b));
      } else {
        for (let j = p[kamm] - 1; j >= 0; j--) {
          const fl = flaechen[j];
          band(j, j + 1, fl.schicht >= 0 ? f.HANG_SCHICHTEN[fl.schicht][dunkel] : farbe(fl.band));
        }
        if (k === 1) this.hangDetails(e, nr, H);
      }
    }
  },

  // Die Flanke wird auch in der Nähe nur pro Farbstreifen (4 Stücke = 8 m) als
  // ein Viereck gezeichnet: Sie ist hoch und braucht als dünner Streifen pro
  // 2-m-Stück sehr viele Zeichenbefehle, sieht aber gleich aus. Gezeichnet wird
  // sie vom fernsten Stück des Streifens, also bevor die Bäume der näheren Stücke
  // kommen (ein Baum auf der Böschung ragt im Bild in die Flanke dahinter, nie in
  // die davor). In der Ferne gilt dieselbe Einteilung wie beim übrigen Hang.
  // Zeichnet Stück n eine Flanke? Wenn ja: this.flankeA / this.flankeB = von welchem
  // bis zu welchem Querschnitt (Platz in hangX / hangY).
  // Ab HANG_EINFACH_AB werden je zwei Farbstreifen (16 m) zusammengefasst.
  flankeEinheit(n) {
    const e = this.sichtbar[n];
    const S = CONFIG.STREIFEN_LAENGE;
    if (e.nahZ > CONFIG.HANG_GRUPPE_AB) {
      const i = e.stueck.index;
      const vor = n > 0 ? this.sichtbar[n - 1] : null;
      // Mitten im Streifen: gehört zur Gruppe des näheren Stücks davor
      if (i % S !== 0 && vor && vor.nahZ > CONFIG.HANG_GRUPPE_AB) return false;
      const G = e.nahZ > CONFIG.HANG_EINFACH_AB ? 2 * S : S;
      if (i % G !== 0 && vor && vor.nahZ > CONFIG.HANG_EINFACH_AB) return false;
      this.flankeA = n;
      this.flankeB = Math.min(n + G - i % G, this.anzahlSichtbar);
      return true;
    }
    const imStreifen = e.stueck.index % CONFIG.STREIFEN_LAENGE;
    const naechstesFern = n + 1 >= this.anzahlSichtbar || this.sichtbar[n + 1].nahZ > CONFIG.HANG_GRUPPE_AB;
    if (imStreifen !== CONFIG.STREIFEN_LAENGE - 1 && !naechstesFern) return false;
    this.flankeA = Math.max(n - imStreifen, 0);
    this.flankeB = n + 1;
    return true;
  },

  // Wie viele Stücke zeichnet Stück n beim Hang? Nah: nur sich selbst (1). Fern:
  // den Rest seines Farbstreifens. Die ferneren Stücke im selben Streifen
  // zeichnen dann nichts (0); das nächste Stück des Streifens kommt zuletzt dran.
  hangEinheit(n) {
    const e = this.sichtbar[n];
    if (e.nahZ <= CONFIG.HANG_GRUPPE_AB) return 1;
    const imStreifen = e.stueck.index % CONFIG.STREIFEN_LAENGE;
    if (imStreifen !== 0 && n > 0 && this.sichtbar[n - 1].nahZ > CONFIG.HANG_GRUPPE_AB) return 0;
    return Math.min(CONFIG.STREIFEN_LAENGE - imStreifen, this.anzahlSichtbar - n);
  },

  // Gibt es auf Seite nr im Bereich von Stück n bis n + k überhaupt einen Hang?
  hangDa(n, k, nr) {
    const i = this.sichtbar[n].stueck.index;
    for (let j = 0; j <= k; j++) if (Road.stueck(i + j).hang[nr] > 0) return true;
    return false;
  },

  // Dasselbe für die Querschnitte a bis b
  hangDaVonBis(a, b, nr) {
    return this.hangDa(a, b - a, nr);
  },

  // Grüne Flecken auf der oberen Flanke (nur Umgebung fels), je Stück höchstens
  // einer (Scenery: flankeFleck). Gerechnet direkt mit den Bildpunkten des
  // Querschnitts (zwischen P5 und P6, und entlang der Strasse zwischen nahem und
  // fernem Ende): einfach und schnell, und bei so kleinen Flecken genau genug.
  flankeFlecken(nr, a, b) {
    const p = Scenery.hangPunktNr;
    const i = p[CONFIG.HANG_GRAT - 1], j = p[CONFIG.HANG_GRAT];
    const xa = this.hangX[a][nr], ya = this.hangY[a][nr];
    const xb = this.hangX[b][nr], yb = this.hangY[b][nr];
    const pt = this.fleckPunkte;
    const k = b - a;
    const index = this.sichtbar[a].stueck.index;
    for (let s = 0; s < k; s++) {
      const st = Road.stueck(index + s);
      if (!st.flankeFleck || st.hangUmgebung !== 'fels' || st.hang[nr] < 0.5) continue;
      const [hVon, hBis] = st.flankeFleck;
      let q = 0;
      for (const [h, t] of [[hVon, 0.15], [hBis, 0.15], [hBis, 0.85], [hVon, 0.85]]) {
        const anteil = (s + t) / k; // Lage entlang der Gruppe (0 = nahes, 1 = fernes Ende)
        const xN = xa[i] + (xa[j] - xa[i]) * h, yN = ya[i] + (ya[j] - ya[i]) * h;
        const xF = xb[i] + (xb[j] - xb[i]) * h, yF = yb[i] + (yb[j] - yb[i]) * h;
        pt[q++] = xN + (xF - xN) * anteil;
        pt[q++] = yN + (yF - yN) * anteil;
      }
      this.flaeche(CONFIG.FARBEN.HANG_FLANKE_FLECK, pt[0], pt[1], pt[2], pt[3], pt[4], pt[5], pt[6], pt[7], CONFIG.HOEHE, true);
    }
  },

  // --- Waldkante ---
  // Oben auf der Flanke eine gezackte Reihe Tannenspitzen (wald, lichtung) bzw.
  // eine felsige Kante (fels). Zu sehen ist davon nur die oberste Kante des
  // ganzen Bergs; die Kanten der anderen Stücke liegen unter näheren Flächen.
  // Darum wird zuerst (vor dem Zeichnen) für jede Bildspalte ausgerechnet,
  // welches Stück die oberste Kante bildet. Nur dieses Stück zeichnet dort eine
  // Zacke, und zwar gleich nach seinen Hang-Flächen (dann verdeckt alles, was
  // näher liegt, die Zacke richtig).
  waldkanteVorbereiten() {
    const B = CONFIG.BREITE;
    const L = CONFIG.STUECK_LAENGE;
    const grat = Scenery.hangPunktNr[CONFIG.HANG_GRAT];
    const rand = Scenery.hangPunkte; // Platz der Verlängerung bis zum Bildrand
    for (let nr = 0; nr < 2; nr++) {
      if (!this.hangSeite[nr]) continue;
      const Y = this.kanteY[nr], N = this.kanteN[nr], A = this.kanteA[nr], M = this.kanteM[nr];
      Y.fill(Infinity);
      N.fill(-1);
      for (let n = 0; n < this.anzahlSichtbar; n++) {
        const e = this.sichtbar[n];
        if (e.clip <= 0) break; // ab hier zeichnet objekteVorbereiten nichts mehr
        e.kanteVon[nr] = 0;
        e.kanteBis[nr] = 0;
        // (Auch Stücke weiter weg als WALDKANTE_BIS zählen hier mit: Sie bilden
        // die Kante dort, haben nur keine Zacken.) Gleiche Einteilung wie beim
        // Zeichnen der Flanke: Querschnitt fa bis fb, gezeichnet von Stück n.
        if (!this.flankeEinheit(n)) continue;
        const fa = this.flankeA, fb = this.flankeB, k = fb - fa;
        if (!this.hangDaVonBis(fa, fb, nr)) continue;
        const nah = this.sichtbar[fa], fern = this.sichtbar[fb - 1];
        const mN = Road.brennweite / nah.nahZ, mF = Road.brennweite / fern.fernZ;
        let von = B, bis = 0;
        // Oberkante am nahen und am fernen Ende: Grat, Rückseite, waagrecht bis
        // zum Bildrand. Lage in der Welt = Meter seitlich ab Strassenmitte.
        for (let ende = 0; ende < 2; ende++) {
          const X = this.hangX[ende ? fb : fa][nr], Yq = this.hangY[ende ? fb : fa][nr];
          const m = ende ? mF : mN;
          const mitte = ende ? fern.mitteFern : nah.mitteNah;
          for (let j = grat; j < rand; j++) {
            const x1 = X[j], x2 = X[j + 1];
            const a = Math.max(Math.floor(Math.min(x1, x2)), 0);
            const b = Math.min(Math.ceil(Math.max(x1, x2)), B);
            for (let x = a; x < b; x++) {
              const xm = x + 0.5;
              if ((xm - x1) * (xm - x2) > 0) continue;
              const y = Yq[j] + (Yq[j + 1] - Yq[j]) * (xm - x1) / (x2 - x1 || 1);
              if (y < Y[x]) {
                Y[x] = y; N[x] = n; M[x] = m;
                A[x] = Math.abs((xm - B / 2) / m + this.kameraX - mitte);
              }
            }
            von = Math.min(von, a);
            bis = Math.max(bis, b);
          }
        }
        // Grat zwischen nahem und fernem Ende. Lage in der Welt = Meter entlang der Strasse
        const xn = this.hangX[fa][nr][grat], yn = this.hangY[fa][nr][grat];
        const xf = this.hangX[fb][nr][grat], yf = this.hangY[fb][nr][grat];
        const a = Math.max(Math.floor(Math.min(xn, xf)), 0);
        const b = Math.min(Math.ceil(Math.max(xn, xf)), B);
        for (let x = a; x < b; x++) {
          const xm = x + 0.5;
          if ((xm - xn) * (xm - xf) > 0) continue;
          const t = (xm - xn) / (xf - xn || 1);
          const y = yn + (yf - yn) * t;
          // Gleich hoch: das nähere Stück gewinnt (es wird später gezeichnet)
          if (y < Y[x]) {
            Y[x] = y; N[x] = n; M[x] = mN + (mF - mN) * t;
            A[x] = 1000 + (nah.stueck.index + t * k) * L;
          }
        }
        e.kanteVon[nr] = Math.min(von, a);
        e.kanteBis[nr] = Math.max(bis, b);
      }
    }
  },

  // Die Zacken der Waldkante für die Spalten, deren oberste Kante Stück e bildet
  // (siehe waldkanteVorbereiten). Jede Zacke hat einen festen Platz in der Welt
  // und eine feste, zufällige Höhe, darum flimmert beim Fahren nichts.
  // Am Keilende (Hang erst wenig gewachsen) werden die Zacken kleiner.
  waldkanteZeichnen(e, nr, a, b) {
    const art = e.stueck.hangUmgebung;
    const tanne = art === 'wald' || art === 'lichtung';
    if ((!tanne && art !== 'fels') || e.nahZ > CONFIG.WALDKANTE_BIS || e.kanteBis[nr] <= e.kanteVon[nr]) return;
    let wachstum = 0;
    const index = this.sichtbar[a].stueck.index;
    for (let j = 0; j <= b - a; j++) wachstum = Math.max(wachstum, Road.stueck(index + j).hang[nr]);
    const hoehe = (tanne ? CONFIG.WALDKANTE_BAUM_HOEHE : CONFIG.WALDKANTE_FELS_HOEHE) * Math.min(1, wachstum / 0.3);
    const abstand = tanne ? CONFIG.WALDKANTE_BAUM_ABSTAND : CONFIG.WALDKANTE_FELS_ABSTAND;
    const Y = this.kanteY[nr], N = this.kanteN[nr], A = this.kanteA[nr], M = this.kanteM[nr];
    this.ctx.fillStyle = tanne ? CONFIG.FARBEN.WALDKANTE_TANNE : CONFIG.FARBEN.WALDKANTE_FELS;
    for (let x = e.kanteVon[nr]; x < e.kanteBis[nr]; x++) {
      if (N[x] !== e.n) continue;
      const y = Math.round(Y[x]);
      if (y <= 0) continue; // Kante oben aus dem Bild
      const pos = A[x] / abstand;
      const i = Math.floor(pos);
      const t = pos - i;
      let h;
      if (tanne) {
        // Spitze Tanne: Dreieck, in der Mitte am höchsten
        h = hoehe * (0.55 + 0.45 * this.kanteZufall(i)) * (1 - Math.abs(2 * t - 1));
      } else {
        // Felskante: unregelmässig auf und ab, gerade Stücke zwischen zufälligen Höhen
        const h1 = this.kanteZufall(i), h2 = this.kanteZufall(i + 1);
        h = hoehe * (0.15 + 0.85 * (h1 + (h2 - h1) * t));
      }
      const hp = Math.round(h * M[x]);
      if (hp >= 1) this.ctx.fillRect(x, y - hp, 1, hp);
    }
  },

  // Feste Zufallszahl (0 bis 1) für die Zacke Nummer i: gleiche Nummer, gleiche Zahl
  kanteZufall(i) {
    let t = Math.imul(i ^ 0x5bd1e995, 0x27d4eb2d);
    t ^= t >>> 15;
    t = Math.imul(t, 0x85ebca6b);
    t ^= t >>> 13;
    return (t >>> 0) / 4294967296;
  },

  // Risse und Grasflecken im Fels (nur in der Nähe). Beides sind kleine
  // Vierecke, die auf der Hangfläche liegen.
  hangDetails(e, nr, clip) {
    const f = CONFIG.FARBEN;
    const st = e.stueck;
    const naechstes = Road.stueck(st.index + 1);
    const p = Scenery.hangPunktNr;
    if (st.hangRiss && st.hang[nr] > 0.5) {
      // Dunkler Riss, der ein Stück den Fels hinaufläuft (P0 bis P2),
      // in der Mitte leicht versetzt, damit er nicht wie ein Lineal aussieht
      const [von, bis] = st.hangRiss;
      const mitte = (von + bis) / 2;
      this.hangFleck(e, nr, p[0], p[2], von, mitte, 0.3, 0.37, f.HANG_RISS, clip);
      this.hangFleck(e, nr, p[0], p[2], mitte, bis, 0.37, 0.44, f.HANG_RISS, clip);
    }
    if (st.hangGras >= 0 && st.hang[nr] > 0.5 && naechstes.hang[nr] > 0.5) {
      // Grasfleck im helleren Gestein (P1 bis P2)
      this.hangFleck(e, nr, p[1], p[2], st.hangGras, st.hangGras + 0.14, 0.15, 0.8, f.HANG_GRAS, clip);
    }
  },

  // Kleines Viereck auf der Hangfläche zwischen Querschnitt-Punkt i und j
  // (Höhe hVon bis hBis als Anteil dazwischen) und entlang der Strasse von
  // zVon bis zBis (Anteil der Stücklänge). Mindestens 1 Pixel breit.
  hangFleck(e, nr, i, j, hVon, hBis, zVon, zBis, farbe, clip) {
    const st = e.stueck;
    const naechstes = Road.stueck(st.index + 1);
    const seite = nr === 0 ? -1 : 1;
    const B = CONFIG.BREITE;
    const pt = this.fleckPunkte;
    let k = 0;
    // Die vier Ecken der Reihe nach (rundherum)
    for (const [h, z] of [[hVon, zVon], [hBis, zVon], [hBis, zBis], [hVon, zBis]]) {
      // Ort auf dem Querschnitt am nahen und am fernen Ende, dazwischen gemischt
      const ort = (s) => {
        const U = s.hangU[nr], H = s.hangH[nr];
        return [U[i] + (U[j] - U[i]) * h, H[i] + (H[j] - H[i]) * h];
      };
      const [uN, hN] = ort(st);
      const [uF, hF] = ort(naechstes);
      const tiefe = e.nahZ + (e.fernZ - e.nahZ) * z;
      const m = Road.brennweite / tiefe;
      const mitte = e.mitteNah + (e.mitteFern - e.mitteNah) * z;
      const boden = e.bodenNah + (e.bodenFern - e.bodenNah) * z;
      pt[k++] = B / 2 + (mitte + seite * (uN + (uF - uN) * z) - this.kameraX) * m;
      pt[k++] = this.horizont + (this.kameraY - boden - (hN + (hF - hN) * z)) * m;
    }
    this.flaeche(farbe, pt[0], pt[1], pt[2], pt[3], pt[4], pt[5], pt[6], pt[7], clip, true);
  },

  // Ein Viereck (4 Bildpunkte, rundherum der Reihe nach) Zeile für Zeile
  // füllen, nur oberhalb der Bildzeile "clip" (hinter Kuppen verdeckt).
  // Gleiche Regel wie viereck() beim Tal: Pro Zeile zählt ihre Mitte, darum
  // teilen sich zwei Vierecke mit gemeinsamer Kante die Pixel genau.
  // mindestensEinPixel: schmale Dinge (Risse) sollen nicht verschwinden.
  flaeche(farbe, x1, y1, x2, y2, x3, y3, x4, y4, clip, mindestensEinPixel) {
    const xs = this.viereckX;
    const ys = this.viereckY;
    xs[0] = x1; xs[1] = x2; xs[2] = x3; xs[3] = x4;
    ys[0] = y1; ys[1] = y2; ys[2] = y3; ys[3] = y4;
    const von = Math.max(Math.round(Math.min(y1, y2, y3, y4)), 0);
    const bis = Math.min(Math.round(Math.max(y1, y2, y3, y4)), clip);
    if (bis <= von) return;
    const B = CONFIG.BREITE;
    // Farbe nur einmal setzen: Das ist im Browser viel teurer als ein fillRect
    this.ctx.fillStyle = farbe;
    for (let y = von; y < bis; y++) {
      const ym = y + 0.5;
      let links = Infinity;
      let rechts = -Infinity;
      for (let k = 0; k < 4; k++) {
        // Kante von Punkt k zu Punkt k+1; immer von oben nach unten rechnen,
        // damit Nachbarvierecke für dieselbe Kante genau dasselbe herausbekommen
        let xa = xs[k], ya = ys[k], xb = xs[(k + 1) % 4], yb = ys[(k + 1) % 4];
        if (ya > yb) { const tx = xa; xa = xb; xb = tx; const ty = ya; ya = yb; yb = ty; }
        if (ym < ya || ym >= yb) continue;
        const x = xa + (xb - xa) * (ym - ya) / (yb - ya);
        if (x < links) links = x;
        if (x > rechts) rechts = x;
      }
      if (rechts < links) continue;
      let a = Math.round(links);
      let b = Math.round(rechts);
      if (mindestensEinPixel && b <= a) b = a + 1;
      a = Math.max(a, 0);
      b = Math.min(b, B);
      if (b > a) this.ctx.fillRect(a, y, b - a, 1);
    }
  },

  // Ist auf Stück i, den nächsten paar Stücken oder den paar davor (deren Flanke
  // zeichnet das fernste Stück ihres Streifens) irgendwo ein Hang?
  hangInDerNaehe(i) {
    for (let j = i - CONFIG.STREIFEN_LAENGE; j <= i + CONFIG.STREIFEN_LAENGE; j++) {
      const s = Road.stueck(j);
      if (s.hang[0] > 0 || s.hang[1] > 0) return true;
    }
    return false;
  },

  // --- Bänder: Leitplanke, Holzzaun (später Absperrband) ---
  // Ein durchgehendes Band wie die Strasse: pro Strassenstück ein Viereck
  // von seinem nahen bis zu seinem fernen Ende, mit gemeinsamen Ecken zum
  // Nachbarstück. Darum folgt das Band Kurven und Hügeln ohne Stufen.
  // (Früher war jedes Stück Planke oder Zaun ein eigenes, flaches Bild, das
  // immer zur Kamera schaut. In Kurven ergab das Treppenstufen.)
  // Alle Werte (Abstand, Latten, Farben, Pfosten) kommen aus "band", also
  // aus BAENDER in config.js. nr: 0 = linke, 1 = rechte Strassenseite.
  // Gezeichnet wird Spalte für Spalte: Für jede Bildspalte zwischen nahem
  // und fernem Ende wird ausgerechnet, wo Ober- und Unterkante liegen.
  bandZeichnen(s, nr, band) {
    const B = CONFIG.BREITE;
    const abstand = CONFIG.STRASSE_HALBE_BREITE + CONFIG.BANKETT_BREITE + band.abstand;
    const mN = Road.brennweite / s.nahZ;
    const mF = Road.brennweite / s.fernZ;
    const clip = Math.min(s.clip, CONFIG.HOEHE);
    // Bildzeile für eine Höhe h (Meter über dem Boden) am nahen bzw. fernen Ende
    const yN = (h) => this.horizont + (this.kameraY - s.bodenNah - h) * mN;
    const yF = (h) => this.horizont + (this.kameraY - s.bodenFern - h) * mF;
    const ctx = this.ctx;
    const seite = nr === 0 ? -1 : 1;
    // Strassenseitige Kante des Bands am nahen und am fernen Ende
    const xN = B / 2 + (s.mitteNah + seite * abstand - this.kameraX) * mN;
    const xF = B / 2 + (s.mitteFern + seite * abstand - this.kameraX) * mF;
    const dx = xF - xN;

    // Pfosten zuerst: Sie stehen hinter den Latten
    this.pfostenZeichnen(s, band, seite, abstand, xN, dx, yN, yF, clip);

    const x0 = Math.max(Math.round(Math.min(xN, xF)), 0);
    const x1 = Math.min(Math.round(Math.max(xN, xF)), B);
    if (x1 <= x0) return;
    for (const latte of band.latten) {
      const obenN = yN(latte.oben), obenF = yF(latte.oben);
      const hMitte = (latte.oben + latte.unten) / 2;
      const mitteN = yN(hMitte), mitteF = yF(hMitte);
      const untenN = yN(latte.unten), untenF = yF(latte.unten);
      // Drei Durchgänge (je eine Farbe), damit die Farbe nicht pro Pixel wechselt
      for (let durchgang = 0; durchgang < 3; durchgang++) {
        const farbe = [latte.dunkel, latte.hell, latte.licht][durchgang];
        if (!farbe) continue;
        ctx.fillStyle = farbe;
        for (let x = x0; x < x1; x++) {
          const a = Math.min(Math.max((x + 0.5 - xN) / dx, 0), 1);
          const yo = Math.round(obenN + (obenF - obenN) * a);
          // Mindestens 1 Pixel hoch, sonst zerfällt das Band weit hinten in Punkte
          const yu = Math.max(Math.round(untenN + (untenF - untenN) * a), yo + 1);
          const ym = Math.min(Math.max(Math.round(mitteN + (mitteF - mitteN) * a), yo), yu);
          let von, bis;
          if (durchgang === 0) { von = ym; bis = yu; }        // untere Hälfte, dunkler
          else if (durchgang === 1) { von = yo; bis = ym; }   // obere Hälfte, heller
          else if (yu - yo >= 3) { von = yo; bis = yo + 1; }  // Lichtlinie, nur wenn Platz ist
          else continue;
          von = Math.max(von, 0);
          bis = Math.min(bis, clip);
          if (bis > von) ctx.fillRect(x, von, 1, bis - von);
        }
      }
    }
  },

  // Die Pfosten eines Bands auf diesem Stück (Bild aus sprites.js). Sie stehen
  // alle band.pfostenAlle Meter, gezählt ab Streckenbeginn, also auch mitten
  // in einem Stück (z. B. bei 3 m). Wichtig: Ober- und Unterkante werden mit
  // derselben Rechnung wie das Band bestimmt (gleiche Ecken, gleicher Anteil
  // pro Bildspalte, gleiches Runden). Würde man den Pfosten für sich allein
  // auf ganze Pixel runden, sässe er oft ein Pixel neben dem Band.
  pfostenZeichnen(s, band, seite, abstand, xN, dx, yN, yF, clip) {
    const L = CONFIG.STUECK_LAENGE;
    const alle = band.pfostenAlle;
    const start = s.stueck.index * L; // Anfang des Stücks auf der Strecke (Meter)
    const bild = Sprites.bilder[band.pfostenBild][0].normal;
    // Erster Pfosten auf oder nach dem Stückanfang (kleine Rechenfehler abfangen)
    for (let k = Math.ceil(start / alle - 1e-9); k * alle < start + L - 1e-9; k++) {
      const versatz = k * alle - start;          // Meter ab Stückanfang
      const z = s.abstand + versatz;             // Meter vor der Kamera
      if (z < CONFIG.OBJEKT_MIN_ENTFERNUNG) continue;
      // Wo zwischen nahem (0) und fernem (1) Ende liegt der Pfosten?
      const f = (z - s.nahZ) / (s.fernZ - s.nahZ);
      const mitte = s.mitteNah + (s.mitteFern - s.mitteNah) * f;
      const m = Road.brennweite / z;
      const x = CONFIG.BREITE / 2 + (mitte + seite * abstand - this.kameraX) * m;
      const w = Math.max(1, Math.round(band.pfostenBreite * m));
      // Der Pfosten geht von der strassenseitigen Kante nach aussen
      const links = seite < 0 ? Math.round(x) - w : Math.round(x);
      if (links >= CONFIG.BREITE || links + w <= 0) continue;
      // Ober- und Unterkante wie beim Band: aus den Ecken des Stücks, mit dem
      // Anteil der Bildspalte, an der der Pfosten das Band berührt
      const spalte = seite < 0 ? links + w - 1 : links;
      const a = Math.abs(dx) > 1e-9 ? Math.min(Math.max((spalte + 0.5 - xN) / dx, 0), 1) : 0;
      const yOben = Math.round(yN(band.pfostenHoehe) + (yF(band.pfostenHoehe) - yN(band.pfostenHoehe)) * a);
      const yBoden = Math.round(yN(0) + (yF(0) - yN(0)) * a);
      const h = yBoden - yOben;
      if (h < CONFIG.OBJEKT_MIN_PIXEL) continue;
      // Hinter Kuppen wie alle Objekte abgeschnitten
      const sichtbarH = Math.min(h, clip - yOben);
      if (sichtbarH <= 0) continue;
      this.ctx.drawImage(bild, 0, 0, bild.width, bild.height * sichtbarH / h, links, yOben, w, sichtbarH);
    }
  },

  // --- Tal: Hang, Talboden und Dunst ---
  // Hinter der Abbruchkante fällt ein Hang ab (Neigung TAL_HANG_NEIGUNG) bis
  // zum Talboden TAL_TIEFE Meter unter der Strasse. Beides wird wie die
  // Strasse gezeichnet: pro Strassenstück ein Viereck, von fern nach nah.
  // Weil alles so viel tiefer liegt, erscheint es im Bild weiter unten und
  // kleiner: Man schaut hinter der Leitplanke in die Tiefe. Den Teil, der
  // eigentlich unter der Kante versteckt ist, malt die Strasse danach wieder zu.
  // Dazu ab und zu ein kleiner Baum unten im Tal.
  talboden(anzahl) {
    const B = CONFIG.BREITE;
    const sicht = CONFIG.TAL_BODEN_SICHT;
    const baum = Sprites.bilder.tal_baum[0];
    const baumMasse = Sprites.masse('tal_baum');
    const neigung = CONFIG.TAL_HANG_NEIGUNG;
    for (let nr = 0; nr < 2; nr++) {
      this.bodenX[nr].fill(nr === 0 ? -Infinity : Infinity);
      this.bodenZ[nr].fill(Infinity);
    }
    for (let n = anzahl - 1; n >= 0; n--) {
      const e = this.sichtbar[n];
      if (e.nahZ > sicht) continue;
      const mN = Road.brennweite / e.nahZ;
      const mF = Road.brennweite / e.fernZ;
      // Farbe: weiter weg mehr im Dunst (in ein paar Stufen, Retro-Look).
      // Hang mit hellen und dunklen Streifen wie die Strasse, Talboden mit
      // Feldern und Waldstücken; ganz hinten einfarbig, sonst flimmert es.
      const stufe = Math.min(Math.floor(e.nahZ / sicht * this.talFarben.length), this.talFarben.length - 1);
      const dunkel = e.stueck.hell ? 0 : 1;
      const feld = e.nahZ < CONFIG.TAL_FELDER_BIS ? e.stueck.talFeld : 0;
      for (let nr = 0; nr < 2; nr++) {
        const tN = e.talNah[nr];
        const tF = e.talFern[nr];
        if (tN <= 0 && tF <= 0) continue;
        const seite = nr === 0 ? -1 : 1;
        // Beim Übergang ist das Tal noch nicht so tief (bei t = 0 auf Strassenhöhe)
        const tiefeN = CONFIG.TAL_TIEFE * tN;
        const tiefeF = CONFIG.TAL_TIEFE * tF;
        // Seitliche Lage (Meter ab Strassenmitte): Kante oben, Hangfuss unten
        const kanteN = e.kanteNah[nr];
        const kanteF = e.kanteFern[nr];
        const fussN = kanteN + tiefeN / neigung;
        const fussF = kanteF + tiefeF / neigung;
        // Bildpunkte: x, y für seitliche Lage u und Tiefe d am nahen / fernen Ende
        const xN = (u) => B / 2 + (e.mitteNah + seite * u - this.kameraX) * mN;
        const xF = (u) => B / 2 + (e.mitteFern + seite * u - this.kameraX) * mF;
        const yN = (d) => this.horizont + (this.kameraY - e.bodenNah + d) * mN;
        const yF = (d) => this.horizont + (this.kameraY - e.bodenFern + d) * mF;

        // Talboden: vom Hangfuss bis zum Bildrand
        const bodenFarbe = this.talFarben[stufe][feld];
        this.viereck(nr, e.nahZ, bodenFarbe,
          xN(fussN), yN(tiefeN), xF(fussF), yF(tiefeF),
          xF(fussF + 100000), yF(tiefeF), xN(fussN + 100000), yN(tiefeN));
        // Hang: von der Kante (Strassenhöhe) hinunter zum Hangfuss. Ein
        // Viereck pro Farbstreifen (STREIFEN_LAENGE Stücke) statt pro Stück:
        // sieht gleich aus, kostet aber nur einen Bruchteil. Gezeichnet wird
        // es beim nächsten Stück des Streifens, also nach den ferneren.
        // Oben 0.5 m unter das Gras geschoben, damit nie eine Lücke bleibt.
        const imStreifen = e.stueck.index % CONFIG.STREIFEN_LAENGE;
        if (imStreifen === 0 || n === 0) {
          const g = this.sichtbar[Math.min(n + CONFIG.STREIFEN_LAENGE - 1 - imStreifen, anzahl - 1)];
          const mG = Road.brennweite / g.fernZ;
          const tG = g.talFern[nr];
          const kanteG = g.kanteFern[nr];
          const xG = (u) => B / 2 + (g.mitteFern + seite * u - this.kameraX) * mG;
          const yG = (d) => this.horizont + (this.kameraY - g.bodenFern + d) * mG;
          const tiefeG = CONFIG.TAL_TIEFE * tG;
          this.viereck(nr, e.nahZ, this.hangFarben[stufe][dunkel],
            xN(kanteN - 0.5), yN(0), xG(kanteG - 0.5), yG(0),
            xG(kanteG + tiefeG / neigung), yG(tiefeG), xN(fussN), yN(tiefeN));
        }

        // Kleiner Baum am Hang oder unten im Tal (nur wo der Abhang ganz offen ist)
        const weiter = e.stueck.talBaum[nr];
        if (weiter > 0 && tN > 0.9 && e.abstand >= CONFIG.OBJEKT_MIN_ENTFERNUNG) {
          const h = baumMasse.hoehe * mN;
          if (h < CONFIG.OBJEKT_MIN_PIXEL) continue;
          const w = baumMasse.breite * mN;
          const bx = xN(kanteN + weiter);
          const x = Math.round(bx - w / 2);
          // Steht er noch am Hang, entsprechend weniger tief
          const fussY = yN(Math.min(weiter * neigung, tiefeN));
          const y = Math.round(fussY - h);
          if (x >= B || x + w <= 0 || y >= CONFIG.HOEHE) continue;
          const bild = e.stueck.index % 2 ? baum.gespiegelt : baum.normal;
          this.ctx.drawImage(bild, x, y, Math.max(1, Math.round(w)), Math.max(1, Math.round(fussY) - y));
        }
      }
    }
  },

  // Ein Viereck (4 Bildpunkte, rundherum der Reihe nach) Zeile für Zeile
  // füllen. Pro Zeile zählt ihre Mitte (y + 0.5): Zwei Vierecke mit
  // gemeinsamer Kante teilen sich die Pixel genau, ohne Lücke und ohne
  // Überlappung. Ausserdem merken, wie weit Hang/Talboden in jeder Zeile
  // reicht (bodenX, bodenZ), siehe stueckZeichnen.
  viereck(nr, z, farbe, x1, y1, x2, y2, x3, y3, x4, y4) {
    const xs = this.viereckX;
    const ys = this.viereckY;
    xs[0] = x1; xs[1] = x2; xs[2] = x3; xs[3] = x4;
    ys[0] = y1; ys[1] = y2; ys[2] = y3; ys[3] = y4;
    const von = Math.max(Math.round(Math.min(y1, y2, y3, y4)), 0);
    const bis = Math.min(Math.round(Math.max(y1, y2, y3, y4)), CONFIG.HOEHE);
    const B = CONFIG.BREITE;
    // Farbe nur einmal setzen: Das ist im Browser viel teurer als ein fillRect
    this.ctx.fillStyle = farbe;
    for (let y = von; y < bis; y++) {
      const ym = y + 0.5;
      let links = Infinity;
      let rechts = -Infinity;
      for (let k = 0; k < 4; k++) {
        // Kante von Punkt k zu Punkt k+1; immer von oben nach unten rechnen,
        // damit Nachbarvierecke für dieselbe Kante genau dasselbe herausbekommen
        let xa = xs[k], ya = ys[k], xb = xs[(k + 1) % 4], yb = ys[(k + 1) % 4];
        if (ya > yb) { const tx = xa; xa = xb; xb = tx; const ty = ya; ya = yb; yb = ty; }
        if (ym < ya || ym >= yb) continue;
        const x = xa + (xb - xa) * (ym - ya) / (yb - ya);
        if (x < links) links = x;
        if (x > rechts) rechts = x;
      }
      if (rechts <= links) continue;
      const a = Math.max(Math.round(links), 0);
      const b = Math.min(Math.round(rechts), B);
      if (b > a) this.ctx.fillRect(a, y, b - a, 1);
      // Merken: das nächste Stück in dieser Zeile und wie weit es zur
      // Strasse hin reicht (Hang und Boden desselben Stücks zusammen)
      const x = nr === 0 ? rechts : links;
      if (z < this.bodenZ[nr][y]) {
        this.bodenZ[nr][y] = z;
        this.bodenX[nr][y] = x;
      } else if (z === this.bodenZ[nr][y]) {
        this.bodenX[nr][y] = nr === 0 ? Math.max(this.bodenX[0][y], x) : Math.min(this.bodenX[1][y], x);
      }
    }
  },

  // Farben von Talboden und Hang in 4 Stufen von nah (satt) nach fern
  // (TAL_DUNST_ANTEIL in Richtung des untersten Dunst-Streifens gemischt).
  // Talboden: je Stufe eine Farbe pro Feld, Hang: je Stufe [hell, dunkel].
  talFarbenMischen() {
    const f = CONFIG.FARBEN;
    const fern = f.TAL_DUNST[f.TAL_DUNST.length - 1];
    const boden = [];
    const hang = [];
    const anzahl = 4;
    for (let i = 0; i < anzahl; i++) {
      const t = CONFIG.TAL_DUNST_ANTEIL * i / (anzahl - 1);
      boden.push(f.TAL_FELDER.map((farbe) => this.farbeMischen(farbe, fern, t)));
      hang.push([this.farbeMischen(f.TAL_HANG_HELL, fern, t), this.farbeMischen(f.TAL_HANG_DUNKEL, fern, t)]);
    }
    this.hangFarben = hang;
    return boden;
  },

  // Zwei Farben '#rrggbb' mischen (t = 0: nur a, t = 1: nur b)
  farbeMischen(a, b, t) {
    const teil = (farbe, i) => parseInt(farbe.substr(1 + 2 * i, 2), 16);
    const kanal = (i) => Math.round(teil(a, i) + (teil(b, i) - teil(a, i)) * t);
    return 'rgb(' + kanal(0) + ', ' + kanal(1) + ', ' + kanal(2) + ')';
  },

  // Dunst-Landschaft tief unten im Tal, einmal vorgezeichnet: waagrechte
  // Streifen, oben (weit weg) hell und bläulich, unten dunkler und
  // blaugrün, mit sanft gewellten Grenzen (Hügelketten) und kleinen
  // Baumwipfeln. Sie liegt unter dem Horizont und unter dem Talboden.
  dunstVorzeichnen() {
    const f = CONFIG.FARBEN;
    const B = CONFIG.BREITE;
    const H = CONFIG.HOEHE - (CONFIG.HORIZONT_Y - CONFIG.HORIZONT_MAX_VERSATZ);
    const leinwand = document.createElement('canvas');
    leinwand.width = B;
    leinwand.height = H;
    const c = leinwand.getContext('2d');
    let zahl = 2718;
    const zufall = () => {
      zahl = (zahl * 1103515245 + 12345) % 2147483648;
      return zahl / 2147483648;
    };
    const farben = f.TAL_DUNST;
    // Untere Grenze jedes Streifens (Pixel unter dem Horizont) an der Stelle x.
    // Die Wellen passen eine ganze Zahl Mal in die Bildbreite: nahtlos rundherum.
    const basis = [3, 7, 12, 18];
    const phase = basis.map(() => zufall() * 2 * Math.PI);
    const grenze = (k, x) => Math.round(basis[k] +
      (1 + k * 0.5) * Math.sin(2 * Math.PI * (2 + k) * x / B + phase[k]) +
      0.8 * Math.sin(2 * Math.PI * (7 + 2 * k) * x / B + 2 * phase[k]));
    // Unterster Streifen füllt alles, dann von unten nach oben darüber
    c.fillStyle = farben[farben.length - 1];
    c.fillRect(0, 0, B, H);
    for (let k = basis.length - 1; k >= 0; k--) {
      c.fillStyle = farben[k];
      for (let x = 0; x < B; x++) c.fillRect(x, 0, 1, grenze(k, x));
    }
    // Kleine Baumwipfel auf den unteren Hügelketten (auch um eine Bildbreite
    // versetzt gezeichnet, damit die Naht passt)
    c.fillStyle = f.TAL_DUNST_BAUM;
    for (let i = 0; i < 45; i++) {
      const x = Math.floor(zufall() * B);
      const k = 1 + Math.floor(zufall() * (basis.length - 1));
      const h = 2 + Math.floor(zufall() * 3);
      const fussY = grenze(k, x) + 1;
      for (let r = 0; r < h; r++) {
        const halb = Math.floor(r / 2);
        for (const v of [-B, 0, B]) c.fillRect(x + v - halb, fussY - h + r, 2 * halb + 1, 1);
      }
    }
    return leinwand;
  },

  // Dunst zweimal nebeneinander, um dunstVersatz verschoben (wie die Waldlinie)
  dunstZeichnen() {
    const v = Math.round(this.dunstVersatz);
    this.ctx.drawImage(this.dunst, v, this.horizont);
    this.ctx.drawImage(this.dunst, v - CONFIG.BREITE, this.horizont);
  },

  // Nach einem harten Aufprall wackelt das Bild ein paar Pixel. Dafür wird
  // das fertige Bild einfach leicht verschoben auf sich selbst kopiert.
  // Das Muster hängt an der Restzeit, nicht an den Bildern pro Sekunde:
  // Auf 60 Hz und 144 Hz wackelt es gleich.
  wackeln() {
    if (Car.wackeln <= 0) return;
    const muster = [[1, 0.5], [-1, -0.5], [0.5, -1], [-0.5, 1], [1, -0.5], [-1, 0.5]];
    const [mx, my] = muster[Math.floor(Car.wackeln / 0.04) % muster.length];
    const a = CONFIG.AUFPRALL_WACKEL_PIXEL;
    this.ctx.drawImage(this.ctx.canvas, Math.round(mx * a), Math.round(my * a));
  },

  // --- Hintergrund: Waldlinie und Wolken ---
  // Die Waldlinie ist ein Streifen kleiner Pixel-Tannen direkt über dem
  // Horizont. Sie wird einmal beim Start auf eine eigene Leinwand gezeichnet
  // (so breit wie das Bild, rundherum nahtlos) und dann nur noch verschoben.
  waldlinieVorzeichnen() {
    const f = CONFIG.FARBEN;
    const B = CONFIG.BREITE;
    const H = CONFIG.WALDLINIE_HOEHE;
    const leinwand = document.createElement('canvas');
    leinwand.width = B;
    leinwand.height = H;
    const c = leinwand.getContext('2d');
    // Eigener kleiner Zufall mit fester Startzahl: jedes Mal gleiche Waldlinie
    let zahl = 12345;
    const zufall = () => {
      zahl = (zahl * 1103515245 + 12345) % 2147483648;
      return zahl / 2147483648;
    };
    // Eine Tanne: Dreieck mit kleinen Absätzen, h Pixel hoch, Spitze bei x.
    // Wird auch um eine Bildbreite versetzt gezeichnet, damit die Naht passt.
    const tanne = (x, h, farbe) => {
      c.fillStyle = farbe;
      for (let r = 0; r < h; r++) {
        let halb = Math.floor((r + 1) / 2.6);
        if (r > 2 && r % 3 === 0) halb--; // Absatz: Äste stufenweise
        for (const v of [-B, 0, B]) c.fillRect(x + v - halb, H - h + r, 2 * halb + 1, 1);
      }
    };
    // Hintere Reihe: höher, heller und bläulicher (weiter weg)
    for (let x = 0; x < B; x += 3 + Math.floor(zufall() * 4)) {
      tanne(x, Math.round(H * (0.55 + zufall() * 0.45)), f.WALDLINIE_HINTEN);
    }
    // Vordere Reihe: kleiner und dunkler
    for (let x = 1; x < B; x += 2 + Math.floor(zufall() * 4)) {
      tanne(x, Math.round(H * (0.3 + zufall() * 0.35)), f.WALDLINIE_VORNE);
    }
    // Unten durchgehend, damit am Horizont nie Berg oder Himmel durchblitzt
    c.fillStyle = f.WALDLINIE_VORNE;
    c.fillRect(0, H - 2, B, 2);
    return leinwand;
  },

  // Waldlinie zweimal nebeneinander zeichnen, um waldVersatz verschoben.
  // So ist die ganze Bildbreite immer gefüllt.
  waldlinieZeichnen() {
    const v = Math.round(this.waldVersatz);
    const y = this.horizont - CONFIG.WALDLINIE_HOEHE;
    this.ctx.drawImage(this.waldlinie, v, y);
    this.ctx.drawImage(this.waldlinie, v - CONFIG.BREITE, y);
  },

  // Wolken zwischen Himmel und Bergen (die Berge stehen also davor)
  wolken() {
    CONFIG.WOLKEN.forEach((w, i) => {
      const bild = Sprites.wolken[w.form % Sprites.wolken.length];
      // Der Wolkenbereich ist breiter als das Bild: Wolken verschwinden
      // rechts ganz und tauchen später links wieder auf.
      const x = Math.round(this.wolkenX[i]) - (WOLKEN_BEREICH - CONFIG.BREITE) / 2;
      this.ctx.drawImage(bild, x, this.horizont - w.hoehe);
    });
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
      // Wie viele Objekte (Bäume, Felsen ...) in diesem Bild gezeichnet wurden
      'OBJEKTE ' + this.objekteGezeichnet + ' / MAX ' + CONFIG.MAX_OBJEKTE,
      // Gelände links und rechts, mit Prozent (beim Übergang unter 100)
      'GELÄNDE L ' + this.gelaendeText(stueck, 0) + '  R ' + this.gelaendeText(stueck, 1),
      // Wie weit der Hang gewachsen ist (0 % = flach am Bankett, 100 % = voller Querschnitt)
      // Dazu der Faktor hang_hoehe aus track.js (weich übergeblendet)
      'HANG L ' + Math.round(stueck.hang[0] * 100) + ' %  R ' + Math.round(stueck.hang[1] * 100) + ' %  HÖHE ' + Math.round(stueck.hangFaktor * 100) + ' %',
    ];
    let breite = 0;
    for (const z of zeilen) breite = Math.max(breite, this.textBreite(z));
    this.ctx.fillStyle = f.DEBUG_HINTERGRUND;
    this.ctx.fillRect(2, 2, breite + 4, zeilen.length * 7 + 2);
    zeilen.forEach((z, i) => this.text(z, 4, 4 + i * 7, 1, f.DEBUG_TEXT));
  },

  // z. B. "HANG 100%", "TAL 45%" oder "-" (nr: 0 = links, 1 = rechts)
  gelaendeText(stueck, nr) {
    if (stueck.hang[nr] > 0) return 'HANG ' + Math.round(stueck.hang[nr] * 100) + '%';
    if (stueck.tal[nr] > 0) return 'TAL ' + Math.round(stueck.tal[nr] * 100) + '%';
    return '-';
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
