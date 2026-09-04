# MID Test Report 0.9.78.51

## Erfolgreich
- `node scripts/test-warning-hybrid-probabilistic-097850.mjs` ✅
- `node scripts/test-warning-hybrid-uncertainty-097849.mjs` ✅
- `node scripts/test-wind-kt-display-contract-097851.mjs` ✅
- Maintenance-Aggregate neu erzeugt ✅

## Geprüfter Vertrag
- Sichtbare MID-Knotenwerte: `kt`.
- Interner/API-Schlüssel `kn` bleibt erlaubt, erscheint aber nicht als MID-Einheitenlabel.
- Amtliche Originalwarntexte bleiben unverändert und dürfen quellenseitig `kn` enthalten.
- Separate MID-Zusammenfassungen amtlicher Werte verwenden `kt`.

## Build-Hinweis
Der vollständige Frontend-Build ist in dieser Arbeitsumgebung weiterhin nicht ausführbar, weil die bereitgestellte Quelle keine installierten `node_modules` enthält. Die geänderten Warn-/Einheitenverträge wurden mit den gezielten Quellregressionen geprüft.
