# MID 18.2.8 · RUC native cadence · v0.9.85.94

## Verbindliche Quelle

Die operative MID-Kadenz wird ab diesem Stand in `tools/ruc/native_cadence.py` maschinenlesbar geführt. Grundlage ist die offizielle DWD-Modelldokumentation für ICON-D2-RUC sowie die tatsächlich publizierte Open-Data-Struktur.

Offizielle Referenz:
- DWD ICON-D2-RUC Modelldokumentation, Kapitel 11 „ICON-D2-RUC output fields“
- DWD Open Data `/weather/nwp/v1/m/icon-d2-ruc/p/`

## Für MID relevante native Auflösungen

| Feldgruppe | Native Kadenz | MID-Verwendung |
|---|---:|---|
| `TOT_PREC` | 5 min | Niederschlagsbeginn/-ende, Nowcast-/RUC-Fusion |
| `CAPE_ML`, `CIN_ML` | 15 min | konvektive Kurzfristdiagnose |
| `VIS`, `CEILING` | 15 min | Sicht, Nebel/tiefe Wolken, Aviation-/Phasenstützung |
| `DBZ_CMAX`, LPI/UH/EchoTop und verifizierte Rapid-Diagnostik | 15 min | Gewitter-/Severe-Diagnostik |
| `CAPE_MU`, `CIN_MU` | 60 min | nur stündlich; kein 15-min-Rapidpfad |
| `T_2M`, `TD_2M`, `RELHUM_2M`, `PMSL` | 60 min | gemeinsamer Zustandskern |
| `U_10M`, `V_10M`, `VMAX_10M` | 60 min | Wind/Böen |
| `CLCT`, `CLCL`, `CLCM`, `CLCH` | 60 min | Bewölkung/Skybar, keine erfundene Viertelstunde |
| `T_G` | 60 min | Spezial-/Bodenparameter |

## Schutzregeln

1. Eine feinere Anzeigeauflösung darf niemals als native Modellauflösung etikettiert werden, wenn sie nur interpoliert ist.
2. `CAPE_MU` und `CIN_MU` dürfen nicht mehr im 15-min-Severe-Download/-Packpfad erscheinen.
3. 90-Minuten-, Skybar- und Piktogrammverbraucher verwenden weiterhin den kanonischen finalisierten Zustand; eine feinere UI-Achse erzeugt keine zweite Modellstimme.
4. Beobachtungsradar und belastbare lokale Messungen behalten im unmittelbaren Nowcast Vorrang vor Modell-Rapidfeldern.
5. Änderungen der DWD-Kadenz werden zuerst in der maschinenlesbaren Kadenzquelle aktualisiert und danach über Regressionen in Downloader, Packer und Dokumentation gespiegelt.

## Gewitterdarstellung

Die aus CAPE/CIN, Niederschlag, Reflektivität, LPI, UH, EchoTop und Aufwind abgeleitete Mehrparameterdiagnose ist ein **Diagnosesignal**, keine kalibrierte Eintrittswahrscheinlichkeit. Sichtbar wird sie deshalb als Signalstärke 0–100 und nicht mehr mit Prozentzeichen dargestellt. Amtliche Wahrscheinlichkeiten sowie echte Ensemble-/Niederschlagswahrscheinlichkeiten bleiben davon getrennt.
