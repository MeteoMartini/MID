# MID v0.9.77.15 – Gefahrenbezeichnung und Temperatur-Farbvertrag

## Anlass

Der übergebene Referenzanhang verlangt zwei appweit konsistente Korrekturen: Karten-Popups modellierter Extremwetterflächen sollen die tatsächlich dargestellte Gefahr nennen und nicht mehr generisch „Modellierte Gefahrenfläche“. Außerdem sollen aktuelle/stündliche Temperaturwerte neutral in Schwarz/Weiß erscheinen; Blau und Rot sind ausschließlich Tmin/Tmax vorbehalten. Für 7- und 14-Tage-Werte wird die Sättigung innerhalb der jeweiligen Farbfamilie an der signierten Abweichung vom klimatologischen Tmin/Tmax ausgerichtet.

## Umsetzung

### Extremwetterkarte

- `ExtremeOutlookAreaOverlay` leitet die Popup-Bezeichnung aus `area.signal.hazard` und dem kanonischen `EXTREME_HAZARDS`-Katalog ab.
- Gewitterflächen zeigen damit „Gewitter“, Regenflächen „Stark-/Dauerregen“, Windflächen „Sturm“, Schneeflächen „Schnee“ und Eisflächen „Glätte/Eisregen“.
- Die Regionsbezeichnung, I-Stufe und Eintrittswahrscheinlichkeit bleiben flächengebunden und unverändert.
- Der generische Popup-Text „Modellierte Gefahrenfläche“ wurde entfernt.

### Aktuelle und stündliche Temperaturwerte

- `hourlyTemperatureTone()` bleibt die zentrale Darstellungsfunktion, liefert nun aber ausschließlich neutrale Theme-Farben.
- Zahlen in „Nächste 90 Minuten“, der stündlichen Kurzfristvorschau und den aufgeklappten Tagesdetails erscheinen dadurch in `var(--text)` – im Hellmodus dunkel/schwarz, im Dunkelmodus hell/weiß.
- Auch der ausgewählte stündliche Temperaturwert im 24-h-Wetterprofil verwendet neutrale Textfarbe.
- Temperaturkurven dürfen weiterhin den allgemeinen Temperatur-Parameterfarbtoken verwenden; die Neutralitätsvorgabe betrifft die numerischen aktuellen/stündlichen Einzelwerte. Tmin/Tmax bleiben davon getrennte Tagesextrema.

### 7-/14-Tage Tmin/Tmax

Die zentrale Funktion `dailyTemperatureTone()` verwendet weiterhin ausschließlich die kanonischen Familien `--param-temperature-min` und `--param-temperature-max`, wertet die Klimaabweichung aber nun **signiert** statt über ihren Betrag aus.

- **Tmin / Blau:** deutlich kälter als das klimatologische Tmin → stärkste/dunkelste Blautönung; Klimamittel → helleres Referenzblau; deutlich milder → sehr helle/entsättigte Blautönung.
- **Tmax / Rot:** deutlich kühler als das klimatologische Tmax → sehr helle/entsättigte Rottönung; Klimamittel → kräftiges Basisrot; deutlich wärmer → stärkste/dunkelste Rottönung.
- Zwischenwerte werden kontinuierlich interpoliert; die Farbfamilie wechselt niemals.
- Die 7-Tage-Legende erläutert nun ausdrücklich: „Tmin blau, Tmax rot · Sättigung = Abweichung vom jeweiligen Klimamittel.“

## Verträge und Regression

- `MID_PARAMETER_COLOR_CONTRACT.md` auf v0.9.77.15 fortgeschrieben.
- Frühere Regressionen, die die inzwischen verworfene klimatologische Blau-/Rot-Einfärbung stündlicher Einzeltemperaturen oder den generischen Gefahrenflächen-Text verlangten, auf den neuen verbindlichen Vertrag migriert.
- Neue Regression `scripts/test-attachment-hazard-temperature-colors-097715.mjs` schützt Popup-Gefahr, neutrale aktuelle Temperaturwerte, signierte Tmin/Tmax-Sättigung und den 24-h-Auswahlwert.

## Architektur / Worker

Keine meteorologische Worker-Fachlogik, keine Datenquelle und kein Requestpfad wurde verändert. Der Worker wird lediglich auf die gemeinsame Releaseversion synchronisiert.

**Manueller Worker-Upload erforderlich: nein.**
