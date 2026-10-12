// Strasse und Perspektive.
//
// Grundidee (Pseudo-3D wie bei OutRun): Die Strasse ist eine lange Kette
// von kurzen Stücken. Jedes Stück wird mit einer einfachen Formel auf den
// Bildschirm "projiziert": Je weiter weg, desto näher am Horizont und
// desto schmaler. Es gibt kein echtes 3D, nur diese eine Rechnung.
// Später können Stücke eine Kurve oder einen Hügel bekommen.

const Road = {
  stuecke: [],   // alle Strassenstücke der Strecke
  laenge: 0,     // Gesamtlänge der Strecke in Metern
  brennweite: 0, // wie stark die Perspektive verkleinert (aus dem Sichtwinkel berechnet)

  start() {
    // Aus dem Sichtwinkel ausrechnen, wie viele Pixel ein Meter in 1 m
    // Entfernung breit ist. Grosser Winkel = kleine Brennweite = alles kleiner.
    const halberWinkel = (CONFIG.SICHTWINKEL / 2) * Math.PI / 180;
    this.brennweite = (CONFIG.BREITE / 2) / Math.tan(halberWinkel);

    this.stuecke = [];
    for (let i = 0; i < CONFIG.STRECKEN_STUECKE; i++) {
      this.stuecke.push({
        index: i,
        // Abwechselnd hell und dunkel, jeweils STREIFEN_LAENGE Stücke lang.
        // Diese Streifen rasen am Auto vorbei und zeigen so das Tempo.
        hell: Math.floor(i / CONFIG.STREIFEN_LAENGE) % 2 === 0,
      });
    }
    this.laenge = CONFIG.STRECKEN_STUECKE * CONFIG.STUECK_LAENGE;
  },

  // Welches Stück liegt an Position z (in Metern)? Die Strecke ist ein Ring:
  // Nach dem letzten Stück kommt wieder das erste.
  stueckBei(z) {
    const i = Math.floor(z / CONFIG.STUECK_LAENGE) % this.stuecke.length;
    return this.stuecke[(i + this.stuecke.length) % this.stuecke.length];
  },

  // Rechnet einen Punkt der Welt in Bildschirm-Koordinaten um.
  //   weltX:   seitliche Position in Metern (0 = Strassenmitte)
  //   abstand: wie weit der Punkt vor der Kamera liegt, in Metern
  //   kameraX: seitliche Position der Kamera in Metern
  // Ergebnis: x/y im Bild und "massstab" = Pixel pro Meter an dieser Stelle.
  projiziere(weltX, abstand, kameraX) {
    const massstab = this.brennweite / abstand;
    return {
      x: CONFIG.BREITE / 2 + (weltX - kameraX) * massstab,
      y: CONFIG.HORIZONT_Y + CONFIG.KAMERA_HOEHE * massstab,
      massstab: massstab,
    };
  },
};
