# MID v0.9.85.283 · Schnellere Ortswechsel und stabile Bergwetter-Höhenprognose

- Beim Wechsel zu einem bereits geladenen Favoriten zeigt MID einen überprüften gespeicherten Best-Match-Stand sofort an, sofern Standort, Höhenangabe und Zeitzone exakt passen und der Stand höchstens 45 Minuten alt ist. Alter und laufende Aktualisierung werden sichtbar ausgewiesen. Andere Ortsdaten werden nicht übertragen.
- Die Berg-/Wintersportansicht zeigt die vollständige Best-Match-Höhenprognose, ohne auf zusätzliche regionale Modelle zu warten. Diese ergänzen die vorhandene Prognose nach erfolgreicher Prüfung im Hintergrund.
- Bricht die gemeinsame Höhen-Netzanfrage unerwartet ab, versucht MID einmal einen kontrollierten Abruf derselben vollständigen Felder für die einzelnen Höhenstufen. Unvollständige oder zeitlich widersprüchliche Antworten werden verworfen, nicht als Nullwerte ergänzt.
- Fehlgeschlagene Höhenprognosen erhalten eine verständliche deutsche Meldung und eine Schaltfläche zum erneuten Laden. Ausgeblendete oder gewechselte Orte übernehmen keine verspäteten Antworten.
- Bestehende Wetterfarben, amtliche Warnungen, Prognosewerte, Quellenkennzeichnungen, RUC und Release-Schutzmechanismen bleiben erhalten. Nicht verfügbare Werte werden nicht als gemessene Nullen dargestellt. Der iOS-Code wird gebaut/synchronisiert; eine physische iOS-/VoiceOver-Abnahme ist damit nicht verbunden.
