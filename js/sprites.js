// Sprites: alle Grafiken am Strassenrand (Bäume, Felsen, Schilder, ...).
//
// Jede Grafik ist ein kleines Pixelraster aus Text. Jedes Zeichen ist ein
// Pixel, der Buchstabe sagt die Farbe (siehe SPRITE_FARBEN), ein Punkt "."
// ist durchsichtig. So kann man die Bilder direkt hier im Text ändern.
// Beim Start wird jedes Raster einmal auf eine unsichtbare Leinwand
// gezeichnet. Danach muss das Spiel sie nur noch hinkopieren (schnell).
//
// Tipp: Alle Zeilen eines Rasters müssen gleich lang sein. Ist eine zu
// kurz, wird sie rechts mit "." aufgefüllt und es gibt eine Warnung in
// der Browser-Konsole (F12).

// Farben der Pixel. Erdig, kein reines Schwarz (das wirkt im Pixel-Look hart).
const SPRITE_FARBEN = {
  // Fichten/Tannen: von dunkel (Schatten) bis hell (Sonnenseite links)
  A: '#173323',
  B: '#22482d',
  C: '#2f6237',
  D: '#4b8744',
  // Laubbäume und Büsche
  E: '#2d561f',
  F: '#437a27',
  G: '#649f35',
  H: '#93c454',
  // Holz: Stämme, Pfosten, Zaun
  S: '#3c291b',
  T: '#5f412b',
  U: '#8b6842',
  // Fels: dunkel bis hell, O = Moos
  K: '#4a4a52',
  L: '#6c6c75',
  M: '#93939b',
  N: '#bdbdc3',
  O: '#5d6a45',
  // Metall (Leitplanke, Schildpfosten)
  P: '#d5d9dd',
  Q: '#9ba1a9',
  R: '#626870',
  // Schilder, Kuh, Wolken
  Y: '#f2c230',  // Signalgelb
  Z: '#2b2622',  // fast schwarz (Pfeil, Flecken)
  W: '#f2efe6',  // weiss
  V: '#c4bfb2',  // weiss im Schatten
  X: '#e9a29b',  // rosa (Kuhnase, Euter)
  I: '#d8ccb0',  // Horn
  J: '#dfe8f2',  // Wolke im Schatten
  // Kleinbuchstaben: weitere Farben
  r: '#c9312a',  // Rot (Rand der Temposchilder)
  a: '#466a62',  // kleine Bäume tief unten im Tal (bläulich, im Dunst) ...
  b: '#557a70',
  c: '#67897e',
};

