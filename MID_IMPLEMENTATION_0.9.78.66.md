# MID 0.9.78.66 – 14d-Kurzaussage und Favoriten-Touchzuverlässigkeit

Grundlage ist MID 0.9.78.65. Dieses Release ändert ausschließlich die Darstellung der kompakten Wetter-Kurzaussage in der 14-Tage-Übersicht sowie die Touch-Interaktion der Favoriten-Schnellleiste.

## 14-Tage-Kurzaussage

Die Kurzaussage (`cockpit-fourteen-regime`) war in mehreren historischen Responsive-Regeln ausdrücklich mit `white-space: normal` freigegeben. Spätere Layouts vergrößerten die Karten wieder, überschrieben diese alte Umbruchfreigabe aber nicht vollständig. Dadurch konnten kurze Pillen trotz optisch vorhandenem Platz an Wortgrenzen umbrechen.

Der finale Stylesheet-Vertrag erzwingt jetzt für die 14d-Kurzaussage in Desktop sowie iPhone Hoch- und Querformat genau eine Zeile: `flex-wrap: nowrap`, `white-space: nowrap`, kein `overflow-wrap` und kein Wortbruch. Falls ein künftiges lokalisiertes Label wider Erwarten breiter als die Karte wird, wird es innerhalb der Pille gekürzt statt zweizeilig zu werden. Die eigentliche meteorologische Klassifizierung und der Textinhalt werden nicht verändert.

## Favoriten-Schnellleiste

Der Sortiergriff der Favoriten war historisch absolut über dem linken Teil jeder Favoriten-Schaltfläche positioniert. Gleichzeitig startete jeder Pointer-Down auf diesem Griff sofort einen Drag-Vorgang und unterdrückte beim Loslassen den normalen Button-Klick, selbst wenn überhaupt keine Ziehbewegung stattgefunden hatte. Dadurch entstand auf Touch-Geräten eine tote Auswahlzone. Zusätzlich lag über der nativen Button-Auswahl ein eigener Pointer-Tap-State, der bei iOS-Pointer-Cancel/Scroll-Gesten unnötig anfällig war.

v0.9.78.66 trennt Auswahl und Sortieren:

- Der Favoritenbutton selbst verwendet wieder den nativen `click`-Pfad als primäre Auswahl.
- Der Sortiergriff beginnt erst nach mindestens 8 px Bewegung tatsächlich mit Drag-and-drop.
- Ein einfaches Antippen des Sortiergriffs wählt den Favoriten aus, statt den Klick zu verschlucken.
- Klickunterdrückung nach dem Griff erfolgt nur nach einem echten Drag, nicht nach einem Tap.
- Der Griff ist wieder ein reguläres Grid-Element und keine absolut darüberliegende Touch-Überlagerung.
- Horizontales Scrollen der Favoritenliste bleibt am Container unverändert (`touch-action: pan-x`).

Damit bleiben Scrollen, Sortieren und Auswählen voneinander getrennt, ohne die Favoritenreihenfolge oder Persistenzlogik zu verändern.

## Umfang

Keine Änderungen an Wetterdaten, Ensemblelogik, Warnungen, Skybar, Worker-Fachlogik oder Cloudflare-Ressourcen. Browser/PWA und iOS verwenden denselben React-/CSS-Pfad.
