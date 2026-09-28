## MID v0.8.26.9 umgesetzt

**Automatische Versionsbewertung:** Wartungsstand ab **v0.8.26.8**, da ausschließlich ein TypeScript-Buildfehler der bereits wiederhergestellten Ensemble-Wetterebene korrigiert wurde.

### Fehlerursache

`TrendRow.precipVisualType` enthält bewusst auch den Zustand `none`. `PrecipitationGlyph` akzeptiert dagegen ausschließlich die tatsächlich darstellbaren Typen `rain`, `snow` und `mixed`. Die vorher verwendete boolesche Zwischenvariable `hasPrecip` engte den Union-Typ beim JSX-Prop unter TypeScript nicht ein, wodurch `TS2322` entstand.

### Korrektur

- `none` wird vor dem Rendern explizit in `null` überführt.
- Nur der eingegrenzte Typ `rain | snow | mixed` wird an `PrecipitationGlyph` übergeben.
- Sonne-/Wolken-Kästchen, Niederschlagssymbolik, Hazardmarker, Tooltips und gemeinsame Tagesausrichtung bleiben funktional unverändert.
- Eine bestehende Altregression wurde an die typsichere Implementierung angepasst.
- Neue Regression schützt vor einer erneuten Übergabe des ungefilterten Union-Typs.

### Prüfung

- alle 192 automatisch erkannten MID-Regressionstests bestanden
- 198 JavaScript-/MJS-Dateien syntaktisch geprüft
- 68 TypeScript-/TSX-Dateien parsergeprüft
- zusätzliche isolierte TypeScript-Typprüfung für die Union-Eingrenzung bestanden
- Worker syntaktisch geprüft

### Lokaler Produktionsbuild

Ein vollständiges `npm ci && npm run build` war in der isolierten Umgebung nicht möglich, weil benötigte npm-Archive nicht über den internen Paketspiegel bereitgestellt wurden. Der konkret von GitHub gemeldete `TS2322`-Fehler wurde direkt korrigiert und durch eine Typ- und Regressionprüfung abgesichert.

### Worker

- kein funktionaler Worker-Umbau
- Worker nur auf **v0.8.26.9** versionssynchronisiert
