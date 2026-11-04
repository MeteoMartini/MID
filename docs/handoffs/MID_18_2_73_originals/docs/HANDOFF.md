# MID 18.2.73 · Koordinierter Codex-/Work-Handoff

**Verbindliche Basis für Erstellung:** Repository `MeteoMartini/MID`, released `v0.9.85.427`, SHA `4d3051f80a17a180c3952c83bf5afa51623b1eb3`, 1.070 Tests, fünf aktive Rulesets. Bei erneutem Work-Start unbedingt LIVE neu prüfen. Bei neuerem Stable: geänderte Dateiblobs und Parallel-PRs neu differenzieren, die Paket-SHA-Sperre **niemals** entfernen, stattdessen aus neuer Basis korrekt portieren. Branch-Schutz, originaler Merge-/ZIP-/Installer-/Stable-Prozess sind verbindlich.

## Auftrag 1 – Codex, GPT-6, **High** (UI-Datenkorrekturen + SYNOP)

Ziel: genau EIN optisches "Modell-Wolkenbild" bei Wolken & Wetter, alle alten `standard`-Renderpfade/Buttons entfernen, transparente Wolken + echte Modellcode-Wettererscheinungen, hochwertige adaptive WMO-ww-inspirierte SVG-Kartenzeichen. Original D2-, RUC-, ICON-EU/Global-Quell- und Bildvalidität bewahren. Nutzerwünsche Isobaren/Isohypsen dauerhaft (`read/writeDurableStorageValue`), bei Missing einzelner Termin **angefordert aber nicht verfügbar** anzeigen; Native D2-v2-Druckfelder korrekt zulassen, Native SIGWX-Konturen wirklich zeichnen. Verifizierter Synoptic-Fallback nur gleicher Modelllauf/Termin.

Ablauf: Frischen autorisierten `codex/v0.9.85.428-*`-Branch nur über erlaubten nicht-bypassenden Schreibweg aus Live-Stable anlegen (oder Versionsnummer auf neuesten echten Stable-Nachfolger abstimmen). Quellblobs gegen Paket vergleichen. Falls alles identisch und Branch-Schutz erfüllt, `apply-combined-visual.mjs --apply <checkout>` als STARTDIFF verwenden. Danach real `tsc`, Vite build, bestehende map/pseudo/cloud/synop/persistence-Tests, neue 33-Codes-/Originaldaten-/fehlende-Kontur-/ECCC-Sonderpfad-Tests. Alte Standardansicht samt nicht mehr benötigten CSS- und Regressionsbezügen bewusst entfernen; kein ungeprüftes `test.skip`. Für ECCC GDPS Original-WMS ohne dekodiertes Originalgitter kein künstliches Pseudo-Satbild oder SYNOP-Marker: konforme separate Daten-/Kartenrepräsentation mit Produktentscheidung. `<button>` Marker und `HtmlMarker.popupHtml` HTML-Escaping Browser/Keyboard/Screenreader testen. `sparseModelWeatherGlyphs` auf 6 Millionen Zellen auf realem kleinen Telefon profilieren, Schutz isolierter Hagel-/Gewitterextreme belegen; bei Bedarf in dedizierten Worker und Block-Max-Pyramide verlagern.

**Abnahme:** 320/390/430/834/1024/1440px, Hell/Dunkel, hoch/quer, lange Modellnamen, 44px Touch, Tastatur/Focus, Reduktion von Animationen, Source/ValidTime/NoData, pseudo-only Web/iOS/Widgets/PNG/SVG/URL. Identische 1–27h Modellgitter und echte d2-Vollgebietsbelege **nicht** aus alten Drafts fingieren. Version-/Changelog-/Contract-Update, gültiges Source-PR-Gate dann SHA-Merge-Releasebot und kompletter Installer erst bei bestandenem Gate.

## Auftrag 2 – Codex, GPT-6, **High** (RUC-Kurzzeit-Warmstart)

Ziel: SHA-verifiziert gesicherte Originalfeld-Bytes bei kurzem Reload wiederverwenden. `01_verified_cache` enthält 20min TTL/24MiB/12MiB pro Objekt/18 Objekte, kein stale fall back. Alle `latest.json`/Run-/Inventory-/Snapshot-Fencing-Gates bleiben **immer frisch**. Live DOM/Index-/Fetch-Trace unter iOS Safari/Chromium belegen, Anzahl/Bytes Cold/Warm gegenüber unverändertem Stable messen; neue Modellrun/SHA-Kollision/Offline-Kaltstart/Cache-Poisoning/abgelaufenes TTL testen.

