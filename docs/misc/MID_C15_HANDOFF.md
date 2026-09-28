# MID C15 Handoff · v0.9.85.35

## Ausgangspunkt

- Basis: stabil veröffentlichte MID v0.9.85.34 (`bf1d50f7a625c04dfb22cdf0db56ed3517850a19`).
- Fortsetzungsbranch: `chatgpt/mid-c15-today-density-098535`.
- Anlass: realer Smartphone-Sichtvergleich nach C14. Die Überlauf-/Impressumfehler sind in v0.9.85.34 behoben; als nächster Redesign-Schritt wird die Seite „Heute“ visuell ruhiger und platzsparender.

## C15-Vertrag

- Das amtliche DWD-Originalprodukt „Wolken + Niederschlagsart“ bleibt unverändert verfügbar, öffnet sich aber standardmäßig erst nach bewusster Nutzeraktion.
- Die eigentliche Bildkomponente wird erst beim Öffnen aktiviert; Originalzeitstände, Pixelanalyse, Zoom und DWD-Quellenherkunft bleiben erhalten.
- `ForecastCockpit` und `ShortTermForecast` verwenden denselben Disclosure-Vertrag.
- Das 24-h-Wetterprofil behält alle fachlichen Spuren. Auf Smartphones werden lediglich Kopf, Signalkarten, Toolbar und Hilfetext verdichtet beziehungsweise innerhalb des eigenen Viewports gescrollt.
- Keine Änderung an Wetterdaten, Warnschwellen, WMO-/DWD-Semantik, Parameterfarben, Nowcast-/RUC-Fusion oder Zeitintervallen.

## Veröffentlichung

- Ausschließlich Source-PR-Gate → Auto-Merge → Release-ZIP → Installer → GitHub Pages → Stable-Promotion.
- Kein manuelles Umgehen von Gate, Regressionen oder Stable-Promotion.
- Vor einer Erfolgsmeldung müssen der installierte Commit, Pages und `mid-stable` auf denselben Release-SHA konvergiert sein.

## Danach

- Nach C15 die verbleibenden „Heute“- und 24-h-Abstände auf realen Smartphone-/Tabletbreiten weiter prüfen und anschließend den nächsten noch nicht vollständig redesign-konformen Abschnitt fortsetzen.
