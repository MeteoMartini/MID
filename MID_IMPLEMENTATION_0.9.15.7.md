# MID v0.9.15.7 – KONRAD3D-TypeScript-Buildfix

## Fehlerursache

`ResolvedKonradTrackPoint` erlaubte bereits das optionale Feld `derived`. Die Variable `deduped` wurde jedoch aus der ersten `map()`-Rückgabe ohne dieses Feld inferiert. TypeScript verengte den Arraytyp deshalb auf die amtlichen Felder. Spätere `push()`-Aufrufe mit `derived: true` lösten TS2353 aus.

## Korrektur

- `deduped` ist explizit als `ResolvedKonradTrackPoint[]` typisiert.
- Amtliche Prognosepunkte werden mit `derived: false` gekennzeichnet.
- Aus dem Zugvektor ergänzte Punkte behalten `derived: true`.
- Die Radar- und Worker-Funktionalität bleibt unverändert.

## Version

Patchrelease von 0.9.15.6 auf 0.9.15.7.
