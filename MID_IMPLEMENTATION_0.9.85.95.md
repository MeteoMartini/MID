# MID 18.2.9 · J.1–J.5 · v0.9.85.95

## Ziel

Fachliche und technische Härtung des veröffentlichten v0.9.85.94-Stands nach erneutem Replit-/Stable-Audit. Der GitHub-Stable-Code bleibt alleinige Source of Truth; der veraltete Replit-Checkout wird nicht als Releasequelle verwendet.

## J.1 · Gewittersemantik

- Die kanonische Detail- und Rapid-Gewitterdiagnose verwendet ausschließlich `signalScore` als diagnostische Signalstärke 0–100.
- Der frühere Legacy-Alias `percent` ist aus den öffentlichen Gewitterdiagnose-Typen entfernt.
- Direkte Modell-Gewittercodes erzeugen weiterhin eine interne diagnostische Signalstärke, werden aber nicht mehr als kalibrierte Eintrittswahrscheinlichkeit dargestellt.
- Current, Kurzfrist, 24-h-Profil, Berg- und Wassersport sowie ThunderInfo verwenden dieselbe Signal-Semantik.
- Echte amtliche oder direkt gelieferte probabilistische Produktfelder bleiben davon getrennt.

## J.2 · Zeitliche Kohärenz RUC-Konvektion

- ML-CAPE/CIN bleiben nativ 15-minütig.
- MU-CAPE/CIN werden ausschließlich aus ihrem nativen stündlichen Produktpfad geladen.
- Jeder MU-Wert trägt seine eigene Gültigkeitszeit. Für die 15-min-Diagnose wird er nur verwendet, wenn er höchstens 35 Minuten vom Zielzeitpunkt entfernt ist.
- Die 15-min-Finalisierung behandelt nur VIS und CEILING als native Viertelstunden-Zustandsfelder. Temperatur, Taupunkt, Feuchte, Druck, Wind und Bewölkung werden nicht als erfundene 15-min-Zustände ausgegeben.
- Der RUC-Status dokumentiert diese feldspezifische Kadenz explizit.

## J.3 · Skybar

- Gesamtbewölkung und Sonnenscheindauer sind getrennte physikalische Größen.
- Bekannte direkte Sonnenscheindauer ist die einzige Quelle für ein als Sonnenscheindauer bezeichnetes gelbes Grundband.
- Fehlt sie bei geringer Bewölkung, darf ein gelber Fallback nur ausdrücklich als „Wolkenlücken / unbedeckter Himmelsanteil“ bezeichnet werden.
- `1 - Gesamtbewölkung` wird nicht mehr als Sonnenscheindauer etikettiert.

## J.4 · Ensemble-Provenienz

- Google WeatherNext 2 ist als nativ 6-stündig und stündlich interpoliert gekennzeichnet.
- Das Modell bleibt für Tages-/Szenario-Ensembles nutzbar.
- Es wird aus stündlichen Warn- und Ereigniswahrscheinlichkeiten ausgeschlossen.
- Die Tagesgewichtung berücksichtigt gröbere native Zeitauflösung über einen konservativen Temporal-Faktor.

## J.5 · Performance und Wartbarkeit

- Harte Einzelbudgets schützen MapLibre-Core, MapLibre-Worker, React-/Charts-Vendor, Radar-, Ensemble-, Longrange- und MapLibre-CSS-Chunks.
- Der Report weist unkomprimierte, gzip- und Brotli-Größen aus.
- `weather-src`, `styles-src` und `worker-src` sind durch Regressionen als kanonische Aggregatquellen geschützt.
- Der ungenutzte Parallelstand `src/weather.tsfrag` ist entfernt.
- Aktuelle Upstream-Kandidaten MapLibre 6.11.1, Capacitor 8.5.2 und Vite 8.3.0 sind als nächste isolierte Migrationsschritte qualifiziert. React 19.3 bleibt ein eigener Kompatibilitätsmeilenstein.
- Kein Paket wird ohne reproduzierbar neu erzeugtes Lockfile partiell aktualisiert.

## Release-Gate

Veröffentlichung ausschließlich über Source-PR-Gate → Auto-Merge → Release-ZIP → Installer/Pages → optionalen Worker-Gate → Stable-Promotion.
