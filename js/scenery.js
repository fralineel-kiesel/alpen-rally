// Landschaft: verteilt Bäume, Büsche, Felsen, Leitplanken, Schilder usw.
// auf die Strassenstücke. Läuft nur einmal beim Start.
//
// Jeder Abschnitt in track.js hat eine "umgebung". Was in welcher Umgebung
// steht, steht in der Liste UMGEBUNGEN gleich hier unten und kann dort
// frei geändert werden. Dazu kommen automatisch Leitplanken an engen
// Kurven und auf der Talseite, und Temposchilder vor Kurven (Einstellungen
// in config.js).
//
// Ausserdem hat jeder Abschnitt ein "gelaende" (Hang, Abhang ins Tal).
// Hier wird für jedes Strassenstück ausgerechnet, wie weit der Hang
// gewachsen bzw. wie weit offen der Abhang auf jeder Seite ist (0 = gar
// nicht, 1 = ganz), und wie der Querschnitt des Hangs dort genau aussieht.
// Auf den Hang kommen eigene Bäume, Büsche und Felsen (HANG_BEWUCHS).
// Gezeichnet wird alles in render.js.
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
//   regelmaessig: true = kein Zufall, genau alle "alle" Meter ein Stück
//            (für Bänder wie den Zaun, die durchgehend sein sollen). Der
//            Abstand zur Strasse kommt dann aus BAENDER in config.js.
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
    {                      alle: 2,   regelmaessig: true, seite: 'rechts', objekte: { zaun: 1 } },
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
  wand_links_tal_rechts: { links: 'hang', rechts: 'tal'  },
  wand_rechts_tal_links: { links: 'tal',  rechts: 'hang' },
  tal_links:             { links: 'tal',  rechts: null   },
  tal_rechts:            { links: null,   rechts: 'tal'  },
};

// Bewuchs auf dem Hang ("wand_..." in track.js). Auf der Hangseite stehen
// die normalen Reihen von oben nicht (dort ist ja der Hang), sondern diese
// hier. Sie stehen nicht auf Strassenhöhe, sondern auf dem Hang selbst:
//   lage: [von, bis] wo auf dem Querschnitt (HANG_PROFIL in config.js):
//         0 = P0 (unten am Felsfuss), 1 = P1, 2 = P2, 3 = P3, 4 = P4 (Kamm).
//         2.5 = halbwegs zwischen P2 und P3. Fels ist 0 bis 2, Böschung 2 bis 4.
//   alle, objekte: wie bei den Reihen oben (alle = im Schnitt alle so viele Meter eins)
// Auf dem Fels (0 bis 2) nur Felsen und vereinzelt Büsche, Bäume nur auf der Böschung.
const HANG_BEWUCHS = {
  wald: [
    { lage: [2.1, 3.9],  alle: 3,  objekte: { fichte_gross: 5, fichte_klein: 3, laubbaum: 1 } },
    { lage: [2.05, 3.7], alle: 10, objekte: { busch: 1 } },
    { lage: [0.2, 1.9],  alle: 30, objekte: { fels_a: 2, fels_b: 1, busch: 1 } },
  ],
  wiese: [
    { lage: [2.1, 3.9],  alle: 14, objekte: { laubbaum: 2, fichte_gross: 1, fichte_klein: 1 } },
    { lage: [2.05, 3.7], alle: 12, objekte: { busch: 1 } },
    { lage: [0.2, 1.9],  alle: 30, objekte: { fels_a: 2, fels_b: 1, busch: 1 } },
  ],
  fels: [
    { lage: [2.1, 3.9],  alle: 12, objekte: { fichte_gross: 2, fichte_klein: 3 } },
    { lage: [2.05, 3.7], alle: 16, objekte: { fels_b: 1, busch: 1 } },
    { lage: [0.2, 1.9],  alle: 9,  objekte: { fels_a: 2, fels_b: 2, busch: 1 } },
  ],
  lichtung: [
    { lage: [2.1, 3.9],  alle: 7,  objekte: { fichte_gross: 3, laubbaum: 2, fichte_klein: 1 } },
    { lage: [2.05, 3.7], alle: 14, objekte: { busch: 1 } },
    { lage: [0.2, 1.9],  alle: 30, objekte: { fels_a: 2, fels_b: 1, busch: 1 } },
  ],
};

