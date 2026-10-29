# MID-C53 · Widget-Fehlerdiagnose v0.9.85.360 – #380

## Ausgangslage
Der 5-Tage-Dark-Widgetexport für Kürécik fiel am 16.10. dreimal mit dem UI-Fehler `Wetterabruf hat das Zeitlimit überschritten` aus. Mehrere spätere 12/12-Exports einschließlich des 29.10. auf .359 waren erfolgreich, erklären aber nicht den früheren Ausfall. Der bisherige Browser startete die Zielseite bereits vor dem Aktivieren der CDP-Network-Domain. Der Erstfehlerbericht konnte daher frühe API-Anfragen weder als erfolgreiche HTTP-Antwort noch als Netzwerkfehler beobachten.

## Umsetzung
1. `capture-widget.mjs` startet Chrome im eigenen privaten, anschließend vollständig entfernten `mkdtemp`-Profil auf `about:blank`, verbindet CDP auf Loopback, aktiviert `Network.enable` und startet danach `Page.navigate` zur canonicalisierten Widget-URL.
2. `network-diagnostics.mjs` beobachtet `Network.requestWillBeSent`, `responseReceived`, `loadingFinished`, `loadingFailed` und Redirects. Einträge sind auf 400 gleichzeitig beobachtete Requests begrenzt, Überlauf und unbekannte Ereignisse werden ausdrücklich signalisiert. Nur fünf feste Herkunftsklassen, HTTP-Statusklassen, vorgegebene Fehlerklassen, Dauer und Anzahl bleiben im Bericht; kein URL-Text, Hostname, Pfad, Request-ID, Header, Body, Cookie, Token, Ort oder Koordinate.
3. Bestehende `writeFirstDiagnostic`-Semantik mit exklusiven Dateien (Mode 0600), geschütztem Bild und Erhalt des ersten Fehlschlags bleibt erhalten. Fehler verursachen weiterhin keinen unvollständigen Widget-Publish.
4. Der neue dynamische Test deckt synthetische CDP-Ereignisfolgen, 429/504, DNS, Zeitlimit, Abbruch, Redirect 302→200, nicht-HTTP, Truncation, Laufzeiten und geheime URL-Werte ab. Browser- und Widget-Release-Matrix bleibt unverändert verbindlich.

## Grenzen und Rollout
Keine aktuell reproduzierte externe Provider-Störung und kein tatsächlicher Browser-iOS-/VoiceOver-Test. Diese Änderung verbessert die **Kausaldiagnose beim nächsten Fehlschlag**, sie behauptet nicht, das ursprüngliche Remote-Timeout durch eine meteorologische Änderung beseitigt zu haben. #380 bleibt offen bis belastbare Ursachen- und Wiederholungsnachweise vorliegen. Keine Änderung von Wetterwerten, NoData, amtlichen Warnungen, RUC-Quellen, Leadtimes oder Push.
