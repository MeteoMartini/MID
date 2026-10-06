# MID-C18 v0.9.85.187

Verified base main=mid-stable=251718eec0e792c4fd47eb59610a1fdaec62157c (.186); parallel .181–.186 changes retained.

## Findings and correction
- CSS used undefined --panel/--line variables with light fallback on dark backgrounds, while foreground inherited dark-theme near-white. .186 high-specificity grid overrides targeted next only. All modes now use canonical --surface/--s2/--text/--muted/--border tokens; icons explicitly retain foreground; buttons wrap in responsive grid.
- WMS point values were absent from the favorites table. On expansion, existing verified weather-map-point endpoint loads each favorite; abort and clear values on source, run, time, level changes. Compact two columns, source/time once; unavailable points remain unknown.
- Browser fixture now imports the full production presentation cascade, not only legacy styles, so theme/grid assertions exercise the real overrides.
- Mixed-to-showery/stratiform conversion previously checked any snow amount before the explicit mixed WMO family, turning Schneeregen into pure snow. Both frontend and Worker preserve mixed codes before amount fallback.
- Upstream computed WeatherCode gives snow priority and does not emit mixed 68/69 from snowfall plus liquid components. Forecast-only mixed inference now requires independent liquid and snow water, each >=0.05 mm and >=10% of the partition, and total-water closure within max(0.1 mm,20%). Neither total precipitation alone nor temperature alone can create mixed snow; observed and explicit freezing/hail/thunder phases remain protected. Frontend and Worker parity is behavioral-tested.
- WMO 66/67 are freezing liquid, 68/69 rain/snow mixture; 83/84 mixed showers. Existing assignment is correct and must not be swapped. No snow inferred merely from temperature or total precipitation. Screenshot warm humid 3–4 C case is covered by shared contradiction check; cold measured/model surfaces <=0.5 C and observations protect hazard. Native wet-bulb overrides approximation; missing moisture remains unknown rather than Number(null)=0.
- Extreme outlook formerly estimated glaze from all precipitation times probability of low wet-bulb temperature, even for pure snow and without freezing-phase evidence. Require explicit 56/57/66/67 diagnostic signal and subtract model snowfall water equivalent using the existing provider 0.7 cm/mm convention. General snow/slush/road freezing remains a distinct phenomenon, not proof of supercooled rain. Glaze equivalent remains an explicitly labelled model indicator, not measured accretion/road temperature.
- Short-range processed outlook cache is intentionally v6 and HTTP request has a phase-schema discriminator, so old false ice signals cannot be reused as fresh/stale after upgrade. Raw source data and extended outlook caching remain unchanged. Three cache-contract tests are updated only for that intentional schema version.
- RUC may only corroborate an existing freezing-phase signal using native liquid water, not total snow water. Routes distinguish actual freezing liquid (glaze hazard) from mixed precipitation (visibility/winter conditions plus separate cold-ground icing check).

## Sources
- DWD ground observation handbook: https://kunden.dwd.de/ankonda/docs/Beobachterhandbuch-Ankonda.pdf
- Open-Meteo WMO/native phase documentation: https://open-meteo.com/en/docs/ecmwf-api
- Upstream WeatherCode implementation: https://github.com/open-meteo/open-meteo/blob/main/Sources/App/Helper/WeatherCode.swift

## Verification
Behavioral regressions: WMO family separation, warm humid screenshot, retained cold surfaces/observations/native wet-bulb, unknown moisture, no ice from snow/mixed precipitation, retained true freezing liquid. Browser matrix extends all six sizes/light/dark to both next and classic, checks color, button geometry and run-bound WMS favorites. Full source and normal release gates remain mandatory.

The module extraction golden is updated only for the two intentionally changed mountain phase adapters (native wet-bulb and surface fields); all other 115 declaration hashes, ordered CSS sources and consolidation fingerprints stay unchanged.
