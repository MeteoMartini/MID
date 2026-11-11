# MID v0.9.85.455

- Die Stunden- und 3-Stunden-Ansichten berücksichtigen fehlende Daten, unvollständige Sonnenscheindauer und lokale Kalender-/Sommerzeitwechsel genauer. Fehlende Werte werden nicht als Null oder als sichere Entwarnung dargestellt.
- Die Skybar behandelt ungültige Zeitangaben ausdrücklich als Datenlücke; die Darstellung folgt weiterhin den verifizierten Niederschlags- und Bewölkungswerten.
- Im Meteogramm bleibt die gewählte Modellansicht bei Ortswechseln und vorübergehend nicht verfügbaren Modellen erhalten. Verspätete Antworten anderer Orte dürfen die aktuelle Anzeige nicht überschreiben.
- Im DWD-Pollenflug werden fehlende oder ungültige Belastungswerte erkennbar als unvollständige Angaben dargestellt, statt unbegründet „keine Belastung“ zu melden.
- Das Pollenmodul lädt seine Styles erst bei Bedarf; die optionale Darstellung bleibt im Offline-Paket enthalten. Die bestehenden JS-/CSS-Grenzen werden nicht angehoben.
- Die freiwillige Web-/PWA-Diagnostik erhält verständlichere Hinweise bei Speicherproblemen. Ohne wirksame Einwilligung findet keine PostHog-Übertragung statt.
- Die Veröffentlichung nutzt weiterhin den bewährten GitHub-Source-Gate-, SHA-gebundenen Release-Bot- und Installer-Pfad ohne neue Schutzregeln oder zusätzliche Einmal-Workflows. Eine noch nicht ausreichend geprüfte Review-Gate-Erweiterung ist ausdrücklich nicht Bestandteil dieses Releases.
- Die eigenständigen DWD-ICON-D2-Saisonkarten „Winter & Berge“ und „Sommer“ stellen den 1-h-Gesamtniederschlag mit 2-m-Temperatur-Isothermen beziehungsweise 10-m-Böen desselben Modelllaufs und Gültigkeitstermins zusammen.
- NoData in einem der beiden Originalfelder bleibt in der gemeinsamen Karte und beim SVG-/PNG-Export transparent; wirkliche Nullwerte werden erhalten, Böenintervalle nur mit nachgewiesener Quelleninformation bezeichnet. Keine eigenständigen Schnee-/Glätte-, Gewitter- oder amtlichen Warnprodukte.
