# KNMI Workflow-Archiv

Ab MID v0.9.85.127 sind nur noch zwei KNMI-Diagnoseworkflows aktiv:

- `mid-knmi-eps-rolling-manifest.yml`: prüft die sechs aufeinanderfolgenden P4a-Stundenarchive und die vollständige 30-Member-Rolling-Struktur.
- `mid-knmi-eps-rolling-offset-smoke.yml`: prüft produktionsnah Werte-/Niederschlags-Offset und den tatsächlichen Punktdecoder.

Die hier archivierten Workflows waren manuell gestartete Explorations-/Entwicklungsdiagnosen für einzelne Zwischenstufen wie TAR-Header, GRIB-Range-Index, Gridindex, Multi-Range oder Packed-Point-Decoding. Sie waren keine Release-Gates und keine zeitgesteuerten Produktionsjobs.

Ihre fachlich weiterhin relevanten Ergebnisse sind durch die produktive KNMI-Worker-Implementierung und bestehende Regressionen (`test:knmi-eps-productive-cache`, `test:knmi-eps-worker-binding`, `test:knmi-eps-point-decoder`) geschützt. Das Archiv liegt absichtlich außerhalb von `.github/workflows` und verbraucht daher keine Actions-Slots.
