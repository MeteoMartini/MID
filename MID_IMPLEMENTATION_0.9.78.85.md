# MID v0.9.78.85 — CI-Regressionsfix nach Release #917

- Der vollständige TypeScript-/Vite-Build von v0.9.78.84 ist auf GitHub erfolgreich; die verbleibende Release-Sperre lag in acht Regressionstests.
- Der langlebige Komposit-Persistenzvertrag wird wieder eingehalten: `mid:composite-settings:v3` bleibt der stabile Schlüssel. Die neuen Linienfarbfelder werden rückwärtskompatibel innerhalb dieses Vertrags gespeichert.
- Die Event-Wärmeempfehlung verwendet wieder die seriöse Trinkwasser-/Erholungspausen-Semantik; die zentrale `eventRecommendationPolicy` bleibt die einzige fachliche Quelle für diese Empfehlung.
- Die Event-Regressionsprüfung verwendet für Transpilation `typescript-strada` statt der unter TypeScript 7 entfernten Root-Strada-API.
- Veraltete Komposit-Regressionen wurden auf die bewusst eingeführten Verträge aktualisiert: manuelle MID-Konturen bei Farbwahl, konfigurierbare Isobaren-/Isohypsenpaletten und keine automatische Pause des Sat/Rad-Films beim Scrollen.
- Der DWD-WMS-Fallbacktext ist auf die aktuelle Formulierung `MID-Konturen werden verwendet` abgestimmt.
- Keine fachliche Workeränderung; nur Versionssynchronisierung.
