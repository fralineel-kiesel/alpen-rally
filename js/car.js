// Auto und Fahrphysik.
// Arcade statt Simulation: wenige, einfache Regeln, die sich gut anfühlen.
// Jede Änderung wird mit "dt" (Sekunden seit dem letzten Bild) multipliziert.
// Darum fährt das Auto auf 60-Hz- und 144-Hz-Bildschirmen gleich schnell:
// Bei 144 Hz gibt es mehr, aber dafür kleinere Schritte.

const Car = {
  z: 0,          // zurückgelegte Strecke in Metern (vorwärts)
  x: 0,          // seitliche Position in Metern (0 = Strassenmitte, minus = links)
  tempo: 0,      // aktuelles Tempo in m/s
  lenkung: 0,    // aktueller Lenkeinschlag von -1 (voll links) bis +1 (voll rechts), folgt den Tasten mit etwas Verzögerung
  aufBankett: false,
  aufGras: false,
  auslastung: 0, // Tempo / Grenztempo der aktuellen Kurve (1 = genau am Limit), für die Debug-Anzeige

  // Zusammenstösse
  sperre: 0,          // so lange (Sekunden) gibt es nach einem harten Aufprall keinen weiteren
  wackeln: 0,         // so lange (Sekunden) wackelt das Bild noch (liest render.js)
  letzterBusch: null, // durch diesen Busch fährt man gerade; er bremst nur einmal

  // Getriebe
  gang: 1,             // eingelegter Gang (1 bis 5)
  drehzahl: CONFIG.LEERLAUF_DREHZAHL, // aktuelle Motordrehzahl in U/min
  schaltRest: 0,       // wie lange (Sekunden) die Schaltpause noch dauert; 0 = gerade kein Schaltvorgang
  schaltVonDrehzahl: 0, // Drehzahl im Moment des Schaltens (von hier fällt bzw. steigt sie zur neuen)

  update(dt) {
    const stueck = Road.stueckBei(this.z);
    const steigung = stueck.steigung; // z. B. 0.1 = 10 % bergauf, -0.1 = 10 % bergab

    // --- Gas, Bremse, Ausrollen ---
    // Bergab darf das Auto etwas über sein Höchsttempo kommen (Motor im roten Bereich).
    const erlaubt = this.erlaubtesTempo(steigung);
    // Während der Schaltpause ist "die Kupplung getreten": Gas bringt keinen Vortrieb.
    if (Input.gas() && this.schaltRest <= 0 && this.tempo < erlaubt) {
      // Bergauf zieht der Motor schwächer, bergab stärker.
      const antrieb = CONFIG.GANG_BESCHLEUNIGUNG[this.gang - 1] * this.steigungsFaktor(steigung);
      // Der Drehzahlbegrenzer schneidet ab: nie über das erlaubte Tempo hinaus beschleunigen
      this.tempo = Math.min(this.tempo + antrieb * dt, erlaubt);
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

    // --- Steigung (Schwerkraft) ---
    // Bergauf zieht die Schwerkraft das Auto zurück, bergab schiebt sie es an.
    // Wirkt immer, also auch beim Ausrollen (bergab rollt man länger).
    // Bergab bewusst schwächer als bergauf, sonst wird das Auto im Gefälle zu schnell.
    const hang = steigung > 0 ? CONFIG.HANGABTRIEB : CONFIG.HANGABTRIEB_BERGAB;
    this.tempo -= steigung * hang * dt;

    // Zu schnell für den Motor (z. B. Gefälle vorbei)? Dann bremst der Motor
    // sanft aufs erlaubte Tempo zurück, statt dass das Tempo schlagartig springt.
    this.abbremsenAuf(erlaubt, CONFIG.MOTORBREMSE, dt);

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

    // --- Lenken ---
    // Der Einschlag folgt den Tasten nicht sofort, sondern gleitet hin.
    // So wirkt das Auto schwerer. Mit Math.exp ist das auf 60 Hz und
    // 144 Hz gleich schnell.
    let richtung = 0;
    if (Input.links())  richtung -= 1;
    if (Input.rechts()) richtung += 1;
    if (CONFIG.LENK_TRAEGHEIT > 0) {
      this.lenkung += (richtung - this.lenkung) * (1 - Math.exp(-dt / CONFIG.LENK_TRAEGHEIT));
    } else {
      this.lenkung = richtung;
    }
    // Starkes Lenken radiert etwas und kostet leicht Tempo (Einschlag im
    // Quadrat: wenig Lenken kostet fast nichts, voller Einschlag am meisten).
    this.tempo -= CONFIG.LENK_TEMPOVERLUST / 3.6 * this.lenkung * this.lenkung * dt;

    // Wie schnell das Auto bei vollem Einschlag zur Seite kommt (m/s).
    // Wirkt nur beim Fahren: Je schneller, desto stärker. Im Stand
    // (tempo = 0) ergibt die Rechnung 0, das Auto bewegt sich also nicht.
    const lenkMax = CONFIG.LENKSTAERKE * this.tempo / this.hoechstTempo();
    let seitwaerts = this.lenkung * lenkMax; // + = nach rechts

    // --- Kurven: Grenztempo und Untersteuern ---
    // Auslastung = Tempo / Grenztempo. Auf der Geraden ist das Grenztempo
    // unendlich, die Auslastung also 0.
    this.auslastung = this.tempo / stueck.grenztempo;
    const aussen = -Math.sign(stueck.kurve); // Rechtskurve trägt nach links (minus) und umgekehrt
    // Fliehkraft bis zum Grenztempo: wächst gleichmässig mit der Auslastung.
    // Genau am Limit braucht man KURVEN_LENKBEDARF des vollen Einschlags.
    const haltekraft = lenkMax * CONFIG.KURVEN_LENKBEDARF; // Fliehkraft genau am Grenztempo
    let fliehkraft = haltekraft * Math.min(this.auslastung, 1);
    if (this.auslastung > 1) {
      // Untersteuern: Die Reifen sind am Limit. Nach innen lenken bringt
      // nicht mehr als genau am Grenztempo, mehr Einschlag hilft also nichts.
      const nachInnen = -seitwaerts * aussen;
      if (nachInnen > haltekraft) seitwaerts = -haltekraft * aussen;
      // Dazu kommt eine Kraft nach aussen, die man nicht mehr weglenken kann.
      // Sie wächst mit dem Quadrat der Überschreitung: knapp zu schnell
      // merkt man kaum, viel zu schnell fliegt man sofort raus.
      const zuviel = this.auslastung - 1;
      fliehkraft += CONFIG.UNTERSTEUERN_KRAFT * zuviel * zuviel;
      // Die rutschenden Reifen kosten Tempo, je mehr zu schnell, desto mehr.
      this.tempo -= CONFIG.UNTERSTEUERN_TEMPOVERLUST / 3.6 * zuviel * dt;
    }
    this.x += (seitwaerts + fliehkraft * aussen) * dt;
    this.x = Math.min(Math.max(this.x, -CONFIG.MAX_SEITLICH), CONFIG.MAX_SEITLICH);

    // Bäume, Felsen, Leitplanken ... (vor dem Getriebe, damit es nach einem
    // Aufprall gleich passend herunterschaltet)
    this.kollisionen(dt);

    // Rückwärts fahren gibt es nicht
    this.tempo = Math.max(this.tempo, 0);

    this.getriebe(dt);

    // --- Vorwärts fahren ---
    this.z += this.tempo * dt;
    // Die Strecke ist ein Ring: am Ende wieder von vorne beginnen,
    // damit die Zahl nicht endlos wächst.
    if (this.z >= Road.laenge) {
      this.z -= Road.laenge;
    }
  },

  // --- Zusammenstösse mit Objekten am Strassenrand ---
  // Das Auto steht im Bild ein paar Meter vor der Kamera (Road.autoAbstand).
  // Geprüft werden die Objekte auf den Strassenstücken unter dem Auto: Passen
  // seitliche Lage und Abstand zusammen, hat es gekracht.
  kollisionen(dt) {
    this.sperre = Math.max(this.sperre - dt, 0);
    this.wackeln = Math.max(this.wackeln - dt, 0);

    const L = CONFIG.STUECK_LAENGE;
    const hinten = this.z + Road.autoAbstand;          // Heck des Autos (Meter auf der Strecke)
    const vorne = hinten + CONFIG.AUTO_KOLLISION_LAENGE; // Front
    const halbeBreite = CONFIG.AUTO_KOLLISION_BREITE / 2;
    let imBusch = null;

    // Leitplanken und Zäune sind 4 m lang und gehören zum Stück, auf dem sie
    // beginnen. Darum auch ein paar Stücke vor dem Heck nachschauen.
    for (let i = Math.floor(hinten / L) - 3; i <= Math.floor(vorne / L); i++) {
      for (const o of Road.stueck(i).objekte) {
        const oz = i * L; // Anfang des Stücks
        if (oz + o.zBis < hinten || oz + o.zVon > vorne) continue; // nicht auf Höhe des Autos
        if (Math.abs(o.kx - this.x) >= o.kb + halbeBreite) continue; // seitlich daneben
        if (o.fest) {
          if (this.sperre <= 0) this.aufprall(o, halbeBreite);
        } else {
          imBusch = o;
          // Jeder Busch bremst nur einmal, nicht in jedem Bild wieder
          if (o !== this.letzterBusch) this.tempo *= CONFIG.BUSCH_TEMPO;
        }
      }
    }
    this.letzterBusch = imBusch;
  },

  // Harter Aufprall: viel Tempo weg, Bild wackelt, und das Auto wird auf
  // die strassenseitige Seite des Objekts versetzt, damit es nicht darin
  // hängen bleibt. Danach eine Weile keine weitere Kollision.
  aufprall(o, halbeBreite) {
    this.tempo *= CONFIG.AUFPRALL_TEMPO;
    this.wackeln = CONFIG.AUFPRALL_WACKELN;
    this.sperre = CONFIG.AUFPRALL_SPERRE;
    const zurMitte = -Math.sign(o.kx); // Objekt rechts: nach links schieben und umgekehrt
    this.x = o.kx + zurMitte * (o.kb + halbeBreite + CONFIG.AUFPRALL_ABSTOSS);
  },

  // Antrieb je nach Steigung: 1 = normal, kleiner = bergauf schwächer,
  // grösser = bergab stärker. Nie unter 20 %, damit man nie ganz stecken bleibt.
  steigungsFaktor(steigung) {
    if (steigung > 0) return Math.max(1 - CONFIG.ANTRIEB_BERGAUF * steigung, 0.2);
    return 1 - CONFIG.ANTRIEB_BERGAB * steigung; // steigung ist hier negativ, also wird es mehr
  },

  // Höchsttempo, das der Motor gerade erlaubt (m/s). Normal 200 km/h.
  // Bergab etwas mehr, je steiler, desto mehr (bis BERGAB_UEBERTEMPO).
  erlaubtesTempo(steigung) {
    const gefaelle = Math.max(-steigung, 0);
    const anteil = Math.min(gefaelle / CONFIG.BERGAB_UEBERTEMPO_AB, 1);
    return this.hoechstTempo() * (1 + CONFIG.BERGAB_UEBERTEMPO * anteil);
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

  // Normales Höchsttempo in m/s = Höchsttempo des letzten Gangs (bergab geht etwas mehr)
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
