# MID v0.9.14.0 – Klimabezogene Tagesfarben und redundanzfreier Stundenwechsel

## 1. Tageswerte relativ zum Klimamittel
- Tmin und Tmax erhalten in den täglichen Karten eine dezente, kontinuierliche Farbabstufung relativ zum jeweiligen Tagesklimamittel.
- Höhere positive Tmax-Abweichungen werden zunehmend dunkler rot dargestellt.
- Stärker negative Tmin-Abweichungen werden zunehmend dunkler blau dargestellt.
- Die Abstufung gilt in der klassischen 7-Tage-Ansicht, im 7-Tage-Cockpit und in den 14-Tage-Tageswerten.
- Tooltip/Titel nennt die Abweichung in Kelvin, sofern Klimadaten verfügbar sind.

## 2. Direkter Wechsel Tagesansicht ↔ Stundenansicht
- Im 7-Tage-Cockpit öffnet ein Antippen der Tageskarte direkt den stündlichen Tagesverlauf.
- Der Detailbereich erscheint als Akkordeon unter den Tageskarten und lässt sich mit „Tagesansicht“ wieder schließen.
- Im Cockpit wird ausschließlich die einstündige klassische Tagesdetailgrafik verwendet; der 3-h-Schalter wird dort nicht erneut angeboten.
- Tageswechsel innerhalb des Diagramms bleiben möglich.

## 3. Redundanzbereinigung
- Kurzfrist- und 7-Tage-Cockpit öffnen nicht mehr zusätzlich die vollständigen klassischen Module mit denselben Inhalten.
- Die klassische 7-Tage-Kartenleiste wird im Stundenakkordeon nicht erneut gerendert.
- Tages-Kurzfakten werden im Cockpit-Stundenakkordeon nicht doppelt ausgegeben.
- Nur die fachlich eigenständige Ensemble-Analyse bleibt im 14-Tage-Cockpit separat aufklappbar.
- Die Einstellungen beschreiben die Unterschiede zwischen Register- und Ribbon-Cockpit nun eindeutig.

## Geänderte Dateien
- `src/App.tsx`
- `src/ForecastCockpit.tsx`
- `src/styles.css`
- `src/temperatureTone.ts`
- `scripts/test-forecast-cockpit-0920.mjs`
- `scripts/test-cockpit-hourly-climate-redundancy-09140.mjs`
- Versions- und Baseline-Dateien
