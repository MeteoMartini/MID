# MID v0.9.84.0 – Implementierungsbericht

## Ausgangsbasis

Arbeitsbasis ist das vom Nutzer bereitgestellte Professional-Release **v0.9.83.5**. Dieser Stand hatte laut enthaltenem Freigabebericht TypeScript-, Vite-Produktionsbuild und 721 Regressionstests bestanden. v0.9.84.0 erweitert ausschließlich die RUC/RUC-EPS-Kurzfristverarbeitung, deren Transparenz sowie die dazugehörigen Verträge.

## Hyperlokale Kurzfristfusion

Die voraggregierte RUC-EPS-Stundenreihe liefert neben Niederschlagswahrscheinlichkeit nun auch signifikante Wahrscheinlichkeit (>5 mm), Q75, Mittel und Memberzahl. Beim deterministischen RUC-Niederschlag bleibt Best Match + MOSMIX die lokale Mengenreferenz. Zusätzlich wird ein zu nasser Einzel-RUC gegen das RUC-EPS-Q75 geprüft. Liegt er deutlich über beiden Referenzen, sinkt sein Mengenanteil kontinuierlich. Q75 ist keine harte Kappung und darf einen gestützten RUC nicht künstlich abschneiden.

## Extremwetter-Ausblick

Der RUC-Vorprozessor erzeugt `rapid-extreme.json` jetzt als **Schema v4**. Pro Rasterpunkt und Zeitraum 0–6 h, 6–12 h und 12–14 h werden aus den bereits verfügbaren RUC-EPS-Niederschlagsmembern nur kompakte Statistiken gespeichert: Memberzahl, >0,2-mm- und >5-mm-Wahrscheinlichkeit, Q75 und I1–I4-Überschreitungswahrscheinlichkeiten. Das native Member-Cube bleibt aus dem Pages-Free-Profil ausgeschlossen.

- **Regen:** RUC-EPS kalibriert die kurzfristige ICON-D2-EPS-Wahrscheinlichkeit begrenzt in beide Richtungen. Ein vorhandenes ensemblegestütztes Gefahrensignal kann dabei nicht durch einen einzelnen Kurzfristlauf unter seine Aktivierungsschwelle gedrückt werden. Deterministische RUC-Werte stützen eine Intensitätsstufe weiterhin nur bei tatsächlicher Schwellenüberschreitung.
- **Gewitter:** RUC-EPS dient als Niederschlags-/Auslöseunterstützung für die vorhandene RUC-CAPE/CIN-/Konvektionsdiagnostik. Ohne Ensemblegrundsignal entsteht keine neue Gewittergefahr allein aus RUC.
- **Schnee:** RUC-Temperatur, Schneefallgrenze, Nullgradgrenze und native Schneefallphase werden mit RUC-EPS-Niederschlagswahrscheinlichkeit gekoppelt. Kälte-/Phasenkonsistenz kann ein bestehendes Signal stärken, warme Widersprüche dürfen es vorsichtig abschwächen.
- **Eis:** Temperatur, Nullgradgrenze, Regenphase und Feuchte werden mit RUC-EPS-Niederschlag gekoppelt. Ohne bestehendes EPS-Eissignal wird keine neue Eisgefahr erzeugt.
- **Wind:** bleibt deterministisch schwellengebunden. Eine RUC-EPS-Windwahrscheinlichkeit wird ausdrücklich nicht erfunden, solange keine echten Wind-/Böenmember im Preprocessor vorliegen.

## Transparenz

Der Modellcockpittext nennt die Q75-Ausreißerplausibilisierung. Die Detailansicht des Extremwetter-Ausblicks zeigt – soweit tatsächlich vorhanden – RUC-EPS-Memberzahl, Niederschlagswahrscheinlichkeiten, Q75 sowie Schnee-/Eis-Phasenstützung. Der Datenbasis-Hinweis unterscheidet den Open-Meteo-ICON-D2/EPS-Pfad vom direkten DWD-RUC/RUC-EPS-Preprocessing.

## Weitere Einsatzszenarien

Die appweite Prüfung ist in `MID_RUC_USAGE_AUDIT_0.9.84.0.md` dokumentiert. Widget, Eventplaner, Wassersport, Wetterzwilling, Prognoseänderungs-Push und Lüftungsassistent erben die kanonische RUC/RUC-EPS-Fusion bereits und erhalten deshalb keine zweite Gewichtung. Als nächste sinnvolle eigenständige Ausbaustufen wurden ein leichter RUC-Rapid-Niederschlagsbeginn-Push, Flugmet-Corridor-Sampling, höhenangepasstes Berg-RUC-Sampling und ein Mehrlauf-Trend priorisiert.

## Rückwärtskompatibilität

Der Consumer akzeptiert weiterhin rapid-extreme v1–v4. Solange auf GitHub Pages noch ein v3-Snapshot liegt, bleibt die bisherige deterministische RUC-Unterstützung aktiv. Die zusätzlichen RUC-EPS-Funktionen aktivieren sich automatisch mit dem nächsten vollständig erzeugten v4-RUC-Snapshot.
