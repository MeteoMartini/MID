# MID Test Report v0.9.78.39

## Merge-Audit

Der vom Nutzer bereitgestellte Parallel-Chat-Build `MID-professional-replacement(20260904-054958).zip` wurde entpackt und intern als **v0.9.78.34** identifiziert. Der zuletzt im Hauptchat erzeugte Stand war **v0.9.78.38**. Beide Zweige enthielten voneinander abweichende Änderungen.

Die 21 eindeutig zum Parallel-Chat-CodeQL-/Release-Hardening gehörenden Dateien wurden bytegenau in den v0.9.78.38-Hauptstand übernommen. Prüfung: **21/21 vorhanden und bytegleich**. Die Baseline-Schutzlisten wurden als Vereinigung beider Zweige aufgebaut, sodass weder Parallel-Chat-Schutztests noch die späteren Ensemble-/Skybar-Regressionen verloren gehen.

## v0.9.78.39 – fachliche Änderung

Skybar-Niederschlag verwendet nun dieselbe zentrale Niederschlagsart-/Phasenpalette wie die bestehende Forecast-Darstellung:

- Regen/Sprühregen/Schauer: blau (`var(--param-precipitation)`)
- Schnee/Schneeschauer/Schneegriesel: hellblau (`#66bce8`)
- Schneeregen/Mischphase/gefrierender Niederschlag: violett (`#a769d8`)
- Gewitter/Hagel: purpur (`#7869e8`)

Die Dicke bleibt eine reine Intensitätskodierung in den vier Stufen 2,4 / 3,3 / 4,2 / 5,1. Farbe und Dicke tragen damit getrennte Information.

## Erfolgreiche lokale Prüfungen

- `scripts/test-parallel-merge-skybar-phase-097839.mjs`
- `scripts/test-codeql-alert-remediation-097834.mjs`
- `scripts/test-codeql-security-hardening-09601.mjs`
- `scripts/test-worker-auto-deploy-09693.mjs`
- vier Netatmo-OAuth-/PWA-/iOS-Handoff-Regressionen
- WidgetKit- und Keyless-Basemap-Vertrag
- Mitteleuropa-/Compact-Legend-Security-Vertrag
- `scripts/test-weather-profile-skybar-pills-097723.mjs`
- `scripts/test-chart-layout-079.mjs`
- `scripts/test-cloud-profile-structures-09740.mjs`
- Ensemble-Deadline v0.9.78.35
- Mean/Spread-first v0.9.78.36
- Requestbudget/Sonnensymbol v0.9.78.37
- progressiver Ensemble-Bootstrap v0.9.78.32
- die fünf in Release #872 zuvor fehlgeschlagenen PoP-/DWD-/MapLibre-Regressionen
- Release-Lineage
- Release-Uploadbudget
- Worker-/Deploy-Tool-Syntax
- Regression-Continuity: **661 automatisch erkannte Regressionstests**

Zwei zusätzlich angestoßene Extremwettertests konnten lokal ausschließlich wegen des fehlenden Pakets `typescript-strada` nicht gestartet werden. Ein vollständiges lokales `npm ci` wurde versucht, lief in der isolierten Umgebung jedoch in einen Netzwerk-/Transport-Timeout. Das GitHub-Quality-Gate bleibt deshalb die maßgebliche Vollprüfung für TypeScript/Vite und die gesamte Suite.

## Worker

v0.9.78.39 verändert gegenüber v0.9.78.38 keine fachliche Worker-Runtime; nach Normalisierung der Versionskonstante ist der Worker bytegleich. Gegenüber dem Parallel-Chat-v0.9.78.34 ist er hingegen fachlich neuer, weil die Ensemble-Worker-Härtung aus v0.9.78.35 erhalten bleibt.