Integrationspunkt: `src/nativeModelFields.ts::loadNativeField`, optional `src/cloudWeatherData.ts::loadCloudWeatherField` und in RUC-Fast/27h nur bei kompatiblen Manifestpfaden und SHA-Referenzen. `safeFrameUrl` Regex anhand tatsächlichen Release-Manifests verifizieren. Keine rohen aktuellen Wetteransichten als unqualifizierten Offline-Cache speichern, keine Geräteort-/Favoritendaten im immutable Mapcache. CPU/Memory/CacheStorage iOS budgetieren, Request-Dedupe für zeitgleiche Selektionsaufrufe. Worker/Pages/Release-/SLO-Kette vollständig intakt lassen.

## Auftrag 3 – Work, GPT-6, **High** (unabhängige QA / Karten-Design)

Ziel: Professionelle App- und Mobile-UI-Abnahme anhand echter MID-Designreferenzen, nicht bloßer visueller Vermutung. Live-App/PWA, 320/390/430/834/1024/1440, Dark/Light, Quer, 44px, Ersttipper, WCAG 2.2 AA, Fokus und Blocküberdeckung; hochwertige Originalcode-Modellzeichen, Legende, Popups, SVG-/PNG-/Share, Farb- und Ungewissheitssemantik. RUC-Kurzzeit-Reopen messen; 23/25h-Zeittage. Keine Browserchecks als reale iOS-/VoiceOver-Abnahme etikettieren.

`@Product Design` ist in normalem Chat nicht ausführbar; ausschließlich im Work-Modus den Audit starten, visuelle Abweichungen vor weiteren Produktentscheidungen nachweisen. `@PostHog` ist in dieser Sitzung nicht als MID-Produktprojekt nachgewiesen (verbunden ist ein Projekt „Default project“ ohne bestätigte Ingestion); erst nach Identitäts-/Eventnachweis als echte MID-Telemetrie verwenden. `@Context7` für MapLibre/CacheStorage SDK-Feinheiten, `@Firecrawl` für DWD-/WMO-Originallizenzen, `@PR Completion` nur sichere Review/CI-Triage – niemals MID-Releasebot ersetzen.

## Auftrag 4 – Work, GPT-6, **Medium** (adaptive ICON Global-Entscheidung)

DWD GetCapabilities und exakte bereitgestellte Global-Layer/Laufzeiten testen; vorhandenen MID-WMS-Pfad über MapLibre sichtbare Kacheln, deduplizierte Requests und begrenzte Präfetches messen. Weltweite Forecast-Modelldaten erst bei aktiver Weltkarte/außerhalb D2/EU oder expliziter Modellwahl. Nativen Global-GRIB-Pfad nur bei eindeutig nachgewiesenem Mehrwert, originalen icosahedrischen Gitter-/Zeit-/NoData-Kontrakten und freiem Budget freigeben. Open-Meteo-Änderung nach 30.11.2026 aus aktuellen offiziellen Changelogs verifizieren, nicht blind extrapolieren.

## Source-PR/Release-Abnahme (nicht abkürzen)

1. `main` und `mid-stable` identisch verifizieren, ursprüngliches Parent-SHA & alle aktiven PRs/Rulesets prüfen. Unveröffentlichte Arbeit vor Synchronisierung SHA-gebunden sichern.
2. Pro Modul isolierte Tests + Reviewer; einen kompatiblen 2–5-Komplex in einem autorisierten **nicht-Draft** Source-PR mit **neuer** `v0.x.y.z`, synchronen Versionsspiegeln, Dokumentation, Changelog. Kein direktes main/stable.
3. Gesamter Source-PR-Gate auf FINALEN HEAD **vollständig erfolgreich** (Core+Heavy, Browser, Coverage, Security, RUC/Map-Aktivierungsprofile); nur `MID Agent Source Release` darf SHA-gebunden mergen und ZIP aus dem Server erzeugen.
4. `install-mid.yml` Core/Heavy → echte betroffene Worker/Pages/Finalize-Gates → Stable-Promotion → GitHub Stable SHA exakt zu main und öffentlich bestätigter Version / App-Funktion. Nur tatsächliche Erfolgsbelege grün melden.
5. Bei einem konkreten Gatefehler nur diesen mit SHA/Log evidenzbasiert korrigieren und NEUEN Head komplett erneut prüfen. Keine Admin-/Force-/Bypass-Wege, keine neuen Services/Abos ohne ausdrückliche Nutzerfreigabe.
