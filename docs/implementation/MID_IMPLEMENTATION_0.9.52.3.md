# MID v0.9.52.3 – Appweiter Responsivitäts- und Touch-Cleanup

## Ziel

Fortsetzung des Responsivitäts-Audits aus MID 17.0 ohne Funktionsabbau. Schwerpunkt ist die zuverlässige Aktivierung von Schaltflächen und interaktiven Flächen auf iOS/Touch-Geräten, insbesondere wenn bisher mehrere Eingabeereignisse dieselbe Aktion parallel ausgelöst haben oder Fokuswechsel einen Zielbutton vor dessen Click ausgehängt haben.

## Änderungen

- `CollapsibleModule` nutzt für Öffnen/Schließen nur noch den nativen Button-Click. Die parallele Pointer-Gestenerkennung samt Touch-Deduplizierung wurde entfernt.
- Die unsichtbaren Hitflächen des professionellen Forecast-Cockpits wählen einen Zeitpunkt ausschließlich über `onClick`; redundante `onPointerDown`- und `onTouchStart`-Aktivierungen wurden entfernt.
- Die Ortssuche schließt nicht mehr aus dem `blur` des Eingabefelds heraus. Bestehende Außenklick-, Fokuswechsel- und Escape-Handler bleiben erhalten. Dadurch kann ein iOS-Tap auf ein Suchergebnis nicht mehr durch ein vorheriges Unmount der Trefferliste verloren gehen.
- Appweiter Touchvertrag in `styles.css`: `touch-action: manipulation`, kein Tap-Highlight/Touch-Callout, dekorative direkte SVG-Kinder von Buttons ohne eigenes Pointer-Ziel.
- Auf groben Zeigern erhalten kompakte, bislang teils 18–31 px große Controls eine Mindest-Touchfläche von 36 px. Das betrifft insbesondere Info-, Legenden-, Stepper-, Modelllauf-, Detail-, Radar-, Event- und Cockpit-Controls. Desktop bleibt unverändert.

## Funktionsschutz

- Keine Sektion, Navigationsmöglichkeit, Tooltip-/Popover-Funktion, Favoritenfunktion, Diagrammfunktion oder Wetterlogik wurde entfernt.
- Bestehende rAF-/Memoisierungs-/Scroll-Performance-Optimierungen bleiben unverändert.
- Favoriten-Drag-&-Drop und die speziell dafür vorhandene Griff-Pointerlogik bleiben erhalten.
- Worker-Datenlogik ist fachlich unverändert.

## Regression

Neue Required-Regression: `scripts/test-appwide-touch-responsiveness-09523.mjs`.