// Alle Sprites. Pro Sprite:
//   hoehe:     wie hoch es in der Spielwelt ist, in Metern. Die Breite
//              ergibt sich aus dem Raster (Pixel sind immer quadratisch).
//   fest:      true = harter Aufprall (Tempo weg, Wackeln),
//              false = weich, bremst nur etwas (Busch)
//   kollision: wie breit (Meter) das Objekt beim Zusammenstoss zählt.
//              Bei Bäumen nur der Stamm und die unteren Äste, nicht die ganze Krone.
//   laenge:    nur bei Leitplanke und Zaun: alle so viele Meter steht ein Stück,
//              und so lang zählt es beim Zusammenstoss entlang der Strasse.
//              Sonst zählt die Kollisionsbreite auch in der Länge.
//   anker:     'mitte' = steht mittig auf seinem Platz,
//              'innen' = die strassenseitige Kante steht auf dem Platz, das Bild
//              geht nach aussen (Leitplanke, Zaun: so laufen sie dem Rand entlang)
//   spiegeln:  true = darf zufällig gespiegelt werden (mehr Abwechslung)
//   baum:      true = hoher Baum. Bäume stehen nie zwischen Strasse und Felswand
//              und nie nahe am Abhang (siehe scenery.js).
//   unsichtbar: true = wird nicht als Bild gezeichnet, zählt aber beim
//              Zusammenstoss (Leitplanke: wird als Band gezeichnet, Wand: als Felswand)
//   varianten: ein oder mehrere Pixelraster (zufällig ausgewählt)
const SPRITE_DATEN = {
  fichte_gross: {
    hoehe: 10, fest: true, kollision: 1.2, anker: 'mitte', spiegeln: true, baum: true,
    varianten: [
      [
        '........C........',
        '........C........',
        '.......DCA.......',
        '......CBAAA......',
        '.......DCA.......',
        '......DDCBA......',
        '.....CBAAAAA.....',
        '......DCCAA......',
        '.....DDCCBBA.....',
        '....CABBAAAAA....',
        '.....DDCCBBA.....',
        '....DCCDCBBBA....',
        '...CAAABAAAAAA...',
        '.....DDCCBAA.....',
        '....DCCCCBBBA....',
        '...DCCCCCBBBAA...',
        '..CABBABAAAAAAA..',
        '....DCCCCAABA....',
        '...DCCCDCBBBBA...',
        '..DCCCCCCBBBBAA..',
        '.CBBBBBBAAAAAAAA.',
        '...DCCCCCBBBAA...',
        '..DCDCCCCBBBBBA..',
        '.DDDDCCDCBBABBBA.',
        'CABBBBABAAAAAAAAA',
        '.......STS.......',
        '.......STS.......',
        '.......STS.......',
      ],
      [
        '........C........',
        '.......DCA.......',
        '......CBAAA......',
        '.......DCA.......',
        '......DCCBA......',
        '.....CBAAAAA.....',
        '......DCCAA......',
        '.....CBAAAAA.....',
        '......DDCBA......',
        '.....DCCCBBA.....',
        '....CBABAAAAA....',
        '.....DCDCBBA.....',
        '....DCCDCABBA....',
        '...CBBBBAAAAAA...',
        '....DCCCCBBAA....',
        '...DCCDCCABBBA...',
        '..CBBBBBAAAAAAA..',
        '....DCCCCBBBA....',
        '...DCDCDCAABAA...',
        '..DCCCDCCBBBBBA..',
        '.CBBBBAAAAAAAAAA.',
        '...DCCCCCBBBAA...',
        '..DCCCCCCBABAAA..',
        '.DCDCDDDCABABBAA.',
        'CABBABBBAAAAAAAAA',
        '.......STS.......',
        '.......STS.......',
        '.......STS.......',
      ],
    ],
  },

  fichte_klein: {
    hoehe: 5, fest: true, kollision: 0.9, anker: 'mitte', spiegeln: true, baum: true,
    varianten: [
      [
        '.....C.....',
        '....DCA....',
        '...CBAAA...',
        '....DCA....',
        '...DCCBA...',
        '..CBBAAAA..',
        '...DCCBA...',
        '..DCCCBBA..',
        '.CBBAAAAAA.',
        '..DCDCBBA..',
        '.DCDCCBBBA.',
        'CBBBBAAAAAA',
        '....STS....',
        '....STS....',
      ],
      [
        '.....C.....',
        '.....C.....',
        '....DCA....',
        '...DCCBA...',
        '...DCCBA...',
        '..CBBAAAA..',
        '...DCCAA...',
        '..DCDCBBA..',
        '.CABBAAAAA.',
        '..DCDCBBA..',
        '.DDCCCBBBA.',
        'CBBBAAAAAAA',
        '....STS....',
        '....STS....',
      ],
    ],
  },

  laubbaum: {
    hoehe: 7.5, fest: true, kollision: 1.0, anker: 'mitte', spiegeln: true, baum: true,
    varianten: [
      [
        '........H........',
        '....HHHGHGGF.....',
        '...HHHGHGHGGG....',
        '...HGGGGGGGFFF...',
        '..HHGGGGGGFFFF...',
        '...HHGGFGFFHHG...',
        '..HGGGGFGFHGGGG..',
        '.GGGGGHGGHHGGGGF.',
        'HGGGGHHGHGGGFFFEE',
        'GGGFGGGGGGGFFFEEE',
        'GFFFGGGGGFFFEEFEE',
        '.FFFGGGFFFFFFEEE.',
        '..FEGFFFFEFEEEE..',
        '...EEFFFEEEEEE...',
        '......EFEEE......',
        '.......UES.......',
        '.......UTS.......',
        '.......UTS.......',
        '.......UTS.......',
        '......TUTSS......',
      ],
      [
        '...............',
        '.....HHGGF.....',
        '....HHGGGFF....',
        '...HGGGGFFFF...',
        '...HGGFFFFFE...',
        '...GHFGFFHGGG..',
        '.HHGGFFFHGGGFF.',
        '.HGGGHHHGGGGFFE',
        'GGFGGHHHGGGFFFE',
        'GFFFHGGGGFFEEEE',
        '.FFGGGFFFFFEEE.',
        '.FFGGGFFEFEEE..',
        '...EFFFFEEE....',
        '....FEEEEEE....',
        '.....EEEEE.....',
        '......UTS......',
        '......UTS......',
        '......UTS......',
        '.....TUTSS.....',
      ],
    ],
  },

  busch: {
    hoehe: 1.3, fest: false, kollision: 1.8, anker: 'mitte', spiegeln: true,
    varianten: [
      [
        '....HHGF....',
        '..HHHGHGHG..',
        '.HGGGHGGGFF.',
        '.HGGGHGGFFF.',
        '.GGFFGGFFFE.',
        '.FFFEFFFEEE.',
        '..FEEFFFEEE.',
      ],
      [
        '......CD..',
        '.DDCDDCCB.',
        '.CCBCCCBBA',
        '.CBBCCBBBA',
        '.BBBBBBBAA',
        '.BAAABBAA.',
      ],
    ],
  },

  fels_a: {
    hoehe: 1.5, fest: true, kollision: 2.0, anker: 'mitte', spiegeln: true,
    varianten: [
      [
        '.....MNNM.....',
        '...MNNMMMLL...',
        '..MNMMMMLLLK..',
        '.MMMMLMLLLLKK.',
        '.LMMLLLLLKLLK.',
        'LLLMLLKLLLKKKK',
        'LOLLLKLLLKKKKK',
        'KOOLLKKKKKKKKK',
        '.KKKKKKKKKKKK.',
      ],
    ],
  },

  fels_b: {
    hoehe: 2.6, fest: true, kollision: 1.8, anker: 'mitte', spiegeln: true,
    varianten: [
      [
        '....NM.....',
        '...NMML....',
        '...MMLLK...',
        '..NMMLLK...',
        '..MMLLLKK..',
        '.NMMLLKLK..',
        '.MMLLLKLKK.',
        '.MLLLKLLKK.',
        'NMLLKLLLKKK',
        'MMLLLKLKKKK',
        'MLOLLKKKKKK',
        'LOOLKKKKKKK',
        'KKKKKKKKKK.',
      ],
    ],
  },

  // Leitplanke: Sie wird seit Meilenstein 3.5 nicht mehr aus einzelnen Bildern
  // zusammengesetzt, sondern wie die Strasse als durchgehendes Band gezeichnet
  // (siehe render.js). Früher stand hier ein 4 m langes Planken-Bild: In Kurven
  // gab das Treppenstufen, weil jedes Bild flach zur Kamera schaut und nicht
  // der Strasse folgen kann. Geblieben ist ein Eintrag pro 2 m für den
  // Zusammenstoss, und das Raster ist jetzt der dunkle Pfosten, der alle
  // PFOSTEN_ALLE Meter unter dem Band steht.
  leitplanke: {
    hoehe: 0.8, fest: true, kollision: 0.5, laenge: 2, anker: 'innen', spiegeln: false, unsichtbar: true,
    varianten: [
      [
        'RK',
        'RK',
        'RK',
        'RK',
        'RK',
        'RK',
        'RK',
        'KK',
      ],
    ],
  },

  // Felswand: nur für den Zusammenstoss (ein Eintrag pro 2 m). Gezeichnet
  // wird die Wand als durchgehende Fläche in render.js.
  wand: {
    hoehe: 1, fest: true, kollision: 1.0, laenge: 2, anker: 'innen', spiegeln: false, unsichtbar: true,
    varianten: [['K']],
  },

  // Wegweiser: Holzpfosten mit zwei leeren Richtungstafeln (keine echten Ortsnamen,
  // nur graue Striche als "Schrift").
  wegweiser: {
    hoehe: 2.6, fest: true, kollision: 0.5, anker: 'mitte', spiegeln: true,
    varianten: [
      [
        '.......UT.......',
        '..VVVVVVVVVVVV..',
        '..WWWWWWWWWWWWV.',
        '..WRRWRRRWRRWWWV',
        '..WWWWWWWWWWWWV.',
        '..VVVVVVVVVVVV..',
        '.......UT.......',
        '..VVVVVVVVVVVV..',
        '.VWWWWWWWWWWWW..',
        'VWWWRRWRRWRRRW..',
        '.VWWWWWWWWWWWW..',
        '..VVVVVVVVVVVV..',
        '.......UT.......',
        '.......UT.......',
        '.......UT.......',
        '.......UT.......',
        '.......UT.......',
        '.......UT.......',
        '.......UT.......',
        '.......UT.......',
        '.......UT.......',
        '......SUTS......',
      ],
    ],
  },

  // Ein 4 m langes Stück Weidezaun (zwei Pfosten, zwei Latten). Steht wie
  // die Leitplanke alle 2 m, die Bilder überlappen sich.
  zaun: {
    hoehe: 1.2, fest: true, kollision: 0.4, laenge: 2, anker: 'innen', spiegeln: false,
    varianten: [
      [
        '.UT..................UT.................',
        '.UT..................UT.................',
        'UUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU',
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
        '.UT..................UT.................',
        '.UT..................UT.................',
        'UUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU',
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
        '.UT..................UT.................',
        '.UT..................UT.................',
        '.UT..................UT.................',
        '.ST..................ST.................',
      ],
    ],
  },

  // Fröhliche Kuh von der Seite, schaut nach links.
  kuh: {
    hoehe: 1.5, fest: true, kollision: 2.0, anker: 'mitte', spiegeln: true,
    varianten: [
      [
        '.I..I...............',
        'ZWWWWZ..............',
        '.WZWZW..............',
        '.WWWWWWWWWZZZWWWWZW.',
        'XXXXWWWWZZZZZWWWWZWV',
        'XZXZXWWWWZZZWWWWWWWV',
        '.XXXWWWWWWWWWWZZWWWV',
        '.....WZZWWWWWZZZWWV.',
        '.....VZZWWWWWWZWWWVZ',
        '.....VVVVVVXXVVVVVV.',
        '.....WV.WV...WV.WV..',
        '.....WV.WV...WV.WV..',
        '.....ZZ.ZZ...ZZ.ZZ..',
      ],
      [
        '.I..I...............',
        'ZWWWWZ..............',
        '.WZWZW..............',
        '.WWWWWZZWWWWWWZZWWW.',
        'XXXXWZZZZWWWWZZZZWWV',
        'XZXZXZZZWWWWWWZZWWWV',
        '.XXXWWWWWWZZWWWWWWWV',
        '.....WWWWZZZZWWWWZV.',
        '.....VWWWWZZWWWWZZVZ',
        '.....VVVVVVXXVVVVVV.',
        '.....WV.WV...WV.WV..',
        '.....WV.WV...WV.WV..',
        '.....ZZ.ZZ...ZZ.ZZ..',
      ],
    ],
  },
};

