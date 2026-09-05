# MID 0.9.78.60 – Kompositbild

## Ziel

Die Sektion **Kompositbild** erhält eine moderne, verständliche und fachlich zeitechte Übersicht. Der bisherige pauschale Zeitpfeil und die unzuverlässige Vorschau werden durch datenabhängige Zustände ersetzt.

## Umsetzung

- Drei klare Arbeitsmodi: **Radar**, **Satellit** und **Synoptik**.
- Schnellwahl für Radar, Radar + Satellit, Gewitter, Winter und Synoptik.
- Die Zeitachse übernimmt ausschließlich bestätigte Zeitstempel der jeweils aktiven Produkte innerhalb von −60 bis +120 Minuten. Es werden keine Zwischen- oder Zukunftsbilder erfunden.
- Beobachtung, Nowcast und Modellprognose besitzen getrennte Statusfarben, Quellenangaben und Verfügbarkeiten.
- **Zugspuren** ersetzen den alten Zeitpfeil. Eine Standort-ETA wird nur gebildet, wenn:
  - ein zeitlich gültiger Radarstand vorliegt,
  - die Bewegungsqualität mindestens mittel ist,
  - ein realer Echoanker die saisonale Mindestintensität erreicht,
  - dessen projizierter Korridor den Standort schneidet.
- Die Spur zeigt Unsicherheitskorridor, Prognoseknoten, ETA-Bereich, Bewegungsqualität und Wachstums-/Abschwächungstrend. Höhenströmung bleibt Diagnose/Fallback, erzeugt ohne Echo aber keine ETA.
- DWD-Radar und Satellit wechseln per Doppelpuffer: Das letzte vollständig geladene Bild bleibt sichtbar, während der Zielstand im Hintergrund lädt. Erst nach erfolgreichem Laden wird umgeschaltet.
- Wiederholte Kachelfehler werden erst nach einem Quorum gemeldet; DWD-Radar erhält eine kurze Wiederholsperre, Satellit kann kontrolliert auf das IR-Produkt wechseln.
- 250-m-Radar und Warnkarte sind ausschließlich bei **Jetzt** sichtbar. Untimed Satelliten-Snapshots erscheinen ebenfalls nur live. Blitz- und Zellobjekte werden nicht in nicht unterstützte Zeitstände kopiert.
- Neue Standortzusammenfassung für aktuelles Echo, Annäherung/ETA und Zeitstatus.
- Responsive Kartenhöhe, zweispaltige mobile Layerbedienung und kompakte erweiterte Einstellungen.

## Persistenz und Kompatibilität

Aktive Layer, Deckkräfte, Kartenbasis, Modus und Zugspur-Zeitformat bleiben in den bestehenden Kompositeinstellungen gespeichert. Alte Einstellungen werden automatisch auf einen passenden Ansichtsmodus migriert. Der gemeinsame React/Vite-Kern bleibt für Browser/PWA und iOS erhalten.

## Geänderte Kernbereiche

- `src/RadarPanel.tsx`
- `src/CompositeTimeline.ts`
- `src/compositeSettings.ts`
- `src/styles-src/20-ensemble-composite.css`
- `src/styles.css`
- Komposit-/Radar-/Satelliten-Regressionen unter `scripts/`

