# MID v0.9.76.31 – Umsetzungsnachweis

## Anlass
- Reiseplaner darf nicht mehr mit einem alten lokal gespeicherten Reiseziel starten.
- Kompositbild soll im obersten Referenzlayer wieder sowohl Städte als auch Grenzen sichtbar machen.

## Änderungen
1. `src/TravelPlannerPanel.tsx`
   - Initiales Reiseziel auf `initialLocation` umgestellt.
   - Neuer Zustandsmarker `destinationSource` (`current` / `custom`).
   - Solange `destinationSource === 'current'`, folgt das Ziel automatisch dem aktuell in MID gewählten Ort.
   - Button `Aktueller MID-Ort` setzt den Planner explizit zurück auf den aktuellen MID-Ort.
   - Veraltete Initialisierung aus lokal gespeichertem Ziel entfernt.

2. `src/RadarPanel.tsx`
   - `compositeReferenceLayers()` um allgemeinen `boundary-fallback` ergänzt.
   - Filter für `admin_level` und `maritime` so erweitert, dass sowohl numerische als auch String-Werte akzeptiert werden.
   - Länder- und Regionsgrenzen bleiben hervorgehoben, zusätzliche Grenzen werden als dezente Fallback-Linien sichtbar.

3. Regressionen
   - `scripts/test-travel-planner-08190.mjs` um den neuen Defaultzustand des Reiseplaners ergänzt.
   - `scripts/test-composite-transparent-reference-09762.mjs` um den Boundary-Fallback-/String-Admin-Level-Vertrag ergänzt.

## Validierung
- `node scripts/test-composite-transparent-reference-09762.mjs` ✅
- Weitere vollständige TypeScript-/Build-Checks waren in dieser Container-Sitzung nicht vollständig reproduzierbar, da die lokale Toolchain unvollständig installiert war (fehlende nutzbare `typescript-strada`-/@types-/lokale TypeScript-Pakete).

## Worker / Deployment
- Keine Worker-Logik geändert.
- Ein neuer Worker-Upload ist **nicht erforderlich**.
