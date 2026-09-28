# MID Hyperlocal Downscaling Contract

Verbindlich ab MID v0.9.52.0. Dieser Vertrag ergänzt `MID_HYPERLOCAL_ANALYSIS_CONTRACT.md` und gilt für aktuelle Wetterwerte, Kurzfristkorrekturen, Events und den Wetterzwilling, soweit diese die gemeinsame Stations-/Restfeldanalyse verwenden.

## 1. Modellhintergrund vor pauschaler Höhenkorrektur

- Der hochaufgelöste Modellwert am Ziel- und Stationspunkt ist der räumliche Hintergrund.
- Höhenkorrekturen, die bereits vom Modell/API-Downscaling berücksichtigt werden, dürfen **nicht** nochmals pauschal (z. B. mit −0,65 K / 100 m) auf den Zielwert addiert werden.
- Ein freier atmosphärischer Höhengradient darf nur als diagnostischer/plausibilisierender Faktor oder in einem ausdrücklich validierten Spezialverfahren eingesetzt werden.

## 2. DEM-/Reliefprofil

- MID verwendet ein digitales Höhenmodell zur Bestimmung lokaler Geländemorphologie.
- Mindestmerkmale: Zielhöhe, Hangneigung, Exposition/Aspekt, lokales Relief und relative Gelände-/Kuppen-/Senkenposition.
- Stationsrestfelder werden nur stark übertragen, wenn Station und Ziel für den jeweiligen Parameter topografisch hinreichend vergleichbar sind.
- Temperatur/Taupunkt/Feuchte reagieren stärker auf Senken-/Hang-/Expositionsunterschiede; Wind stärker auf Kuppen-/Abschirmungsunterschiede; Luftdruck bleibt vergleichsweise tolerant.

## 3. Landnutzung, Versiegelung, LCZ und Rauigkeit

- Ein exakter GIS-Oberflächenadapter kann `imperviousnessPercent`, `builtFraction`, `lcz`, `surfaceClass` und `roughnessLengthM` liefern (`MID_SURFACE_CONTEXT_POINT_ENDPOINT`).
- Exakte Versiegelungs-/LCZ-Werte sind höherwertig als eine grobe Stadt-/Landklasse.
- Ohne konfigurierten GIS-Rasteradapter darf MID OSM-Morphologie nur als **Proxy** für Bebauungs-/Rauigkeitscharakter verwenden. Ein Proxy darf niemals als gemessene oder Copernicus-basierte Versiegelung ausgegeben werden.
- Stadtwärmeeffekte werden nicht als pauschaler Temperaturzuschlag erfunden. Sie beeinflussen primär die Übertragbarkeit beobachteter Restfelder und – bei belastbaren GIS-Daten – die Standortklassifikation. Der Effekt wird nachts und bei schwachem Wind stärker berücksichtigt.

## 4. Wind und Rauigkeit

- Oberflächenrauigkeit `z0` darf die Übertragbarkeit von Windrestfeldern zwischen offenem Feld, Wald und dichter Bebauung deutlich beeinflussen.
- Das logarithmische Windprofil darf **nicht** blind als direkte Geschwindigkeitskorrektur verwendet werden, solange die repräsentative Rauigkeit des Modellgitters bzw. der Stationsmesshöhe nicht zuverlässig bekannt ist.
- Relief-/Expositionsunterschiede dämpfen die Übertragung von Kuppen-/Lee-/Abschirmungseffekten. Eine spätere richtungsabhängige Lee-Analyse darf diesen Vertrag erweitern, muss aber gegen Beobachtungen validiert sein.

## 5. Native hochfrequente Beobachtungen

- Für dynamische Parameter sind native, aktuelle Messintervalle einem älteren gleichwertigen Messwert vorzuziehen.
- In Deutschland werden DWD-CDC-10-Minuten-Netze für Temperatur/Feuchte, Mittelwind/Windrichtung, Böenspitzen und Niederschlag direkt eingebunden; das DWD-Stadtklima-10-Minuten-Netz ergänzt die Thermodynamik in urbanen Räumen.
- `fieldObservedAt` und `fieldTemporalResolutionMinutes` müssen je Parameter erhalten bleiben. Die Frische eines anderen Feldes darf einen älteren Parameter nicht aufwerten.
- Radar/Nowcast bleibt für die räumliche Niederschlagsanalyse führend; Punktmessungen dienen als lokale Beobachtungs-/Kalibrierstütze.

## 6. Statistisches Downscaling statt Doppelkorrektur

Die kanonische Reihenfolge lautet:

1. hochaufgelöster Modellhintergrund an Ziel und Station,
2. aktuelle Beobachtung minus Modellwert am Stationspunkt,
3. parameterabhängige Qualitäts-/Frische-/Distanz-/Höhenprüfung,
4. DEM-/Oberflächen-/Rauigkeits-Kompatibilität,
5. robuste Ausreißerprüfung,
6. evidenzabhängige Restfeldübertragung auf den Zielpunkt,
7. gemeinsamer MID-Nowcast-/Stations-/Forecast-Abgleich.

Es gibt keinen garantierten Mindestimpuls einer Station. Unzureichend repräsentative Evidenz muss gegen null laufen.

## 7. Wetterzwilling / Lernen

- Der Wetterzwilling darf die lokalen Korrekturfaktoren aus verifizierten Fehlern lernen und die statischen Morphologieannahmen langfristig ersetzen bzw. kalibrieren.
- Lernwerte müssen nach Parameter, Prognosehorizont, Wetterlage und möglichst Standortregime getrennt evaluiert werden.
- MID muss nachweisen können, ob die gelernte Korrektur gegenüber der unmodifizierten Modell-/Best-Match-Prognose tatsächlich verbessert.

## 8. Regression

Neue Quellen oder Sektionen dürfen keine zweite pauschale Stadt-/Land-, Höhen- oder Stationskorrektur einführen. Änderungen an diesem Vertrag benötigen einen expliziten Regressionstest und dürfen bestehende meteorologische Funktionen nicht entfernen.
