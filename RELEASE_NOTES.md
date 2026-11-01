# MID v0.9.85.392 – Schnellere Verarbeitung optionaler RUC-Modellfelder

- Optionale RUC-Modellfelder werden nicht mehr ausschließlich hintereinander geladen, sondern in zwei voneinander getrennten Gruppen verarbeitet. Die maximale Gesamtzahl gleichzeitiger DWD-Downloads wird dabei nicht erhöht.
- Scheitert ein optionaler GRIB-Download, entfernt MID die unvollständigen Zwischenbytes dieses Feldes. Die validierten RUC-Pflichtfelder, 27-Stunden-Laufzeitachse, 20 Ensemblemitglieder und die bestehenden vollständigen meteorologischen Abnahmen bleiben geschützt.
- Die Optimierung betrifft die Aufbereitung. Eine garantierte RUC-Aktualität innerhalb von 60 Minuten und die eigenständige 0–6-Stunden-Fast-Lane sind noch nicht nachgewiesen oder aktiviert.
