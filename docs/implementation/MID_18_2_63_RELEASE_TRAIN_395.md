# MID 18.2.63 – .395 gebündelte Quellintegration (Stand: Kandidat, keine Produktionsfreigabe)

## Verifizierter Ausgangspunkt
- MID v0.9.85.394, `main=mid-stable` SHA `d3e8446673488dc23d104b86d376c918524fa0be`, fünf aktive Rulesets.
- Letzter vollständiger Installer: GitHub Actions `41284233444` mit Core, Heavy, Worker, Pages, Finalize erfolgreich; 1059 Pflichtregressionen im Baseline-Inventar.
- Neuer Quellbranch `chatgpt/v0.9.85.395-cleanup-display-integrity`; Quelltransfer-Commit `0432a3ec980f21035dcbdc5d960aa13594f4aa86`.
- Herkunft #543 @ `ce1d5b5aa8958c5cb0eb462ad3af94ec0f3692d4` (28 Pfade) und #563 @ `1ccd4fb712b7912d2b64d1ba2cfea8d7cbefe638` (5 Pfade), jeweils vor Integration gegen die Git-Blob-SHAs von Stable abgeglichen; Original-Drafts unverändert.

## Sichere Zusammenfassung
1. Alte `apply-private-analytics`-Direktinstallation und der parallele `mid-code-revision`-Installmodus entfernt, ohne den kanonischen `install-mid.yml`-Pfad anzurühren.
2. Zwei manuelle KNMI-Rolling-/Offset-Smoke-Workflows aus `.github/workflows` und `ci/github/workflows` und zehn stillgelegte KNMI-Archivexperimente entfernt. Vollständige Wiederherstellungs-SHAs verbleiben im Archiv-README. Aktive KNMI Europe/NL-/Aviation-Ketten, Modelladapter und optionaler P4a-Produktivdecoder bleiben geschützt. Kein Nachweis zur deaktivierten P4a-Produktion behauptet.
3. Branch-Cleanup prüft geschützte Branches vor Details, Mindestalter, offene PRs, Abstammung und Dry-Run bleiben erhalten. Keine ungesicherten Branches löschen.
4. Klimafavoritenname, Saisonmetriken und Anzeigepräferenzen aus dem getrennten Design-Draft auf die aktuelle Basis übernommen, einschließlich `false`/0, konkurrierenden Ansichten, Cross-Tab-Subscription, ARIA-Status und bestehendem adversariellem Pflichtregressionstest.
5. Version .395 durch alle von `scripts/sync-version.mjs` beschriebenen Spiegel (inkl. iOS Build 396, Worker-/SW-Cache) konsistent umgesetzt. Keine Nutzerfavoriten, meteorologischen Daten oder amtlichen Warnungen verändert.

## Noch nicht freigegebene Themen
- ICON-D2-RUC Vollgebiet #446 / Draft #561: unversionierter Karten-Quellkandidat; echtes Original-DWD-GRIB/Bitmap/Feld-/Extrem-Audit über drei konsekutive Läufe, <=900 MB Gesamtbudget, Worker/Pages/Browser/Export-Readback und vollständige Produktionskette **vor** Aktivierung erforderlich. Deterministisches ICON-D2 `germany_regular-lat-lon` ist ein anderer Anbieterpfad.
- RUC-Frische #541: 0–6-h-Fast-Lane/P1 168h/P4/P5 noch nicht produktiv freigegeben, keine 60-Minuten-P95-Zusage.
- CI #526, Security #490 und meteorologische Fachissues #374/#434/#509/#510 bleiben eigene geprüfte Änderungs-/Nachweisaufgaben.
- Kein simuliertes Gerät als reale iOS-/VoiceOver-Abnahme oder gemockte Provider-Antwort als Echtdatenqualifikation.

## Obligatorische Freigabe
Draft #564 erst nach vollständig erfolgreichem Source-Gate und nötigen Reviews auf dem exakten neuen HEAD als releasefähig einstufen. Ausschließlich automatisierter SHA-gebundener MID-Quellmerge → serverseitiges ZIP → `install-mid.yml` → Worker-/Pages-/Finalize-Gates → `mid-stable`-Promotion. Bei neuer Parallelversion, Mergekonflikt, Git-/Prüfdrift oder Testausfall fail-closed.
