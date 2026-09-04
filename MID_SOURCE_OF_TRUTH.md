# MID – verbindliche Codebasis

## Technischer Ausgangspunkt

Für jede weitere Entwicklung gilt ausschließlich der GitHub-Zweig `mid-stable` im Repository `MeteoMartini/MID` als Codebasis. Dieser Zweig wird vom Release-Workflow erst aktualisiert, nachdem Build, sämtliche Regressionstests und das GitHub-Pages-Deployment erfolgreich waren.

`main`, ältere ZIP-Dateien, Chat-Anhänge, Chat-Zusammenfassungen und Erinnerungen dienen nur zur fachlichen Einordnung. Sie dürfen niemals ohne Abgleich mit `mid-stable` als Quellcodebasis verwendet werden.

## Pflichtprüfung vor jeder Änderung

1. `package.json` aus `mid-stable` lesen.
2. `MID_BASELINE.json` aus `mid-stable` lesen.
3. Releaseversion, Linie, Referenzcommit und Pflichtregressionen prüfen.
4. Erst danach den vollständigen Quellstand aus `mid-stable` übernehmen.
5. Bei fehlender oder widersprüchlicher Basis keinen neuen Release erzeugen.

## Verbindliche Anweisung für neue MID-Chats

> Nutze ausschließlich `MeteoMartini/MID`, Branch `mid-stable`, als Codebasis. Lies zuerst `MID_BASELINE.json` und `package.json`. Verwende weder ältere Uploads noch aus Chats rekonstruierte App-Stände. Brich ab, wenn die Basis nicht eindeutig verifiziert ist.


## v0.9.78.2 · Installer-Spiegel-Hotfix

Der mit dem Professional-Release transportierte Installer-Spiegel `workflow-patches/install-mid.yml` muss bytegleich zum kanonischen Workflow `ci/github/workflows/install-mid.yml` bleiben. Abweichungen sind unzulässig, wenn dadurch Release-/Workflow-Regressionen gegen einen veralteten Vertragsstand laufen würden. Der Hotfix v0.9.78.2 enthält keine fachliche App- oder Workerlogikänderung; er repariert ausschließlich diese transportierte Workflow-Spiegeldatei und die dazugehörige Versionsfortschreibung.


## v0.9.78.3 · GitHub-Installer-Regressionsvertrag

Ein Release-Regressionstest darf einen ausdrücklich supersedierten UI-Vertrag nicht weiterhin erzwingen. Für die 7-Tage-Ansicht gilt ab v0.9.78.1 ausschließlich die absolute ECMWF-Temperaturskala ohne Klimaabweichungsanzeige; die signierte Klimadelta-Logik bleibt auf 14 Tage begrenzt. Außerdem darf die aktive `.github/workflows/install-mid.yml` während eines ZIP-Installationslaufs nicht bytegleich zur neu installierten kanonischen `ci/github/workflows/install-mid.yml` vorausgesetzt werden: `.github` ist absichtlich vom automatischen Release-Ersatz ausgeschlossen. Aktive Workflows werden in solchen Regressionen semantisch auf ihren Sicherheits-/Kompatibilitätsvertrag geprüft; eine tatsächliche Workflow-Synchronisierung bleibt eine explizite administrative Aktion.


## v0.9.78.4 · 7-Tage-Geometrie und Tmin/Tmax-Lesbarkeit

Die 7-Tage-Kurvenübersicht verwendet für den oberen Tages-/Piktogrammbereich exakt dieselben relativen linken und rechten Plotränder wie das gemeinsame 00–24-h-SVG. Jeder Tageskopf ist dadurch geometrisch deckungsgleich mit seinem 24-Stunden-Abschnitt im Diagramm; responsive Breakpoints dürfen diese Ausrichtung nicht mit separaten Padding-Werten überschreiben. Im 7-Tage-Modus zeigen Tmin/Tmax nur noch die Werte ohne zusätzliche „Min“-/„Max“-Beschriftungen. Die ECMWF-Farbidentität bleibt erhalten, die Hintergrundflächen der Tmin/Tmax-Badges werden jedoch deutlich schwächer gemischt. Für 14 Tage bleiben die signierten Klimadeltas fachlich bestehen, ebenfalls mit abgeschwächten Badge-Hintergründen für bessere Lesbarkeit. Required Regression: `scripts/test-seven-day-axis-badge-lock-09784.mjs`.


## v0.9.78.5 · Tmin/Tmax-Regressionsvertrag

Die in v0.9.78.4 abgeschwächten Tmin/Tmax-Hintergründe sind verbindlich und dürfen nicht durch ältere Regressionserwartungen auf stärkere Flächen zurückgesetzt werden. Für 7 Tage gilt die absolute ECMWF-Farbskala ohne Klimadelta und ohne `Min`/`Max`-Zusatzlabel. Für 14 Tage bleibt die signierte, nichtlineare Klimaabweichungsreaktion erhalten, jedoch mit bewusst gedämpftem Hintergrund und Rahmen zugunsten der Zahlenlesbarkeit.

## Versionslogik

