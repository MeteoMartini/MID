# MID v0.9.77.14 – Regionale Modellgebiete und grenzüberschreitende Fusion

## Anlass

Nach dem Audit der hochaufgelösten Regionalmodelle wurde die geografische Modellwahl weiter vereinheitlicht. Mehrere Modelle waren bereits numerisch eingebunden, die Anwendbarkeit wurde in einzelnen Metadaten-/Fusionpfaden jedoch noch teilweise über Länderkennzeichen statt primär über das tatsächliche Modellgebiet entschieden. Zusätzlich waren die DMI-HARMONIE-Auflösungsangaben inkonsistent.

## Umsetzung

- Reale/konservative Modell-BBoxen sind nun im App-Modellstandpfad und in der Worker-Fusion konsistent hinterlegt.
- Besitzt ein Regionalmodell eine BBox, entscheidet diese zuerst über seine Anwendbarkeit. Ein Länderkennzeichen darf ein Modell außerhalb seiner BBox nicht mehr aktivieren.
- Umgekehrt können Regionalmodelle innerhalb ihrer BBox grenzüberschreitend als zusätzliche Wetterzwilling-Quelle genutzt werden.
- Länderkennzeichen bleiben als Priorisierungssignal innerhalb des Modellgebiets erhalten; die regionale Gewichtung bevorzugt weiterhin den jeweils zuständigen nationalen Dienst.
- MeteoSwiss ICON-CH1/CH2 erhalten im deterministischen App-/Worker-Pfad die bereits bei den Ensembleprodukten verwendete Central-Europe-BBox `[3,43,18,50]`.
- GeoSphere AROME Austria verwendet konsistent `[8,45,18,50]`, 2,5 km und 60 h / 2,5 Tage.
- CHMI ALADIN CZ 1 km, Météo-France AROME/AROME HD inkl. 15-min-Pfade, KNMI HARMONIE NL, UKMO UKV, MET Nordic sowie NOAA HRRR/NAM/NBM erhalten im Modellstandpfad dieselben regionalen Grenzen wie die Fusion.
- DMI HARMONIE AROME Europe ist konsistent auf 2 km, 60 h / 2,5 Tage und BBox `[-15,35,32,72]` gestellt.
- KNMI und DMI verbleiben gemeinsam in `uwc-west-harmonie`; MeteoSwiss CH1/CH2 verbleiben in `meteoswiss-icon`. Es entsteht keine zusätzliche unabhängige Modellstimme durch die grenzüberschreitende Aktivierung.

## Wirkung

Für Standorte im süddeutschen/alpinen Grenzraum können beispielsweise neben DWD ICON-D2 auch MeteoSwiss ICON-CH und GeoSphere AROME als zusätzliche regionale Quellen in die Multimodellfusion gelangen, sofern der Standort im jeweiligen Modellgebiet liegt. Die nationale Quelle erhält weiterhin den höheren Regionalfaktor; grenzüberschreitende Quellen ergänzen den Konsens mit geringerem Regionalbonus.

Die geänderte BBox-Priorität verbessert zugleich CONUS-/UK-/Nordic-/ALADIN-Pfade, da ein Länderkennzeichen nicht mehr versehentlich ein begrenztes Regionalmodell für das gesamte Staatsgebiet freischaltet.

## Regression

Neu: `scripts/test-regional-model-domain-fusion-097714.mjs` schützt Modellgebiete, DMI-Metadaten, grenzüberschreitende Nutzung und die bestehenden Unabhängigkeitsgruppen.

Im vollständigen automatischen Lauf wurden 627 Tests erkannt. **522/522 umgebungsunabhängige Tests bestanden**. Die verbleibenden 105 Tests benötigen ausschließlich die im Transport-ZIP nicht enthaltene lokale npm-/TypeScript-Testtoolchain (`typescript-strada`, TypeScript-7-CLI, `esbuild` bzw. lokales `tsc`). Es verbleibt kein zusätzlicher fachlicher Regressionstest-Fehlschlag.

## Worker

Die Worker-Fusion wurde fachlich geändert. **Worker-Upload erforderlich: ja.**
