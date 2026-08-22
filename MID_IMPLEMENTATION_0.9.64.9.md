# MID v0.9.64.9

## CI-/Regression-Fix ohne Funktionsänderung

- Behebt den Installationsabbruch aus v0.9.64.8 im Regressionstest `test-water-current-direction-arrow-09647.mjs`.
- Ursache war **keine fehlerhafte Strömungsdarstellung**, sondern eine veraltete Testbedingung: Der historische v0.9.64.7-Vertrag verlangte fälschlich weiterhin exakt die Releaseversion `0.9.64.7` und musste deshalb bei jedem späteren Release scheitern.
- Der Test schützt nun weiterhin vollständig die in v0.9.64.7 eingeführte Zielrichtungs-/Pfeillogik, akzeptiert aber korrekt alle späteren MID-Versionen ab v0.9.64.7.
- Die Synchronitätsprüfung bleibt streng: `package.json`, `MID_BASELINE.json` und `WORKER_VERSION` müssen weiterhin exakt dieselbe aktuelle Releaseversion tragen.
- Keine Wetterlogik, Warnlogik, Persistenzlogik oder KV-Funktionalität aus v0.9.64.8 wurde zurückgenommen oder verändert.

## Release

- Wartungsrelease **0.9.64.9**.
- App, Worker, Service Worker, Versionsmetadaten und Baseline sind auf 0.9.64.9 synchronisiert.
- Da v0.9.64.8 wegen des Regressionstests nicht installiert/committet wurde, enthält der Worker v0.9.64.9 weiterhin die dort vorgesehenen Warngebiets- und KV-Einsparungen und muss zusammen mit diesem Release hochgeladen werden.