- Funktionale Erweiterung: nächste dreiteilige Funktionsversion.
- Fehlerkorrektur, Regression oder technische Wartung: nächste vierteilige Wartungsversion.
- Die Releaseversion wird zentral aus `package.json` in App, Worker, Service Worker, `version.json` und `MID_BASELINE.json` synchronisiert.

## Release-, Abhängigkeits- und Wartungsvertrag ab v0.8.26.0

- Paketversion, Rootversion des `package-lock.json`, `MID_BASELINE.json`, Frontend, Worker, Service Worker und `version.json` werden ausschließlich über `npm run sync-version` gemeinsam fortgeschrieben.
- Der Produktionsbuild führt TypeScript-Prüfungen mit `--noEmit` aus. `*.tsbuildinfo`, generierte `vite.config.js`/`vite.config.d.ts`, `node_modules` und `dist` gehören nicht zur verbindlichen Quell- oder Releasebasis.
- Die unterstützte Laufzeit ist in `package.json` festgelegt. Releases verwenden einen reproduzierbaren npm-Lockfile-Vertrag und dürfen keine internen oder lokalen Registry-URLs enthalten.
- GitHub Actions müssen auf vollständige Commit-SHAs festgeschrieben sein. Berechtigungen werden pro Job nach dem Minimalprinzip vergeben; Sicherheits- und Abhängigkeitsprüfungen dürfen den Funktions- und Regressionstest nicht ersetzen.
- Dependabot darf Aktualisierungsvorschläge erzeugen, aber keine Hauptversionsmigration automatisch zusammenführen. Funktionskritische Bibliotheken – insbesondere Diagramm-, Karten- und React-Hauptversionen – werden nur in einem eigenständig geprüften MID-Release migriert.
- Laufzeitcaches benötigen eine fachlich angemessene Ablaufzeit und eine feste Obergrenze. Beim Begrenzen dürfen bestehende Fallbacks, Offlinewerte oder Funktionen nicht stillschweigend entfallen.
- DOM-Beobachter sind auf den kleinsten fachlich erforderlichen Container und Ereignissatz zu beschränken. Dokumentweite Attributbeobachtung ist nicht zulässig, wenn dieselbe Funktion über Komponentenereignisse, Interaktion oder `ResizeObserver` erhalten werden kann.

## Verbindlicher UI- und Architekturvertrag ab v0.9.50.0

- `MID_UI_ARCHITECTURE_CONTRACT.md` ist für neue Sektionen, Menüs, Info-Schaltflächen, Tooltips, Drawer, Formatierungen und fachliche UI-Verbraucher verbindlich.
- `MID_PARAMETER_COLOR_CONTRACT.md` ist für alle meteorologischen Visualisierungen verbindlich. Parameteridentitäten dürfen nicht durch lokale Diagrammpaletten oder unbeschriftete Wert-/Klimafarbskalen ersetzt werden.
- Neue nicht-modale, verankerte Ebenen verwenden `src/AppPortalPopover.tsx`; appweite `(i)`-Hinweise verwenden `src/AppInfoPopover.tsx`/`AppInfoHint`.
- Neue Dateien dürfen keine zweite generische `createPortal`-/Außenklick-/Escape-Engine kopieren. Historisch spezialisierte Ensemble-Diagrammtooltips sind nur als regressionsgeschützte Ausnahme zulässig.
- Neue Sektionen dürfen appweite Wetter-, Niederschlags-, Wetterzwilling-, Stations-, Zeit- oder Einheitenlogik nicht lokal neu zusammensetzen, wenn dafür bereits ein kanonischer MID-Pfad existiert.
- `MID_FORECAST_CONSISTENCY_CONTRACT.md` ist für alle Forecast-Verbraucher verbindlich: sichtbare Prognosemodule verwenden die kanonischen finalen Stunden (`displayHours`) und – soweit 15-Minuten-Daten benötigt werden – die finalisierte Reihe (`displayMinutes15`). Hyperlokal-, Radar-/Nowcast- und Konvektivkorrekturen dürfen nicht ansichtsspezifisch erneut berechnet werden.
- `MID_STATE_INTEGRITY_CONTRACT.md` ist für Favoriten und Hauptsektionen verbindlich: Orts- und Event-Favoriten bleiben strikt getrennt und verlustfrei; derselbe Ort darf parallel in beiden Domänen existieren. Ein Favoriten-Tap darf genau eine Mutation auslösen, und räumliche Näherung darf niemals eine Löschung/Toggle-Entscheidung begründen. Kein Limit, Import, Sync oder Normalisierungspfad darf Favoriten stillschweigend verdrängen. Hauptsektionen verwenden einen einheitlichen gerätelokalen `mid:module:<id>:open`-Vertrag; alte Dashboard-Hashes oder Geräte-Sync dürfen beim App-Start keine Sektion selbständig öffnen.
- `MID_NOTIFICATION_RELIABILITY_CONTRACT.md` ist für Push-Benachrichtigungen verbindlich: „Aktiv“ setzt Browser-Abonnement, Worker-Registrierung und aktuellen Scheduler-Heartbeat voraus; ein echter Ende-zu-Ende-Test muss verfügbar sein. Niederschlagsbeginn verwendet die zentrale Niederschlags-Reconciliation, und Push-Regeln/Favoriten dürfen nicht still gekappt werden.
- Codebereinigungen dürfen geschützte Funktionen nicht entfernen. Strukturelle Vereinheitlichung ist nur zulässig, wenn die bestehenden Fach- und UI-Regressionen erhalten bleiben oder auf denselben, nun zentralen Vertrag aktualisiert werden.


