# MID v0.9.85.455

- Die Stunden- und 3-Stunden-Ansichten berücksichtigen fehlende Daten, unvollständige Sonnenscheindauer und lokale Kalender-/Sommerzeitwechsel genauer. Fehlende Werte werden nicht als Null oder als sichere Entwarnung dargestellt.
- Die Skybar behandelt ungültige Zeitangaben ausdrücklich als Datenlücke; die Darstellung folgt weiterhin den verifizierten Niederschlags- und Bewölkungswerten.
- Im Meteogramm bleibt die gewählte Modellansicht bei Ortswechseln und vorübergehend nicht verfügbaren Modellen erhalten. Verspätete Antworten anderer Orte dürfen die aktuelle Anzeige nicht überschreiben.
- Im DWD-Pollenflug werden fehlende oder ungültige Belastungswerte erkennbar als unvollständige Angaben dargestellt, statt unbegründet „keine Belastung“ zu melden.
- Das Pollenmodul lädt seine Styles erst bei Bedarf; die optionale Darstellung bleibt im Offline-Paket enthalten. Die bestehenden JS-/CSS-Grenzen werden nicht angehoben.
- Die freiwillige Web-/PWA-Diagnostik erhält verständlichere Hinweise bei Speicherproblemen. Ohne wirksame Einwilligung findet keine PostHog-Übertragung statt.
- Die GitHub-Releaseprüfung erhält eine zusätzliche SHA-gebundene, fehlerschließende Prüfung eingereichter Reviews und Reviewthreads vor dem geschützten Merge. Alle offiziellen Warnungen, Modellwerte und der vorhandene Releaseweg bleiben erhalten.
