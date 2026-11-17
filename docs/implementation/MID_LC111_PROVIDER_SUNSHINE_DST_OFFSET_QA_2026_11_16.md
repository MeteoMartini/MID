# MID LC 1.11 · #428 – Provider-UTC-Offset in Sonnenintervallen und Tageszeit (QA-Draft, 16.11.2026)

## Gesicherte Quelle und Scope
- Source of Truth: `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957`, veröffentlichte v0.9.85.486, fünf aktive Rulesets.
- Neue isolierte Arbeit ausschließlich für den offenen Rest von [#428](https://github.com/MeteoMartini/MID/issues/428). Keine Übernahme oder Änderung der Spezial-Chats, RUC-, Worker-, Warn-, Karten-, Security- oder Releasepfade.
- Quellenvertrag: Open-Meteo ISO8601 verwendet den über die gesamte Antwort fixierten `utc_offset_seconds`. Nur echte Ortsdarstellung verwendet IANA bei DST; echte Provider-0 ist gültig, fehlende Offsetmetadaten sind nicht 0. https://open-meteo.com/en/docs/ensemble-api

## Reproduzierbarer Quellbefund
`minutelySunshineValuesForHour` verwendete `Number(w.utc_offset_seconds)||0`; bei fehlendem/ungültigem Offset wurden unbekannte ISO-Zeiten fälschlich als UTC behandelt. Dies konnte vier 15-min-Sonnenintervalle einem ungesicherten Stundenendwert zuordnen. Die beiden Tages-Hilfsstellen `weatherDaylightSeconds` und `leadHours` verwendeten ebenfalls diesen stillen UTC-Fallback statt des bereits vorhandenen `providerIsoEpoch`-Vertrags. Kein produktiver Einzelpayload oder tatsächlicher Häufigkeitsnachweis.

## Enge Korrektur im QA-Kandidaten
- Roh-15-Minuten-Sonnenscheindauer überschreibt den bekannten Stundenwert nur bei endlichem bestätigtem Anbieteroffset. Bei fehlendem Offset: leere Viertelstundenliste, niemals Nullwert, erfundener UTC-Zeitpunkt oder künstliche Akkumulation. Gültiger Offset 0 bleibt vollständig erlaubt.
- Tagesnoon und Vorlauf werden mit dem vorhandenen gemeinsamen `providerIsoEpoch` interpretiert: expliziter Offset oder belegter Provider-Fixoffset vorrangig, alter IANA-Cachepfad nur nach bestehendem Parservertrag. Keine Änderung an Niederschlags-Endstempeln, Anbieter-Requestparametern, Ensemblefeldern, Sonnen-/WMO-/DWD-Schwellen.
- `src/weather-src/20-mapping-day-character.tsfrag` und generiertes `src/weather.ts` enthalten exakt dieselbe Änderung; registrierte Pflichtregression `scripts/test-provider-fixed-offset-0985318.mjs` erweitert mit positiven 4×900s, UTC-0 und negativen Missing/null/NaN/Infinity/String-Szenarien plus Mirror-Abgleich.

## Freigabegrenzen
Kein Versions-Build, keine produktiven Daten, keine Freigabe, kein Merge/ZIP/Installer/Worker/Pages/Stable. Draft-CI auf aktuellem HEAD separat abwarten und echte Wetter-/DST-/NoData-/Browsermatrix abnehmen. Erst danach ggf. selektive Übernahme in einen eigenständigen versionierten LC-Train. Alle vollständigen MID-Gates bleiben bindend. #740 bleibt außerhalb dieses PRs.
