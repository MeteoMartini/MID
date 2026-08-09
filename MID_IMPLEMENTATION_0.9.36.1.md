# MID v0.9.36.1

## Sektionen-Navigation
- Mobile Schnellnavigation: Heute, Kurzfrist, 7 Tage, Mehr.
- Mobile: seitlicher, per Escape/Backdrop schließbarer Sektionen-Drawer.
- Desktop/Tablet ab 851 px: schmale, einklappbare Seitenleiste mit persistentem Ausklappzustand.
- Fachliche Gruppen: Überblick, Analyse & Trend, Profile, Profi, Werkzeuge.
- Sichtbarkeit basiert ausschließlich auf `dashboardModuleSettings`; Berg/Wasser und Advanced-Module folgen weiterhin ihren bestehenden Bedingungen.
- Abschnittsanker `#mid-section-<id>`, History/Back-Unterstützung und automatische Öffnung eingeklappter Module.
- In Prognose-Cockpit-Modi schaltet die Navigation zusätzlich auf Kurzfrist, 7 Tage bzw. 14 Tage.

## 24-h-Wetterprofil
- Weiterhin exakt 24 einstündige Werte ab aktueller Stunde.
- Datenbereich beginnt 22 SVG-Einheiten rechts der Y-Achse; erster Punkt, Zeitmarker und Piktogramm liegen nicht mehr auf der Achse.
- Plot-Hintergründe und Y-Skalen bleiben unverändert vollständig nutzbar.

## Prüfung
- 352/352 automatisch erkannte Regressionstests bestanden (vollständig in vier Laufblöcken).
- `src/App.tsx` und `src/ForecastCockpit.tsx` zusätzlich mit TypeScript `transpileModule` parsergeprüft.
- Vollständiger lokaler Produktionsbuild nicht möglich, da im bereitgestellten Arbeitsverzeichnis keine `node_modules` installiert sind.
