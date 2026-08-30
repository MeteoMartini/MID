# MID v0.9.76.9 – Reisewetter Schneehöhe und Alternativabstand

- Fester Zeitraum lädt die vorhandene historische ERA5-Schneehöhenreihe jetzt grundsätzlich mit; kumulierter Schneefall bleibt Zusatzinformation und ersetzt fehlende Schneehöhe nicht.
- Die Schneelage-Kachel weist im festen Zeitraum die modellierte mittlere Schneehöhe, erwartete Schneedeckentage und die Schneefallsumme getrennt aus. Bei fehlender Schneehöhenquelle bleibt die Schneehöhe explizit nicht verfügbar.
- Flexible Reisezeiträume erhalten einen editierbaren Mindestabstand für Alternativen. Standard ist die vollständige Reisedauer (7 Tage -> 7 Tage); der manuelle Wert kann nicht unter 50 % der gewählten Reisedauer fallen.
- Alternativfenster werden aus ausreichend vielen bewerteten Kandidaten ausgewählt und müssen den eingestellten Mindestabstand der Starttermine einhalten.
- Gemeinsamer React/Vite-Fachkern für Browser/PWA/iOS bleibt erhalten; keine Worker-Fachänderung und kein manueller Worker-Upload erforderlich.
