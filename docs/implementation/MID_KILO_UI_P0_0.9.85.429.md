# MID v0.9.85.429 – Kilo UI-P0 independent release candidate

- Verified Stable parent: `6f08117ed0862c1573fec5c48844136b83e22bd5`, v0.9.85.428.
- Original Kilo provenance: `c68a7778a6a785ed34e8a3dc7da89159d7260c04`, preserved in Draft PR #657 commit ancestry.
- Scope: 52px bottom-tab tap targets and active indicator, 44px favorite/toggle targets, 48px warning status, legible mobile legend, correctly applied left/right safe-area insets.
- The Kilo commit edited generated `src/midPresentation.css`. Its CSS changes are intentionally re-authored into the **last canonical presentation CSS source** (`src/midC48TabletTimeline.css`), preserving the original 340px mobile meteogram height and the existing forecast-meta wrapping rule.
- Generated presentation CSS is kept aligned with the canonical source; `npm run maintain:aggregates` remains authoritative.
- This is a **release candidate only**. Actual browser matrix, keyboard/focus, Light/Dark, first-tap, iOS/VoiceOver and release gating must be evidenced separately. Browser checks alone are not real-device signoff.
- No DWD source/official warning logic or RUC/Worker data semantics are changed.
- Mandatory Source-PR Gate → controlled SHA merge → server ZIP → `install-mid.yml` → Worker/Pages → Stable promotion. No manual merge.

## Zusatzsicherung für den unveränderten Cache-Vertrag

Ein Source-PR-Gate auf dem vorherigen Head meldete sporadisch 32 MiB statt maximal 24 MiB im simulierten CacheStorage. Der Test und Cache waren unverändert gegenüber Stable .428. Die Ursache der sporadischen Runtime-Episode ist nicht abschließend bewiesen. Zusätzlich werden fehlgeschlagene persistente Verdrängungen jetzt explizit erkannt; nach einer fehlgeschlagenen CacheStorage-Schreib-/Evictionsequenz wird ausschließlich der optionale geprüfte RUC-Feldcache gelöscht, statt möglicherweise überzählige Felder zu behalten. RAM/Manifest-/SHA-/Zeitprüfungen bleiben unverändert. Der neue deterministische Negativfall simuliert verweigerte Löschung und prüft den fail-closed-Cache-Fallback. Kein höheres Budget oder geschwächte Regression.
