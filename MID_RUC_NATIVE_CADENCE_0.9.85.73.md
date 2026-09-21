# MID 18.2.1 · RUC parameter-native cadence · v0.9.85.73

## Ziel

Die operative Kurzfrist soll nicht alle meteorologischen Größen pauschal auf dieselbe Zeitauflösung zwingen. MID verwendet die feinste **tatsächlich publizierte** und fachlich sinnvolle ICON-D2-RUC-Kadenz und fällt pro Parameter sauber auf die Stundenreihe zurück.

## 0…+6 h

### 5 Minuten
- Niederschlagsakkumulation `TOT_PREC` (bereits produktiv)
- Radar-/Nowcast-Beobachtung bleibt davon getrennt und weiterhin höher priorisiert, wenn am Standort belastbar.

### 15 Minuten, sofern der jeweilige DWD-Lauf vollständig nativ vorliegt
- Temperatur 2 m `T_2M`
- Taupunkt 2 m `TD_2M`
- relative Feuchte 2 m `RELHUM_2M`
- MSL-Druck `PMSL`
- Windkomponenten `U_10M`/`V_10M` → Geschwindigkeit/Richtung
- Böen `VMAX_10M`
- Gesamtbewölkung `CLCT`
- tiefe Bewölkung `CLCL`
- mittlere/hohe Bewölkung `CLCM`/`CLCH`, **nur wenn** der konkrete Lauf tatsächlich 15-min-Termine anbietet
- Sicht `VIS`
- Ceiling `CEILING`
- Nullgradgrenze `HZEROCL`
- Schneefallgrenze `SNOWLMT`
- Bodentemperatur `T_G`
- CAPE/CIN, Reflektivität, Gewitter-/Severe- und Phasenfelder bleiben in ihren bereits vorhandenen nativen Rapid-Pfaden.

## Stündlicher Fallback / > +6 h

Der bestehende stündliche Zustandsvektor bleibt vollständig erhalten. Ein Feld wird nur in `rapid-state-15m.bin` publiziert, wenn sämtliche 15-min-Zieltermine des Rapid-Fensters vorliegen. Stundenwerte werden niemals als native 15-min-Daten etikettiert. Langsam veränderliche Spezialgrößen wie Schneehöhe bleiben stündlich.

## Verwendung in MID

Das Worker-Punktprodukt liefert `rapid.state15` einschließlich seiner tatsächlich verfügbaren Felder und `nativeResolutionSeconds=900`. Die Forecast-Fusion übernimmt den nativen Zustandsvektor mit abnehmendem Kurzfristgewicht (stärkster Einfluss 0…2 h), ohne Beobachtungen/Radar oder die kohärente Leitprognose zu verdrängen. `displayMinutes15`, 90-Minuten-Karten, Wettertext, Piktogramme und Skybar greifen anschließend auf denselben finalisierten 15-min-Zustand zu.

Fehlt ein natives Feld, bleibt exakt für dieses Feld der bisherige stündliche/interpolierte Zustand maßgeblich.
