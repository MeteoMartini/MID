# MID v0.9.17.0 – Cockpit-Prognosekompass und lokale Gefahrenhinweise

## Umgesetzt

### MID Prognose-Kompass im Cockpit

- Die 14-Tage-Übersicht der beiden Prognose-Cockpits (`cockpit-tabs` und `cockpit-ribbons`) enthält nun direkt den MID Prognose-Kompass.
- Dargestellt werden der belastbare Zeitraum, die wahrscheinlichste weitere Entwicklung und der Zeitpunkt zunehmender Unsicherheit.
- Die Berechnung verwendet die bereits vorhandenen Ensemble-, Konsistenz-, Szenario- und Streuungsdaten. Im Erweiterten Modus wird zusätzlich die verwendete Konsistenzschwelle genannt.
- Für Smartphone-Querformat bleibt die dreispaltige Kompassdarstellung erhalten; erst auf wirklich schmalen Portraitbreiten wird einspaltig umgebrochen.

### Standortrelevanz von Gewitterzellen

- KONRAD3D-Zellen werden nicht mehr allein wegen ihrer Existenz im erweiterten Umfeld angezeigt.
- Eine Zelle gilt für den Bezugsort nur als relevant, wenn sie sich tatsächlich annähert, bereits im Nahbereich liegt oder der Bezugsort innerhalb eines belastbaren aktuellen beziehungsweise prognostizierten Orts-/Zugbahnkorridors liegt.
- Abziehende Zellen werden nach Überschreiten von 15 km Entfernung ausgeblendet.
- Nicht annähernde Zellen außerhalb von 60 km werden ausgeblendet.
- Ein altes Zellobjekt darf über ein bloßes Modellsignal nicht wieder eingeblendet werden. Ein neues starkes Radar- und CAPE-Signal am Standort bleibt als unabhängige Vorabinformation zulässig.
- Dieselbe Standortprüfung begrenzt KONRAD3D-Beiträge im Starkregenindikator. Die kurzfristige Nowcast-Anhebung wird nur noch von tatsächlich annähernden und standortrelevanten Zellen ausgelöst.

### Gemeinsamer Einstellungsschalter

- Neuer Schalter unter **Einstellungen → Ansicht**: **Gewitter- und Sturzfluthinweise**.
- Standardwert: aktiviert.
- Der Schalter steuert Gewitterinformation und Starkregen-/Sturzflutindikator gemeinsam.
- Bei Deaktivierung wird der eigenständige Starkregenabruf beendet und der gespeicherte Analysezustand verworfen.
- Standardmodus: kompakte Darstellung ohne technische Detailansicht und Ortsliste, höchstens drei Kernauswirkungen.
- Erweiterter Modus: vollständige Zell-, Zugbahn-, Orts-, Quellen- und Starkregenanalyse.

## Regression

- Neue Regression `scripts/test-cockpit-compass-local-hazards-09170.mjs` prüft Cockpit-Integration, beide Präsentationsmodi, Einstellungs-Persistenz, Standardkompaktheit, 15-km-Abzugsgrenze, 60-km-Entfernungsgrenze sowie echte neue Radar-/CAPE-Signale.
- Der bestehende Gewitter-Wording-Test wurde auf das neue Sollverhalten für eine bereits 30 km entfernte und weiter abziehende Zelle aktualisiert.
- Die bisherigen eigenständigen Forecast-Fusion-Regressionen bleiben ohne zusätzliche Laufzeitabhängigkeit ausführbar.

## Worker

- Keine funktionale Workeränderung. Der Worker wird ausschließlich auf v0.9.17.0 versionssynchronisiert.
