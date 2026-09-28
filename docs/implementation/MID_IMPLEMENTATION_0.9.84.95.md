# MID v0.9.84.95 – Implementierungsbericht

## Basis
Ausgangspunkt ist der fehlgeschlagene Release-Kandidat **v0.9.84.94**, der auf dem erfolgreich veröffentlichten Stable-Stand **v0.9.84.93** (Installer #1047) aufbaut. Vor der Paketierung wurde GitHub erneut geprüft: `mid-stable` stand weiterhin auf **v0.9.84.93**; Installer **#1048** hatte v0.9.84.94 nicht promotet.

## Ursache und Korrektur von Installer #1048
Der erste lokal reproduzierbare Gate-Fehler lag in `test-navigation-composite-ruc-098491.mjs`. Der Produktionscode von v0.9.84.94 bindet die Modelllinien bewusst über einen expliziten Leaflet-SVG-Renderer an das Pane `mid-model-lines`. Der ältere Testvertrag verbot genau diesen Renderer und widersprach damit der aktuellen Architektur.

Nach Korrektur dieses ersten Blockers wurde nicht sofort paketiert, sondern die komplette statische Regressionssammlung erneut durchlaufen. Dabei erschienen vier weitere veraltete Quelltextverträge, die unmittelbar den beabsichtigten v0.9.84.94-Änderungen widersprachen:
- `test-detail-wind-gust-reconciliation-071061.mjs` erwartete noch rohe `p.map`-Linien statt der neuen visuellen `monotoneSvgPath`-Kurven für Wind/Böen. Die Mess-/Stützwerte bleiben unverändert; nur die Verbindung wird geglättet.
- `test-mobile-dayrange-contour-overlays-071083.mjs` verlangte Polylines ohne expliziten Renderer und verbot den panegebundenen SVG-Renderer.
- `test-optional-bottom-navigation-09790.mjs` erwartete noch den alten 13-px-Griff; v0.9.84.94 hält bewusst 26 px der minimierten Bottom-Bar sichtbar.
- `test-performance-openmeteo-contours-071070.mjs` setzte das Modelllinien-Pane noch zwingend an `dominantModelFrame`; v0.9.84.94 erlaubt bewusst auch `vectorIsoheightFrame` bzw. Druckzentren als Rendergrundlage.

Alle fünf Altverträge wurden auf den aktuellen Funktionsvertrag angepasst. Der Produktionscode der sichtbaren v0.9.84.94-Verbesserungen musste für diesen Hotfix nicht zurückgebaut werden.

## Beibehaltener Funktionsstand aus v0.9.84.94
- Bottom-Bar-Einstellungen im einheitlichen Karten-/Menüstil, sichere Lage oberhalb iPhone-Safe-Area/Home-Indicator und sichtbar bleibender Auto-Minimierungszustand.
- 500-hPa-Isohypsen unabhängig vom vollständigen dominanten Modellframe renderbar, geglättet, Gold/Amber, mit gpdm-Labels.
- Tagesansicht mit monotone-Cubic-Interpolation für Temperatur, gefühlte Temperatur, Taupunkt, Luftdruck, Wind und Böen; Niederschlagswahrscheinlichkeit bleibt geglättet. Es werden keine meteorologischen Zwischenmesswerte als neue Daten erzeugt.

## Worker
**Keine Worker-Fachänderung in v0.9.84.95.** Der semantische Vergleich mit v0.9.84.93 ist in `worker-src/00-core-observations.js`, `worker.js` und `worker/metar-proxy.js` nach Ausblendung von `WORKER_VERSION` identisch. Ein manueller Worker-Upload ist nicht erforderlich.
