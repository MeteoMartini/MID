# MID v0.9.85.233 · MID-C27

Basis main=mid-stable dd9e501f1ae58bab43f2f1e66c3827f388999434. Live latest.json: RUC 2026-10-10T20:00, generiert 21:30 UTC; Synoptik 21:41 UTC. Payload 899713679 von 900000000 Bytes. Live Index ed407400d71d58b4 enthält bei D2/EU/ICON nur CW +12h. Damit ist der Anwenderbefund bestätigt; die bisherige Pruning-Reihenfolge entfernt CW zuerst und niedrige Stunden zuerst.

Neue Reihenfolge: optionale Synoptikdichte vor CW, neun Pflichttermine bleiben erhalten. Falls der Kern mit CW weiterhin nicht passt, zuerst ferne CW-Termine, dann die spätesten kurzfristigen Termine modellübergreifend. cloudWeatherBudget protokolliert verfügbare Bytes und Kürzungen; Endbudget inklusive Metadaten bleibt fail-closed. Keine Grenzwerterhöhung, Werte-/Missing-/Kategorieinterpolation oder Änderung der Kernfelder.

Live-Größenreplay ergänzt die gemessenen +12h-Dateigrößen für +1..12h; alle drei ICON-Reihen passen mit neuer Priorisierung. Das ist eine Größenabschätzung, kein Beleg vollständiger neuer Live-Daten. Die nächste produktive Aufbereitung muss die echten Felder publizieren.

GDPS Retry: revision ist Teil der Kartenquellenidentität. Neue Quelle verwirft frühere Ready-/Fehlerzustände und fordert beide Raster erneut an. Browserfixture erzwingt 502 für Niederschlagsart, klickt Retry und verlangt einen neuen Request plus vollständige Kombination. Live-Metadaten per MID-Same-Origin zeigen 127 Wolken- und 64 Wettertermine, gemeinsamer INIT12 UTC. Direkte Worker-/GetMap-Abfragen hier403: kein positiver Live-Kachel-/Gerätenachweis daraus.

Speicheroptionen: erst Priorisierung optionaler Karten (hier umgesetzt). Verlustfreie Kompression von point-time-field-Chunks ist sinnvoll, benötigt neue Manifest-/Decoder-/Range-Verträge und Messungen; kein blindes Umstellen. specialistHourly 162612000, severe15 135510000, convection15/phase15 je 81306000 und precip5 79137840 Bytes sind Haupt-Rapid-Blöcke. Zeit-/Raumreduktion oder Feldentfernung wäre fachlicher Funktionsverlust und ist hier nicht umgesetzt. R2-History-Retention betrifft andere Speicherprofile und löst das Pages-Einzelsnapshotlimit nicht. Native EPS-Member sind bereits ausgelassen; summary bleibt vorhanden.

Offen: numerische Cross-Model-/Reprojektions-/Kachelnähte, komplette optionale Datenverträge, langlebige SLO-Historie und echte Alarmzustellung, Geräteperformance sowie echte iOS/WKWebView/VoiceOver. Keine Abnahme daraus behauptet.

Prüfstand: Produktionsbuild/Types, Dependency-Advisory-Pfad ohne HIGH/CRITICAL, 15 Synoptik-Pythonfälle und Pages-Publish-Regressionsfixture bestanden. Replit-Leseprüfung endete mit MCP-Timeout, keine Änderung daraus. Desktop-Chromium-Start wird durch lokale Unix-Socket-Einschränkung blockiert; Headless-Shell wird separat versucht. Exakte Source-/Installer-Browsergates bleiben Pflicht.

Live-UI in Cloud-Chrome: App .232 lädt, Ortsauswahl Bonn funktioniert; Kartenöffnung löst GPUInitializationError aus (WebGL2 fehlt), globale Fehlergrenze zeigt Startfehler. Damit kein Live-Karten-/iOS-Nachweis. Headless-Shell erlaubt lokale WebGL-Fixtures. Der gezielt provozierte GDPS502 erzeugt erwartete Ressourcenlogs; ausschließlich diese markierte Testquelle wird von der Browser-Fehlerliste getrennt, alle übrigen Runtimefehler bleiben harte Fehler.

Finale lokale App-Prüfung: 958/958 Regressionen erfolgreich; cap copy ios erfolgreich (keine Xcode-/Geräteabnahme). Verlustfreie Kompressions-Stichproben der Live-Binärchunks hier ebenfalls403; deshalb keine unbelegte Einsparquote angegeben.

Ergänzende Zuverlässigkeitsprüfung: Widget-Lauf 38088893271 scheitert bei malatya-kurve-7d-dark nach drei Wetterabruf-Timeouts; Veröffentlichung bleibt abgebrochen. Das ist ein offener Befund, keine nachgewiesene Langzeit-SLO-/Alarmabnahme. Lokale Kartenmatrix hat 20/24 Fälle bis 1024px bestanden; 1440px läuft noch.
