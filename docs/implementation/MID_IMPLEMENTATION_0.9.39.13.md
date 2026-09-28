# MID v0.9.39.13

## Kompositbild – Radar/ICON-D2-Niederschlagsart

- Open-Meteo-Requestbudget des ICON-D2-Phasenrasters von 1715 auf maximal 247 Standortpunkte reduziert.
- Lokales 13×19-Phasenraster, bewusst ohne künstliche räumliche Verfeinerung; OPERA CIRRUS bleibt 1-km-Echomaske.
- Nur 9 benötigte Modellvariablen; `showers` wird nicht separat geladen.
- Drei Batches à maximal 120 Punkte werden sequenziell statt parallel geladen.
- Standortzentrum auf 0,05° quantisiert, 15-Minuten-Zeitnormalisierung und längeres Worker-/Upstream-Caching.
- Bei Open-Meteo-Minutenlimit kein zweiter Modellalias-Request; bis 45 min altes belastbares Feld darf gekennzeichnet weiterlaufen.
- Browserseitiger Last-Good-Fallback und automatischer Neuversuch nach rund 60 s.
- Rate-Limit-Fehler wird klar benannt und nicht als Browser/DNS/CORS-Fehler verkauft.
- Neuer Regressionstest schützt Requestbudget, Sequenzierung, Cache, Stale-Fallback und Retry.
