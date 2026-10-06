## MID v0.9.85.185 · Getrennter DNS-Credential-Pfad

Basis: `main = v0.9.85.184 @ d35659371f48099676409f93add33c4599bf07ec`, `mid-stable = v0.9.85.182 @ 34d41442de1bb8e984dedca0e786dabb5b9f5ee1`. Der erneute .184-Installerlauf bestätigte Worker-Staging, 0-%-/100-%-Smoke und RUC, scheiterte aber erneut beim DNS-Lesen mit HTTP 403, weil der DNS-Schritt weiterhin den Worker-CI-Token verwendete. v0.9.85.185 trennt die Berechtigungen: Nur der Schritt für den bestehenden `www.midwx.app`-CNAME erhält `secrets.CLOUDFLARE_DNS_API_TOKEN`; Worker-Deploy und Workers Route behalten `secrets.CLOUDFLARE_API_TOKEN`. Fehlt der separate DNS-Token oder ist er unzureichend berechtigt, bleibt der Release fail-closed vor Pages und Stable. Details: `docs/implementation/MID_DNS_TOKEN_SPLIT_0.9.85.185.md`.

## MID v0.9.85.184 · Same-Origin-DNS-Hotfix

Basis: `main = v0.9.85.183 @ 61fc2634651b865e571496da6eaf3dd0378c760b`, `mid-stable = v0.9.85.182 @ 34d41442de1bb8e984dedca0e786dabb5b9f5ee1`. Der .183-Worker selbst war gesund, die bestätigte Route `www.midwx.app/api/mid-worker*` blieb jedoch öffentlich 404, weil `www.midwx.app` noch nicht durch den Cloudflare-Proxy lief. v0.9.85.184 ergänzt deshalb ausschließlich ein fail-closed DNS-Gate, das beim vorhandenen eindeutigen CNAME nur `proxied=true` aktiviert und Ziel, Typ, Name, TLS sowie alle anderen Records unangetastet lässt. Danach bleiben Route- und Same-Origin-Health-Gates unverändert verbindlich. Details: `docs/implementation/MID_WWW_PROXY_HOTFIX_0.9.85.184.md`.

## MID v0.9.85.183 · Corporate-safe Same-Origin Data Plane

Basis: `main = mid-stable = 34d41442de1bb8e984dedca0e786dabb5b9f5ee1` (v0.9.85.182). Im produktiven Web ist `https://www.midwx.app/api/mid-worker` der kanonische und einzige Browserpfad für Warnungen, ICON-D2-RUC/RUC-EPS sowie Radar-/Satelliten- und moderne Kartenbasisdaten. Geschlossene Worker-Proxys ersetzen direkte Drittanbieterabrufe; die exakte Cloudflare-Route wird vor Pages/Stable fail-closed geprüft und der Same-Origin-Endpunkt versionsgenau gesmoked. Eine neue Verbindungsdiagnose trennt „keine Wetterinformation“ von 403/Netzwerkfilter/Timeout. Details: `docs/implementation/MID_CORPORATE_SAFE_DATA_PLANE_0.9.85.183.md`.

## MID v0.9.85.182 · Resilienter serverseitiger Widget-Export

Basis: `main = mid-stable = a855f418c3fa00af40da8ccedcd2b1a7c05b02b9` (v0.9.85.181). Der Widget-Workflow erzeugte acht PNGs erfolgreich und brach anschließend bei einem transienten Wetterabruf-Timeout für eine einzelne Kürecik-Variante ab. Ab v0.9.85.182 darf jede einzelne Variante höchstens drei kontrollierte Render-Versuche mit 180-s-Zeitfenster durchführen; partielle Dateien werden vor jedem Retry entfernt. Erst nach drei Fehlschlägen wird weiterhin fail-closed abgebrochen. Matrix, Datenlogik, URLs und SharePoint-Übergabe bleiben unverändert. Details: `docs/implementation/MID_WIDGET_RENDER_RETRY_0.9.85.182.md`.

## MID v0.9.85.181 · Cross-Platform-CDP für Widget-PNGs

Basis: `main = mid-stable = 3fe968e5127a34d2e820e0d2e367d9cfb388ca35` (v0.9.85.180). Der serverseitige Widget-Workflow war fachlich korrekt getriggert, scheiterte jedoch reproduzierbar auf GitHub Ubuntu, weil der bestehende Capture-Renderer den CDP-Browserpfad noch auf Edge ausgerichtet hatte. Ab v0.9.85.181 erkennt der Renderer Edge/Chrome/Chromium plattformübergreifend, akzeptiert `MID_WIDGET_BROWSER`/`--browser`, überwacht Browserstart und -exit fail-fast und verwendet auf Linux die CI-tauglichen Headless-Flags. Der Workflow führt zusätzlich einen expliziten Browser-Preflight durch. Widgetprofile, MID-Daten und Wetterlogik bleiben unverändert. Details: `docs/implementation/MID_WIDGET_BROWSER_RUNTIME_0.9.85.181.md`.

## MID v0.9.85.180

- Profilkopf kompakt: redundante Drucktrend-Karte entfernt, relevante Hinweise vollbreit und umbrechend. RUC zeigt Kandidat und tatsächlich aufbereiteten Lauf mit Datum/HHMMZ im Log und der Ergebnisübersicht.

- Stark-/Dauerregenhinweise markieren die tatsächlich nasse Phase statt trockener Vor- und Nachlaufstunden rollierender Summenfenster.
- Regenhinweise nennen die Standort-Modellsumme und DWD-Schwellen; unbelegte Ensemble-Bestätigung und erfundene Wahrscheinlichkeitsbereiche entfallen.
- Zeitlücken und Mehrstundenwerte dürfen keine Stunden-Warnschwellen vortäuschen. Amtliche Warnungen und Extremwettervorschau behalten ihre eigenen Quellen und Kriterien.

Details: docs/implementation/MID_C18_RAIN_EVIDENCE_0.9.85.180.md. Normaler SHA-gebundener Source-/Installer-Release.

## MID v0.9.85.179 · Deterministischer Widget-Export nach Stable-Promotion

Basis: `main = mid-stable = 16c007b264599c7162bd174d03179b2a4363d7e2` (v0.9.85.178). Der in v0.9.85.178 eingeführte Widget-Workflow erhält zusätzlich einen direkten `push`-Trigger für `mid-stable`, damit jede reguläre Stable-Promotion unmittelbar einen Renderlauf erzeugt. `workflow_run`, Stundenplan und `workflow_dispatch` bleiben als redundante Startwege bestehen. Die Render-/Publikationslogik selbst bleibt unverändert und weiterhin fail-closed. Details: `docs/implementation/MID_WIDGET_EXPORT_TRIGGER_0.9.85.179.md`.

## MID v0.9.85.178 · Automatischer Widget-Bildtransport

Basis: `main = mid-stable = d771d9cfaec65f6c13538a143f2c52b620c997c0` (v0.9.85.177). Die in v0.9.85.175 festgelegten zwölf Widgetprofile werden ab dieser Version serverseitig und reproduzierbar erzeugt. Der Workflow arbeitet ausschließlich gegen `mid-stable`, verifiziert vor jedem Lauf die lokale Stable-Version gegen die öffentlich ausgelieferte `www.midwx.app/version.json` und publiziert nur bei nachgewiesener Gleichheit. Rendering und Validierung sind read-only; die rollierenden Release-Assets werden ausschließlich mit einem kurzlebigen, auf `contents: write` begrenzten MID-Release-Bot-Token ersetzt. Kanonischer Transfergegenstand ist `mid-widget-export-latest.zip` mit Manifest und SHA-256. Ein adminfreier PowerShell-Downloader übernimmt Download, Integritätsprüfung und lokale Bereitstellung. Details: `docs/implementation/MID_WIDGET_EXPORT_AUTOMATION_0.9.85.178.md`.

## MID v0.9.85.177

- Bergwetter: Die Höhenwahl allein verändert keine geografische Modellzelle mehr; Nullgrad- und Schneefallgrenzen bleiben für dieselbe atmosphärische Säule konsistent.
- Wolkenuntergrenze und lokale Kondensationshöhe werden fachlich getrennt; tiefer liegende Wolkenschichten bleiben auch bei gewählter Bergstation erhalten.
- Räumliche Unterschiede und mehrere Wolkenschichten bleiben erhalten. Fehlende Grenzhöhen und Koordinaten werden nicht zu künstlichen Nullwerten.

Details: docs/implementation/MID_C18_ATMOSPHERIC_COLUMN_0.9.85.177.md. Veröffentlichung ausschließlich über die bestehenden Source-/Installer-/Worker-/Pages-/Stable-Gates.

## MID v0.9.85.176

- Bergwetter: getrennte Tagesmaxima für Wind und Böen; fehlende Werte bleiben unbekannt.
- Dezente Wind- und Neuschneefarben in Tages-, Stunden- und Periodenansichten.
- Gleichmäßige Tablet-Spalten für Sonnenstunden; vollständige Wettertexte.
- Gemeinsame Prüfung klar warmer Gefrierregen-Prognosen mit Feuchte; kalte Böden, Beobachtungen und Grenzlagen bleiben geschützt.
- Neuschnee-Methodik transparent: Modell-Schneewasser und feste Anbieterumrechnung, getrennt von der Schneedecke.

## MID v0.9.85.175 · Widget-Exportprofile Malatya, Kürecik und Ämari

Basis: main v0.9.85.174 (`c5bcdc09ae97072ec3c6b7c9fca75d8debd248a5`). Der kanonische feste Widget-Export umfasst Malatya, Kürecik und Ämari (59,26°N, 24,20°E) mit genau zwei Profilen: 7 Tage Kurve mit Wind/Niederschlag/Sonne/ECMWF und 5 Tage Kompakt mit Wind/ECMWF; beide jeweils Light/Dark. Hazards sind in diesen SharePoint-Exportprofilen aus. Alte direkte Widget-URLs bleiben rückwärtsverträglich lesbar. Rendering und PNG-Erfassung verwenden weiterhin den aktuellen veröffentlichten WidgetGenerator und das bestehende `midWidgetReady`-/CDP-Verfahren. Details: docs/implementation/MID_WIDGET_EXPORT_PROFILES_0.9.85.175.md. Release ausschließlich über Source-PR-Gate, Installer und Stable-Promotion.

## MID v0.9.85.174

Nebel-/Dunsttexte bleiben mit den Wetterpiktogrammen konsistent. Bergwetter verwendet vorhandene Modell-Schneefallgrenzen vor der vereinfachten Höhenableitung. Temperatur und Taupunkt erreichen die bestehende Kurzfrist-Phasenprüfung.

## v0.9.85.173 · RUC-Workflow-Koordination

