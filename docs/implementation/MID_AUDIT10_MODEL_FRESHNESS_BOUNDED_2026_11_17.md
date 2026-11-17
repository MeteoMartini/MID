# MID Audit 1.0 – Modellfrische, Quellenbelege und kompakte Metadaten

**17.11.2026 · QA Draft · NO READY / NO MERGE / NO RELEASE**

## Ausgangsbasis und Material
GitHub `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957`, veröffentlichte v0.9.85.486; fünf aktive Branch-Rulesets. Originale `AGENTS.md`, `MID_BASELINE.json`, `MID_SOURCE_OF_TRUTH.md`, `MID_MODEL_SOURCE_CONTRACT.md`, `MID_FORECAST_CONSISTENCY_CONTRACT.md` geprüft. Nutzer-Audit vom 17.11.2026, S. 3: Modelllauf/Initialisierung/Gültigkeit/Abrufzeit nicht mit Skill oder Amtlichkeit verwechseln; S. 4: unabhängige Verifikation statt unzulässiger Qualitätsbehauptung.

## Isolierter und reproduzierbarer Befund
`assessModelFreshness()` in `src/modelFreshnessStatus.ts` verwendete mehrere allokierende Arrays und bewertete fehlende Quellen-Metadaten mit `modelRunFreshness()` zweimal pro unbekanntem Lauf. Der Tooltip/Accessible-Name konnte alle unbekannten Modellnamen auflisten; das ist bei vielen modellierten Quellen unnötig lang. Quellenbelege im eigentlichen Modelllauf-Detail bleiben vollständig vorhanden.

## Korrektur
Ein präziser Scan der tatsächlich verwendeten Quellen (oder nur zulässiger aktiver Fallbacks) behält alle bisherigen Zustands-/Warnschwellen bei. Laufalter wird pro zugelassener Einzelquelle genau einmal ausgewertet, Best Match wird weiterhin nur separat gezählt. Im kompakten Summary bleiben die exakten `current`/`delayed`/`stale`/`unknown`-Summen sichtbar; maximal vier Modellbeispiele werden genannt, übrige Quellen als exakte Restzahl. Lange Namen werden in dieser *zusammenfassenden* Sicht begrenzt, nicht im ausführlichen Detail. Das verhindert unverhältnismäßige Tooltip-/Screenreader-Texte und reduziert unnötige Array- und Datumsauswertungen beim 60-s-Frische-Refresh.

**Nicht verändert:** Meteorologische Vorhersage, Run- und ValidTime-Berechnung, Frischegrenzwerte, WMO/DWD-Warnungen, Farben/CSS, Touchziel (44px), Fusionsgewichte, Verifikation, Widgets/Export, Worker, Release-/Installer-Gates und Versionsspiegel.

## Reproduzierbare Tests
`tests/unit/mid-model-freshness-compact-audit.test.ts`: echte Quellenpriorität, 1-/3-Lauf-Stale-Schwellen, 1.200 unbekannte Quellen/≤600 Zeichen, lange Namen, Best-Match-Aggregat, NoData, Fallback und deterministische Ergebnisse. Bestehende Pflichtregression `scripts/test-model-freshness-pill-0985273.mjs` unverändert ausführen.

**Vertrauensgrenze:** Dies ist ein Performance-/Textumfang-/Datenprovenienz-Quellfix, keine belegte reale INP/FPS-Messung und kein Chromium/WebKit/iOS-/VoiceOver-Gate. Nach selektivem, Blob-SHA-gebundenem LC-Intake: gezielte Regressionen und komplette Core/Heavy/Source/Review/Installer/Worker/Pages/Stable-Abnahme auf dem finalen HEAD. Keine aktivierte Produktionsfreigabe.

## Prüfreferenzen
- WMO Prognoseverifikation: https://community.wmo.int/site/knowledge-hub/programmes-and-initiatives/wmo-integrated-processing-and-prediction-system-wipps/forecast-verifications
- ECMWF Repräsentativität und unabhängige Referenzen: https://www.ecmwf.int/en/elibrary/81173-accounting-representativeness-verification-ensemble-forecasts
- WCAG 2.2 1.4.10 Reflow: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
