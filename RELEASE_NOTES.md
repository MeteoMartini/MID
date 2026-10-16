# MID v0.9.85.270 · Zusätzliche ICON-D2-Wetterkartentermine nach RUC-Kompression

- Der bereits produktiv freigegebene verlustfrei komprimierte RUC-Snapshot kann zusätzlich tatsächlich vorhandene ICON-D2-Karten für Wolken und signifikantes Wetter (+13, +14, +16 und +17 Stunden) aufnehmen. Die Dateien werden nur bei passendem DWD-Modelllauf, exakter Gültigkeitszeit, Raster-/WMO-/Einheitenkontrolle und vollständigem SHA-Nachweis übernommen; fehlende Karten werden nicht künstlich erzeugt.
- Die Erweiterung erfolgt ausschließlich nach bestandenem RUC-Bytegleichheitsnachweis in einem eigenen unveränderlichen Kartennamespace. Originaldaten, veröffentlichte Kartentermine und die gesicherte unkomprimierte Rückfallkopie bleiben bestehen.
- Das 900-MB-RUC-Budget, die bisherige 950-MB-Pages-Grenze und sämtliche Worker-/Pages-/Freshness-/Rollback-Gates bleiben aktiv. Ist kein zusätzlicher gültiger Termin verfügbar, bleibt das bewährte Kartenangebot unverändert.
- Skybar-Fix und RUC-Snapshot-Schutz aus v0.9.85.268/.269 bleiben unverändert erhalten. Neue RUC-Parameter, native RUC-Karten und eine physische iOS-/VoiceOver-Abnahme werden mit dieser Änderung nicht behauptet.