Entwicklungsbasis: main = mid-stable = 4d6fd8543868bb2c187f8326cb4efe4b973d2a67 (.172). Reguläre Workflow-Koordination, unabhängig von externer GitHub-Störung.

## v0.9.85.172 · Konsolidierung und RUC-Robustheit

Verifizierte freigegebene Basis .170; geprüfter .171-Parallelstand erhalten. Details: docs/implementation/MID_C18_CONSOLIDATION_0.9.85.172.md. Bis erfolgreicher Vorgänger-Promotion nur Entwicklungskandidat; Release ausschließlich über bestehende Gates.

## v0.9.85.171 · Source-Gate Heavy-Regressionen isoliert parallelisiert

Basis: `main = mid-stable = 53671910a16d5bd0d6cf9fe47945891789bb0dff` (v0.9.85.170). Das automatisch entdeckte Regressionsinventar wird im Source-PR-Gate verlustfrei in einen Core-Shard und drei isolierte Heavy-Shards für Native-Map-, Unified-Map- und Berg-Visual-QA aufgeteilt. Die drei Heavy-Shards arbeiten auf demselben PR-Merge-SHA, erzeugen jeweils einen eigenen Produktionsbuild und teilen weder Arbeitsverzeichnis noch Browserzustand. Der bekannte Required-Check `Agent-Quellstand vollständig prüfen` ist nun ein fail-closed Abschlussjob und wird nur grün, wenn Core **und alle** Heavy-Shards erfolgreich waren. Installer, Worker-/Pages-Gates und Stable-Promotion bleiben unverändert. Details: docs/implementation/MID_REGRESSION_SHARDS_0.9.85.171.md.

## v0.9.85.170 · Widget/Bergwetter und gemeinsame CSS-Kaskade
Basis main = mid-stable = 9b917ed7054903df6da983ed79fe20561af45ab9 (.169). Die Fach-, Karten-, Persistenz- und Exportverträge bleiben erhalten. Details: docs/implementation/MID_MODULE_CSS_0.9.85.170.md. Veröffentlichung ausschließlich durch Source-/Installer-Gates.

## v0.9.85.169 · Wartung und Touch-Bedienung
Basis main = mid-stable = 9fc04b670047ebe00f61ef4e6e376e4a69972b55 (.168). Releasebeschleunigung und Fach-, Karten- und Exportverträge bleiben bestehen. Details: docs/implementation/MID_MAINTENANCE_0.9.85.169.md. Veröffentlichung ausschließlich durch Source-/Installer-Gates.

## v0.9.85.168 · Releasepfad beschleunigt, Prüftiefe unverändert

Basis: `main = mid-stable = 5afebb86b585666e02ddf901c04f3c3703078aef` (v0.9.85.167). Das Source-PR-Gate und der Installer führen weiterhin die vollständige MID-Verifikation aus. Konservativ read-only klassifizierte Regressionen dürfen mit maximal vier Prozessen parallel laufen; Datei-schreibende, Browser-/Server-/Unterprozess-, Netzwerk- oder anderweitig nicht sicher klassifizierte Prüfungen bleiben seriell und jeder Test wird weiterhin exakt einmal ausgeführt. Git-Historie wird im Normalpfad nur als flacher SHA-Snapshot geladen; erkennt der Installer ein weitergelaufenes `main`, lädt er vor der bestehenden Race-/Ancestor-Prüfung die vollständige Historie nach. Das unveröffentlichte Pages-Artefakt darf parallel zum Worker-Gate vorbereitet werden, das eigentliche Pages-Deployment bleibt vom erfolgreichen Worker-Gate abhängig. Stable-Promotion verwendet GitHub Compare/Refs ausschließlich mit `force=false` und abschließender SHA-Verifikation. Keine meteorologische oder UI-Fachlogik geändert. Details: docs/implementation/MID_RELEASE_PIPELINE_PERFORMANCE_0.9.85.168.md.

## v0.9.85.167 · MID-C17 gemeinsame Wetterkarte
Basis main = mid-stable = a40e2fbc12ea4c24b206e4904c3f03a3293fadc6 (.166). Gemeinsame Vektorkarte, unabhängige Layer, native Raster aus der Summen-Publikationsstrecke, bidirektionale fachliche Modell-/Parametermatrix und bestätigte Produktzeiten. Details: docs/implementation/MID_C17_UNIFIED_MAP_0.9.85.167.md. Bestehende Prognose-/Einstellungskorrekturen bleiben erhalten; Release nur über bestehende Source-/Installer-Gates.

## v0.9.85.166 · MID-C17 dauerhafte 7d-Farbwahl
Basis main = mid-stable = d5db6da50fba9684d5584ed9f3cf26afa931f81b (.165). ForecastDisplay wird synchron über den bestehenden dauerhaften Speicherpfad gespeichert, mit monotoner semantischer Revision und Schutz vor veralteten Remote-Snapshots. Keine Meteorologie-/Layoutänderung. Details: docs/implementation/MID_C17_SETTINGS_0.9.85.166.md. Browser-Neustartprüfung ist Teil der neuen Pflichtregression unter GitHub Actions; Release nur nach erfolgreichem Source-/Installer-Gate.

## v0.9.85.165 · MID-C16 kompakte Prognoseansichten
Verifizierte veröffentlichte Basis main = mid-stable = 27285d13c94f0da54d878b09a1d3f5953ff2627a (.164); www.midwx.app/version.json bestätigt .164. Fachlicher .164-Vertrag bleibt unverändert. Kurze 14d-Phasen, aufklappbarer Wochenvergleich und Quellen-/Methodikansichten; alle Saisonmonate ohne horizontales Scrollen, konkrete Kalenderdaten im Witterungstrend, gemeinsame Texthierarchie. Details: docs/implementation/MID_C16_COMPACT_UI_0.9.85.165.md. Release ausschließlich nach geprüftem Handoff und Source-PR-Gate.

## v0.9.85.164 · MID-C16 Prognoseanomalien und RUC-Nachladung
Basis main = mid-stable = 7a9066bbb0b6babc03fc44dff93bcd6f815cddfe (.163). Fachlicher Vertrag: docs/implementation/MID_C16_OUTLOOKS_RUC_0.9.85.164.md. Himmelsdelta vor Fusion; Niederschlagsdelta unverändert nach Fusion. Saisonprozente nur gegen eigene Modellreferenz, echte Mitgliedsanomalien und alle Monatslabels. Keine erfundenen Referenzen oder Kalibrierung.

## v0.9.85.163 · Skybar-Kohärenz und Prognoseinstrumente
Basis main = mid-stable = 0f8f871d5a69d0c8293445894f0f759e653bcce5 (.162). Lokale Wolkendeltas auf native Viertelstunden übertragen; Modell-Sonnenschein bei Änderung ab einem Okta als fehlend kennzeichnen. Keine Wolkenkomplement-Sonnenscheindauer. Gemeinsame runde Skalen und platzabhängige Monatslabels.

## v0.9.85.162 · MID-C15 Horizonte und echte Saisonmitglieder
Basis main = mid-stable = c8c2a4f98892b97a104c43575dedbecd23af439f (.161). Entwicklung/Unsicherheit statt identischer Horizontkalender, echte SEAS5-Mitgliedsmonate und Einheitenkorrektur. Fachlicher Vertrag: docs/implementation/MID_C15_HORIZON_CONCEPT_0.9.85.162.md. Keine kalibrierten Wahrscheinlichkeiten aus Modellstreuung oder ERA5-Differenzen behaupten.

## v0.9.85.161 · MID-C15 sichtbare Nachtstunden und 12h-Skybar
Basis main = mid-stable = 248987161638f06f7d315882aff988fd95e0de71 (.160), live www.midwx.app/version.json geprüft. Gemeinsamer SVG-Nachtfarbtoken --mid-night-band-color mit opakem Fallback und einmaliger Deckkraft. Der 12h-Wetterstreifen erhält die volle 16-px-SVG-Höhe wie 90 min.

## v0.9.85.160 · MID-C15 optionale ECMWF-Palette und gemeinsamer Linienvertrag
Basis main = mid-stable = 6133022f71dffade571c8e94909ec4b2298462ca (.159), live www.midwx.app/version.json geprüft. Gespeicherte 7d-ECMWF-Option für Tageskarten und Stundenkurve, unabhängige Gradienten-IDs. src/parameterLineStyle.ts ist autoritativ für tatsächlich gerenderte 24h-/7d-Linien. Frühere statische Strich-/Breitenvorgaben dürfen diesen gemeinsamen Vertrag nicht überschreiben.

## v0.9.85.159 · MID-C15 gemeinsame Widget- und Skybar-Darstellung
Basis main = mid-stable = 992712a32d10009e27e83aa04e114134e7b1e4ec (.158). Shared Renderer für echte Temperaturquartile und astronomische Nachtflächen in App und Widget; gleiche Daten-/Einstellungseingänge, Exportbereitschaft nach abgeschlossenem Ensembleabruf. 90-Minuten-Skybar ohne vertikale 12/16-Stauchung: vier Stufen wie im 24h-Profil.

## v0.9.85.158 · MID-C15 sichtbare Tagesfarben
Basis main = mid-stable = b651d589886ac967a13ce4571a3259dbef9b03d6 (.157). 7d-Kurve, Legende und Tmin/Tmax verwenden die tatsächlich gerenderten 24h-Parameterfarben. Der bisherige Stopps-Vergleich erkannte die CSS-Übersteuerung im Referenzdiagramm nicht.

# MID – verbindliche Codebasis

## v0.9.85.157 · MID-C15 Tagesdiagrammfarben und Wartungsprüfung

Basis main = mid-stable = 922a78191d9ff50f3858d857f00ef3f811ac96f1 (.156). Gemeinsamer UTCI-Farbtoken im tatsächlichen Tagesdetail und 24h-Profil; Unit-Tests im Coverage-Workflow einmal statt zweimal. Keine Gate- oder Regressionsstreichung. Prüfung: docs/implementation/MID_C15_MAINTENANCE_0.9.85.157.md.


## v0.9.85.156 · MID-C14 Vorhinweise bis Tag 7 und Diagrammfarben

Basis main = mid-stable = 49d169f04b52ba9dc0a33750d621a1522b837487 (.155). Fachlich abgesicherte Regen-/Schnee-/Böenbewertung ausschließlich bis +168 h. Getrennte ECMWF-Böenergänzung, Ergebnis-Cache über Worker-Neustarts und vereinheitlichte 24h/7d-Farben. Details: docs/implementation/MID_C14_SEVEN_DAY_OUTLOOK_COLORS_0.9.85.156.md.


## v0.9.85.155 · MID-C13 reale Langfrist-Ensemblefelder

