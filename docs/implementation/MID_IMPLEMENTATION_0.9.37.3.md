# MID v0.9.37.3 · HymecNG Performance-/CI-Fix

Der echte DWD-HymecNG-Layer bleibt aktiv. Die historisch bewusst deaktivierten Module `HymecNgSource.ts` und `HymecNgOverlay.tsx` werden jedoch nicht mehr aus dem aktiven Bundlepfad importiert. Stattdessen nutzt das Kompositbild die neuen, lazy geladenen Module `CompositeHymecNgSource.ts` und `CompositeHymecNgOverlay.tsx`. Dadurch bleibt `test-interaction-performance-cleanup-08155.mjs` erfüllt, ohne die HymecNG-Funktion zurückzunehmen.
