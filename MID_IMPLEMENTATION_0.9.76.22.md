# MID v0.9.76.22 – CI-Vertragshotfix nach Release-Run #795

## Anlass
Der Release-Run #795 für v0.9.76.21 bestand ZIP-Validierung, reproduzierbares npm ci, Produktions-Dependency-Audit (0 bekannte hohe Risiken), TypeScript 7.0.2 und Vite 6.4.3. Erst vier statische Regressionserwartungen brachen ab; Commit, Worker, Pages und Stable-Promotion wurden dadurch korrekt übersprungen.

## Korrektur
- `test-cloud-profile-structures-09740.mjs` prüft die aktuelle `cloudCellGeometry` und deren `cloudBand.x`/`cloudBand.width` statt der früheren randberührenden Rechteckgeometrie.
- `test-logo-cloud-profile-09739.mjs` schützt dieselbe kollisionsfreie Wolkenbandgeometrie bei erhaltener Intensitäts-/Opacity-Darstellung.
- `test-learning-scenarios-mountain-zones-071110.mjs` schützt die Resume-sichere Szenarioübernahme: leere transiente Teilantworten überschreiben den letzten erfolgreichen Szenariostand nicht.
- `test-pages-codeload-resilience-09580.mjs` schützt die neue Release-Finalisierung mit `MID / release-candidate-quality`, Vorfahrprüfung und normalem Fast-Forward-Push nach `mid-stable`; der alte Force-Push-Vertrag ist ausdrücklich verboten.

## Produktwirkung
Keine Produktlogik wurde zurückgesetzt oder eingeschränkt. Die v0.9.76.21-Änderungen an 24-h-Profil, DWD-Ortspin, Windwarnfarben, getrenntem Medien-/Code-Budget, Theme-Logo-Preload und Stable-Härtung bleiben unverändert.

## Worker
Keine fachliche Worker-Änderung. Nur die zentrale Releaseversion wird synchronisiert; manueller Worker-Upload ist nicht erforderlich.