// Kleine Fichte tief unten im Tal (wird in render.js auf den Talboden
// gestellt, nicht von scenery.js verteilt). Bläulich, weil sie im Dunst steht.
SPRITE_DATEN.tal_baum = {
  hoehe: 9, fest: false, kollision: 0, anker: 'mitte', spiegeln: true, unsichtbar: true,
  varianten: [
    [
      '...c...',
      '..cba..',
      '...b...',
      '..cba..',
      '.cbbaa.',
      '..cba..',
      '.cbbaa.',
      'cbbaaaa',
      '...a...',
    ],
  ],
};

// --- Temposchilder ---
// Kleine Pixelschrift für die Zahlen auf den Schildern: jede Ziffer 3 Pixel
// breit und 5 hoch. "1" = Pixel an (schwarz), "0" = aus (weiss bleibt).
const SCHILD_ZIFFERN = {
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '011', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '010', '010', '010'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
};

// Runde weisse Scheibe mit rotem Rand auf einem Pfosten. Die Zahl wird beim
// Laden in die Mitte gestempelt (Zeilen 4 bis 8, ab Spalte 3).
const TEMPOSCHILD_RASTER = [
  '....rrrrr....',
  '..rrrrrrrrr..',
  '.rrrWWWWWrrr.',
  '.rrWWWWWWWrr.',
  'rrWWWWWWWWWrr',
  'rrWWWWWWWWWrr',
  'rrWWWWWWWWWrr',
  'rrWWWWWWWWWrr',
  'rrWWWWWWWWWrr',
  '.rrWWWWWWWrr.',
  '.rrrWWWWWrrr.',
  '..rrrrrrrrr..',
  '....rrrrr....',
  '.....QR......',
  '.....QR......',
  '.....QR......',
  '.....QR......',
  '.....QR......',
  '.....QR......',
  '.....QR......',
  '.....QR......',
  '.....QR......',
  '.....QR......',
  '.....QR......',
  '....SQRS.....',
];

