// Landschaft: verteilt Bäume, Büsche, Felsen, Leitplanken, Schilder usw.
// auf die Strassenstücke. Läuft nur einmal beim Start.
//
// Jeder Abschnitt in track.js hat eine "umgebung". Was in welcher Umgebung
// steht, steht in der Liste UMGEBUNGEN gleich hier unten und kann dort
// frei geändert werden. Dazu kommen automatisch Leitplanken an engen
// Kurven und Kurvenschilder vor Kurven (Einstellungen in config.js).
//
// Der Zufall ist "gezinkt": Er startet immer mit derselben Zahl
// (SZENERIE_SEED in config.js). Darum steht bei jedem Start alles an
// genau derselben Stelle. Wichtig, damit man die Strecke lernen kann.

// Jede Umgebung ist eine Liste von "Reihen". Eine Reihe sind Objekte, die
// entlang der Strasse verteilt werden:
//   abstand: [von, bis] Meter zwischen Bankett und Objekt. Jedes Objekt
//            bekommt einen zufälligen Abstand dazwischen.
//   alle:    im Schnitt steht alle so viele Meter ein Objekt (pro Seite).
//            Kleiner = dichter.
//   seite:   'beide' (wenn weggelassen), 'links' oder 'rechts'
//   regelmaessig: true = kein Zufall, genau alle "alle" Meter ein Stück,
//            immer mit dem Abstand "von" (für Zäune und Leitplanken, die
//            durchgehend aussehen sollen)
//   objekte: welche Sprites (Namen aus sprites.js), mit Gewicht.
//            { fichte_gross: 3, laubbaum: 1 } = dreimal so viele Fichten wie Laubbäume.
const UMGEBUNGEN = {
  // Dichter Fichtenwald: zwei Reihen pro Seite, dazwischen Büsche,
  // dahinter noch mehr Wald, damit es nach Wald und nicht nach Allee aussieht.
  wald: [
    { abstand: [0.4, 2.5], alle: 7,  objekte: { fichte_gross: 4, fichte_klein: 3, laubbaum: 1 } },
    { abstand: [3, 8],     alle: 6,  objekte: { fichte_gross: 5, fichte_klein: 2, laubbaum: 1 } },
    { abstand: [0.3, 3],   alle: 16, objekte: { busch: 1 } },
    { abstand: [9, 30],    alle: 7,  objekte: { fichte_gross: 4, fichte_klein: 1 } },
  ],

  // Offene Weide: rechts ein Weidezaun, dahinter ab und zu Kühe.
  // Vereinzelt Bäume und Büsche, selten ein Wegweiser.
  wiese: [
    { abstand: [2, 2],     alle: 2,   regelmaessig: true, seite: 'rechts', objekte: { zaun: 1 } },
    { abstand: [4, 16],    alle: 45,  seite: 'rechts', objekte: { kuh: 1 } },
    { abstand: [1, 14],    alle: 40,  objekte: { laubbaum: 2, fichte_gross: 1, fichte_klein: 1 } },
    { abstand: [0.4, 9],   alle: 30,  objekte: { busch: 1 } },
    { abstand: [0.5, 1],   alle: 250, seite: 'links', objekte: { wegweiser: 1 } },
    { abstand: [18, 40],   alle: 22,  objekte: { fichte_gross: 2, laubbaum: 1 } },
  ],

  // Felsiges Gelände: Felsbrocken, vereinzelt Fichten, Leitplanke auf der
  // Talseite (links). In engen Kurven kommt aussen sowieso eine dazu.
  fels: [
    { abstand: [0.3, 0.3], alle: 2,  regelmaessig: true, seite: 'links', objekte: { leitplanke: 1 } },
    { abstand: [0.4, 4],   alle: 9,  objekte: { fels_a: 2, fels_b: 2 } },
    { abstand: [4, 14],    alle: 11, objekte: { fels_a: 1, fels_b: 2, fichte_klein: 1 } },
    { abstand: [2, 12],    alle: 28, objekte: { fichte_gross: 1, fichte_klein: 2 } },
    { abstand: [14, 35],   alle: 14, objekte: { fels_b: 1, fichte_gross: 1 } },
  ],

  // Lichter Wald: nur wenige Bäume nahe an der Strasse, weiter Blick,
  // erst weit hinten wieder Wald.
  lichtung: [
    { abstand: [1, 7],     alle: 30,  objekte: { fichte_gross: 2, laubbaum: 2, fichte_klein: 1 } },
    { abstand: [0.4, 6],   alle: 28,  objekte: { busch: 1 } },
    { abstand: [0.5, 1],   alle: 220, seite: 'rechts', objekte: { wegweiser: 1 } },
    { abstand: [22, 40],   alle: 9,   objekte: { fichte_gross: 3, fichte_klein: 1 } },
  ],
};

