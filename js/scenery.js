// Landschaft: verteilt Bäume, Büsche, Felsen, Leitplanken, Schilder usw.
// auf die Strassenstücke. Läuft nur einmal beim Start.
//
// Jeder Abschnitt in track.js hat eine "umgebung". Was in welcher Umgebung
// steht, steht in der Liste UMGEBUNGEN gleich hier unten und kann dort
// frei geändert werden. Dazu kommen automatisch Leitplanken an engen
// Kurven und auf der Talseite, und Temposchilder vor Kurven (Einstellungen
// in config.js).
//
// Ausserdem hat jeder Abschnitt ein "gelaende" (Felswand, Abhang ins Tal).
// Hier wird für jedes Strassenstück ausgerechnet, wie hoch die Wand bzw. wie
// weit offen der Abhang auf jeder Seite ist (0 = gar nicht, 1 = ganz).
// Gezeichnet wird beides in render.js.
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

  // Felsiges Gelände: Felsbrocken, vereinzelt Fichten. Leitplanken kommen
  // automatisch (Aussenseite enger Kurven, Talseite aus "gelaende").
  fels: [
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

// Was die Werte von "gelaende" in track.js für links und rechts bedeuten.
// null = auf dieser Seite gilt einfach die Umgebung.
const GELAENDE = {
  keins:                 { links: null,   rechts: null   },
  wand_links_tal_rechts: { links: 'wand', rechts: 'tal'  },
  wand_rechts_tal_links: { links: 'tal',  rechts: 'wand' },
  tal_links:             { links: 'tal',  rechts: null   },
  tal_rechts:            { links: null,   rechts: 'tal'  },
};

// Auf der Wandseite stehen keine Bäume, nur ab und zu ein Fels oder Busch
// im Geröllstreifen vor der Wand. Gleicher Aufbau wie eine Reihe oben.
const WAND_REIHE = { abstand: [0.3, 0.5], alle: 30, objekte: { fels_a: 2, fels_b: 1, busch: 1 } };

const Scenery = {
  zufall: null, // Zufallszahlen-Geber (0 bis 1), startet immer gleich
  anzahl: 0,    // wie viele Objekte insgesamt stehen (zur Info)

  start() {
    this.zufall = this.zufallsGenerator(CONFIG.SZENERIE_SEED);
    for (const s of Road.stuecke) {
      s.objekte = [];
      s.planke = [false, false]; // steht hier eine Leitplanke? [links, rechts] (für render.js)
    }
    this.anzahl = 0;
    this.gelaendeBerechnen();
    // Reihenfolge ist wichtig: Was zuerst steht, hat Vorrang. Ein Baum, der
    // auf eine Leitplanke käme, wird darum einfach weggelassen.
    this.leitplanken();
    this.waende();
    this.regelmaessigeReihen();
    this.temposchilder();
    this.zufallsReihen();
  },

  // --- Gelände: Felswand und Abhang ---
  // Für jedes Stück und jede Seite eine Zahl von 0 bis 1:
  //   stueck.wand[seite]: Höhe der Felswand (1 = volle WAND_HOEHE)
  //   stueck.tal[seite]:  wie weit der Abhang offen ist (1 = Kante direkt hinter der Leitplanke)
  // seite: 0 = links, 1 = rechts. Der Wert gilt am Anfang des Stücks.
  // Die Übergänge liegen innen im Abschnitt: Die Wand beginnt an der
  // Abschnittsgrenze bei 0 und ist nach GELAENDE_UEBERGANG Metern ganz hoch.
  // Folgen zwei Abschnitte mit Wand auf derselben Seite, geht sie einfach weiter.
  gelaendeBerechnen() {
    const L = CONFIG.STUECK_LAENGE;
    const n = Road.stuecke.length;
    const seiten = ['links', 'rechts'];
    for (const s of Road.stuecke) {
      s.wand = [0, 0];
      s.tal = [0, 0];
    }
    for (const art of ['wand', 'tal']) {
      for (let nr = 0; nr < 2; nr++) {
        // 1) Hat Stück i auf dieser Seite diese Geländeart? (1 oder 0)
        const an = Road.stuecke.map((s) => {
          const g = this.gelaendeVon(Road.abschnitte[s.abschnittNr]);
          return GELAENDE[g][seiten[nr]] === art ? 1 : 0;
        });
        // 2) Grenzen, an denen der Wert 0 ist: Anfang von Stück i, wenn
        //    Stück i oder das Stück davor die Geländeart nicht hat.
        // 3) Abstand (in Stücken) zur nächsten solchen Grenze, vorwärts und
        //    rückwärts. Rundkurs: zweimal herum, damit es an der Naht stimmt.
        const abstand = new Array(n).fill(Infinity);
        let letzte = Infinity;
        for (let k = 0; k < 2 * n; k++) {
          const i = k % n;
          if (!an[i] || !an[(i - 1 + n) % n]) letzte = 0; else letzte++;
          abstand[i] = Math.min(abstand[i], letzte);
        }
        letzte = Infinity;
        for (let k = 2 * n - 1; k >= 0; k--) {
          const i = k % n;
          if (!an[i] || !an[(i - 1 + n) % n]) letzte = 0; else letzte++;
          abstand[i] = Math.min(abstand[i], letzte);
        }
        // 4) Daraus ein weicher Anstieg von 0 auf 1 über GELAENDE_UEBERGANG Meter
        for (let i = 0; i < n; i++) {
          const t = Math.min(abstand[i] * L / CONFIG.GELAENDE_UEBERGANG, 1);
          Road.stuecke[i][art][nr] = Road.weich(0, 1, t);
        }
      }
    }
    this.gelaendeFormen();
  },

  // Aussehen von Wand und Tal pro Stück: ausgefranste Oberkante, leicht
  // gewellte Gesteinsschichten, Risse und Grasbüschel; im Tal Felder und
  // kleine Bäume. Eigener Zufall mit fester Startzahl, damit alles bei
  // jedem Start gleich aussieht.
  gelaendeFormen() {
    const zufall = this.zufallsGenerator(CONFIG.SZENERIE_SEED + 1);
    const n = Road.stuecke.length;
    // Grobe Wellen (alle 8 Stücke = 16 m ein neuer Wert, dazwischen weich)
    // plus feines Zittern pro Stück: so sieht die Kante felsig aus.
    const grob = [];
    for (let k = 0; k <= Math.ceil(n / 8); k++) grob.push(zufall() * 2 - 1);
    // Felder im Tal: immer ein paar Stücke lang dieselbe Farbe (10 bis 50 m)
    let feld = 0;
    let feldRest = 0;
    for (const s of Road.stuecke) {
      if (feldRest <= 0) {
        feld = Math.floor(zufall() * CONFIG.FARBEN.TAL_FELDER.length);
        feldRest = 5 + Math.floor(zufall() * 20);
      }
      feldRest--;
      s.talFeld = feld; // Nummer der Farbe in TAL_FELDER

      // Oberkante der Wand: grobe Welle plus Zittern
      const k = Math.floor(s.index / 8);
      const welle = Road.weich(grob[k], grob[k + 1], (s.index % 8) / 8);
      const zittern = zufall() * 2 - 1;
      s.wandOben = 1 + CONFIG.WAND_RAUSCHEN * (0.65 * welle + 0.35 * zittern);
      // Schichtgrenzen in Metern über der Strasse, je ca. +-0.8 m gewellt
      s.wandSchichten = CONFIG.WAND_SCHICHTEN.map((anteil) =>
        anteil * CONFIG.WAND_HOEHE + (zufall() * 2 - 1) * 0.8);
      // Riss: von welcher bis zu welcher Höhe (Anteil der Wandhöhe), sonst null
      s.wandRiss = null;
      if (zufall() < CONFIG.WAND_RISSE) {
        const von = 0.1 + zufall() * 0.4;
        s.wandRiss = [von, von + 0.15 + zufall() * 0.3];
      }
      // Grasbüschel: auf welcher Schichtgrenze (0, 1 oder 2), sonst -1
      s.wandGras = zufall() < CONFIG.WAND_GRAS ? Math.floor(zufall() * CONFIG.WAND_SCHICHTEN.length) : -1;
      // Abbruchkante zum Tal [links, rechts], Meter ab Strassenmitte (Infinity = kein Abhang)
      s.kante = [this.talKante(s.tal[0]), this.talKante(s.tal[1])];
      // Kleiner Baum am Hang oder unten im Tal [links, rechts]: so viele Meter
      // hinter der Kante, 0 = keiner. Erst ab 35 m, damit die Spitze sicher
      // unter der Strassenhöhe bleibt.
      s.talBaum = [0, 1].map(() => (zufall() < CONFIG.TAL_BAUM_DICHTE ? 35 + zufall() * 150 : 0));
    }
  },

  // Unbekanntes Gelände (Tippfehler in track.js)? Dann 'keins' und Warnung.
  gelaendeVon(abschnitt) {
    if (GELAENDE[abschnitt.gelaende]) return abschnitt.gelaende;
    console.warn('Alpen Rally: Unbekanntes Gelände "' + abschnitt.gelaende + '" bei "' +
      abschnitt.name + '". Erlaubt: ' + Object.keys(GELAENDE).join(', ') + '. Nehme keins.');
    abschnitt.gelaende = 'keins';
    return 'keins';
  },

  // Wo ist die Abbruchkante zum Tal? Meter ab Strassenmitte, für einen
  // Öffnungswert t (0 bis 1). Ganz offen: direkt hinter dem Randstreifen.
  // Beim Öffnen kommt die Kante von weit draussen heran (bei t = 0 unendlich
  // weit weg, also gar kein Abhang). So gibt es keinen Sprung.
  talKante(t) {
    if (t < 0.02) return Infinity;
    const rand = CONFIG.STRASSE_HALBE_BREITE + CONFIG.BANKETT_BREITE + CONFIG.TAL_RANDSTREIFEN;
    return rand + CONFIG.TAL_OEFFNUNG * (1 - t) / t;
  },

  // Fuss der Felswand, Meter ab Strassenmitte
  wandFuss() {
    return CONFIG.STRASSE_HALBE_BREITE + CONFIG.BANKETT_BREITE + CONFIG.WAND_ABSTAND;
  },

  // Unsichtbare Einträge für den Zusammenstoss mit der Felswand
  waende() {
    for (const s of Road.stuecke) {
      for (let nr = 0; nr < 2; nr++) {
        if (s.wand[nr] < CONFIG.WAND_KOLLISION_AB) continue;
        this.platzieren(s.index, nr === 0 ? -1 : 1, 'wand', CONFIG.WAND_ABSTAND);
      }
    }
  },

  // Darf auf Stück i auf dieser Seite ein Objekt stehen, das von "innen"
  // bis "aussen" reicht (Meter ab Strassenmitte)? Regeln fürs Gelände:
  // - Talseite: alles muss mindestens 1 m vor der Abbruchkante stehen
  //   (ganz offen bleibt also nur der Randstreifen, dort steht die Leitplanke).
  //   Hohe Bäume erst ab TAL_BAUMFREI Metern, auch beim Übergang.
  // - Wandseite: keine Bäume vor der Wand, nichts halb in der Wand, und
  //   hinter einer schon halbhohen Wand nichts mehr (sieht man nicht).
  gelaendeErlaubt(i, seite, name, innen, aussen) {
    const s = Road.stueck(i);
    const nr = seite < 0 ? 0 : 1;
    if (s.tal[nr] > 0) {
      if (aussen > this.talKante(s.tal[nr]) - 1) return false;
      if (SPRITE_DATEN[name].baum && innen < CONFIG.TAL_BAUMFREI) return false;
    }
    if (s.wand[nr] > 0) {
      const fuss = this.wandFuss();
      if (innen < fuss && (SPRITE_DATEN[name].baum || aussen > fuss)) return false;
      if (innen >= fuss && s.wand[nr] >= 0.5) return false;
    }
    return true;
  },

  // Wie gelaendeErlaubt, aber mit dem Abstand zum Bankett (wie bei platzieren)
  passtInsGelaende(i, seite, name, luecke) {
    const innen = CONFIG.STRASSE_HALBE_BREITE + CONFIG.BANKETT_BREITE +
      Math.max(luecke, CONFIG.SZENERIE_MIN_ABSTAND);
    return this.gelaendeErlaubt(i, seite, name, innen, innen + Sprites.masse(name).breite);
  },

  // Leitplanken an der Aussenseite enger Kurven (und Kurven mit Gefälle),
  // dazu überall auf der Talseite
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
    // Talseite: überall, wo der Abhang auch nur ein bisschen offen ist
    // (am Anfang oder am Ende des Stücks)
    for (const s of Road.stuecke) {
      const naechstes = Road.stueck(s.index + 1);
      for (let nr = 0; nr < 2; nr++) {
        if (s.tal[nr] > 0 || naechstes.tal[nr] > 0) {
          this.platzieren(s.index, nr === 0 ? -1 : 1, 'leitplanke', CONFIG.LEITPLANKE_ABSTAND);
        }
      }
    }
  },

  // Zäune und Leitplanken aus den Umgebungen (Reihen mit regelmaessig: true)
  regelmaessigeReihen() {
    for (const a of Road.abschnitte) {
      for (const reihe of UMGEBUNGEN[this.umgebungVon(a)]) {
        if (!reihe.regelmaessig) continue;
        const name = Object.keys(reihe.objekte)[0];
        for (const seite of this.seiten(reihe)) {
          this.reiheZiehen(a.erstesStueck, a.erstesStueck + a.anzahl, seite, name, reihe.abstand[0], reihe.alle, true);
        }
      }
    }
  },

  // Durchgehende Reihe (Leitplanke, Zaun) von Stück "von" bis vor Stück "bis".
  // Gesetzt wird nur auf jedes n-te Stück, gezählt ab Streckenbeginn. So
  // passen Stücke aus verschiedenen Quellen (Kurve, Umgebung) nahtlos
  // aneinander und liegen nie doppelt übereinander.
  // gelaendePruefen: true = nur dort, wo das Gelände es erlaubt (Zaun nicht ins Tal)
  reiheZiehen(von, bis, seite, name, luecke, alle, gelaendePruefen) {
    const L = CONFIG.STUECK_LAENGE;
    const schritt = Math.max(1, Math.round((alle || SPRITE_DATEN[name].laenge || L) / L));
    for (let i = von; i < bis; i++) {
      if (((i % schritt) + schritt) % schritt !== 0) continue;
      if (gelaendePruefen && !this.passtInsGelaende(i, seite, name, luecke)) continue;
      this.platzieren(i, seite, name, luecke);
    }
  },

  // Rundes Temposchild ca. TEMPOSCHILD_VORLAUF Meter vor jeder Kurve, deren
  // Stärke in TEMPOSCHILD_ZAHLEN steht. Immer rechts der Strasse.
  // Reine Dekoration: Das Tempo des Autos wird nicht beeinflusst.
  temposchilder() {
    const L = CONFIG.STUECK_LAENGE;
    const seite = 1; // rechts in Fahrtrichtung
    for (const a of Road.abschnitte) {
      const zahl = CONFIG.TEMPOSCHILD_ZAHLEN[Math.round(Math.abs(a.kurve))];
      if (!zahl) continue;
      const name = 'tempo' + zahl;
      const i = a.erstesStueck - Math.round(CONFIG.TEMPOSCHILD_VORLAUF / L);
      // Ist der Platz besetzt (z. B. Weidezaun), ein paar Meter früher oder
      // später probieren, notfalls näher an der Strasse
      versuche: for (const naeher of [false, true]) {
        for (const verschiebung of [0, -1, 1, -2, 2]) {
          // Steht dort eine Leitplanke, kommt das Schild dahinter
          let luecke = naeher ? CONFIG.SZENERIE_MIN_ABSTAND : CONFIG.TEMPOSCHILD_ABSTAND;
          if (this.hatLeitplanke(i + verschiebung, seite)) {
            luecke = CONFIG.LEITPLANKE_ABSTAND + SPRITE_DATEN.leitplanke.kollision + 0.4;
          }
          if (this.platzieren(i + verschiebung, seite, name, luecke)) break versuche;
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
        this.reiheVersuchen(stueck, reihe, this.seiten(reihe), dichte);
      }
      // Vor einer (fast) fertigen Felswand: ab und zu ein Fels oder Busch
      for (let nr = 0; nr < 2; nr++) {
        if (stueck.wand[nr] >= 0.5) this.reiheVersuchen(stueck, WAND_REIHE, [nr === 0 ? -1 : 1], 1);
      }
    }
  },

  // Auf einem Stück per Zufall ein Objekt einer Reihe hinstellen (je Seite)
  reiheVersuchen(stueck, reihe, seiten, dichte) {
    // Wahrscheinlichkeit, dass auf diesem Stück (L Meter) eins steht
    const chance = Math.min(CONFIG.STUECK_LAENGE / reihe.alle * dichte, 1);
    for (const seite of seiten) {
      if (this.zufall() >= chance) continue;
      const name = this.auswaehlen(reihe.objekte);
      const [von, bis] = reihe.abstand;
      const luecke = von + this.zufall() * (bis - von);
      if (!this.passtInsGelaende(stueck.index, seite, name, luecke)) continue;
      this.platzieren(stueck.index, seite, name, luecke);
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
    if (name === 'leitplanke') Road.stuecke[index].planke[seite < 0 ? 0 : 1] = true;
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
      unsichtbar: !!d.unsichtbar, // Leitplanke und Wand: kein Bild, nur Zusammenstoss
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