Basis main = mid-stable = 2b380aefc25239b86838e9f4afb83865b11b90f6 (.154). Parallelkorrekturen .153/.154 vollständig erhalten. Reale ICON-EPS-Mitglieder statt leerer Mean/Spread-Felder; pro Gefahr vollständige Tagesabdeckung, fehlende Böen ausdrücklich keine Entwarnung. Details: docs/implementation/MID_EXTREME_MEMBERS_0.9.85.155.md.

## v0.9.85.152 · MID-C13 Skybar-Intervallkonsistenz

Basis main = mid-stable = d6d7e0e5d5f6fb20a0e3dbaaf2351ed93c1857bc (.151). Der kontinuierliche Profilstreifen verwendet dieselben finalisierten Viertelstunden wie 90 min, statt deren Bewölkung vorher stündlich zu mitteln. Stundenquadrate bleiben aggregiert. Fehlende Kurzfristzustände sind keine Nullwerte. Details: docs/implementation/MID_SKYBAR_INTERVALS_0.9.85.152.md.

## v0.9.85.151 · Warnhorizonte

Basis main = mid-stable = 0d9205720c177243a2dec3f4f8169216cc620162 (.150). Bestehende Karten-/Bottom-Bar-Änderungen bleiben erhalten. Gestaffelte Hinweise und separater regionaler ICON-EPS-Ausblick 48–168 h. Details: docs/implementation/MID_WARNING_HORIZONS_0.9.85.151.md.

## v0.9.85.150 · iOS Bottom-Bar-Verankerung

Basis main = mid-stable = e6386ca6ed8fbab563261e7b78a96ea15e015c17 (.149). Karten-/Einheiten-/Ortswertänderungen bleiben vollständig erhalten. Nur schmale iOS-Flächen erhalten einen rAF-geführten Dokumentanker gegen WebKit-Fixed-Layer-Versatz. Desktop/Tablet behalten die bestehende feste Navigation. Details: docs/implementation/MID_BOTTOM_BAR_ANCHOR_0.9.85.150.md.

## v0.9.85.149 · Runde Kartenskalen und temporäre Ortswerte

Basis main = mid-stable = c578a947e02a6d06638870d5d762c16ecb9be8bf (.148). Gerundete Skalen umfassen alle Werte; feste absolute Anker bleiben unverändert. Einheitenbewusste Grenzen, echte Skalenpositionen für beschriftete Zwischenwerte und temporäre Kartenabfrage nutzen die kanonischen Raster- und Formatfunktionen. Portal, Außenklick und Escape bleiben in AppPortalPopover. Details: docs/implementation/MID_MODEL_MAP_PROBE_0.9.85.149.md.

## v0.9.85.148 · Einheiten und kontinuierliche Kartenfarben

Basis main = mid-stable = e28fdd42a3e68decf4b2671d3cd71751a3e711af (.147). Die parallel veröffentlichten .146/.147-Änderungen an Sonnen-/Mondzeilen, Bergwettertabelle, unterer Navigation und Kartenbereich bleiben erhalten. Der unveröffentlichte Parallelstand e3d9f7ac2567b66bfbd0f769ffc5fa5d415eb5fb ist gezielt abgeglichen; die Navigation bleibt über ein Portal und ihren bisherigen CSS-Namensraum fest am Viewport. Wind-/Böen-Ortswerte, Legenden und PNG/SVG folgen der bestehenden Einstellung über den kanonischen Windformatter. Native numerische Raster und Niederschlagssummen verwenden eine gemeinsam berechnete stufenlose Wertebereich-/Festskala; Animationen bleiben fest skaliert. Wettercodes, Datenlücken und Trockenheit werden nicht numerisch umgefärbt. Details: docs/implementation/MID_MODEL_MAP_UNITS_COLORS_0.9.85.148.md.

## v0.9.85.145 · MID-C12 Unterscheidbare Prognoseansichten

Basis main = mid-stable = 3951e8ce58239634ed48b4f13e5a58ee23c73c91. Spurenmengen vollständig lesbar, sichtbare Grenzwerte ohne P25/P75-Präfix, kombinierte 7d-Temperaturdarstellung und eigenständige 14d-Ensemble-Hierarchie. Details: docs/implementation/MID_FORECAST_VIEWS_0.9.85.145.md.

## v0.9.85.144 · MID-C12 Wochenunsicherheit, Trend und Karten

Basis main = mid-stable = 8e511937458ce06808f0487ce1c61441e87fe360. Tatsächliche stündliche Mitglieder aus den bestehenden Ensembleabrufen, keine Tagesinterpolation. Niederschlagsbeginn am Tag bleibt im Trendtext. Direkte DWD-Kartenaufbereitung unterscheidet relative Feuchte und Bedeckungsgrad. Details: docs/implementation/MID_WEEKLY_UNCERTAINTY_0.9.85.144.md.

## v0.9.85.143 · kompakte Unsicherheit

Basis .142: 4282232533fc70545d9b64676a9de1b4839f1b2e. Details: docs/implementation/MID_COMPACT_UNCERTAINTY_0.9.85.143.md. Echter P50 derselben gewichteten Verteilung statt Einzelwert/Mittelwert; fehlende P50 bleiben ohne Marker. Böen, kompakte Bänder, Tmax/Tmin-Farbtrennung. Stündliches P25–P75 nur aus tatsächlichen zeitgleichen Warnungsensemble-Quantilen, keine Tagesquantil-Interpolation.

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


## v0.9.85.142 · MID-C11 Verlustfreies Kartenbudget

Ausgangsbasis: veröffentlichte .141, main = mid-stable = ff2e310d107a745468d788fcec678693d507a68d. Native ICON-D2-Felder werden verlustfrei als gzip-JSON .bin-Objekte publiziert; Index deklariert encoding, komprimierte und entpackte Bytezahlen sowie SHA256. Client prüft Hash und Größen vor/nach begrenzter Inflation, mit nativem Stream oder Lazy-pako-Fallback. Legacy-JSON bleibt kompatibel. Das bestehende 900-MB-Limit wird nicht erhöht. Dieselbe Pflichtregression testet zusätzlich beide Decoder, Integrität und komprimierte Browserdarstellung. Datenprodukte erscheinen mit erfolgreicher regulärer RUC-Aufbereitung.

## v0.9.85.141 · MID-C11 Adaptive Prognosen und native Wetterkarten

Verifizierte .140-Basis main = mid-stable = 87875585c773edf5fcb508cbe3466c7f98c08481. Parameterbezogene Quantilbänder, keine aus Tageswerten erfundenen Stundenintervalle. Gefallener Niederschlag aus nicht überlappenden RADOLAN RW-Stunden; unbekannte Zellen bleiben grau/unbekannt. ICON-D2-Kombinationen wechseln vom groben API-Punktraster zu direkten vollen DWD-GRIB2-Feldern, ergänzt um Temperatur/Wind/Böen/Bewölkung/Druck. Gemeinsame Quellen-/Zeit-/Ortswert-/Exportverträge. Andere Modelle bleiben WMS; nicht gelistete WW-Karten werden nicht angeboten. Kostenlose bestehende Pages-Pipeline, immutable SHA256-Objekte, kein manueller Stable-Push. Neue Datensätze benötigen eine erfolgreiche reguläre RUC-Aufbereitung nach Release.

Required regression: scripts/test-adaptive-native-maps-0985141.mjs; Details: docs/implementation/MID_ADAPTIVE_NATIVE_MAPS_0.9.85.141.md.

## v0.9.85.140 · MID-C11 Radar kompakt und native RV-Daten

Verifizierte Ausgangsbasis: `main == mid-stable == fe87c0f296be0475153fb1326977d9a23df74025` (veröffentlichte .139). Keine überlappende offene Agent-PR. Live-Bright-Sky-RV nutzt `RADARCOMP::RV`; .139 verwarf diese Kennung. Beide gültigen RV-Kennungen werden akzeptiert. Vollständige native 24-Schritt-Prognosen benötigen keine WMS-Diagnostik; Zusatzbeobachtungen dürfen ihre Mengen und Referenzzeit nicht überschreiben.

Die globale `.top`-Headerregel erzeugte auf der oberen Radar-Rasterlinie eine leere Pille. Der isolierte Chart setzt Rasterlinien auf Höhe 0, ohne Hintergrund/Padding. Browser-QA enthält nun das echte CurrentNowcards-Umfeld und prüft explizit Rasterliniengeometrie, Notizen, Summen, Balken und Scrubberanker in 24 Varianten. Wortlautregressionen wurden auf die beauftragte kompakte Phasenform angepasst; Zeitintervalle und Datenlückenverträge bleiben geprüft.

## v0.9.85.138 · Radarintensität, Niederschlagsstufen und UTCI appweit

Ausgangsbasis ist der vollständig veröffentlichte Stable-Stand `main == mid-stable == b013e6664966111fa2c466ba8cabb3520421b435` (v0.9.85.137). Die Radar-Nowcast-Grafik verwendet für ihre `mm/5 min`-Balken die native Zeitschrittintensität; die separate final kalibrierte Mengenreihe bleibt für vollständige/partielle 120-Minuten-Summen maßgeblich. Niederschlagsintensitätstexte werden aus `precipitationIntensityDescriptor` abgeleitet, sodass sichtbare Rate und Textstufe denselben Intervallvertrag verwenden.

UTCI ist der kanonische appweite Außenkomfortindex. Stündliche Reihen werden nach lokalen Forecast-Korrekturen neu berechnet; Kurzfrist, Profil/Cockpit, Event, Wasser und Bergwetter konsumieren denselben UTCI-Pfad. Tmrt wird bei fehlendem Direktfeld aus UVI, Bewölkung, Tageszeit und Höhe geschätzt; Standard-UTCI-Stressgrenzen bleiben in `src/utci.ts` zentral.

Required Regression: `scripts/test-radar-utci-consistency-0985138.mjs`. Implementierungsnachweis: `docs/implementation/MID_RADAR_UTCI_CONSISTENCY_0.9.85.138.md`.

## v0.9.85.137 · Radar-Fünfminutenwerte und gemeinsame Modellkarten

Basis: `main == mid-stable == 82fe63ea483afe74c264c15b6978726f9cb47143` (veröffentlichte v0.9.85.136). Aktive Agent-/Replit-PRs vor Beginn abgeglichen. Direkter DWD-RV-Pfad korrigiert, keine neue kostenpflichtige Quelle. Die ausdrücklich beauftragte Zusammenführung ersetzt drei Kartenreiter durch zwei und macht Summen zum ICON-D2-Kartenprodukt. Rechen-/Zeitintervall- und Geografieverträge: `docs/implementation/MID_C11_RADAR_MODEL_MAPS_0.9.85.137.md`. Die betroffenen historischen UI-Tests wurden an diesen neuen Vertrag angepasst; das vollständige Regressioninventar bleibt verbindlich.

