# MID v0.9.53.4

## Events & Aktivitäten – erzwungener Fresh-Reload
- Alle manuellen Reload-Wege im Event-Center berechnen die Vorhersage jetzt tatsächlich neu: Karten-Reload, Detail-Reload und Glocken-`Neu laden`.
- Bei explizitem Reload wird die bereits gerenderte `canonicalHours`-Momentaufnahme des aktuellen Ortes bewusst nicht wiederverwendet.
- Forecast-Fusion und Event-Ensemble umgehen beim expliziten Reload ihre lokalen Fresh-Caches.
- Der Worker akzeptiert `refresh=1` für `forecast-fusion` und umgeht dabei den 20-Minuten-Upstream-Cache von Open-Meteo/MOSMIX; bei Fehlern bleiben vorhandene Stale-Fallbacks erhalten.
- Der automatische 30-Minuten-Eventlauf nutzt denselben Fresh-Pfad.

## Aktuelles Wetter – Hyperlokale Analyse
- Der Info-Button liegt rechts innerhalb der bestehenden Analysekarte und erzeugt keine zusätzliche Zeile bzw. Kartenhöhe.
- Die kompakte Ergebniszeile bleibt sichtbar; Methodik und Detaildiagnostik bleiben im Popover.

Worker: funktional geändert; Cloudflare-Worker-Upload erforderlich, damit `refresh=1` auch serverseitig den Forecast-Fusion-Upstream-Cache umgeht.