// Für jede Zahl aus TEMPOSCHILD_ZAHLEN (config.js) ein eigenes Sprite anlegen,
// z. B. "tempo60". So muss man für eine neue Zahl kein Bild zeichnen.
for (const staerke in CONFIG.TEMPOSCHILD_ZAHLEN) {
  const zahl = String(CONFIG.TEMPOSCHILD_ZAHLEN[staerke]);
  const raster = TEMPOSCHILD_RASTER.map((zeile) => zeile.split(''));
  // Ziffern mittig einsetzen: jede Ziffer 3 breit, 1 Pixel Abstand dazwischen
  const breite = zahl.length * 4 - 1;
  const links = Math.floor((13 - breite) / 2);
  for (let n = 0; n < zahl.length; n++) {
    const ziffer = SCHILD_ZIFFERN[zahl[n]] || SCHILD_ZIFFERN['0'];
    for (let zy = 0; zy < 5; zy++) {
      for (let zx = 0; zx < 3; zx++) {
        if (ziffer[zy][zx] === '1') raster[4 + zy][links + n * 4 + zx] = 'Z';
      }
    }
  }
  SPRITE_DATEN['tempo' + zahl] = {
    hoehe: 2.5, fest: true, kollision: 0.6, anker: 'mitte', spiegeln: false,
    varianten: [raster.map((zeile) => zeile.join(''))],
  };
}