## v0.9.85.136 · Modellabdeckung und Regressionen

Basis: `main == mid-stable == f5bcc165012597bb2320d211f43e6a6f75573096` (v0.9.85.135). Die Außenmaske übernimmt das gekrümmte rotierte ICON-D2-Grenzpolygon der bestehenden Analyse. Alle 894 automatisch erkannten Regressionen bleiben erhalten; beide Baseline-Listen werden auf das vollständige Inventar konsolidiert und im Runner auf Drift geprüft. Keine Assertions gestrichen.

## v0.9.85.135 · Unveränderliche ICON-D2-Kartenobjekte

Basis: veröffentlichte v0.9.85.134, `main == mid-stable == 5260c83caf82ccf2cf73c68973f4ca411f086639`. Die unabhängigen ICON-D2-Summen verwenden im bestehenden Pages-Manifest zusätzlich ihren Datei-Hash im Objektpfad. Dadurch kann ein neuer ICON-Lauf bei gleichem RUC-Lauf keine ältere Karten-URL mutieren. Alle Kartenfunktionen und Quellen bleiben erhalten.

## v0.9.85.134 · DWD-Niederschlagssummen im gemeinsamen Kartenbereich

Basis: verifizierter Stable-Stand v0.9.85.133, `main == mid-stable == 33cae56be8740c7bae3fed3754f6d4467c7655a4`. Selektiver Replit-Handoff `54a16f4c1aef264f4416db667a0217039075818b` für Navigation/Darstellung, ergänzt um den geprüften DWD-Datenpfad und Exporte.

Direkte ICON-D2-Open-Data-GRIBs: TOT_PREC ab T+0 desselben Laufs für 6/12/24/48 h. Bestehender RUC-/Pages-Snapshotpfad erhält das unabhängige Kartenprodukt. Keine Punkt-API-Interpolation und keine Verlängerung des RUC-Horizonts. Bright Sky ist kein vollständiger ICON-D2-Rasterersatz.

## v0.9.85.133 · Niederschlags-, Pollen- und Navigationskonsistenz

Basis: verifizierter Stable-Stand v0.9.85.132, `main == mid-stable == 3816a4332f90be6b73fd04b33bfa46e7918ac66b`.

- Radar: fehlende DWD-RV-Zeitschritte sind explizite Datenlücken und keine Trockenmeldung.
- Niederschlagsdauer: die sichtbare Fortsetzung hinter +2 h wird aus der kanonischen 24-h-Zeitreihe einschließlich mehrerer Phasen abgeleitet.
- Niederschlagsart: Intervallmengen werden mit ihrer tatsächlichen Dauer bewertet; aktuelle lokale Niederschlagsart darf die unmittelbare Kurzfrist stützen.
- Pollen: lokales Kalenderdatum und DWD-Produktzeit sind maßgeblich.
- Navigation: gespeicherter Primärbereich ist beim Start autoritativ; Untermodul und Forecast-Horizon dürfen ihm nicht widersprechen.
- Die Informationsarchitektur des Gesundheitswetters bleibt für einen separaten Replit-Design-Handoff offen und wird in diesem funktionalen Build nicht eigenmächtig verschoben.

## v0.9.85.132 · Kanonische Niederschlags-Zeitsemantik

Ausgangsbasis ist der vollständig veröffentlichte und verifizierte Stable-Stand `main == mid-stable == eb1f8e5bd4dce82a1af18c762a054d5184e51806` (v0.9.85.131).

Niederschlagsaussagen mit Beginn/Ende werden aus einer gemeinsamen intervallbewussten Zeitreihe abgeleitet. Open-Meteo-Akkumulationen bleiben im Rechenkern am Intervallende, werden für sichtbare Aussagen jedoch über die bestehenden `precipitationPresentation*`-Verträge auf den Vorwärtsslot gelegt. Die finalisierte 15-Minuten-Reihe hat Vorrang, sofern sie den gesamten Kurzfristhorizont abdeckt; andernfalls wird vollständig auf die normalisierte Stundenreihe zurückgefallen. Wahrscheinlichkeiten ohne messbare Menge definieren keine sichere Niederschlagsdauer.

Implementierungsnachweis: `docs/implementation/MID_PRECIPITATION_TIMING_0.9.85.132.md`.

## v0.9.85.131 · C11-Kartenstand und Radar-Nowcast-Startpfad

Ausgangsbasis ist der vollständig veröffentlichte und verifizierte Stand `main == mid-stable == 0daf09160c8f9de514d3fbb3d78c03df275604d1` (v0.9.85.130) plus der SHA-verifizierte Replit-Handoff `replit/v0.9.85.131-map-timeline-Handoff@37e726c7be865402f4ee348c8b732233e98430fb`.

Der C11-Handoff vereinheitlicht die responsive Zeitsteuerung der Kartenansichten. Zusätzlich wird der Startpfad der Radar-Nowcast-Auswertung beschleunigt. Eine ausgedünnte Schnellserie darf fehlende 5-Minuten-Zeitschritte nicht als trockene Radarwerte interpretieren. Die vollständige Darstellung bleibt an die exakte DWD-5-Minuten-Punktserie gebunden; echte Trockenphasen werden ausschließlich aus tatsächlich trockenen Zeitschritten abgeleitet. Die Sichtbarkeitsregel bleibt unverändert: Die Radar-Nowcast-Grafik erscheint nur bei relevantem Niederschlagsecho am Standort oder im Umfeld.

Implementierungsnachweis: `docs/implementation/MID_C11_RADAR_STARTUP_0.9.85.131.md`.

## v0.9.85.130 · Gesundheitswetter-Sichtbarkeit und Primärnavigation

Ausgangsbasis ist der vollständig veröffentlichte und verifizierte Stand `main == mid-stable == c1db743f987cdf7ced34f9ff8c65b7c87d69fc5e` (v0.9.85.129).

Der reale Smartphone-Screenshot zeigte, dass „Gesundheitswetter“ trotz vorhandener React-Struktur nicht sichtbar war. Ursache war ein CSS-Split-Vertrag aus Arbeitspaket I: Für `settings-split-navigation` wurde die gesamte `.settings-section` ausgeblendet und ausschließlich die Modulreihenfolge eingeblendet. Damit verschwanden sowohl `settings-health-weather` als auch die navigationseigenen optionalen Inhaltsmodule. v0.9.85.130 zeigt im Navigation-Tab gezielt nur diese navigationseigenen Optionslisten und anschließend die Modulreihenfolge. Pollenflug bleibt separat und persistent ein-/ausschaltbar.

Für die Bottom-Bar wird die bestehende Untermodul-Persistenz um einen expliziten Primärbereich ergänzt: Aktuell, Heute, Vorhersage, Karten und Mehr. Das ist besonders für „Mehr“ erforderlich, weil ein Drawer kein DashboardModuleId besitzt und durch `mid:last-dashboard-section:v1` allein nicht wiederhergestellt werden konnte. Explizite `#mid-section-…`-Deep-Links werden beim Start nicht mehr durch die Modul-Initialisierung entfernt und behalten Vorrang vor dem gerätelokal gespeicherten Bereich.

Required Regression: `scripts/test-health-settings-primary-navigation-0985130.mjs`.
Implementierungsnachweis: `docs/implementation/MID_HEALTH_SETTINGS_PRIMARY_NAV_0.9.85.130.md`.

## v0.9.85.129 · Gesundheitswetter/Pollen kompakt

Ausgangsbasis ist der vollständig veröffentlichte und verifizierte Stand `main == mid-stable == 0007f5e4b0e155308950f8b098aeac0bffd9ceee` (v0.9.85.128).

Der reale Smartphone-Sichtvergleich zeigte zwei voneinander getrennte Probleme: Die Pollenkarte war durch den großen Kopf und die vollständige 8×3-Tabelle unverhältnismäßig hoch; gleichzeitig wurde die amtliche DWD-Zwischenstufe „keine bis gering“ in der kompakten Zusammenfassung fälschlich wie „keine Belastung“ behandelt. Ursache war eine UI-Zuordnung, die nur vier Textstufen kannte, obwohl der DWD-Pollenflug-Gefahrenindex sieben Legendenstufen 0, 0–1, 1, 1–2, 2, 2–3 und 3 verwendet.

v0.9.85.129 führt daher eine progressive Informationshierarchie ein: Standardzustand mit heutiger Belastung, Region und DWD-Stand; erste Detailstufe mit maximal vier in den nächsten drei Tagen relevanten Pollenarten, nach höchster 3-Tage-Stufe priorisiert; vollständige acht Arten erst nach expliziter Nutzeraktion. Die DWD-WFS-Datenquelle, die 27 Gebiete, die acht Pollenarten und die gelieferten Vorhersagewerte werden nicht verändert.

Die fachliche Auswertung erkennt die DWD-Zwischenstufen einschließlich sprachlicher Varianten und nutzt `POLLENINT` nur als defensiven Fallback. Damit wird „keine bis gering“ als Zwischenstufe > 0 priorisiert, ohne amtliche Werte neu zu berechnen.

Required Regression: `scripts/test-pollen-compact-dwd-levels-0985129.mjs`.
Implementierungsnachweis: `docs/implementation/MID_POLLEN_COMPACT_DWD_LEVELS_0.9.85.129.md`.

## v0.9.85.128 · MID 18.2.20 Screenshot-/Security-Nachgang und Gesundheitswetter

Ausgangsbasis ist der vollständig veröffentlichte `mid-stable`-Commit `479d6d55322dc33f03aad868e35f2d6ee0f9197f` (v0.9.85.127). Dieser Wartungsbuild löst die im GitHub-Audit sichtbaren CodeQL-/Dependency-/Action-Befunde soweit kompatibel und fail-closed auf und ordnet Pollenflug als eigenes optionales Gesundheitswetter-Modul ein.

Die DWD-Pollenquelle, Pollenarten, Belastungsbegriffe und Vorhersagewerte werden fachlich nicht verändert. In der kompakten Aktuell-Ansicht werden lediglich vorhandene aktive Belastungen nach bestehender Stufe priorisiert; bei ausschließlich `keine` wird eine neutrale Zusammenfassung gezeigt. Die Detailansicht bleibt eine Drei-Tage-Darstellung der bereits gelieferten Werte. Amtliche Wetterwarnlogik, Modellfusion und übrige meteorologische Datenquellen bleiben unverändert.