## Ergänzung v0.9.53.32 – Hauptsektions-Recovery-Isolation

Der Hauptsektionsvertrag ist auf `mid:module-open-contract:v5` angehoben. Hauptmodul-Offenzustände (`mid:module:<id>:open`) sind ausschließlich gerätelokaler View-State. Sie dürfen weder durch Geräte-Sync noch durch `persistence.ts`-Recovery-Snapshots oder den `storageSafety`-IndexedDB-Spiegel wiederhergestellt werden. Alte Spiegelwerte werden beim Start verworfen. Die v5-Heilungsmigration setzt alle Hauptsektionen einmalig geschlossen, damit insbesondere ein historisch kontaminierter `long-range`-Offenzustand beseitigt wird. Danach gilt wieder ausschließlich die unmittelbar und synchron gespeicherte lokale Nutzerentscheidung. Required Regression: `scripts/test-module-open-recovery-isolation-095332.mjs`.

## Ergänzung v0.9.53.33 – astronomischer Symbolvertrag

`MID_SOLAR_SYMBOL_CONTRACT.md` ist app-weit für alle zeitpunktbezogenen Wetterpiktogramme verbindlich. Primäre Tag-/Nachtentscheidung ist die astronomische Sonnenaufgangs-/Sonnenuntergangsgrenze am tatsächlichen Prognoseort (`astronomicalIsDayAt()` / `solarDaylightWindowAt()`); Provider-`is_day` ist ausschließlich ein Fallback. Die kanonischen Stunden- und 15-Minuten-Reihen tragen den exakten Sonnenstatus, Kurzfrist-/90-Minuten-Interpolation darf keinen Stundenstatus über die Sonnenuntergangsgrenze fortschreiben, und native Widgets folgen derselben Grenzlogik. Required Regression: `scripts/test-solar-symbol-contract-095333.mjs`.

## v0.9.53.34 · Event-Lifecycle / Splashscreen
Verbindliche Referenz: `MID_EVENT_LIFECYCLE_STARTUP_CONTRACT.md`. Event-Ablauf wird ortszeitzonengerecht bestimmt; abgelaufene Events werden appweit gekennzeichnet und nicht mehr automatisch refreshed. Der Splashscreen folgt dem eingestellten Theme, zeigt das vollständige MID-Logo prominent und nutzt für eine kurze Startvorladung ausschließlich den bestehenden kanonischen Forecastpfad.

## v0.9.53.35 · Produktionsbuild-Fix
Der fehlgeschlagene v0.9.53.34-Release-Kandidat wird ausschließlich technisch korrigiert: `src/eventWeatherRefresh.ts` importiert `EventCenterRecord` nicht mehr unbenutzt. Die Event-Lifecycle-/Splashscreen-Funktionen von v0.9.53.34 bleiben vollständig erhalten. Required Regression: `scripts/test-event-refresh-buildfix-095335.mjs`.

## v0.9.53.36 · Modellquellen-/Ensemble-Fallback-Vertrag

`MID_MODEL_SOURCE_CONTRACT.md` ist app-weit verbindlich. Ensembleabrufe sind success-driven: fehlgeschlagene Modelle oder nicht konfigurierte optionale Regionaladapter verbrauchen keinen Erfolgsplatz. ECMWF IFS/AIFS verwenden einen nativen Europa→Global-Fallback innerhalb derselben Variantengruppe, ohne Doppelgewichtung. Aktive numerische Modelle bleiben in der Modellstandanzeige sichtbar, selbst wenn Laufmetadaten fehlen; Status `Aktiv`, `Fallback`, `Nicht verfügbar`, `Adapter fehlt` und `Reserve` werden unterschieden. Die offizielle Mean/Spread-Reserve ist um AIGEFS, UKMO, MeteoSwiss und BOM ergänzt. Einrichtung externer Regionaladapter folgt `MID_REGIONAL_ENSEMBLE_ADAPTER_SETUP.md`. Required Regression: `scripts/test-model-source-capability-contract-095336.mjs`.

## v0.9.53.37 · Kosten-Governance und Temperatur-Messkonsens

`MID_COST_GOVERNANCE_CONTRACT.md` ist für alle weiteren MID-Schritte verbindlich. Solange MID keine Einnahmen generiert, darf keine kostenpflichtige Infrastruktur, API, Subscription, Entwickler-Mitgliedschaft oder sonstige Ausgabe ohne vorherige transparente Kostenangabe und ausdrückliche Nutzerfreigabe aktiviert oder vorausgesetzt werden. Kostenfreie/Open-Data-Pfade haben Vorrang; optionale nicht eingerichtete Quellen müssen ohne Funktionsverlust zurückfallen. Insbesondere wird für den vorbereiteten KNMI-/ECCC-GRIB-Punktadapter kein kostenpflichtiger VPS beschafft, solange keine ausdrückliche Freigabe vorliegt.

