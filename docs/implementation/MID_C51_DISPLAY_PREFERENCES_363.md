# MID-C51 · Anzeigepräferenzen .363

Basis .362 / 7ced6f011d14e42b6bc9e79ccbb7cd237abbc9f8. Keine fremden Drafts übernommen.

## Umsetzung
18 zuvor flüchtige Entscheidungen in acht Komponenten: Ensemble Niederschlagswahrscheinlichkeit/Band/Kumulierung, ENS-Mittel/Klima/Quartile; NativeModelMap Extremwerte/Skalarlinien/Skala; UnifiedWeatherMap Beobachtungslayer/Extremwerte/Summenkonturen; PrecipitationTotalsMap Konturen/Skala; Subseasonal Anomalie, Pollen showAll, Extremwetterhorizont, Klima-Wind/Böen. Bestehende persistierte Einstellungen bleiben erhalten. Schlüssel `mid:display-preference:v1:` sind dauerhaft, keine Cachekeys. Typ- und Auswahllistenprüfung; synchroner Commit vor Render; schnelle funktionale Umschaltungen nutzen letzten Commit. Eigener Backup-Event unabhängig von Storage-Monkeypatching. Der bisherige Quellstringtest für initiale Kumulierung wird auf den absichtlich neuen persistierten Vertrag mit unverändertem false-Default umgestellt; dynamische Gegenfälle im neuen Test.

Keine Speicherung von Ladezuständen, Fehlern, Tooltippositionen oder laufenden Animationen. Gesamtaussage „alle Bereiche vollständig abgenommen“ bleibt offen: umfassende Browsermatrix und Inventur weiterer Auswahlfelder/Legacy-Schreibpfade sind noch erforderlich. Neue Tests prüfen kontrollierte React-/Storage-Grenzen, keine physische iOS-Abnahme.

## RUC-Prüfung, keine Gewichtänderung
Ausführbarer Test ruft den tatsächlichen Worker auf: Leads +1..+26 wirken auf Temperatur/Niederschlag, +28 und Verkürzung über das echte Laufende werden verworfen. Die bestehende kubische Absenkung `rucRapidBaseWeight` erreicht bei +27 exakt Null. Das ist ein dokumentierter offener Punkt zum Auftrag vollständiger zeitlicher Nutzung, kein durch Datenpublikation bewiesener +27-Fusionsbeitrag. Keine neue Gewichtung ohne Hindcast-/Verifikationsnachweis. Native 5-/15-Minuten-Produkte dürfen nicht künstlich verlängert werden.

## P0/P1 GeoSphere · Prüfung 29.10.2026
Originalkataloge: https://data.hub.geosphere.at/dataset/ensemble-v2-1h-1km und https://data.hub.geosphere.at/dataset/inca-v2-1h-1km . C-LAEF: 1km, 60h, 3h Zyklen, 17 Member inklusive Kontrolllauf; API nur Ensemble-Statistiken. P10/P50/P90 niemals als unabhängige Member behandeln oder daraus native Überschreitungswahrscheinlichkeiten erfinden. Kontrolllauf gehört zur selben Modellfamilie. CC BY 4.0, Attribution/Provenienz verpflichtend. Alte Endpoints sollen laut Katalog am 04.11.2026 eingestellt werden. INCA-v2: 1km/1h, UTC, österreichische Analyse in EPSG:31287, historische API; kombiniert Beobachtungen und Modellhintergrund, daher weder reine unabhängige Stationsreferenz noch Zukunftsprognose. Attribution CC BY 4.0. Vor Integration echte Parameter-/Einheiten-/Akkumulations-/Lauf-/CRS-/Missing- und Rate-Limit-Prüfung plus Vergleichsverifikation. Kein Live-Provider in diesem UI-Kandidaten aktiviert.

## Freigabe
Produktionsbuild und gezielte Tests lokal erfolgreich; vollständige Core-/Browser-/Source-/Installer-Ergebnisse im PR nachführen. Nur regulärer SHA-Bot/ZIP/Installer/Worker/Pages/Stable-Pfad. Keine generische PR-Completion-Landingmutation.
