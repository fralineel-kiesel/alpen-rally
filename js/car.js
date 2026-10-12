// Auto und Fahrphysik.
// Arcade statt Simulation: wenige, einfache Regeln, die sich gut anfühlen.
// Jede Änderung wird mit "dt" (Sekunden seit dem letzten Bild) multipliziert.
// Darum fährt das Auto auf 60-Hz- und 144-Hz-Bildschirmen gleich schnell:
// Bei 144 Hz gibt es mehr, aber dafür kleinere Schritte.

const Car = {
  z: 0,          // zurückgelegte Strecke in Metern (vorwärts)
  x: 0,          // seitliche Position in Metern (0 = Strassenmitte, minus = links)
  tempo: 0,      // aktuelles Tempo in m/s
  aufBankett: false,
  aufGras: false,

  // Getriebe
  gang: 1,             // eingelegter Gang (1 bis 5)
  drehzahl: CONFIG.LEERLAUF_DREHZAHL, // aktuelle Motordrehzahl in U/min
  schaltRest: 0,       // wie lange (Sekunden) die Schaltpause noch dauert; 0 = gerade kein Schaltvorgang
  schaltVonDrehzahl: 0, // Drehzahl im Moment des Schaltens (von hier fällt bzw. steigt sie zur neuen)

  update(dt) {
    // --- Gas, Bremse, Ausrollen ---
    // Während der Schaltpause ist "die Kupplung getreten": Gas bringt keinen Vortrieb.
    if (Input.gas() && this.schaltRest <= 0) {
      this.tempo += CONFIG.GANG_BESCHLEUNIGUNG[this.gang - 1] * dt;
    }
    if (Input.bremse()) {
      this.tempo -= CONFIG.BREMSKRAFT * dt;
    }
    if (!Input.gas() && !Input.bremse()) {
      this.tempo -= CONFIG.ROLLWIDERSTAND * dt;
    }
    // Luftwiderstand wächst mit dem Tempo im Quadrat. Darum lässt die
    // Beschleunigung oben raus spürbar nach, wie bei einem schweren Auto.
    this.tempo -= CONFIG.LUFTWIDERSTAND * this.tempo * this.tempo * dt;

    // --- Bankett und Gras bremsen ---
    // Massgebend ist die Automitte: Steht sie neben dem Asphalt, ist man
    // auf dem Bankett, steht sie noch weiter draussen, auf dem Gras.
    const abseits = Math.abs(this.x);
    const asphaltRand = CONFIG.STRASSE_HALBE_BREITE;
    const bankettRand = asphaltRand + CONFIG.BANKETT_BREITE;
    this.aufGras = abseits > bankettRand;
    this.aufBankett = !this.aufGras && abseits > asphaltRand;
    if (this.aufGras) {
      this.abbremsenAuf(CONFIG.GRAS_HOECHSTTEMPO, CONFIG.GRAS_BREMSWIRKUNG, dt);
    } else if (this.aufBankett) {
      this.abbremsenAuf(CONFIG.BANKETT_HOECHSTTEMPO, CONFIG.BANKETT_BREMSWIRKUNG, dt);
    }

    // Tempo im erlaubten Bereich halten (rückwärts fahren gibt es nicht).
    // Oben begrenzt der Drehzahlbegrenzer im letzten Gang.
    this.tempo = Math.min(Math.max(this.tempo, 0), this.hoechstTempo());

    this.getriebe(dt);

    // --- Lenken ---
    // Wirkt nur beim Fahren: Je schneller, desto stärker. Im Stand
    // (tempo = 0) ergibt die Rechnung 0, das Auto bewegt sich also nicht.
    let richtung = 0;
    if (Input.links())  richtung -= 1;
    if (Input.rechts()) richtung += 1;
    const tempoAnteil = this.tempo / this.hoechstTempo(); // 0 bis 1
    this.x += richtung * CONFIG.LENKSTAERKE * tempoAnteil * dt;
    this.x = Math.min(Math.max(this.x, -CONFIG.MAX_SEITLICH), CONFIG.MAX_SEITLICH);

    // --- Vorwärts fahren ---
    this.z += this.tempo * dt;
    // Die Strecke ist ein Ring: am Ende wieder von vorne beginnen,
    // damit die Zahl nicht endlos wächst.
    if (this.z >= Road.laenge) {
      this.z -= Road.laenge;
    }
  },

  // Ist man schneller als "hoechst", kräftig, aber nicht schlagartig abbremsen.
  abbremsenAuf(hoechst, wirkung, dt) {
    if (this.tempo > hoechst) {
      this.tempo -= wirkung * dt;
      this.tempo = Math.max(this.tempo, hoechst);
    }
  },

  // --- Automatisches Getriebe ---
  // Der Motor hängt fest an den Rädern: Aus Tempo und Gang ergibt sich die
  // Drehzahl. Ist sie zu hoch, wird hoch-, ist sie zu tief, heruntergeschaltet.
  getriebe(dt) {
    if (this.schaltRest > 0) {
      // Während der Schaltpause wandert die Drehzahl gleichmässig von der
      // alten zur neuen Drehzahl. Beim Hochschalten sieht man sie so abfallen.
      this.schaltRest = Math.max(this.schaltRest - dt, 0);
      const fortschritt = 1 - this.schaltRest / CONFIG.SCHALTPAUSE; // 0 bis 1
      const ziel = this.drehzahlImGang(this.gang);
      this.drehzahl = this.schaltVonDrehzahl + (ziel - this.schaltVonDrehzahl) * fortschritt;
      return;
    }

    const letzterGang = CONFIG.GANG_HOECHSTTEMPO.length;
    const hochschaltDrehzahl = CONFIG.MAX_DREHZAHL * CONFIG.HOCHSCHALT_ANTEIL;

    if (this.gang < letzterGang && this.drehzahlImGang(this.gang) >= hochschaltDrehzahl) {
      this.schalten(this.gang + 1);
    } else if (this.gang > 1 && this.drehzahlImGang(this.gang) < CONFIG.RUNTERSCHALT_DREHZAHL) {
      // So weit herunterschalten, bis die Drehzahl wieder passt. Bremst man
      // stark, kann das auch zwei Gänge auf einmal sein (statt mehrere
      // Schaltpausen nacheinander).
      let neu = this.gang - 1;
      while (neu > 1 && this.drehzahlImGang(neu) < CONFIG.RUNTERSCHALT_DREHZAHL) neu--;
      this.schalten(neu);
    }

    if (this.schaltRest <= 0) {
      this.drehzahl = this.drehzahlImGang(this.gang);
    }
  },

  schalten(neuerGang) {
    this.schaltVonDrehzahl = this.drehzahl;
    this.gang = neuerGang;
    this.schaltRest = CONFIG.SCHALTPAUSE;
  },

  // Drehzahl, die der Motor beim aktuellen Tempo im Gang "g" hätte.
  // Nie unter Leerlauf: Bei ganz wenig Tempo rutscht die Kupplung, der Motor läuft weiter.
  drehzahlImGang(g) {
    const anteil = (this.tempo * 3.6) / CONFIG.GANG_HOECHSTTEMPO[g - 1];
    return Math.max(CONFIG.LEERLAUF_DREHZAHL, CONFIG.MAX_DREHZAHL * anteil);
  },

  // Höchsttempo in m/s = Höchsttempo des letzten Gangs
  hoechstTempo() {
    return CONFIG.GANG_HOECHSTTEMPO[CONFIG.GANG_HOECHSTTEMPO.length - 1] / 3.6;
  },

  // Was die Ganganzeige zeigen soll: "N" im Stand, sonst die Gangnummer
  gangText() {
    return this.tempo < 0.1 ? 'N' : String(this.gang);
  },

  kmh() {
    return Math.round(this.tempo * 3.6);
  },
};
