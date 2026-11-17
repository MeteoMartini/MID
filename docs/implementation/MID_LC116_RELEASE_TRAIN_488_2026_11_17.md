# MID LC 1.16 · v0.9.85.488 – Quelle und QA

17.11.2026 · Source-Release-Kandidat, keine vorweggenommene Freigabe.

- Stable/main: `ee70a92ae6ed83d3fa46445f4941e3db8b8675d4`, v0.9.85.487; fünf aktive Branch-Rulesets.
- Wissenschaftlicher Spezial-PR #897: `e5830085739252d2bc7e4a40b88d2abe39e883df`; exakt fünf originale SHA-identische Git-Blobs, keine Herkunft aus veralteter .486-Basis. Missing Data bleibt NoData; echte Extremwerte werden nicht geglättet.
- Responsiver Spezial-PR #893: `c25c205844c29d1fb1bb2074be660332de2db10a`; vier originale SHA-identische Git-Blobs, Quellbestand zwischen .486 und .487 unverändert.
- Keine Änderungen an WMO/DWD-Amtwarnungen, Datenquellen, Rohwerten, Modellläufen, RUC, Release-Governance, iOS-Binarys oder Secrets.
- Unabhängige Einzel-CI: #897 `44114471352` success; #893 `44102613813` success. Diese gelten nicht als Combined Source-/Core-/Heavy-Release-Abnahme.
- Nicht in diesen Train integriert: #868/#889 (Karten/echte Browser-/Originaldaten-Gates), #892 (überlappender `forecastVerification.ts`-Edit), #896 (fehlgeschlagene Testprüfung), #891 (noch nicht produktiv angebundene Fokus-Policy), #867 (AI-Router kein Deploy), #839/#740 (eigener Security-Cutover).
- Einmaliges versioniertes Releaseziel `0.9.85.487 → 0.9.85.488` wird ausschließlich über den bestehenden `prepare-release-repository.mjs`/ `sync-version.mjs` vor dem tatsächlichen Build abgewickelt. Keine direkte Protected-Branch-Schreiboperation.
- Vor Release zwingend: Combined Vitest/V8/Regressions, Source-/Core-/Heavy-/Review-/Security-Gates und installer-/worker-/pages-/stable-SHA-Readback. Browser-, WebKit- und echte iOS-/VoiceOver-Nachweise getrennt bezeichnen.
