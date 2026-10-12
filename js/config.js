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
  SICHTWEITE: 200,          // wie viele Strassenstücke nach vorne gezeichnet werden (200 x 2 m = 400 m weit)

  // --- Strasse ---
  STRASSE_HALBE_BREITE: 4,  // halbe Strassenbreite in Metern (4 = 8 m breite Strasse)
  BANKETT_BREITE: 0.8,      // Breite des Schotter-/Erdbanketts links und rechts neben dem Asphalt in Metern
  MITTELLINIE_BREITE: 0.15, // Breite der gestrichelten Mittellinie in Metern
  MITTELLINIE_AB_PIXEL: 10, // Mittellinie erst zeichnen, wo die Strasse im Bild mindestens so viele Pixel breit ist (sonst weisse Punkte am Horizont)
  STUECK_LAENGE: 2,         // Länge eines Strassenstücks in Metern
  STREIFEN_LAENGE: 4,       // wie viele Strassenstücke eine Farbe behalten, bevor sie wechselt (Tempo-Streifen)

  // --- Kurven und Hügel: Strecke und Darstellung ---
  // Die Strecke selbst (Abschnitte mit Länge, Kurve, Höhe) steht in js/track.js.
  // Zwei Abschnitte gehen weich ineinander über (Kurve und Steigung). Die Überblendung
  // dauert diesen Anteil der Länge des kürzeren Abschnitts (0.2 = 20 %).
  // Kleiner = Kurven setzen schärfer ein, grösser = sanfter, aber enge Kurven wirken weicher.
  UEBERGANG_ANTEIL: 0.2,
  // Wie stark sich die Strasse im Bild biegt (Verstärkung nur für die Optik, nicht fürs Fahren).
  // Grösser = Kurven sehen enger aus. Mit 20 hat eine Kurve der Stärke 1 einen Radius
  // von ca. 140 m, Stärke 3 ca. 55 m, Stärke 6 ca. 12 m. Eine Kehre schwenkt die Strasse
  // damit schon auf 40 m Entfernung um mehr als eine halbe Bildbreite zur Seite.
  KURVEN_OPTIK: 20,
  // Höhen im Bild verstärken (nur Optik, nicht fürs Fahren). 1 = echte Höhe.
  // Mit 1.6 sieht eine 12-m-Kuppe aus wie eine 19-m-Kuppe: Die Strasse dahinter
  // verschwindet deutlich, und Gefälle sieht man klar. Zu gross (ab ca. 2) = vor
  // steilen Anstiegen steht eine grüne Wand, die die Berge verdeckt.
  HOEHEN_OPTIK: 1.6,
  // Horizont und Berge kippen leicht mit der Steigung der Strasse vor dem Auto:
  // bergauf rutscht der Horizont nach unten (man "schaut hinauf"), bergab nach oben.
  HORIZONT_VORSCHAU: 25,     // über so viele Meter vor dem Auto wird die Steigung gemessen
  HORIZONT_NEIGUNG: 70,      // so viele Pixel Verschiebung pro 100 % Steigung (bei 10 % also 7 Pixel)
  HORIZONT_MAX_VERSATZ: 10,  // mehr als so viele Pixel verschiebt sich der Horizont nie
  HORIZONT_TRAEGHEIT: 0.3,   // so viele Sekunden braucht der Horizont für ca. zwei Drittel des Weges (Glättung)
  // Berge im Hintergrund wandern in Kurven seitlich (Pixel pro Bogenmass Drehung).
  // Die vorderen Berge etwas schneller, damit es nach Tiefe aussieht.
  BERG_PARALLAX_HINTEN: 40,
  BERG_PARALLAX_VORNE: 70,

  // --- Kurven: Fahrphysik (Grenztempo und Untersteuern) ---
  // Grenztempo pro Kurvenstärke in km/h: das schnellste Tempo, mit dem man die Kurve
  // noch sauber in der Spur fahren kann. Stelle 0 = gerade (kein Limit), Stelle 1 = Stärke 1
  // ... Stelle 6 = Haarnadel. Zwischenwerte (z. B. 4.5 beim Überblenden) werden gemischt.
  // Aus dieser Tabelle wird auch berechnet, wie eng die Kurve im Bild aussieht.
  KURVEN_GRENZTEMPO: [0, 190, 150, 120, 95, 75, 55],
  // "Auslastung" = Tempo / Grenztempo. 1.0 = genau am Limit.
  // Bis 1.0 trägt die Fliehkraft das Auto nach aussen, man kann es aber weglenken.
  // Dieser Wert sagt, wie viel Lenkeinschlag man genau am Grenztempo braucht (0.8 = 80 %).
  // Grösser = man muss in Kurven mehr lenken.
  KURVEN_LENKBEDARF: 0.8,
  // Über 1.0 untersteuert das Auto: Die Reifen sind am Limit, stärker lenken hilft nicht mehr.
  // Das Auto rutscht trotz vollem Einschlag nach aussen, und zwar mit diesem Tempo (m/s)
  // bei Auslastung 2.0 (doppeltes Grenztempo). Es wächst mit dem Quadrat der Überschreitung:
  // 10 % zu schnell = 0.4 m/s (kaum), 20 % = 1.6 m/s (man kommt an den Rand), 50 % = 10 m/s (sofort im Gras).
  UNTERSTEUERN_KRAFT: 40,
  // Beim Untersteuern radieren die Reifen und kosten Tempo: so viele km/h pro Sekunde
  // bei Auslastung 2.0. Wächst gleichmässig mit der Überschreitung (bei 1.5 also die Hälfte).
  UNTERSTEUERN_TEMPOVERLUST: 50,
  // Starkes Lenken kostet leicht Tempo: so viele km/h pro Sekunde bei vollem Einschlag
  // (halber Einschlag = ein Viertel davon). 0 = Lenken bremst gar nicht.
  LENK_TEMPOVERLUST: 6,

  // --- Steigung: Fahrphysik ---
  // Antrieb bergauf schwächer, bergab stärker. Zahl = Prozent Antrieb pro Prozent Steigung.
  // 3.5 heisst: bei 10 % Steigung 35 % weniger Antrieb, bei 4 % nur 14 % weniger.
  ANTRIEB_BERGAUF: 3.5,
  ANTRIEB_BERGAB: 3,        // bei 10 % Gefälle 30 % mehr Antrieb
  // Schwerkraft: So viel m/s pro Sekunde wird das Auto bei 100 % Steigung langsamer
  // (bergab entsprechend schneller). 9.81 = echte Erdanziehung, bei 10 % also ca. 1 m/s pro Sekunde.
  // Wirkt auch ohne Gas: Bergab rollt man weiter, bergauf ist man schnell langsam.
  HANGABTRIEB: 9.81,
  // Bergab darf das Auto über sein Höchsttempo kommen, der Motor dreht dann in den roten Bereich.
  // So viel mehr ist höchstens erlaubt (0.08 = 8 %, also 216 statt 200 km/h) ...
  BERGAB_UEBERTEMPO: 0.08,
  // ... und zwar voll ab diesem Gefälle (0.08 = 8 %). Bei halb so viel Gefälle halb so viel.
  BERGAB_UEBERTEMPO_AB: 0.08,
  // Ist das Auto schneller als erlaubt (z. B. wenn das Gefälle aufhört), bremst der Motor
  // mit dieser Stärke (m/s pro Sekunde) aufs erlaubte Tempo zurück.
  MOTORBREMSE: 2,

  // --- Auto: Motor und Getriebe (automatische 5-Gang-Schaltung) ---
  // Höchsttempo pro Gang in km/h: Bei diesem Tempo dreht der Motor im jeweiligen
  // Gang genau bis zum Begrenzer. Der letzte Wert ist das Höchsttempo des Autos.
  GANG_HOECHSTTEMPO: [50, 85, 125, 165, 200],
  // Vortrieb pro Gang in m/s pro Sekunde bei Vollgas (stark unten, schwach oben).
  // Davon geht noch der Luftwiderstand ab, darum zieht das Auto oben raus deutlich schwächer.
  GANG_BESCHLEUNIGUNG: [8.0, 6.6, 3.7, 2.6, 2.5],
  LEERLAUF_DREHZAHL: 1000,      // Drehzahl im Stand bzw. bei ganz wenig Tempo (U/min)
  MAX_DREHZAHL: 7500,           // Drehzahlbegrenzer (U/min); im 5. Gang ist hier das Höchsttempo erreicht
  HOCHSCHALT_ANTEIL: 0.92,      // hochschalten bei diesem Anteil der Maximaldrehzahl (0.92 = bei 6900 U/min)
  RUNTERSCHALT_DREHZAHL: 3000,  // fällt die Drehzahl darunter, wird heruntergeschaltet (U/min)
  SCHALTPAUSE: 0.2,             // so lange (Sekunden) gibt es beim Schalten keinen Vortrieb; die Drehzahl fällt in der Zeit ab

  // --- Auto: Fahrphysik ---
  // Luftwiderstand: bremst mit dem Tempo im Quadrat. Bei 50 km/h kaum (0.05 m/s pro Sekunde),
  // bei 200 km/h deutlich (0.86). Grösser = Beschleunigung lässt oben raus stärker nach.
  LUFTWIDERSTAND: 0.00028,
  BREMSKRAFT: 22,           // so viel m/s langsamer pro Sekunde beim Bremsen (22 = von Höchsttempo auf 0 in ca. 2.5 s)
  ROLLWIDERSTAND: 3,        // so viel m/s langsamer pro Sekunde ohne Gas (klein = rollt lange aus)
  LENKSTAERKE: 7,           // seitliches Tempo in m/s bei Höchsttempo und voll eingeschlagen; bei halbem Tempo halb so viel
  LENK_TRAEGHEIT: 0.12,     // so viele Sekunden braucht die Lenkung, um ca. zwei Drittel des Einschlags zu erreichen (0 = sofort, 0.3 = schwammig)
  MAX_SEITLICH: 10,         // so weit (Meter ab Strassenmitte) kann man maximal neben die Strasse fahren

  // --- Auto: Bankett und Gras ---
  // Funktioniert bei beiden gleich: Ist man schneller als das Höchsttempo,
  // wird mit der Bremswirkung heruntergebremst (nicht schlagartig).
  BANKETT_HOECHSTTEMPO: 39, // auf dem Bankett wird das Auto auf dieses Tempo heruntergebremst (39 m/s = ca. 140 km/h)
  BANKETT_BREMSWIRKUNG: 5,  // so stark (m/s pro Sekunde) bremst das Bankett; klein = bremst nur leicht
  GRAS_HOECHSTTEMPO: 16,    // auf dem Gras wird das Auto auf dieses Tempo heruntergebremst (16 m/s = ca. 58 km/h)
  GRAS_BREMSWIRKUNG: 18,    // so stark (m/s pro Sekunde) bremst das Gras, solange man schneller als GRAS_HOECHSTTEMPO ist

  // --- Auto: Aussehen (Platzhalter) ---
  AUTO_BREITE: 52,          // Breite des Platzhalter-Autos in Pixeln
  AUTO_HOEHE: 26,           // Höhe des Platzhalter-Autos in Pixeln
  AUTO_ABSTAND_UNTEN: 6,    // Abstand vom unteren Bildrand in Pixeln

  // --- Anzeigen (Drehzahl- und Tempomesser) ---
  ANZEIGE_RADIUS: 28,        // Radius der runden Zifferblätter in Pixeln
  DREHZAHL_ANZEIGE_X: 31,    // Mittelpunkt des Drehzahlmessers (links), x in Pixeln
  TEMPO_ANZEIGE_X: 289,      // Mittelpunkt des Tempomessers (rechts), x in Pixeln
  ANZEIGE_Y: 150,            // Mittelpunkt beider Zifferblätter, y in Pixeln (180 = unterer Bildrand)
  ANZEIGE_WINKEL: 240,       // so viele Grad überstreicht die Skala von 0 bis zum Maximum
  DREHZAHL_SKALA_MAX: 8000,  // Drehzahlmesser geht bis 8000 U/min
  DREHZAHL_ROT_AB: 7000,     // ab hier ist die Drehzahlskala rot
  TEMPO_SKALA_MAX: 240,      // Tempomesser geht bis 240 km/h
  NADEL_TRAEGHEIT: 0.07,     // wie träge die Nadeln nachziehen, in Sekunden (grösser = ruhiger, aber verzögerter)

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
    BANKETT_HELL: '#8b6b47',       // Schotter/Erde am Strassenrand, zwei ähnliche Brauntöne
    BANKETT_DUNKEL: '#7e6040',     // (nur wenig Unterschied, damit es nicht nach Rennstrecke aussieht)
    MITTELLINIE: '#e8e8e8',
    AUTO_KAROSSERIE: '#e0e0e0',
    AUTO_DACH: '#c8c8c8',
    AUTO_STREIFEN: '#1f4fb0',
    AUTO_SCHEIBE: '#28344a',
    AUTO_RAD: '#1a1a1a',
    AUTO_RUECKLICHT: '#ff2a2a',
    AUTO_SCHATTEN: 'rgba(0, 0, 0, 0.35)',
    ANZEIGE_HINTERGRUND: 'rgba(24, 18, 12, 0.72)', // Zifferblatt: dunkel und leicht durchsichtig
    ANZEIGE_RAHMEN: '#6e5539',     // erdbrauner Ring um das Zifferblatt
    ANZEIGE_SKALA: '#efe4c8',      // cremeweisse Striche und Zahlen
    ANZEIGE_ROT: '#d8452c',        // roter Drehzahlbereich
    ANZEIGE_NADEL: '#ff3b1f',      // Nadel
    ANZEIGE_NABE: '#3a2e22',       // Mittelpunkt, an dem die Nadel befestigt ist
    DEBUG_HINTERGRUND: 'rgba(0, 0, 0, 0.6)', // Kasten hinter der Debug-Anzeige (F3)
    DEBUG_TEXT: '#ffffff',
  },
};