const Scenery = {
  zufall: null, // Zufallszahlen-Geber (0 bis 1), startet immer gleich
  anzahl: 0,    // wie viele Objekte insgesamt stehen (zur Info)

  start() {
    this.zufall = this.zufallsGenerator(CONFIG.SZENERIE_SEED);
    for (const s of Road.stuecke) s.objekte = [];
    this.anzahl = 0;
    // Reihenfolge ist wichtig: Was zuerst steht, hat Vorrang. Ein Baum, der
    // auf eine Leitplanke käme, wird darum einfach weggelassen.
    this.leitplanken();
    this.regelmaessigeReihen();
    this.kurvenschilder();
    this.zufallsReihen();
  },

  // Leitplanken an der Aussenseite enger Kurven (und Kurven mit Gefälle)
  leitplanken() {
    const L = CONFIG.STUECK_LAENGE;
    for (const a of Road.abschnitte) {
      const staerke = Math.abs(a.kurve);
      const eng = staerke >= CONFIG.LEITPLANKE_AB_STAERKE;
      const bergab = staerke >= CONFIG.LEITPLANKE_GEFAELLE_STAERKE && a.steigung <= -CONFIG.LEITPLANKE_GEFAELLE;
      if (!eng && !bergab) continue;
      const seite = -Math.sign(a.kurve); // Rechtskurve (plus): aussen ist links (minus)
      const von = a.erstesStueck - Math.round(CONFIG.LEITPLANKE_VORLAUF / L);
      const bis = a.erstesStueck + a.anzahl + Math.round(CONFIG.LEITPLANKE_NACHLAUF / L);
      this.reiheZiehen(von, bis, seite, 'leitplanke', CONFIG.LEITPLANKE_ABSTAND);
    }
  },

  // Zäune und Leitplanken aus den Umgebungen (Reihen mit regelmaessig: true)
  regelmaessigeReihen() {
    for (const a of Road.abschnitte) {
      for (const reihe of UMGEBUNGEN[this.umgebungVon(a)]) {
        if (!reihe.regelmaessig) continue;
        const name = Object.keys(reihe.objekte)[0];
        for (const seite of this.seiten(reihe)) {
          this.reiheZiehen(a.erstesStueck, a.erstesStueck + a.anzahl, seite, name, reihe.abstand[0], reihe.alle);
        }
      }
    }
  },

  // Durchgehende Reihe (Leitplanke, Zaun) von Stück "von" bis vor Stück "bis".
  // Gesetzt wird nur auf jedes n-te Stück, gezählt ab Streckenbeginn. So
  // passen Stücke aus verschiedenen Quellen (Kurve, Umgebung) nahtlos
  // aneinander und liegen nie doppelt übereinander.
  reiheZiehen(von, bis, seite, name, luecke, alle) {
    const L = CONFIG.STUECK_LAENGE;
    const schritt = Math.max(1, Math.round((alle || SPRITE_DATEN[name].laenge || L) / L));
    for (let i = von; i < bis; i++) {
      if (((i % schritt) + schritt) % schritt !== 0) continue;
      this.platzieren(i, seite, name, luecke);
    }
  },

  // Gelbe Kurventafel vor jeder Kurve ab Stärke KURVENSCHILD_AB_STAERKE,
  // an der Aussenseite, Pfeil in Kurvenrichtung.
  kurvenschilder() {
    const L = CONFIG.STUECK_LAENGE;
    for (const a of Road.abschnitte) {
      if (Math.abs(a.kurve) < CONFIG.KURVENSCHILD_AB_STAERKE) continue;
      const seite = -Math.sign(a.kurve);
      const i = a.erstesStueck - Math.round(CONFIG.KURVENSCHILD_VORLAUF / L);
      // Steht dort schon eine Leitplanke, kommt das Schild dahinter
      let luecke = CONFIG.KURVENSCHILD_ABSTAND;
      if (this.hatLeitplanke(i, seite)) {
        luecke = CONFIG.LEITPLANKE_ABSTAND + SPRITE_DATEN.leitplanke.kollision + 0.4;
      }
      // Gezeichnet ist der Pfeil nach links. Für Rechtskurven spiegeln.
      const gespiegelt = a.kurve > 0;
      // Ist der Platz besetzt (z. B. Weidezaun), ein paar Meter früher oder
      // später probieren, notfalls näher an der Strasse
      versuche: for (const l of [luecke, CONFIG.SZENERIE_MIN_ABSTAND]) {
        for (const verschiebung of [0, -1, 1, -2, 2]) {
          if (this.platzieren(i + verschiebung, seite, 'kurvenschild', l, gespiegelt)) break versuche;
        }
      }
    }
  },

  // Bäume, Büsche, Felsen, Kühe ...: zufällig verteilt, Stück für Stück
  zufallsReihen() {
    const L = CONFIG.STUECK_LAENGE;
    for (const stueck of Road.stuecke) {
      const a = Road.abschnitte[stueck.abschnittNr];
      const dichte = a.dichte * CONFIG.SZENERIE_DICHTE;
      for (const reihe of UMGEBUNGEN[this.umgebungVon(a)]) {
        if (reihe.regelmaessig) continue;
        // Wahrscheinlichkeit, dass auf diesem Stück (L Meter) eins steht
        const chance = Math.min(L / reihe.alle * dichte, 1);
        for (const seite of this.seiten(reihe)) {
          if (this.zufall() >= chance) continue;
          const name = this.auswaehlen(reihe.objekte);
          const [von, bis] = reihe.abstand;
          this.platzieren(stueck.index, seite, name, von + this.zufall() * (bis - von));
        }
      }
    }
  },

  // Ein Objekt auf Stück i stellen. seite: -1 = links, +1 = rechts.
  // luecke: Meter zwischen Bankett und Objekt.
  // gespiegelt: true/false erzwingt die Richtung, sonst Zufall (wenn erlaubt).
  // Ergebnis: true = steht, false = Platz war schon besetzt.
  platzieren(i, seite, name, luecke, gespiegelt) {
    const L = CONFIG.STUECK_LAENGE;
    const n = Road.stuecke.length;
    const index = ((i % n) + n) % n;
    const d = SPRITE_DATEN[name];
    const masse = Sprites.masse(name);
    const rand = CONFIG.STRASSE_HALBE_BREITE + CONFIG.BANKETT_BREITE;
    // Nie auf Strasse oder Bankett
    const innen = rand + Math.max(luecke, CONFIG.SZENERIE_MIN_ABSTAND);
    const kb = d.kollision / 2;

    // Seitliche Lage, gemessen als Abstand von der Strassenmitte (ohne Vorzeichen):
    //   mitte:  Mitte des Bilds (bei 'innen' die strassenseitige Kante)
    //   kMitte: Mitte des Bereichs, der beim Zusammenstoss zählt
    //   belegt: Bereich, der für andere Objekte gesperrt ist. Bei Bäumen
    //           etwas schmaler als das Bild, Kronen dürfen sich überlappen.
    let mitte, kMitte, belegt;
    if (d.anker === 'innen') {
      mitte = innen;
      kMitte = innen + kb;
      belegt = [innen, innen + d.kollision];
    } else {
      mitte = innen + masse.breite / 2;
      kMitte = mitte;
      belegt = [mitte - masse.breite * 0.35, mitte + masse.breite * 0.35];
    }
    // Ausdehnung entlang der Strasse (ab Stückanfang)
    const zVon = d.laenge ? 0 : -kb;
    const zBis = d.laenge ? d.laenge : kb;

    // Steht in der Nähe schon etwas auf demselben Platz?
    for (let j = index - 3; j <= index + 3; j++) {
      for (const o of Road.stueck(j).objekte) {
        if (o.seite !== seite) continue;
        const dz = (j - index) * L;
        // 1 m Luft zwischen Bäumen usw. Durchgehende Reihen (Leitplanke,
        // Zaun) dürfen sich lückenlos berühren.
        const luft = d.laenge || o.laengs ? 0 : 1;
        const ueberlappenZ = dz + o.zVon - luft < zBis && dz + o.zBis + luft > zVon;
        const ueberlappenX = o.belegt[0] < belegt[1] && o.belegt[1] > belegt[0];
        if (ueberlappenZ && ueberlappenX) return false;
      }
    }

    const varianten = d.varianten.length;
    if (gespiegelt === undefined) gespiegelt = d.spiegeln && this.zufall() < 0.5;
    Road.stuecke[index].objekte.push({
      name: name,
      variante: Math.floor(this.zufall() * varianten) % varianten,
      gespiegelt: gespiegelt,
      seite: seite,
      x: seite * mitte,        // seitliche Position in Metern (minus = links), siehe "mitte" oben
      breite: masse.breite,    // Grösse in Metern
      hoehe: masse.hoehe,
      anker: d.anker,
      fest: d.fest,
      kx: seite * kMitte,      // Mitte des Zusammenstoss-Bereichs (Meter, mit Vorzeichen)
      kb: kb,                  // halbe Breite des Zusammenstoss-Bereichs
      zVon: zVon,              // Ausdehnung entlang der Strasse, ab Stückanfang
      zBis: zBis,
      laengs: !!d.laenge,      // true = Stück einer durchgehenden Reihe (Leitplanke, Zaun)
      belegt: belegt,
    });
    this.anzahl++;
    return true;
  },

  hatLeitplanke(i, seite) {
    for (let j = i - 2; j <= i; j++) {
      for (const o of Road.stueck(j).objekte) {
        if (o.name === 'leitplanke' && o.seite === seite) return true;
      }
    }
    return false;
  },

  // Unbekannte Umgebung (Tippfehler in track.js)? Dann Wiese und Warnung.
  umgebungVon(abschnitt) {
    if (UMGEBUNGEN[abschnitt.umgebung]) return abschnitt.umgebung;
    console.warn('Alpen Rally: Unbekannte Umgebung "' + abschnitt.umgebung + '" bei "' +
      abschnitt.name + '". Erlaubt: ' + Object.keys(UMGEBUNGEN).join(', ') + '. Nehme wiese.');
    abschnitt.umgebung = 'wiese';
    return 'wiese';
  },

  seiten(reihe) {
    if (reihe.seite === 'links') return [-1];
    if (reihe.seite === 'rechts') return [1];
    return [-1, 1];
  },

  // Einen Namen aus { name: gewicht, ... } auslosen
  auswaehlen(objekte) {
    let summe = 0;
    for (const name in objekte) summe += objekte[name];
    let wurf = this.zufall() * summe;
    for (const name in objekte) {
      wurf -= objekte[name];
      if (wurf < 0) return name;
    }
    return Object.keys(objekte)[0];
  },

  // Einfacher Zufallsgenerator ("Mulberry32"). Math.random() geht nicht,
  // weil es jedes Mal andere Zahlen liefert. Dieser hier liefert bei
  // gleicher Startzahl immer dieselbe Folge.
  zufallsGenerator(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },
};
