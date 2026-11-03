# MID-Design-WE 1.2 · 7d/14d-Konzepttreue und QA-Handoff

## Herkunft und Schutzgrenze

Diese UI-Weiterentwicklung basiert auf dem exakt verifizierten ursprünglichen `main=mid-stable`-Release `b2b9bb3c3eab78fac117bd0b0d2110b1ce127b66` (v0.9.85.414) und dem von dort vorwärts abgeleiteten, noch nicht veröffentlichen `.415`-Designkandidaten PR #633 @ `b613987a7090766388bed49d938957cfded55383`. Kein Freigabeanspruch, solange .415 nicht separat erfolgreich nach Stable promoviert ist. Nur Draft; kein direkter Schreibzugriff auf main/mid-stable.

## Nutzerverbindlicher visueller Sollzustand

- **7d:** durchgehende Original-Skybar und bislang vorhandene Wettergrafik oberhalb der A/B/C-Inhalte; A tatsächlich eigene hochwertige, kompakte Tageskarten mit Wetterpiktogramm, Temperaturminimum/-maximum, Niederschlagsmenge, PoP, Wind/Böen, Sonne/UVI, keine langen implizit geöffneten Details; ein Tap öffnet den vollständigen, quellidentischen Tages-/Ensemble-/Stundenverlauf, wiederholter Tap schließt. B fünf konsistente und getrennte Diagramme (Temperatur, Tagesmenge, PoP, Wind/Böen, Sonne) mit denselben Tagesachsen. C Wettertage als mobile responsive Tabelle; Rücksprung zu vollständigen Tagesinformationen.
- **14d:** A eigene, echte grafische 14-Tages-Entwicklung mit drei Wetterphasen, Wochen 1/2 als horizontal und per Tastatur zugängliche Tageskarten und dem bestehenden echten Ensemble-Temperaturdiagramm; keine pseudostatistischen Spannen. B vier getrennte Temperatur-/Tagesniederschlag-/PoP-/Winddiagramme ohne vorangestellte dreiphasige Doppelansicht. C Tagesmatrix mit unabhängig zugänglicher Unsicherheitsdarstellung. Vollständiger Prognosekompass und bestehende 14 Tagesdetailkarten bleiben erhalten.
- **Fachschutz:** keine Änderung an amtlichen DWD-Warnungen, Prognosefusion, Modellläufen, Quellen, UTC-/lokaler Tagessemantik oder RUC/D2-/Fast-Produktionspfaden. Missing≠0, tatsächliche Null bleibt Null; Wahrscheinlichkeit≠Tagesmenge; Quantile nur aus überprüfbar vorhandenen Ensemblefeldern; Temperatur-/Wind-Einheiten bleiben geteilt.
- **Designschutz:** bestehende Parameterfarben/Icons und Theme-Tokens, 44px+ Bedienziele, klare aktiven Zustände/ARIA, Fokus, reduzierte Bewegung, kein abgeschnittener Text oder horizontaler Dokumentüberlauf.

## Geänderte Integrationspunkte

`SevenDayDesignModes.tsx`: neue reale kompakte Tagesansicht A statt bloßem Hilfetext; B/C mit gezielter Hierarchie. `ForecastCockpit.tsx`: genau ein sichtbarer A/B/C-Schalter vor der Original-Skybar, A-Tagesdetails nur bei expliziter Auswahl; C öffnet sicher, A toggelt, 14d-Tagesbuttons öffnen Originalkarten. `FourteenDayDevelopment.tsx`: eigenständiger Zwewochen-Modus mit Wetterpiktogrammen, Niederschlag/PoP/Wind und tatsächlichen Ensemble-Spannen, echtes Chart B, unverändertes C. CSS im vorhandenen responsiven Theme-System.

## Pflichtabnahme vor Promotion

1. Neues `.416` nur auf frisch erfolgreich promoviertem `.415`-Stable erneut SHA-exakt portieren, alle Versionsspiegel und Changelogs synchronisieren; Konflikt-/Parallel-PR-Status zuerst prüfen.
2. Prüfen: TSX/Vite-Build, bestehende Unit-/SSR-/Baseline-Regressionen und Core/Heavy-/Browser-/Worker-/Pages-/Release-Sicherheitsgates auf dem **finalen** kombinierten HEAD; keine Tests schwächen. 320×568, 375×667, 390×844, 430×932, 768×1024, 1024×768, 1440×900 und 1920×1080, Light/Dark, Classic/Next.
3. Echtes Browser-Soll/Ist gegen freigegebene ursprüngliche Konzeptbilder prüfen: A sichtbare Tageskarten, B vollständige Diagramme, C lesbare Tabelle, Bedien-/Fokus-/Safe-Area-/Scrollverhalten, lange Orts-/Wettertexte, Dynamic Type, fehlende Werte, Zeit-/Modellmetadaten. Ohne Originalbilder **keine** behauptete pixelgenaue Treue.
4. Nach erfolgreichem Source-Gate regulärer SHA-gebundener MID-Bot-Merge, serverseitiges Release-ZIP, `install-mid.yml` Core/Heavy/Worker/Pages/Finalize, SHA-identische Stable-Promotion und Live-Browsertest. Keine alternative Promotion, keine iOS-/VoiceOver-Hardwareabnahme allein aus CI.
