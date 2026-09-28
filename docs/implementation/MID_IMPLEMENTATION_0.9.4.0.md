# MID v0.9.4.0 – Bodenanalyse, Ensemble-Deck und Cockpit-Konsistenz

## Verbindliche Fortsetzung

Der Nutzer hat `0.9.3.0` als bereits aktiven, durch das regelmäßige Qualitätsaudit entstandenen Projektstand vorgegeben. Der über den GitHub-Connector sichtbare Branch `mid-stable` wies beim Pflichtabgleich noch `0.9.2.0` in `package.json` und `MID_BASELINE.json` aus. Die vorliegende Funktionsversion setzt daher auf dem vollständigen sichtbaren Cockpit-/Synoptikstand auf und führt den vom Nutzer vorgegebenen Audit-Vertrag ohne Rücknahme geschützter Funktionen als `0.9.4.0` fort.

## Professionelle MID-Bodenanalyse

Die interaktive Synoptik wurde von einer allgemeinen Kartenüberlagerung zu einer fokussierten Analysekarte weiterentwickelt:

- beschriftungsarme Grundkarte mit separater Ortsebene
- Hochkontrast-Isobaren mit weißer Freistellung
- Hoch- und Tiefdruckzentren mit Kerndruck
- geographisches Gradnetz
- dominanter kohärenter Frontcluster mit klassischer Frontsymbolik
- alternative Modellfronten nur dünn und gestrichelt
- frontal eingefärbte Übergangszone statt isolierter Modelllinie
- standardisierte Stationsmodelle mit Temperatur, Taupunkt, dreistelligem Druckcode, Wetterzeichen und Windfahnen
- enger, ereignisbezogener Kartenausschnitt statt großräumiger, kaum lesbarer Übersicht
- sichtbarer Analysezeitstempel und multiparametrische Feldstützung

Die Karte bleibt eine objektive MID-Modellanalyse und wird weiterhin klar von der unveränderten amtlichen DWD-Bodenanalyse getrennt.

## Windrichtung

Zwei unterschiedliche meteorologische Darstellungen sind nun eindeutig getrennt:

- Phasenpfeile und Stationswindfahnen zeigen einheitlich die meteorologische Herkunftsrichtung („Wind aus“). Es erfolgt keine zusätzliche 180-Grad-Drehung.
- Stationswindfahnen zeigen konventionsgemäß vom Stationskreis in die Richtung, aus der der Wind kommt.

Tooltips nennen ausdrücklich „Wind aus …“. Die Stationsfahne besitzt bei Nordwind ihre Grundachse nach Norden und wird erst anschließend um die Herkunftsrichtung rotiert.

## Gemeinsames Ensemble-Parameterdeck

Die drei Schalter oberhalb der Ensembleansicht sind nun Bestandteil sowohl des Prognose-Cockpits als auch der klassischen Standard-Ensembleansicht:

1. Temperatur
2. Niederschlag
3. Wind/Böen

Der Wind-Schalter enthält Wind und Böenspitzen und führt weiterhin zur vorhandenen Wind-/Böen-Umschaltung. Die Miniatur zeigt beide Reihen getrennt.

Im Cockpit werden nicht länger vereinfachte Parallelgrafiken verwendet. Es werden dieselben professionellen Diagramme wie in der vollständigen Analyse eingebettet. Dadurch bleiben Achsen, Tooltips, Exportlogik, Unsicherheitsbereiche und Modellinhalte konsistent.

## Zunehmende Unsicherheit

- Temperatur-, Niederschlags- und Winddarstellung verlieren mit größerem Vorhersagehorizont und sinkender Ensemblekonsistenz kontinuierlich an Deckkraft.
- Die vorhandenen Unsicherheitsbänder bleiben vollständig erhalten.
- Tageshöchstwerte werden an den Datenpunkten rot, Tiefstwerte blau und lesbar beschriftet.
- Die späten Vorhersagetage werden nicht abgeschnitten, sondern sichtbar unsicherer dargestellt.

## Touch- und Scrollschutz

Horizontales Scrollen innerhalb der 7-Tage-Tagesmatrix darf keinen Wechsel zu Kurzfrist oder 14 Tagen auslösen. Der Cockpit-Wischwechsel wird daher unterdrückt, sobald die Berührung in einer horizontal scrollbaren Unterfläche beginnt oder der aktive Horizont die 7-Tage-Ansicht ist. Zusätzlich muss eine eindeutige horizontale Wischdominanz vorliegen.

## Niederschlagskonsistenz

Cockpit und Ensemble verwenden für Wetterwechsel und Niederschlagsfarbe die zentrale `precipitationParts`-Plausibilisierung. Sprühregen wird nicht mehr allein aus einem rohen WMO-Code visualisiert, wenn Menge, Wahrscheinlichkeit und gekoppelte Niederschlagsfelder das Ereignis nicht stützen.

## Responsive Vertrag

- Parameterdeck horizontal scrollbar auf sehr schmalen Geräten
- keine versehentlichen Horizontwechsel beim Scrollen der 7-Tage-Matrix
- reduzierte Stationsmodelle und Feldanalyse auf Smartphonebreiten
- professionelle Ensemblediagramme bleiben im Cockpit viewportgebunden
- Temperaturwerte werden mobil verkleinert, aber nicht entfernt

## Regression

Neue Schutzverträge:

- `scripts/test-synoptic-professional-analysis-0940.mjs`
- `scripts/test-ensemble-metric-deck-0940.mjs`
- `scripts/test-cockpit-scroll-drizzle-consistency-0940.mjs`

Sie schützen Bodenanalysegeometrie, Windsemantik, Parameterdeck, Böen, Unsicherheitsfade, Temperaturwerte, Scrollisolation und Niederschlagsplausibilität.

## Worker

Keine neue Worker-Route und keine funktionale Workeränderung. Der Worker wird ausschließlich versionssynchronisiert.
