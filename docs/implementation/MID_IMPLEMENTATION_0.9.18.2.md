# MID v0.9.18.2

## Anlass
Korrektur des Kurzfrist-/24-h-Meteogramms im Forecast-Cockpit gemäß Nutzerfeedback:

1. Störender Text im/um den Graphen war weiterhin sichtbar.
2. Das Meteogramm sollte vollständig ohne horizontales Scrollen sichtbar sein.
3. Der 1 h-/3 h-Schalter sollte entfallen; Darstellung dauerhaft einstündig.

## Umsetzung
- Kurzfrist-Meteogramm auf feste einstündige Darstellung umgestellt.
- Umschalter für 1 h / 3 h aus dem Kurzfristbereich entfernt.
- Renderpfad des Meteogramms auf eine skalierende Vollbreiten-Canvas umgestellt, sodass der Graph ohne horizontales Scrollen vollständig in der Karte angezeigt wird.
- Zusätzliche Tages-/Datums-Textlayer oberhalb des Plots entfernt, um störende Textüberlagerungen zu vermeiden.
- Kompaktere vertikale Verdichtung des Meteogrammkopfs und der 24-h-Leiste.
- Zwischenfeld mit separater Detailbox unter dem Meteogramm weiterhin entfernt.

## Betroffene Dateien
- `src/ForecastCockpit.tsx`
- `src/styles.css`
- Versionssynchronisation (`package.json`, `src/version.ts`, `public/version.json`, `MID_BASELINE.json`, Worker-/SW-Versionen)

## Regression / Prüfung
- Der frühere TS6133-Buildfehler bleibt beseitigt.
- Logische Regression geprüft: Kurzfristbereich bleibt interaktiv, 90-Minuten-Bereich unverändert, 24-h-Leiste weiterhin anklickbar.
- Lokaler Vollbuild in CAAS weiterhin durch unvollständige vorliegende TypeScript-Typdefinitionen im entpackten Arbeitsverzeichnis eingeschränkt; der eigentliche umgesetzte Anwendungsfehler in `ForecastCockpit.tsx` ist jedoch bereinigt.