Sicherheitsseitig wird eine nichtnumerische externe Warnwahrscheinlichkeit nicht mehr ungeprüft sichtbar weitergereicht. Der visuelle Bergwetter-Test übergibt Selektoren und Theme-Werte strukturiert an CDP statt sie in ausführbaren Seitencode einzubauen; der Chromium-Debug-Port wird lokal reserviert statt aus `DevToolsActivePort` in eine URL übernommen. `brace-expansion` wird innerhalb der bestehenden kompatiblen 5.x-Transitivreihe auf 5.0.12 angehoben. Der getrennte `uuid@7.0.3`-Tooling-Befund wird nicht per inkompatiblem Override erzwungen.

Required Regression: `scripts/test-security-pollen-maintenance-0985128.mjs`. Detaildokument: `docs/implementation/MID_SECURITY_POLLEN_MAINTENANCE_0.9.85.128.md`.

## v0.9.85.127 · Repository-Hygiene und Versionssynchronisierung

Ausgangsbasis ist der vollständig veröffentlichte `mid-stable`-Commit `81d2bfb9d872ba97f4e2a3fec82e92a6f8aefab0` (formal v0.9.85.126). Die in PR #208 integrierten Pollen-/Hook-/Qualitätsindikator-Korrekturen sind dort bereits enthalten, die Versionsspiegel waren jedoch nicht auf v0.9.85.127 angehoben. Dieser Build synchronisiert Version, Baseline, README und Changelogs und ergänzt Repository-/Governance-Härtungen. Meteorologische Fachlogik, Warnschwellen, Modellfusion und Datenquellen bleiben unverändert.

Required Regressions: `scripts/test-repository-hygiene-0985127.mjs`, `scripts/test-contract-registry-0985127.mjs`, `scripts/test-branch-cleanup-safety-0985127.mjs`, `scripts/test-knmi-workflow-consolidation-0985127.mjs`. Detaildokument: `docs/implementation/MID_REPOSITORY_MAINTENANCE_0.9.85.127.md`.

## v0.9.85.116 · MID 18.2.24 deutlichere Nachtstunden im Dark-Design

Ausgangsbasis ist der vollständig veröffentlichte `mid-stable`-Commit `218e6d40960c78672dd975159f9eb49973f65ddc` (v0.9.85.115). Die gemeinsame Nachtstundenkennzeichnung verwendet nun eine Theme-spezifische Deckkraft: Light bleibt bei 0,20, Dark wird auf 0,32 angehoben. Die Änderung gilt konsistent für 12-h-Temperaturtrend/Skybar, Now90-Skybar und 24-h-Wetterprofil. Sonnengeometrie, weiche Dämmerungsübergänge, Wetterfarben, meteorologische Schwellen und Datenquellen bleiben unverändert.

Required Regression: `scripts/test-mid-18-2-24-dark-night-band-0985116.mjs`. Detailvertrag: `MID_DARK_NIGHT_BANDS_0.9.85.116.md`.

## v0.9.85.115 · MID 18.2.23 Temperaturtrend-Kohärenz und Bergstunden 12 h

Ausgangsbasis ist der vollständig veröffentlichte `mid-stable`-Commit `9e81bcb21f3dbcdedc8d76fffc038a5e0b1a7ae2` (v0.9.85.114). Die hyperlokale Temperaturassimilation verwendet nun den feldspezifischen Beobachtungszeitpunkt und bestimmt den Modellwert am Messzeitpunkt durch Interpolation zwischen den benachbarten Stunden. Eine lokale Temperaturabweichung wird danach glatt und begrenzt zurückgeführt; das Ausblenden der Korrektur darf in der unmittelbaren Assimilationsphase einen belastbaren Modell-Stundentrend nicht allein in die Gegenrichtung drehen. Damit wird insbesondere eine durch die frühere lineare 120-Minuten-Rückführung mögliche synthetische Erwärmung zwischen benachbarten Stunden vermieden. Die sichtbare +12-h-Karte bleibt reiner Verbraucher derselben kanonischen finalisierten Stundenreihe.

Im Berg-/Wintersportmodul zeigt die horizontale stündliche Höhenprognose ab diesem Stand ausschließlich die nächsten **12 Stunden** und höchstens zwölf Stundenwerte. Die 7-Tage-Prognose sowie eigenständige 24-h-Schneeakkumulationen bleiben unverändert. Damit ist die in v0.9.85.108 definierte sichtbare 24-h-Stundenleiste für die aktuelle UI ausdrücklich abgelöst.

Required Regression: `scripts/test-mid-18-2-23-temperature-trend-mountain-12h-0985115.mjs`. Detailvertrag: `MID_TEMPERATURE_TREND_MOUNTAIN_0.9.85.115.md`.

## v0.9.85.114 · MID 18.2.22 responsiver Audit-Nachgang

Ausgangsbasis ist der erfolgreich promotete `mid-stable`-Commit `6371acec8458234283f8a31e29744bb222a7f9a2`. Der mobile 7-Tage-Trend darf vollständig umbrechen; die mobilen Kartenkopfzeilen ordnen Titel und Status in getrennte Zeilen; der automatische PWA-Hinweis erscheint bei ausgewähltem Wetterstandort nicht über dem Inhalt. Die Installationsaktion im Kopf bleibt verfügbar. Fachlogik bleibt unverändert. Detailvertrag: `MID_MOBILE_LAYOUT_0.9.85.114.md`.

## v0.9.85.113 · MID 18.2.21 Auditkorrekturen für Bedienbarkeit

Der Ausgangspunkt ist `mid-stable` `dc1975c3ccf99e9b749393874a48147618f6e73e`. Die gezielte Auditkorrektur stellt das Kurzfristdetail im obligatorischen Next-Design wieder her, vergrößert die Touch-Ziele der Wetterkartensteuerung, verbessert die Lesbarkeit der Szenario-Kurzlabels und macht Karten-Standortinformationen auf Touchgeräten und per Tastatur verfügbar. Die Hauptnavigation wird als Landmark ausgezeichnet. Meteorologische Fachlogik und Warnstufen bleiben unverändert. Detailvertrag: `MID_AUDIT_UI_ACCESSIBILITY_0.9.85.113.md`.

## v0.9.85.112 · MID 18.2.20 Kartensteuerung und 7-Tage-Desktopausrichtung

Der gegen die verifizierte Basis `a6afde4ce9e38965ea484a0c9c81b95bdd3dc2af` geprüfte Replit-Handoff `3148e8f3a66b433746bfe37452c786f01bec6499` vereinheitlicht ausschließlich die sichtbare Kartensteuerung und korrigiert die Desktopgeometrie der 7-Tage-Kurvenübersicht. Zoom, Position und Layersteuerung verwenden auf mobilen/touchbasierten Layouts konsistente Touch-Ziele, Abstände und eine gemeinsame rechte Kante. Die sieben Tagesbereiche unter der Kurve werden auf Desktop gleichmäßig und entlang derselben Plotgrenzen wie die gemeinsame Zeitachse angeordnet.

Meteorologische Logik, Datenquellen, Warnschwellen und fachliche Forecastverträge bleiben unverändert. Responsive Zielmatrix: 390×844, 430×932, 412×915, 834×1194, 1194×834 und 1440×900, jeweils Light/Dark. Required Regression: `scripts/test-mid-18-2-20-map-seven-day-alignment-0985112.mjs`. Detailvertrag: `MID_MAP_SEVEN_DAY_ALIGNMENT_0.9.85.112.md`.

## v0.9.85.111 · MID 18.2.19 robuste API-Vertragsrevision

Die automatische Revision bleibt für kritische externe Datenverträge fail-closed, wiederholt jedoch ausschließlich eindeutig transiente Abruffehler begrenzt. Transportfehler sowie HTTP 408, 425, 429 und 5xx dürfen bis zu dreimal mit begrenztem Backoff erneut versucht werden. Erfolgreiche 2xx-Antworten werden inhaltlich nur einmal bewertet; ein fachlich ungültiger Payload wird nicht durch Wiederholung kaschiert. Nicht-transiente 4xx werden nicht erneut angefordert.

Hintergrund ist der wiederholte gleichzeitige `fetch failed`-Befund der automatischen Revision nach v0.9.85.110, obwohl vollständige Regression, Dependency-Audit und Build-Budget bestanden. Die Härtung betrifft ausschließlich die Prüfautomatik und ändert keine Wetter-, Berg-, Worker- oder UI-Fachlogik.

Required Regression: `scripts/test-api-contract-retry-0985111.mjs`. Detailvertrag: `MID_API_CONTRACT_RETRY_0.9.85.111.md`.

## v0.9.85.110 · MID 18.2.18 Bergwetter-Datenqualität und Höhenquellen

Die Berg-/Wintersportsektion verwendet Open-Meteo Best Match weiterhin als vollständige 7-Tage-Basis. Für den kurzfristigen Höhenvergleich wird dort, wo ein belastbares hochaufgelöstes Regionalmodell verfügbar ist, ein einziges Regionalmodell für alle konfigurierten Höhenpunkte verwendet. Dadurch werden Tal-/Mitte-/Berg-Unterschiede nicht durch unbeabsichtigte Modellwechsel zwischen den Höhenstufen erzeugt. In Österreich gilt GeoSphere AROME Austria als bevorzugter Kurzfristpfad, in Deutschland DWD ICON-D2, in der Schweiz MeteoSwiss ICON-CH1 und in Frankreich Météo-France AROME HD. Fehlende Regionalmodellfelder fallen feldweise auf die Best-Match-Basis zurück.

DWD ICON-D2-RUC bleibt im Bergmodul ein standortbezogenes 15-Minuten-Kurzfristsignal für die Höhenzonenanalyse. Solange keine getrennten RUC-Reihen für Tal, Mitte und Berg vorliegen, darf RUC nicht als höhenaufgelöster Wert ausgegeben oder auf die einzelnen Niveaus kopiert werden.

Niederschlag wird nicht künstlich mit der Höhe skaliert. Räumlich getrennte Höhenpunkte können aufgrund von Anströmung, Luv/Lee, Konvektion und Modellorographie unterschiedliche oder sogar im Tal höhere Mengen zeigen. Bei merklich horizontal versetzten Profilpunkten wird dieser Sachverhalt in der UI erklärt. Neuschnee bleibt eine eigenständige Intervallgröße; fehlende Werte werden nicht als 0 cm erfunden.

Tageszeilen der Höhenprognose sind Tageszusammenfassungen und verwenden daher ausschließlich Tagespiktogramme. Der repräsentative Zustand wird bevorzugt aus Tageslichtperioden gewählt; die geöffneten 3-Stunden-/Stundenwerte behalten astronomisch korrekte Tag-/Nacht-Symbole. In der Sommerdarstellung wird ein redundantes tägliches 0-cm-Neuschneefeld ausgeblendet.