Für die aktuelle 2-m-Temperatur ergänzt `MID_HYPERLOCAL_ANALYSIS_CONTRACT.md` die modellgestützte Restfeldanalyse um einen streng begrenzten direkten Messkonsens. Dieser greift nur bei mehreren frischen, nahen, voneinander getrennten Temperaturmesspunkten und verhindert, dass ein fehlerhafter räumlicher Modellgradient am Zielpunkt trotz deutlich abweichender lokaler Beobachtungen als „Temp. nahe Modell“ bestätigt wird. Die UI weist die tatsächlichen Temperatur-Messpunkte und ihren gewichteten Radius getrennt von der feldübergreifenden Stationsmenge aus. Required Regression: `scripts/test-hyperlocal-direct-temperature-consensus-095337.mjs` und `scripts/test-cost-governance-contract-095337.mjs`.

## v0.9.67.0 · gemeinsamer Browser-/iOS-Vertrag

`MID_CROSS_PLATFORM_CONTRACT.md` ist für die parallele Browser-/PWA- und
iOS-Weiterentwicklung verbindlich. Beide Produkte verwenden denselben React-/
Vite-Fachkern und denselben Worker; ein separater iOS-Fachfork ist unzulässig.
Native Fähigkeiten werden ausschließlich über Plattformadapter ergänzt.
`MID_IOS_ROADMAP.md` legt die autonome Etappenfolge und Apple-Freigabegates
fest; `MID_IOS_STATUS.json` benennt den jeweils nächsten sicheren Meilenstein.
Browserbuild, vollständige MID-Regressionen und iOS-WebView-/Capacitor-Prüfung
bleiben getrennte Pflichtstufen. Kostenpflichtige Apple-, Signierungs-,
TestFlight- oder macOS-CI-Schritte bleiben dem
`MID_COST_GOVERNANCE_CONTRACT.md` unterstellt.

## v0.9.69.2 · DWD ICON-D2-RUC/RUC-EPS-Vertrag

`MID_DWD_RUC_PIPELINE_CONTRACT.md` ist für den gemeinsamen Kurzfrist-Fachkern verbindlich. Best Match bleibt die kohärente Prognosebasis; ICON-D2-RUC darf ausschließlich 0–14 h innerhalb seines geprüften DWD-Gebiets kalibrieren und teilt sich mit der ICON-Familie das Unabhängigkeitsbudget. RUC-EPS wird nur für passende Kurzfrist-/Eventhorizonte vor ICON-D2-EPS versucht und bleibt mit diesem in derselben DWD-Ensemble-Variantengruppe. Numerische Modellwerte dürfen die Blitzbindung der Gewitterbezeichnung nicht aufheben. Rohes GRIB/BUFR wird niemals im Cloudflare Worker dekodiert. Die R2-/Actions-Pipeline ist auf lauf-immutable Objekte inklusive Lookup, voraggregierte EPS-Kurzfristwerte, atomaren `latest.json`-Wechsel, idempotente Wiederholung und Fallback-sichere Retention gehärtet. R2 bleibt private-by-default (`r2.dev` aus), ein Custom Domain ist optional und separat freizugeben. Der `ruc-health`-Pfad prüft den produktiven Storagezustand ohne Infrastrukturgeheimnisse offenzulegen. Die Pipeline bleibt gemäß `MID_COST_GOVERNANCE_CONTRACT.md` bis zur ausdrücklichen Kostenfreigabe deaktiviert. Required Regressions: `scripts/test-ruc-dwd-pipeline-09690.mjs`, `scripts/test-ruc-fusion-runtime-09691.mjs` und `scripts/test-ruc-storage-health-09692.mjs`.


## v0.9.69.3 · automatischer Worker-Deploy-Vertrag

`MID_WORKER_AUTO_DEPLOY_CONTRACT.md` ist für künftige Cloudflare-Worker-Änderungen verbindlich. Nach vollständiger Releaseprüfung wird eine fachliche Worker-Änderung gegen `mid-stable` ermittelt; reine Versionsmetadaten lösen keinen Deploy aus. Bei fachlicher Änderung wird die aktuelle Remote-Konfiguration fail-closed gespiegelt, eine neue Worker-Version zunächst mit 0 % Traffic gestaged, per Cloudflare-Versionsoverride geprüft und erst danach auf 100 % promoviert. Fehler nach dem Staging schalten automatisch auf die zuvor aktive Version zurück; Pages und `mid-stable` dürfen ohne grünes Worker-Gate nicht weitergeführt werden. Wrangler-Auto-Provisioning ist deaktiviert, Dashboard-Variablen/Secrets bleiben erhalten, unbekannte Bindings blockieren die Automatisierung. Browser/PWA und iOS bleiben auf demselben Worker-Fachkern. Required Regression: `scripts/test-worker-auto-deploy-09693.mjs`.


