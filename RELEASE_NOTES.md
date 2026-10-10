# MID v0.9.85.231

Unter Karten ersetzt „Wolken und signifikantes Wetter“ das bisherige Einzelprodukt. Graustufen zeigen Gesamtbewölkung, Farben direkte Wettererscheinungen des Modells. ICON-D2 verwendet gemeinsam geprüfte Wolken-/Wetterraster; ICON-EU und ICON Global werden angeboten, sobald die Aufbereitung passende Felder desselben Laufs und Termins bestätigt. GDPS ergänzt eine globale Kombination aus Wolken und momentaner Niederschlagsart mit eigener Originallegende; vollständige Nebel-/Gewitterdiagnostik liefert diese Quelle nicht.

Ortswerte und PNG-/SVG-Exporte der nativen Kombination verwenden dieselben Raster und Farben. Wetterkategorien werden weder zeitlich noch räumlich interpoliert. Fehlende Werte bleiben unbekannt; unterschiedliche Modellläufe werden nicht kombiniert.

Fehlende optionale RUC-Graupeldaten bleiben beim Erzeugen, Speichern und Lesen der Niederschlagsphasen als „nicht verfügbar“ erhalten. Sie werden nicht mehr als trockene Nullwerte ausgegeben. Vorhandene Regen-/Schneewerte und echte trockene Graupelwerte bleiben nutzbar; vollständig fehlende Phasenzellen bestehen die Verfügbarkeitsprüfung nicht.

Das Radar-Phasenoverlay behandelt fehlende Temperatur-/Feuchtewerte ebenfalls als fehlend. Aus null oder leeren Werten entstehen keine künstlichen 0 °C und kein thermischer Beleg für Schnee oder gefrierenden Niederschlag.

Wissenschaftlicher Audit: Regressionen prüfen Missing-Sentinels, partielle Datenlücken, echte trockene Nullwerte, Extremwetter-Ausgabe und den Worker-Leseweg. Weitere Parameter-/Einheitenverträge, der vollständige wissenschaftliche Referenzlauf und externe Geräte-/SLO-Abnahmen bleiben offen.
