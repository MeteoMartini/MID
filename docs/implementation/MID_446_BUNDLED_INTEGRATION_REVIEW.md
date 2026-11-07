# MID v0.9.85.446 – gebündelter Integrations-Draft (noch kein Build/Release)

**Source of Truth:** `main=mid-stable=b6526e7c5c24035bd1a75b87b77e7bb8e821c334` · `v0.9.85.445`. Exakter bislang nicht veröffentlichter Basistree `d4684d23661833f3df63edd22b07e022e35265a8`.

## SHA-sichere Komponenten

- PR [#700](https://github.com/MeteoMartini/MID/pull/700): `b2fbd0b1031dd26e38a867c4bd67ebebfb78a54c` · 8 Originaldateipfade, als unveränderte Git-Blobs kopiert
- PR [#684](https://github.com/MeteoMartini/MID/pull/684): `d83304d84d34589233f6c41a78d7b8b5f6490174` · 5 Originaldateipfade, als unveränderte Git-Blobs kopiert
- PR [#695](https://github.com/MeteoMartini/MID/pull/695): `2fbf469bf9a58afa76927a9e7c4cd3b703168eb6` · 5 Originaldateipfade, als unveränderte Git-Blobs kopiert
- PR [#698](https://github.com/MeteoMartini/MID/pull/698): `e9f14a9bacd190b052e40b1d3a5ac3b9aedd10ff` · 5 Originaldateipfade, als unveränderte Git-Blobs kopiert
- PR [#685](https://github.com/MeteoMartini/MID/pull/685): `f497466ac24cb75ed9b3a8b4df7fd4ee94699b70` · 20 Originaldateipfade, als unveränderte Git-Blobs kopiert

**43/43** Pfade disjunkt; die Original-Drafts, deren Branches, Reviews und CI bleiben erhalten. Keine direkte Änderung von `main`/`mid-stable`, keine neuen Secrets oder kostenpflichtigen Provider. Dieser neue Tree ist lediglich ein unabhängig überprüfbarer Sammelkandidat; der Source-PR-Gate wurde darauf **noch nicht** ausgeführt. Der aktuelle Paket-/Vertragsstand bleibt bis zur gezielten gemeinsamen Versionssynchronisation `0.9.85.445`: Der Branch ist nicht als neuer produktiver Build gekennzeichnet.

## Abnahmezustand und Blocker

- #700: Reale vollständige und partielle DWD-EPS20-Verzeichnis- und Pages-Prüfung bestanden; echte Writer-/168h/P95-/Endclient-Abnahme offen.
- #684: 3× Original-RUC-Lauf/GRIB/Bitmap/Wertprüfung lesend bestanden, keine 168h-Produktionsfreigabe.
- #695: 3×72 originale D2-Felder lesend bestanden, produktive Vollbereichs- und Clientgates offen.
- #698: Gebundene negative Healthgate-/P4-Tests bestanden, kein verteilter produktiver CAS/Fencing-Nachweis.
- #685: Core 4/4, Heavy 6/6 sowie Browser-/Responsive-Vorabtests auf ursprünglichem HEAD grün. Diese Einzelergebnisse gelten **nicht** automatisch für den Sammel-Tree; echte Originalphase-/Worker-Livereadbacks und physische iOS-Abnahme fehlen.
- Alle fünf PRs sind Draft und ohne formale unabhängige Genehmigung. #691 vs #698 bleiben eigene, nicht blind zusammengeführte Überlappung.

**Noch vor Release:** App-Version `v0.9.85.446` und alle Spiegel synchronisieren, Nutzer- und internes Changelog, vollständige gemeinsame Source/Core/Heavy/Browser-/Responsive-Pflichtgates, unabhängiger Review, Originaldaten-, Warn-, Fallback- und Client-Prüfungen und 168h/P95-Zulassung. Danach ausschließlich Source-PR-Gate → SHA-Bot → serverseitiges ZIP → `install-mid.yml` → Worker-/Pages-Gates → Stable-Promotion. Verfrühter CI-Erfolg ist kein Releasepass.


## WE RUC 1.3 – post-import two-commit review and integration (08.11.2026, QA-only)

**Provenance:** stable/main = \`b6526e7c5c24035bd1a75b87b77e7bb8e821c334\` (v0.9.85.445). Original #701 tree \`7f376f8ba299cacea3f67e7de3e4b44b18553cb7\` from head \`4c1d46e0e8b9b997bf3097bf97dbd1b8ea66cf76\`. #685 newly inspected HEAD \`7cdbb44019d112aade9292edc8cbc588a276688d\`; exactly two additive commits \`8709d33d2dcbf65bac63ee3a4dadc0020cd40ed0\` (budget and bounded transport) and \`7cdbb44019d112aade9292edc8cbc588a276688d\` (complete original JSON reader regression) beyond the frozen #701 #685 input \`f497466ac24cb75ed9b3a8b4df7fd4ee94699b70\`. Only nine affected source/test/documentation file paths.

**Selective integration:** Nine original #685 path contents reused, except three version-dependent Worker mirrors, where the sole \`const WORKER_VERSION\` token is updated from 0.9.85.445 to 0.9.85.446. \`worker-src/00-core-observations.js\` staged Git blob \`c3aa4fdfe2a8174d325139d39331dd31d75e94e4\`; identical two generated Worker mirror blobs \`7d3eafa5ac39b3413815f8edddf077ad0dbe834a\`. All other six paths retain their exact #685 Git blobs. Old bundle code was independently inspected; \`worker-src/00-core-observations.js\` and generated Worker mirrors differed from frozen #685 only in the single WORKER_VERSION token. No other #701 source or version mirrors were replaced. Both generated Worker entrypoints must retain identical bytes.

**Security/meteorology:** Explicitly scoped 46 external phase GETs (30 native RUC, 14 lookup), plus redirect:manual and bounded response-body reader; preserves 15-min valid-time, NoData versus true zero, cell source and independent ICON fallback. These numbers are **a conservative candidate**, NOT evidence of Cloudflare's account-specific configured limits or P95. See https://developers.cloudflare.com/workers/platform/limits/#subrequests. No new credentials, rulesets, sources, cloud permissions, publishers or release bypass. Existing #685 QA tests are not promoted to scientific original-GRIB/production clearance.

**Required next on the combined SHA:** Complete 4×Core/6×Heavy/responsive and version/mirror/generation QA; independent review of runtime subrequest limits and original phase cells; genuine read-only Pages/Worker/Browser verification; P1 168h censored times, P2/P3 separate atomic Fast Lane and A/B, P4 CAS/fencing/rollback, P5 E2E origin-to-client/physical device signoff. Prior checks on either old bundle or #685 are not interchangeable with new HEAD. Keep #701 DRAFT and full Source-PR Gate → controlled SHA merge → server ZIP → install-mid.yml → Workers/Pages → Stable promotion exclusively after all mandatory gates.
