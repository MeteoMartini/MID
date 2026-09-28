# MID 0.9.84.50

## Installer #1003
Der Release lief bis zum TypeScript-7-Check. Dort schlug `EnsemblePanel.tsx` mit TS2339 fehl, weil die Inline-Verknüpfung aus Windrichtung und probabilistischem Kontext an der kompakten Hazard-Zeile nicht robust typisiert war. Die Verkettung wurde in `ensembleHazardDetail()` ausgelagert und filtert nun mit einer expliziten String-Typwache.

Die in 0.9.84.49 eingeführte fachliche Darstellung bleibt unverändert: sichtbarer Best-Match-Ereigniswert mit „bis zu“-Rundung; Ensemble/Umfeld nur als zusätzlicher Kontext hinter dem Info-Zugang.