## v0.9.69.4 · Worker-Placement-Spiegel-Hotfix

Der automatische Worker-Deploy übernimmt Placement aus der Cloudflare-Remote-Konfiguration nur bei einer gültigen Placement-Angabe. Ein leeres `placement`-Objekt wird weggelassen. Smart Placement sowie genau ein `region`-/`host`-/`hostname`-Hinweis werden erhalten; widersprüchliche oder unbekannte Angaben blockieren fail-closed. Required Regression: `scripts/test-worker-auto-deploy-09693.mjs`.

## v0.9.69.5 · Worker-Entry-Point-Spiegel-Hotfix

Die dynamische Wrangler-Konfiguration darf unabhängig von ihrem temporären Speicherort den Worker-Einstiegspunkt nur auf den ausgecheckten Release-Arbeitsbaum beziehen. `config.main` wird deshalb als absoluter Pfad auf `worker/metar-proxy.js` erzeugt. Relative Pfade, die Wrangler bei einer unter `/tmp` liegenden Config gegen `/tmp` auflösen könnte, sind für den Auto-Deploy unzulässig. Required Regression: `scripts/test-worker-auto-deploy-09693.mjs`.


## v0.9.72.0 · Apple Push-/Background-Refresh-Quellvertrag

`MID_APPLE_PUSH_BACKGROUND_CONTRACT.md` ist für die weitere native Apple-Integration verbindlich. APNs-Callbacks und `BGAppRefreshTask` werden im bestehenden Capacitor-Haupttarget ausschließlich quellenmäßig vorbereitet; sichtbare Wetter-, Warn-, Event- und Forecastlogik bleibt im gemeinsamen React/Vite-/Worker-Fachkern. Vor dem ausdrücklichen Apple-/Kosten-Gate werden weder Notification-Berechtigung noch `registerForRemoteNotifications()`, Token-Upload, `aps-environment`, `UIBackgroundModes`, APNs-Provider-Secrets, Signierung noch Geräteinstallation aktiviert. Der vorbereitete Background-Identifier lautet `app.midwx.weather.background-refresh`. Required Regression: `scripts/test-apple-push-background-source-preparation-09720.mjs`.


## v0.9.73.0 · Apple Privacy-/Berechtigungsmanifest-Vertrag

`MID_APPLE_PRIVACY_PERMISSION_CONTRACT.md` ist für App und Widget verbindlich. Beide ausführbaren Apple-Bundles besitzen ein eigenes `PrivacyInfo.xcprivacy`; Tracking bleibt `false`. Das Haupt-App-Manifest deklariert die tatsächlich verwendeten off-device Kategorien Precise Location, den optionalen zufälligen Geräte-Sync-Identifier, verschlüsselten portablen Nutzerinhalt sowie Cloudflare-RUM Produktinteraktion/Performance. Für `@capacitor/filesystem` ist `NSPrivacyAccessedAPICategoryFileTimestamp` mit Reason `C617.1` deklariert. Die Widget-Extension bleibt auf Precise Location und frei eingegebenen Standortinhalt für `mid.native.widget.v1` begrenzt. Der Meilenstein aktiviert weder ATT, Push, Background Modes, Hintergrund-Ortung, Entitlements noch Signierung. Required Regression: `scripts/test-apple-privacy-permission-manifest-09730.mjs`.

## v0.9.77.18 · KNMI-HARMONIE-EPS-Produktivcache

`MID_KNMI_HARMONIE_EPS_CACHE_CONTRACT.md` ist für den produktiven KNMI-HARMONIE-AROME-Cy43-P4a-Cache verbindlich. Der gemeinsame Worker verwendet das bereits vorhandene KV-Binding `MID_PUSH_SUBSCRIPTIONS` ausschließlich unter dem getrennten Präfix `cache:knmi-eps:tar-index:v1:`; ein neues Cloudflare-Namespace oder ein neuer Workflow ist unzulässig. Persistiert wird nur die stabile TAR-Struktur, niemals API-Schlüssel, temporäre Download-URLs, Roh-GRIB/TAR-Inhalte oder zeitabhängige Rolling-Membernummern. TAR-Indizes leben 72 h persistent und 10 min im Isolate-Memory-Cache. Sparse-Dateibereiche werden in höchstens 16 HTTP-Multi-Ranges je Request gepackt, ohne vollständige Archive oder Zwischenräume mitzulesen. Der Push-Scheduler bleibt strikt auf `sub:` beschränkt und der Cache verwendet kein `KV.list()`. Die produktive KNMI-Daten-/Rolling-Member-Anbindung bleibt der nächste Hauptabschnitt und muss diesen Cache wiederverwenden. Required Regression: `scripts/test-knmi-eps-productive-cache-097718.mjs`.

## v0.9.77.22 · KNMI-HARMONIE-EPS-Punktdecoder

