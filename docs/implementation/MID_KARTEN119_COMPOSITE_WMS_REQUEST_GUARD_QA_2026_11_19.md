# MID-Karten 1.19 · defensives WMS-Proxy-Rasterbudget (QA-Draft)

**STATUS: QA-KANDIDAT / NO READY / NO MERGE / NO RELEASE.**

## Gesicherte Quelle
- `main=mid-stable=9fd872a789f4b158bc691d085589616c2c04f776`, v0.9.85.497 in `package.json`, `MID_BASELINE.json` und `contracts/index.json`.
- GitHub-Rulesets alle fünf aktiv, `AGENTS.md`, `MID_SOURCE_OF_TRUTH.md`, MID-UI- und Cross-Platform-Vertrag geprüft. Autorisierter `chatgpt/*`-QA-Branch. Keine Änderung an `main`/`mid-stable`, Version, RUC, Warnungen, Worker-Dispatch oder Release-Gates.
- Neu in `worker-src/20-composite-models.js` und **beiden identisch gehaltenen generierten Worker-Spiegeln** `worker.js` und `worker/metar-proxy.js`: `compositeWmsRequestGeometryError` als syntaktische **admission policy vor dem ersten Upstream-Fetch**.
- Vorhandene Provider- und Layer-Allowlist, Source-Zeitfenster, `dwdLayerForEndpoint`-Namespace-Remapping sowie DWD-Fallbacks bleiben erhalten. `Promise.any`-Parallelität bleibt ausdrücklich unverändert; über deren Änderung nur nach Latenz- und Failover-Messung entscheiden.
- Neue Vitest-Regression `tests/unit/mid-karten119-composite-wms-request-guard.test.mjs` nutzt den **tatsächlichen Worker-Router** und gestubbte echte HTTP-`Request`/`Response`-Objekte. Fehlende/falsche Größen, NaN/Infinity, invertierte/ungültige BBOX, doppelte teils anders geschriebene Parameter, unpassender WMS-Dienst und falsche Operation: **400 vor jeglichem externen Fetch**. Gültige 512×256-Umfeldbilder, 256×256-Kacheln, 4096×2048 und 3840×2160 Desktop-Karten bleiben möglich. Keine synthetische Probe als echtes DWD-/EUMETSAT-Livebild ausgeben.

## Technisches Budget und Trade-off
- Breite und Höhe: positive Dezimalganze von 1 bis **4096**; gesamte WMS-Anfrage maximal **8.388.608 Pixel** (für 3840×2160 UHD). Das ist eine konservative Proxy-Ressourcengrenze, **nicht** die spezielle **512×256**-Bildgrenze der kompakten Umfeldkarte und kein geänderter Originaldatensatz.
- `BBOX=minx,miny,maxx,maxy`: genau vier endliche Dezimalwerte inkl. zulässiger wissenschaftlicher Notation, streng min<max, endlicher Betrag bis 1e8 in den nicht weiter klassifizierten CRS-Einheiten. Eine vollständige per-Layer EPSG-/Latitude-/Longitude-Zulässigkeit wird hier **nicht behauptet** und ist weiterhin durch `GetCapabilities` und Original-Pixeltests abzunehmen.
- Für sensible Weiterleitungsparameter (u. a. WIDTH, HEIGHT, BBOX, LAYERS, TIME, SRS/CRS) ist Dopplung einschließlich unterschiedlicher Groß-/Kleinschreibung verboten, da sonst die Validierung des ersten und Upstream-`set()` des letzten Wertes auseinanderlaufen können.
- Nur `GetMap` des Dienstes `WMS`, WMS-Versionen 1.1.1/1.3.0, Format- und Quell-Allowlist durch bestehenden Worker. Gültige Anfrage bleibt unverändert. Keine Änderung des Response-/Cache-Verhaltens.
- Budget dient dem Schutz vor unbegrenzten Upstream-/GPU-/Renderlasten und unbeabsichtigtem Missbrauch. Tatsächlicher Speedup, request-Einsparung und Daten-/CPU-Messwerte sind noch **nicht** quantifiziert. Größere administrative/geografische WMS-Karten mit mehr als 8.388.608 Pixel müssten vor Freigabe separat qualifiziert werden; nur tatsächlich benötigte Ausnahme mit dokumentierter Anbieter-/Runtime-/Sicherheitsgrenze, keine pauschale Aufweichung.

## Einordnung und Abhängigkeiten
- **P0**: SHA-genaue Vitest-/Worker-Routing-/Regression-/Code-Syntaxprüfungen auf dem neuen QA-Draft; danach vollständiger regulärer MID Source-/Review-/Core-/Heavy-/Worker-/Pages-/Stable-Releasepfad. Echte Angebots-/DWD-/EUMETSAT-Rasterproben weiterhin erforderlich.
- **P0, separater Produktkandidat**: [Karten-Draft #937](https://github.com/MeteoMartini/MID/pull/937) responsive Umfeld-Rad/Sat-Viewport und OPERA-Coverage ist auf der alten .494-Basis, aber disjunkt zu diesem Worker-Fix. Kein automatischer Merge oder Veröffentlichung; Leit-Chat muss erst `.497`-Intake auswählen und qualifizieren.
- **P0, nicht gelöst**: Exakte Innenprojektion von WMS EPSG:4326 gegen MapLibre WebMercator, per Layer unterstützte SRS/CRS, echte Original-Bildpixel und fachlicher NoData-/undetect-Zustand; WMS-Syntaxvalidierung beweist weder Quellabdeckung noch Niederschlag.
- **P1**: DWD-Upstream `Promise.any`-Vierfachversuch als deduplizierten, messbaren und zeitbudgetbegrenzten Failover prüfen; erst danach Provider-Latenzen/Verfügbarkeit für sequenzielle oder gestaffelte Anfragen vergleichen.
- **P2**: UI-Vergleich Windy Radar+ und meteoblue Weather Maps: kompakte echte Originalzeit, Quellen-/Datenlückenstatus, kombinierte Radar/Sat-Regler und funktionsfähige 44px-Touchziele auf 320/390/430/768/1024/1440px. Keine Quellrechtsverwendung ungeprüft.

## Originalreferenzen
- OGC WMS 1.1.1: https://cite.ogc.org/teamengine/about/wms11/1.1.1/site/OGCTestData/wms/1.1.1/spec/wms1.1.1.html
- Cloudflare Workers resource limits and streaming: https://developers.cloudflare.com/workers/platform/limits/ ; https://developers.cloudflare.com/workers/best-practices/workers-best-practices/
- MapLibre ImageSource: https://maplibre.org/maplibre-gl-js/docs/API/classes/ImageSource/
- meteoblue radar/satellite provider contracts: https://docs.meteoblue.com/en/meteo/data-sources/satellite-and-radar-providers

**Leit-Chat-Handoff:** Dies ist eine selbständige, SHA-gebundene Worker-QA-Einheit. Nur nach originalen Source-/Worker-Gates und belegter Kompatibilität in den Release-Train aufnehmen.