Required Regressions: `scripts/test-mountain-data-quality-0985110.mjs`, `scripts/test-mountain-visual-acceptance-18213.mjs`, `scripts/test-mid-18-2-16-mountain-redesign-0985108.mjs`, `scripts/test-mountain-seven-day-domain-1813.mjs`. Detailvertrag: `MID_MOUNTAIN_DATA_QUALITY_0.9.85.110.md`.

## v0.9.85.109 · MID 18.2.17 Bewölkungs- und UVI-Konsistenz

Der aktuelle trockene Himmelszustand besitzt nur noch eine kanonische Bewölkungsklasse. Hauptzustand, Wetterpiktogramm und Bewölkungskarte werden auf denselben dargestellten Oktas-Wert zurückgeführt; ein trockener Modell-Wettercode darf daher nicht mehr „Bedeckt“ anzeigen, wenn die gleichzeitig dargestellte Gesamtbewölkung beispielsweise 6/8 ergibt. Belastbare Sicht-/Nebel- oder Niederschlagsphänomene dürfen die reine Bewölkung weiterhin fachlich übersteuern.

Für direkte Bewölkungsbezeichnungen gilt app-weit die DWD-Systematik: 0/8 wolkenlos, 1–3/8 leicht bewölkt bzw. tagsüber heiter, 4–6/8 wolkig, 7/8 stark bewölkt, 8/8 bedeckt. Die bestehende Schutzregel für kontinuierlich hyperlokal analysierte Prozentwerte bleibt erhalten: 8/8 wird dort erst bei vollständiger Bedeckung von 100 % gesetzt.

Die sichtbare Kurzbezeichnung des UV-Index lautet einheitlich `UVI`. Ausgeschriebene fachliche Begriffe wie „UV-Index“, „UV-Schutz“ oder „UV-Gefahrenindex“ bleiben in Erläuterungen unverändert korrekt.

Required Regressions: `scripts/test-cloud-uvi-consistency-0985109.mjs`, `scripts/test-current-hyperlocal-sky-083311.mjs`, `scripts/test-mountain-visual-acceptance-18213.mjs`. Detailvertrag: `MID_CLOUD_UVI_CONSISTENCY_0.9.85.109.md`.

## v0.9.85.108 · MID 18.2.16 stündliche Höhenprognose und aktuelle Bewölkungssemantik

Dieser Stand ersetzt für Berg-/Wintersport den sichtbaren bisherigen `Höhenvergleich` der v0.9.85.107 durch die ausgewählte Höhenstufe als kanonische Prognoseperspektive. Verbindlich sind eine sofortige Skeleton-Vorschau, Tal-/Mitte-/Berg-Auswahl, eine stündliche Prognose der nächsten rund 24 Stunden und kompakte 7-Tage-Zeilen mit höchstens einem inline geöffneten Tagesdetail. Die Formulierung in v0.9.85.107, wonach `Höhenvergleich` die kanonische sichtbare Bezeichnung sei, ist damit für die aktuelle UI ausdrücklich abgelöst.

Der sichtbare Höhen-Kernforecast hat Vorrang vor optionalen Open-Meteo-Anreicherungen; Diagnostik, GeoSphere-Schneemessung und Schneefallgrenzen-Ensemble bleiben progressiv. Wind/Böen, Schnee-/Messungspriorität, DWD-Schneefallgrenzenverfahren sowie die Trennung amtlicher Warnungen von automatischen MID-Hinweisen bleiben fachlich erhalten. Die unteren Berg-/Winterbereiche werden in die ruhige MID-Flächenhierarchie überführt; eine amtliche Lawinenquelle erhält ohne reale Gefahrenstufe keine erfundene Warnfarbe.

Für das aktuelle Wetter wird ein kontinuierlicher hyperlokal analysierter Bewölkungs-Prozentwert nicht mehr durch einfache Rundung zu einer scheinbar diskreten 8/8-Beobachtung. Bei dieser analysierten Prozentdarstellung ist 8/8 „Bedeckt“ vollständiger Bedeckung von 100 % vorbehalten; darunter bleibt die Textklassifikation höchstens 7/8. Direkte diskrete amtliche Beobachtungen werden dadurch nicht umgedeutet.

Der Open-Meteo-Watch vom 27.09.2026 ist in diesen Stand integriert: Der Daily-Kernforecast fordert zusätzlich `moonrise`, `moonset` und `moon_phase` an. Diese Werte werden für den lokalen Kalendertag primär verwendet; die bestehende lokale Astronomieberechnung bleibt als Fallback und für Beleuchtung, Mondalter, Phasenbezeichnung, Neu-/Vollmondabstand und Finsternisse erhalten. Der Worker-Core-Cache trägt deshalb Schema `v4`. Für die heute geprüften DMI-HARMONIE- und CMC/GEM-Pfade wurde kein belastbarer Breaking Change gefunden; Modellkennungen werden nicht auf Verdacht geändert. Detailvertrag: `MID_OPEN_METEO_WATCH_0.9.85.108.md`.

Responsive Zielmatrix: 390×844, 430×932, 412×915, 834×1194, 1194×834 und 1440×900, jeweils Light/Dark. Das stündliche Höhenraster darf intern horizontal scrollen, aber die Dokumentbreite nicht erweitern. Mobile interaktive Ziele bleiben mindestens 44 CSS-Pixel groß.

Required Regressions: `scripts/test-open-meteo-lunar-daily-0985108.mjs`, `scripts/test-mid-18-2-16-mountain-redesign-0985108.mjs`, `scripts/test-current-hyperlocal-sky-083311.mjs`, `scripts/test-mountain-progressive-ui.mjs`, `scripts/test-mountain-visual-acceptance-18213.mjs`, `scripts/test-mountain-persistence-layout-071063.mjs`, `scripts/test-mountain-wind-normalization-071054.mjs`, `scripts/test-pictogram-intensity-snow-depth-098426.mjs`, `scripts/test-mountain-forecast-collapse-08153.mjs`. Detailvertrag: `MID_MOUNTAIN_FORECAST_REDESIGN_0.9.85.108.md`.

## v0.9.85.107 · MID 18.2.15 kompakte Vorhersage- und Bergwetteransichten

MID 18.2.15 übernimmt ausschließlich den gegen `mid-stable` geprüften Replit-Handoff für UI/UX und integriert ihn selektiv über ChatGPT. 7- und 14-Tage-Zeilen werden vertikal verdichtet; Nachtpiktogramme bleiben vollständig sichtbar. In der 14-Tage-Ansicht ist die kanonische `head / sky / meta`-Struktur verbindlich; Sonnenstunden und UVI verwenden die tatsächlich aktive Klasse `cockpit-fourteen-sun-uvi` und dürfen auf kleinen Displays nicht auf Mikrotypografie zusammengedrückt werden.

Im Berg-/Wintersportprofil bleiben Tal-/Mittel-/Bergstufen und meteorologische Berechnung unverändert. Flüssigniederschlag und Schneefall werden visuell getrennt. Die Schneefall-Flächenstaffelung skaliert ausschließlich die dargestellte 3-h-Schneemenge und ist ausdrücklich **keine** amtliche WMO-/DWD-Warn- oder Intensitätsschwelle. Amtliche Warnungen bleiben klar von automatischen MID-Hinweisen getrennt; lange Beschreibungen werden sekundär über Details angeboten. Die amtliche Lawinenlage wird nur als Quellen-/Statusblock verlinkt; MID erfindet keine Gefahrenstufe. `Höhenwetter-Verlauf` bleibt entfernt, `Höhenvergleich` ist die kanonische Bezeichnung.

Der ChatGPT/GitHub-Vertrag ist auf den aktuellen Source-first-Veröffentlichungsweg harmonisiert: normaler Agentweg = Source-PR-Gate → kontrollierter Merge → serverseitiges `MID-professional-replacement.zip` → Installer → Worker/Pages-Prüfung → Stable-Promotion. Ein Release-ZIP im normalen Agent-PR ist unzulässig.

Required Regressions: `scripts/test-chatgpt-github-write-contract-098510.mjs`, `scripts/test-fourteen-day-replit-fluid-grid-098593.mjs`, `scripts/test-mountain-visual-acceptance-18213.mjs`, `scripts/test-mid-collaboration-hardening-0985106.mjs`.

## v0.9.85.106 · ChatGPT↔Replit Collaboration Hardening

ChatGPT ist die alleinige Auftrags-, Prüf- und Integrationsinstanz für MID-Arbeit, die an Replit delegiert wird. Replit bleibt gezielt UI-/Design-Werkbank und beginnt keine eigenständigen MID-Arbeitspakete. Jeder Replit-Stand wird ausschließlich als unprivilegierter `replit/*`-Handoff mit verifizierter Basis-, Commit- und Remote-Ref-SHA übergeben; direkte Änderungen an `main`, `mid-stable`, `chatgpt/*` oder `codex/*` sind unzulässig. Ein fehlender lokaler SSH-Deploy-Key wird nicht durch neue Schreibschlüssel oder gelockerte Hostprüfung ersetzt. Persistente Regeln liegen in `replit.md` und `.agents/skills/mid-handoff/SKILL.md`; Governance-, CI-/Release-, Worker-, iOS-, Versions- und zentrale Build-/Deploy-Dateien sind im Replit-Handoff-Gate geschützt. Veröffentlichung bleibt ausschließlich Source-PR-Gate → kontrollierter Merge → serverseitiges Release-ZIP → Installer → Worker/Pages → Stable-Promotion. Required Regression: `scripts/test-mid-collaboration-hardening-0985106.mjs`. Detailvertrag: `MID_REPLIT_HANDOFF_CONTRACT.md`.


## v0.9.85.76 · Pages-Release-Race-Schutz

RUC- und manuelle Stable-Pages-Publisher dürfen keinen älteren App-Shell-Stand veröffentlichen, während `main` bereits eine neuere MID-Version als `mid-stable` trägt. Der RUC-Publish vergleicht deshalb beim Eintritt in den Pages-Lock und unmittelbar vor dem Upload die Releaseversionen von `main` und `mid-stable`; bei Abweichung wird der Publish fail-closed als No-op übersprungen. Required Regression: `scripts/test-pages-release-race-098576.mjs`. Detailvertrag: `MID_PAGES_RELEASE_RACE_0.9.85.76.md`.

## v0.9.85.75 · MID 18.2.2 obligatorisches Redesign

Die Umschaltung zwischen der neuen MID-Gesamtoberfläche und der bisherigen klassischen Gesamtansicht ist entfernt. Die neue Bottom-/Workspace-Navigation und der moderne Forecast-Arbeitsraum sind obligatorisch; ein alter gespeicherter `mid:designMode:v1`-Wert wird migriert und darf keinen Legacy-Pfad reaktivieren. **Die unabhängige fachliche Auswahl Skybar ↔ 24 Stundenquadrate bleibt ausdrücklich erhalten.** Required Regression: `scripts/test-mid-18-2-2-mandatory-design-098575.mjs`. Detailvertrag: `MID_MANDATORY_REDESIGN_0.9.85.75.md`.

