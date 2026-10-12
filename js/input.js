// Tastatur-Eingabe.
// Wir merken uns nur, welche Tasten gerade gedrückt sind. Das Auto fragt
// das dann in jedem Bild ab. So hängt nichts davon ab, wie oft der
// Browser Tasten-Ereignisse schickt.

const Input = {
  gedrueckt: {}, // z. B. { ArrowUp: true }

  start() {
    window.addEventListener('keydown', (e) => {
      if (SPIEL_TASTEN.includes(e.code)) {
        e.preventDefault(); // sonst scrollt die Seite bei den Pfeiltasten
      }
      this.gedrueckt[e.code] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.gedrueckt[e.code] = false;
    });
    // Wechselt man das Fenster, kommt kein "keyup" an. Ohne das hier
    // würde das Auto danach ewig weiter Gas geben.
    window.addEventListener('blur', () => {
      this.gedrueckt = {};
    });
  },

  // e.code meint die Taste an ihrer Position, nicht den Buchstaben.
  // Darum funktioniert WASD auch auf Schweizer Tastaturen.
  gas()    { return !!(this.gedrueckt.ArrowUp || this.gedrueckt.KeyW); },
  bremse() { return !!(this.gedrueckt.ArrowDown || this.gedrueckt.KeyS); },
  links()  { return !!(this.gedrueckt.ArrowLeft || this.gedrueckt.KeyA); },
  rechts() { return !!(this.gedrueckt.ArrowRight || this.gedrueckt.KeyD); },
};

// Tasten, bei denen der Browser nichts Eigenes machen soll
const SPIEL_TASTEN = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
