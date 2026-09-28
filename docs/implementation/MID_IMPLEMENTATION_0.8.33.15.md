# MID v0.8.33.15

## Weitere Performance- und Ersttap-Korrekturen

Die Prüfung konzentrierte sich auf Interaktionen unmittelbar nach einer schnellen Scrollbewegung, insbesondere auf das Suchfeld in der klebenden Kopfzeile und die tageweise Navigation im stündlichen Detaildiagramm.

### Suchfeld nach Momentum-Scroll

Mobile Browser können den nach einer laufenden Trägheitsscrollbewegung erzeugten `click` unterdrücken, obwohl `touchend` weiterhin ausgelöst wird. Das Suchfeld verließ sich bislang im Wesentlichen auf Pointer-down und Click.

Nun gilt:

- Touchbeginn und Touchende werden getrennt erfasst.
- Nur eine Bewegung von höchstens 14 Pixeln gilt als Tap; Scrollgesten öffnen keine Tastatur.
- Der Fokus wird synchron im Touchende gesetzt und anschließend einmal per Animationsframe verifiziert.
- Die Fokussetzung verwendet `preventScroll`, damit die klebende Kopfzeile nicht erneut versetzt wird.
- Die mobile Trefferhöhe des Suchfelds beträgt mindestens 48 Pixel.

### Tagesnavigation im Detaildiagramm

Die Randpfeile reagierten ausschließlich auf `click`. Ein Browser konnte den ersten Click nach einer Trägheitsscrollbewegung zum Stoppen der Bewegung verbrauchen.

Nun gilt:

- Die Navigation besitzt einen eigenen Touch-start-/Touch-end-Pfad.
- Kleine Bewegungen werden als Tap, größere Bewegungen als Scrollgeste behandelt.
- Der nachfolgende synthetische Click wird unterdrückt, sodass ein Tap nicht doppelt wechselt.
- Die mobile Trefferfläche der Tagespfeile beträgt 44 × 44 Pixel.
- Maus- und Tastaturbedienung bleiben unverändert erhalten.

### Render-Performance beim Tageswechsel

Die aktive Detailtagesauswahl lag bislang im globalen `App`-State. Jeder Pfeiltipp renderte dadurch die gesamte Dashboard-Wurzel erneut, obwohl die Auswahl ausschließlich für die 7-Tage-/Detailkomponente benötigt wird.

Die aktive Auswahl wird nun lokal in `Forecast` geführt. Der App-Bereich erhält nur noch eine Ref-Aktualisierung für die Wiederherstellung der gewählten Tagesposition beim Standortwechsel. Dadurch bleiben Radar, Warnungen, Wetterzwilling, Zusatzmodule und Kopfzeile bei einem Tageswechsel unberührt.

Zusätzlich enthalten die memoisierten Tageszeilen nur noch statische Tagesinhalte. Die aktive CSS-Klasse wird separat gesetzt. Tagescharakter, Stundenfilter und Tages-Hazards werden deshalb beim Wechsel des Detailtags nicht für alle sieben Zeilen erneut berechnet.

### Scrollpfad

Der Fast-Scroll-Modus erzeugte für jedes Scrollereignis einen neuen Timeout. Die Erkennung verwendet nun einen einzelnen `requestAnimationFrame`-gestützten Settle-Zyklus. Die CSS-Klasse wird nur beim Start und Ende einer Scrollphase geändert. Während der Nachlaufzeit bleiben Schatten und der Header-Blur reduziert, ohne Pointer-Ereignisse zu sperren.

### Regression

Der neue Test `scripts/test-scroll-tap-performance-083315.mjs` schützt:

- den Touch-end-Fokuspfad der Suche,
- die bewegungstolerante Tagesnavigation,
- die 44-/48-Pixel-Trefferflächen,
- die lokale Forecast-Tagesauswahl,
- die von der Auswahl unabhängige Tageszeilen-Memoisierung,
- den timeoutfreien, rAF-gebündelten Fast-Scroll-Pfad.