## v0.9.85.74 · RUC-Pages-Budget und fachliche Kadenzpriorisierung

Der kostenlose RUC-Pages-Pfad darf die kombinierte GitHub-Pages-Sicherheitsgrenze nicht durch Vollgitterdiagnostik ausreizen. Zusätzlich zur 950-MB-Site-Grenze gilt deshalb ein **900.000.000-Byte-RUC-Datenbudget**, das bereits in `prepare_ruc_pages.py` geprüft wird. Native 15-Minuten-Zustandsdaten werden im operativen Free-Profil auf `VIS` und `CEILING` konzentriert. `HZEROCL` und `SNOWLMT` bleiben stündlich, weil ihre Entwicklung gegenüber Sicht/Ceiling träger ist und die Niederschlagsphase bereits separat nativ 15-minütig vorliegt. Die 15-Minuten-Solarvollfelder werden im Free-Produktionspfad nicht geladen/publiziert, solange kein sichtbarer MID-Prognoseverbraucher sie nutzt. Für T/TD/RH, MSLP, Wind/Böen und CLCT/CLCL gilt weiterhin der tatsächlich vom DWD veröffentlichten Kadenzvertrag; beim geprüften Lauf waren diese Felder stündlich. Insbesondere darf CLCT nicht als native Viertelstundenfolge bezeichnet werden. Required Regression: `scripts/test-mid-18-2-1-ruc-pages-budget-098574.mjs`.

## v0.9.85.73 · Parameter-native RUC-Kurzfrist

Für die operative 0…+6-h-Prognose gilt die feinste tatsächlich publizierte Parameterkadenz: RUC-Niederschlag 5 min; kurzfristig relevante Zustandsfelder werden nur bei vollständiger nativer Folge als 15-min-`state15` übernommen. Dazu zählen T/TD/RH, MSLP, 10-m-Wind/Böen, CLCT/CLCL sowie – sofern nativ vollständig – CLCM/CLCH, VIS, CEILING, HZEROCL, SNOWLMT und T_G. Fehlende 15-min-Felder fallen parameterweise auf den bestehenden Stundenpfad zurück; es gibt kein künstlich als nativ etikettiertes Upsampling. Radar/Nowcast und belastbare Beobachtungen behalten im unmittelbaren Zeitraum Vorrang. `displayMinutes15`, 90-Minuten-Wettertext/Piktogramm und Skybar nutzen denselben finalisierten Zustandsvektor. Required Regression: `scripts/test-mid-18-2-1-ruc-native-cadence-098573.mjs`.

## v0.9.85.72 · Kurzfrist-Skybar/Wettertext-Kohärenz

In der finalisierten Kurzfristreihe müssen trockener Wettertext, Piktogramm und Skybar denselben Himmelszustand beschreiben. Gesamtbewölkung ist dabei primär; tiefe Bewölkung ist nur Fallback bei fehlender Gesamtbewölkung. Für trockene Lagen gilt die WMO-nahe Oktaschwelle: „Bedeckt“ ab 87,5 % Gesamtbewölkung. Nebel bleibt sicht-/feuchtebasiert separat, Niederschlags- und Gewittercodes bleiben unberührt. ICON-D2-RUC CLCT/CLCL werden aktuell stündlich in den kanonischen Forecastkern übernommen; die 15-Minuten-Kurzfrist interpoliert diese Zustandsfelder und darf nicht als native 15-Minuten-CLCT-Folge bezeichnet werden. Required Regression: `scripts/test-mid-18-2-1-skybar-cloud-coherence-098572.mjs`.

## v0.9.85.71 · MID 18.2.1 Replit-Handoff

Der Replit-Redesignstand ist ausschließlich eine visuelle/UX-Referenz und keine alternative Wetterdaten- oder Releasebasis. Übernommen werden nur gegen `mid-stable` geprüfte Verbesserungen. Lange Ortsnamen dürfen im modernen Ortskopf nicht per Ellipse gekürzt werden. Ein expliziter Bottom-Bar-/Horizontsprung zu „Heute“ verwirft den zuvor gespeicherten internen Scrollstand des Kurzfrist-Cockpits und beginnt am Kopf der Ansicht. Die Kartenoberfläche darf verdichtet werden, ohne Radar-, Satelliten-, Nowcast-, DWD- oder Synoptikfunktionen zu entfernen oder Fixture-Daten an die Stelle produktiver Datenpfade zu setzen. Die bereits vorhandene amtliche DWD-Bodenanalyse und die getrennt gekennzeichnete MID-Modellanalyse bleiben kanonisch. Required Regression: `scripts/test-mid-18-2-1-replit-handoff-098571.mjs`.

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
## v0.9.79.0 · Optionales Bottom-Tab-Bedienkonzept

`MID_NAVIGATION_BOTTOM_BAR_CONTRACT.md` ist verbindlich. Die bisherige Navigation bleibt Default/Fallback. Der optionale Schlüssel `mid:navigationMode:v1` persistiert die Wahl `classic | bottom-tabs` und wird als portable Nutzereinstellung synchronisiert. Mobile Bottom-Tabs führen ausschließlich in bestehende Sektionen; Radarprodukte/-farben, Parameterfarben, Einheiten und Datenpfade bleiben unberührt. Required Regression: `scripts/test-optional-bottom-navigation-09790.mjs`.
## v0.9.79.1 · Optionales Bedienkonzept, Schritt 2

`MID_NAVIGATION_BOTTOM_BAR_CONTRACT.md` wird erweitert. Nur im optionalen `bottom-tabs`-Modus wird der mobile Kopfbereich kompakter und vor dem Prognose-Arbeitsraum eine gemeinsame Leiste **90 min · 24 h · 7 T · 14 T · 46 T · Saison** eingeblendet. Alle Ziele fokussieren vorhandene MID-Module/Unterbereiche; es entstehen keine zusätzlichen Datenpfade. Klassisch bleibt unverändert. Radarprodukte/-farben und Parameterfarben bleiben vollständig isoliert. Required Regression: `scripts/test-modern-navigation-step2-09791.mjs`.
## v0.9.79.2 · Optionales Bedienkonzept, Schritt 3

Im `bottom-tabs`-Modus verwendet das Kompositbild einen map-first Fokusmodus. Die bestehenden Radar-/Satelliten-/Synoptikdaten bleiben unverändert; lediglich Bedienhierarchie und Platzverteilung werden angepasst. Schnelle Overlays und Presets liegen unter **Ebenen** direkt auf der Karte, vollständige Darstellungs-/Deckkraftoptionen bleiben erreichbar. Pan/Pinch, die bestehenden MapLibre-`+ / −`-Controls, Standortzentrierung, Timeline, Play/Pause, Einzelschritt, `Jetzt` und Wiedergabegeschwindigkeit bleiben erhalten. `classic` bleibt unverändert. Radarfarbtabellen bleiben ausschließlich `dwd-standard`. Required Regression: `scripts/test-modern-map-focus-09792.mjs`.
## v0.9.79.3 · Optionales Bedienkonzept, Schritt 4

Im `bottom-tabs`-Modus ergänzt eine kompakte Heute-Übersicht die vorhandenen kanonischen MID-Daten um die Bedienebenen „Heute relevant“, Stundenkurzleiste und 7-Tage-Kurzblick. Die zugrunde liegende Current-Ansicht und sämtliche Fachpfade bleiben erhalten; der klassische Modus bleibt unverändert. Required Regression: `scripts/test-modern-today-overview-09793.mjs`.

## v0.9.79.4 · Optionales Bedienkonzept, Schritt 5

`MID_NAVIGATION_BOTTOM_BAR_CONTRACT.md` bleibt verbindlich. Im `bottom-tabs`-Modus ist die äußere Horizontleiste die primäre Prognosenavigation; `mid:modernForecastHorizon:v1` persistiert den zuletzt gewählten Horizont. Der Prognose-Tab kehrt bevorzugt zu diesem verfügbaren Ziel zurück. Im Cockpit-Arbeitsraum werden interne Doppel-Tabs nicht zusätzlich gerendert; `classic` bleibt unverändert. Keine Änderung an meteorologischen Datenpfaden oder Radarfarbverträgen. Required Regression: `scripts/test-modern-forecast-workspace-09794.mjs`.
## v0.9.79.5 · Optionales Bedienkonzept, Schritt 6

Im `bottom-tabs`-Modus führt **Planen** in einen Hub für Event, Reise, Berg/Winter und Wasser; **Mehr** bündelt direkte Einstellungszugriffe und deduplizierte Fachmodule. Alle Ziele verwenden vorhandene Module und Datenpfade. `classic` bleibt unverändert. Required Regression: `scripts/test-modern-plan-more-hierarchy-09795.mjs`.

## v0.9.79.6 · Parallelstand-Merge und Bedienkonzept, Schritt 7

Die nachgereichten Änderungen aus **v0.9.78.84/.85** sind verbindlich in den v0.9.79-Zweig integriert: Synoptik ohne ungültiges `smoothFactor`, Composite-v3-Persistenz einschließlich Linienfarben, Sat/Rad-Wiedergabevertrag und seriöse Event-Hitzeempfehlungen bleiben erhalten. Im optionalen `bottom-tabs`-Modus gilt zusätzlich **Übersicht → Fokus → Details**: Heute rendert die vollständige Current-Ansicht erst nach explizitem Details-Aufruf; Karte öffnet das vorhandene Kompositbild ohne zusätzliche äußere Aufklappstufe direkt im Fokus. `classic` bleibt vollständig unverändert. Radarprodukte/-farben, Parameterfarben, Einheiten und kanonische Forecastpfade bleiben isoliert. Required Regression: `scripts/test-modern-focus-detail-hierarchy-09796.mjs`.

## v0.9.79.7 · CI-Buildfix Bottom-Bar-Typvertrag

Die Prognosekandidaten der optionalen Bottom-Leiste werden vor der Deduplizierung explizit als `DashboardModuleId[]` typisiert. Dies verhindert die TypeScript-Aufweitung auf `string[]`, die Release-Run #919 mit TS2322 blockierte. Es handelt sich um einen reinen Build-/Typfix ohne Änderung an Bedienlogik, Wetterdaten, Radarfarben oder Worker-Fachlogik.

## v0.9.84.5 · Eigenständige Widget-Kurvenübersicht

