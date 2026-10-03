# MID v0.9.85.154 · Extremwetter-Ausblick Tag 3–7 – Resilienzkorrektur

## Befund

Der in der App sichtbare Fehler wurde gegen den produktiven Worker reproduziert. Der Router-Fix aus v0.9.85.153 greift; der nachfolgende Langfristabruf scheitert jedoch mit HTTP 502, weil der zentrale Open-Meteo-Datenweg sein kostenloses Tageskontingent erreicht hat (`Daily API request limit exceeded`). Beide geprüften DWD-ICON-EPS-Mean-Modellvarianten waren separat erreichbar. Die Modellkennung war daher nicht die Fehlerursache.

## Umsetzung

1. **Worker zuerst:** Der reguläre, zentral kontrollierte MID-Datenweg bleibt bevorzugt.
2. **Browser-Direktpfad:** Scheitert der Worker, führt der Client die bereits kanonisch im Worker definierte `dachExtendedExtremeOutlookData`-Berechnung direkt aus. Der Generator `scripts/build-maintenance-aggregates.mjs` erzeugt den dafür nötigen Export reproduzierbar zusammen mit der bytegleichen Fachlogik aus `worker-src/25-dach-extreme-outlook.js`.
3. **Persistenter Stale-Fallback:** Vollständige Tag-3–7-Daten werden getrennt gespeichert; 3 Stunden gelten als frisch, bis 24 Stunden dürfen bei einer Störung als ausdrücklich veralteter Stand weiter angezeigt werden.
4. **Tageslimit merken:** Erkennt MID das zentrale Open-Meteo-Tageslimit, werden weitere aussichtslose Worker-Versuche bis zum nächsten UTC-Tag vermieden.
5. **Abruflast senken:** Langfrist-Fachcache und der Cloudflare-Upstreamcache für die regionalen ICON-EPS-Mean/Spread-Felder halten nun 6 Stunden statt 30 bzw. 10 Minuten. Das passt zur deutlich langsameren Langfriständerung und reduziert die zentrale Abruflast erheblich.

## Fachliche Grenzen

Unverändert bleiben die DWD-orientierten Gefahrenklassen, Schwellenwerte, vollständigen 24-h-Summen für Regen/Schnee, die Böenbewertung sowie der Verzicht auf Gewitter- und Eisregenflächen im Langfristraster. Fehlende Daten werden weiterhin nicht als Entwarnung interpretiert. Der Tag-3–7-Bereich bleibt ein MID-Vorhinweis/Gefahrenausblick und keine amtliche Warnung.

## Regression

`scripts/test-extreme-outlook-extended-resilience-0985154.mjs` schützt:
- identische Worker-/Aggregat-/Direktlogik,
- 6-h-Upstream- und Fachcache,
- Worker → Browser-Direkt → Stale-Cache → Fail-closed-Reihenfolge,
- 169-stündige ICON-EPS-Mean/Spread-Direktberechnung mit allen fünf Tag-3–7-Zeitfenstern.

Die vollständige Freigabe erfolgt ausschließlich über Source-PR-Gate, reproduzierbare Installation, Dependency-/Security-Audit, Produktionsbuild, komplette Regressionen, iOS-Hüllenprüfung, semantischen Worker-Deploy, Pages-Prüfung und Stable-Promotion.
