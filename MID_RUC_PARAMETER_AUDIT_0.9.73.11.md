# MID v0.9.73.11 – Appweiter DWD ICON-D2-RUC Parameter-Audit

Stand: 29.08.2026. Grundlage ist der aktuelle öffentliche DWD-v1-Parameterbaum `https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/p/` mit 114 gelisteten Parametern. Leitregel: native DWD-Taktung erhalten, keine künstliche Interpolation, Radar/Blitz/Beobachtung behalten im Nowcast Vorrang, und RUC bleibt innerhalb der DWD-ICON-Familie ohne zusätzliche unabhängige Modellstimme.

## A. Produktiv genutzt / mit v0.9.73.11 verdrahtet

### Gemeinsamer stündlicher Zustandskern 0…+14 h
`T_2M`, `TD_2M`, `RELHUM_2M`, `PMSL`, `U_10M`, `V_10M`, `VMAX_10M`, `TOT_PREC`, `CLCT`, `CLCL`, `CAPE_ML`, `CIN_ML`.

Nutzen: kanonische Kurzfristfusion / Wetterzwilling / displayHours. Die Felder werden gemeinsam nur auf ihrer belastbaren Stundenachse verwendet.

### Natives Rapid-Niederschlagsprodukt 5 min 0…+6 h
`TOT_PREC`.

Nutzen: displayMinutes15, Niederschlagsbeginn/-ende, Intensitätsspitzen, Starkregen-/Sturzflutunterstützung und Extremwetter 0–6 h. Aus den nativen 5-min-Akkumulationen wird zusätzlich eine echte 15-min-Summe gebildet; der stärkste 5-min-Impuls bleibt als Rate erhalten.

### Natives 15-min-Konvektions-/Extremwetterprodukt 0…+6 h
Pflicht: `CAPE_ML`, `CIN_ML`.

Optional, nur wenn der konkrete DWD-Lauf vollständig ist: `DBZ_CMAX`, `CAPE_MU`, `CIN_MU`, `LPI`, `LPI_MAX`, `UH_MAX`, `UH_MAX_LOW`, `UH_MAX_MED`, `ECHOTOPinM`, `HAIL_GSP`, `LAPSE_RATE`, `W_CTMAX`, `VORW_CTMAX`.

Nutzen: konvektive Unterstützung von displayMinutes15 und insbesondere Mitteleuropa-Extremwetter 0–6 h. Kein einzelnes Modellfeld erzeugt allein einen Gewittercode. Beobachteter Blitz, KONRAD3D/Mesozyklonen und Radar bleiben bestätigende/höher priorisierte Quellen.

### Niederschlagsphase 15 min 0…+6 h
`RAIN_GSP`, `SNOW_GSP`, optional `GRAU_GSP`.

Nutzen: Verteilung des RUC-Niederschlags auf Regen/Schnee/Graupel in der kanonischen 15-min-Reihe. Die Phase bleibt zusätzlich temperatur-/Feuchttemperatur-/Radar- und Beobachtungs-plausibilisiert.

### Strahlung 15 min 0…+6 h
`ASOB_S`, `ASWDIR_S`, `ASWDIFD_S`.

Nutzen: vorerst Diagnose/Kalibrierung für Strahlung, thermische Belastung, PV-/Sonnenplausibilität und Wetterzwilling. Keine direkte Ersetzung des appweiten Sunshine-Duration-Contracts. Eine spätere Sonnenscheindauer muss aus direkter Strahlung plus Sonnengeometrie/DNI und WMO-Schwelle validiert werden.

### Stündliche Spezialdiagnostik 0…+14 h
`VIS`, `CEILING`, `HZEROCL`, `SNOWLMT`, `CLCM`, `CLCH`, `T_G`, `H_SNOW`.

Nutzen: Sicht und mittlere/hohe Bewölkung können die kanonischen Stunden ergänzen; Ceiling, Nullgradgrenze, Schneefallgrenze, Bodentemperatur und Schneehöhe werden für Aviation/Berg/Winterdiagnostik mitgeführt. Sie sind keine neue Modellstimme.

## B. Hoher fachlicher Wert, aber bewusst noch nicht direkt aktiviert

### Vertikale Scherung / SRH – hoher Wert, Layersemantik zuerst verifizieren
`SRH`, `WSHEAR_U`, `WSHEAR_V`.

Bewertung: meteorologisch sehr wertvoll für organisierte Konvektion, Superzellen und Rotation. Der aktuelle DWD-v1-Baum führt diese Felder jedoch über eine zusätzliche `lvt1`-Dimension. MID lädt sie daher bewusst noch **nicht automatisch** in den kompakten Rapid-Punktfeed, solange die zugehörige Schicht-/Levelbedeutung nicht explizit ausgewählt und regressionsgesichert ist. Das verhindert, dass mehrere vertikale Scher-/Helizitätslayer unbemerkt vermischt werden.

### Erweiterte Radar-/Konvektionsdiagnostik
`DBZLMX_LOW`, `DBZ_850`, `DBZ_CTMAX`, `ECHOTOP`, `DEMAX_HAIL_S`, `DEMAX_HAIL_TMAX_S`, `KEF_HAIL_MAX_S`, `KE_HAIL_S`, `SDI_2`, `TCOND10_MX`, `TCOND_MAX`.

