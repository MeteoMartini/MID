# MID-Design-/Linienaudit v0.9.85.374: überprüfbarer Umsetzungsschritt

Source of Truth: veröffentlichte .373 @ `05798c4134431a5fb0455ef5f71441b4a7051e38`, unveränderter alter Draft-Head `836c9d6d29bea0f4b901a50dd911123524b8d758`. Dieser Arbeitsstand #524 führt die Änderungen der .372-Basis als Zwei-Eltern-Integrationscommit mit .373 zusammen. RUC-Arbeiten aus .373 bleiben erhalten.

## Betroffene echte Verbraucher
- Aktuell/Heute: 24-Stunden-Profil inklusive UTCI, Taupunkt, Temperatur, Luftdruck, Niederschlagswahrscheinlichkeit, Wind/Böen und Legenden.
- Vorhersage: aufgeklappte 7d-Tagesdetails und gemeinsame Strichmuster/Legendensymbole; 7d-Temperaturkurvenrolle bleibt erhalten.

## Konkrete Korrektur
- `src/parameterLineStyle.ts`: Böen 9/4 statt 5/4, damit UTCI 5/4 und Böen farbunabhängig unterscheidbar sind.
- `src/App.tsx`: Sieben konkurrierende lokale SVG-Präsentationsattribute aus Tagesdetail entfernt; zentrale Rollen bestimmen die wirklichen Kurven.
- `src/styles-src/30-modern.css`: Linienmuster in Legenden exakt an 24h- und Tagesdetailpfade angepasst, Tooltipmarker in Taupunkt-/Regen-/Wind-/Böen-/Druckfarben vereinheitlicht.
- `src/ForecastCockpit.tsx`: Das SVG-Präsentationsattribut `stroke=` konnte den zentralen React-Inline-Style-`stroke` nicht überschreiben. Der dynamische Farbverlauf überschreibt `stroke` nun im selben Style-Objekt; die Temperaturlegende verwendet dieselben wertabhängigen Farbstopps statt einer willkürlichen statischen Dreifarbpalette.
- Normativer Fachzusatz in `MID_PARAMETER_COLOR_CONTRACT.md`; Regression `scripts/test-appwide-line-semantics-0985374.mjs` und gezielte Anpassung einer historischen Gust-Muster-Erwartung.

## Abnahme und offene Folgearbeit
Ein Git-Diff/Code- und Strukturtest ist keine echte Browser-/iOS-/VoiceOver-Abnahme. Erst Source-Gates, tatsächliche Desktop-/Tablet-/Mobil-Renderprüfungen, Worker-/Pages-Installer und Stable-Promotion dürfen als reale Erfolge dokumentiert werden. Diese Tranche ist noch kein vollständiger auditierter Zustand der Karten, 14d-Ensembles, Fachmodule, Widgets oder Exporte. Master-Audit #523; Persistenz #508; CSS-Budget #344; Kartendaten #446. Der Releasepfad darf nicht verkürzt werden.


## Ergänzung: Basisfarben und Nichttextkontrast
Die Kontrastmessung gegen vier Light-/Dark-Flächen ergab vorher die Mindestwerte 2,58:1 (Schneephase Light), 2,62:1 (Sonnenschein Light) und 2,94:1 (Luftdruck Dark). Mit den gezielt angepassten Tokens werden für diese drei Basisfarben auf allen geprüften Flächen mindestens 3:1 erreicht; der neue Pflichtregressionstest ermittelt die WCAG-Ratio aus Theme-Variablen und weist Änderungen unter 3:1 zurück. Mischfarben und tatsächliche Diagrammrenderings bleiben gesondert abzunehmen.

## A2 · 14d-Ensemble-Datenlücken und kumulierte Niederschläge

In `EnsemblePanel.tsx` wurde vorher im Kumulativmodus `Number(value)||0` verwendet, wodurch null/undefined/NaN bei P10/P90, P25/P75, ENS-Mittel und den selbst integrierten Best-Match-Summen zu 0 mm wurde. Die dedizierte pure Ableitung `ensembleCumulativeDisplay.ts` prüft echte finite, nichtnegative Eingaben. Eine fehlende Tagessumme macht die danach lokal aggregierte Best-Match-Kumulative undefiniert (NaN); unabhängig verfügbare und vollständig geprüfte ENS-Kumulativwerte bleiben darstellbar. Spannen- und Quartilflächen werden nur bei vollständig verfügbarer fachlicher Quelle gezeichnet. Auf einen Tageswert hin explizit fehlende Best-Match-/Wind-/Klimaabschnitte dürfen Recharts `connectNulls` nicht durchgehend glätten. Sichtbare 0 bleibt nur bei echten 0 mm erhalten. Die Skala ignoriert nichtfinite Werte. Regression: `scripts/test-ensemble-cumulative-gaps-0985374.mjs` führt den TS-Helfer via esbuild aus und prüft echte Null, Missing, Folgesumme, unabhängige kumulierte Providerwerte, Quantile bis Tag 7 und SVG-Verbindungsregeln. Realgerät-/WCAG-Abnahmen bleiben offen.
