---
applyTo: "src/**/*.tsx,src/**/*.css"
---

# MID interface and accessibility rules

- Respect the existing shared design system: weather colors, Skybar intensity/cloud coverage, pictograms, typography, display precision, official warning treatment, axis labels and settings in light/dark. Maintain one canonical representation across views, widgets and PNG/URL exports.
- Check minimum phone width (approximately 320px), common phones, tablets portrait/landscape and desktop, including safe areas, long place names, dynamic text, keyboard focus, `prefers-reduced-motion`, touch targets, overflow and popovers.
- Loading/failure states must not hide the last valid map frame prematurely or mislabel its valid time; do not label stale data `aktuell`. Preserve last-used layer, overlays, time format, units, legend and favorites when the corresponding persistence contract requires it.
- For map/radar/satellite, do not visually disguise NoData/coverage boundaries or invent frames; respect real model-run/valid-time transitions. Defer offscreen work when it does not compromise correctness.
- Aim for WCAG 2.2 AA. Report simulator/browser checks separately from actual physical iOS or VoiceOver testing. Avoid making unrelated redesign decisions while fixing a targeted issue.
- Run focused component/contract tests plus actual browser matrix if available; report unavailable WebGL/iOS as `NOT VERIFIED`.
