# MID v0.9.78.36

## Ziel
Nach der Anti-Hang-Härtung aus v0.9.78.35 wird der Erststart der 14-Tage-Ensembledaten auf iPhone/iOS weiter entlastet. Ein sichtbarer Ensembletrend darf nicht davon abhängen, dass sofort mehrere sehr große Multi-Member-Datensätze parallel geladen und verarbeitet werden.

## Ursache der verbleibenden Fragilität
Der progressive Bootstrap startete bislang Mean/Spread- und vollständige Memberpfade parallel. Jeder Pfad durfte wiederum mehrere Modellfamilien gleichzeitig abrufen. Das war fachlich redundant und auf mobilen Verbindungen unnötig teuer. Open-Meteo stellt Mean/Spread gerade als kompakte, direkt aus den Ensemblemitgliedern berechnete Darstellung bereit; deshalb eignet sich dieser Pfad als primäre schnelle Verfügbarkeitsbasis.

## Umsetzung
- `loadEnsembleUnits` erhält eine optionale Parallelitätsgrenze. Der Bootstrap verwendet ausdrücklich `concurrency=1`.
- Der Schnellstart akzeptiert vorläufig bereits **eine echte Ensemblefamilie** (Mean/Spread oder Member), während die finale Fusion unverändert mindestens zwei unabhängige Modellgruppen verlangt.
- Mean/Spread wird zuerst geladen. Nur wenn diese Route schnell ohne Ergebnis endet, wird ein einzelner Memberlauf als Fallback versucht. Der bisherige parallele `Promise.any`-Fan-out entfällt.
- Schlägt der Vordergrund-Schnellstart vollständig fehl, startet MID nicht unmittelbar einen großen Acht-Modell-Abruf auf dem iPhone. Stattdessen wird ein klarer Fehlerzustand ausgelöst und über den vorhandenen Retrypfad erneut versucht.
- Nach erfolgreichem vorläufigem Bootstrap bleibt `ensLoading` bis zum automatisch nach 12 s gestarteten Vollabgleich aktiv. Die Cockpit-UI zeigt dadurch korrekt, dass weitere Modellläufe ergänzt werden.
- Die Konsistenzwertung behandelt eine einzelne Modellfamilie nicht mehr wie eine vollständige Mehrmodellbasis (`safeMaxModels >= 2`).

## Unverändert
- Der finale Mehrmodellvertrag bleibt strikt: reguläre Aggregation benötigt weiterhin mindestens zwei unabhängige Modellgruppen.
- Caches, Memberauswertung, Szenariocluster und die vollständige Normal-/Background-Fusion bleiben erhalten.
- Die v0.9.78.35-Deadlines, Watchdogs und Worker-AIFS-Feldkorrektur bleiben vollständig aktiv.

- Die Release-Synchronisierung hält nun zusätzlich das ältere `MID_BASELINE.json.version`-Feld gemeinsam mit `releaseVersion` aktuell, damit Diagnosen keine widersprüchlichen Baseline-Versionen mehr anzeigen.

## Regression
Neu: `scripts/test-ensemble-fast-availability-097836.mjs`.
