# MID v0.9.85.459

## Änderungen
- GeoSphere Austria INCA wird als eigenständig gekennzeichnete 15-Minuten-Niederschlags-Punktprognose für Österreich ergänzt (kg/m² Wasseräquivalent = mm). Modelllauf, UTC-Gültigkeit, Rasterpunkt und Quellen-/CC-BY-4.0-Namensnennung sind getrennt von Radar-Beobachtungen und amtlichen Warnungen angegeben.
- Die vollständige ICON-D2-Abdeckung wird mit 542.040 nativen Rasterzellen und 72 Originalfeldern über einen geschützten DWD-SLSA-Signaturpfad technisch vorbereitet. Sie wird erst nach echter Original-, Pages- und Client-Abnahme aktiviert.
- Radar und Satellit im Alpenraum unterscheiden frische DWD-/OPERA-Beobachtungen von überalterten Bildern; ein gültiges IR-Produkt kann bei ausgefallenem VIS-Produkt einspringen.
- RainViewer bleibt ohne dokumentierte Betreiberfreigabe für öffentliche MID-Proxy-Nutzung gesperrt, einschließlich Kacheln und Punktauswertung.
- Die RUC-Dispatch-Protokollierung ist vor Shell-Einschleusung über frei eingegebene Parameter geschützt.

## Unverändert
WMO-/DWD-Warnungen, NoData und echte Null, Quellenherkunft, Modelllauf- und UTC-Termine sowie physikalische Originalwerte bleiben geschützt. Keine weiteren kostenpflichtigen Dienste oder Berechtigungen.

## Qualität und Freigabe
Der gemeinsame QA-Kandidat übernimmt #765, #766, #767, #768 und #769. Die RUC-P4-Arbeit #750 bleibt ausgenommen, bis ihre separaten Originaldaten-/Rollback-Gates nachgewiesen sind. Erst die vollständigen Source-/Bot-/ZIP-/Installer-/Worker-/Pages-/Stable-Gates und der echte signierte öffentliche Vollgebiets-Readback erlauben eine Freigabe.
