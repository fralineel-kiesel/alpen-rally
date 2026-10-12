// Auto und Fahrphysik.
// Arcade statt Simulation: wenige, einfache Regeln, die sich gut anfühlen.
// Jede Änderung wird mit "dt" (Sekunden seit dem letzten Bild) multipliziert.
// Darum fährt das Auto auf 60-Hz- und 144-Hz-Bildschirmen gleich schnell:
// Bei 144 Hz gibt es mehr, aber dafür kleinere Schritte.

const Car = {
  z: 0,          // zurückgelegte Strecke in Metern (vorwärts)
  x: 0,          // seitliche Position in Metern (0 = Strassenmitte, minus = links)
  tempo: 0,      // aktuelles Tempo in m/s
  aufGras: false,

  update(dt) {
    // --- Gas, Bremse, Ausrollen ---
    if (Input.gas()) {
      this.tempo += CONFIG.BESCHLEUNIGUNG * dt;
    }
    if (Input.bremse()) {
      this.tempo -= CONFIG.BREMSKRAFT * dt;
    }
    if (!Input.gas() && !Input.bremse()) {
      this.tempo -= CONFIG.ROLLWIDERSTAND * dt;
    }

    // --- Gras bremst ---
    // Das Auto zählt als "auf dem Gras", wenn mehr als die Hälfte davon
    // neben dem Randstreifen steht (also die Automitte über dem Rand ist).
    const strassenRand = CONFIG.STRASSE_HALBE_BREITE + CONFIG.RANDSTREIFEN_BREITE;
    this.aufGras = Math.abs(this.x) > strassenRand;
    if (this.aufGras && this.tempo > CONFIG.GRAS_HOECHSTTEMPO) {
      // Nicht schlagartig abbremsen, sondern kräftig, aber spürbar.
      this.tempo -= CONFIG.GRAS_BREMSWIRKUNG * dt;
      this.tempo = Math.max(this.tempo, CONFIG.GRAS_HOECHSTTEMPO);
    }

    // Tempo im erlaubten Bereich halten (rückwärts fahren gibt es nicht)
    this.tempo = Math.min(Math.max(this.tempo, 0), CONFIG.HOECHSTTEMPO);

    // --- Lenken ---
    // Wirkt nur beim Fahren: Je schneller, desto stärker. Im Stand
    // (tempo = 0) ergibt die Rechnung 0, das Auto bewegt sich also nicht.
    let richtung = 0;
    if (Input.links())  richtung -= 1;
    if (Input.rechts()) richtung += 1;
    const tempoAnteil = this.tempo / CONFIG.HOECHSTTEMPO; // 0 bis 1
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

  kmh() {
    return Math.round(this.tempo * 3.6);
  },
};
