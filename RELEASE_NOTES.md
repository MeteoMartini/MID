# MID v0.9.85.324

- Die 7-Tage-Ansicht startet auch am Zeitumstellungstag wieder mit heute. Der Abruf enthält die erforderlichen vergangenen Stunden für den vollständigen Ortskalendertag.
- Tagesniederschlag, Sonnenstunden und Temperaturspanne berücksichtigen weiterhin den gesamten Tag; bereits vergangene Stunden werden nicht als Resttag abgeschnitten. Fehlende Daten werden nicht künstlich ergänzt.
- Direkter Wetterabruf und Worker verwenden denselben begrenzten Stundenumfang; alte Kernvorhersage-Caches werden erneuert.
