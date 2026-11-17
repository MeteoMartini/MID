# MID LC 1.12 · 0.9.85.487 – selektiver Full-App-Chromium-Labor-QA-Intake

**QA DRAFT, KEIN RELEASE.** Bei Source-Auswahl `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957`, v0.9.85.486, fünf aktive Rulesets. Leit-Chat-Kandidat [#858](https://github.com/MeteoMartini/MID/pull/858) vorheriger HEAD `07ff745a74322b7096c1aa551ffb37af41e10e54`, alle gezielten, Vitest- und RUC-Evidenz-Draft-Gates auf diesem HEAD **SUCCESS**. Spezial-Design-Draft [#863](https://github.com/MeteoMartini/MID/pull/863) eingefrorener HEAD `9d291622cfa64522d1aec114d7d5fdf3acd8634e`, Vitest sowie targeted regression **SUCCESS**, fünf ausschließlich hinzugefügte Originaldateien, keine Überschneidung.

## Provenienz und Originale

Jeweils verifizierte, vom Ursprung unverändert in den gemeinsamen Git-Tree eingefügte Git-Blobs:

- `docs/implementation/MID_DESIGN16_FULL_APP_FIRST_MAP_CHROMIUM_QA_2026_11_16.md` · `e9cf25aa63eff47ce83c67b51e2f0c39fba7ab78`
- `scripts/compare-mid-full-app-browser-design16.mjs` · `db253146fae31522c5bf86199046f34943b1e035`
- `scripts/lib/design16FullAppProbePolicy.mjs` · `63fff9baffa0d4aa14780e4efc4b5661cff9a6ec`
- `scripts/measure-mid-full-app-browser-design16.mjs` · `eb8b6c7ca68b918e76520f7138e1925c9aa6e278`
- `tests/unit/mid-design16-full-app-browser-evidence.test.ts` · `9623de9c38193f26707ac3116ca9743da5d8cbab`

Alle fünf Quellen sind **QA-Skripte/Unitfälle/Belegbericht**, kein neuer produktiver `src/`-Eintritt, CSS, App-Bundle, Worker, amtliche Warnung, RUC, Versions- oder Release-/Security-Workflow. Bestehende CSS-Risiko-QA #859 und A/B-Paar-QA #860 sind bereits in #858 enthalten und werden nicht dupliziert.

## Aussagekraft und Sperren

Der neue Prüfer verspricht einen vollständigen, SHA-gebundenen realen MID-`dist`-Browserstart mit 390×844, aktiviertem Chromium-Sandboxing, Cold/Warm, FCP, JS-/CSS-Transfer, echten CDP-Touch aufs sichtbare Karten-Ziel und nachgelagert sichtbarem MapLibre-Canvas; Vergleichsreport ist immer **deskriptiv**, lehnt fehlende Zeiten/Identitäten/Pointer/CSS-Files/gleiche Fixture ab und darf nie eine Releasefreigabe erzeugen.

**Bislang KEINE echte MID-Chromium-Gesamtseiten-Performanceabnahme:** Der eigenständige lokale Start scheiterte dokumentiert an `net::ERR_BLOCKED_BY_ADMINISTRATOR` beim localhost-Navigieren. Kein Sandbox-/Sicherheitsbypass, keine externe Browserumgehung, keine erfundene Messreihe. Für echte Geräte-/WebKit-/Memory-/Wetterdaten/20-Zyklen-/PWA-Parität fehlen weiterhin autorisierter Browser, zwei SHA-identisch gebaute MID-Dists, echte Netzwerk-/Datenkonstanz und vollständige Source-/Core-/Heavy-/Review-/ZIP-/Installer-/Worker-/Pages-/Stable-Gates.

Vorherige Draft-SUCCESS-Resultate von #858 und #863 sind **keine** neue kombinierte CI für den Intake-Commit; diese muss auf dessen exaktem HEAD nachgewiesen werden. Der neue Lab-Prüfer darf niemals "CSS-/JS-Heap gefixt" oder "Performancegewinn bewiesen" behaupten. #740/#839 Release-Sicherheits-Spezialarbeit ist ausgenommen und wird weder verändert noch übergangen.
