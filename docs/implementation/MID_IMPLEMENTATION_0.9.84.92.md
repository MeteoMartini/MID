# MID v0.9.84.92 – Implementierungsbericht

## Ausgangslage
Basis ist der erfolgreich installierte und nach `mid-stable` promovierte Stand v0.9.84.91 (Installer #1045). Die Korrektur reagiert auf vier konkrete iPhone/PWA-Befunde: Aktuelles Wetter war nicht mehr direkt in der Bottom-Bar erreichbar, die schwebende Bar saß zu weit oberhalb des Home-Indicators, die Komposit-Konfiguration ging bei bestimmten Wechseln verloren, und im Synoptikmodus erschienen DWD-Isobaren, aber keine MID-500-hPa-Isohypsen samt gpdm-Beschriftung.

## Umsetzung

### 1. Aktuelles Wetter wieder direkt in der Bottom-Bar
Die mobile Primärnavigation umfasst jetzt sechs Ziele: **Aktuell · Kurzfrist · 7 Tage · 14 Tage · Komposit · Mehr**. `Aktuell` springt auf das kanonische Modul `current`; ein separater Beta-/Heute-Pfad wurde nicht wieder eingeführt. Damit bleibt die frühere Bereinigung erhalten, während Aktuelles Wetter wieder mit einem Tap erreichbar ist.

Die Bottom-Bar hat zusätzlich die persistente Einstellung `mid:bottom-bar-behavior:v1` erhalten:
- **Auto**: minimiert erst nach ca. 118 px kumulierter Abwärtsbewegung und erscheint nach ca. 8 px Aufwärtsbewegung wieder vollständig.
- **Fixiert**: bleibt dauerhaft vollständig sichtbar.

Die Auswahl befindet sich in den Einstellungen im Bereich der Oberflächen-/Navigationsoptionen und wird wie die Favoritenleisten-Option lokal gespeichert.

### 2. iPhone-Lage / Safe Area
Die mobile Bottom-Bar berücksichtigt den Home-Indicator weiterhin, zählt die Safe Area aber nicht mehr als großen zusätzlichen Außenabstand. Der sichtbare Abstand wird aus `max(6px, safe-bottom - 18px)` abgeleitet; im Querformat analog kompakter. Für 320–430 px breite Geräte werden Icon- und Labelgrößen moderat reduziert, die Touchflächen bleiben groß genug. `Kurzfrist`, `7 Tage` und `14 Tage` bleiben einzeilig.

### 3. Komposit-Konfiguration robust speichern
Der bisherige React-Effekt bleibt erhalten, ist aber nicht mehr die einzige Sicherung. Ein synchroner `compositeSettingsRef` hält stets den letzten Zustand. Presets und Ansichtswechsel schreiben ihre Änderungen sofort. Zusätzlich wird beim `pagehide`, beim Wechsel des Dokuments auf `hidden` sowie beim Komponentenabbau gespült. Damit werden insbesondere PWA-Backgrounding, schneller Tabwechsel und schnelles Verlassen des Kompositmoduls abgedeckt.

Der gespeicherte Zustand umfasst weiterhin Ansicht, Radar/Satellit/Synoptik, Overlays, Modelllinien, Kartenbasis, Deckkräfte und Wiedergabeverhalten. Ein historischer Zeitindex wird bewusst nicht als Startzeit konserviert; nach erneutem Öffnen beginnt MID mit aktuellen Daten in der zuletzt gewählten Darstellung.

### 4. 500-hPa-Isohypsen samt gpdm-Labels
Die sichtbaren DWD-Isobaren stammen aus dem nativen DWD-WMS. Die MID-Isohypsen sind dagegen Vektorkonturen aus dem separaten Modellgitter. Die Screenshot-Situation – DWD-Isobaren vorhanden, aber keine goldenen Isohypsen/Labels – zeigte daher einen Ausfall bzw. eine zu langsame Bereitstellung des Grid-Frames.

Das Frontend verwendet nun einen `vectorIsoheightFrame`: bevorzugt wird der Grid-Frame, bei vorhandenen Vektoren kann aber ein geeigneter Modellframe einspringen. Linie und Beschriftung bleiben im gleichen `mid-model-lines`-Pane. `MemoContours` zeichnet die 500-hPa-Isohypsen in Gold/Amber, gestrichelt; die permanenten Labels zeigen `gpdm`.

Im Worker wurde der Open-Meteo-Rasterabruf für das unveränderte 17×25-Europagitter gebündelt: statt bis zu 17 separaten Zeilenrequests werden jeweils vier Rasterzeilen pro Request geladen (typisch ca. fünf parallele Requests). Das 8-gpdm-Konturintervall, Rasterdichte, θe-Frontendiagnostik und Modellparameter bleiben unverändert. Ziel ist ausschließlich, den Vektorframe rechtzeitig und zuverlässiger verfügbar zu machen.

## Release-/Worker-Hinweis
Die Worker-Fachlogik hat sich durch das gebündelte Modellgitter geändert. **Worker-Upload erforderlich: Ja.** Der vorhandene sichere Auto-Deploy-Pfad des Installers soll den Worker erneut über 0%-Smoke und anschließende Promotion ausrollen.