// Wolken für den Himmel (kein Teil der Strasse, siehe render.js).
// Nur Weiss und ein heller Blauschatten unten.
const WOLKEN_FORMEN = [
  [
    '......WWWW..........',
    '....WWWWWWWW..WWW...',
    '..WWWWWWWWWWWWWWWW..',
    '.WWWWWWWWWWWWWWWWWWW',
    'JJWWWWWWWWWWWWWWWWJJ',
    '..JJJJJJJJJJJJJJJJ..',
  ],
  [
    '.....WWW.....',
    '...WWWWWWWW..',
    '.WWWWWWWWWWW.',
    'JJJWWWWWWWJJJ',
    '..JJJJJJJJJ..',
  ],
  [
    '..........WWWW............',
    '...WWW..WWWWWWWW..........',
    '..WWWWWWWWWWWWWWWWW..WWW..',
    '.WWWWWWWWWWWWWWWWWWWWWWWW.',
    'JWWWWWWWWWWWWWWWWWWWWWWWWJ',
    '.JJJJJJWWWWWWWWWWWJJJJJJJ.',
    '.......JJJJJJJJJJJ........',
  ],
];

const Sprites = {
  // Fertig gezeichnete Bilder: bilder[name][variante] = { normal, gespiegelt }
  bilder: {},
  wolken: [],

  // Breite und Höhe eines Sprites in Metern (ohne Leinwand, damit auch
  // scenery.js schon damit rechnen kann).
  masse(name) {
    const d = SPRITE_DATEN[name];
    const raster = d.varianten[0];
    return { breite: d.hoehe * raster[0].length / raster.length, hoehe: d.hoehe };
  },

  // Alle Raster einmal in Bilder umwandeln. Braucht den Browser (document).
  start() {
    for (const name in SPRITE_DATEN) {
      this.bilder[name] = SPRITE_DATEN[name].varianten.map((raster) => ({
        normal: this.rasterZeichnen(raster, false, name),
        gespiegelt: this.rasterZeichnen(raster, true, name),
      }));
    }
    this.wolken = WOLKEN_FORMEN.map((raster) => this.rasterZeichnen(raster, false, 'wolke'));
  },

  // Ein Textraster Pixel für Pixel auf eine eigene kleine Leinwand malen.
  rasterZeichnen(raster, spiegeln, name) {
    const breite = Math.max(...raster.map((z) => z.length));
    const leinwand = document.createElement('canvas');
    leinwand.width = breite;
    leinwand.height = raster.length;
    const c = leinwand.getContext('2d');
    raster.forEach((zeile, y) => {
      if (zeile.length !== breite) {
        console.warn('Alpen Rally: Sprite "' + name + '", Zeile ' + (y + 1) + ' ist zu kurz.');
      }
      for (let x = 0; x < zeile.length; x++) {
        const farbe = SPRITE_FARBEN[zeile[x]];
        if (!farbe) continue; // "." oder unbekanntes Zeichen = durchsichtig
        c.fillStyle = farbe;
        c.fillRect(spiegeln ? breite - 1 - x : x, y, 1, 1);
      }
    });
    return leinwand;
  },
};
