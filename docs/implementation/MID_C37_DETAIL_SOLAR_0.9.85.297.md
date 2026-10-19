# MID-C37 · Detailzeitachse v0.9.85.297

Basis: main=mid-stable=e00b41ead6a0aed3a90eb20e9dde26c43455dfc6 (.296).

## Problem und Änderung
Die Detailpunkte waren nach Index aufgeteilt, während Solar-/Jetztmarker eine nominelle 23h-Achse verwendeten. Das verschob Grenzen bereits an normalen Tagen. Der Herbsttag verlor in den optionalen Quadraten die 25. Stunde. Der Bandmodus verwendete dreistündlich gemittelte Zustände ohne solare Teilung.

Die Kalendergrenzen werden über den bestehenden ortsgebundenen localIsoToEpoch-Adapter aus aufeinanderfolgenden lokalen Mitternachten berechnet. Die Tageslänge ist ihre Epochdifferenz. Datenpunkte, Vorwärtsintervalle, Solarereignisse, Nachtflächen und Jetztmarker teilen diese Achse. Der Kalender bleibt ortslokal bei UTC-Anzeige. Die vorhandene solarTimelineWindow-Astronomie liefert identische Ereignisse für Hintergrund und Band. Der Bandmodus verwendet die originalen stündlichen Vorwärtsslots; 3h-Aggregation bleibt eine Darstellung der übrigen Detailparameter. Gruppen erhalten tatsächliche Enden und werden bei Datenlücken getrennt. Alle echten Stundenquadrate bleiben erhalten. React-Schlüssel verwenden Epochwerte für die doppelte Herbststunde.

Keine Änderung an Modellwerten, Warnungen, Sonne-/Wolkenklassifikation, Farben, Kompressions-/Workerlogik oder Releasegates. Missing bleibt Missing. Die bestehenden quadratischen Symbole bleiben stündliche diskrete Zellen und werden nicht solar geteilt.

## Regressionen
Erweiterte dynamische Solarregression: reale 23/24/25h-Kalendertage, eindeutige Positionen bei doppelten Ortsstunden, exakt geteilte Sonnenuntergänge, keine über Nacht reichende Gelbfläche. Erweiterte dynamische C23-Regression: 2/3/4h-Aggregationsenden und Trennung an fehlenden Stunden. Der historische Helfer-Inventartest erwartet die neue gemeinsame Achse anstelle der entfernten clock-only-Helfer. Keine Assertion-/Budget-/Timeoutabsenkung.

## Prüfstand
Fokussierte Regressionen und Typprüfung wurden während der Implementierung ausgeführt. Vollständiger finaler Build, Regressionen, Dependency-Audit, Browsermatrix sowie Source-/Releasegates sind erst nach tatsächlich erfolgreicher Ausführung als bestanden zu bewerten.

## Grenzen
Kein unabhängiger meteorologischer GRIB-Vergleich; keine physische iOS-/WKWebView-/VoiceOver-Abnahme. #374 bleibt für umfassende Live-/Geräteevidenz offen. #352/#405/#411 bleiben separat.

## Ergänzte lokale Evidenz
- Tatsächliche Forecast-Reactkomponente in isoliertem Chromium 153: 48/48 Fälle, 23h-/25h-Tag × sechs Viewports (320/390/844/768/1024/1440) × Light/Dark × Band/Quadrate. Geprüft: alle echten Stunden, eindeutige Herbstpositionen, identische Slotbreiten je realer Stunde, vollständige letzte Slotkante, gelbes Band endet an berechnetem Sonnenuntergang, UTC-Anzeige im Landscapefall, erster echter Touch-Tap wählt den erwarteten Slot, keine horizontalen Überläufe/Laufzeitfehler. Screenshots bei 390px visuell geprüft; isolierte Fixtures, keine Live-/Geräteabnahme.
- Dependency-Audit: 83 installierte Produktionsversionen, keine Befunde/Providerfehler, Lockfile-SHA256 cf2693ac9c751218d07ef3c5bfecd26d586c638d9fe25c0093b35f5a27f03ba7. Keine Paketversion migriert.
- Fünf zusätzliche historische Sourceprüfungen auf die neue Geometrie/kalenderlokale Timerbedingung umgestellt; ihre übrigen Assertions bleiben erhalten. Die alten Maximal-24-/Indexannahmen werden durch dynamische 23/24/25h- und Vorwärtsintervallprüfungen ersetzt.
- PR-Completion-Watcher: blocked, erforderliches gh nicht verfügbar. GitHub-API-Beobachtung, kein konkurrierender Mergehelfer.
- Finaler lokaler npm-run-verify-Lauf: Build, Typecheck, Worker-Syntax und 1001/1001 Regressionen erfolgreich, Suite149,7s. Log mid-c37-verify-final.log, Exit0. Vorausgehender Lauf identifizierte ausschließlich fünf ersetzte historische Sourcegeometrieannahmen; diese wurden fachlich ersetzt und vollständig erneut geprüft. Keine Produktionsbudgets verändert.
