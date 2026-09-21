# MID 18.2.1 · RUC-Pages-Budget und meteorologische Priorisierung · v0.9.85.74

## Ausgangsbefund

Der erste vollständige Lauf nach Einführung des adaptiven `state15`-Blocks erzeugte 1.019.631.368 Byte RUC-Pages-Daten. Zusammen mit der App waren es 1.032.656.975 Byte und damit mehr als die 950-MB-Sicherheitsgrenze.

Der reale DWD-Lauf 2026-09-21 08 UTC zeigte:
- T2m, TD2m, RH2m, PMSL, U/V10m, VMAX10m sowie CLCT/CLCL/CLCM/CLCH: nur 7 Termine in 0…+6 h → operativ stündlich.
- VIS, CEILING, HZEROCL, SNOWLMT: 25 Termine in 0…+6 h → nativ 15-minütig.
- Der zusätzliche `state15`-Block enthielt daher nur Sicht, Ceiling, Nullgrad- und Schneefallgrenze und belegte rund 108,4 MB.

## Priorisierung

### Nativ 15 Minuten
- **Sichtweite (VIS):** relevant für Nebel, Dunst und rasche Sichtverschlechterung.
- **Ceiling:** relevant bei raschem Stratus-/Nebelaufzug und für die kurzfristige Wolkenuntergrenze.

### Stündlich
- **Nullgradgrenze (HZEROCL)** und **Schneefallgrenze (SNOWLMT):** meteorologisch deutlich träger als Sicht/Ceiling. Die Niederschlagsphase selbst liegt bereits separat in nativer 15-min-Auflösung vor, deshalb entsteht durch den Stundenfallback kein unnötiges Blindfeld.
- Temperatur, Taupunkt/Feuchte, Druck, Wind/Böen und Bewölkung bleiben so lange stündlich, wie der DWD-RUC-Datenbaum für den konkreten Parameter keine vollständige native 15-min-Folge liefert. Insbesondere CLCT wird nicht künstlich hochaufgelöst oder als nativ bezeichnet.

### Aus dem kostenlosen Pages-Profil entfernt
- `solar15` (ASOB_S/ASWDIR_S/ASWDIFD_S): Der aktuelle sichtbare MID-Kurzfristpfad konsumiert diese drei Vollgitterfelder nicht. Sie werden deshalb weder im operativen Free-Preprocessing geladen noch auf Pages publiziert. Astronomische Tages-/Nachtlogik und die bestehende Skybar bleiben davon unberührt.

## Speicherziel

Der kostenlose RUC-Pages-Datensatz erhält zusätzlich ein eigenes hartes Budget von **900.000.000 Byte**. Damit wird eine Übergröße bereits beim Erzeugen des Pages-Profils gestoppt und nicht erst nach einem ~1-GB-Artefaktupload.

Ausgehend vom fehlerhaften Lauf werden etwa 54,2 MB durch HZEROCL/SNOWLMT im 15-min-state15 und etwa 81,3 MB durch solar15 eingespart. Erwartetes RUC-Pages-Volumen: rund **884 MB** statt 1.020 MB; mit dem derzeitigen App-Build rund **897 MB**, also etwa 53 MB unter der bisherigen kombinierten 950-MB-Sicherheitsgrenze.

Der vollständige stündliche/spezialisierte RUC-Pfad und die 15-min-Niederschlagsphase bleiben erhalten.
