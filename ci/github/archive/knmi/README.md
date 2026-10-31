# KNMI P4a – historischer Diagnoseworkflow-Nachweis (nur Provenienz)

**Status:** Mit dem Repository-Cleanup-Draft #543 werden die zwei noch aktiven manuellen P4a-Diagnose-Workflows und die zehn seit v0.9.85.127 nur archivierten Experimente aus dem *aktuellen* Source-Baum entfernt. Sie gehören weder zur zeitgesteuerten Versorgung noch zum verpflichtenden MID-Releasepfad. Diese Entnahme löscht ausdrücklich **keine Git-Historie**.

**Immutable Basis:** `MeteoMartini/MID@1ade69f46b9bf77e9adaa360353ffacc7a0b967c`, v0.9.85.385. Jeder frühere Workflow ist über den unten festgeschriebenen Commit und Git-Blob-SHA vollständig rekonstruierbar. Nicht aus Chat-/ZIP-Ständen rekonstruieren.

| Entfernte Archivdatei | Git-Blob-SHA | Größe (Bytes) |
|---|---|---:|
| [mid-knmi-grib-inspect.yml](https://github.com/MeteoMartini/MID/blob/1ade69f46b9bf77e9adaa360353ffacc7a0b967c/ci/github/archive/knmi/mid-knmi-grib-inspect.yml) | `c929ca61f0c268beb834b5c9cbdf5ebe3e8f739b` | 13632 |
| [mid-knmi-grib-range-index.yml](https://github.com/MeteoMartini/MID/blob/1ade69f46b9bf77e9adaa360353ffacc7a0b967c/ci/github/archive/knmi/mid-knmi-grib-range-index.yml) | `4acb1699b9542d4dd399210debdd100e9fb33aa5` | 20225 |
| [mid-knmi-grid-index-smoke.yml](https://github.com/MeteoMartini/MID/blob/1ade69f46b9bf77e9adaa360353ffacc7a0b967c/ci/github/archive/knmi/mid-knmi-grid-index-smoke.yml) | `45828407836ac5dc8e70c37362772d6b867dc3e5` | 26026 |
| [mid-knmi-multiparam-packed-smoke.yml](https://github.com/MeteoMartini/MID/blob/1ade69f46b9bf77e9adaa360353ffacc7a0b967c/ci/github/archive/knmi/mid-knmi-multiparam-packed-smoke.yml) | `977c098daaa0361d0fab20ae4aa94c63a09afb24` | 29347 |
| [mid-knmi-multirange-smoke.yml](https://github.com/MeteoMartini/MID/blob/1ade69f46b9bf77e9adaa360353ffacc7a0b967c/ci/github/archive/knmi/mid-knmi-multirange-smoke.yml) | `5de5140f1aa7c8771fb029a4d13c05714a367357` | 11579 |
| [mid-knmi-open-data-smoke.yml](https://github.com/MeteoMartini/MID/blob/1ade69f46b9bf77e9adaa360353ffacc7a0b967c/ci/github/archive/knmi/mid-knmi-open-data-smoke.yml) | `594bdf5e9d38968ac6340ec94e4650772b0d4fe6` | 3590 |
| [mid-knmi-open-data-tar-inspect.yml](https://github.com/MeteoMartini/MID/blob/1ade69f46b9bf77e9adaa360353ffacc7a0b967c/ci/github/archive/knmi/mid-knmi-open-data-tar-inspect.yml) | `90f8f482a6e94e8e4865e23be98198b506d07751` | 7779 |
| [mid-knmi-packed-point-smoke.yml](https://github.com/MeteoMartini/MID/blob/1ade69f46b9bf77e9adaa360353ffacc7a0b967c/ci/github/archive/knmi/mid-knmi-packed-point-smoke.yml) | `71d2da505c2544f25b6e0b1b4b18b28becf7f857` | 21564 |
| [mid-knmi-point-adapter-smoke.yml](https://github.com/MeteoMartini/MID/blob/1ade69f46b9bf77e9adaa360353ffacc7a0b967c/ci/github/archive/knmi/mid-knmi-point-adapter-smoke.yml) | `a1093b48a7d8985dd86c928fa63281998309a584` | 24503 |
| [mid-knmi-point-inspect.yml](https://github.com/MeteoMartini/MID/blob/1ade69f46b9bf77e9adaa360353ffacc7a0b967c/ci/github/archive/knmi/mid-knmi-point-inspect.yml) | `c6e7285ed1fe38f65b07bbe2cb7a0a7df7dd6b79` | 21824 |

**Summe:** 180069 Bytes über zehn nicht ausführbare YAML-Quellen; Git-Historie bleibt bestehen.

Der ebenfalls vor dem Cleanup noch aktive `mid-knmi-eps-rolling-manifest.yml` lief am **02.09.2026** unter [Run 33603092196](https://github.com/MeteoMartini/MID/actions/runs/33603092196) erfolgreich. `mid-knmi-eps-rolling-offset-smoke.yml` lief am selben Tag unter [Run 33610910173](https://github.com/MeteoMartini/MID/actions/runs/33610910173) erfolgreich (vorheriger Run 33610029845 fehlgeschlagen). Diese Teilnachweise sind **kein Beleg** für eine aktuelle produktive Decoder-/Ensemble-End-to-End-Versorgung.

**Retentionsgrenze:** Der produktive `worker-src/05-knmi-eps-cache.js`-Quellpfad, der externe Decoder und das Forschungs-Wasm sowie die ursprünglichen Fachverträge bleiben vorläufig unverändert: Sie sind aktuell Baseline- und Source-of-Truth-gebunden. Ein Entfernen erfordert einen nachweislich inaktiven produktiven Konfigurations-/Health-/Datenpfad, eine ausdrückliche Änderung der betroffenen versionierten Verträge und vollständig ausgeführte Releasegates. Andere KNMI HARMONIE Europe/Niederlande-Vorhersagen, KNMI-10-min-Beobachtungen und AIRMET/SIGMET werden nicht entfernt.

Die aktive Negativprüfung ist `scripts/test-knmi-workflow-consolidation-0985127.mjs`. Ausführungszustand: Draft-Branch, nicht veröffentlicht.
