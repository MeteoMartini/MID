# MID v0.9.85.319

- Aktuell – Radar-Nowcast: Niederschlagsbalken zeigen leichte, mäßige und starke Regenintensität anhand der Radar-Rate farblich abgestuft. Schraffur und Deckkraft unterscheiden die unkalibrierte Szenariounterstützung; fehlende Werte bleiben ausdrücklich unbekannt.
- Karten – RADOLAN-Niederschlagssummen: DWD-Import an aktuelle ODIM-H5-RW-Dateien und deren eigenständige 1-km-Rastergeometrie angepasst. Nur zeitlich vollständige, qualitätsgeprüfte 1-/6-/12-/24-/48-Stunden-Summen werden angeboten; fehlende Beobachtungen sind keine Nullwerte.
- Technisch: HDF5-Projektions-/Zeit-/NoData-Regressionen und einheitliche Radar-Farb-/Wahrscheinlichkeitsprüfungen ergänzt, ohne RUC- oder Warnlogik umzudeuten.
