# MID v0.9.67.11 – RUC/RUC-EPS + KONRAD3D/Meso

## Umsetzung
- P0: ICON-D2-RUC kalibriert appweit den zentralen kanonischen 0–14-h-Fusionspfad innerhalb des ICON-D2-Gebiets, ohne eine zweite DWD-Modellfamilienstimme zu erzeugen.
- P0: ICON-D2-RUC-EPS ist als priorisierter kurzfristiger DWD-EPS-Adapter eingebunden; bei Nichtverfügbarkeit fällt MID auf ICON-D2-EPS zurück. Beide Varianten bleiben in derselben DWD-Ensemblefamilie und werden nicht doppelt gewichtet.
- P1: KONRAD3D/Mesozyklonen ergänzen die beobachtungsnahe Kurzfristkorrektur für relevante nahe bzw. stationäre konvektive Zellen. Die bestehende MID-Regel „Gewitter erst bei beobachtetem Blitz“ bleibt erhalten.
- P1 Extremwetter: Der Mitteleuropa-/ICON-D2-Extremwetterausblick nutzt für 0–6 h einen regional kurz gecachten KONRAD3D-/Meso-Snapshot. Es erfolgt kein Objektabruf je Extremwetter-Rasterpunkt.
- Workerlastschutz: bereits dekodierte optionale RUC-/RUC-EPS-Punktadapter, 5-min Edgecache, regionaler KONRAD-Snapshot, keine GRIB-/BUFR-Decodierung im Cloudflare-Worker und kein zusätzlicher KONRAD/Meso-Browserabruf beim Direktfallback.
- Best Match bleibt die kohärente Prognosebasis; RUC darf nur im räumlichen und zeitlichen RUC-Vertrag darüber kalibrieren.

## Appweite Einbindung
- Kanonische Stunden-/Kurzfristfusion für die von RUC gelieferten meteorologischen Reihen.
- Kurzfristige Niederschlagswahrscheinlichkeit über RUC-EPS, soweit der Punktadapter verfügbar ist.
- Event-/Kurzfrist-Ensemble priorisiert RUC-EPS vor ICON-D2-EPS, ohne normale 7-/14-Tage-Ensembles mit unnötigen Rapid-Update-Aufrufen zu belasten.
- Forecast-Cockpit, Standardansicht und nachgelagerte Module bleiben auf den kanonischen MID-Stundenserien und profitieren dadurch ohne eigene Parallelfusion.
- Extremwetterausblick erhält zusätzlich P1-Beobachtungsbestätigung für 0–6 h.

## Konfiguration / Fallback
- Optionaler deterministischer Adapter: `MID_DWD_RUC_POINT_ENDPOINT` / `MID_DWD_RUC_POINT_TOKEN`.
- Optionaler Ensembleadapter: `MID_DWD_RUC_EPS_POINT_ENDPOINT` / `MID_DWD_RUC_EPS_POINT_TOKEN`.
- Sind die Adapter nicht konfiguriert oder temporär nicht verfügbar, bleibt MID voll funktionsfähig und fällt auf die bestehenden Best-Match-/ICON-D2-/ICON-D2-EPS-Pfade zurück.

## Regression / Freigabe
- 555 vorhandene `scripts/test-*.mjs` wurden parallel ausgeführt.
- 553/555 laufen lokal grün.
- Ausschließlich `test-extreme-outlook-modelled-areas-096618.mjs` und `test-extreme-regions-flight-null-096619.mjs` können lokal nicht starten, weil `esbuild` in der aktuellen Runtime nicht installiert ist (`ERR_MODULE_NOT_FOUND`). Es liegt bei diesen beiden Tests kein fachlicher Assertion-Fehler vor.
- Der zuvor lokal problematische Travel-/NOAA-OISST-Test läuft nach Wiederherstellung des fehlenden lokalen `.bin/tsc`-Prüflinks grün; dieser temporäre Link wird nicht ausgeliefert.
- Direkt aus dem entpackten Release-ZIP werden zusätzlich RUC/RUC-EPS, Rapid-Update, Ensemble, Best-Match-Basis, ICON-D2-Gebiet, Extremwetter-Resilienz, iOS-Safe-Area, Dependency-/Actions-, Aggregate-/Versions- und Worker-Syntaxverträge geprüft.
- Der GitHub-Installer führt mit regulärem `npm ci` anschließend TypeScript, Vite-Production-Build und die komplette Regression einschließlich der beiden `esbuild`-Tests aus.

## Worker-Release
Worker-Upload **erforderlich**, da Forecast-Fusion, RUC-EPS und KONRAD3D-/Meso-Pfade im Worker geändert sind.
