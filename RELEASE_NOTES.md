# MID v0.9.85.272 · Zusätzliche ICON-D2-Wetterkartentermine zuverlässig laden

- Die verlustfrei komprimiert veröffentlichten zusätzlichen ICON-D2-Karten für +13, +14, +16 und +17 Stunden erhalten jetzt denselben unveränderlichen SHA-Adressvertrag wie der bestehende Synoptik- und Kartenkatalog. Dadurch können Browser und Modellcache die nach erfolgreicher Prüfung veröffentlichten Karten wieder laden.
- Ein neuer Ende-zu-Ende-Test erzeugt einen tatsächlichen zusätzlichen Kartenindex, prüft dessen adressierte SHA-256-Prüfsumme und gleicht das Pfadschema gegen Browser und DWD-Modellcache ab. Ungültige oder unvollständige Modellkarten bleiben ausgeschlossen.
- WMO-Wettercodes, echte Modelllauf- und Gültigkeitszeiten, Gitterkoordinaten, Kompressionswerte, Missing-Masken, unveränderter Rohdaten-Rollback und alle bestehenden Speicher-/Worker-/Pages-Gates bleiben erhalten. Die tatsächliche Verfügbarkeit zusätzlicher Termine ist von den verfügbaren DWD-Quelldaten abhängig.
