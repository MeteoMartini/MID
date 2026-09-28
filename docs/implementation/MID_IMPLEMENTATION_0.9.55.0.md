# MID v0.9.55.0 – Modellfamilien-Vollständigkeit, Komposit-Referenzkarte und Audit-Konsolidierung

## Ausgangsbasis

MID v0.9.54.2. Funktionsrelease, weil die app-weite Modellstatus-/Modellfamilienlogik und die Kompositdarstellung funktional erweitert werden.

## 1. Modellfamilien app-weit

- Die 14-Tage-Modellstände trennen künftig echte probabilistische Ensembleläufe von deterministischen Kontroll-/Best-Match-Läufen.
- JMA MSM/GSM/Seamless werden dort als deterministische JMA-Familie sichtbar, wenn sie am jeweiligen Ort beteiligt sind; sie werden nicht fälschlich als Ensemblemitglieder gewichtet.
- Die vorhandene Full-Member-Ensemblepalette bleibt vollständig und umfasst DWD ICON EPS, NOAA GEFS/AIGEFS, ECMWF IFS/AIFS, UKMO MOGREPS, CMC GEPS, BOM ACCESS-GE, MeteoSwiss ICON-CH und WeatherNext 2 sowie die bestehenden direkten Regionaladapter KNMI HARMONIE-AROME EPS und ECCC REPS.
- Mean/Spread-Reserven wurden um DWD ICON D2/EU/Global sowie GEFS 0.25°/0.5° ergänzt. HGEFS bleibt korrekt eine Mean/Spread-Quelle.
- Die Berg-/Wintersport-Schneefallgrenzenanalyse nutzt im MeteoSwiss-Abdeckungsgebiet zusätzlich ICON-CH1/CH2-Ensemble-Mittel.
- Modellfamilien werden weiterhin nach Abhängigkeit gruppiert, damit verwandte Modellvarianten nicht als vollständig unabhängige Stimmen mehrfach gewichtet werden.

## 2. Kompositbild

- Oberhalb aller meteorologischen Raster-/Wetterfelder liegt eine separate Referenz-/Labelkarte für Grenzen und Ortsnamen.
- Die Deckkraft dieser oberen Kartenebene ist mit dem Regler „Karte oben“ von 0 bis 100 Prozent einstellbar und wird zusammen mit den übrigen Kompositeinstellungen gespeichert.
- Die darunterliegende Basiskarte bleibt erhalten; es wird keine zweite opake Vollkarte über die Wetterdaten gelegt.
- Die Bewegungsdarstellung verwendet genau eine Zugspur.
- Die Pfeilspitze liegt am gewählten Standort.
- Zeitmarken +15/+30/+45/+60/+90/+120 Minuten werden entlang der Spur entgegen der Zugrichtung stromaufwärts angeordnet.
- Die Spur liegt oberhalb der Referenzbeschriftungen, damit die meteorologische Information trotz sichtbarer Grenzen und Orte eindeutig bleibt.

## 3. Audit-/Release-Hardening

Die bereits übernommenen Auditmaßnahmen bleiben geschützt:

- Open-Meteo-Verträge für AIFS Europe, Météo-France, JMA, EU-AQI, Min/Max-Aggregation, Mond und DWD ICON.
- auditierte React-/Charts-Vendor-Aufteilung bei unverändert lazy geladenem MapLibre.
- vollständiger npm-Auditbericht als Artefakt und hartes High-Severity-Gate.
- Qualitätsstatus auf dem tatsächlich veröffentlichten mid-stable-SHA.
- versionsflexibler, reproduzierbarer Recharts-3-Wartungsvertrag.

Ein Recharts-3.10.1-Upgrade wird nicht erzwungen, solange der im Audit ausdrücklich verlangte vollständig grüne Kandidatenlauf nicht vorliegt.

## Regression

Neue Verträge:

- `scripts/test-model-family-completeness-09550.mjs`
- `scripts/test-composite-top-reference-motion-track-09550.mjs`

Zusätzlich wurden historische Modellstand-, Komposit-, Motion- und Performanceverträge an die neue fachliche Trennung angepasst, ohne ihre Schutzwirkung aufzugeben.

## Prüfstand

- 474 automatisch erkannte Regressionstests.
- 472 im Replacement-Artefakt ausführbare Tests bestanden.
- Zwei repositorygebundene Tests benötigen `.github/workflows` und können im bewusst workflowfreien Replacement-ZIP nicht ausgeführt werden.
- Geänderte TypeScript-/TSX-Dateien parsergeprüft.
- Worker syntaktisch geprüft und mit dem Worker-Quellpfad synchron.
- Ein vollständiger npm-/Vite-Produktionsbuild ist im Replacement-Artefakt ohne `node_modules` lokal nicht reproduzierbar und bleibt Aufgabe des bestehenden GitHub-Release-Gates.
