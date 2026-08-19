# MID v0.9.60.9 – Kompositbild Zeitpfeil nach Referenzvorlage

- Der Zeitpfeil wurde technisch neu aufgebaut: Schaft, Querunterteilungen und Pfeilspitze werden als ein zusammenhängendes HTML/SVG-Symbol in derselben Marker-Ebene wie die zuverlässig sichtbaren Zeitlabels gerendert.
- Die Pfeilspitze endet am aktuell gewählten Ort; die Achse verläuft stromaufwärts entgegen der Anströmung.
- Zeitangaben liegen ausschließlich an vier Unterteilungen (+15, +30, +45, +60 min). Direkt am Standort/Favoritenort wird keine Zeitmarke angezeigt.
- Absolute und relative Zeitangaben bleiben über den Zeitpfeil-Schalter zyklisch umschaltbar; der dritte Tap schaltet den Layer aus.
- Die Zugrichtung priorisiert weiterhin die wolkengewichtete Schwerpunktströmung aus dem Vertikalprofil (`steeringDirectionDeg` / `steeringProfileMode=cloud-weighted`); beobachtete Radarverlagerung bleibt Fallback.
- Standort-/Sichtrichtungspfeil bleibt strikt dem tatsächlichen Gerätestandort vorbehalten; Favoriten-/manuell gewählte Orte verwenden nur die neutrale Ortsmarkierung.
