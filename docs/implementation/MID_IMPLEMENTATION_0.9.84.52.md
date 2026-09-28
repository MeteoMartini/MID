# MID 0.9.84.52

## Installer #1005
Der Release-Build erreichte TypeScript 7.0.2 und scheiterte erneut in `EnsemblePanel.tsx`. Der Helfer `ensembleHazardDetail()` war korrekt vorhanden, aber der Aufrufer behandelte seinen fertigen String weiterhin wie das frühere Array und rief `.filter(Boolean).join(' ')` darauf auf. Diese alte Nachverarbeitung wurde entfernt.

Die Wetter-/Piktogramm-/Niederschlagsintensitätsänderungen aus 0.9.84.51 bleiben vollständig unverändert.
