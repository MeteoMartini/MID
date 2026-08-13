# MID v0.9.50.0 – UI-/Architekturstandardisierung ohne Funktionsabbau

## Ausgangsbasis

- Verbindlicher Stable-Stand: MID v0.9.49.1, Branch `mid-stable`.
- Ziel: technische Bereinigung und verbindliche Standards, ohne Funktionen oder fachliche Auswertungen zu entfernen.

## Umgesetzt

### Gemeinsame Portalprimitive

Die zuvor in `App.tsx` und `AppInfoPopover.tsx` doppelt vorhandene Logik für verankerte Body-Portale wurde in `src/AppPortalPopover.tsx` zentralisiert. Die Primitive übernimmt:

- Body-Portal,
- viewportgebundene Positionierung,
- rAF-gedrosselte Neupositionierung bei Scroll/Resize,
- Außenklick/-tippen,
- Escape,
- optionale Swipe-down-Schließung auf Touch-Geräten,
- Ausrichtung links/zentriert/rechts,
- Tooltip-/Dialogrollen und ARIA-Bezeichnung.

`AppInfoHint` verwendet ausschließlich diese Primitive. Auch die Modellstand- und Konsistenz-Popover des Forecast-Cockpits wurden auf denselben Pfad umgestellt. Die spezialisierten Ensemble-Diagrammtooltips bleiben vorerst unverändert, da sie eigene Chart-Interaktionsanforderungen besitzen.

### Verbindlicher UI-/Architekturvertrag

`MID_UI_ARCHITECTURE_CONTRACT.md` definiert für neue Entwicklungen verbindlich:

- kanonische Fachpfade statt sektionseigener Parallelberechnungen,
- gemeinsame `(i)`-/Popover-/Menüregeln,
- Außenklick, Escape, Touch und Tastatur,
- Regeln für Auf-/Zuklappen und Persistenz,
- Drawer/Modal-Verhalten,
- zentrale Zeit-/Einheiten-/Formatierungsgrundsätze,
- responsive Touchgrößen und Informationsschutz,
- Performance- und Lebenszyklusregeln,
- Pflicht zur Regression bei neuen Interaktionsmustern.

Der Vertrag ist zusätzlich in `MID_SOURCE_OF_TRUTH.md` verankert.

### Neue-Code-Schutz

`test-ui-architecture-contract-09500.mjs` verhindert insbesondere, dass neue Dateien wieder:

- eine eigene generische `createPortal`-Engine,
- eine kopierte Außenklick-/Escape-Engine,
- oder vom MID-Vertrag abweichende Info-Popover-Grundmuster

einführen.

Bestehende spezialisierte Ensemble-Tooltips sind als explizite Legacy-Ausnahme eingegrenzt und dürfen nicht als Vorlage für neue Sektionen dienen.

## Nicht verändert

- keine Wetterfunktion entfernt,
- keine Datenquelle entfernt,
- keine Modell-/Ensemble-/Stationslogik vereinfacht,
- keine Warn-, Event-, Wetterzwilling-, Radar-, Langfrist-, Berg-, Wasser- oder Flugwetterfunktion entfernt,
- keine Benutzerpräferenz zurückgesetzt.
