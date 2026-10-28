# ECMWF-Originaldatenqualifikation .356

Basis .355 / 48c4016d0b98244cb08aa560aa42b14d6c6754a7. Der erhaltene Draft #433 wird selektiv integriert: drei aufeinanderfolgende Zyklen, 2t/MSLP/Z500 bei +0/+24h. Alle 6.483.600 Werte je Feld werden dekodiert, Bitmap und Positionen gehasht, Originaldatei-SHAs archiviert, grobe physikalische Grenzen und vollständiger zyklischer Globus einschließlich Scanflags geprüft. Echte Nullwerte bleiben gültig, maskierte Platzhalter fehlen. Keine Reprojektion, Glättung oder Modellfusion.

Tatsächlicher aktueller Originaldatenlauf: 18 Felder / 116.704.800 Zellen bestanden. Quelle ECMWF Free Open Data, CC BY 4.0 / ECMWF Terms of Use. Einzelmetadaten, SHAs und Wertebereiche: MID_C49_ECMWF_FULL_SPATIAL_20261028.json. Der offizielle Client 0.3.35 sowie ecCodes 2.50.0 / NumPy 2.3.5 sind isoliert gepinnt. Der lesende Workflow bleibt contents:read, zehn Minuten, 64 MiB je Feld / 110 MiB insgesamt, ausschließlich JSON-Artefakte. 13 Offline-Verträge einschließlich Maskenverfälschung, NaN, Ausreißer, Dimensionen und echten Nullen bestanden.

Keine Produktionsaktivierung: readyForProduction, mapsEnabled, fusionEnabled und published bleiben false. Weitere Variablen, Niederschlagsakkumulation, gesamter Vorhersagehorizont, unabhängige Güte und zusätzliche UI-/Transport-/Budgetgates sind weiterhin offen.
