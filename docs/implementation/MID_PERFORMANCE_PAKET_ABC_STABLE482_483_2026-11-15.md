# MID Design · Performance A–C · .482-/.483-Vergleich und Speicherevidenz

**Stand:** 15.11.2026. QA-Befund, keine Freigabe. Source-of-Truth bei Arbeitsbeginn `main=mid-stable=f9c0b182b0e11278651e2afa13039015e1aa0f0b`, v0.9.85.482; fünf GitHub-Rulesets aktiv. Integrations-Draft [#819](https://github.com/MeteoMartini/MID/pull/819) stammt genau vom Stable-SHA; historischer Spezial-Draft [#815](https://github.com/MeteoMartini/MID/pull/815) bleibt unverändert.

## Originalartefakte und Methode

- Stable .482: erfolgreicher [Installer 43719514309](https://github.com/MeteoMartini/MID/actions/runs/43719514309); Archiv `mid-built-43719514309-1` (ID `14164275660`), vollständige SHA256-Prüfung aller 4040 Manifestdateien erfolgreich. Release-Tarball-SHA256 `8494adf52e2bb54f6a635e21f5522d4778620462edb1b07c91f460f20792e0c6`, Web-Build-Quell-SHA `45dbfc5cd079dff7cc4d0a7ac5183752bd8bfe06` (Promotions-SHA separat).
- Kandidat .483: [unabhängiger Draft-Build 43723225593](https://github.com/MeteoMartini/MID/actions/runs/43723225593), Build-Quell-SHA `0bc7c68f01a37498f764a87d7c23a6caa3eb96c8`, Web-Asset-Fingerprint `c743e722968900ac398e73a617c4392ae90ea5152593015741174794cb9359a0`. Spätere commitgebundene QA-Builds benötigen jeweils neue Nachweise.
- Vergleich: dieselbe Node.js-22.16.0-/zlib-gzip9-Methode für aus dem Produktions-HTML direkt referenzierte `script[type=module]`- und `link[rel=modulepreload]`-Dateien (dedupliziert). Keine transitiven/lazy Imports, kein Netztransfer, keine Browser-Laufzeit, kein Nutzer-p75.

| Kennzahl | Stable .482 | Kandidat .483 | Veränderung |
|---|---:|---:|---:|
| HTML-Start-JS roh | 2.277.626 B | 2.230.496 B | **−47.130 B (−2,07 %)** |
| HTML-Start-JS gzip9 | 688.078 B | 676.369 B | **−11.709 B (−1,70 %)** |
| Haupt-JS roh | 1.484.986 B | 1.438.554 B | −46.432 B |
| HTML-Start-CSS roh | 1.755.595 B | 1.755.595 B | unverändert |
| HTML-Start-CSS gzip9 | 249.104 B | 249.104 B | unverändert |

## Speicher (Release-Stable, kein Leckurteil)

- Browser-Fachregression: [Installer 43719514309](https://github.com/MeteoMartini/MID/actions/runs/43719514309), Job `132828291005`, synthetische MapLibre-/Vite-Fixture, 390 px / hell / next. Zwei Aufwärmzyklen, danach 20 Modell-Rundwechsel; `HeapProfiler.collectGarbage` bei H0/H5/H10/H15/H20. Used Heap `35.755.240 → 36.368.824 B` (**+613.584 B / +1,72 %**); DOM-Knoten 1102→1102, Event-Listener 485→485, Dokumente 4→4, Backing Storage 45.045.842→45.043.137 B.
- Eine monotone geringe Heapzunahme im isolierten Test kann Cache-/JIT-Retention oder einen kleinen Leak darstellen; ohne wiederholten kalibrierten Verlauf kein Leck- und kein Entwarnungsurteil. Die vorherigen extremen Browserwerte ohne Post-GC sind nicht belastbar. Ein echter .483-Post-GC-/iOS-/GPU-Mehrfachlauf ist noch nicht belegt.

## CSS und weitere Gates

- 69 globale CSS-Quellen nach kanonischer Kaskade; statischer, konservativer Risikoprüfer zeigt beim Extremwetterblock 29 und beim Kartenarbeitsbereich 47 direkte spätere Selektor-/Eigenschaftskollisionen. Null Kollisionen bei kleineren Quellen ist kein Sicherheitsbeweis. Keine produktive CSS-Verschiebung durchgeführt.
- `scripts/check-build-budget.mjs` misst JS/CSS Startassets bei jedem relevanten Build, mit zusätzlichen Fail-Gates Start-JS ≤2.400.000 B roh und ≤750.000 B gzip9. Der read-only Draft-Build ruft künftig auch den CSS-Konflikt-Prüfer auf und archiviert dessen Bericht, ohne die historischen Limits, Release-Gates oder die Source-/Worker-Provenienz zu verändern.
- Noch offen: browserseitige Einstellungs-/PWA-/Offline-Parität in 320/390/430/834/1024/1440 px, Light/Dark, Tastatur/Touch/Dynamic Type, realer iOS-/VoiceOver-Test, .483-Post-GC-MapLibre-Lauf, vollständiges Source-PR-Gate und SHA-Bot→serverseitiges ZIP→Installer→Pages/Worker→Stable. Keine dieser fehlenden Prüfungen als bestanden melden.
