# Alpine snow FSC/GFSC – read-only qualification, 02.11.2026

**Origin:** verified MID v0.9.85.411 Stable SHA `9bf44c3354f98937fa058aac5d6dceb5895d29e5`. Candidate version .412 is not released.

## Exact official source semantics
- FSC Europe 20 m Daily V2 (BYOC `2bb9974a-0eb8-484d-adf1-20cc307021b6`): **FSCOG** is on-ground snow fraction; **FSCTOC** is top-of-canopy fraction. Corresponding distinct QA rasters, raw `QAFLAGS`, `CLD` cloud/shadow mask. Sentinel-2 optical observations, not snow depth.
- GFSC Europe 60 m Daily V1 (BYOC `0b5265f5-3664-44c2-96ab-e91aba67b0c3`): `GF`, `GF_QA`, `QAFLAGS`. Daily mosaic using available Sentinel-1/2 acquisitions over the preceding seven days; **product date is not per-pixel acquisition time**.
- Fraction 0–100 is percent; 205 cloud/cloud shadow, 210 inland water; anything else is not automatically snow-free. Quality classes 0 high, 1 medium, 2 low, 3 minimal. Original quality flags and cloud flags are carried raw, **their individual bits are deliberately not interpreted or smoothed before a current official bitmask verification**.
- A true 0% snow fraction is observed snow-free. NoData/water/cloud/unknown QA is **missing**, never 0 or a negative. This surface property is NOT snow height, fresh snowfall, snow-water equivalent or a forecast.
- `src/copernicusSnowObservation.ts` is a strict, side-effect-free boundary; `tests/unit/copernicus-snow-observation.test.ts` covers nominal, cloud, water, missing, source day, seven-day window, unsigned type and SHA. `productionApproved=false` is immutable. No API requests or user-visible map are activated.

## Still blocking operational coverage (fail closed)
1. CDSE data delivery/migration: Copernicus product page explicitly cautions that tile upload is ongoing until November 2026. Verify real dated Alpine tile metadata **and actual COG pixel bytes**, not just collection existence.
2. Authentication/API quota: Sentinel Hub BYOC Process API uses collectionId, separately authorized tokens and product-specific evalscript; no unapproved paid account or public token in client. Confirm free allowance/licence and server-side caching/budgets.
3. Provenance: per-tile source SHA, capture date, EPSG/UTM zone, spatial extent, source quality bands, scale, NoData, original provenance/time, cache/expiry and at least 3 distinct days/regions. No made-up time-of-pixel observation in GFSC.
4. Raster QA: check mask bytes and bitwise QAFLAG/CLD from product manual v1.3 (15.09.2026); water, forests, clouds, edges, daylight/night & snow-albedo cases, reproject categorical masks by nearest-neighbor. Missing is transparent and never 0.
5. Scientifically separate layers: 'Satelliten-Schneebedeckung (%)' (FSC on-ground/canopy or GFSC), 'Schneehöhe (cm)' (GeoSphere station or analysed SNOWGRID), 'Neuschnee (cm)' (forecast with interval); QA, source day and GFSC up-to-seven-day history in legend and location probe.
6. Web, iOS/WebView, responsive 320–1920px, keyboard/screen reader, source/event matrix, frame/latest-cache, zoom/export/widget tested on actual app; no promotion until full MID Source-PR/CI/installer gates.

Official upstream: https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Data/clms/bio-geophysical-parameters/snow/snow-cover-extent/clms_wsi_fractional-snow-cover_europe_utm_20m_daily_v2.html
GFSC: https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Data/clms/bio-geophysical-parameters/snow/snow-cover-extent/clms_wsi_gap-filled-fractional-snow-cover_europe_utm_60m_daily_v1.html
Tile migration: https://land.copernicus.eu/en/products/snow/fractional-snow-cover

## Budget- und Sicherheitsentscheidung
Die offizielle Copernicus Data Space Quotenübersicht nennt für allgemeine Nutzer derzeit 10.000 Sentinel-Hub-Anfragen und 10.000 Processing Units monatlich, u. a. 300 Requests/min und 300 PU/min. Das ist **keine garantierte Freigabe für dieses MID-Konto**. BYOC-Evalscripts/Statistical- und Process-API können Processing Units verbrauchen; daher KEINE pro-Browserpixel- oder unkontrollierte Tile-Request-Auslieferung. Stattdessen nach Quoten-/Lizenzprüfung eine begrenzte serverseitige Batch-/Cache-Pipeline mit ETag/Quell-SHA, echten Kachel-Missing-Flags und begrenztem Speicher.

Offizielle Quellen: https://documentation.dataspace.copernicus.eu/Quotas.html und https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Overview/ProcessingUnit.html

**Sicherheitsnachschärfung:** Numerisch plausible Werte heißen im Decoder bewusst `candidate-unverified-qa-flags`, da die Bits von `QAFLAGS`/`CLD` noch nicht vollständig amtlich qualifiziert sind. `qaFlagsDecoded=false` und `productionApproved=false` machen dies maschinenlesbar. Kein Consumer darf solche Kandidaten als nachgewiesene Live-Schneebedeckung darstellen.
