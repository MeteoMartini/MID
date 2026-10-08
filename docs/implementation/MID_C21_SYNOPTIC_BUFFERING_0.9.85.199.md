# MID-C21 · Synoptik und gepufferte Bildwechsel · v0.9.85.199

Basis main = mid-stable = 36110a193328b0e4a5978e742e3768a8fcd9664f (.198), vor Änderungen gelesen und mit offenen PRs abgeglichen. Veröffentlichung über unveränderte Source-PR-/Installer-/Stable-Gates.

## Vergleich und fachliche Umsetzung

Der bisherige Ausschnitt (43–60° N, 10° W–30° O), sämtliche Windvektoren und kontinuierliche Farbübergänge verschlechterten die Übersicht gegenüber der Referenz. Native GRIB-Felder werden jetzt bis 29,5–70,5° N und 23,5° W–62,5° O ausgewählt, jeweils begrenzt durch das echte Modellgebiet. Dies entspricht der offiziellen DWD-ICON-EU-Gitterbeschreibung (Tabelle 9.1, https://www.dwd.de/SharedDocs/downloads/DE/modelldokumentationen/nwv/icon_d2/icon_d2_dbbeschr_aktuell.pdf). Die Europadarstellung verwendet ein 0,125°-Übersichtsraster (14 km in der vorhandenen gerundeten Rastermetadaten-Konvention); die originale DWD-Auflösung beträgt 0,0625°. Alle sieben Ausgangskomponenten werden identisch abgetastet. GFS/IFS bleiben bei ihrem 0,25°-Raster; ICON-D2 bleibt regional und hochaufgelöst. Daten werden nicht über die Modellabdeckung hinaus erfunden.

300-hPa-Windpfeile erscheinen gemäß Auftrag ab 60 kt, mit monoton wachsender Länge/Dicke und 40-Pixel-Zellen für lesbare Dichte. Dies ist eine Darstellungsgrenze, keine Diagnose eines Jetstream-Kerns. Theta-E wird weiterhin fachlich mit Bolton/LCL aus T850/RH850 berechnet; nur die Darstellung verwendet 6-Grad-Stufen. Konturen werden alle 6 Grad berechnet, Labels nur bei Vielfachen von 12. Daraus allein ergibt sich keine verlässliche Schneefallgrenze. RH700 zeigt genau die 60-%-Linie gestrichelt und die 80-%-Linie durchgezogen.

## Termine, Wahrheit und Budget

Angefordert werden 0, 3, 6, 9, 12, 15, 18, 21, 24, 30, 36, 42 und 48 Stunden. Ein angebotener Termin enthält stets alle fünf Komponenten desselben Laufs. SHA-256, Einheiten, physikalische Bereiche und Dekodierungsgrenzen bleiben geprüft. Alte vollständige Neun-Termin-Kataloge bleiben lesbar. Vor der Veröffentlichung werden optionale zusätzliche Termine bei Bedarf entfernt, bis das unveränderte 900-MB-Pages-Budget eingehalten wird; die neun bisherigen Kerntermine werden dabei nie entfernt. Reichen vollständige Kerndaten nicht in das Budget, wird die Veröffentlichung abgebrochen. Konturen werden mit höchstens 0,01° geometrischer Abweichung vereinfacht, ohne meteorologische Werte zu verändern.

## Bildwechsel und gemeinsame Verbraucher

Der gemeinsame ImageQuadLayer behält die sichtbare Quelle während des Ladens/Decodierens. Erst nach erfolgreichem Bild-Upload beginnt eine 350-ms-Überblendung; ein veralteter asynchroner Abruf kann keine Ebene mehr installieren. Höchstens Vorgänger und Nachfolger bleiben als sichtbare Bildquellen gehalten. CanvasOverlay zeichnet den Nachfolger bei erhaltenem Canvas und blendet aus einem begrenzten Snapshot. Damit nutzen alle Verbraucher dieselbe Darstellung, einschließlich der OPERA-Radaransicht; deren zeitgebundener Remount entfällt. Native Synoptikfelder bleiben während des Folgeabrufs sichtbar; die Statuszeile nennt die tatsächliche sichtbare Gültigkeitszeit und einen Ladehinweis. Bei Fehlern bleibt der letzte validierte Termin ausdrücklich gekennzeichnet. Playback-Ready verlangt weiterhin den angeforderten Termin. Die WMS-Ansicht behält ihren letzten geladenen Stand und lädt den gewählten Nachfolger verdeckt, bevor sie überblendet. Vorhandene Radar-/Satelliten-Puffer bleiben erhalten.

## Validierung

Neue Regression: test-c21-synoptic-buffering-0985199.mjs. Erweiterte ecCodes-Tests verifizieren ein tatsächliches 1377×657-ICON-EU-GRIB mit dem größeren Gebiet, die 0,125°-Abtastung, Theta-E-Konturstufen und das optionale Terminbudget. Die Karten-Browsermatrix prüft langsame Folgetermine und beschädigte Nachfolgedaten mit tatsächlich erhaltenen MapLibre-Bildebenen sowie weiterhin alle 24 Gerätebreite-/Theme-/Designkombinationen. Die vollständige bestehende Regressionssuite und Build-Budgets bleiben verbindlich. Browsertests simulieren Viewports; sie ersetzen keinen physischen Safari-/iPad-Gerätetest.
