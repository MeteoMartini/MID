# MID LC 1.11 · .487 disjunkter Source-Intake (QA-DRAFT, 2026-11-16)

## Live Source of Truth
- `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957` / veröffentlichte `v0.9.85.486`; `AGENTS.md`, `MID_SOURCE_OF_TRUTH.md`, `MID_BASELINE.json`, `MID_CHATGPT_GITHUB_CONTRACT.md`, `contracts/index.json` und Forecast-Intervallvertrag erneut geprüft; fünf aktive GitHub-Rulesets. Keine Direktwrites an main/stable.
- Koordinierte Ursprünge: [#854](https://github.com/MeteoMartini/MID/pull/854) @ `897ccbb90aa06926ab7b7245f2d370dd19e74c9c` mit 48 Pfaden, Tree `f24613764d31aed95ae6856fd0556b277421a5ce` und versionierten .487-Spiegeln; [#857](https://github.com/MeteoMartini/MID/pull/857) @ `204aad6bb1c0745a388d751814cccc2cb40d38a0` mit exakt vier Pfaden. Compare gegen dieselbe Stable-Basis: beide ahead, 0 behind; Intersection leer.

## Ausgewählter Import / Abgrenzung
- #854s vollständiger Git-Tree als Ausgangsbaum. Alle bisherigen Karten-/Umfeld-/Flaggen-/IR-/JS-Änderungen, Versionsspiegel und Verträge werden bewahrt.
- Aus #857 exakt `docs/implementation/MID_LC111_PROVIDER_SUNSHINE_DST_OFFSET_QA_2026_11_16.md`, `scripts/test-provider-fixed-offset-0985318.mjs`, `src/weather-src/20-mapping-day-character.tsfrag`, `src/weather.ts` als unveränderte Git-Blobs importiert. Gegenprobe: Das normative Fragment kommt exakt in der generierten Produktionswetterquelle vor; kein individueller Bestand aus PR #854 wurde überschrieben.
- Release Notes, User-Bullet, interne Changelog-Zeile und Source-of-Truth-Vorwort nehmen diesen zusätzlichen Kandidaten auf, ohne zusätzliche Versionsanhebung oder CI-/Worker-/Warnungs-/Governance-Änderung.
- Fachvertrag: Open-Meteo ISO-Endstempel + einmalig aufgelöster Fixed-Offset; kein UTC+0 aus fehlenden Metadaten. Fehlende Sonnenscheinintervalle niemals als gemessene Null; 0s echter Offset bleibt gültig. Keine Änderung an PoP/Phase/Radar, WMO/DWD-Warnungen oder RUC-Originaldaten.
- **Explizit nicht im Intake:** Spezial-#855 (zur Zeit aktiv veränderter HEAD), Spezial-#856 (gemeinsame `src/CurrentSurroundings.tsx`, nur nach selektivem Patch-Abgleich); Issue #740/PR #839 (Release-Sicherheit). Auch alte bereits in #854 enthaltene #848/#850/#851/#852 werden nicht doppelt integriert.

## QA-/Freigabegrenzen
- Einzel-Draft-CIs #854 und #857 erfolgreich, beweisen nicht die Kombination. Der neue kombinierte HEAD benötigt mindestens tatsächliche gezielte und Vitest-CI, danach unabhängige Browsermatrix 320/390/430/834/1440px Light/Dark, NoData/Run/UTC-Prüfungen, CPU/Memory und Versions-/Mirror-QA; echte iOS-/VoiceOver-Nachweise getrennt.
- Kein Auto-Ready/Auto-Release. Nur regulärer Source-PR-Gate → kontrollierter SHA-Merge → serverseitiges Release-ZIP → `install-mid.yml` → Worker-/Pages-Gates → Stable-Promotion. Ohne vollständige echte Belege und unabhängige Reviewprüfung bleiben alle diese Schritte blockiert.
