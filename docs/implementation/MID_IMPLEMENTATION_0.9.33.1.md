# MID v0.9.33.1

## Langfrist – TypeScript-Buildfix

- `LongRangePanel.tsx`: Achsenfunktionen `y` und `x` explizit als `(value:number)` bzw. `(index:number)` typisiert.
- Behebt die im Produktionsbuild gemeldeten Fehler TS7006.
- Schutzregression `test-long-range-types-09331.mjs` ergänzt.
