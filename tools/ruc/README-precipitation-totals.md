# ICON-D2 precipitation totals for MID v0.9.85.134

The maps workspace integrates Replit's UI handoff `54a16f4c1aef264f4416db667a0217039075818b` on stable `33cae56be8740c7bae3fed3754f6d4467c7655a4`. It preserves the v0.9.85.131–.133 timeline and precipitation corrections.

`build_precipitation_totals.py` reads the direct DWD ICON-D2 **regular lat/lon** `TOT_PREC` GRIB2 product, not a point API or a RUC extrapolation. It selects the newest complete 3-hour cycle and checks init, validity, accumulation interval, parameter, units, grid geometry, identical coordinates, finite values and cumulative resets. Four cumulative end fields at T+6/12/24/48 minus the same cycle's T+0 give the requested windows; intervening hourly fields are not required for this accumulated parameter. All totals include the water equivalent of solid precipitation.

The Germany bounding rectangle is sampled at the DWD regular-grid resolution. It includes parts of neighboring countries; the reported maximum is explicitly the **map rectangle maximum**, not a Germany-only maximum. Favorite values use the nearest regular-grid point, not an interpolated point forecast. Values are quantized to 0.1 mm; map pixels are resampled only for display in Mercator. The product does not claim that the regular-grid remapping is the native ICON triangular grid.

`prepare_ruc_pages.py` orchestrates this independent product through the already established free DWD workflow. Its immutable JSON object joins the existing SHA256/size-checked Pages manifest, so the RUC publisher and release installer preserve it. ICON-D2 unavailability leaves the map unavailable and must not interrupt canonical RUC publication. The client rejects runs older than 24 hours, incomplete grids, mismatched valid times and maxima. Exports remain disabled without a validated frame.

## Sources and licenses

- GRIBs: <https://opendata.dwd.de/weather/nwp/icon-d2/grib/>. DWD Open Data, CC BY 4.0; source and processing attribution are included in UI and exports. Compressed input SHA256 and source URLs are retained in the product.
- Basemap: OpenStreetMap, ODbL 1.0, <https://www.openstreetmap.org/copyright>. Exports do not copy OSM tiles.
- Export/map country outline: the Germany feature from Natural Earth `ne_50m_admin_0_countries.geojson`, <https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_0_countries.geojson>. Bundled snapshot: `src/precipitationGermany.json`. Public Domain, <https://www.naturalearthdata.com/about/terms-of-use/>. This is a generalized national outline, not BKG VG250 federal-state geometry.
- Bright Sky is a free, keyless DWD API, but is not used as a substitute for full ICON-D2 GRIB raster fields. No blanket unlimited-service guarantee is made. No new paid provider or API key was introduced.

## Validation

- Live DWD 2026-10-01 09 UTC cycle: 410 × 505 Germany rectangle, genuine 6/12/24/48-hour fields, approximately 2.2 MB JSON.
- `npm run verify`: production build, worker syntax and all 893 automatically discovered regressions pass.
- Python cumulative difference/reset tests, live GRIB validity check, manifest-preservation and snapshot-restore checks pass.
- Production-rendered preview: iPhone portrait, Android phone, iPad/tablet, desktop and phone landscape; no horizontal overflow or JavaScript exception; SVG and PNG downloads tested and visually inspected.
- Source-PR Gate, external release bot, installer, Pages/Worker/iOS checks and stable promotion remain the mandatory publication path. These results do not by themselves assert a deployed release.
