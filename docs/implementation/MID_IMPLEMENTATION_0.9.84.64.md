# MID 0.9.84.64 – Reise-Center-Lesbarkeit

## Ziel
Der in 0.9.84.62 begonnene komponentenweise UI-Audit wird im Reise-Center fortgesetzt. Die historisch sehr kleinen Beschriftungen werden auf die bestehenden MID-Typografietokens umgestellt; Reise- und Wetterlogik bleiben unverändert.

## Umsetzung
- Navigation des Reise-Centers nutzt statt 7–9 px die semantischen MID-Größen `xs/sm` und erhält mindestens 36 px Bedienhöhe.
- Zeitraum-, Quellen- und Kartenmetadaten werden mit den vorhandenen `micro/xs`-Tokens dargestellt statt mit 6–8 px Einzelwerten.
- Schnellkennwerte (Tmax/Tmin, Regentage, Sonne/Tag, Windmaximum, Schneehöhe, Wasser) bleiben kompakt, sind aber auf iPhone/iPad besser lesbar.
- Die Schaltfläche zum Lösen einer angehefteten Reise wächst von 29 auf 36 px; auf groben Touch-Pointern auf 40 px. Der Kartenkopf erhält entsprechend mehr rechten Innenraum.
- Detail- und Aktionsschaltflächen erhalten mindestens 36 px, auf groben Touch-Pointern 40 px Bedienhöhe.
- Der Quellen-/Modellstatus verwendet die gemeinsamen MID-Typografietokens. Auf schmalen Displays bleibt das bereits vorhandene einspaltige Layout erhalten.

## Funktionsschutz
Unverändert bleiben insbesondere Reisezeitraum, Persistenz angehefteter Reisen, Modell-/Klimafusion, Modellhorizonte, Quellengewichtung, Wetterparameter, Warnungen, Karten, Hyperlokal-/Wetterzwilling-Logik, Exporte sowie Worker-Fachlogik.

## Regression
Der neue Pflichtvertrag `scripts/test-travel-center-readability-098464.mjs` schützt die Typografietokens, Mindestbediengrößen, mobile Touch-Ziele und die Synchronität des erzeugten Gesamtstylesheets.
