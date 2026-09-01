# MID v0.9.77.12 – Parameterfarben, Klimatologie-Töne und lesbare 24-h-Auswahlwerte

## Anlass

1. In der aufgeklappten Tagesansicht waren trotz des appweiten Farbvertrags noch ältere Hex-Farben für Temperatur, Taupunkt, Niederschlagswahrscheinlichkeit, Wind, Böen und Luftdruck aktiv.
2. Windrichtungspfeile sollten appweit die DWD-/MID-Warnstufe widerspiegeln.
3. Tmin/Tmax-Einzelwerte sollten klimatologisch gewichtet werden, ohne ihre feste Blau-/Rot-Identität zu verlieren.
4. Im 24-h-Wetterprofil waren die Werte an der blauen Zeitlinie teilweise schwer lesbar und die Temperaturkurve durch Stundenpunkte unnötig unruhig.

## Umsetzung

### Parameterfarben

- Tagesdetailkurven verwenden ausschließlich die zentralen Parameter-Tokens:
  - allgemeine Temperatur: `--param-temperature`
  - Taupunkt: `--param-dewpoint`
  - Niederschlag/Wahrscheinlichkeit: `--param-precipitation`
  - Wind: `--param-wind`
  - Böen: `--param-gust`
  - Luftdruck: `--param-pressure`
- Alte lokale Hex-Paletten in Kurven, Achsen, Legenden, Fokus-/7d-Karten und Mini-Ribbons wurden entfernt.
- Normale Windpfeile sind Wind-grün; ab der geltenden Böenwarnschwelle tragen sie die jeweilige I1–I4-Warnfarbe.

### Temperatur + Klimatologie

- Tmin bleibt immer in der blauen Farbfamilie, Tmax immer in der roten Farbfamilie.
- Die Stärke von Text, Rand und Hintergrund einzelner Tmin/Tmax-Werte wird über die absolute Abweichung vom jeweiligen Klimamittel skaliert; ein Farbwechsel zwischen Blau und Rot ist ausgeschlossen.
- Kurzfristige Einzeltemperaturen werden – sofern Klimatologie vorhanden ist – anhand ihrer Lage zwischen klimatologischem Tmin und Tmax der passenden Blau-/Rotfamilie zugeordnet.

### 24-h-Wetterprofil

- Die blaue Zeitlinie bleibt reine Interaktionsfarbe.
- Wolken, Temperatur/gefühlt/Taupunkt, Niederschlag/Wahrscheinlichkeit, Wind/Böen und Luftdruck stehen jetzt in kontrastierten Parameter-Pills direkt an der Auswahlachse.
- Die Temperaturkurve zeigt nicht mehr einen sichtbaren Punkt je Stunde. Sichtbar bleiben der aktive Auswahlpunkt und die bereits separat markierten 24-h-Extrema.

## Architektur

- Browser/PWA/iOS verwenden weiterhin denselben React-/Vite-Fachkern.
- Kein neuer Worker-/Backendpfad.
- `MID_PARAMETER_COLOR_CONTRACT.md` ist um Warnpfeile, klimatologische Temperaturtönung und den 24-h-Auswahlvertrag erweitert.

## Extremwetter-Schwellen / Evidenzzuordnung

- Die im Screenshot sichtbare I1-Regen-Schwelle von 20 mm/6 h ist als MID-/DWD-nahe Starkregen-Untergrenze grundsätzlich korrekt; der Fehler lag in der Zuordnung der angezeigten Evidenz.
- Regen und Schnee wählen für jede I1–I4-Stufe jetzt genau das Zeitfenster, das die höchste Überschreitungswahrscheinlichkeit dieser Stufe erzeugt. Das früher verwendete „größte Mittel“ darf die Schwellenanzeige nicht mehr auf ein anderes Fenster verschieben.
- Wind verwendet je I-Stufe den Zeitschritt, der die jeweilige Böenschwelle probabilistisch am stärksten stützt.
- Modellierte Konturflächen übernehmen beim Umschreiben auf I1–I4 die jeweils zu dieser Konturstufe gehörende Evidenz (Mittel, Spread, Zeitfenster), nicht mehr die Evidenz einer anderen Stufe.
- Wenn ICON-D2-RUC eine I-Stufe stärker stützt als ICON-D2-EPS, wird auch das RUC-Signal als Evidenz angezeigt. RUC überschreibt die Evidenz nicht, wenn es die ausgewählte Stufe nicht treibt.
- Die Detailansicht trennt jetzt sichtbar: Intensitätsschwelle, EPS-Mittel bzw. RUC-Signal, EPS-Streuung und Überschreitungswahrscheinlichkeit P1–P4 für ≥ der dargestellten I-Stufe.
- Ein EPS-Mittel unterhalb der Schwelle ist damit nicht automatisch ein Widerspruch: Eine ausreichende Ensemble-Streuung kann eine reale Überschreitungswahrscheinlichkeit ergeben; Mittel, Spread und Schwelle stammen nun jedoch garantiert aus demselben Zeitfenster.