Die Widgetoption **Kurvenübersicht** ist ab v0.9.84.5 ein eigenständiger Darstellungsmodus und verwendet ausschließlich den kanonischen `SevenDayCurveOverview`-Renderer. Die klassische kompakte Tagesansicht wird in diesem Modus nicht parallel angezeigt. Der Zeitraum bleibt auf **3 oder 7 Tage** begrenzt und wird zusammen mit Theme- und Sichtbarkeitsoptionen unter `mid:0.7.1:widget-settings` persistiert.

Die Kurvenübersicht muss den freigegebenen Aufbau beibehalten: Tages-/Datumszeile, zentrale Wetterpiktogramme, ECMWF-basierte Tmin-/Tmax-Pillen, eine geglättete Temperaturkurve, gerundete Skybar-Segmente mit getrennten Niederschlags-Overlays, zusammenhängende Nachtbereiche und stündliche Niederschlagssäulen auf derselben lokalen Zeitachse. Niederschlag und Sonnenschein bleiben über die bestehende Widget-Optionsgruppe schaltbar. Required Regression: `scripts/test-widget-curve-overview-09845.mjs`.

## v0.9.84.6 · Widget-Zeitraum 3–7 Tage

Die eigenständige Widget-Kurvenübersicht unterstützt als Zeitraum **3, 4, 5, 6 oder 7 Tage**. Die Auswahl wird gemeinsam mit Theme-, Sichtbarkeits- und Ansichtsoptionen unter `mid:0.7.1:widget-settings` persistiert. Ungültige Altwerte fallen sicher auf 7 Tage zurück. Kartenansicht und Kurvenübersicht nutzen dieselbe Auswahl; die Kurvenbreite wird für die gewählte Tageszahl angepasst. Der kanonische `SevenDayCurveOverview`-Renderer, die lokalen Tages-/Stundendaten sowie alle bestehenden Export-, Hazard- und Sicherheitsverträge bleiben erhalten. Required Regression: `scripts/test-widget-curve-overview-09845.mjs`.

## v0.9.84.7 · Verlustfreier Niederschlag und kompaktes Widget

Widget-Tageskopf und `SevenDayCurveOverview` verwenden dieselbe einmalig auf sichtbare Vorwärtsslots normalisierte Stundenreihe. Eine zweite Niederschlagsverschiebung ist unzulässig. Die Säulen übernehmen die kanonische Niederschlagsmenge mit konservativem Komponentenfallback; Skybar und Säulen reagieren gemeinsam auf die klar bezeichnete Niederschlagsoption. Alte Widgetstände werden einmalig auf sichtbaren Niederschlag migriert, spätere bewusste Änderungen bleiben unter `mid:0.7.1:widget-settings` persistent. Die Legende darf ausgeblendeten Niederschlag nicht als aktiv ausweisen. Kurven-SVG und Widgetmenü müssen ohne künstliche Mindesthöhe, verrutschende Selects oder unnötige Leerflächen responsiv bleiben. Required Regression: `scripts/test-widget-curve-overview-09845.mjs`.

## v0.9.84.8 · Lesbare Warnschwellen und Wind in der Widget-Kurve

- Die gelbe Windwarnstufe verwendet im hellen Widget dunkle Schrift und einen hellgelben, klar umrandeten Hintergrund mit ausreichendem Kontrast.
- Die Kurvenübersicht zeigt bei aktivierter Windoption je Tag eine kompakte, warnstufengefärbte Kombination aus Richtung, Mittelwind und Böe.
- Optionsfelder bleiben zweispaltig ausgerichtet; Checkbox und einzeilige Kurzbezeichnung dürfen nicht umbrechen oder gegeneinander verrutschen.

## v0.9.84.9 · Ensemble-Widget, Kurvenhazards und optionaler Klima-Favoritenname

Die neue Widgetansicht **14-Tage-Ensemble** rendert die drei vorhandenen vollständigen Diagramme für Temperatur, Niederschlag und Wind/Böen gemeinsam und ohne parallele vereinfachte Diagrammimplementierung. Ensemble-Daten werden erst bei Auswahl dieser Ansicht angefordert. Die Kurvenübersicht zeigt bei aktivierter Hazardoption datumsgleiche Warnsignale; Windrichtung, Mittelwind und Böen bleiben auch im hellen Export klar lesbar. Das Klima-Modul darf optional den aktiven Favoritennamen statt des technischen Ortsnamens verwenden und persistiert diese Wahl pro Koordinate. Required Regression: `scripts/test-widget-ensemble-climate-alias-09849.mjs`.

## v0.9.79.8 · CI-Regressionsmodernisierung nach Run #920

Der Produktionsbuild und die TypeScript-Prüfung von v0.9.79.7 waren bereits erfolgreich. Run #920 scheiterte ausschließlich an fünf statischen Regressionen, deren Quelltextmuster noch die vor dem optionalen Bottom-Bar-/Planen-Hub-Umbau geltende Dashboard-Struktur voraussetzten. Diese Regressionen müssen ab v0.9.79.8 den funktional gleichwertigen aktuellen Vertrag prüfen: zentrale `displayHours`/`displayDays` bleiben verbindlich, Event- und Reiseplaner bleiben separat schaltbar und gemeinsam unter Planen erreichbar, Kurzfrist-/QR-/Modulverträge bleiben erhalten, und spätere Versionslinien müssen den v0.9.78.66-Favoritenvertrag semantisch statt über ein auf `0.9.78.x` begrenztes Regex erfüllen. Die Korrektur darf keine App- oder Worker-Fachlogik verändern.


## v0.9.84.11 · Skybar Wolkenpriorität und Schauer-Overlay

`MID_24H_PROFILE_STORY_AXIS_CONTRACT.md` ist für alle sichtbaren Skybar-Verwendungen verbindlich. Bei bekannter Gesamtbewölkung bestimmt diese das gelbe/graue Grundband: ab 50 % grau, darunter tagsüber gelb mit komplementärem Aufklarungsanteil. Die WMO-Sonnenscheindauer bleibt ein eigenständiger Parameter und darf die bekannte Gesamtbewölkung in der Skybar nicht überstimmen; sie dient nur bei fehlender Gesamtbewölkung als Fallback. Niederschlag bleibt eine separate, nach dem Grundband gerenderte und auf derselben Mittellinie zentrierte Lage. Dadurch bleiben sonnige Schauer darstellbar: ist das Grundband breiter, bleibt es sichtbar; ist der Niederschlagsstreifen gleich dick oder dicker, verdeckt er es vollständig. DWD-Regenintensitäten leicht `<=0,5 mm/h`, mäßig `>0,5–4 mm/h` und stark `>4 mm/h` sind verbindlich; MID teilt „stark“ ausschließlich für die vierte grafische Dickenstufe bei `15 mm/h` weiter. Required Regression: `scripts/test-skybar-shower-overlay-cloud-priority-098411.mjs`.

## v0.9.84.12 · Skybar-Releasefix: Sonnenscheindauer bleibt eigenständig

Die visuelle Skybar-Klassifikation und die physikalische Sonnenscheindauer sind getrennte Verträge. `baseSkyVisual()` verwendet bei bekannter Gesamtbewölkung weiterhin ausschließlich den komplementären Himmelszustand für das gelbe/graue Grundband. `sunVisualShare()` darf dagegen einen vorhandenen direkten Sonnenscheindaueranteil nicht durch Wolkenkomplementierung ersetzen; Wolkenkomplementierung ist dort nur Fallback bei fehlendem Sonnenwert. Damit bleibt der Wissenschaftsaudit kompatibel, ohne den v0.9.84.11-Skybarvertrag oder sonnige Niederschlags-Overlays abzuschwächen.

## v0.9.84.13 · Feste aktuelle Widget-Live-URLs

Feste Widget-URLs verwenden eine zentral gepflegte Ortsliste und erzeugen je Ort automatisch **Kompakt** und **Kurvenübersicht** für **5** und **7 Tage**. Beim Aufruf werden aktuelle kanonische MID-Prognosedaten geladen; angezeigt wird ausschließlich die Widgetfläche. URL-Vorgaben dürfen nicht durch lokale Widgeteinstellungen überschrieben werden. Wind, Niederschlag, Sonnenschein und Hazards sind vollständig aktiv. Required Regression: `scripts/test-widget-url-exports-098413.mjs`.
# MID v0.9.84.14

- Das Ensemble-Widget besitzt eine gespeicherte Einzelauswahl für Temperatur, Niederschlag oder Wind/Böen.
- Vorschau und PNG enthalten nur das gewählte Diagramm mit Ortsname und ohne modellspezifische Begleitinformationen.
- Feste Widget-URL-Orte werden ausschließlich über `WIDGET_URL_LOCATIONS` in `src/widgetUrlExports.ts` gepflegt.

## v0.9.84.89 · Kanonische iOS-inspirierte Floating Bottom Bar

`MID_NAVIGATION_BOTTOM_BAR_CONTRACT.md` ist in seiner ab v0.9.84.89 überschreibenden Fassung verbindlich. Die bisherige optionale Auswahl `classic | bottom-tabs`, der Einstellungs-Unterpunkt **Bedienkonzept** und **Bottom-Leiste · Beta** sind aufgehoben. Auf kompakten Web-/PWA-Viewports lautet die Hauptnavigation **Aktuell · Kurzfrist · 7 Tage · 14 Tage · Mehr**; Beschriftungen bleiben einzeilig. Die Leiste schwebt safe-area-konform über dem Inhalt, minimiert bei deutlichem Abwärtsscrollen und kehrt bei Aufwärtsscrollen/Seitenanfang/Fokus zurück. Weitere Fachmodule einschließlich Karten und Planer bleiben über **Mehr** erreichbar. Desktop-Sektionsleiste und sämtliche meteorologischen Daten-/Radar-/Warn-/Farbverträge bleiben unverändert. Required Regression: `scripts/test-ios-floating-bottom-bar-098489.mjs`.



## v0.9.85.139 · Radar-Grafikmarkierungen und Ensemble-Spannen

Radar-Balken und Auswahlanker sind keine Buttons; der gesamte Scrubber bildet das bedienbare Touch-/Tastaturziel. Native DWD-RV-Werte via Bright Sky werden als 0,01 mm/5 min dekodiert und mit expliziten Intervallgrenzen versehen. Der Forecast-Referenzlauf und maximal 20 Minuten Beobachtungsalter sind verbindlich; fehlende und negative Pixel bleiben ausgeschlossen. Direkter DWD-Abruf bleibt Reserve. 7-/14-Tage-Ansichten verwenden vorhandene gewichtete Ensemble-Quantile und kennzeichnen fehlende Spannen. P10–P90 ist kein kalibrierter Eintrittsbereich. Pflichtprüfung: scripts/test-radar-forecast-readability-0985139.mjs einschließlich echter CI-Browserprüfung.
