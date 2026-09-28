# MID UI/Code Audit – 0.9.84.62

## Zusammenfassung
MID ist funktional sehr breit und besitzt bereits verbindliche Verträge für Parameterfarben, Piktogramme, UI-Primitives, Touchbedienung und Fachlogik. Die größte aktuelle Designschuld liegt nicht in fehlenden Funktionen, sondern in der über Jahre gewachsenen CSS-Kaskade: viele Einzelgrößen, lokale Overrides und `!important`-Regeln erschweren eine konsequente visuelle Hierarchie.

## Befunde und Entscheidung

### Priorität A – direkt korrigiert
1. **Istwetter-Werte wurden mobil ausgeblendet.** Sichtweite und Luftdruck verschwanden unter 900 px trotz vorhandener Daten. Das widerspricht dem Ziel „ohne Funktionsverlust“. Sie werden nun responsiv umgebrochen statt entfernt.
2. **Primäre UI-Texte teils extrem klein.** Im sichtbaren Istwetterkopf lagen mehrere Beschriftungen bei etwa 5,8–8 px. Diese Größen wurden gezielt angehoben.
3. **Kleine Trefferflächen.** 14-Tage-Info und Dashboard-Sortierpfeile lagen bei etwa 20–27 px. Die visuellen Kontrollen bleiben kompakt, erhalten aber größere Bedienflächen; bei grobem Pointer mindestens 36 px.
4. **Drag-Alternative war zu wenig erklärt.** Dashboard und Favoriten besitzen bereits Pfeiltasten. Die Hinweise benennen diese Alternative nun klarer.

### Priorität B – standardisiert
- Semantische UI-Typografie (`micro/xs/sm/meta`) wurde moderat angehoben.
- Keine pauschale Änderung von Fachfarben; bestehender MID-Parameterfarbvertrag bleibt maßgeblich.
- Keine globale Radius-/Abstands-Neuschreibung, weil dies zahlreiche spezialisierte Karten, Diagramme und Exporte beeinflussen könnte.

### Priorität C – weiter beobachten / schrittweise bereinigen
- Die Stylesheets enthalten sehr viele historische `!important`-Deklarationen und zahlreiche unterschiedliche Schrift-/Radiuswerte. Das ist Wartungsschuld, aber kein sicherer Kandidat für eine automatische Massenbereinigung.
- Chart- und Kartenbeschriftungen unterhalb allgemeiner UI-Schriftgrößen müssen pro Visualisierung bewertet werden; eine globale Mindestgröße würde Achsen, Tooltippositionen und Exportlayouts gefährden.
- Komponenten mit alten lokalen CSS-Overrides sollten bei jeder nächsten fachlichen Änderung auf die MID-Tokens migriert werden.

## Update-Check
- TypeScript 7.0.2: aktuell
- Vite 8.2.2: aktuell
- Recharts 3.10.1: aktuell
- Capacitor Core 8.5.1: aktuell
- MapLibre GL 6.7.0 → 6.9.0 verfügbar; für einen separaten, vollständig buildbaren Wartungsschritt vorgemerkt

## Wissenschaftliche Konsistenz
Dieser Wartungsstand ändert keine Schwellenwerte, Modellgewichte, Messwertprioritäten, WMO-/DWD-Terminologie, Niederschlagszeitbezug oder Gefahrenklassifikation. Designbereinigung und Fachlogik bleiben getrennt.
