# MID Audit 1.5 — Lern-/Archivstatus statt vermeintlicher Systemgüte (2026-11-26)

**P1 / QA DRAFT ONLY — kein Release, keine Änderung an Aktivierungsgates.**

## Provenienz / Scope

Verifiziert vor Arbeit: main = mid-stable = latest v0.9.85.524 @ `0625ec56f042511186c77c271d3122e70b9d90fd`; package, baseline, SOT, Vertragsregistry und AGENTS. Original-Blob forecastVerification.ts `9c6c216f5bc7ec94d6239299e2ac8f3146509aaa`, ForecastVerificationPanel.tsx `05f49bc992eae25964a8377c7609c86b0469154b`. Fünf aktive Rulesets; Production Guard bypass never. #1025/.524 hat #1002 QA selektiv übernommen, #999 bleibt produktiv offen. #905 ändert dieselbe Engine-Datei, jedoch andere Funktionen (Bias); selektiver Hunk-Intake statt Altbaum. #911/#922/#923 sind getrennte Verifikations-QA. Der ursprüngliche Audit-Draft änderte keine Kartendateien, Release-Gates, CI, Kontrakte, package, Secrets oder Berechtigungen. Der Leit-Intake #1028 ergänzt ausdrücklich den Release-Target und die versionierten Release Notes für .525; die Schutzgates bleiben unverändert.

## Befund und Korrektur

Audit-PDF S. 1, 3–4: readiness score 100 bei wenigen Tagen ist keine Vorhersagegenauigkeit. Auch eine reanalysis/model-fallback-Quelle ist keine unabhängige Beobachtung. Der interne diagnostische Score bleibt ein heuristischer Wert; keine Prozentanzeige. Abgeschlossene, kalendarisch valide, unterschiedliche Referenztage ausschließlich über den vorhandenen isIndependentTwinReference-Prädikatsvertrag; heutige, künftige, invalide und doppelte Tage dürfen Abdeckung nicht erhöhen. Fehlende Referenz wird nicht durch Modellrückblick frisch. Quellenliste begrenzt auf sechs eindeutige Labels. Ein heuristischer ready-Status mit offenen Defiziten erscheint nur als Lernstatus. Vergleichstage sind report.days aus der bestehenden gepaarten Auswertung. Quellvertrauen explizit heuristisch. Nichtnegativer beobachteter Kontrollvergleich ist kein statistischer Gleichwertigkeitsnachweis; nur Begründungstext geändert. Activation eligible expression, Lerngewichte, Vorhersagen, Parameter, Warnungen und Persistenz bleiben unverändert.

## Prüfung / technische Grenzen

Lokal Node v22.16.0, tatsächlicher Helper-Blob `22ca38c1abb4c93d072bff7bf2c6dd94a624c844`: 11/11 isolierte Checks bestanden; Tests im Draft zusätzlich als Vitest-Gruppen. Vollständige CI/TypeScript/Browser/iOS noch nicht bestätigt. Kein zusätzlicher Request, Timer, Cache, CSS, Font, Dependency. Ein linearer Referenzscan mit begrenzten Quellenchips und einer Datumsmenge (max. 1100 Archivzeilen); keine Sortierung, kein zusätzlicher Wetterabruf. Kein gemessener Leistungsgewinn behauptet. Abnahme 320/390/430/834/1440px, 200% Zoom, Light/Dark, lange Labels, tastatur-/screenreaderfreundlich, VoiceOver separat. Testdaten ohne personenbezogene Daten. Die wirkliche öffentliche Prognosegüte bleibt getrennt (MAE, Brier, CRPS, n, Lead, Referenznetz, Konfidenzintervall).

Originale Vergleichsquellen: https://www.ecmwf.int/en/research/modelling-and-prediction/forecast-evaluation und https://business.meteoblue.com/weather-forecast-accuracy . OpenRouter-AUTO_BEST_FREE: ausgewählter Particle-1:free Endpunkt; Aufruf lieferte keinen Text (Outputlimit), get_generation 404, Key-Spend readback unverändert 0; **keine verwertbare externe fachliche Antwort und keine bestätigte Einzelgenerationskostenquittung**. Keine Wiederholung, keine privaten Repository-Inhalte übermittelt.

## Leit-Intake

P0 #541 und Release-Gates bleiben zuerst. P1 #999 produktive Reiseaggregation getrennt von diesem P1 Darstellungsfix. Erst auf frisch verifizierter promoted Stable-SHA, unabhängige Review-/Source-Gates und vollständige CI/Browser, dann über den bestehenden Release-Train. Nicht als fertige Veröffentlichung oder wissenschaftliche Güteverbesserung behandeln.

## Regressionserhalt nach erstem Draft-CI

Run 45821093996 / Job 139913225483: bisherige statische Assertion in scripts/test-p1-reference-provenance-0985307.mjs erwartete den alten inline .filter-Ausdruck. Der produktive, unveränderte Messreferenzfilter wird nun als callback an twinArchiveEvidence übergeben. Nur dieser Implementierungsanker wurde angepasst; die originalen positiven/negativen QC-, Regime- und Zeitlückentests bleiben erhalten. Zusätzlich wird der echte per AST extrahierte isIndependentTwinReference-Filter zusammen mit dem transpilierten realen Archivevidence-Helper gegen Mischquellen, mangelnde zeitliche Abdeckung, Reanalyse, Modellrückblick, doppelte, heutige, künftige und ungültige Tage geprüft. Kein Gate übersprungen. Neue CI auf finalem HEAD erforderlich.

OpenRouter-Generationsnachweis inzwischen abrufbar: gen-1795696317-tzDPc4TN3SdHIDJnHDdr, particle-ai/particle-1-20261027:free / Particle AI, total_cost=0 USD, 520 prompt / 1277 completion tokens im Abrechnungsbeleg, finish_reason=length; weiterhin kein Antworttext und keine fachliche Gegenprüfung.
