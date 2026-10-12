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
  BERG_PARALLAX_FERN: 20,    // ganz ferne Dunst-Berge: wandern am langsamsten
  BERG_PARALLAX_HINTEN: 40,
  BERG_PARALLAX_VORNE: 70,
  SCHNEE_AB: 52,             // Gipfel der hinteren Berge, die höher als so viele Pixel über dem Horizont sind, tragen Schnee
  SCHNEE_MENGE: 0.7,         // wie weit der Schnee hinunterreicht: so viele Pixel Schnee pro Pixel Höhe über SCHNEE_AB

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
  ANTRIEB_BERGAB: 1,        // bei 10 % Gefälle 10 % mehr Antrieb (früher 3 = 30 %, war dem Tester zu stark)
  // Schwerkraft: So viel m/s pro Sekunde wird das Auto bei 100 % Steigung langsamer
  // (bergab entsprechend schneller). 9.81 = echte Erdanziehung, bei 10 % also ca. 1 m/s pro Sekunde.
  // Wirkt auch ohne Gas: Bergab rollt man weiter, bergauf ist man schnell langsam.
  HANGABTRIEB: 9.81,
  // Dasselbe bergab, aber schwächer: So rollt und schiebt das Auto bergab weniger stark.
  // 7 heisst: bei 10 % Gefälle 0.7 m/s pro Sekunde Schub (früher gleich wie bergauf, 9.81).
  HANGABTRIEB_BERGAB: 7,
  // Bergab darf das Auto über sein Höchsttempo kommen, der Motor dreht dann in den roten Bereich.
  // So viel mehr ist höchstens erlaubt (0.03 = 3 %, also 206 statt 200 km/h; früher 0.08 = 216 km/h) ...
  BERGAB_UEBERTEMPO: 0.03,
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

  // --- Landschaft am Strassenrand (Bäume, Felsen, Schilder ...) ---
  // Was in welcher Umgebung steht (wald, wiese, fels, lichtung), steht in js/scenery.js.
  // Die Grafiken selbst stehen in js/sprites.js.
  SZENERIE_SEED: 1987,           // Startzahl für den Zufall. Gleiche Zahl = jedes Mal alles an derselben Stelle. Andere Zahl = andere Verteilung.
  SZENERIE_MIN_ABSTAND: 0.3,     // so viele Meter Platz bleiben mindestens zwischen Bankett und Objekt (nichts steht auf Strasse oder Bankett)
  SZENERIE_DICHTE: 1,            // alle Umgebungen dichter (z. B. 1.3) oder lichter (0.7) machen
  // Leitplanken kommen automatisch an die Aussenseite enger Kurven ...
  LEITPLANKE_AB_STAERKE: 4,      // ... ab dieser Kurvenstärke immer
  LEITPLANKE_GEFAELLE_STAERKE: 3, // ... und ab dieser Stärke, wenn es dabei bergab geht
  LEITPLANKE_GEFAELLE: 0.04,     // "bergab" heisst: mindestens so viel Gefälle (0.04 = 4 %)
  LEITPLANKE_VORLAUF: 16,        // so viele Meter vor der Kurve beginnt die Planke schon
  LEITPLANKE_NACHLAUF: 16,       // so viele Meter nach der Kurve hört sie erst auf
  // Auf jeder Talseite (siehe "gelaende" in track.js) steht die Leitplanke immer.
  // Aussehen und Abstand der Leitplanke: siehe BAENDER weiter unten.

  // --- Bänder: Leitplanke und Holzzaun (später auch das Rally-Absperrband) ---
  // Ein Band wird wie die Strasse gezeichnet: pro Strassenstück (2 m) ein Viereck von seinem
  // nahen bis zu seinem fernen Ende. Das nächste Stück beginnt genau an diesen Ecken, darum
  // läuft das Band auch in Kurven ohne Stufen oder Spalten durch. Die Pfosten sind kleine
  // Bilder (sprites.js); ihre Lage wird aus denselben Bildpunkten berechnet wie das Band,
  // damit sie genau darunter sitzen. Alle Bänder benutzen dieselbe Zeichenfunktion
  // (bandZeichnen in render.js), nur mit diesen Werten:
  //   abstand:       Meter zwischen Bankett und der strassenseitigen Kante des Bands
  //   latten:        waagrechte Balken/Latten, je von "unten" bis "oben" in Metern über dem Boden.
  //                  Obere Hälfte in "hell", untere in "dunkel", "licht" = helle Linie an der
  //                  Oberkante (null = keine). Weit hinten bleibt jede Latte mindestens 1 Pixel hoch.
  //   pfostenAlle:   alle so viele Meter steht ein Pfosten (gezählt ab Streckenbeginn)
  //   pfostenBreite: Breite eines Pfostens in Metern
  //   pfostenHoehe:  Höhe eines Pfostens in Metern (höher als die oberste Latte = Spitze schaut heraus)
  //   pfostenBild:   Name des Pfosten-Bilds in sprites.js
  //   fest:          true = harter Aufprall wie an einem Fels, false = man fährt durch (nur Deko)
  BAENDER: {
    // Silbergraue Leitplanke an engen Kurven und auf der Talseite
    leitplanke: {
      abstand: 0.3,
      latten: [
        { unten: 0.45, oben: 0.8, hell: '#b6bcc4', dunkel: '#878e97', licht: '#eef1f4' },
      ],
      pfostenAlle: 4,
      pfostenBreite: 0.15,
      pfostenHoehe: 0.8,
      pfostenBild: 'leitplanke',
      fest: true,
    },
    // Holzzaun (Weidezaun) in den "wiese"-Abschnitten. Etwa so hoch wie das Auto im Bild.
    zaun: {
      abstand: 2,
      latten: [
        { unten: 0.3, oben: 0.45, hell: '#8b6842', dunkel: '#5f412b', licht: null },  // untere Latte
        { unten: 0.75, oben: 0.9, hell: '#8b6842', dunkel: '#5f412b', licht: null },  // obere Latte
      ],
      pfostenAlle: 3,
      pfostenBreite: 0.14,
      pfostenHoehe: 1.0,
      pfostenBild: 'zaun',
      fest: true,
    },
  },

  // Temposchilder (rund, weiss mit rotem Rand) stehen vor Kurven, immer rechts der Strasse.
  // Welche Zahl bei welcher Kurvenstärke: { Stärke: Zahl }. Fehlt eine Stärke, gibt es dort kein Schild.
  TEMPOSCHILD_ZAHLEN: { 3: 80, 4: 60, 5: 50, 6: 40 },
  TEMPOSCHILD_VORLAUF: 120,      // so viele Meter vor Kurvenbeginn steht das Schild
  TEMPOSCHILD_ABSTAND: 0.6,      // Meter zwischen Bankett und Schild (steht dort eine Leitplanke, kommt das Schild dahinter)

  // --- Gelände: Hang und Abhang (Feld "gelaende" in track.js) ---
  // Abhang (Talseite): öffnet sich über so viele Meter (und schliesst sich am Ende wieder).
  // Gemessen ab Abschnittsgrenze nach innen.
  GELAENDE_UEBERGANG: 40,
  // Hang (Bergseite, "wand_..." in track.js): kein senkrechtes Blatt, sondern ein Querschnitt
  // aus mehreren Flächenbändern, von der Strasse nach aussen und nach oben. Unten steiler Fels,
  // oben eine bewachsene Böschung. Jeder Punkt des Querschnitts (von innen nach aussen):
  //   seite: Abstand vom Bankettrand, in Strassenbreiten (1 = 8 m)
  //   hoehe: Höhe über der Strasse, in Strassenbreiten
  // Zwischen zwei Punkten liegt jeweils ein Band mit eigener Farbe (FARBEN.HANG_BAENDER,
  // hinter dem Kamm FARBEN.HANG_FLANKE je nach Umgebung).
  // Wichtig: Jeder Punkt muss von der Kamera aus gesehen "über" dem vorigen liegen, sonst
  // versteckt der Fels die Böschung dahinter. Faustregel: (hoehe * 8 - 2.5) / (seite * 8 + 4.8)
  // muss von Punkt zu Punkt grösser werden. (Ein Fels, der 14 m hoch ist und oben flach wird,
  // verdeckt von der Strasse aus alles, was darüber liegt: Dann sieht der Hang wieder wie
  // eine Wand aus, mit Baumspitzen dahinter. Darum ist der Fels hier niedriger als im
  // ersten Entwurf, und die Böschung steigt kräftig weiter an.)
  // Hinter dem Kamm (P4) geht der Berg als Flanke weiter hinauf bis zum Grat (P6). Dahinter
  // fällt er wieder etwas ab (P7, Rückseite des Grats), und von dort geht es waagrecht bis an
  // den Bildrand: Auf der Hangseite gibt es kein "dahinter" mehr, über der Flanke sieht man
  // nur noch Himmel und die Berge im Hintergrund.
  // Faustregel nachgerechnet: P3 0,63 · P4 0,71 · P5 1,01 · P6 1,32 (P6 auch mit 10 %
  // Rauschen nach unten noch 1,19). Der Vorschlag P6 (14 | 16) ergab nur 1,07, mit
  // Rauschen sogar weniger als P5: Dann hätte P5 die oberste Flanke verdeckt.
  // P7 ist die einzige gewollte Ausnahme: Er liegt hinter dem Grat und ist von der Strasse
  // aus nicht zu sehen. Er sorgt dafür, dass ein Berg von weitem (in Kurven, von einem
  // anderen Abschnitt aus) einen Grat hat und nicht wie ein Tafelberg mit schnurgerader
  // Oberkante aussieht.
  HANG_PROFIL: [
    { seite: 0.15, hoehe: 0.0 },  // P0: Ende des schmalen Streifens Geröll/Gras am Bankett
    { seite: 0.35, hoehe: 0.45 }, // P1: Oberkante des steilen Felsfusses (3,6 m hoch)
    { seite: 0.65, hoehe: 0.85 }, // P2: Oberkante des helleren Gesteins (bis hier Fels, 6,8 m)
    { seite: 1.6,  hoehe: 1.7 },  // P3: Oberkante der Böschung (Wiese)
    { seite: 3.2,  hoehe: 3.0 },  // P4: Hangkamm (Waldboden), 24 m über der Strasse
    { seite: 6,    hoehe: 7 },    // P5: untere Bergflanke, 56 m hoch
    { seite: 12,   hoehe: 17 },   // P6: Grat, 136 m hoch
    { seite: 20,   hoehe: 11 },   // P7: Rückseite des Grats (88 m hoch); von hier waagrecht bis zum Bildrand
  ],
  HANG_KAMM: 4,                  // Nummer des Punkts, an dem die Böschung aufhört und die Flanke beginnt (P4). Bis hier Farben aus HANG_BAENDER, danach aus HANG_FLANKE.
  HANG_GRAT: 6,                  // Nummer des höchsten Punkts (P6). Ab hier gilt das Rauschen (HANG_KAMM_RAUSCHEN), hier sitzt die Waldkante.
  // Keilförmige Enden: Am Anfang und Ende jedes Hang-Abschnitts wachsen Abstand und Höhe aller
  // Punkte (auch Flanke und Verlängerung zum Bildrand) über so viele Meter weich von 0 auf
  // 100 % (bei 0 liegt der Hang flach am Bankett). So läuft ein Hangende aus wie ein
  // Bergrücken. Folgt ein Abschnitt mit Hang auf derselben Seite, geht es ohne Unterbruch weiter.
  // Mit 80 m war das Ende des 136 m hohen Bergs zu steil (wie abgeschnitten), darum 120.
  HANG_UEBERGANG: 120,
  // Feld "hang_hoehe" in track.js (Faktor für alle Höhen des Hangs): Wechselt der Wert von
  // einem Abschnitt zum nächsten, wird über so viele Meter weich übergeblendet (je die Hälfte
  // vor und nach der Grenze, höchstens die halbe Länge des kürzeren Abschnitts).
  HANG_HOEHE_UEBERGANG: 40,
  HANG_KAMM_RAUSCHEN: 0.1,       // Grat und Rückseite sind bis zu so viel (0.1 = 10 %) höher oder tiefer, damit der Berg nicht kerzengerade ist
  // Waldkante: Oben auf der Flanke (Umgebung wald und lichtung) eine gezackte Reihe
  // Tannenspitzen, bei fels eine unregelmässige, felsige Kante. Bei wiese glatt.
  WALDKANTE_BAUM_HOEHE: 9,       // so hoch (Meter) ragen die Tannenspitzen über die Flanke hinaus (jede Spitze zufällig 55-100 % davon)
  WALDKANTE_BAUM_ABSTAND: 3.5,   // alle so viele Meter eine Tannenspitze
  WALDKANTE_FELS_HOEHE: 11,      // so hoch (Meter) sind die Felszacken höchstens
  WALDKANTE_FELS_ABSTAND: 7,     // so breit (Meter) ist ein Felszacken
  WALDKANTE_BIS: 320,            // weiter weg (Meter) keine Zacken mehr (würden nur noch flimmern)
  HANG_FLANKE_FLECKEN: 0.25,     // fels: Anteil der Strassenstücke mit einem grünen Flecken auf der Flanke
  HANG_FLECKEN_BIS: 260,         // weiter weg (Meter) keine grünen Flecken mehr auf der Flanke
  // Gesteinsschichten: dünne, leicht schräge Farbbänder im Fels. band = in welchem Band
  // (1 = Felsfuss P0-P1, 2 = helleres Gestein P1-P2), von/bis = Lage im Band (0 = unten, 1 = oben).
  // Höchstens 3 Schichten, sie dürfen sich im selben Band nicht überlappen.
  HANG_SCHICHTEN: [
    { band: 1, von: 0.38, bis: 0.52 },
    { band: 2, von: 0.18, bis: 0.3 },
    { band: 2, von: 0.6, bis: 0.7 },
  ],
  HANG_SCHICHT_SCHWANKUNG: 0.12, // so weit (Anteil des Bands) wandern die Schichten entlang der Strasse auf und ab (schräg)
  HANG_SCHICHT_WELLE: 120,       // ... und zwar einmal auf und ab auf so vielen Metern
  HANG_RISSE: 0.07,              // Anteil der Strassenstücke (2 m) mit einem dunklen Riss im Fels
  HANG_GRAS: 0.05,               // Anteil der Strassenstücke mit einem Grasflecken im helleren Gestein (P1-P2)
  HANG_KOLLISION_AB: 0.15,       // erst ab diesem Wachstum (0.15 = 15 %) kracht es am Felsfuss (ganz am Keilende ist er nur ein Erdhügel)
  HANG_BEWUCHS_AB: 0.35,         // erst ab diesem Wachstum stehen Bäume, Büsche und Felsen auf dem Hang
  // Rechenzeit sparen in der Ferne:
  HANG_DETAIL_BIS: 120,          // weiter weg als so viele Meter: keine Gesteinsschichten, Risse und Grasflecken mehr
  HANG_GRUPPE_AB: 40,            // weiter weg: ein Viereck pro Farbstreifen (4 Stücke = 8 m) statt pro Stück
  HANG_EINFACH_AB: 200,          // weiter weg (100 Stücke): unten nur noch 2 Bänder (Fels und Böschung) statt 5; die Flanke bleibt
  // Abhang (Talseite)
  TAL_RANDSTREIFEN: 2.2,         // Meter Gras zwischen Bankett und Abbruchkante (dort stehen Leitplanke und Schilder)
  TAL_TIEFE: 35,                 // so viele Meter tiefer als die Strasse liegt der Talboden
  TAL_HANG_NEIGUNG: 0.3,         // Hang zwischen Kante und Talboden: so viele Meter hinunter pro Meter seitwärts. Steiler als ca. 0.35 sieht man ihn nicht mehr (die Kante verdeckt ihn)
  TAL_BAUMFREI: 15,              // auf der Talseite stehen bis so viele Meter ab Strassenmitte keine hohen Bäume (auch beim Übergang)
  TAL_OEFFNUNG: 15,              // beim Übergang: bei halb offenem Abhang ist die Kante noch so viele Meter weiter draussen (grösser = Kante kommt später heran)
  TAL_BODEN_SICHT: 300,          // bis so weit (Meter) wird der Talboden gezeichnet, dahinter sieht man nur noch Dunst
  TAL_FELDER_BIS: 140,           // bis so weit (Meter) sieht man auf dem Talboden Felder und Waldstücke, dahinter einfarbig (sonst flimmert es)
  TAL_DUNST_ANTEIL: 0.6,         // so stark geht der Talboden ganz hinten in den Dunst über (0 = gar nicht, 1 = ganz)
  TAL_BAUM_DICHTE: 0.3,          // Anteil der Strassenstücke mit einem kleinen Baum unten im Tal
  TAL_PARALLAX: 90,              // Dunst-Landschaft im Tal wandert in Kurven seitlich (wie die Berge)

  // --- Landschaft: Darstellung ---
  OBJEKT_MIN_PIXEL: 2,           // Objekte, die im Bild weniger hoch wären, werden weggelassen (spart Arbeit, sieht man eh nicht)
  OBJEKT_MIN_ENTFERNUNG: 1,      // näher als so viele Meter vor der Kamera wird nichts gezeichnet (wäre riesig und sowieso neben dem Bild)
  MAX_OBJEKTE: 300,              // höchstens so viele Objekte pro Bild zeichnen (die nächsten zuerst). Kleiner = schneller, aber hinten lichter.
  WALDLINIE_PARALLAX: 110,       // Waldlinie am Horizont wandert in Kurven seitlich (schneller als die Berge, siehe BERG_PARALLAX_...)
  WALDLINIE_HOEHE: 14,           // höchste Baumspitze der Waldlinie über dem Horizont, in Pixeln
  WOLKEN_DRIFT: 1.5,             // so viele Pixel pro Sekunde treiben die Wolken von selbst nach rechts
  WOLKEN_PARALLAX: 25,           // so stark wandern die Wolken in Kurven mit (weniger als die Berge = wirken weit weg)
  // Wolken: x im Bild (0 bis 480, die Wolken laufen rundherum), Höhe über dem Horizont
  // (höchstens ca. 68, sonst rutscht die Wolke bei Gefälle oben aus dem Bild), Form (0, 1 oder 2)
  WOLKEN: [
    { x: 20, hoehe: 62, form: 0 },
    { x: 150, hoehe: 68, form: 1 },
    { x: 230, hoehe: 58, form: 2 },
    { x: 380, hoehe: 66, form: 1 },
    { x: 440, hoehe: 54, form: 0 },
  ],

  // --- Zusammenstösse ---
  AUTO_KOLLISION_BREITE: 1.6,    // so breit (Meter) ist das Auto beim Zusammenstoss
  AUTO_KOLLISION_LAENGE: 3,      // so lang (Meter) ist das Auto beim Zusammenstoss
  AUFPRALL_TEMPO: 0.25,          // fest (Baum, Fels, Leitplanke ...): Tempo sinkt auf diesen Anteil (0.25 = 25 % vom aktuellen Tempo)
  AUFPRALL_WACKELN: 0.3,         // so viele Sekunden wackelt das Bild nach einem harten Aufprall
  AUFPRALL_WACKEL_PIXEL: 2,      // so viele Pixel weit wackelt das Bild höchstens
  AUFPRALL_SPERRE: 1,            // so viele Sekunden nach einem harten Aufprall gibt es keinen weiteren
  AUFPRALL_ABSTOSS: 0.3,         // so viele Meter Luft zwischen Auto und Objekt nach dem Versetzen Richtung Strassenmitte
  BUSCH_TEMPO: 0.85,             // weich (Busch): Tempo sinkt auf diesen Anteil (0.85 = 15 % weniger), kein Wackeln

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
    BERG_FERN: '#aab8cd',          // ganz ferne Berge im Dunst (hell, fast wie der Himmel)
    BERG_HINTEN: '#7d8ca8',        // weit entfernte Berge (bläulich, wirken dadurch weiter weg)
    BERG_VORNE: '#56607a',         // nähere Berge
    SCHNEE: '#f4f7fb',             // Schneekappen auf den hohen Gipfeln
    SCHNEE_SCHATTEN: '#c3d5ec',    // Schnee im Schatten (hellblau)
    WALDLINIE_HINTEN: '#365a48',   // Waldlinie am Horizont, hintere Baumreihe (etwas bläulich = weiter weg)
    WALDLINIE_VORNE: '#22412c',    // Waldlinie, vordere Baumreihe (dunkles Tannengrün)
    GRAS_HELL: '#3fa535',
    GRAS_DUNKEL: '#2f8a2a',
    ASPHALT_HELL: '#6b6b6b',
    ASPHALT_DUNKEL: '#626262',
    BANKETT_HELL: '#8b6b47',       // Schotter/Erde am Strassenrand, zwei ähnliche Brauntöne
    BANKETT_DUNKEL: '#7e6040',     // (nur wenig Unterschied, damit es nicht nach Rennstrecke aussieht)
    MITTELLINIE: '#e8e8e8',
    // (Farben von Leitplanke und Zaun stehen oben bei BAENDER)
    // Hang: Farbe jedes Bands [hell, dunkel] (wechselt wie die Strasse alle paar Meter), von innen nach aussen
    HANG_BAENDER: [
      ['#877e72', '#7d7468'],      // Bankett bis P0: schmaler Streifen Geröll
      ['#5f564c', '#585046'],      // P0-P1: steiler Felsfuss, dunkelgrau-braun
      ['#8b8173', '#83796c'],      // P1-P2: helleres Gestein
      ['#4f8f36', '#4a8833'],      // P2-P3: obere Böschung, Wiese
      ['#2f5f2e', '#2c5a2b'],      // P3-P4: Hangkamm, dunkleres Grün (Waldboden)
    ],
    HANG_SCHICHTEN: [              // Farben der Gesteinsschichten (gleiche Reihenfolge wie HANG_SCHICHTEN oben)
      ['#7a6656', '#73604f'],      // rötlich-braun
      ['#6f6c69', '#696663'],      // kühles Grau
      ['#a39b8e', '#9a9285'],      // hell
    ],
    // Bergflanke hinter dem Kamm, je nach Umgebung des Abschnitts. Pro Umgebung zwei Bänder
    // (P4-P5, und P5-P6 samt Rückseite und Verlängerung zum Bildrand), jedes [hell, dunkel]
    // wie die anderen Bänder.
    HANG_FLANKE: {
      wald:     [['#28502d', '#244a29'], ['#21452a', '#1e4026']],  // dunkles Tannengrün
      lichtung: [['#2c5530', '#284f2c'], ['#24482b', '#214327']],  // wie wald, minim heller
      fels:     [['#7a7064', '#72685d'], ['#6c6359', '#655c52']],  // Grau-Braun
      wiese:    [['#4f8f36', '#4a8833'], ['#47852f', '#43802d']],  // Grün wie die Böschung
    },
    HANG_FLANKE_FLECK: '#55783a',  // fels: vereinzelte grüne Flecken auf der Flanke
    WALDKANTE_TANNE: '#1a3822',    // Tannenspitzen oben auf der Flanke (wald, lichtung)
    WALDKANTE_FELS: '#5e564d',     // Felszacken oben auf der Flanke (fels)
    HANG_RISS: '#3a332d',          // dunkle Risse im Fels
    HANG_GRAS: '#5d8f3a',          // Grasflecken im Gestein
    // Abhang und Tal
    TAL_KANTE: '#5c4b33',          // Erde an der Abbruchkante
    TAL_HANG_HELL: '#3d6136',      // Hang hinter der Kante (Wald im Schatten), helle Streifen ...
    TAL_HANG_DUNKEL: '#35562f',    // ... und dunkle Streifen
    // Talboden: Flickenteppich aus Wiesen und Waldstücken, in der Ferne leicht im Dunst
    TAL_FELDER: ['#4b7d58', '#5b8d60', '#3a6950'], // Wiese, helle Wiese, Wald (bläulich, weil weit unten im Dunst)
    // Dunst-Landschaft weit unten im Tal: Streifen von oben (Horizont, weit weg, hell)
    // nach unten (näher, dunkler). Der Talboden wird in der Ferne zur letzten Farbe hin aufgehellt.
    TAL_DUNST: ['#bccad6', '#a7b9c7', '#93aab5', '#809da1', '#6f918d'],
    TAL_DUNST_BAUM: '#5a7c78',     // kleine Baumwipfel im Dunst
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
