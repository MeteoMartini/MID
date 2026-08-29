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