Bewertung: fachlich interessant, insbesondere für Hagel/Zellstruktur. Vor produktiver Gewichtung müssen Einheiten, Akkumulations-/Max-Zeitfenster und DWD-spezifische Schwellen explizit regressionsgesichert werden. `ECHOTOPinM` wird bereits bevorzugt, weil die metrische Interpretation direkt ist.

### Niederschlagsraten-/Mikrophasenprodukte
`PREC_GSP`, `PR_GSP`, `PRR_GSP`, `PRS_GSP`, `PRG_GSP`, `PRH_GSP`, `TOT_PR`, `TOT_PR_MAX`, `TOT_PREC_D`.

Bewertung: grundsätzlich nützlich, aber im kompakten MID-Pfad weitgehend redundant zu 5-min `TOT_PREC` plus `RAIN_GSP/SNOW_GSP/GRAU_GSP`. Direkte Raten können später bei nachgewiesenem Mehrwert für Hagel-/Phase-/Intensitätsdiagnostik ergänzt werden.

### Wolken-/Feuchte-Säulen und Hydrometeore
`TQC`, `TQC_DIA`, `TQG`, `TQH`, `TQI`, `TQI_DIA`, `TQR`, `TQS`, `TQV`, `TQV_DIA`, `QC`, `QC_DIA`, `QG`, `QH`, `QI`, `QI_DIA`, `QR`, `QS`, `QV`, `QV_2M`, `QV_S`, `TCH`, `TCM`.

Bewertung: potenziell wertvoll für Vereisung, Wolkenwasser und Niederschlagsmikrophysik, aber derzeit kein ausreichender Zusatznutzen gegenüber dem bestehenden Druckniveau-/Aviation-/Feuchtepfad für die hohe Datenmenge. Kandidat für einen späteren gezielten Aviation-Icing-Audit, nicht für den allgemeinen Punktfeed.

## C. Spezial-/3D-Felder – nicht in den kompakten Punktpfad

`T`, `U`, `V`, `W`, `P`, `FI`, `RELHUM`, `CLC`.

Diese Felder besitzen vertikale Dimensionen bzw. Modellflächen und wären für Flugmeteorologie/Vertikalprofile grundsätzlich wertvoll. MID besitzt hierfür bereits einen gezielten Druckniveau-/Streckenbriefingpfad. Ein vollständiger RUC-3D-Download würde die kostenlose Pipeline massiv vergrößern; deshalb keine appweite Punktfeed-Duplizierung. Eine spätere RUC-Vertikalprofil-Etappe kann ausgewählte Levels separat prüfen.

## D. Oberflächen-/Land-/statische Kontextfelder – vorhandene MID-Quellen sind geeigneter

`ALB_RAD`, `DEPTH_LK`, `FR_ICE`, `FR_LAKE`, `FR_LAND`, `HHL`, `HSURF`, `LAI`, `PLCOV`, `ROOTDP`, `SOILTYP`, `Z0`, `PS`.

Bewertung: teils nützlich für Landoberfläche, See-/Eis- oder Strahlungskontext, aber MID besitzt DEM, Landnutzung/Copernicus, Wasser-/Stations- und andere Kontextquellen. Diese Felder werden nicht pro RUC-Lauf redundant übertragen. `ALB_RAD` bleibt möglicher späterer Solar-/Schnee-Albedo-Kalibrator.

## E. Simulierte Satelliten-/Spezialprodukte – nicht als Punktforecast

`SYNMSG_BT_CL_IR10.8`, `SYNMSG_BT_CL_WV6.2`.

Sehr interessant für Karten-/Satellitenvergleich, aber ungeeignet für den kompakten Punktfeed. MID nutzt reale Radar-/Satelliten-/Beobachtungskanäle höher priorisiert. Ein späteres Karten-Layer-Audit ist möglich.

## F. Wettercode

`WW`.

Nicht als alleinige RUC-Wettercode-Autorität verwenden. MID besitzt einen appweiten Niederschlags-/Phasen-/Gewittervertrag; insbesondere darf ein Modellcode ohne beobachteten Blitz kein bestätigtes Gewitter erzeugen. `WW` kann später als Diagnose-/Plausibilitätsfeld dienen, aber nicht den kanonischen Codevertrag umgehen.

## Appweite Priorität

1. Beobachtung / Blitz / Radar / KONRAD3D.
2. RUC native 5-/15-min Rapidfelder für 0–6 h.
3. RUC stündlicher Mehrvariablenkern bis +14 h.
4. reguläres ICON-D2 / weitere unabhängige Modelle / Best Match gemäß bestehender Fusion.
5. RUC-EPS stündlich als probabilistische Kurzfriststütze, ohne Doppelgewichtung der DWD-ICON-Familie.

## Sunshine

`ASWDIR_S` ist der beste RUC-Kandidat zur späteren Unterstützung der Sonnenscheindauer. MID leitet daraus in v0.9.73.11 bewusst noch keine Sonnenscheinminuten ab. Notwendig sind Deakkumulation/Intervallinterpretation, Sonnenzenit-Geometrie, Umrechnung auf direkte Normalstrahlung und Validierung gegen die WMO/DWD-Schwelle sowie Beobachtungen. Bis dahin bleiben die RUC-Strahlungsfelder Diagnose-/Kalibrierquellen.
