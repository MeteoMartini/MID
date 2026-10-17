# MID v0.9.85.280

- **Regen- und Schneebeginn einfacher lesbar:** Relative Vorlaufzeiten werden auf ganze 5-/10-Minutenstufen gerundet; Dauerangaben verwenden Stunden und Minuten statt Dezimalstunden. Die tatsächlichen Ereigniszeiten und meteorologischen Auslöseschwellen bleiben unverändert.
- **Benachrichtigungseinstellung:** Niederschlagshinweise lassen sich zwischen gerundeter relativer Zeit und ungefährer absoluter Uhrzeit umschalten. UTC-Ereigniszeit, gültige Orts-/Gerätezeitzone, Tageswechsel und Sommer-/Winterzeit werden berücksichtigt. Alte Registrierungen bleiben relativ; fehlende Angaben werden nicht als genaue Ortszeit ausgegeben.
- **Weitere modellgebundene Isobaren:** In der Synoptik sind MSLP-Isobaren jetzt für die vorhandenen GFS-/IFS- sowie ICON-Katalogmodelle explizit umschaltbar. Nur geprüfte Druckkonturen des angezeigten Modells, Modelllaufs und Gültigkeitstermins werden verwendet; keine Ersatzlinien von ICON auf anderen Modellen.
- RUC, amtliche Warnungen, Push-Cooldown, Ereignisdeduplikation und Prognosewerte bleiben unverändert. Ein neuer Regressionstest prüft Formate, DST, Altkunden und Modellzuordnung.
