# MID v0.9.69.1 – kostenfreier produktiver DWD-RUC-Datenpfad

## Ziel der Etappe

Die in MID 17.7.3 vorgesehene Produktionskette wird ohne iOS-Fork und ohne GRIB-/BUFR-Decodierung im Cloudflare Worker gehärtet:

`DWD Open Data -> GitHub Actions/ecCodes -> verdichtete RUC/RUC-EPS-Produkte -> privates Cloudflare R2 -> MID Worker -> kanonischer React/Vite-Fachkern`.

## Daten- und Fallbackvertrag

- `fetch_and_build_ruc.py` ermittelt die gemeinsamen RUC/RUC-EPS-Läufe aller Pflichtparameter und versucht mehrere Kandidaten vom neuesten rückwärts. Ein unvollständiger neuer DWD-Lauf verdrängt daher den letzten vollständigen Lauf nicht.
- Die DWD-native 15-Minuten-Struktur wird nicht mit „ersten N Dateien“ verwechselt; der Builder wählt gezielt die ganzen Stunden 0…14.
- Deterministik enthält Temperatur, Taupunkt, Feuchte, MSL-Druck, 10-m-Wind/-richtung/-böen, Niederschlag, Gesamt-/tiefe Bewölkung, CAPE und CIN.
- Für den normalen Forecast wird RUC-EPS bereits im Vorprozessor je Punkt/Stunde zu Wahrscheinlichkeit >0,2 mm, Wahrscheinlichkeit >5 mm, Mittel und Q25/Q50/Q75 aggregiert.
- Native RUC-EPS-Niederschlagsmember bleiben separat erhalten und werden nur für die passende kurzfristige Event-Ensembleauswertung gelesen.
- Best Match bleibt der kohärente Ausgangsforecast; RUC kalibriert nur 0–14 h. Fehlt oder veraltet RUC, bleiben Best Match/ICON-D2 und für Ensemble ICON-D2-EPS die sichere Rückfallebene.
- Numerische RUC-Signale heben die Blitzbindung der Bezeichnung „Gewitter“ nicht auf.

## Atomare R2-Publikation

- `deterministic.bin`, `eps-summary.bin`, `eps-members.bin` und `lookup.bin` liegen sämtlich unveränderlich unter `runs/<run>/`.
- `latest.json` verweist ausschließlich auf genau diesen Lauf und wird erst nach Upload sowie Remote-Größenprüfung aller vier Objekte ersetzt.
- Ein bereits vollständig veröffentlichter identischer Lauf ist idempotent und verursacht beim Wiederholungslauf keine neuen PUTs.
- Alte Runs werden erst **nach** erfolgreichem Pointerwechsel entfernt; die neuesten vier vollständigen Läufe bleiben erhalten.
- `latest.json` und der räumliche Punkt-Lookup werden im Worker kurz/beschränkt gecacht. Der normale Forecast liest die kleine EPS-Summary statt 20 Membern; native Member werden nur bei Eventbedarf per Byte-Range gelesen.
- Der Cloudflare Worker dekodiert weiterhin kein GRIB/BUFR/ecCodes.

## Kosten- und Cloudflare-Gate

Die öffentliche GitHub-Actions-Ausführung bleibt der kostenlose Decode-/Buildpfad. Cloudflare R2 ist technisch vorbereitet, wird aber nicht automatisch aktiviert. `tools/ruc/cloudflare_r2_bootstrap.py` arbeitet standardmäßig als Dry Run und verweigert `--apply`, solange `MID_RUC_COST_APPROVED=true` nicht ausdrücklich gesetzt wurde. Ein Custom Domain ist nicht erforderlich; wegen öffentlicher Bucket-Erreichbarkeit besitzt es zusätzlich `MID_RUC_PUBLIC_DOMAIN_APPROVED=true` als eigenes Gate.

Die Dimensionierung mit 542.040 DWD-Gitterzellen liegt bei rund 0,62 GB pro unkomprimiertem Lauf beziehungsweise rund 2,5 GB für vier Runs. Dies bleibt innerhalb des am 28.08.2026 geprüften R2-Free-Tiers, ändert aber nichts daran, dass R2-Checkout/Subscription und möglicher Mehrverbrauch vor Aktivierung ausdrücklich freigegeben werden müssen.

## Plattformvertrag

Browser/PWA und iOS behalten denselben React/Vite-Fachkern und denselben Worker. Es wurde weder ein iOS-Fachfork noch ein neuer nativer Pluginpfad eingeführt. Der nächste native Meilenstein bleibt `lifecycle-offline-resume-without-local-data-loss`.

## Regressionen / Prüfstand

- `tools/ruc/test_ruc_pack.py`: Binär-/Metadatenvertrag einschließlich EPS-Summary und run-immutable Lookup.
- `tools/ruc/test_publish_ruc_r2.py`: Fake-R2-Publisher; `latest.json` letzter PUT, Cleanup danach, zweiter identischer Lauf ohne neue PUTs.
- `scripts/test-ruc-dwd-pipeline-09690.mjs`: DWD-/Actions-/Kosten-/Atomizitäts-/Voraggregationsvertrag.
- `scripts/test-ruc-fusion-runtime-09691.mjs`: echter Worker-Runtimepfad; normaler Forecast liest nur EPS-Summary, Eventpfad kann echte 20 Member lesen, RUC-Feldkalibrierung und Gewittersperre bleiben wirksam.
- Worker-Aggregate werden aus `worker-src` neu erzeugt und auf Byte-Identität geprüft.
- Vollständige Parallel-MID-Suite: **533/558 bestanden**. Die übrigen 25 starten ausschließlich wegen des bereits beschädigten lokalen Dependency-Baums nicht: 17 × fehlende `@types`, 6 × fehlendes lokales `typescript`-Paket, 2 × fehlendes `esbuild`; **0 fachliche Assertion-Fehler**.
- `npm run verify:types`, Vite-Build und `ios:sync` bleiben lokal durch denselben Dependency-/Registryblocker nicht freigabefähig und müssen in der regulären Release-CI mit `npm ci` nachgeprüft werden.
- Der RUC-Workflow wird byte-identisch unter `.github/workflows/` und `ci/github/workflows/` geführt. Der bestehende Installer-Schutz für `.github` bleibt erhalten; die Übernahme erfolgt ausschließlich über den expliziten administrativen Workflow-Sync.

## Worker-Release

Worker-Upload **erforderlich**, weil R2-Metadaten-/Lookup-Caching und der voraggregierte RUC-EPS-Normalpfad im gemeinsamen Worker geändert wurden. Ohne eingerichtetes R2-Binding bleiben die bisherigen Best-Match-/ICON- und Legacy-Adapter-Fallbacks aktiv.
