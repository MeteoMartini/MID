# MID RUC Native Fast-Lane · echter unabhängiger +0…+6h-Lauf (Source-Draft)

## Verifizierte Ausgangsbasis

Am 02.11.2026: released v0.9.85.409 `main=mid-stable` SHA `b0bedff13106502beb1566fcef96dc4b2ec4b098`, Installer #41403550284 `completed/success`; fünf aktive Rulesets. Vor Promotion bei jedem neuen Schritt erneut live prüfen. Vorhandene RUC-P1-Echtdaten-Draft #612, Karten-/D2-Branch #606 und weitere parallele Arbeit bleiben unangetastet. Der .410-Name reserviert keine Version, die finale Versionsnummer muss aus dem aktuellen Stable/Releasegate kommen.

## Real umgesetzter Fast-Lane-Baustein

Der bereits implementierte `ruc_fast_lane_producer.py` ist **kein synthetischer Test**: Er beschafft die originalen 12 deterministischen DWD-ICON-D2-RUC-Kernparameter für 7 native +0…6h-Zeitpunkte, die nativen 73 fünfminütigen TOT_PREC-Akkumulationsfelder, 25 fünfzehnminütigen CAPE-/CIN-Felder und die originalen CLAT/CLON-Geokoordinaten. Er nutzt die produktiven ecCodes-/Bitmap-/UTC-/DWD-GRID-/Akkumulations- und Quantisierungsverträge und erzeugt echte `deterministic.bin`, `rapid-5m.bin`, `rapid-15m.bin`, `lookup.bin`. Fehlende Daten bleiben NaN→-32768, echte Trockenheit bleibt 0, Extreme dürfen nicht unbemerkt int16 gesättigt werden.

**Neu:** `ci/github/workflows/mid-ruc-fast-real-pilot.yml` (und bytegleicher aktiver .github-Spiegel) startet das vollständige Originaldatenprogramm bei einem autorisierten PR, optional manuell und künftig stündlich nur bei ausdrücklicher eigenständiger `MID_RUC_FAST_LANE_SHADOW_ENABLED=true`-Freigabe. Das Pipeline- und Release-Geheimnis bleibt unangetastet, keine kostenpflichtigen Quellen. Sie wählt den neuesten **directory-advertised-complete** DWD-Lauf unabhängig von EPS, nimmt nach dem Download alle Original-GRIBs vollständig nach nativen Werten/Bitmap/UTC selbst ab und sichert lediglich ein **inaktives, versioniertes, SHA-/Längen-geprüftes Isolat** als kurzlebiges GitHub-Artefakt.

**Neu:** `ruc_fast_consumer_shadow.py` implementiert unabhängiges **binäres tatsächliches Verbraucher-Readback** aller vier Original-RUC-Kurzfristobjekte mit jeder SHA256/Längen-/Zeitachsen-/Grid-/Field-/Unit-/Lookup-/Missing/Zero-Prüfung ohne Einsatz des Producers. Das ist ein realer Consumer-Vertrag, aber derzeit nur **lokaler Shadow**, nicht der MID-Web-/iOS-/Widget-/Export-Verbraucher. Neun adversarielle Tests weisen Quellen-/Pointer-/Datenmanipulationen und irreführende EPS20-/Aktivierungsclaims zurück.

## Bereits bestätigte externe Datengrundlage

Auf parallelem Source-Draft #612 hat GitHub-Original-DWD-Werteprüfung #41402112865 226 echte GRIB-Dateien für einen 05Z-Lauf +0..6h/EPS20 bestanden, Artifakt #13122281520. Danach hat der separate Read-only +27h/EPS20/native 5-/15-min-Lauf #41402899707 `completed/success`, Artefakt #13121679750 (separater Original-DWD-Scan). **Keiner** dieser Runs ist schon der hier gebaute, unabhängig arbeitende **Fast Producer** oder eine Benutzerfrische-SLO.

## Verbleibende zwingende Produktiv-Gates

1. In diesem isolierten PR muss der **neue konkrete Fast-Producer-GitHub-Run** als completed/success samt qualifiziertem Original-SHA/Bytes/Decoder-Readback und archiviertem inaktiven vollständigen 0–6h-Objektsatz belegt werden; ein grüner Offline-Test allein reicht nicht.
2. Vor Erstauslieferung ein **eigenständiger versionierter atomarer Publishing-Pfad**, niemals `/ruc/latest.json` überschreiben oder ältere 27h-EPS-Dateien downgraden. Vorhandene `mid-pages`-Serienveröffentlichung schützt GitHub-Pages, garantiert aber **noch keine globale GitHub+Cloudflare-CAS/Fencing-Koordination**. Unveränderliche Bytes/Pointer, stale-run-Guard, Replay/Race/Crash/Quota/Repo/Worker-Readbacks und vollständige 900MB-Budgetprüfung mit der existierenden RUC-Site sind Pflicht.
3. Web/iOS/Widgets/Exporte müssen denselben autorisierten Fast-Run und ihre eigene korrekte Gültigkeitszeit übernehmen oder auf den bisherigen 27h/20-EPS-Lauf zurückfallen. Ein deterministischer P2-0–6h-Lauf darf **kein EPS** vortäuschen; DWD-Warnungen, Probability/phase/Nowcast-Semantik bleiben sauber abgegrenzt.
4. Reales ≥7d End-to-End-Monitoring und P50/P90/P95 aus ursprünglicher DWD-Verfügbarkeit bis zu tatsächlichen Verbrauchern, insbesondere 60-Minuten-Ziel, muss gemessen werden. Keine hypothetische SLO-Freigabe. P1 168h-Originalwertarchiv, P3 echtes identisches EPS20-A/B und P4 globales CAS weiter offen.

Die Workflow- und Pointer-Flags bleiben `productionEnabled=false`, `publicationAuthorized=false`, `realtimeConsumerEnabled=false`, `consumerAdoptionVerified=false`. Keine Direktwrites auf `main`/`mid-stable`, keine Secrets-Änderungen, keine Ruleset-Absenkung. Für appweite Veröffentlichung weiterhin versionierter SHA-geprüfter nicht-Draft Source-PR → kontrollierter Bot-Merge → serverseitiges ZIP → `install-mid.yml` Core/Heavy/Worker/Pages/Finalize → Stable.
