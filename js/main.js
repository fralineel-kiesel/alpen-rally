// Spielschleife: verbindet alles.
// Pro Bild: 1) ausrechnen, wie viel Zeit vergangen ist, 2) Auto und
// Anzeige-Nadeln bewegen, 3) alles neu zeichnen. Dann wartet der Browser
// auf das nächste Bild.

const canvas = document.getElementById('spiel');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false; // keine Glättung, scharfe Pixel

Input.start();
Road.start();
Sprites.start();  // Pixelraster in Bilder umwandeln
Scenery.start();  // Bäume, Felsen usw. auf die Strecke verteilen
Render.start(ctx);

let letzteZeit = null;

// Bilder pro Sekunde für die Debug-Anzeige. Wir zählen die Bilder und
// rechnen alle halbe Sekunde neu, damit die Zahl ruhig und lesbar bleibt.
let fps = 0;
let fpsBilder = 0;
let fpsZeit = 0;

function schleife(zeit) {
  // "zeit" kommt vom Browser in Millisekunden.
  // dt = Sekunden seit dem letzten Bild. Auf 60 Hz ca. 0.0167, auf 144 Hz ca. 0.0069.
  if (letzteZeit === null) letzteZeit = zeit;
  let dt = (zeit - letzteZeit) / 1000;
  letzteZeit = zeit;

  // FPS mit der echten Zeit messen (vor dem Begrenzen unten)
  fpsBilder++;
  fpsZeit += dt;
  if (fpsZeit >= 0.5) {
    fps = fpsBilder / fpsZeit;
    fpsBilder = 0;
    fpsZeit = 0;
  }

  // War der Tab im Hintergrund, kann dt riesig sein. Begrenzen, damit das
  // Auto nicht plötzlich hunderte Meter springt.
  dt = Math.min(dt, CONFIG.MAX_DELTA);

  Car.update(dt);
  Render.update(dt);
  Render.zeichneAlles(fps);

  requestAnimationFrame(schleife);
}

// Erstes Bild sofort zeichnen, damit die Strasse direkt sichtbar ist
Render.zeichneAlles(fps);
requestAnimationFrame(schleife);
