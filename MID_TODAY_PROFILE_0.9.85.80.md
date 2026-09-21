# MID v0.9.85.80 · MID 18.2.4 · Arbeitspaket D · Heute / 24-h-Tagesprofil

Das 24-h-Wetterprofil verwendet jetzt eine gemeinsame Zeitgeometrie für Temperatur, Skybar beziehungsweise Stundenquadrate, Niederschlag, Wind/Böen, Luftdruck, Wolken und Hazards. Senkrechte Hilfslinien bleiben stündlich; sichtbare Zeitangaben werden in einem ruhigen Drei-Stunden-Raster geführt.

Skybar und 24-Stundenquadrate bleiben zwei wählbare Darstellungen derselben stündlichen Wetterlogik. Im Quadratmodus werden die Zellen nun auf dieselben realen Zeitpositionen wie die übrigen Profilspuren gelegt. Die etablierte Priorität aus Niederschlag, Gesamtbewölkung und Sonne sowie die vier Intensitätsstufen bleiben unverändert.

Die Auswahl einer Stunde wirkt auf alle Spuren. In den Einzeldaten wird der Niederschlag zusätzlich als auf die Intervalllänge bezogene Rate in mm/h angegeben. Fehlende Wolkenschichtwerte erscheinen nicht als 0 %, sondern ausdrücklich als nicht verfügbar.

Auf schmalen Smartphones bleibt die gesamte Profilgeometrie intern horizontal scrollbar, ohne die Seite selbst zu verbreitern. Tablet und Desktop nutzen weiterhin die volle verfügbare Breite. Bottom-Bar und Safe-Area erhalten einen eigenen Abstand, ohne doppelte Leerflächen.

Wetterfachlogik, Datenquellen, RUC/Nowcast, Warnungen, Favoriten, Radar/Satellit/Komposit, Ensemble, Klima und Prognoseberechnung bleiben unverändert. Replit hat das Paket umgesetzt und visuell geprüft; Veröffentlichung, Deployment und Stable-Promotion erfolgen ausschließlich durch ChatGPT.
