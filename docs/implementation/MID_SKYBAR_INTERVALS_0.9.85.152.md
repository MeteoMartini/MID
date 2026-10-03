# MID v0.9.85.152 · MID-C13

Verified base: main = mid-stable = d6d7e0e5d5f6fb20a0e3dbaaf2351ed93c1857bc (.151). No local work existed. C12 maps, bottom navigation, warning horizons and RUC remain intact.

The screenshot shows a grey first quarter followed by blank low-cloud quarters, while the profile contains yellow intervals. Both strips used the same visual classifier, but the profile averaged finalized quarters into hours first. A cloud transition across 50% can therefore change the base classification. The continuous profile strip now uses the original finalized adjusted intervals and their actual time positions. Temperature and other plots remain hourly; optional hourly squares retain their contract. Direct sunshine duration is distinct from cloud cover: low cloud alone does not guarantee more than 50% sunshine. Genuine low-sunshine intervals can remain without a base band under the existing contract.

ShortTermForecast finite() also converted explicit null/blank quarter or anchor states to zero. It now preserves absence and allows the existing hourly fallback. Real zero values remain valid. No meteorological thresholds, source fields, assimilation weights, workflow or worker logic changed.

Regression test executes the actual bundled forecast and strip generators, checking a grey-to-yellow transition at each quarter in both horizons, null/blank fallback and genuine zeros. Browser verification and full normal release checks apply. Replit read-only provenance request timed out; no unverified Replit changes imported. No empirical calibration changes.

Release only through Source-PR Gate, SHA-bound Agent Source Release, server ZIP, installer/Pages/iOS and stable promotion. Next: verify live .152 and review the original location/time if raw captured data becomes available. Screenshot alone cannot establish the past numerical provider values.

The historical design source-token assertion and in-app explanation were updated for this intentionally changed continuous-strip contract; hourly diagram and square assertions remain.

Validation: npm ci reproducible; npm run verify succeeded (typecheck, production build, all 901 mandatory regressions); npm audit --omit=dev: zero vulnerabilities; worker and proxy syntax valid. Browser QA: 24 viewport/theme/band-square cases at 320/390/412/844/1024/1440 px, real full CSS, no page overflow, shared strip colors/titles and equal axis/strip widths. 390px light screenshot inspected.
