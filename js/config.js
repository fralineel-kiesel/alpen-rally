// Alle einstellbaren Werte an einem Ort.
// Warum hier? Damit man das Fahrgefühl und die Optik ändern kann,
// ohne im restlichen Code suchen zu müssen.
//
// Einheiten: Strecken in Metern, Zeiten in Sekunden, Tempo in Metern pro Sekunde (m/s).
// Umrechnung: km/h = m/s * 3.6  (z. B. 50 m/s = 180 km/h)

const CONFIG = {
  // --- Bildschirm ---
  BREITE: 320,              // interne Bildbreite in Pixeln (wird hochskaliert)
  HOEHE: 180,               // interne Bildhöhe in Pixeln
  MAX_DELTA: 0.1,           // längster erlaubter Zeitschritt in Sekunden; verhindert Riesensprünge, wenn der Tab kurz im Hintergrund war

  // --- Kamera und Perspektive ---
  HORIZONT_Y: 80,           // Bildzeile, auf der der Horizont liegt (kleiner = mehr Strasse sichtbar)
  SICHTWINKEL: 90,          // Blickwinkel der Kamera in Grad (grösser = Strasse wirkt schmaler und weiter weg)
  KAMERA_HOEHE: 2.5,        // Höhe der Kamera über der Strasse in Metern (tiefer = Tempo wirkt schneller)
  SICHTWEITE: 300,          // wie viele Strassenstücke nach vorne gezeichnet werden

  // --- Strasse ---
  STRASSE_HALBE_BREITE: 4,  // halbe Strassenbreite in Metern (4 = 8 m breite Strasse)
  RANDSTREIFEN_BREITE: 0.6, // Breite des rot-weissen Randstreifens in Metern
  MITTELLINIE_BREITE: 0.15, // Breite der gestrichelten Mittellinie in Metern
  STUECK_LAENGE: 2,         // Länge eines Strassenstücks in Metern
  STREIFEN_LAENGE: 4,       // wie viele Strassenstücke eine Farbe behalten, bevor sie wechselt (Tempo-Streifen)
  STRECKEN_STUECKE: 1000,   // Anzahl Strassenstücke der Strecke; danach beginnt sie wieder von vorne

  // --- Auto: Fahrphysik ---
  HOECHSTTEMPO: 55,         // Höchsttempo in m/s (55 m/s = 198 km/h)
  BESCHLEUNIGUNG: 8,        // so viel m/s schneller pro Sekunde bei Vollgas (8 = von 0 auf Höchsttempo in ca. 7 s)
  BREMSKRAFT: 22,           // so viel m/s langsamer pro Sekunde beim Bremsen (22 = von Höchsttempo auf 0 in ca. 2.5 s)
  ROLLWIDERSTAND: 3,        // so viel m/s langsamer pro Sekunde ohne Gas (klein = rollt lange aus)
  LENKSTAERKE: 7,           // seitliches Tempo in m/s bei Höchsttempo und voll eingeschlagen; bei halbem Tempo halb so viel
  MAX_SEITLICH: 10,         // so weit (Meter ab Strassenmitte) kann man maximal neben die Strasse fahren

  // --- Auto: Gras ---
  GRAS_HOECHSTTEMPO: 16,    // auf dem Gras wird das Auto auf dieses Tempo heruntergebremst (16 m/s = ca. 58 km/h)
  GRAS_BREMSWIRKUNG: 18,    // so stark (m/s pro Sekunde) bremst das Gras, solange man schneller als GRAS_HOECHSTTEMPO ist

  // --- Auto: Aussehen (Platzhalter) ---
  AUTO_BREITE: 52,          // Breite des Platzhalter-Autos in Pixeln
  AUTO_HOEHE: 26,           // Höhe des Platzhalter-Autos in Pixeln
  AUTO_ABSTAND_UNTEN: 6,    // Abstand vom unteren Bildrand in Pixeln

  // --- Farben ---
  FARBEN: {
    HIMMEL_OBEN: [40, 90, 200],    // Himmelfarbe ganz oben (Rot, Grün, Blau)
    HIMMEL_UNTEN: [150, 200, 240], // Himmelfarbe am Horizont
    HIMMEL_STUFEN: 8,              // in wie vielen Farbstufen der Himmel verläuft (wenige = mehr Retro)
    BERG_HINTEN: '#7d8ca8',        // weit entfernte Berge (bläulich, wirken dadurch weiter weg)
    BERG_VORNE: '#56607a',         // nähere Berge
    GRAS_HELL: '#3fa535',
    GRAS_DUNKEL: '#2f8a2a',
    ASPHALT_HELL: '#6b6b6b',
    ASPHALT_DUNKEL: '#626262',
    RAND_ROT: '#c8282a',
    RAND_WEISS: '#e8e8e8',
    MITTELLINIE: '#e8e8e8',
    AUTO_KAROSSERIE: '#e0e0e0',
    AUTO_DACH: '#c8c8c8',
    AUTO_STREIFEN: '#1f4fb0',
    AUTO_SCHEIBE: '#28344a',
    AUTO_RAD: '#1a1a1a',
    AUTO_RUECKLICHT: '#ff2a2a',
    AUTO_SCHATTEN: 'rgba(0, 0, 0, 0.35)',
    ANZEIGE_TEXT: '#ffffff',
    ANZEIGE_HINTERGRUND: 'rgba(0, 0, 0, 0.5)',
  },
};
