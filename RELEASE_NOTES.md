# MID v0.9.85.183

- Warnungen, ICON-D2-RUC sowie Radar- und Satellitendaten laufen im produktiven Web jetzt über denselben MID-Host statt über vom Browser direkt angesprochene Wetterdaten-Domains.
- Die moderne Kartenbasis wird in restriktiven Netzen ebenfalls über MID bereitgestellt; externe Direktpfade bleiben nur außerhalb des produktiven Webs als Plattform-/Entwicklungsfallback erhalten.
- Unter „Daten & Qualität“ zeigt eine neue Verbindungsdiagnose getrennt, ob Datendienst, Warnungen, RUC und Kartenquellen erreichbar sind.
- Die Veröffentlichung stoppt automatisch, wenn die geschützte Same-Origin-Route nicht eindeutig auf den geprüften MID-Worker zeigt oder der Health-Check dort fehlschlägt.