const Scenery = {
  zufall: null, // Zufallszahlen-Geber (0 bis 1), startet immer gleich
  anzahl: 0,    // wie viele Objekte insgesamt stehen (zur Info)

  start() {
    this.zufall = this.zufallsGenerator(CONFIG.SZENERIE_SEED);
    for (const s of Road.stuecke) {
      s.objekte = [];
      s.baender = [[], []]; // welche Bänder (Leitplanke, Zaun) hier stehen, [links, rechts] (für render.js)
      s.hangObjekte = [];   // Bäume, Büsche, Felsen auf dem Hang (stehen auf dem Hang, nicht auf Strassenhöhe)
    }
    this.anzahl = 0;
    this.hangAufbau();
    this.gelaendeBerechnen();
    // Reihenfolge ist wichtig: Was zuerst steht, hat Vorrang. Ein Baum, der
    // auf eine Leitplanke käme, wird darum einfach weggelassen.
    this.leitplanken();
    this.regelmaessigeReihen();
    this.temposchilder();
    this.hangKollision();
    this.zufallsReihen();
    this.hangBewuchs();
  },

  // --- Gelände: Hang und Abhang ---
  // Für jedes Stück und jede Seite eine Zahl von 0 bis 1:
  //   stueck.hang[seite]: wie weit der Hang gewachsen ist (1 = voller Querschnitt,
  //                       0 = liegt flach am Bankett)
  //   stueck.tal[seite]:  wie weit der Abhang offen ist (1 = Kante direkt hinter der Leitplanke)
  // seite: 0 = links, 1 = rechts. Der Wert gilt am Anfang des Stücks.
  // Die Übergänge liegen innen im Abschnitt: Der Hang beginnt an der
  // Abschnittsgrenze bei 0 und ist nach HANG_UEBERGANG Metern ganz gewachsen
  // (Abhang: GELAENDE_UEBERGANG). So entsteht ein Keil statt einer Kante.
  // Folgen zwei Abschnitte mit Hang auf derselben Seite, geht er einfach weiter.
  // Wechselt der Hang die Seite, läuft der alte am Ende seines Abschnitts aus,
  // und der neue wächst am Anfang des nächsten heraus.
  gelaendeBerechnen() {
    const L = CONFIG.STUECK_LAENGE;
    const n = Road.stuecke.length;
    const seiten = ['links', 'rechts'];
    for (const s of Road.stuecke) {
      s.hang = [0, 0];
      s.tal = [0, 0];
    }
    for (const art of ['hang', 'tal']) {
      const uebergang = art === 'hang' ? CONFIG.HANG_UEBERGANG : CONFIG.GELAENDE_UEBERGANG;
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
        // 4) Daraus ein weicher Anstieg von 0 auf 1 über "uebergang" Meter
        //    (langsam los, schnell in der Mitte, langsam am Ende)
        for (let i = 0; i < n; i++) {
          const t = Math.min(abstand[i] * L / uebergang, 1);
          Road.stuecke[i][art][nr] = Road.weich(0, 1, t);
        }
      }
    }
    this.gelaendeFormen();
  },

  // Aussehen von Hang und Tal pro Stück: leicht unruhiger Kamm, schräge
  // Gesteinsschichten, Risse und Grasflecken; im Tal Felder und kleine
  // Bäume. Eigener Zufall mit fester Startzahl, damit alles bei jedem Start
  // gleich aussieht. (Die Zufallszahlen werden in derselben Reihenfolge
  // gezogen wie früher für die Felswand, darum sieht das Tal genau gleich aus.)
  gelaendeFormen() {
    const zufall = this.zufallsGenerator(CONFIG.SZENERIE_SEED + 1);
    const n = Road.stuecke.length;
    // Grobe Wellen (alle 8 Stücke = 16 m ein neuer Wert, dazwischen weich)
    // plus feines Zittern pro Stück: so ist der Kamm nicht kerzengerade.
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

      // Kamm des Hangs: grobe Welle plus Zittern (Faktor für die Höhe von P4)
      const k = Math.floor(s.index / 8);
      const welle = Road.weich(grob[k], grob[k + 1], (s.index % 8) / 8);
      const zittern = zufall() * 2 - 1;
      s.hangKamm = 1 + CONFIG.HANG_KAMM_RAUSCHEN * (0.65 * welle + 0.35 * zittern);
      // Gesteinsschichten: Lage im Band (0 bis 1). Eine lange, weiche Welle
      // entlang der Strasse lässt sie schräg laufen, dazu ein ganz kleines Zittern.
      const meter = s.index * CONFIG.STUECK_LAENGE;
      s.hangSchichten = [0, 1, 2].map((nr) => {
        const zitter = (zufall() * 2 - 1) * 0.02;
        if (nr >= CONFIG.HANG_SCHICHTEN.length) return null;
        const sch = CONFIG.HANG_SCHICHTEN[nr];
        const welleS = Math.sin(2 * Math.PI * meter / CONFIG.HANG_SCHICHT_WELLE + nr * 2.1);
        const mitte = (sch.von + sch.bis) / 2 + CONFIG.HANG_SCHICHT_SCHWANKUNG * welleS + zitter;
        const halb = (sch.bis - sch.von) / 2;
        return [Math.max(mitte - halb, 0.02), Math.min(mitte + halb, 0.98)];
      });
      // Riss im Fels: von welcher bis zu welcher Höhe (Anteil der Felshöhe P0 bis P2), sonst null
      s.hangRiss = null;
      if (zufall() < CONFIG.HANG_RISSE) {
        const von = 0.1 + zufall() * 0.4;
        s.hangRiss = [von, von + 0.15 + zufall() * 0.3];
      }
      // Grasfleck im helleren Gestein (P1-P2): auf welcher Höhe im Band (0 bis 1), sonst -1
      s.hangGras = zufall() < CONFIG.HANG_GRAS ? 0.15 + 0.25 * Math.floor(zufall() * 3) : -1;
      // Abbruchkante zum Tal [links, rechts], Meter ab Strassenmitte (Infinity = kein Abhang)
      s.kante = [this.talKante(s.tal[0]), this.talKante(s.tal[1])];
      // Kleiner Baum am Hang oder unten im Tal [links, rechts]: so viele Meter
      // hinter der Kante, 0 = keiner. Erst ab 35 m, damit die Spitze sicher
      // unter der Strassenhöhe bleibt.
      s.talBaum = [0, 1].map(() => (zufall() < CONFIG.TAL_BAUM_DICHTE ? 35 + zufall() * 150 : 0));
    }
    // Querschnitt des Hangs für jedes Stück und jede Seite ausrechnen
    for (const s of Road.stuecke) {
      s.hangU = [new Float32Array(this.hangPunkte), new Float32Array(this.hangPunkte)];
      s.hangH = [new Float32Array(this.hangPunkte), new Float32Array(this.hangPunkte)];
      for (let nr = 0; nr < 2; nr++) this.hangQuerschnitt(s, nr);
    }
  },

  // --- Querschnitt des Hangs ---
  // Der Hang ist eine Liste von Punkten, von innen (Bankettrand, Strassenhöhe)
  // nach aussen und oben. Zwischen zwei Punkten liegt jeweils eine Fläche
  // mit einer Farbe. Zu den Punkten aus HANG_PROFIL kommen je zwei Punkte
  // für jede Gesteinsschicht (Unter- und Oberkante). Der Aufbau ist bei
  // jedem Stück gleich, nur die Zahlen ändern sich. Darum passen zwei
  // benachbarte Stücke Punkt für Punkt aneinander (render.js zeichnet von
  // Punkt k am nahen Ende zu Punkt k am fernen Ende).
  // Ergebnis (einmal beim Start):
  //   hangFlaechen[j]: Farbe der Fläche zwischen Punkt j und j+1, als
  //                    { band, schicht } (schicht = -1: normale Bandfarbe)
  //   hangPunktNr[k]:  welcher Punkt der Liste ist P0, P1, ... (für render.js)
  //   hangPunkte:      Anzahl Punkte
  hangAufbau() {
    this.hangFlaechen = [];
    this.hangPunktNr = [];
    let punkte = 1; // Punkt 0 = Bankettrand
    for (let k = 0; k < CONFIG.HANG_PROFIL.length; k++) {
      // Schichten in diesem Band, von unten nach oben
      const schichten = this.schichtenImBand(k);
      for (const nr of schichten) {
        this.hangFlaechen.push({ band: k, schicht: -1 });  // Band bis zur Schicht
        this.hangFlaechen.push({ band: k, schicht: nr });  // die Schicht selbst
        punkte += 2;
      }
      this.hangFlaechen.push({ band: k, schicht: -1 });    // Rest des Bands
      this.hangPunktNr.push(punkte);
      punkte++;
    }
    this.hangPunkte = punkte;
  },

  // Nummern der Gesteinsschichten, die in Band k liegen (von unten nach oben)
  schichtenImBand(k) {
    const liste = [];
    CONFIG.HANG_SCHICHTEN.forEach((sch, nr) => { if (sch.band === k && nr < 3) liste.push(nr); });
    return liste.sort((a, b) => CONFIG.HANG_SCHICHTEN[a].von - CONFIG.HANG_SCHICHTEN[b].von);
  },

  // Punkte des Querschnitts für Stück s, Seite nr ausrechnen (in s.hangU / s.hangH):
  // U = Meter ab Strassenmitte (ohne Vorzeichen), H = Meter über der Strasse.
  // Alle Punkte wachsen mit dem Hang (s.hang[nr]): bei 0 liegen sie alle am Bankettrand.
  hangQuerschnitt(s, nr) {
    const W = 2 * CONFIG.STRASSE_HALBE_BREITE; // eine Strassenbreite in Metern
    const rand = CONFIG.STRASSE_HALBE_BREITE + CONFIG.BANKETT_BREITE;
    const g = s.hang[nr];
    const U = s.hangU[nr];
    const H = s.hangH[nr];
    const profil = CONFIG.HANG_PROFIL;
    let j = 0;
    U[j] = rand; H[j] = 0; j++;
    let vorU = 0, vorH = 0; // voriger Punkt (Meter ab Bankettrand, ungewachsen)
    for (let k = 0; k < profil.length; k++) {
      const u = profil[k].seite * W;
      let h = profil[k].hoehe * W;
      if (k === profil.length - 1) h *= s.hangKamm; // Kamm mit Rauschen
      // Schichten liegen auf der geraden Linie zwischen vorigem und diesem Punkt
      for (const sch of this.schichtenImBand(k)) {
        for (const anteil of s.hangSchichten[sch]) {
          U[j] = rand + g * (vorU + (u - vorU) * anteil);
          H[j] = g * (vorH + (h - vorH) * anteil);
          j++;
        }
      }
      U[j] = rand + g * u;
      H[j] = g * h;
      j++;
      vorU = u; vorH = h;
    }
  },

  // Ort auf dem Querschnitt von Stück s, Seite nr, für eine "lage" wie in
  // HANG_BEWUCHS (0 = P0 ... 4 = P4). Ergebnis: [Meter ab Strassenmitte, Meter über der Strasse]
  hangOrt(s, nr, lage) {
    const p = this.hangPunktNr;
    const k = Math.min(Math.floor(lage), p.length - 2);
    const t = lage - k;
    const a = p[k], b = p[k + 1];
    const U = s.hangU[nr], H = s.hangH[nr];
    return [U[a] + (U[b] - U[a]) * t, H[a] + (H[b] - H[a]) * t];
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

  // Unsichtbare Einträge für den Zusammenstoss mit dem Felsfuss (Band P0
  // bis P1). Er steht dort, wo der Hang gerade anfängt: am Keilende fast am
  // Bankett und ganz niedrig, bei vollem Hang P0 weit draussen. Ganz am
  // Keilende (unter HANG_KOLLISION_AB) ist er nur ein Erdhügel, dort kracht es nicht.
  hangKollision() {
    const rand = CONFIG.STRASSE_HALBE_BREITE + CONFIG.BANKETT_BREITE;
    const p0 = this.hangPunktNr[0];
    for (const s of Road.stuecke) {
      for (let nr = 0; nr < 2; nr++) {
        if (s.hang[nr] < CONFIG.HANG_KOLLISION_AB) continue;
        this.platzieren(s.index, nr === 0 ? -1 : 1, 'hang', s.hangU[nr][p0] - rand);
      }
    }
  },

  // Wie weit reicht der Hang auf Stück i (und den Nachbarn) seitlich?
  // Meter ab Strassenmitte bis zum Kamm, 0 = kein Hang.
  hangBreite(i, nr) {
    let breite = 0;
    for (let j = i - 1; j <= i + 1; j++) {
      const s = Road.stueck(j);
      if (s.hang[nr] > 0) breite = Math.max(breite, s.hangU[nr][this.hangPunkte - 1]);
    }
    return breite;
  },

  // Darf auf Stück i auf dieser Seite ein Objekt stehen, das von "innen"
  // bis "aussen" reicht (Meter ab Strassenmitte)? Regeln fürs Gelände:
  // - Talseite: alles muss mindestens 1 m vor der Abbruchkante stehen
  //   (ganz offen bleibt also nur der Randstreifen, dort steht die Leitplanke).
  //   Hohe Bäume erst ab TAL_BAUMFREI Metern, auch beim Übergang.
  // - Hangseite: Dort ist der Hang, also nichts auf Strassenhöhe zwischen
  //   Bankett und Kamm (Bäume usw. stehen dort auf dem Hang, siehe hangBewuchs).
  //   Nur wo der Hang am Keilende noch schmal ist, darf hinter dem Kamm etwas stehen.
  gelaendeErlaubt(i, seite, name, innen, aussen) {
    const s = Road.stueck(i);
    const nr = seite < 0 ? 0 : 1;
    if (s.tal[nr] > 0) {
      if (aussen > this.talKante(s.tal[nr]) - 1) return false;
      if (SPRITE_DATEN[name].baum && innen < CONFIG.TAL_BAUMFREI) return false;
    }
    const hang = this.hangBreite(i, nr);
    if (hang > 0 && innen < hang + 1) return false;
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
      this.reiheZiehen(von, bis, seite, 'leitplanke', CONFIG.BAENDER.leitplanke.abstand);
    }
    // Talseite: überall, wo der Abhang auch nur ein bisschen offen ist
    // (am Anfang oder am Ende des Stücks)
    for (const s of Road.stuecke) {
      const naechstes = Road.stueck(s.index + 1);
      for (let nr = 0; nr < 2; nr++) {
        if (s.tal[nr] > 0 || naechstes.tal[nr] > 0) {
          this.platzieren(s.index, nr === 0 ? -1 : 1, 'leitplanke', CONFIG.BAENDER.leitplanke.abstand);
        }
      }
    }
  },

  // Zäune aus den Umgebungen (Reihen mit regelmaessig: true).
  // Bänder (Zaun) stehen im Abstand aus BAENDER, sonst gilt "abstand" der Reihe.
  regelmaessigeReihen() {
    for (const a of Road.abschnitte) {
      for (const reihe of UMGEBUNGEN[this.umgebungVon(a)]) {
        if (!reihe.regelmaessig) continue;
        const name = Object.keys(reihe.objekte)[0];
        const luecke = CONFIG.BAENDER[name] ? CONFIG.BAENDER[name].abstand : reihe.abstand[0];
        for (const seite of this.seiten(reihe)) {
          this.reiheZiehen(a.erstesStueck, a.erstesStueck + a.anzahl, seite, name, luecke, reihe.alle, true);
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
            luecke = CONFIG.BAENDER.leitplanke.abstand + SPRITE_DATEN.leitplanke.kollision + 0.4;
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

  // Bäume, Büsche und Felsen auf dem Hang (HANG_BEWUCHS oben). Ihr Fusspunkt
  // liegt auf dem Hang selbst, also höher und weiter draussen als die
  // Strasse. Eigener Zufall, damit die übrige Landschaft gleich bleibt, wenn
  // man hier etwas ändert. Erst ab HANG_BEWUCHS_AB Wachstum, damit am
  // Keilende nichts direkt am Bankett steht. Kein Zusammenstoss: Der Felsfuss
  // davor hält das Auto immer auf.
  hangBewuchs() {
    const zufall = this.zufallsGenerator(CONFIG.SZENERIE_SEED + 3);
    for (const stueck of Road.stuecke) {
      const a = Road.abschnitte[stueck.abschnittNr];
      const dichte = a.dichte * CONFIG.SZENERIE_DICHTE;
      for (const reihe of HANG_BEWUCHS[this.umgebungVon(a)]) {
        const chance = Math.min(CONFIG.STUECK_LAENGE / reihe.alle * dichte, 1);
        for (let nr = 0; nr < 2; nr++) {
          if (zufall() >= chance) continue;
          const name = this.auswaehlen(reihe.objekte, zufall);
          const lage = reihe.lage[0] + zufall() * (reihe.lage[1] - reihe.lage[0]);
          const variante = Math.floor(zufall() * SPRITE_DATEN[name].varianten.length);
          const gespiegelt = SPRITE_DATEN[name].spiegeln && zufall() < 0.5;
          if (stueck.hang[nr] < CONFIG.HANG_BEWUCHS_AB) continue;
          this.hangPlatzieren(stueck, nr, name, lage, variante, gespiegelt);
        }
      }
    }
  },

  // Ein Objekt auf den Hang von Stück "stueck" stellen (nr: 0 = links, 1 = rechts),
  // ausser es steht schon etwas am selben Platz.
  hangPlatzieren(stueck, nr, name, lage, variante, gespiegelt) {
    const L = CONFIG.STUECK_LAENGE;
    const seite = nr === 0 ? -1 : 1;
    const masse = Sprites.masse(name);
    const [u, h] = this.hangOrt(stueck, nr, lage);
    // Schon etwas da? Wie bei platzieren: Kronen dürfen sich etwas überlappen.
    for (let j = stueck.index - 2; j <= stueck.index + 2; j++) {
      for (const o of Road.stueck(j).hangObjekte) {
        if (o.seite !== seite || Math.abs(j - stueck.index) * L >= 1.5) continue;
        if (Math.abs(Math.abs(o.x) - u) < (o.breite + masse.breite) * 0.35) return false;
      }
    }
    stueck.hangObjekte.push({
      name: name,
      variante: variante,
      gespiegelt: gespiegelt,
      seite: seite,
      x: seite * u,         // Mitte des Bilds, Meter ab Strassenmitte (minus = links)
      boden: h,             // Fusspunkt so viele Meter über der Strasse (auf dem Hang)
      breite: masse.breite,
      hoehe: masse.hoehe,
      anker: 'mitte',
    });
    this.anzahl++;
    return true;
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
        // Der Felsfuss des Hangs ist nur für den Zusammenstoss da und
        // blockiert keinen Platz (ein Schild darf z. B. direkt davor stehen)
        if (o.name === 'hang' || name === 'hang') continue;
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
    // Gehört das Objekt zu einem Band (Leitplanke, Zaun), merkt sich das Stück
    // das Band, damit render.js es als durchgehende Fläche zeichnet.
    if (CONFIG.BAENDER[name]) Road.stuecke[index].baender[seite < 0 ? 0 : 1].push(name);
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
      unsichtbar: !!d.unsichtbar, // Bänder und Hang: kein Bild, nur Zusammenstoss
      boden: 0,                // Fusspunkt auf Strassenhöhe (nur Objekte auf dem Hang stehen höher)
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
  // (zufall: freiwillig ein eigener Zufallsgeber, sonst der normale)
  auswaehlen(objekte, zufall) {
    let summe = 0;
    for (const name in objekte) summe += objekte[name];
    let wurf = (zufall || this.zufall)() * summe;
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
