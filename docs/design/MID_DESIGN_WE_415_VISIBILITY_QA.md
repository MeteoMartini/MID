# MID .415 · Produktions-Design-Diagnose und Abnahme 7d/14d

## Nachweisbare .414-Livefehler
Test: produktive https://www.midwx.app/, öffentliche Teststadt Berlin, Playwright im Firecrawl Live-Browser, Version im DOM und /version.json = 0.9.85.414; GitHub main=mid-stable `b2b9bb3c3eab78fac117bd0b0d2110b1ce127b66`. Auf 390×844: 7d-Selector y≈803 (praktisch von unterer Navigation verdeckt), `SevenDayCurveOverview` ca. 421px; 7d-Karte 264px, davon ForecastRangeGuide 98px; erste offene 7d-Stundendetailfläche 911px. 14d-Selector y≈613, B-Diagramme y≈849 nach Prognose-Kompass. Diese Messung beweist eine schlechte visuelle Erreichbarkeit der neu veröffentlichten Optionen, nicht ihr Fehlen im Bundle.

## Korrekturen und Abnahmekriterien
- 7d-A/B/C-Toggle vor Original-Skybar-Chart innerhalb derselben Wettersektion; Inhalte von A/B/C weiterhin strikt darunter. Nur ein zugänglicher, persistenter Toggle; 44px und Fokus.
- 7d A zeigt sieben echte kompakte Tageszeilen inkl. Wetter, Temperatur, Tag-/Nacht-Skybar, Regen/PoP/Zeitraum, Wind/Böen, Sonne/UVI. Keine automatisch geöffnete Stundenansicht. Antippen öffnet alle Originalensemble-Spannen und vollständigen Stundenverlauf, erneuter Tipp klappt zu. C→Tag öffnet A-Detail. Keine Wetterdaten verlieren oder verstecken, wenn Daten vollständig nicht vorhanden.
- 14d A/B/C direkt nach Bereichskopf; der volle Prognose-Kompass folgt danach. A kompakte Phasen/Temperaturspannen, B synchronisierte getrennte Parameterdiagramme, C 14 Tagesdetails. Originale 14 Tageskarten, Warnungen, Modellstand, P10/P90 und P25/P75 zugänglich.
- Light/Dark, 320×568, 375×667, 390×844, 430×932, 768×1024, 1024×768, 1440×900, 1920×1080. Prüfen: Safe Area, Tastatur/Fokus, Touch 44px, Scroll, Layer/Tooltips, lange Ortsnamen, Orientierung, Dynamic Type, reduzierte Animation, CSS-Überläufe und Kontrast.
- Wettersemantik: NoData niemals als 0, echte 0 nicht Missing, PoP vs Menge, lokale/UTC-Tage mit 23/25h, Wind-Einheiten, Ensemblequellen und Warnprovenienz.

## Freigabe
Erst neue Quell-/Vitest-Regressions- und vollständige Source-PR-Core/Heavy-/Browserprüfungen auf exaktem HEAD; danach GitHub Releasebot / serverseitig generiertes ZIP / install-mid.yml / Stable-SHA. Erneute real browserbasierte Sichtbarkeits- und Klickprüfung des veröffentlichen v0.9.85.415 ausdrücklich notwendig, da Quell-/SSR-Tests allein die .414-UX-Verfehlung nicht entdeckt haben.
