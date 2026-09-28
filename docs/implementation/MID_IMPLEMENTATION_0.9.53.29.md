# MID v0.9.53.29 – Geräte-Sync TypeScript-Buildfix

## Anlass

Der GitHub-Produktionsbuild von v0.9.53.28 meldete `TS2345` in `src/deviceSync.ts`: Der neue verlustfreie Favoriten-Sync konnte einen fehlenden Primär-/Shadow-Snapshot fachlich korrekt als `null` weiterreichen, während die nachgelagerte Merge-Signatur diesen Zustand zu eng typisiert hatte.

## Umsetzung

- `favoriteSnapshotInput()` normalisiert einen vollständig fehlenden Snapshot an der Sync-Grenze explizit auf `undefined`.
- `mergeFavoriteSnapshots()` akzeptiert Remote- und Local-Snapshots defensiv als `string | undefined | null`.
- Der frühe Merge-Rückgabepfad gibt niemals `null` in `SyncSnapshot.values: Record<string,string>` zurück.
- Damit sind auch die nach dem zuerst sichtbaren `TS2345` nachfolgenden Nullability-Diagnosen im selben `prepareSnapshotForApply()`-Pfad beseitigt.
- Die Laufzeitsemantik bleibt unverändert: Favoriten-Union, Shadow-Recovery, Tombstones, Revisionsvergleich und die strikte Trennung zwischen Orts- und Event-Favoriten bleiben vollständig erhalten.

## Nachhaltigkeit

`scripts/test-device-sync-nullability-buildfix-095329.mjs` ist Required Regression. Der Test:

- kontrolliert die Null-Normalisierung an der Snapshot-Grenze,
- kontrolliert die defensive Merge-Signatur,
- kontrolliert, dass kein `null` in die stringbasierte portable Sync-Nutzlast zurückfließen kann,
- kompiliert den vollständigen produktiven `src/deviceSync.ts` im TypeScript-Strict-Modus gegen typisierte Stubs seiner vier direkten Schnittstellenmodule.

Damit wird genau der in GitHub Actions aufgetretene Buildpfad künftig bereits als Regression geschützt.

## Prüfung

- Vollständiger `deviceSync.ts`-Strict-Typecheck mit typisierten Schnittstellenstubs: bestanden.
- Favoriten-/State-Integrity-Regression v0.9.53.27: bestanden.
- Event-Ampel-Regression v0.9.53.28: bestanden.
- Forecast-Konsistenzvertrag v0.9.53.26: bestanden.
- Worker und beide Service Worker: Syntaxprüfung bestanden.
- 443 Regressionstests erkannt. 429 Tests laufen in der isolierten Umgebung vollständig durch. 12 weitere brechen ausschließlich ab, weil `npm ci` in dieser Containerumgebung vor der Installation der im Professional-ZIP nicht enthaltenen `@types`-/React-Abhängigkeiten scheitert. Zwei weitere Tests sind wegen der bereits im Ausgangsarchiv fehlenden `.github/workflows`-Dateien nicht ausführbar.
