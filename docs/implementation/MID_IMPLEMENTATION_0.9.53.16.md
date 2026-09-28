# MID 0.9.53.16

Grundsätzliche Absicherung der Kernvorhersage gegen gleichzeitigen Provider-/Rate-Limit-Ausfall.

- Alle Core-Forecasts (sichtbarer Ort, Events und Favoriten-/Wetterzwilling-Hintergrundpfade) laufen worker-first; der Browser greift erst nach einem Workerfehler direkt auf Open-Meteo zurück.
- Der Worker nutzt Open-Meteo Best Match weiterhin als Primärquelle, besitzt aber bei 429/5xx/Timeout ohne verwertbaren Cache eine unabhängige zweite Kernquelle: MET Norway Locationforecast 2.0 `complete`.
- MET Norway wird nur serverseitig mit eindeutigem MID-User-Agent, auf vier Nachkommastellen gerundeten Koordinaten, Höhenparameter und Cloudflare-Cache abgerufen. Für Standorte außerhalb des nordischen Bereichs basiert dieser Ersatzpfad laut MET Norway auf ECMWF-HRES.
- Der unabhängige Ersatzpfad wird mit `_mid_core_proxy` transparent gekennzeichnet; Hauptansicht und Quellenbezeichnungen nennen die tatsächlich verwendete Kernquelle statt weiterhin pauschal „Best Match“.
- Liefert die globale MET-Norway-Datenbasis für einen Standort keine Niederschlagswahrscheinlichkeit, erfindet MID ausdrücklich keine `0 %`: PoP wird als nicht verfügbar (`–`) gekennzeichnet, während vorhandene deterministische Niederschlagsmengen und Wetterzustände weiterhin genutzt werden.
- Die Ersatzquelle wird in der Quellenübersicht als „MET Norway Locationforecast“ ausgewiesen; der Primärpfad bleibt Open-Meteo Best Match.
- Meldet der Worker einen Open-Meteo-429, übernimmt der zentrale Browser-Guard den Cooldown. Hintergrundmodule dürfen den gerade limitierten Provider dadurch nicht weiter parallel belasten.
- Event-Fresh-Refresh gibt `forceFresh`, Zeitzone und Höhe an denselben Core-Pfad weiter; Event- und Ortsforecast bleiben damit konsistent.
- Die lokale v2-/Edge-Cache-Resilienz aus 0.9.53.15 bleibt bestehen. Der unabhängige Provider ist ausdrücklich der No-Cache-/Cold-Start-Fallback und ersetzt Open-Meteo nicht im Normalbetrieb.
- Neue Required-Regression `scripts/test-core-forecast-independent-fallback-095316.mjs` simuliert zur Laufzeit: Open-Meteo HTTP 429 + leerer Edge-Cache + erfolgreicher MET-Norway-Fallback.
- Buildfix: Die ältere MapLibre-/PoP-Regression akzeptiert nun den seit 0.9.53.16 fachlich erforderlichen dritten PoP-Zustand `provider-no-probability`. Dadurch bleibt die DWD-/Hourly-Fallback-Prüfung geschützt, ohne fehlende PoP des unabhängigen Providers fälschlich als Regression oder als `0 %` zu behandeln.