`MID_KNMI_HARMONIE_EPS_DECODER_CONTRACT.md` und `tools/knmi_eps_decoder/` sind für Abschnitt 3/4 der direkten KNMI-P4a-Integration verbindlich. Der externe Decoder konsumiert ausschließlich das vom Worker erzeugte `mid.knmi.harmonie-eps.rolling-manifest.v1`, fordert nur dessen HTTP-206-Bytebereiche an und baut weder Listing noch TAR-Index oder Vollarchivpfad nach. P4a wird als GRIB1 dekodiert; Temperatur, Regen, 10-m-Wind und Böen werden als Memberfelder ausgegeben. Akkumulierter Rolling-Regen wird je 5er-Batch am ersten gemeinsamen Gültigkeitszeitpunkt baselined und anschließend differenziert. P4a Europe ist im Modellkatalog mit 5,5 km und stündlicher Aktualisierung geführt. Hosting/Aktivierung bleibt Abschnitt 4/4 und ist ohne kostenfreien vorhandenen Runtimepfad bzw. ausdrückliche Kostenfreigabe unzulässig. Required Regression: `scripts/test-knmi-eps-point-decoder-097722.mjs`.
## v0.9.77.23 · 24-h-Skybar und KNMI-EPS-Aktivierungs-Gate

Das 24-h-Wetterprofil verwendet für die Gesamtzeile denselben zentralen `detailSkyBarSegments`-Vertrag wie die Tagesansicht; H/M/L bleiben separate graue Intensitätsbänder. Wertepillen am aktiven Zeitcursor sind leicht transparent. `MID_KNMI_HARMONIE_EPS_ACTIVATION_AUDIT_0.9.77.23.md` dokumentiert zugleich Abschnitt 4/4: Der vorbereitete ecCodes-Punktdecoder wird nicht kostenpflichtig aktiviert. Cloudflare Python Workers sind für den nativen ecCodes-Referenzdecoder derzeit kein kompatibler Runtimepfad; Cloudflare Containers setzen einen kostenpflichtigen Workers-Paid-Plan voraus. Ohne kostenfreien kompatiblen Host, validierten Wasm-/JS-Decoder oder ausdrückliche Kostenfreigabe bleibt die reale E2E-Aktivierung gesperrt.
## v0.9.77.24 · KNMI-EPS Wasm32-Punktprototyp

`tools/knmi_eps_wasm_prototype/` ist der verbindliche, nicht-produktive Forschungsstand für Abschnitt 4/4. Der Build pinnt ECMWF ecCodes 2.48.1, nutzt wasm32 und `ENABLE_MEMFS=ON`, verarbeitet bereits getrennte GRIB1-Nachrichten ausschließlich im Speicher und ruft die native ecCodes-Nearest-Point-API auf. Ein Vollgittertransfer nach JavaScript, NODEFS, Queue-/Binding-Aktivierung oder eine neue npm-Produktionsdependency sind verboten. Die Python/ecCodes-Implementierung bleibt Referenz, bis reale P4a-Numerik sowie Bundle/RAM/CPU gemessen sind. Required Regression: `scripts/test-knmi-eps-wasm32-prototype-097724.mjs`.
## v0.9.77.25 · Witterungstrend, Season-Poor-Man’s-Ensemble und Tmin/Tmax-Kästchen

Temperatur ist im Witterungstrend Tag 15–46 der fail-safe Default; `mid:subseasonal-trend:metric` speichert die letzte gültige Auswahl. Der Season-Bereich verwendet alle tatsächlich numerisch geladenen unabhängigen Modellfamilien mit genau einer Stimme je Familie als Poor-Man’s-Ensemble und zeigt dieselben verfügbaren Einzelmodelle gemeinsam in einem Diagramm. Reine Katalog-/Status-/Zusatzmodellkästen ohne Zahlenwerte werden nicht dargestellt. Tmin/Tmax erscheinen in 7-/14-Tage-Übersichten wieder als kompakte blaue/rote Kästchen; bereits etwa ±0,5 bis ±1 K zum jeweiligen Klimamittel verändern Zahl-, Hintergrund- und Rahmenintensität sichtbar. Aktuelle/stündliche Temperaturen bleiben neutral. Required Regression: `scripts/test-trend-seasonal-temperature-ui-097725.mjs`.


## 0.9.77.27
- Saison-/Langfristtrend verwendet kanonische `modelKey`-/`independenceKey`-Identitäten. Datenanbieter sind keine zusätzlichen Modellstimmen.
- C3S führt 10 aktuelle operationelle Systeme; ECCC System 4/5 bleiben getrennte Systeme. NOAA NMME wird dynamisch aus dem jüngsten ENSMEAN-Lauf übernommen.
- Poor-Man’s-Ensemble gewichtet jedes tatsächlich numerisch verfügbare unabhängige Modellsystem exakt einmal; C3S/NMME/Open-Meteo-Dubletten werden zusammengeführt.
- NOAA-NMME-Punktdaten werden primär per NetCDF-Header-Range und HTTP Multi-Range gelesen; Volldownload ist nur Fallback. Keine neue kostenpflichtige Ressource.
- WMO/APCC/CanSIPS/DWD-EPISODES werden nicht als scheinbar zusätzliche Monatsstimmen eingemischt, wenn Zeitachse, Authentifizierung oder Modellabhängigkeit das fachlich verbieten. Vollständiger Audit: `MID_SEASONAL_LONG_RANGE_SOURCE_AUDIT_0.9.77.27.md`.

