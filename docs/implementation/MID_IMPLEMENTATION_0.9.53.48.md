# MID v0.9.53.48

## Ortssuche
- Ortssuche wird als interaktive Open-Meteo-Anfrage mit foreground-Priorität ausgeführt, damit laufende Forecast-/Ensemble-Abrufe die Eingabe nicht ausbremsen.
- Photon ergänzt POI-/Teiltreffer bereits ab zwei Zeichen; Open-Meteo bleibt Primärquelle und unterstützt Ortsnamen sowie Postleitzahlen.
- 10-Minuten-Speichercache für wiederholte Suchbegriffe reduziert unnötige Neuabrufe.
- Die Kopf-Suche besitzt nun einen expliziten Ladezustand, schützt gegen verspätete Antworten älterer Anfragen und bleibt bei Fehlern geöffnet statt scheinbar ergebnislos zu verschwinden.

## Netatmo-Verbindung
- Die Netatmo-Schaltfläche wird bei unvollständiger Worker-Konfiguration nicht mehr stumm deaktiviert.
- Jeder Verbindungsversuch prüft die Worker-Bereitschaft erneut. Bei fehlenden Bindings/Secrets erscheint unmittelbar eine konkrete Statusmeldung statt eines wirkungslosen Klicks.
- Der Setup-Zustand wird visuell von der normalen OAuth-Verbindung unterschieden. Nach einmaliger Betreiber-Konfiguration bleibt die Nutzerführung unverändert: Netatmo-Login und Freigabe, keine Token-Eingabe.

## Regression
- Neue Regression `test-search-netatmo-reliability-095348.mjs` schützt Suchpriorität, Ladefeedback, Zwei-Zeichen-POI-Suche und Netatmo-Setupfeedback.
- Bestehender Touch-/Such-Responsiveness-Test wurde auf den neuen Debounce-Vertrag aktualisiert.
