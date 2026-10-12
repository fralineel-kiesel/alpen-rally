// Spielschleife: verbindet alles.
// Pro Bild: 1) ausrechnen, wie viel Zeit vergangen ist, 2) Auto bewegen,
// 3) alles neu zeichnen. Dann wartet der Browser auf das nächste Bild.

const canvas = document.getElementById('spiel');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false; // keine Glättung, scharfe Pixel

Input.start();
Road.start();
Render.start(ctx);

let letzteZeit = null;

function schleife(zeit) {
  // "zeit" kommt vom Browser in Millisekunden.
  // dt = Sekunden seit dem letzten Bild. Auf 60 Hz ca. 0.0167, auf 144 Hz ca. 0.0069.
  if (letzteZeit === null) letzteZeit = zeit;
  let dt = (zeit - letzteZeit) / 1000;
  letzteZeit = zeit;
  // War der Tab im Hintergrund, kann dt riesig sein. Begrenzen, damit das
  // Auto nicht plötzlich hunderte Meter springt.
  dt = Math.min(dt, CONFIG.MAX_DELTA);

  Car.update(dt);
  Render.zeichneAlles();

  requestAnimationFrame(schleife);
}

// Erstes Bild sofort zeichnen, damit die Strasse direkt sichtbar ist
Render.zeichneAlles();
requestAnimationFrame(schleife);
