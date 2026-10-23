# MID parameter display precision contract · v0.9.85.243

## Scope and invariant

This is the normative app-wide presentation contract for cards, charts/tooltips, maps, favorites, widgets and URL/PNG exports. Format after unit conversion. Native source values, calculation precision, thresholds, ranking, intervals, stored/exported machine data and provenance must not be rounded. Missing/non-numeric values stay missing, not zero. Use `src/weatherValueFormat.ts`, shared `wind` and `compactPrecipitationAmount`; common renderers must also serve exports. No blanket change to `formatDecimal`, which also formats coordinates, scores and geometry.

## Scientific boundary

SYNOP FM12 is a reporting code, not a universal forecast UI accuracy standard. Its resolutions must not be described as measurement accuracy, forecast confidence or modern BUFR precision. The matrix distinguishes its established reporting conventions from explicitly chosen MID presentation rules. Preserve source inequalities/ranges; never reconstruct a precise measurement from a coded bin. Legal/official warning text and thresholds retain the published source meaning.

Primary references checked 2026-10-12:
- WMO Manual on Codes, FM12, tables 3590, 3889, 4377 (legacy alphanumeric conventions): https://www.mgm.gov.tr/FILES/resmi-istatistikler/WMO_NO_306.pdf
- ECCC MANOBS, section 15, current official reproduction of SYNOP rules: https://www.canada.ca/en/environment-climate-change/services/weather-manuals-documentation/manobs-surface-observations.html
- DWD SYNOP-derived KX description (temperature/pressure tenths, humidity percent): https://opendata.dwd.de/climate_environment/CDC/observations_germany/climate/subdaily/standard_format/formate_kx.html
- Current WMO binary-code maintenance, including distinction from FM12: https://community.wmo.int/site/knowledge-hub/programmes-and-initiatives/wmo-information-system-wis/about-manual-codes-volume-i2

## Display matrix

| Parameter | Display resolution | Basis |
|---|---|---|
| Temperature, dew point, wet bulb | at most 0.1 °C in detail; whole degrees allowed for compact forecast summaries | FM12 tenths; compact MID rule |
| Favorites temperature range | whole °C; equal displayed endpoints become a single value | explicit MID overview rule |
| Pressure and pressure change | at most 0.1 hPa; chart ticks/contour labels may be whole | FM12 tenths |
| Wind/gusts | whole displayed kt, m/s, km/h or mph, after conversion | FM12 whole native units; converted-unit MID rule |
| Wind direction number | multiples of 10°, normalized 0–350; directional arrows use the native angle | FM12 dekadegrees |
| Precipitation amount | positive <0.1 mm: `<0,1`; <1 mm: 0.1 mm; >=1 mm: whole mm; zero: `0` | FM12 RRR table 3590 inspired display; actual interval retained |
| Precipitation rate | positive <0.1: `<0,1`; <10: at most 0.1 mm/h; >=10: whole | MID rule, not FM12 RRR |
| Snow depth | whole cm; positive sub-centimetre values shown as `<1`, never dry zero | FM12 table 3889 inspired display |
| Snowfall accumulation/rate | at most 0.1 cm below 10; whole above | MID snowfall distinction, not snow depth |
| Visibility | <100 m: `<100 m`; below 1 km: 100 m steps; to 5 km: 0.1 km; above 5 to 30 km: whole km; above 30 to 70 km: 5 km; >70: `>70 km` | FM12 table 4377; lower step at boundaries |
| Humidity, cloud percentage, rain probability | whole %; cloud oktas remain discrete | DWD humidity resolution; MID probability/cloud rule |
| Native map scalar contours and raster Min/Max | same parameter resolution above via shared modelMapValue/weatherValueFormat; labels include selected unit; values and extrema are computed before rounding | derived contours and extrema of the available published raster; no full-domain or time-window-extreme claim |
| Cloud base, freezing/snowfall level, elevation | whole displayed m/ft/hft maximum precision; model-level approximation remains labeled | MID rule; no invented FM12 precision |
| CAPE/CIN, radiation | whole J/kg or W/m² | MID rule |
| UV index | whole, nonnegative | established MID UVI convention |
| Waves, period, marine level, current speed | at most 0.1 of displayed unit; official gauge source retains its reporting unit | MID rule, outside land SYNOP |
| Climate/seasonal anomalies | at most 0.1 K or mm/day; whole % | MID rule; signed anomalies are not precipitation accumulations |

Trailing zeroes are optional; no negative zero. Charts may retain smaller numeric tick spacing for low positive quantities so the axis remains meaningful; this is not a displayed sample precision. Scientific verification scores, coordinates, spatial resolution, weights, timestamps and SVG coordinates are outside this parameter matrix and may need their own meaningful precision.

## Favorites information architecture and sorting

Overview answers the weather/warning situation per favorite and uses compact two-column weather values. Compare answers where the chosen profile fits and uses a single ranked list with emphasized matching hours, an absolute dry time window and explicit criteria. Neither adds a new source or mixes different validity windows.

Default overview sort is `settings`, exactly the incoming settings favorite order. The durable v1 preferences gain a validated `sort` field without replacing other settings. Name, warning priority, maximum temperature ascending/descending, precipitation amount ascending, maximum gust ascending and distance ascending are selectable. Tie order follows settings. Missing/loading/failed/stale metric values are last; do not coerce null to zero. Sorting uses native values. Compare retains its quality-first ranking and shared profile/radius/horizon preferences.

## Regression requirements

Boundary fixtures must cover missing, positive trace, signed temperature, equal displayed range endpoints, unit conversion, visibility steps and lower binning. Favorites checks must cover preference migration, reload persistence, settings order, stable ties, missing/stale last, comparison quality gating and responsive touch/overflow in both themes. Browser emulation does not certify physical iOS/WKWebView/VoiceOver.
