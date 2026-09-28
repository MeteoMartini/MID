# MID v0.9.45.4

## Events & Aktivitäten – kompakte, gestufte Bedienung

- Eventplaner in drei klar erreichbare Ebenen gegliedert: **Übersicht**, **Neu/Bearbeiten** und **Details & Rat**.
- Gespeicherte Events bleiben in der Übersicht extrem kompakt; zuerst sichtbar sind Termin, Ort, Rahmen/Aktivität und die meteorologischen Eckdaten.
- Aufklappen einer Eventkarte liefert eine kurze Bewertung. Die vollständige Auswertung wird gezielt über **Details & Ratschläge** geöffnet.
- Neue Events öffnen einen verdichteten Editor. Ort, Anlass, Datum, Zeit, Rahmen und Aktivität sind ohne lange Leerbereiche erreichbar.
- Aktivitätsauswahl wird auf kleinen Displays horizontal scrollbar statt die Ansicht mit vielen Zeilen zu verlängern.
- Ausführliche Stundenwerte und Modellstände liegen unter **Mehr Details**, während die eigentlichen Handlungsempfehlungen direkt sichtbar bleiben.

## Event-Ort

- Fehlerhafte mobile Flex-Basis entfernt, die den Ortsblock in schmalen Ansichten unnötig hoch machte.
- Ort wird als kompakte Kopfzeile dargestellt.
- Ortssuche ist standardmäßig geschlossen und wird nur über **Ort ändern** eingeblendet.
- MID-Ort bleibt als kompakte Schnellaktion verfügbar.

## Info-Anzeigen

- Eventplaner verwendet für Info-Schaltflächen nun dieselbe Portal-/Dismiss-Logik wie die übrige App:
  - Popover wird in den Body gerendert und bleibt im Viewport.
  - automatische Positionierung oberhalb/unterhalb des Auslösers,
  - Schließen bei Tap/Klick außerhalb und mit Escape,
  - Neupositionierung bei Scroll/Resize,
  - mobile Scroll-/Swipe-Handhabung.
- Damit werden abgeschnittene oder über Containergrenzen hinausragende Info-Flächen vermieden.

## Worker

Kein fachlicher Worker-Code geändert. Der separate `worker/metar-proxy.js` bleibt auf dem bisherigen Stand; für v0.9.45.4 ist kein Worker-Deployment erforderlich.
