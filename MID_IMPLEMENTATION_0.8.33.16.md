# MID v0.8.33.16

## iOS-Scroll-/Paintstabilität

Die während des Scrollens gesetzte globale Klasse `mid-fast-scroll` wurde entfernt. Sie änderte gleichzeitig die Darstellung sämtlicher Karten und der fixierten Kopfleiste und konnte dadurch auf langen mobilen Seiten einen vollständigen Style-/Compositor-Neuaufbau auslösen.

Zusätzlich gelten nun:

- durchgehender Hintergrund für `html`, `body` und `#root`,
- kein weißer Browser-Untergrund beim vertikalen Überziehen der Seite,
- statischer statt großflächig radialer Seitenhintergrund auf Touchgeräten,
- keine mobilen Backdrop-Blur-Ebenen für Kopfleiste, Tagesbereich und wichtige Popover,
- keine pro Scrollbewegung fortlaufende `requestAnimationFrame`-Schleife,
- Viewport-Module werden beim Eintritt in den Vorladebereich im nächsten Frame aktiviert, statt zusätzlich auf Timer und Idle-Callback zu warten.

## Konsistente heutige Tmin-/Tmax-Werte

Eine aktuelle Temperatur darf nicht außerhalb des dargestellten Tagesbereichs liegen.

MID bindet deshalb den aktuellen, bei frischer Verfügbarkeit stationsgestützten Temperaturwert an die nächstgelegene Stundenposition. Anschließend bildet die Tagesaggregation eine Hülle aus Tages- und Stundenwerten:

- `Tmax = max(Tagesprognose, sichtbare Stundenwerte, aktueller Wert)`,
- `Tmin = min(Tagesprognose, sichtbare Stundenwerte, aktueller Wert)`.

Dies wirkt in der aktuellen Wetterkarte, der 7-Tage-Vorhersage, dem Tagesdetail, Best-Match-Referenzen der Ensembleansicht sowie Widget-/PNG-Ausgaben. Die aktuelle Wetterkarte enthält zusätzlich eine lokale Sicherheitsprüfung.
