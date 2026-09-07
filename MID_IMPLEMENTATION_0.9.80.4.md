# MID v0.9.80.4 – Klima-, Hazard- und Widget-Verträge

Stand: 7. September 2026

## Extern

- Die Klima-Sektion unterscheidet **Tmax, Mitteltemperatur, Tmin und Niederschlag** dauerhaft mit getrennten Parameterfarben; Tmin ist damit auch farblich nicht mehr mit Niederschlag verwechselbar.
- Die Temperaturgrafik zeigt zusätzliche Achsenwerte und behält das antippbare Monats-Overlay bei.
- Bedeckungsanteile werden in fünf nachvollziehbaren, an Achteln orientierten Klassen dargestellt.
- Neben der Niederschlagsmenge werden erwartete **Niederschlagstage ab 1 mm** und **Schneefalltage ab 0,1 cm** ausgewiesen.
- Die Windrose bleibt ressourcenschonend auf der vorhandenen 1991–2020-Tagesklimatologie aufgebaut. Die Darstellung kennzeichnet nun ausdrücklich: Armlänge = Richtungshäufigkeit, Segment = Geschwindigkeitsklasse. Sie behauptet keine stündliche 30-Jahres-Verteilung.
- Das Export-Widget übernimmt seine Gefahrenhinweise aus demselben automatischen MID-Hazardpfad wie die Warnübersicht. Sonnenscheindauer wird dort platzsparend ganzstündig angezeigt; Böenfarben folgen den zentralen DWD-Windwarnschwellen.
- Windwarnfarben und -stufen verwenden in Windpfeilen, Forecast-Cockpit und Bergwetter denselben zentralen DWD-Schwellenvertrag. Die Sondergrenzen 50 und 140 km/h werden überall als „über“, nicht als „ab“, behandelt.

## Intern

- `dwdWarnings.ts` exportiert den kanonischen Grenzvergleich und die daraus abgeleitete Warnstufe für km/h bzw. kt; lokale Parallelberechnungen wurden darauf umgestellt.
- Widget-Hazards werden aus `hazards(...)` erzeugt und über ihre probabilistischen `validFrom`/`validTo`-Fenster den lokalen Kalendertagen zugeordnet. Der frühere separate Widget-Abruf über `dailyHazards(...)` entfällt.
- `sunshineDuration.ts` besitzt zusätzlich eine explizite Ganzstunden-Darstellung für kompakte Oberflächen; die präziseren übrigen MID-Ansichten bleiben unverändert.
- Die vorhandene tägliche ERA5-Seamless-Reihe ermittelt nun zusätzlich die klimatologische Schneefalltag-Wahrscheinlichkeit. Dafür wurde der lokale Klima-Cache auf Schema `v6` angehoben.
- Die Bedeckungsklassen sind 0–1/8, 2–3/8, 4–5/8, 6–7/8 und 8/8 angenähert; Grundlage bleiben tägliche ERA5-Mittelwerte.
- Der Klima-Farbvertrag besitzt jetzt eigene Tokens für `temperature-max-climate`, `temperature-mean-climate` und `temperature-min-climate` in Hell- und Dunkelmodus.
- Neue Regression `scripts/test-climate-hazard-widget-09804.mjs`; ältere Widget-Verträge wurden bewusst auf den neuen automatischen Hazardpfad aktualisiert.
- Keine fachliche Workeränderung; Worker-/Service-Worker-Versionsstrings werden nur releaseweit synchronisiert.

## Bewusste Grenze

Eine echte stündliche Windrose über die gesamten Klimanormalen 1991–2020 würde einen sehr großen zusätzlichen historischen Stundenabruf erfordern. Für die primär unter iOS/iPhone genutzte App wäre das für eine standardmäßig geschlossene Klima-Sektion unverhältnismäßig. MID bleibt deshalb bei der bereits geladenen täglichen Hauptwindrichtung und Tagesmittelgeschwindigkeit und weist diese Datengrundlage nun ausdrücklich aus.