## v0.9.77.28 · Tmin/Tmax-Klimamittel-Sichtbarkeit und Datenbedarf

Tmin/Tmax in 7-/14-Tage-Übersichten verwenden das jeweilige klimatologische Tagesminimum/-maximum 1991–2020 unabhängig von optionalen Summary-Anzeigen. Solange die Tagesprognose aktiv ist, muss die Klimatologie angefordert werden. Jeder Tagesbadge zeigt zusätzlich zum Temperaturwert seine individuelle Abweichung in K; fehlende Klimadaten werden als `Δ –` gekennzeichnet und dürfen nicht als echte neutrale Klimaabweichung erscheinen. Die Intensität der blauen Tmin- bzw. roten Tmax-Kästchen wird ausschließlich aus dieser individuellen Abweichung abgeleitet und reagiert bereits um ±0,5 bis ±1 K sichtbar. Ein vorhandener Klimacache darf bei vorübergehendem Archive-Endpunktfehler stale weiterverwendet werden. Required Regression: `scripts/test-climate-delta-badges-097728.mjs`.

## v0.9.77.29 · Witterungsresilienz, Nicht-EPS-Langfrist und 7-Tage-Kurvenübersicht

`MID_LONG_RANGE_SOURCE_EXPANSION_0.9.77.29.md` ist für zusätzliche Witterungs-/Saisonquellen verbindlich. Ein Modellbeitrag muss nicht aus einzelnen EPS-Membern bestehen; numerische Ensemble-Mittel oder belastbare deterministische Modellmittel sind zulässig, sofern Zeit-/Anomalieachse kompatibel ist und `independenceKey` eine unabhängige Modelllinie kennzeichnet. Jede Modelllinie erhält weiterhin genau eine Stimme. DWD GCFS2.2 ist eine eigenständige saisonale DWD-Linie; DWD Subseasonal EPISODES basiert dagegen auf ECMWF IFS ENS/Extended-Range und darf nur als regionaler Downscaling-/Qualitätsanker, nicht als zusätzliche EC46-Stimme genutzt werden. Der Witterungstrend darf die Anzeige vorhandener EC46/GEFS-Werte nicht mehr von einem vollständigen 1991–2020-Klimatologieabruf abhängig machen; Quell- und Klimabudgets sowie 36-h-Stale-Fallback sind verbindlich. Die 7-Tage-Hauptansicht besitzt direkt oberhalb der Tageskarten eine responsive Kurvenübersicht aus denselben kanonischen Tages-/Stundendaten, Wetterpiktogrammen und Parameterfarben. Required Regression: `scripts/test-witterung-seven-day-curve-097729.mjs`.

## Ergänzung v0.9.78.0 – verbindlicher appweiter Wetterpiktogramm-Standard 2.0

`MID_WEATHER_PICTOGRAM_STANDARD.md` ist ab v0.9.78.0 für alle meteorologischen Wetterzustands-Piktogramme verbindlich. `src/WeatherPictogram.tsx` ist der einzige kanonische Wetterzustandsrenderer im gemeinsamen React/Vite-Fachkern. Forecast-, Tages-, Stunden-, Event-, Reise-, Routen-, Wasser-, Berg-, Ensemble- und Widgetansichten dürfen keine parallelen Emoji-, Rasterasset- oder lokalen Wettericonpfade neu einführen. Die Symbolfamilie muss Tag/Nacht sowie Hell/Dunkel bei identischer skalierbarer SVG-Geometrie unterstützen. Niederschlagsart und Niederschlagsstärke werden getrennt kodiert; insbesondere Sprühregen, gefrierender Sprühregen/Regen, Regen/Schauer, Schnee, Schneegriesel, Schneeschauer, stratiformer und konvektiver Misch-Niederschlag, Eiskristalle, Eiskörner, Graupel und Hagel müssen unterscheidbar bleiben. Dekodierte SYNOP-/BUFR-/METAR-Present-Weather-Angaben dürfen über den zentralen `phenomenon`-Pfad eingebunden werden. Intensität darf nicht allein über Farbe vermittelt werden. Der alte Forecast-Emoji-Hilfspfad ist nicht mehr zulässig. Required Regression: `scripts/test-weather-pictogram-standard-09780.mjs`.


## v0.9.78.1 · Weather-Icon-System-Lock und 7-Tage-Stundenkurve

`MID_WEATHER_PICTOGRAM_STANDARD.md` wird verschärft: Weather Icon System 2.0 ist die appweite visuelle Referenz; Wetterglyphen sind standalone und dürfen keine eingebaute alte Sky-Plate tragen. Repräsentative Tages-/Nachtpiktogramme müssen ihre Phase aus dem kanonischen `precipitationParts(...).displayCode` ableiten, damit Niederschlagscharakter und Symbol nicht auseinanderlaufen. `Regenschauer`, Sprühregen, Schneegriesel, Schnee-/Mischphasen, Hagel und Gewitter bleiben damit auch in kompakten 7-Tage-Karten unterscheidbar.

