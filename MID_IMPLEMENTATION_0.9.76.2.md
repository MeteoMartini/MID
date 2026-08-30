# MID v0.9.76.2 – TypeScript-7 Strict-Build-Hotfix

## Anlass

Der reale GitHub-Installerlauf #776 für v0.9.76.1 hat `npm ci` und den Dependency-Audit erfolgreich abgeschlossen und anschließend mit dem echten TypeScript 7.0.2 den `tsc --noEmit`-Gate erreicht. Dort wurden vier reine Strict-Compilerfehler sichtbar, die in der lokal unvollständigen Paketumgebung zuvor nicht zuverlässig geprüft werden konnten.

## Korrekturen

- `src/ForecastCockpit.tsx`: `Intl.DateTimeFormat` verwendet nun korrekt `timeZone: timezone` statt der nicht existierenden Variable `timeZone`.
- `src/Px250Source.ts`: nicht mehr verwendeter `MID_VERSION`-Import entfernt.
- `src/pushNotifications.ts`: nach der UI-Interna-Bereinigung nicht mehr ausgewertete `statusError`-Variable samt Zuweisungen entfernt; Nutzerstatuslogik bleibt unverändert.
- `src/workerClient.ts`: nicht mehr verwendete `blocked`-Hilfsvariable entfernt.

## Unveränderte Verträge

- TypeScript bleibt exakt 7.0.2; kein Downgrade.
- Gemeinsamer React/Vite-/Worker-Fachkern für Browser/PWA/iOS bleibt erhalten.
- Kein iOS-Fork.
- 24-h-Profil mit kanonischen Tmin/Tmax-Markern bleibt unverändert.
- Modellstand-Transparenz und Komposit-Referenzlayer bleiben unverändert.
- RUC-`:11/:41`-Vertrag und Watchdog-Quellvorbereitung bleiben unverändert.
- Automatische semantische Worker-Erkennung bleibt maßgeblich; kein manueller Worker-Upload.

## Release-Gate

Der nächste GitHub-Installerlauf muss `npm ci -> TypeScript 7.0.2 -> Vite -> vollständige Regression -> cap copy ios` vollständig grün bestätigen.
