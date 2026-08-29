# MID v0.9.73.11 – Parameter-native DWD ICON-D2-RUC Integration

## Anlass

Der fehlgeschlagene produktive RUC-Lauf #6 zeigte, dass ein gemeinsamer 15-Minuten-Zeitvektor für alle ICON-D2-RUC-Felder fachlich falsch ist. Die erneute Prüfung des aktuellen öffentlichen DWD-v1-Parameterbaums zeigt zugleich, dass eine reine Stundenintegration zu grob wäre: ausgewählte Rapid-Felder liegen nativ deutlich höher aufgelöst vor.

v0.9.73.11 ersetzt deshalb beide pauschalen Ansätze durch einen parameterabhängigen Mehrproduktvertrag. Jede Variable behält ihre belastbare native Taktung; MID interpoliert keine fehlenden Temperatur-, Wind-, Druck- oder Wolkenzwischenwerte.

## Produktiver RUC-Vertrag

### Stündlicher Zustandskern 0…+14 h

Der gemeinsame Punktvektor bleibt stündlich und umfasst die belastbaren Kernfelder für Wetterzwilling und kanonische Stundenfusion. Dadurch bleibt die Cross-Parameter-Konsistenz erhalten.

### Niederschlag 5 min 0…+6 h

`TOT_PREC` wird als separates Rapid-Produkt im 5-Minuten-Raster verarbeitet. Daraus erzeugt MID echte 15-Minuten-Akkumulationen und behält zusätzlich die stärkste 5-Minuten-Rate als Kurzfrist-Intensitätssignal. Dieses Produkt unterstützt `displayMinutes15`, Niederschlagsbeginn/-ende, Starkregen/Sturzflut und den 0–6-h-Extremwetterpfad.

### Konvektion / Reflektivität / Phase 15 min 0…+6 h

Pflichtfelder `CAPE_ML`, `CIN_ML` werden zusammen mit dem 15-Minuten-Niederschlag geführt. Optional und fail-safe werden nur vollständig verfügbare Felder aufgenommen, darunter `DBZ_CMAX`, MU-CAPE/CIN, LPI/UH, EchoTop, Hagel, Lapse Rate, Aufwind/Vorticity sowie Regen-/Schnee-/Graupelphase.

`DBZ_CMAX` wird dabei ausdrücklich als 15-Minuten-**Modellreflektivität** behandelt und niemals als beobachtetes Radar. Beobachtungsradar, Blitz und KONRAD3D behalten höhere Priorität.

### Strahlung 15 min 0…+6 h

`ASOB_S`, `ASWDIR_S`, `ASWDIFD_S` werden als Diagnose-/Kalibrierprodukt mitgeführt. Sie ersetzen in diesem Release nicht die bestehende Sonnenscheindauer. Eine spätere Sunshine-Unterstützung benötigt explizite Intervallinterpretation, Sonnengeometrie/DNI und Beobachtungsvalidierung.

### Stündliche Spezialdiagnostik 0…+14 h

`VIS`, `CEILING`, `HZEROCL`, `SNOWLMT`, `CLCM`, `CLCH`, `T_G`, `H_SNOW` ergänzen den Punktfeed. Sicht und mittlere/hohe Bewölkung können direkt den kanonischen Stundenbestand ergänzen; Ceiling, Nullgrad-/Schneefallgrenze, Bodentemperatur und Schneehöhe bleiben zusätzlich für Aviation/Berg/Winterdiagnostik verfügbar.

`VIS` wird mit 10-m-Quantisierung gespeichert, damit hohe Sichtweiten im int16-Wireformat nicht bei ca. 32,7 km abgeschnitten werden.

## Bewusst nicht automatisch geladen

`SRH`, `WSHEAR_U`, `WSHEAR_V` sind meteorologisch sehr wertvoll, besitzen im aktuellen DWD-v1-Pfad aber eine zusätzliche `lvt1`-Dimension. Ohne explizite Auswahl und Dokumentation der Schicht würde ein automatischer Import unterschiedliche Layer vermischen. Diese Felder bleiben daher für eine gezielte Scherungs-/Helizitäts-Etappe vorgemerkt.

Große 3D-Modellflächen-, Mikrophysik- und statische Landfelder werden ebenfalls nicht in den kompakten Punktfeed dupliziert. Der vollständige Parameterentscheid ist in `MID_RUC_PARAMETER_AUDIT_0.9.73.11.md` festgehalten.

## Extremwetter

Der Mitteleuropa-Extremwetterpfad erhält im Fenster 0–6 h ein kompaktes räumliches RUC-Rapid-Summary (`mid.dwd.ruc.rapid-extreme.v2`). Es enthält Niederschlagsakkumulation/-rate, CAPE/CIN und – sofern verfügbar – zusätzliche Organisationssignale wie DBZ_CMAX, MU-CAPE/CIN, UH, LPI, EchoTop und Hagel. Diese Daten unterstützen ICON-D2/ICON-D2-EPS, ersetzen aber weder Ensemblewahrscheinlichkeiten noch beobachtete Radar-/Blitzsignale.

## Appweite Integration

- `displayMinutes15`: echte RUC-Rapid-Niederschlags-/Konvektionssignale vor dem Radarblend.
- `displayHours`: stündlicher Zustandskern plus Specialist-Overlay für Sicht und Wolkenschichten.
- Wetterzwilling / Forecast-Fusion: RUC bleibt ein DWD-ICON-Familienkalibrator, keine zweite unabhängige Stimme.
- Warn-/Hazardlogik: erhält die kanonischen Reihen; Gewitter bleibt an den appweiten Blitz-/Beobachtungsvertrag gebunden.
- Extremwetter Mitteleuropa: räumliche RUC-Rapid-Unterstützung ausschließlich 0–6 h.
- Aviation/Berg: Specialist-Diagnostik steht ergänzend bereit, ohne die bestehenden Druckniveau-/Vertikalprofilpfade blind zu überschreiben.
- Sonne/Strahlung: Diagnose-/Kalibrierpfad, keine unvalidierte Sunshine-Duration-Ersetzung.

## Regressionen

Neu bzw. aktualisiert:

- `scripts/test-ruc-native-cadence-nowcast-097311.mjs`
- `scripts/test-ruc-parameter-audit-097311.mjs`
- `scripts/test-ruc-dwd-pipeline-09690.mjs`
- `scripts/test-ruc-common-hourly-axis-097310.mjs`
- Pages-/Fusion-/Health-/Modellmeta-Verträge.

Alle lokal ausführbaren gezielten RUC-Verträge sind grün. TypeScript/Vite und die vollständige Suite bleiben in der extrahierten Linux-Arbeitskopie aufgrund des bekannten unvollständigen `node_modules`-Baums CI-pflichtig.

## Worker / Kosten

Die Worker-RUC-Leselogik und Extremwetterauswertung wurden semantisch erweitert. Nach grünem Release-Gate ist daher ein **normaler automatischer semantischer Worker-Deploy erforderlich**. Kein manueller Worker-Upload und keine kostenpflichtige Infrastruktur sind nötig. GitHub Pages bleibt der primäre kostenlose RUC-Speicherpfad; R2 bleibt deaktiviert.
