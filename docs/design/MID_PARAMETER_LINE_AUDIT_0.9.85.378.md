# MID-Design-/Linienaudit v0.9.85.378: überprüfbarer Umsetzungsschritt

Quellbasis: verifiziertes `main=mid-stable` v0.9.85.377 @ `44f5d02b0374b275e423e43233addff91d4eeb82`. Quelle des fachlichen Design-/NoData-Diffs: unveröffentlichter, unberührter Draft #524 @ `3eabc7c53ccf2dfe71f359ae22598692c19555b9`. Acht betroffene bestehende Quell-/CSS-/Vertragsdateien wurden vor selektiver Integration mit der ursprünglichen .373-Basis UND dem aktuellen .377-Stable SHA-verglichen: achtmal byteidentische Ausgangsdateien, daher keine zwischenzeitliche fachliche Konfliktübernahme. Bereits veröffentlichte .375–.377-Version-, CI-/Build-, RUC- und Releaseänderungen bleiben unverändert. Der Draft #524 wird nicht selbst promoted; paralleler Reuse-Draft #530 bleibt unverändert.

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

## Release-Nachweis und Abnahmegrenzen für die neue Integration

Vor Abschluss der regulären Quell-PR- und Installerkette ist diese Dokumentation nur eine Source-Kandidatenbeschreibung. Die Fachregressionen sind in beiden Baseline-Pflichtinventaren ergänzt, ohne alte Prüfungen zu streichen. Browser-/Chromium-Heavy-Checks sind nur als solche zu kennzeichnen; physische iPhone/iPad-, VoiceOver- oder echte Geräteabnahmen wurden nicht durchgeführt. Der Master-Audit #523 bleibt für die Seiten A1–A5, Farb- und Legendensystem, Exporte, Widgets und meteorologische Parametermatrix weiterhin offen; die neue .378-Tranche schließt nur die beschriebenen 24h-/7d-/14d-Quellfehler. Keine amtliche Warn- oder Modelllaufsemantik geändert.
