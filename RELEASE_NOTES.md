# MID v0.9.85.355 · Bergwetter-Einheitenwahl und Installer-Zuverlässigkeit

Die Bedienung der Wind-Einheitenwahl im Bergwetter wird in der vollständigen Browserprüfung zuverlässiger nachvollzogen: Der Zielknopf muss sichtbar und tatsächlich anklickbar sein. Eine verdeckte Schaltfläche bleibt ein Testfehler; sie wird nicht durch einen künstlichen DOM-Klick übersprungen.

Der Test prüft zusätzlich den ausgewählten Zustand, die Speicherung der Einstellung und ihre Wiederherstellung nach erneutem Öffnen. Die bestehenden Prüfungen der aktuellen, täglichen und intervallbezogenen Windwerte, der Temperaturen und Niederschläge sowie der saisonalen, mobilen und Desktop-Darstellung bleiben erhalten. Wetterdaten, amtliche Warnungen und Extreme werden nicht verändert.

Dieser Kandidat übernimmt die Source-Gate-geprüften Verbesserungen der bislang nicht veröffentlichten .354 und repariert den darin aufgetretenen Installer-Testpfad. Erst ein erfolgreiches vollständiges Source-Gate und der unveränderte MID-Releaseweg einschließlich Installer, Worker/Pages und Stable-Promotion bestätigen die Veröffentlichung. Physische iOS-/VoiceOver-Abnahmen und meteorologische Originaldaten-Güteprüfungen bleiben gesondert offen.
