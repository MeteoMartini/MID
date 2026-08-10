# MID v0.9.39.5 – exklusive Radar-/Modell-Niederschlagsart und Trend-Sprachkorrektur

Ausgangsbasis: MID v0.9.39.4 / `mid-stable`.

## I. Kompositbild – Niederschlagsart

- DWD HymecNG ist im aktiven Kompositbild vollständig als Quelle, Primärpfad und Fallback der Niederschlagsart entfernt.
- Der Schalter „Niederschlagsart“ besitzt nur noch den Zustand `Radar + ICON-D2` bzw. aus.
- Beobachtungsmaske: EUMETNET OPERA CIRRUS. Nur dort, wo ein reales Radarecho vorliegt, darf MID eine Phase einfärben.
- Phaseninformation: zeitnahes DWD ICON-D2 über einen eigenen Workerpfad mit Wettercode, Niederschlag, Regen/Schauern, Schneefall, Feuchtkugeltemperatur, Schneefallgrenze und Nullgradgrenze.
- Radarstand und Modellfeld werden zeitlich gegeneinander geprüft; zu alte oder zeitlich unpassende Daten schalten den Phasenlayer ab.
- Unsichere bzw. widersprüchliche Grenzfälle bleiben transparent. Es wird kein Phasentyp allein aus der Radarreflektivität erfunden.
- Hagel wird nicht mehr aus einem reinen Modell-Wettercode als beobachtete Niederschlagsart dargestellt.
- Das lokale ICON-D2-Stichpunktraster wurde gegenüber der früheren Wetterkarten-Hilfsabtastung verdichtet und wird ohne künstliche Unterteilung gerendert. Die Anzeige nennt den tatsächlichen Stichpunktabstand statt die native Modellauflösung vorzutäuschen.
- 15-minütige Zielzeiten werden im Client normalisiert und zehn Minuten gecacht, damit ein 5-minütiges Radarscrubbing nicht dreifach dasselbe Modellfeld nachlädt.

### Zuverlässigkeitsgrenzen

Die Fusion ist bewusst eine beobachtungsgebundene *Phasenabschätzung*, keine direkte hydrometeorologische Radar-Klassifikation. OPERA bestätigt Ort und Intensität des Echos; ICON-D2 liefert die thermodynamisch plausible Phase. Bei fehlender Übereinstimmung oder unzureichender Aktualität wird nichts eingefärbt.

## II. 7-Tage-Trend – Rechtschreibung und Grammatik

- `mit möglicher Tropennacht` → `mit einer möglichen Tropennacht`.
- Fragment `Am Samstag mit Sonne und Wolken, überwiegend trocken …` → vollständige Formulierung `Am Samstag wechselnd bewölkt mit sonnigen Abschnitten und überwiegend trocken …`.
- Folgenacht-Ereignisse behalten die korrekte Substantivschreibung und erhalten ein finites Verb: `In der Nacht zum Sonntag sind Schauer möglich.` statt `… schauer möglich.`.
- Ein Regressionstest verhindert erneute Kleinschreibung der Wetterereignisse sowie die alte Satzfragment-Form.

## Regression

Neuer Schutztest: `scripts/test-composite-phase-grammar-09395.mjs`.

Zusätzlich wurden die historischen HymecNG-Kompositregressionen auf den neuen Vertrag übertragen: Die alten Decoder dürfen als dormante historische Module bestehen bleiben, der aktive `RadarPanel`-Pfad darf sie jedoch nicht importieren oder als Fallback verwenden.

## Validierung

- 373/373 automatisch erkannte Regressionstests bestanden.
- Funktionaler Worker-Test erzeugt ein vollständiges lokales 35×49-ICON-D2-Phasenraster, prüft den tatsächlichen Stichpunktabstand und erzwingt den Abbruch bei einem zu alten Modelllauf.
- 95 aktive TS/TSX-Dateien ohne Parserfehler.
- `worker/metar-proxy.js`, `public/service-worker.js` und `public/sw.js` per `node --check` geprüft.
- Im aktiven Komposit-/Phasenpfad existiert kein HymecNG-Import, -Renderpfad oder -Fallback mehr.
