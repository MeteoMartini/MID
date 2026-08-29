# MID v0.9.73.12 – Release-CI-Regressionshotfix nach Run #761

## Anlass

Der Upload des v0.9.73.11-Professional-ZIPs startete den Installer-Run **#761** (Commit `893f9169b5a621be362e00a4a2149fe9315d9adf`). Das Release-Gate verhinderte die Veröffentlichung. Ursache war keine fachliche Regression des Mitteleuropa-Extremwetterpfads, sondern eine historische Quelltextassertion in `scripts/test-dach-extreme-outlook-09660.mjs`.

Der Test verlangte weiterhin wortwörtlich:

`async function dachExtremeOutlookData(profile='full')`

Der produktive Worker besitzt seit der bereits erforderlichen Environment-Verdrahtung korrekt die Signatur:

`async function dachExtremeOutlookData(profile='full',env={})`

Die Router-Aufrufe reichen `env` ebenfalls weiter. Ein Rückbau der Environment-Verdrahtung wäre fachlich falsch. v0.9.73.12 aktualisiert deshalb ausschließlich den historischen Schutztest auf den aktuellen Vertrag. Der Mitteleuropa-Scope, die Gefahrenlogik und die Worker-Fachfunktion bleiben unverändert.

## Einordnung des parallelen RUC-Fehlers

Der planmäßige RUC-Run **#7** lief noch auf dem unveränderten veröffentlichten `mid-stable`-Stand, weil v0.9.73.11 durch das Release-Gate nicht installiert worden war. Er wiederholte deshalb den bereits bekannten Zwischenstandfehler: Temperatur und andere stündliche Zustandsfelder wurden fälschlich gegen `:15/:30/:45`-Zeitpunkte geprüft.

Das v0.9.73.11-Professional-ZIP enthält diesen Fehler bereits nicht mehr. Dort gilt der parameterabhängige Mehrproduktvertrag:

- stündlicher Zustandskern bis +14 h,
- `TOT_PREC` separat im 5-Minuten-Raster bis +6 h,
- Konvektion/Reflektivität/Phase/Strahlungsdiagnostik separat im 15-Minuten-Raster bis +6 h,
- stündliche Spezialdiagnostik separat,
- RUC-EPS weiterhin stündlich.

Damit werden keine künstlichen 15-Minuten-Zwischenwerte für Temperatur, Wind, Druck oder Wolken erzeugt. Erst ein frischer RUC-Lauf **nach** erfolgreicher Release-Aktivierung kann die Produktionsvalidierung dieses Pfads abschließen.

## Release-Gate

Vor `mid-stable` bleiben verbindlich: `npm ci`, Dependency-Audit, TypeScript, Vite-Produktionsbuild, Worker-Syntax, vollständige automatisch erkannte Regressionen sowie die Capacitor-/iOS-Strukturprüfungen. `mid-stable`, Pages und der produktive Worker dürfen bei einem Fehler unverändert bleiben.

## Worker / Kosten

Der Hotfix selbst ändert keine Worker-Fachlogik. Gegenüber dem derzeit veröffentlichten Stable-Stand enthält der Kandidat jedoch weiterhin die noch nicht aktivierte parameter-native RUC-/Worker-Erweiterung aus v0.9.73.11. Nach einem grünen Release-Gate ist deshalb der **normale automatische semantische Worker-Deploy erforderlich**. Kein manueller Worker-Upload, kein R2 und keine kostenpflichtige Infrastruktur sind erforderlich.
