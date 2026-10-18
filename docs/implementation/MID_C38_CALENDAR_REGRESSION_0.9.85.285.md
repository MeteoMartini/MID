# MID 18.2.38 · Kalendertag-Regressionen v0.9.85.285

Basis: freigegebene .284, `16b6c87906370b62315e0046dec64506304abcc4`.
Bestehender Source-PR #403, geprüfter ursprünglicher Kopf `13696f9ba01a1a1fad95506e320b5e78b4c6ebc5`.

## CI-Befund und eng begrenzte Reparatur

Source-Run 39071821205: elf Core-Fehler; fünf Heavy-Gruppen und Vitest erfolgreich.
Mehrere historische Ein-Datei-Fixtures transpilierten forecastFusion ohne dessen neue
Kalendertag-Abhängigkeit. Der gemeinsame Fixturehelfer bündelt jetzt die echte
fullCalendarForecastDay-Abhängigkeitskette im eigenen Scope. Keine Coverage-Attrappe.

Weitere historische Erwartungen verlangten mindestens 18 Stunden oder dass eine
einzelne trockene Nowcaststunde den gesamten Tageswert ersetzt. Das widerspricht
dem ausdrücklich beauftragten Volltag-Vertrag aus #395/#401. Diese Erwartungen
prüfen jetzt den echten vollständigen Kalendertag; vollständige Testreihen enthalten
das folgende Mitternachts-Sample und zueinander passende Ortszeit/Epoche/Zeitzone.
Teilreihen erhalten die kanonische Tagesquelle. Unverändert bleiben die Invarianten
gegen künstliche Stundenverteilung, für reale Niederschlagsintervalle, Ensemble-PoP,
Temperaturbrücken, physikalische Sonnenscheindauer und kohärente Wetterbündel.
Die neue .285-Verhaltensregression schützt separat 23/24/25 Stunden, Lücken,
Null/NaN, echte Null sowie Morgenregen bei Anzeige um 17:45 Uhr.

Zusätzliche unabhängige Negativprobe: Der Coverage-Helper akzeptierte leere Strings,
Booleans und fehlende sichtbare Mengen. Dies konnte beim Summieren erneut Missing
in Null verwandeln. Er akzeptiert jetzt ausschließlich echte endliche nichtnegative
Zahlen für Rohakkumulation und sichtbare Menge und lehnt doppelte Rohendpunkte ab.
Die .285-Verhaltensregression prüft diese Fälle auf 23/24/25-h-Tagen zusätzlich.
Keine Worker-, Versions-, Dependency-, Gate- oder Budgetänderung. Insbesondere keine Rückkehr zur Resttagesmenge im Ganztagsfeld.

## Validierung und verbleibende Grenzen

Alle elf betroffenen Regressionen sowie die .285-Verhaltensregression gezielt
bestanden; TypeScript/Produktionsbuild erfolgreich. Produktionsaudit: 83
Paketversionen geprüft, keine Findings oder Providerfehler. Lokaler Lauf unter
Node 24.19.0; die vollständige verbindliche Node-22-Source-/Installer-Abnahme
muss am neuen exakten PR-Kopf erneut erfolgreich sein.

Erster lokaler Core-Lauf vor der zusätzlichen Coverage-Härtung: 986/986, 0 Fehler,
155,4 s. Abschließender Core-Lauf mit der Härtung: 986/986, 0 Fehler, 162,2 s;
abschließender TypeScript-/Produktionsbuild ebenfalls erfolgreich.
Neue Remote-Gates bleiben verpflichtend.
Diese Dokumentation ist keine Stable-/Produktionsfreigabe. Ausschließlich bestehender
MID-Bot → serverseitiges ZIP → Installer → Worker/Pages → Stable-Promotion.
Keine physische iOS/WKWebView/VoiceOver-Abnahme. #397 und #400 bleiben getrennt offen.
