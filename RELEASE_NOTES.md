# MID v0.9.85.382 – RUC: Ensemble-Lücken früh erkennen

- MID prüft die vollständige native DWD-RUC-EPS-Mitglieder- und Stundenmatrix bereits vor dem zeitaufwendigen Herunterladen der übrigen Modellfelder.
- Bei unvollständigen aktuellen Läufen verwirft MID den Kandidaten frühzeitig und versucht wie bisher einen älteren vollständigen DWD-Modelllauf.
- Vollständige GRIB-, Niederschlagsakkumulations-, Bitmap-, Datenlücken-, physikalische und Releaseprüfungen bleiben unverändert. Der neue Frühcheck ersetzt sie ausdrücklich nicht.
- Keine amtlichen Warnungsänderungen, kein Einsatz ungeprüfter Modellwerte und kein Überspringen von Installer-/Worker-/Pages-Gates.