Der 7-Tage-Temperatur-/Niederschlagsblock folgt dem freigegebenen Konzept: die Temperaturkurve basiert auf den stündlichen kanonischen Forecastwerten, Niederschlagsbalken sind stündlich und auf derselben Zeitachse ausgerichtet, 00/12-Uhr- und Tagesmarken strukturieren alle sieben Tage, horizontale Temperaturhilfslinien bleiben sichtbar. Temperatur wird wertbasiert mit der zentralen ECMWF-inspirierten Skala eingefärbt. In der 7-Tage-Ansicht werden keine Klimamittelabweichungen/±K mehr gezeigt; die ältere 7-Tage-Regel aus v0.9.77.25/v0.9.77.28 ist insoweit ausdrücklich ersetzt. Die 14-Tage-Klimaabweichungslogik bleibt bestehen. Required Regressions: `scripts/test-weather-pictogram-ui-lock-09781.mjs`, `scripts/test-seven-day-ecmwf-hourly-09781.mjs`.

## v0.9.78.9 · Weather Icon System 2.0 und Desktop-Lesbarkeit

Der sichtbare Wetterzustand darf nicht mehr durch die diagnostische H/M/L-Wolkenform in eine andere Hauptsymbolfamilie umgeformt werden. `WeatherPictogram` bleibt der einzige Forecast-Wetterrenderer; `weatherPictogramVisualForm()` ist der verbindliche sichtbare Form-Lock. Höhenwolken-/Wolkenformdiagnostik bleibt fachlich verfügbar, ist aber kein alternativer Piktogrammrenderer.

Für die 14-Tage-Ansicht gilt ab 1025 CSS-Pixel ein eigener Desktopvertrag mit mindestens 224 px breiten Karten und horizontalem Kartenband. Das 7×2-Mikrolayout ist ausschließlich Mobil-/Tablet-Querformat bis 1024 px vorbehalten.

## v0.9.78.10 · Niederschlags-Intervall- und Nowcastvertrag

`MID_PRECIPITATION_INTERVAL_CONTRACT.md` ist ab v0.9.78.10 für alle Niederschlagsmengen und -wahrscheinlichkeiten verbindlich. Open-Meteo-Stundenmengen sowie DWD/MOSMIX-RR1c werden als rückblickende Akkumulationen behandelt: der Zeitstempel bezeichnet das Intervallende, nicht dessen Mittelpunkt. Radar-, 15-Minuten-, Stunden- und Tagesaggregation müssen dieselben Intervallgrenzen verwenden. Ein „ab jetzt“-Profil darf bereits vollständig vergangene Stundenakkumulationen nicht erneut als Zukunft anzeigen; angeschnittene erste Intervalle werden nur mit ihrem Zukunftsanteil bilanziert und im direkten Nowcastfenster bevorzugt aus finalisierten 15-Minuten-/Radarwerten aufgebaut. Eine belastbar trockene Radarstrecke darf auch NWP-Stundenmengen über 1 mm dämpfen; Echo nur im Umfeld darf die PoP stützen, aber keine ungestützte Standortmenge unverändert durchreichen. Instantane Felder wie Temperatur, Wind und Druck bleiben punktbezogen. Required Regression: `scripts/test-precipitation-trailing-interval-nowcast-097810.mjs`.

## v0.9.78.46 · sichtbare Niederschlagszeit = Slotbeginn

Der Rechenvertrag aus v0.9.78.10 bleibt vollständig erhalten: providerseitige stündliche Niederschlagsmengen/-wahrscheinlichkeiten sind rückblickende, am Intervallende gestempelte Rohwerte. Für die **sichtbare Zukunftsprognose** gilt ab v0.9.78.46 jedoch zusätzlich der in `MID_PRECIPITATION_INTERVAL_CONTRACT.md` präzisierte Präsentationsvertrag: ein sichtbarer Stundenzeitpunkt `S` bezeichnet den beginnenden Slot `[S,S+1 h]`; die zugehörigen Niederschlagsfelder stammen daher aus dem unmittelbar folgenden Rohwert `S+1 h`. Menge, PoP, Niederschlagsphase und niederschlagsbestimmter Wettercode müssen dasselbe sichtbare Intervall meinen. Instantane Felder wie Temperatur, Wind, Druck und Bewölkung verbleiben am Zeitpunkt `S`. Die 15-Minuten-/1-Stunden-Grenze darf weder Lücken noch Doppelzählung erzeugen; fehlende Anschlusswerte werden nicht als falsche Zukunft umetikettiert. Der interne Radar-/Nowcast-, Assimilations-, Verifikations- und Event-Overlap-Rechenkern bleibt endgestempelt. Required Regressions: `scripts/test-precipitation-trailing-interval-nowcast-097810.mjs`, `scripts/test-precipitation-forward-slot-presentation-097846.mjs`.
