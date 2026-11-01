# MID v0.9.85.403 · ressourcenschonender Karten-Startpfad

**Ausgangsbasis:** Veröffentlichter v0.9.85.402 Stable und main auf SHA `1888cb97149855aa8d63f74fecad9c4f245ee02d`, Installer [#41325206572](https://github.com/MeteoMartini/MID/actions/runs/41325206572) completed/success mit vollständigen Core-, Heavy-, Worker-, Pages-, Finalize- und Promotion-Gates; fünf aktive Repository-Rulesets und 1059 bereits registrierte Pflichtregressionen. Weitere .403-RUC-Entwicklungszweige (#586/#587) sind parallel und werden nicht verändert.

**Karten-Performance:** Das Sichtbarkeitsgating bleibt erhalten; ein getrennter optionaler Vorladepfad lädt nach bereits fertiger Ortsprognose ausschließlich JS-Module für den Kartenarbeitsraum im Browser-Leerlauf. Die pure Policy verhindert automatische Importe bei 2G/Data Saver/offline/hidden/such- oder drawer-blockierter UI, deaktivierter oder bereits aktiver Karte. Timer und Idle-Task werden beim Zustandwechsel aufgeräumt; echtes Nutzer-Intent bleibt direkt. Importfehler sind abgefangen. Keine neuen Wetterdaten-, Modell-, RUC-/WMS-, Worker- oder Tracking-Anfragen, keine Änderungen an Sicherheits-/Warn- oder Persistenzverträgen.

**Fachliche und QA-Grenze:** Normaler User-Changelog und technische Release-Historie auf `.403` synchron. Die bereits obligatorische C14-Regression ist um tatsächliche Preload-Policy- und Negativtests sowie Runtime-Hook-Nachweise erweitert. Die 1059 Tests und die vollständige Karten-/Responsive-Matrix werden weder reduziert noch umgangen. Die bisherige browserbasierte Messung auf .402 ist keine iOS-TTFP-/WebGL-Abnahme und kein Beleg für einen bestimmten Speedup.

**Freigabevertrag:** Source-PR auf autorisiertem `chatgpt/v0.9.85.403-*` mit abschließend vollständig grünen Pflichtgates, kontrollierter SHA-botgesteuerter Merge, serverseitiges ZIP, normaler Installer einschließlich Worker/Pages/Finalize und erst danach Stable-Promotion. Für jede Abweichung fail-closed.

---

# MID v0.9.85.402 · Designaudit 1.7 + kompakter Kartenarbeitsraum

**Release-Vorgänger:** vollständig erfolgreicher MID Installer #41319782471; `main=mid-stable` v0.9.85.401 SHA `00639856b5c1598cbccb837a3b63fbe57cc5d566`. Fünf aktive Rulesets, 1059 registrierte Pflichtregressionen. Nur SHA-verifizierte, disjunkte Source-/Testblobs von Audit-PR #580 (`edda2b400f1dc581da3c443bb3e968381527cab4`) und Karten-Draft #583 (`e359aa18dce94f1f4c98816539bc5e01edd43d4c`) übernommen.

**A1/A2:** Modellierte MID-Warnhinweise für mehrstündigen Regen, Schnee, Schneeverwehung, Frost und starke Wärme benötigen lückenlose vorhandene Stundenwerte und stimmige Zeitstempel. Fehlende Windrichtung bleibt unbekannt; echte 0° bleibt Nord. Eigene MID-Hinweise bleiben ausdrücklich getrennt von amtlichen DWD-Warnungen.

**A3/A4:** Karten-Workspace-Altpräferenzen werden ohne Datenverlust migriert; die relative Zeit wird durch eine lokale absolute bestätigte Gültigkeitszeit ergänzt; Beobachtungs- und Modellsteuerung wird kompakt mit vollständig erreichbaren Optionen, fokusfähigen Disclosures und 44px-Touchzielen angeordnet. Viewport-Gating wärmt Karte sinnvoll vor, belegt aber ohne HAR/TTFP keine gemessene Geschwindigkeit.

**Extremwetter-Performance:** Identische, SHA-verifizierte Quell- und Testblobs aus PR #585 HEAD `8eb408100e24e96c4645e9652b389339c134a088` vermeiden die doppelte Erstellung derselben Konturgruppe innerhalb eines unveränderten Datenobjekts. Separate Gefahr/Periode/neue Datenidentität rechnen neu; Schwellen, Wetterwerte, Warnsemantik und Missing bleiben unverändert.

**Laufzeitgate:** Run `41322391419` bestand alle acht Fälle von Heavy 2/3, aber überzog die 13-Minuten-Schrittgrenze. Die verpflichtenden 24 echten MapLibre-Browserfälle wurden verlustfrei auf die vorhandenen drei Pflicht-Shards 9/7/8 aufgeteilt. Der bestehende verpflichtende Regressionstest prüft disjunkte Vollständigkeit und 20 Memory-Zyklen. Kein Release-Gate entfernt oder weichgestellt; ein neuer voller Source- und Installer-Gate-Lauf ist zwingend.

**Gates:** Versionsspiegel `.402` (Xcode Build 403), User-/Internal-Changelog, QA und Fachverträge konsistent. Source-/Heavy-/Releasegates, Browsermatrix, echte Provider-WMS-/RUC-Originalklassennachweise, physisches iOS/VoiceOver sind nur dann bestanden, wenn gesondert SHA-gebunden erfolgreich protokolliert. Der Quellkandidat darf ausschließlich über den bestehenden kontrollierten MID-Pfad freigegeben werden.

---
# MID v0.9.85.401 · RUC P1/P5-Evidenz und inaktive P3-Quantil-Qualifikation

**Quellbasis:** v0.9.85.400 main=mid-stable SHA `a6c644fef9762ffad1f4f48a8ddfdf77d4fe2fe7`, erfolgreich veröffentlichter Installer #41311115993, fünf aktive GitHub-Rulesets, 1059 Pflichtregressionen. Diese Beschreibung ist ein SHA-gebundener Source-PR-Kandidat und kein Beweis der .401-Promotion.

**RUC-Vertragsgrenze:** Der 27h-/EPS20-MID-Produktionsalgorithmus, die amtlichen DWD-Warnungen und vollständigen NoData-/Bitmap-/Geometrie-/Einheiten-/Zeit-/Akkumulationsgates sind unverändert. PR #577 liefert ausschließlich SHA-authentifizierte, zensierte GitHub-Originalartefakt-Telemetrie und lesende Observer-Fallbacks; echte 168h-P95 und vollständige Echtdaten-Messabdeckung bleiben unbewiesen. PR #581 liefert ausschließlich einen inaktiven, byteparitätsgeprüften EPS20-Quantilkandidaten, dessen Full-GRIB-/542040-Rasterpunkt-, CPU-/RAM-/900MB-A/B-Parität noch nicht belegt ist. Die 0–6h-Fast-Lane bleibt `publicationAuthorized=false`; ein globales CAS/Fencing-/Single-Writer-Protokoll ist nicht freigegeben. Keine produktive Fast-Lane-/Worker-/R2-/Cloudflare-/Pages-Datenpfadmutation durch diese Änderung.

**Quellherkunft:** 18 anfänglich einzeln und untereinander nicht überlappend SHA-identisch übernommene Source-/Test-/Workflow-/Dokumentdateien aus PR #577 HEAD `b4f8ca34dd4b432978d661ca7b6ace864d5d97d4` und PR #581 HEAD `2fc42bb84b168b478cb82c88e319c9b042abd7eb` zunächst als identische Git-Blob-SHAs überführt. Danach wurden ausschließlich der neue Observer-Collector und seine Negativtests in diesem Integrationsbranch für gebündelte GitHub-REST-Artefaktseiten, API-Ratenlimits, 15min-Schedule-/Watchdog-Deduplizierung und tatsächliche Ereignisprovenienz gehärtet; diese Dateien haben deshalb nun bewusst eigene nachvollziehbare Git-Blob-SHAs. Parallele RUC- und D2-PRs einschließlich #578 bleiben unangetastet. Der eigene .401-Integrationsbranch benutzt ausschließlich autorisierte `chatgpt/v*`-Refs.

**Freigabegrenze:** Der Source-PR muss am letzten Head sämtliche Pflichtgates einschließlich 1059 Regressionen erfüllen, anschließend nur MID SHA-Bot-Merge, serverseitiges Release-ZIP, `install-mid.yml`, Worker/Pages/Finalize und Stable-Promotion. Weder generisches PR-Completion-Merge noch direkte Schreibrechte auf `main`/`mid-stable` autorisiert. Echte 168h-Frische, 60-Minuten-P95 und eine produktive P2/P3/P4-Freigabe dürfen vor Vorliegen der unabhängigen Datenbeweise nicht behauptet werden.

---

# MID v0.9.85.400 · Designaudit 1.6: persistierter Prognosehorizont und NoData-sichere Miniverläufe

**Quelle:** v0.9.85.399 `main=mid-stable` SHA `bba6006f50b5c279aebc0c5a40a812dc21c5d500`, Quelle PR #575, Installer #41305710537 vollständig `completed/success`; fünf aktive GitHub-Rulesets, 1059 Pflichtregressionstests, 38 registrierte Verträge. Der Quellkandidat steht ausschließlich auf `chatgpt/v0.9.85.400-audit16-horizon-nodata`. Kein Direktwrite auf `main`/`mid-stable`, keine Änderungen an RUC- oder Kartenarbeiter-Drafts.

**A3 Persistenz (#508):** Die bisherige `ForecastCockpit`-Ausweichwahl bei vorübergehend fehlenden 7-/14-Tage-Daten wurde durch ihren Speicher-Effekt als dauerhafte Benutzerentscheidung überschrieben. Der neue `forecastHorizonPreference.ts`-Vertrag trennt explizite Nutzer-/Navigationswahl von lediglich vorübergehend gerendertem Fallback. Nur eine ausdrückliche Auswahl persistiert; bei Datenwiederherstellung und ohne widersprechende gültige Navigation wird die präferierte Ansicht zurückgebracht. Invalid/blocked Storage kann diese Stelle nicht abstürzen lassen.

**A1/A2/A3 meteorologische Darstellungsintegrität (#523):** Miniverläufe für Kurzfrist-/7d-Temperatur bauen SVG-Pfade nur aus endlichen Werten. Bei missing/NaN/Infinity bleibt eine sichtbare Pfadlücke statt falscher Verbindung oder ungültiger Koordinate; fehlende Temperaturpunkte erzeugen weder Marker noch `NaN °C`-Tooltip. Regenmengen/Warn-/RUC-/Ensemble-Originaldaten bleiben unverändert. Saisonmodell-Legenden dürfen bei `ensembleMembers=0` nicht „Ensemble-Mittel“ behaupten.

**Nachweisgrenze:** Die bestehende obligatorische Return-State-Regression testet die tatsächlich kompilierten zwei neuen TS-Helfer und App-/Chart-Verdrahtung. Quell-/Build-/CI-Behauptungen erfolgen nur für konkret erfolgreiche GitHub-Gates auf finalem SHA. Vor Produktivfreigabe Pflicht Source-PR-Gate → SHA-gesteuerter Merge → serverseitiges ZIP → Installer → Worker/Pages/Finalize → Stable. Echte Hardware-iOS-/VoiceOver-/WCAG-AA-Zertifizierung sowie eine vollständige A0–A5-Matrix fehlen weiterhin.

---

# MID v0.9.85.399 · Designaudit 1.6: Wasserwetter-Missing-Intervalle, originale Saisonlinien und resiliente Tagesdetails

**Verifizierter Vorgänger:** v0.9.85.398 `main=mid-stable` @ `adf2a832bd7d66a9bb7c16ec6d9f4dcdedeff855`, Installer #41300031208 vollständig `completed/success`, fünf aktive Rulesets, 1059 bestehende Pflichtregressionen. Der anfänglich blockierte Integrationsversuch aus dem Vorgängerturn hat keine Branch-/PR-Refs verändert. Danach wurden auf erneuter, identischer Stable-Basis ausschließlich ein autorisierter `chatgpt/*`-Branch und Draft-PR #575 mit nachverfolgbaren Commits geschaffen. Keine konkurrierenden RUC-/DWD-/iOS-/Release-/Warnbranches geändert.

**Korrektur A0/A4 Wasserwetter:** `WaterSportsPanel.tsx` wertete bisher `finite(...).reduce(...,0)` bei fehlenden 1-/3-Stunden-Werten fälschlich als gemessene Niederschlagsmenge 0 mm. Der neue reine `sumCompletePrecipitation`-Guard erhält echte Null, weist ausdrücklich unverfügbare Komponenten ab und erfordert endliche nichtnegative Zahlen sowie fortlaufende stündliche Epochen. Für fehlende Teile ergibt der Guard NaN; die bestehende Niederschlagsformatierung zeigt `–` statt `0` und der sichtbare Intervallhinweis erklärt die Datenlücken. Keine geänderte WMO-Code-/DWD-Warnlogik oder unangemessene Glättung.

**Korrektur Linien und Zustandsintegrität:** Saisonvergleichs-Legenden tragen mittels SVG dieselben vier originalen Dasharrays wie ihre jeweiligen Modellkurven; keine rein farbliche Unterscheidung erforderlich. Der Tagesdetail-Einstieg wird bei blockiertem `localStorage` durch einen geschützten Read stabilisiert; Legacy-Key, 0/1-Status und stündlicher fester Aufklappmodus bleiben bestehen. Der initiale Layoutmodus und das Lesen der Favoritenreihenfolge sind ebenfalls gegen verweigerten Browser-Speicher geschützt, einschließlich Test des echten transpilierbaren Quellcodes. Bestehende obligatorische Regressionen `test-water-tide-matrix-081815.mjs` und `test-display-return-states-0985364.mjs` erweitert um ausgeführte TS-Helper-Qualifikationen, keine Testinventarverkürzung.


- **RUC-Workflow-Kompatibilitätskorrektur:** Der zusätzliche P1–P5-Evidenzjob war in beiden kanonischen/aktiven Workflow-Spiegeln versehentlich auf **exakt** v0.9.85.398 fest verdrahtet. Der positive Versionsvertrag akzeptiert nun nur eine vierteilige Version **ab** .398, weiterhin mit unveränderter Baseline-/Contract-Version-Synchronität, ≥1059 Pflichtregressionen, byteidentischen Workflow-Spiegeln, unveränderten Native-RUC-Negativtests und dem unveränderten `git diff --exit-code`/sauberem Arbeitsbaum. Keine Abkürzung von SHA-, Veröffentlichungs- oder Datenqualitätsgates; aktuelle PR-Checks müssen auf dem finalen SHA neu erfolgreich sein.

**Freigabegrenze:** v0.9.85.399 bleibt **Quellkandidat**, bis exakt sein letzter PR-SHA vollständig grüne Pflicht-Source-Gates, kontrollierter SHA-Bot, serverseitiges Release-ZIP, Installer mit Worker/Pages/Finalize und bestätigte Stable-Promotion belegt sind. Vor Abschluss dieser Kette weder produktive Version noch WCAG-2.2-AA-/iOS-/VoiceOver-Abnahme behaupten. Die Auditissues #523 und #508 bleiben für A0–A5 End-to-End-Abnahme, Provider-Originalklassen und echte responsive Geräteprüfung offen.

---

# MID v0.9.85.398 · RUC Data 1.3: P1–P5 gesicherte Evidenz, inaktive native 0–6h-Qualifikation

**Freigegebene Quellbasis:** v0.9.85.397 `main=mid-stable` SHA `9627f7a6fc1d71a4ca328f7c3f257c0fac7d0362`; Installer #41296481176 vollständig erfolgreich, einschließlich Core/Heavy, Worker, Pages und Finalize. Fünf aktive GitHub-Rulesets, 1059 obligatorische Regressionstests. Die .397-Missing-/NoData-Korrektur aus PR #572 einschließlich `src/extremeEvidenceNumeric.ts` bleibt erhalten, wird weder aus einem alten Draft überschrieben noch verändert.

**Exakte Portierung:** Fach-, Test- und die inaktiven Qualifikationsworkflow-Dateien aus gesichertem Draft #571 Head `ab327404f6f38aa12629242a4001c39fb2263386` wurden selektiv und per Git-Blob-SHA mit Ziel-Readback verifiziert. Ursprung #571: fachlich übernommene RUC-Drafts #565 (P2), #569 (P1/P3/P5), #542 (P4), alte Branches unangetastet; kein Reset/Rebase/Force-Push. Alle alten .397-Versionsspiegel/-Changelogs des Drafts wurden nicht übernommen; dieser Build hat eine frisch synchronisierte .398 Version.

**P1/P5 Observer-Korrektur:** Die viertelstündliche indexbasierte, lesende DWD-Verzeichnisprobe und ein separater Pages-/Worker-Readback liefern ein ausschließlich beobachtendes Ergebnis. Der Observer archiviert `ruc-observer-status-<run>-<attempt>.json` mit SHA-Konsens, tatsächlichen Stichproben und explizitem `release-drift-or-unverified-lineage`-Status. Der neue Fallback erzeugt auch beim Auschecken eines noch älteren Stable-Commits, auf dem das neue Statusmodul fehlt, ein konservatives **Nicht-Beobachtet**-Dokument, ohne synthetische Daten. Die Originalverzeichnisbeobachtung bestätigt weder GRIB-Feldwerte noch den exakten ersten DWD-Veröffentlichungszeitpunkt. P5 168-Stunden-Auswertung behandelt unbekannte/links-/rechts-/intervallzensierte Run-Slots und Lücken explizit, ohne ein SLO zu autorisieren.

**P2 bleibt strikt inaktiv:** Kein Scheduler, R2-/Cloudflare-Schreibrecht, Pages-Deploy oder Worker-/App-Konsument für die neue Fast-Lane. Die manuelle `mid-ruc-fast-lane-qualification.yml` verlangt aktuelle `main=mid-stable`-SHA und lädt originalen nativen DWD +0…+6h nur zur lokalen Python-/ecCodes-Qualifikation; stündlicher 12-Feld-Kern, native 5min TOT_PREC (73 Zeitpunkte) und 15min CAPE/CIN (25 Zeitpunkte), native Gitter-/Leadtimes-/Quell-SHA-/Einheits-/Bitmap-/Missing-/Budget-Abnahmen. Das lokale `ruc/fast/latest.json`-Staging ist `publicationAuthorized=false`, `productionEnabled=false`, `realtimeConsumerEnabled=false`; es darf nicht in die produktive `ruc/latest.json` oder den Worker/Fusion-Pfad gelangen. Das GitHub-Default-Branch-`workflow_dispatch` ist erst **nach** vollständiger .398-Promotion aufrufbar. Ein realer GRIB-E2E-Test muss danach gesondert dokumentiert werden.

**P3/P4:** Echte zeitliche GitHub-Wall-/Step-Lücken bleiben als **unattributed** ausgewiesen; SHA-identische DWD-GRIB A/B/CPU/RAM-Proben sind noch offen. P4-Qualifikationslogik ist rein lesend und sperrt jede bekannte laufende Produktion, auch wenn ein neuerer Lauf angekündigt ist, und ungültige Inventar-Fingerprints; sie ist **nicht** der geforderte gemeinsame authentifizierte Produktions-Lock/CAS/Fencing-Protokoll. Die produktive 27h-/20-EPS-Pipeline und ihre Rollback-/Warn- und Wahrheitsverträge sind unverändert.

**Qualifikations- und Releasegrenze:** Erst auf exaktem .398-PR-Head erfolgreich ausgeführte Fachtests/Source-Gates, 1059 Pflichtregressionen, normierte Verträge und alle MID-Bot-/ZIP-/Installer-/Worker-/Pages-/Finalize-/Stable-Gates erlauben die Bezeichnung als veröffentlicht. Weder 168h echte DWD-GRIB-/EPS20-Werte noch App-/Widget-/Export-Adoptionsbeobachtungen oder ein empirisches 60-min-P95 sind derzeit nachgewiesen. Kein Hintergrunddienst wird ohne eigenständige spätere Entscheidung aktiviert.

---

# MID v0.9.85.397 · Designaudit #523 P0: Keine fehlenden Extremwetter-Evidenzen als 0 anzeigen

**Verifizierte Source-Basis:** vollständig erfolgreich veröffentlicht v0.9.85.396, `main=mid-stable` SHA `d32201fbb541f4c5189e549c1250de0964bd61d1`, Installer #41292437081 completed/success und fünf aktive Rulesets. Alte Design-Draft #566 und parallele D2-/RUC-/ECMWF-Entwicklungen unangetastet.

**Meteorologische Fachkorrektur:** Der bisherige Extremwetter-Panel-Renderer enthielt `Number(metric.X)||0`, `Number.isFinite(Number(null))` und ähnliche Fallbacks, welche nicht vorhandene RUC-/EPS-/Gefahrenmetriken, Bodenerhebungen und teilweise Zeitfenster wie reale Nullwerte darstellten. Ein neuer rein lesender `src/extremeEvidenceNumeric.ts`-Guard unterscheidet einen echten endlichen 0-Wert strikt von `null`, `undefined`, leerem String, Boolean, NaN und Infinity. Wetterbeträge und Wind sind nichtnegativ, signierte Werte wie CIN bleiben möglich. Ohne verifizierte positive Akkumulationsdauer zeigt MID `Zeitraum nicht verfügbar`, nicht 1/6h. Fehlender Terrainwert wird nicht als 0 m oder ungeprüft als Tiefland etikettiert. Meteorologische Modellwerte, amtliche DWD/WMO-Warnungen, Wahrscheinlichkeiten, Worker/RUC-Pipelines und Extreme bleiben unverändert; keine Nullsubstitution oder Glättung.

**Qualität/Veröffentlichung:** Zwei Fachquellen und die bestehende obligatorische Extremwetter-Testdatei `scripts/test-extreme-outlook-startup-format-09661.mjs` mit real transpilierten Helperprüfungen. Keine neue externe Datenquelle oder Kosten. 1059/1059 Pflichtregressionen und 38 Normverträge unverändert. Vollständige SHA-gebundene Source-Gates → kontrollierter MID-Bot → serverseitiges ZIP → `install-mid.yml` → Worker/Pages/Finalize → Stable-Promotion erforderlich; bis dahin Quellkandidat, nicht Produktivversion. Browser-/CI ist kein realer iOS-/VoiceOver-Getest.

---

# MID v0.9.85.396 · Designaudit #523/#508 – WMS-Originalkartenexport und sichere Widget-/Kartenpräferenzen

**Source of truth:** v0.9.85.395 `main=mid-stable` SHA `bda6e60d37f2cac31b36e9993f5d6c045355d6ed`, fünf aktive Rulesets; erfolgreich veröffentlicht aus PR #564 durch Installer #41288744774. Exakt neun Fach-/Testblobs aus dem gesicherten Design-Draft #566, Head `1fa4e35ff970c7bb0dc68c737aec3123c2330932`, ohne Rebase, Reset oder Überschreibung fremder Arbeiten. Sechs gemeinsame ältere Fachpfade hatten dieselben Git-Blob-SHAs auf .394 und .395. RUC-/ECMWF-/Schneemodelle, Warnungen, produktive KNMI-Produkte und parallele Drafts sind unberührt.

**Echter A3-Export:** Das klassische sowie das gemeinsame Kartenmodul exportieren ein originales, einzelnes WMS-GetMap-PNG der im MapLibre sichtbaren geographischen Bounds mit dem angezeigten DWD-/ECCC-Layer, Stil, Modelllauf, gültigen Termin und Niveau, in derselben EPSG:3857-Projektion wie die bestätigten Kartenkacheln. Die dazugehörige Original-GetLegendGraphic-Abbildung wird verlangt und in der PNG-Datei unter Angabe von Quelle und Lizenzbezeichnung eingebettet. Maximal 1100×900 / 990000 Requestpixel, 12 MB pro Anbieterbild und 15 s Timeout, Abbruch bei geänderter Auswahl, fehlendem PNG oder Kartengeometriefehler. Keine aus Bitmap interpolierten Zahlen, keine fälschliche gemeinsame Basiskarte/Radar/Satelliten-/Warnkartenmontage, kein SVG-Vektorversprechen. Transparente Stellen sind nicht als reale 0 zu interpretieren.

**A4/A3 Persistenz:** Zehn Widgetoptionen schreiben bei tatsächlicher Wahl in den bewahrten v5-Legacy-Schlüssel und werden über lokale/tabübergreifende Events synchronisiert; alte Nutzerwerte einschließlich false, Wahl der Ansicht/Tage, Altschema-Migration und fehlgeschlagener Storage bleiben funktional. Automatische Widget-URL-Exporte speichern keine Nutzerdarstellung. Klassische Wetterkarten verwenden bestehenden `mid:weather-maps:v2`-Schlüssel sofort bei Auswahl für Modell, Produkt, Level, Basemap und Deckkraft, mit Cross-Tab-Sync und explizitem Missing-Level-≠-0. Kein zweiter konkurrierender Master-Store.

**Regressions-/Freigabegrenze:** 1059/1059 Pflichtinventare und 38 Normverträge weiterhin vorhanden; die beiden bereits verpflichtenden Tests `scripts/test-unified-map-layers-0985167.mjs` und `scripts/test-widget-ensemble-selector-098414.mjs` führen neue adversarielle reale TS-/Storage-Qualifikationen aus. Nachweis echter Source-Gate-/Core-/Heavy-/Browser-/Installer-/Worker-/Pages-/Finalize-Erfolge **erst nach Ausführung auf dem exakten Source-/Release-SHA**. Browser/Simulatorprüfungen sind keine echte iOS-/VoiceOver-Abnahme. Live-Provider-GetMap-/Legend-Readbacks, barrierefreie numerische Originalklassentabellen und vollständige Responsive-/A5-Matrix unter #523/#508 weiterhin offen.

---

# MID v0.9.85.395 – abgestimmter Cleanup und Zustandsintegrität (#564)

**Quellbasis:** v0.9.85.394 `main=mid-stable` `d3e8446673488dc23d104b86d376c918524fa0be`; fünf aktive Rulesets; letzte nachweislich vollständige Installer-Kette #41284233444. Alle 33 ersten Quelländerungen stammen von SHA-geprüften, auf der Stable-Basis unveränderten Source-Blobs aus Draft #543 @ `ce1d5b5aa8958c5cb0eb462ad3af94ec0f3692d4` und Draft #563 @ `1ccd4fb712b7912d2b64d1ba2cfea8d7cbefe638`; die alten Drafts bleiben intakt. Das RUC-Vollgebiet #561 und die KNMI-P4a-Produktivdekodierung bleiben unberührt.

**Änderungen:** Veraltete direkte Main-/Stable-Installations-/Analytics-Aktionspfade und KNMI-Diagnose-/Archivexperimente werden mit beiden kanonischen/aktiven Workflow-Spiegeln entfernt; Branch-Bereinigung auf Schutz-/Abstammungsprüfung, negative Pflichtregressionen und öffentliche read-only KNMI-Statusqualifikation gestützt. Klimafavoritenname/Saisonmetriken werden als dauerhafte UI-Auswahl ohne überschreibende Mount-Effects gespeichert, `false`/0 bleibt erhalten; Routenwetter-Toggles erhalten korrekte ARIA-Semantik. Keine WMO/DWD-, Modell-, Warnungs-, RUC-, Worker-Daten- oder physikalische Wertänderung.

**Releasegrenze:** PR #564 ist nicht automatisch freigegeben. Alle 1059 Pflichtregressionen, Source-Core-/Heavy-/Browser-/Build-, Versions-/Workflow- und Installer-Worker-/Pages-/Finalize-Gates müssen für den *exakten neuen .395-HEAD* tatsächlich erfolgreich sein, bevor `mid-stable` als .395 gelten darf. SHA-Fixierung, kein generischer PR-Merge, kein Admin-/Force-Bypass. Browser-Simulationen sind keine echte iOS-/VoiceOver-Abnahme.

---

# MID v0.9.85.394 · RUC-P3 Native-Downloader-Beschleunigung ohne Netzparallelitätszuwachs

**Verifizierte Source-Basis**: v0.9.85.393, `main=mid-stable` SHA `43cb36c07531b8d93418061aa1f075df5f6ac0fc` und alle fünf aktiven Rulesets. Der bisherige P3-Entwicklungszweig #557 war nicht veröffentlicht; nur sieben geprüfte Fach-/QA-Dateien auf dem neuen Source-Tree eingebracht. Parallele Drafts #542/#551/#554/#560/#561 nicht überschrieben.

Das bestehende vollständige 27-Stunden-RUC- und 20-EPS-Paket bleibt zwingend. Nur optionale Parameter können in zwei Gruppen unter unverändertem globalem Downloadthreadlimit laden. Alle DWD ecCodes-Kernwert-/Zeit-/Bitmap-/Geo-/NoData- und Native-Intervallabnahmen bleiben unverändert; optionale Fehlerdaten werden vollständig entfernt. HTTP-Pooling pro Thread, nicht über Threadgrenzen, mit Exit-Close; reale Phasendauern werden protokolliert. Der Produzent legt weiterhin nur lokal Kandidaten ab; kein neuer Datenpointer, kein Fake-Zeitpunkt, keine Warnungsänderung. Der alte 0–6h-Fast-Lane-Draft #542 bleibt unabhängig und nicht in Produktion.

**Source-/Release-Gate**: Erst nach tatsächlich grüner Quellprüfung am neuen SHA und vollständigem MID-Bot/Installer/Worker/Pages/Finalize erfolgreich veröffentlicht. Kein numerisch bewiesener Beschleunigungsgewinn ohne echte identische DWD A/B-Samples; keine 60min-P95-Zusage.

---

# MID v0.9.85.393 · echte GeoSphere-Schneemessungen: Missing ≠ 0

**Verifizierte Quelle:** v0.9.85.392, `main=mid-stable` SHA `74f39cc3ea371e8e1ddae5d09d16e77241864a32`. Vorgänger-Release Source-PR #556, Installer #41279397041 vollständig erfolgreich (Core/Heavy/Worker/Pages/Finalize); fünf Rulesets. Alte .392-Snow-PR #558 @ `fbd497ea87cb63a435aa15b6eed992466ebe8140` wurde wegen paralleler .392-Design-Promotion NICHT auf main gemergt. Code- und Testblobs selektiv, vollständig SHA-geprüft und ohne Rebase/Reset auf neuen Stable-Tree portiert.

**Ursache:** `Number(response.valueCm)` wandelte JSON-`null` aus einem `available:true`-GeoSphere-Worker-Response in 0 cm. Fehlende Stationshöhe/-Distanz konnte ebenfalls 0 vortäuschen; zukünftige Messzeitpunkte wurden nicht sicher abgegrenzt. Der neue Produktionshelfer `src/mountainSnowObservation.ts`, Blob `bfe059888f6fef1bb6b1eaca76b18ce59d3681d1`, akzeptiert nur echte endliche numerische Werte, reale 0 cm und eine valide Stations-ID. Stationshöhe und Höhendifferenz müssen tatsächlich vorliegen und innerhalb 2 m konsistent sein; Entfernung höchstens 25 km, Höhenunterschied ±350 m, Messzeit höchstens 3 h alt bzw. 15 min in der Zukunft. Lücken bleiben nicht verfügbar, nie 0.

**Tests:** Dieselben 32 dynamischen adversariellen Parserfälle sind im bestehenden obligatorischen `scripts/test-mountain-data-quality-0985110.mjs` verankert. Der isolierte Legacy-Loader `scripts/test-mid-079901-fixes.mjs` liest die echte Helper-Quelle statt eines ungeprüften Mocks. Der frühere .392-PR #558 bestand Source-Run #41279299993 vollständig mit 12 Pflicht-Gates, aber **dieses Ergebnis wird ausdrücklich NICHT für den neuen SHA wiederverwendet**. Vor .393-Veröffentlichung erneut komplette 1059 Source-/Core-/Heavy- und Installer-Gates, reale Worker-/Pages- und Stable-Promotion. Kein echtes iOS-Geräte-/VoiceOver- oder neuer TAWES-Live-Provider-Readback aus den Tests behauptet.

**Abgrenzung:** DWD-RUC, ICON-D2-Vollgebiet, ECMWF 0,1°, INCA/C-LAEF, weitere Schneestationen und Skybar bleiben unverändert; Warnungen amtlich getrennt. Technische Produktionsveröffentlichung ausschließlich über kontrollierten Source-PR → SHA-Bot → serverseitiges ZIP → Installer/Worker/Pages → Stable.

---

# MID v0.9.85.392 · Designaudit #523/A3: WMS-Legenden, Zugänglichkeit und Exportprovenienz

**Verifizierte Ausgangsbasis:** v0.9.85.391, `main=mid-stable` SHA `79b3a8cb995f780c863d6f4b1762155f80e09a15`, PR #553 / Source-Gate #41275254803 / Installer #41276158578 vollständig erfolgreich. Fünf Schutzrulesets. Parallele Drafts #555/#551/#554 und weitere RUC/Designarbeiten nicht überschrieben.

**Änderung:** Die beiden Kartenansichten behalten ausschließlich bestätigte DWD-/ECCC-WMS-Legenden für Produkt, Stil, Lauf, Zeitpunkt und Niveau. Das Originalbild kann über den gemeinsamen allowlist-geschützten Proxy separat in voller Größe betrachtet werden (44px-Touchziel, sichtbarer Tastaturfokus, kein `window.opener`). Bildfehler sind URL-gebunden. Die UI behauptet weder numerische Barrierefreiheit einer Bitmap noch eine vollständige WMS-PNG-/SVG-Exportfunktion. Native Modellkarten- und Exportdaten, RUC, DWD-Warnungen und meteorologische Zeitsemantik unverändert.

**GetLegendGraphic-Vertrag:** Der bereits existierende Proxy übersetzt die internen `layers/styles` bei echtem `GetLegendGraphic` in `layer/style` (Singular) und verhindert einen stillschweigenden Default-Stil. Diese bereits korrekte Transformation wird ab .392 durch denselben obligatorischen Kartenregressionstest geschützt. Die offizielle GeoMet-WMS-Dokumentation schreibt `STYLE` im Singular vor.

**Regressionen und Grenzen:** 1059 Pflichtregressionen in beiden Inventaren ungekürzt, 38 Vertragsregistereinträge. Echte DWD-/ECCC-Readbacks, verifizierte numerische Originalklassen, WMS-Exportparität und echte iOS-/VoiceOver-/Browser-/Viewport-Abnahme bleiben offen. Vollständiger Source-PR-Gate → kontrollierter SHA-Bot → serverseitiges Release-ZIP → `install-mid.yml` → Worker/Pages/Finalize → Stable-Promotion weiterhin zwingend; bis dahin kein Produktivrelease.

---

# MID v0.9.85.391 · Designaudit #523/A3: echte WMS-Anbieterlegenden in beiden Kartenansichten

**Live freigegebene Ausgangsbasis:** v0.9.85.390, `main=mid-stable` SHA `8a886b3695ca0ae6ae94e7c18b1bfeb790ddb0a2`; vollständig erfolgreiches Source-Gate #41244176018, SHA-gebundener PR #550 und Installer #41245171750 (Core/Heavy/Worker/Pages/Finalize). Fünf Rulesets aktiv.

**Geschützte Herkunft:** Fachliche Draft-Arbeit in PR #552 @ `5cbfa528680fbd0a23e07d63d039df4e80f7eecc` aus .389 stammt von sechs Git-Blobs; zur Integration auf aktuelle .390-Stable werden Änderungen gezielt, ohne Cherry-Pick der veralteten Basis, erneut angewendet. Insbesondere der .390-`weatherMapFrameReady`-Vertrag und die zugehörigen Negativtests bleiben erhalten. Zusätzliche Parität: `WeatherMapsPanel` zeigt die identische Anbieterlegende ausschließlich nach tatsächlich abgeschlossener WMS-Kacheldarstellung; ein Wechsel von Modell, Lauf, Gültigkeit oder Niveau verbirgt zuvor bestätigte Legenden bis zur neuen Kachelbestätigung.

**WMS-Provenienz:** `GetLegendGraphic` über bestehenden DWD-/GeoMet-Worker-Proxy ausschließlich für freigegebene Wetterkarten-Layer und syntaktisch gültige gewählte WMS-Styles. Keine externen Direkt-URLs, keine synthetischen Farb-/Wertklassen, keine Umdeutung als amtliche Warnungen. Provider-Fehler werden sichtbar als fehlende Legende statt als Nullwert behandelt. Nativer Raster-/Export-Skalenvertrag bleibt unverändert.

**Regression & Restabnahme:** Bereits verpflichtendes `scripts/test-unified-map-layers-0985167.mjs` erweitert um ausgeführte URL-/Allowlist-/Style-Tests und beide UI-Verkabelungen; unverändert **1059/1059** Pflichtregressionen einschließlich .390-WMS-Lauf-/ValidTime-/Level-Fällen und 24-Fälle-Browsermatrix. Echte provider-spezifische GetLegendGraphic-Readbacks und barrierefreie numerische Klassenbeschriftungen sind eigene Restpunkte: nicht als WCAG-2.2-AA- oder iOS-/VoiceOver-Abnahme aus Unit-Tests ableiten.

**Veröffentlichung ausschließlich nach** vollständigem Source-PR-Gate → kontrolliertem SHA-Bot-Merge → serverseitigem Release-ZIP → `install-mid.yml` → Worker/Pages/Finalize → `mid-stable`. Bis dahin Kandidat, kein Produktivrelease.

---

# MID v0.9.85.390 · Designaudit A3: WMS-Modelllauf-, Gültigkeits- und Höhenflächen-Gate vereinheitlicht

**Verifizierte Quelle:** v0.9.85.389, `main=mid-stable` @ `6e449be3baf13e9c33ec206864189dd4b580d482`; PR #549 und Installer #41240348162 vollständig erfolgreich mit Core, Heavy, Worker, Pages, Finalize. Fünf aktive Rulesets und 1.059 Pflichtregressionen erhalten.

**Ursache und fachliche Abgrenzung:** Die Legacy-Wetterkartenansicht verwendet `weatherMapFrameReady` und verweigert unbestätigte WMS-Metadaten, unbekannte Lauf-/Gültigkeitszeiten und nicht gelistete Vertikalniveaus. `UnifiedWeatherMap` verwendete bisher nur Layergleichheit, ausgewählten Termin, Lauf-String und URL, wodurch unvollständig qualifizierte WMS-Kachelanfragen möglich waren. Die vereinigte Ansicht verwendet jetzt **denselben** vorhandenen Validator, einschließlich korrekter akkumulativer Mindestvorlaufzeiten. Kein synthetischer Nullwert, keine automatische Fallback-Karte und keine Änderung der amtlichen Warnsemantik.

**Test:** Der bestehende verpflichtende `scripts/test-unified-map-layers-0985167.mjs` führt aus der echten TypeScript-Quelle transpilierte WMS-Validatorfälle für korrekten/fehlenden Lauf, Termin, Layer, Höhenfläche, Providerfehler und 6h-Niederschlagsfenster aus und erzwingt den korrekten Renderpfad in `UnifiedWeatherMap`. Beide Pflichtinventare unverändert **1059**. Echte Browser-/iOS-/VoiceOver-Gates dürfen erst nach konkreter Durchführung grün genannt werden.

**Releasegrenze:** `v0.9.85.390` ist erst nach vollständigem Source-PR-Gate, SHA-Bot, serverseitigem ZIP, Installer, Worker/Pages und Stable-Promotion veröffentlicht. Keine direkten Hauptbranch-Schreiboperationen.

---

# MID v0.9.85.389 · Designaudit #523: Modell- und Parameterauswahl bei Karten-Navigation erhalten

**Provenienz:** Ausgangsbasis ist veröffentlichte v0.9.85.388, `main=mid-stable` SHA `11c56661b371bf9c0da49d0836fcb548d46bf46f`, Installer #41236833866 vollständig erfolgreich. Die Quell-/Testblobs des auf .387 basierenden Drafts #547, Head `a73b9009172e0f778604314ecca7ea8bed53d8f1`, werden auf die danach freigegebene Stable neu integriert; unveröffentlichte Branches und weitere parallel laufende RUC-/KNMI-Arbeiten werden nicht umgeschrieben.

**Fehlerursache:** Der historische Wetterkarten-Einstieg löst `view:'models'` aus. Der bisherige Handler wertete dies wie den ausdrücklichen Summen-Einstieg aus, forderte `icon-d2-precipitation-totals` an und ließ `UnifiedWeatherMap` die Nutzerwahl auf `parameter:'totals',modelId:'icon-d2'` persistieren. Der neue Handler bewahrt bei `models` die vorhandene Wahl; nur `totals` fordert ein Summenprodukt an. Legacy-Migration wird auf einen tatsächlich gespeicherten `totals`-Wert ohne vorhandene Unified-Map-Einstellung beschränkt.

**Regressionsschutz:** Bereits obligatorischer Test `scripts/test-map-workspace-handoff.mjs` erweitert um aus TypeScript transpilierten Initializer-/Event-Handler-Test für Modell-/Summeneinstieg, Radar-Negativfall, historische Migration und vorhandene ICON-EU/Wind-Wahl. Beide bisherigen vollständigen Testinventare enthalten unverändert je 1059 Tests. Keine RUC-, Wetterwarnungs-, Zeit-/Feld-, Export- oder Worker-Produktionsänderung. Quell-/Unit-Prüfung ersetzt keine unabhängige Browser-/iOS-/VoiceOver-/Viewport-Abnahme.

**Freigabe:** Erst nach vollständigem Source-PR-Gate, SHA-gebundenem Bot-Merge, serverseitigem Release-ZIP, `install-mid.yml`, Worker/Pages und Stable-Promotion. Bis dahin ausschließlich Kandidat.

---

# MID v0.9.85.388 · DWD-RUC-Verfügbarkeit und Pages-/Worker-Frische lesend beobachten

**Ausgangsbasis:** `main=mid-stable` v0.9.85.387 bei SHA `83d5c1d9e7c0ce082242e71aec855d8319340169`, `install-mid.yml` #41232575766 vollständig `success`. Der unabhängige RUC-Entwicklungs-Draft #542 mit Head `a75716f567e4cf321cfc648de7ba1c8375ea3368` lieferte SHA-identische DWD-/Pages-/Worker-Beobachter-, Shadow-Qualifikations- und Testdateien. Die neue reine Messinfrastruktur wird auf dem bestätigten Stable-Code integriert; P2/P4/P5-Produktivteile verbleiben auf Draft.

**Meteorologische Korrektheit:** Verzeichnisanzeige belegt nicht die amtliche DWD-Erstpublikation. Poll-Abstände, lückenhafte GRIB-/EPS-Aussagen, tatsächliche Seiten-/Worker-Sichtbarkeit und nachgewiesene Endnutzer-App-Adoption sind getrennt; fehlende Daten werden niemals zu 0/„trocken“ umgedeutet. Die Diagnostik darf keine Warnungen, Modellfusion oder Fast-Lane-Pointer beeinflussen.

**Sicherheit:** Der neue 15-Minuten-Beobachtungsworkflow besitzt ausschließlich `contents: read`, schreibgeschützte Fremddatenproben, maximal 14 Tage Retention, keine eigenen Secrets, keine Workflow-Dispatch-, Worker-/Pages- oder Stable-Schreiboperation und gibt ausdrücklich kein ≤60-min-Produktions-SLO frei. Die bestehende 27h-/20-EPS-RUC-Produktion bleibt unverändert.

**Unverändert offene Aufgabe:** P2 echte aktive Fast-Lane-Atomizität/Rollback/Client-Parität; P4 authentische datengetriebene und doppeltabgeglichene Single-Flight-Steuerung einschließlich bereits extern gesperrter Tests; P5 168h historische Livebeobachtungen, P50/P90/P95 und App-/Widget-/Export-Adoption. Kein Source-Gate darf diese separaten Freigaben ersetzen.

**Releasepfad:** Nur SHA-gebundenes Source-PR-Gate → MID-Release-Bot → serverseitiges ZIP → `install-mid.yml` → Worker-/Pages-Prüfung → Stable-Promotion. Keine parallelen Design-PRs überschreiben; alle 1.059 bestehenden Regressionen bleiben verpflichtend.

---

# MID v0.9.85.387 · Designaudit A3: vollständige Tagesintervalle und PoP-NoData (Source-Kandidat)

**Verifizierte Basis:** v0.9.85.386 `main=mid-stable` SHA `b6eba7bea8a42bc78841955b3eeac8a392510d12`, Installer #41218322192 vollständig erfolgreich. Separater `chatgpt/v0.9.85.387-design-a3-precipitation-integrity`-Integrationskandidat; bis nach vollständig erfolgreicher Promotion **keine veröffentlichte Stable-Version .387**. Der parallele RUC-.387-Draft #542 bleibt gesichert und bedarf vor einem eigenen Release einer neuen Versions-/Stable-Koordination.

**Meteorologischer Vertrag:** A3-Tagesdetail verwendet für 3h-Niederschlag und PoP ausschließlich vollständige, gültige beitragende Intervalle; Missing bleibt Missing. Ersatz-Tagesprodukte aus stündlichen Werten benötigen lückenlose Originalintervalle zwischen echten lokalen 23h/24h/25h-Kalendertaggrenzen. PoP-Linien werden bei fehlenden Werten segmentiert, auch Tooltip, Stundenliste und ausgewählter Marker stellen 0 % nur bei gültiger Null dar. Die kanonische Tagesquelle bleibt vorrangig. Amtliche Warnfarben, WMO-Codes, Quell-/Modelllauf, Karten/WMS und RUC unverändert.

**Regressions- und Releasegrenze:** Neuer Pflicht-Test `scripts/test-design-a3-precipitation-integrity-0985387.mjs`; bisherige 1058 pro Inventar vollständig erhalten, jetzt 1059. Vollständiges Source-PR-Gate, SHA-gebundener Bot, serverseitiges Release-ZIP, `install-mid.yml`, Worker-/Pages- und Stable-Promotion bleiben zwingend; keine reale Geräteabnahme allein durch Quell-/CI-Prüfungen. Designaudit #523 bleibt für A1–A5, Widgets/Exporte und echte Accessibility-/Viewport-Nachweise offen.

# MID v0.9.85.386 · Designaudit A1/A2: bekannte Null von fehlenden Niederschlagsdaten trennen

**Quellenbasis und Integration:** v0.9.85.385 auf `main=mid-stable` SHA `1ade69f46b9bf77e9adaa360353ffacc7a0b967c` nach vollständig erfolgreichem Installer #41197737906. Feature-Herkunft: Design-Draft #538 SHA `f93203729414b8f706691fb5dce52008cbed99a4`, ausschließlich über geprüften Stable-basierten Integrations-PR #540. Die parallele Cleanup-Arbeit PR #543 und RUC-Shadow-PR #542 sind nicht Bestandteil dieses Quellstands.

**Meteorologischer Vertrag:** Die 90-Minuten-/24h-/7d-/14d-Darstellungen unterscheiden bekannte 0 mm / 0 % explizit von unbekannten/fehlenden Werten. Mengen und PoP müssen zum selben Vorwärtsintervall gehören; nicht endliche bzw. lückenhafte 24h-Beitragsintervalle sind unvollständig und dürfen nicht als trocken erscheinen. Fehlende 7d-Stundenmengen erhalten ein dezent gestricheltes Missing-Symbol statt Nullbalken. Die 14d-Ens-Visualisierung verwendet für unbekannten Niederschlagsstatus ein neutrales Markerzeichen; kein amtliches Warnsymbol.

**Release-Sicherheitsgrenze:** MID_BASELINE.json erhält alle 1.057 bestehenden Pflichtregressionen einschließlich `scripts/test-revision-parallel-matrix-0985385.mjs` und ergänzt `scripts/test-precipitation-availability-0985386.mjs` in beiden Inventaren auf jeweils 1.058. Vor Veröffentlichung sind vollständiger Source-PR-Gate, SHA-gebundener Bot-Merge, serverseitiges Release-ZIP, `install-mid.yml`, Worker/Pages und Stable-Promotion zwingend. Light/Dark-/Viewport-, iOS- und VoiceOver-Prüfungen dürfen ausschließlich mit tatsächlicher Evidenz als bestanden gelten. Designaudit #523 bleibt für appweite Seiten-/Export-/Widget-Checks offen.

# MID v0.9.85.385 · vollständige parallele CI-/Nightly-Revision mit SHA-Pin

**Geprüfte Ausgangsbasis:** Vor Änderungen waren `main` und `mid-stable` auf v0.9.85.384, SHA `4901049d973b14015959ee576ede49a9de6a6489`, identisch; fünf Rulesets aktiv. Der neue, ausschließlich auf `chatgpt/v0.9.85.385-revision-parallel` entwickelte Stand trennt die bisher 1056/1056 seriell im einen Job gestarteten Revisionstests nach Aufnahme des neuen Matrix-Vertragstests in 1057 verpflichtende Regressionen und zehn isolierte Runner-Gruppen: `core-1/4` bis `core-4/4`, `heavy-browser-state`, `heavy-native-map`, `heavy-mountain-visual`, `heavy-unified-map` mit 1/3 bis 3/3. Das bestehende disjunkte Inventar sowie alle 24 Browserfälle und die 20-Zyklen-Speicherprobe bleiben vollständig.

**Sicherheit und Geltung:** Der neue read-only SHA-Pin prüft bei zeitbezogenen Stable-Revisionen `main=mid-stable` und für Stable-Pushes den identischen Event-SHA. Alle Matrixjobs checken denselben Quell-SHA aus und verwenden den unveränderten Lockfile-/Build-/Browser-/VITE-Vertrag. GitHub-Matrix `fail-fast:false`; CI-/Nightly-Endprüfung verlangt alle Pflichtjobs `success`; keine Umdeutung übersprungener, ausgefallener oder unvollständiger Tests. Kanonische Datei `ci/github/workflows/mid-code-revision.yml` und aktive `.github/workflows/mid-code-revision.yml` bleiben bytegleich. Der neue Pflichtregressionstest `scripts/test-revision-parallel-matrix-0985385.mjs` schützt die Matrix gegen Auslassung und schwache Erfolgsbedingungen. Die sonstigen Source-Gate-, kontrollierten Merge-, serverseitigen ZIP-, Installer-, Worker-/Pages-, Stable-, Signatur- und Reuse-Gates bleiben unverändert. Der alte, nicht genutzte `task=install`-Altpfad wird nicht als Freigabe genutzt und bleibt gesondert zu bereinigen.

**Abnahme:** Die bisherige Push-Revision v0.9.85.384 #41190759637 dauerte 48:52, davon die vollständige Regressionssuite 2851,1 Sekunden mit dem Einzeltest `test-unified-map-layers-0985167.mjs` allein 1442,7 Sekunden. Frühere echte Source-PR-Matrixjobs bestätigten die Ausführung aller drei Map-Browsergruppen in separaten Runnern. Eine reale Verringerung der post-release Push- und Nightly-Laufzeit auf etwa 15–20 Minuten ist zunächst nur Hypothese und erst nach vollständig bestätigtem neuen Release plus mehrmaligem SHA-identischem A/B-Benchmark als Erfolg zu melden. Keine Freigabe von signiertem Artefakt-Reuse (#526) durch diese Beschleunigung.

# MID v0.9.85.384 · schreibgeschützte SHA-Prüfung der vollständigen Releasekette (Issue #526)

Verifizierte freigegebene Basis vor diesem Branch: `main=mid-stable` v0.9.85.383 @ `f14d4dc1b2bb4f75ba9fe45347415d2682225073`; fünf GitHub-Rulesets aktiv. Der ausschließlich lesende `tools/ci/release-chain-integrity.mjs` prüft bei **unabhängig aktuell beschafften** GitHub-Daten die exakten Source-PR- und Bot-Referenzen, Source-Jobpfad, PR-Base-/Merge-Parent, ZIP-only-Paketcommit, Installer-Run/Attempts, vollständige Core-/Heavy-/Worker-/Pages-/Stable-Gates, Stable-Parent sowie nicht doppelt gezählte GitHub-Wallzeiten. Bei unvollständigen/fremden/duplizierten Ergebnissen fail-closed; Tests mit negativen Provenienzfällen im obligatorischen `scripts/test-release-timing-0985376.mjs`-Pfad. Reproduzierbarer Vertrag: `docs/implementation/MID_RELEASE_CHAIN_OBSERVATION_384.md`. Keine Änderungen an produktiver Wetterlogik, RUC, UI, Worker- oder GitHub-Releaseworkflows.

**Klare Grenze:** Diagnostik ist keine unabhängige GitHub-Provenienz-Authentisierung, keine echte Sigstore-Signatur, keine Build-/Testartefakt-Gleichwertigkeit, keine Test- oder Releaseberechtigung. `signatureVerified=false`, `releaseAuthorized=false`, `reuseAuthorized=false` bleiben. Issue #526 bleibt für echten geschützten Signer-/Verifier-Lauf sowie signierte A/B-Ein- und Ausgaben mit voller Installer-/Worker-/Pages-/Stable-Gate-Parität offen. Kandidat darf erst über den regulären Source-PR-Gate, SHA-gebundenen Bot, serverseitiges ZIP, Installer und nachweisliche Stable-Promotion veröffentlicht genannt werden.

# MID v0.9.85.383 · RUC-Publikationsreadback gegen exaktes geprüftes 27h/20-EPS-Manifest

Verifizierte Stable-Basis `main=mid-stable` v0.9.85.382 @ `e539d4b0db4e84587af3aeef4fbc5c32e160142c`. Der DWD-RUC-EPS-Frühcheck aus .382 verwirft unvollständige Modellkandidaten bereits vor weiteren Downloads. Ergänzend prüft der RUC-Publish in .383 exakt die 28 stündlichen ValidTimes der vier Quellenachsen, die 20 Ensemblemitglieder und die unveränderte native Rastergeometrie gegen den bereits SHA-geprüften Snapshot auf Pages und im Worker. Fehlende, verkürzte oder typfalsche Zählungen sind nicht mehr anhand von Mindestzahlen zulässig. Der unabhängige meteorologische Vollbuilder, Codec/NoData, Retrybudget und vollständige Releaseketten bleiben unverändert. Reproduzierbar: `docs/implementation/MID_RUC_HEALTH_MANIFEST_PARITY_383.md` und `tools/ruc/test_ruc_health_check.py`. Keine produktive Freigabe vor vollständig bestandenem Source-/Installer-/Pages-/Stable-Pfad.

# MID v0.9.85.382 · DWD-RUC-EPS-Metadaten vor der teuren Modellaufbereitung prüfen

Quellbasis: `main=mid-stable` v0.9.85.381 @ `f91696cb3468730a4b4473c5ff1cc86b0ab57869`. Nach dem nachgewiesenen EPS-Mitgliederausfall des 04Z-Laufs am 31.10.2026 erfolgt die vollständige native Headerprüfung des DWD-RUC-EPS zuerst. Das verhindert nur unnötige Folgearbeit bei bereits im Header unvollständigen Kandidaten, ersetzt nicht den unabhängigen, vollständigen meteorologischen/NoData-/Bitmap-/Worker-/Pages- und Stable-Prüfpfad. Konkrete Negativtests und Grenzen: `docs/implementation/MID_RUC_EPS_EARLY_PREFLIGHT_382.md`. Sourcekandidat bis vollständig belegter regulärer GitHub-Releasekette.

# MID v0.9.85.381 · CI/CD-Phasenmessung und A/B-Nachweisgrenzen

Verifizierte veröffentlichte Basis `main=mid-stable` v0.9.85.380 @ `e6d70e1104bee5980ac5153fc99f59775756014e`, Installer 41123191600 vollständig success. Die bisher rein lesende Release-Timing-Diagnose erhält eine systematische sekundengenaue, parallele Intervalle nicht mehrfach addierende Aufschlüsselung für Queue, Setup, npm, Build, Core, Heavy, Bot, Releasepaket, Worker, Pages und Stable. Tatsächlich ausgeführte Runnersekunden, Vereinigungswallzeit und Spannweite inklusive Leerlücken bleiben auseinandergehalten. Pro Workflow/Phase werden nur vollständig beobachtete erfolgreiche Läufe in P50/P95 aufgenommen, Missing/Skips/Retries explizit getrennt. Adversarielle Node-Regressionsbelege werden im bereits verpflichtenden `scripts/test-release-timing-0985376.mjs`-Pfad ausgeführt. Keine Tests entfernt, keine neue Releaseberechtigung, keine Artefakt-/Prüfungswiederverwendung, keine Produktmeteorologie geändert. Dokumentiert unter `docs/implementation/MID_CICD_PHASE_OBSERVATION_381.md`; Phase-2-Sigstore-Live-Abnahme und Phase-4-echte identische-Tree-A/B/Reuse-Gleichwertigkeit aus #526 weiterhin offen. Kandidat bis vollständig bestätigter regulärer Source-PR/Installer/Stable-Pfad.

# MID v0.9.85.380 · geschützte Signaturbeobachtung unabhängig gegenprüfen

Quellbasis `main=mid-stable` .379 @ `c4fd1c79d0b7272b7998c79cd88d445b5681e81d`, Installer 41118131439 vollständig erfolgreich. Der bisher nur manuelle geschützte Source-Signaturpilot bekommt einen zweiten, ausschließlich lesenden Signaturverifikationsjob, der erst nach bestandenem Signing GitHub-Artefaktbytes, echte Sigstore-/SLSA-Signaturidentität, Run-/Attempt-/Workflow-/Main-SHA, vollständige Pflicht-Source-Jobs, PR-/Tree-/Stable-Provenienz und 24h-Gültigkeit anhand frisch abgerufener GitHub-Daten prüft. Ein unvollständiger, überholter, doppelter oder fremder Beleg führt immer zu einer Ablehnung. Originaler Signierer und unabhängiger Verifier halten strenge getrennte minimale Rechte. Keine Source-/Installer-/Worker-/Pages-/Stable- oder meteorologische Regression wird ausgelassen. Die unveränderte Pflichtparitätsregression lädt neue adversarielle Negativtests. `releaseAuthorized=false` und `reuseAuthorized=false` bleiben zwingend. Ein realer Signaturlauf nach Promotion sowie identische-Tree A/B-Artefakt-/Test-Wiederverwendungsqualifikation sind ausdrücklich weiter offen (#526); dies ist kein Freigabenachweis für produktiven Reuse. Technische Evidenz: `docs/implementation/MID_PROTECTED_SIGNATURE_VERIFICATION_380.md`. Sourcekandidat bis vollständiger regulärer Releasekette.

# MID v0.9.85.379 · isolierter geschützter GitHub-Source-Attestierungs-Pilot

Verifizierte Basis `main=mid-stable` v0.9.85.378 @ `745ee5945fd90a11614400016efb78965da08d71` mit Installer 41106636347 vollständig success. Selektive SHA-gebundene Übernahme von neun ausschließlich diagnostischen CI/Sicherheits-Qualifikationsdateien aus Draft #530 Head `b043b9348171f0b2af2cbbd6b6f5bc4f963a8881` auf eigenständigem `chatgpt/v0.9.85.379-protected-attestation-pilot`, ohne Draft-History-Änderung. Signatur-Pilot nur manuell auf echtem geschütztem `main`; die offizielle voll-SHA-gepinnte `actions/attest`-Aktion attestiert einen unabhängig mit read-only GitHub-API überprüften Run-/PR-/Quellbaum-/Jobbeobachtungsbericht, kein PR-Code wird ausgeführt. Der signierende Job allein besitzt minimales `id-token:write` und `attestations:write`; kein Releasezugriff. Versuchsweise signierte Beobachtung ist **nicht** die vollständige vertragliche Artefakt-/Build-Attestierung, darf keine Tests/Worker/Pages/Stable-Checks ersetzen und schaltet weder Build- noch Test-Reuse frei. Vertrag, Fachlogik und Designs unverändert; Version, iOS-/Worker-/PWA-/Web-Spiegel synchron. Details und Negativtests: `docs/implementation/MID_ARTIFACT_REUSE_QUALIFICATION_378.md`; offene Sicherheits-/A/B-Kriterien: Issue #526. Release nur über SHA-gebundenen Source-PR-Gate → botgeschützten Merge → Server-ZIP → unabhängigen Installer → Worker/Pages → Stable-Promotion.

# MID v0.9.85.378 · appweite Diagrammlinien und NoData-Zeichnung

Verifizierte Stable-Basis `main=mid-stable` .377 @ `44f5d02b0374b275e423e43233addff91d4eeb82`, vollständige Release-Gates der .377 bestätigt. Selektive Codeübernahme aus bestehendem Design-Draft #524 nur für SHA-identische, seit .373 nicht geänderte Verbraucher; die ursprünglichen Draft- und Attestierungs-Branches bleiben unangetastet. Gemeinsame Linien-/Farbsemantik für 24h/7d und kumulierte Niederschlag-Datenlücken in 14d: Missing niemals als 0, keine synthetisch durchgehenden Linien, echte 0 mm erhalten, Modell-/ENS-/Zeitsignale nicht umgeschrieben. Dateien, zweifache obligatorische Regression und Provenienz in `docs/design/MID_PARAMETER_LINE_AUDIT_0.9.85.378.md`. Alle Version-/Worker-/PWA-/iOS-Spiegel für .378 synchron. Nur Source-Kandidat bis vollständiger Source-PR-Gate → SHA-Bot → Server-ZIP → Installer → Worker/Pages → Stable-Nachweis. Kein Design-Draft wird vorzeitig selbst veröffentlicht.

# MID v0.9.85.377 · Build-Parität und reproduzierbare Laufzeitdiagnose

Basis main=mid-stable `.376` @ `c8ec5614a5d2b6833b87029e59d048ef90029c2d`. Installer 41074944208 vollständig erfolgreich, Worker-Smokegate mit unverändertem produktivem .372-Worker, Pages und exakte Stable-Promotion belegt. SHA-gesicherte getrennte Eingänge Draft #527 `093f112cdcbb93104aa5b31d7cfc497f9cff9e72` und Draft #528 `6d2a4c317226af60747ffcd8b8176ab59de192f3`; vollständige gemeinsame .377-Versionierung und Baseline erst im Integrationszweig. Design-Draft #524 unverändert.

Belegter Source-Cache-Engpass (605–606s, account-egress-Limit) durch explizites package-manager-cache:false am unveränderten Node-/Action-Pin entfernt; npm ci und alle Tests bleiben verpflichtend. Laufzeitdiagnose lädt frühere Run-Versuche, erkennt zwischenzeitlichen Attempt-/Head-/Statuswechsel und zählt tatsächlich identische Jobausführungen nur einmal. Skipped-Zeitstempel und unvollständige Messungen dürfen keine künstlich kurzen Perzentile erzeugen. Runnerzeit ist gemessene Jobzeit, keine Kostenabrechnung. Nach erfolgreichem Installer erfolgt eine rein lesende Diagnose. Ein isolierter Doppelbuild vergleicht alle Dateien und Größen sowie Source-/Tree-/Lockfile-, Node-/npm-/Runner-/VITE-Fingerprints. Vor-/Nachprüfung schützt Source- und Umgebungsbindung; Pfad-/Duplikat-/Symlink-Gegenproben. Zeitabhängige Build-Identität separat gegen Source und vollständigen Asset-Digest validiert; vollständige Bytegleichheit und zusätzliche Nutzinhaltgleichheit explizit getrennt ausgewiesen. Kein signierter Attestierungs- oder Testsprungvertrag und keine Wiederverwendungsfreigabe aus einem Fingerprint. Der Source-Bot erhält die dokumentierte queue:max-Warteschlange; bestehende Installer-Supersession und alle SHA-/Worker-/RUC-/Pages-/Stable-Gates bleiben unverändert. Nachweis docs/implementation/MID_RELEASE_QUALIFICATION_377.md. Nur Kandidat bis vollständiger Source-/Installer-/Stable-Abnahme; #526 bleibt für attestierte Wiederverwendung und echte A/B-Serien offen.

# MID v0.9.85.376 · Installer-Core parallel, Updatepakete sicher planen

Sourcekandidat auf verifizierter freigegebener Basis `main=mid-stable=.373` @ `05798c4134431a5fb0455ef5f71441b4a7051e38`. Draft #524 `.374` @ `3eabc7c53ccf2dfe71f359ae22598692c19555b9` bleibt separat; `.375-ensemble-nodata-a11y` zeigt auf unveränderte Stable-Basis und enthält zum Prüfzeitpunkt keine eigene Änderung. Keine dieser Arbeiten wird überschrieben oder integriert. .376 ist die eindeutige Versionskennung dieses unabhängigen CI-/Diagnosekandidaten, keine behauptete Veröffentlichung.

Vier vollständige disjunkte Installer-Core-Shards verwenden dieselben bisherigen unveränderlichen SHA-/Manifest-/Byte-Snapshots. Separater Build/Audit/Worker-Syntax/iOS-Core und sechs Heavy-Jobs bleiben Pflicht; Install/Worker/Pages/Stable benötigen alle erfolgreichen Verifikationsgruppen. Rein lesende Laufzeitmessung und Release-Train-Vorprüfung ergänzen den Prozess ohne neue Rechte. Explizites `candidateMode: draft-planning` erlaubt SHA-gebundene Inventarisierung geschützter Drafts, ohne deren Ready-Status zu verlangen oder irgendeinen Merge zu autorisieren. Dateiumbenennungen, vollständige Inventare, Branchfamilie und erneute Remoteprüfungen schützen die Planung. Der Provenienzpilot prüft eindeutige Job-IDs, Head-SHAs, konkrete Run-Attempts und erneute Ref-/PR-/Run-Metadaten. Keine attestierte Build-/Testergebniswiederverwendung und keine Testsprünge aktiviert. Nachweis und verbleibende A/B-/Artefaktqualifikation: `docs/implementation/MID_RELEASE_EFFICIENCY_376.md`, Issue #526.

Veröffentlichung nur Source-PR-Gate → SHA-Bot → Server-ZIP → install-mid.yml → betroffene Worker/Pages → Stable. Vor jedem Ready/Release den live Stable-/Parallelstand erneut prüfen; bei tatsächlichem Drift neu integrieren und vollständig prüfen. Keine gemessene neue P50/P95 oder physische Geräteabnahme behaupten.

# MID v0.9.85.373 · RUC-Snapshot-Wiederverwendung SHA- und quellvertragsgebunden vorab prüfen

Basis: bestätigtes main=mid-stable v0.9.85.372 @ `e8e8c60ecc36447dbd21cde239fac06d58314a7d`. Der RUC-Workflow 41040092625 scheiterte korrekt am unveränderten strengeren Snapshot-Kompatibilitätsvertrag, weil ein .371-Producer über Release .372 mit geändertem Worker-Vertrag erneut zugelassen werden sollte. Der vorgeschaltete `tools/release/ruc_resume_preflight.py` vergleicht beim identitätsgesicherten Kandidaten nun die **gleichen quellrelevanten Git-Dateipfade** wie `prepared_snapshot.compatibility`, einschließlich voller Worker-Unterteile, Daten-/Codec-/RUC-Code, ForecastFusion, RUC-Workflowvertrag und Abhängigkeits-Lockfile. Nur originalvertraglich normalisierte reine Versionsspiegel dürfen abweichen. Quelle nicht als Git-Ahn oder Historie/Quelle unklar bedeutet keine Wiederverwendung, sondern regulären Rebuild. Bestehender vollständiger `prepared_snapshot.admit`-Validator, Freshness, NoData/Bitmap, SHA, verlustfreier End-to-End-Codec, 900-MB-Budget sowie Worker/Pages-Stable-Gates werden nicht geändert. Vollständiger Nachweis `docs/implementation/MID_C53_RUC_RESUME_PREFLIGHT_373.md`. Keine Datenfrische- oder Produktionspublikation ohne eigenen erfolgreich absolvierten RUC-Run behaupten.

# MID v0.9.85.372 · WMS-Kartenkombinationen an veröffentlichte Quellen gebunden

Quellbasis `main=mid-stable=v0.9.85.371` @ `76fef22a9f10af06faa0566a01a93df150f2cdf9`. MID prüft für beide Modellkarten-Auswahlansichten die WMS-Layer und vorhandenen Zeit-/Lauf-/Höhenebenen in einem Worker-GetCapabilities-Snapshot je Anbieter. Nur ein authentifiziert erfolgreicher Providerkatalog darf einen Layer als `absent` oder aktuell ohne unverzichtbare Felddimension qualifizieren; Fehler bedeuten `unchecked`, erhalten gespeicherte Auswahl und native Raster. Die Kartenzeichnung für zeitgebundene WMS-Prognosen erfolgt erst bei nachweislich passendem Layer, Modell-INIT, ValidTime und ggf. Level. Ereigniszeitbezogene Nowcast-Karten bleiben fachlich unabhängig vom Modelllauf; leere Gefahrensignale und NoData sind keine Nullen. Die bestehende physikalische/geografische ICON-D2/RUC-Gebietsprüfung #446 wird nicht umgangen; generische WMS-Katalogverfügbarkeit ist kein Nachweis flächendeckender Pixel. Technische Evidenz `docs/implementation/MID_C53_MAP_AVAILABILITY_372.md` und neue Production-Regression im Pflichtinventar; ergänzender, explizit optionaler Live-GetMap-Auditor. Jede Veröffentlichung ausschließlich Source-PR-Gate → SHA-Bot → Server-ZIP → Installer → Worker/Pages → Stable.

# MID v0.9.85.371 · aktuelles deterministisches Open-Meteo BOM ACCESS Global stillgelegt

Basis `main=mid-stable` .370 `e27f5256c3c5d41348adbb3a7b85c22c9d473a5a`. Offizielle Open-Meteo-Quellen dokumentieren nach 26.06.2025 18 UTC keine weiteren Datenläufe für `bom_access_global`. Das Modell wird aus aktuellen deterministischen Forecast-Kandidaten und dem Worker-Fusions-/globalIds-Pfad entfernt. Modelle der unabhängigen Familien, BOM Ensemble `bom_access_global_ensemble`/`bom_access_global_ensemble_mean`, saisonales ACCESS-S2 und historische Provenienz bleiben unverändert. Vollständige kanonische Quellen und generierte Worker-/Frontend-Spiegel auf v0.9.85.371 synchron; neuer Selektions- und Quellenvertrag `scripts/test-openmeteo-bom-retirement-0985371.mjs`, Nachweis `docs/implementation/MID_C53_OPENMETEO_BOM_371.md`. Keine Modellgewichtung, meteorologischen Parameter, amtlichen Warnungen, RUC-Daten oder Wetterphasen geändert; GeoSphere AROME/C-LAEF-Umstellung weiterhin fachlich zu qualifizieren. Veröffentlichung ausschließlich über Source-PR-Gate, kontrollierten SHA-Bot, Server-ZIP, Installer, Worker/Pages und Stable-Promotion.

# MID v0.9.85.370 · begrenzte RUC-Wiederaufnahme im Watchdog

Basis main=mid-stable .369 `1470dc1ec3cf740ffec56e05e895aa92dfaf2bdb`, Installer40966776369 vollständig erfolgreich. #352: Der Watchdog wählt bei tatsächlichem Datenrückstand aus höchstens zehn jüngsten, maximal90min alten authentifizierbaren Producerläufen ein vollständig aufbereitetes unveränderliches Artefaktpaar. Der bestehende resolve_reuse-/reuse_run_id-Pfad bleibt einzige Zulassung; keine Neuberechnung, kein neuer Publishpfad. Frühere Wiederaufnahmeversuche bilden eine konservative Barriere gegen Wiederholungsschleifen. Aktive Läufe,18min-Cooldown, Main/Stable-Gleichheit, volle Byte-/Frische-/Vertrags-/Decoder-/Pages-/Worker-Abnahme bleiben unverändert. Sourcekandidat bis vollständiger Releasekette; tatsächlicher Betriebsnachweis separat. Nachweis docs/implementation/MID_C53_RUC_RESUME_370.md.

# MID v0.9.85.369 · Schnee-Summenfenster und Ereigniszeit trennen

Basis main=mid-stable=.368 `22ff7dc962378ebebe03d1a0e572585a8b4239f7` nach erfolgreichem Installer40961989406. Selektive Integration der fachlichen Änderungen aus Draft #516; dessen veraltete .367-Versionierung wird nicht übernommen. #515: Schnee-Gültigkeit an tatsächliche Schneestunden binden, keine erneute probabilistische Vorverlängerung, trockene Kalendertage schützen. Kanonisches Weather-Fragment und Aggregat synchron. Produktionshelper-, vollständige Hazard-/EPS- und tatsächliche Profilselektor-Regression in test-snow-exposure-0985369.mjs. Keine geänderten Mengen, Warnschwellen oder amtlichen Warnungen. Sourcekandidat bis vollständiger MID-Releasekette. Nachweis docs/implementation/MID_C52_SNOW_EXPOSURE_369.md.

# MID v0.9.85.368 · Anzeigepräferenz und Datenverfügbarkeit

Verifizierte Basis `main=mid-stable=317a07ecb842d40de82d67c04abfb25ecfc8eaf0`, veröffentlichtes .366. #508: 250-m-Nutzerwunsch getrennt vom aktuellen frischen, ortsgebundenen Datenangebot; kein automatischer persistenter Reset bei Metadata-/Netzfehlern. Gemeinsame Kartendetail-Snapshots mit atomaren Teiländerungen, synchroner Speicherung und Abonnements; 24h-Profillegende nutzt gemeinsamen dauerhaften Präferenzvertrag mit Legacy-0/1-Vorgabe. Modelllinien-Disclosure dauerhaft. Keine meteorologische Mengen-/Gewichts-/Warnänderung. Parallel-Draft #516 (.367 Schnee) unverändert erhalten; keine überlappenden Änderungen übernommen. Technischer Nachweis `docs/implementation/MID_C52_DISPLAY_AVAILABILITY_368.md`. Nur Sourcekandidat bis Source-Gate → SHA-Bot → ServerZIP → Installer → Worker/Pages → Stable.

# MID v0.9.85.366 · kanonische Karten- und Ensembleanzeige

Verifizierte Stable-Basis `v0.9.85.365` `723ef0e11f87963a47aee8a9df8a3c757d07d7ae`, bei Beginn `main = mid-stable`; offene Draft- und Abhängigkeits-PRs geprüft. Nur der Integrationsbranch `codex/v0.9.85.366-display-state-integrity` wird verändert, kein ZIP und kein direkter Schreibzugriff auf main/stable. Vollständiger fachlicher Nachweis: `docs/implementation/MID_C51_DISPLAY_DURABLE_366.md`.

`mid:composite-settings:v3` ist die kanonische Quelle; ein veraltetes `mid:composite-layers:v3` darf eine gültige explizite Auswahl `false` nicht überschreiben. RadarPanel synchronisiert gleichzeitige Ansichten und speichert Patches gegen aktuellen Stand, UnifiedWeatherMap verwendet die dauerhafte Lesebrücke statt stale Mount-Snapshot. Ensemble-UI-Präferenzen bleiben von löschbaren Wetterdaten-Caches getrennt. Keine Änderung der Meteorologielogik, der amtlichen Warnsemantik, RUC-Gewichte oder Produktiv-Schneedaten. Jeder Release benötigt erfolgreichen Source-Gate → Bot-SHA-Merge → serverseitiges ZIP → Installer → Worker/Pages → Stable.

# MID v0.9.85.365 · Sourcekandidat / Recovery nach blockiertem .364-Installer

Freigegebene Basis bleibt .363 `f0ccf4a448b5281a7bfc795d687544c06439104b`; bekannter main-Kandidat .364 `11733c934f8ac60ff109f8b7f175d5bf4fc6f9ef` hat zwei Installer-Core-Fehlschläge ausschließlich beim Chromium-Start. .364 wurde nicht veröffentlicht. Der .365-Branch beginnt auf Stable .363 und übernimmt den exakt geprüften .364-Source-Tree `007001fd25e5973c42e32e62f01f5e708c716b55`, ohne ZIP. Bestehender Source-Gate prüft ausdrücklich das Main-Alt-ZIP fehlgeschlagener Installer separat. Bekannte Lineage, kein unbekannter Drift oder direkter main/stable-Schreibzugriff.

Zusätzliche konkrete Rückkehrzustände in Bergwetter/Radar/Stundenliste/Pollen und Entfernung automatischer Präferenz-Resets. Ortssuche übernimmt validierten Mountain/Push-Browserstartvertrag: maximal zwei frische Profile, begrenzte45s-Startphase, unveränderte12s-UI-Waits/volle12-Fall-Matrix und Fault-Injection gegen fälschlich grüne Tests. Details `docs/implementation/MID_C51_DISPLAY_INVENTORY_RECOVERY_365.md`. Keine meteorologische Quelle oder Gewichtung geändert. Veröffentlichung erst nach vollständigem neuem Source-/Bot-/ZIP-/Installer-/Worker-/Pages-/Stable-Nachweis.

# MID v0.9.85.364 · Ansichts- und Parameterkontinuität

Verifizierte freigegebene Basis .363 `f0ccf4a448b5281a7bfc795d687544c06439104b`, main=mid-stable. Gemeinsame Präferenzen mit stabilen Objekt-Snapshots, sofortigen Writes und aktueller Quelle bei parallelen funktionalen Updates. Stunden-/Tagesdetails getrennt, bestehende Legacy-Parameter validiert, weitere Auswahlzustände in Klima/Karten/Extremwetter/Wasser/Route/Langfrist erhalten. Nachweis und QA-Grenzen `docs/implementation/MID_C51_DISPLAY_RETURN_STATES_364.md`. Keine meteorologische Quelle oder RUC-Gewichtung verändert. Nur Kandidat bis vollständigem Source-/Bot-/ZIP-/Installer-/Worker-/Pages-/Stable-Nachweis.

# MID v0.9.85.363 · dauerhafte Anzeigeauswahl

Basis .362 `7ced6f011d14e42b6bc9e79ccbb7cd237abbc9f8`. Validierte sofortige Speicherung zuvor flüchtiger Ensemble-/Karten-/Trend-/Pollen-/Klima-Schalter. Technische Abnahme und offene App-Gesamtinventur: `docs/implementation/MID_C51_DISPLAY_PREFERENCES_363.md`. Keine neue meteorologische Quelle, keine Gewichtänderung. Nur Kandidat bis vollständigen Source-/Installer-/Worker-/Pages-/Stable-Gates.

# MID v0.9.85.362 · gemeinsame native Plugin-Patchqualifikation

Verifizierte Stable-Basis: .361 `3b158eaf9634faa70c5c290da2171248dbf923bc`, main und mid-stable identisch. Sechs kompatible Capacitor-Plugin-Patches aus #474 werden mit neu erzeugtem Lockfile, strikten Versionsverträgen, ausführbaren Adapterprüfungen und nativer Synchronisierung gemeinsam qualifiziert. Core/iOS/CLI, React, MapLibre, Lucide und meteorologische Fachlogik bleiben unverändert. Nachweis: `docs/implementation/MID_C50_NATIVE_PLUGINS_362.md`. Kein physischer Geräte-/Signierungsnachweis. Source-Kandidat bis vollständigem Source-Gate → SHA-Bot → Server-ZIP → Installer → Worker/Pages → Stable.

# MID v0.9.85.361 · transaktionale First-Writer-Sicherheitsdiagnostik

Verifizierte Stable-Basis: v0.9.85.360 `c59004ec6a0858f4111d68abc716b5fb5c66b4be`. `scripts/lib/secure-diagnostics.mjs` behält den exklusiven 0600-First-Writer-Claim bei, schreibt sofort ein gültiges strukturiertes JSON und stellt die finale Diagnose über ein privates Stage-Verzeichnis und atomaren Rename bereit. Fehlgeschlagene Collector-Promises, zyklische/fehlende Payloads werden in datensparsame Fehlerflags statt in leere Dateien oder ungefilterte Fehlermeldungen überführt. `scripts/test-security-diagnostics-0985347.mjs` prüft parallele Schreiber, laufenden Claim, Symlinks, Screenshots, Dateirechte und Timing-Artefakte. Technischer Nachweis `docs/implementation/MID_C53_SECURITY_DIAGNOSTIC_0.9.85.361.md`. Der WebKit-CSS-Paritätsbefund im ersten Source-Gate führte zusätzlich zu einem begrenzten Animationsframe-/Layout-Stabilitätsnachweis vor den unveränderten computed- und Pixel-Assertions in `verify-fourteen-css-production-0985339.mjs`; bei weiterhin unterschiedlichem Layout bleibt das Gate rot und meldet den ersten DOM-Knoten. Keine CSS-Produktivänderung. Kein meteorologischer Algorithmus, keine Datenquelle und kein Gate gelockert; Alert-Instanzen #490 bleiben ohne konkreten Scanstatus offen. Release erst nach vollem Source-Gate → SHA-Bot → ZIP → Installer → Worker/Pages → Stable.

# MID v0.9.85.360 · datensparsame, vollständige Widget-CDP-Netzwerkdiagnose

Basis: veröffentlichtes `mid-stable` .359, SHA `f2400bdf8dbf1f8371451cf01cda13930bdf4707`. Der Widget-Capture startet mit privatem Browserprofil auf `about:blank`, aktiviert die CDP-Network-Domain und navigiert dann zur Widgetseite. Dadurch wird auch der erste Wetterabruf im Diagnosefenster erfasst. `tools/widget-export/network-diagnostics.mjs` verarbeitet Request, HTTP-Antwort, Fertigstellung, Fehler und Redirects, behält aber nur fest begrenzte kategorisierte Summen. URLs, Koordinaten, Zugriffstokens, Header und Bodies werden nicht gespeichert. Der exklusive Erstfehlerbericht bleibt unverändert geschützt. `scripts/test-widget-network-diagnostics-0985360.mjs` prüft 429, 504, DNS, Timeout, Abbruch, Redirect, Bufferlimit und Datenleck-Gegenfälle. Keine meteorologischen Quell-/Feld- oder Worker-Algorithmen verändert. Veröffentlichung erst nach komplettem Source-PR-Gate, SHA-Bot-Merge, neuem serverseitigem ZIP, Installer-Regressionen, Worker/Pages und `mid-stable`-Promotion. Keine echte reproduzierte Provider-Timeout-Ursache oder Geräteabnahme behauptet.

# MID v0.9.85.359 · zusammengefasste Actions-Wartung

Basis: veröffentlichte .358 `53198841d90c9e4cbbe4b5eb53b39cd1e64693da`. PRs #475–#477 werden selektiv über kanonische Workflowquellen und synchronisierte Spiegel integriert. Vollständige SHA-Pins, unveränderte Berechtigungen, Snapshot-/Release-Gates und erforderliche Tests. Keine Wetter-/Browser-Timeoutänderung. Veröffentlichung erst nach vollständiger regulärer Releasekette.

# MID v0.9.85.358 · farbreines Skybar-Grundband

Basis: freigegebene .357 `a9bc9b7e429e4d0d10d67e0ebc4d8e35d1d2caf1`. Der gemeinsame Renderer erhält für Gelb und Grau vollständig deckende Grundfarben; die Ausprägung bleibt ausschließlich an den unveränderten vier Balkendicken erkennbar. Direkte Sonnenscheindauer und Wolkenlücken bleiben in den Titeln fachlich getrennt. Quadrat-Klassenfarben, Sonnenränder, Missing und Niederschlagslagen bleiben erhalten. Nachweis: `docs/implementation/MID_C50_SKYBAR_COLORS_358.md`. Nur Source-Kandidat bis vollständigem Source-Gate → SHA-Bot → Server-ZIP → Installer → Worker/Pages → Stable.

# MID v0.9.85.357 · astronomische Skybar-Zustände in hohen Breiten

Basis: freigegebene .356 `4595367c3439639b25c7decd23d39d57ab66ed92`. Polartag/-nacht ohne tägliche Ereignisse, einseitige und über Mitternacht angeordnete Sonnenereignisse werden im gemeinsamen Astronomiekern und der Kurzfristinterpolation bestimmt. Kein erfundener Sonnenzeitstempel, kein meteorologischer Mengen-/Schwellenwechsel. Nachweise und Abnahmegrenzen: `docs/implementation/MID_C49_SKYBAR_POLAR_357.md`. Veröffentlichung erst nach vollständigem Source-Gate, SHA-Bot, Server-ZIP, Installer, Worker/Pages und Stable-Promotion.

# MID v0.9.85.356 · ECMWF-Originaldatenqualifikation

Basis: veröffentlichte .355 `48c4016d0b98244cb08aa560aa42b14d6c6754a7`. Selektive Integration des lesenden #433-Piloten mit drei Zyklen und vollständigem Zell-/Bitmap-/Geometrienachweis. Keine Produktivaktivierung; Source-, Installer-, Worker-/Pages- und Stable-Gates bleiben erforderlich.

# MID v0.9.85.355 · Installer-Recovery und Bergwetter-Klickvertrag

Basis: veröffentlichter Stable `c53dc8442abe4038fbc039e1b88432fdace831b7` / .353. Reparaturzweig vom früheren .354-Source-Merge `a0ce578e6ec439d30ef3affb48a228d8face0cea` (direkter Stable-Nachfolger), nicht vom installerroten Main-ZIP-Commit `ed25c9c4853cefef50bcba4f90e81e50a1a11805`. Neue echte CDP-Hit-Tests, Renderframes, Fehlermeldungen und Wind-Einheiten-Persistenz bei unveränderten Wetterdaten. Zusätzlich SHA-gebundener Source-ZIP-Provenienzguard, echte Git-Negativproben, byteidentische Release-Notiz unter docs/releases/ sowie isolierter zweiter Chromium-12s-Startversuch für unverändert vollständige Push-UI-Browsermatrix. Vollständiger Nachweis: `docs/implementation/MID_C53_RELEASE_RECOVERY_0.9.85.355.md`. Veröffentlichung ausschließlich nach Source-Gate, SHA-Bot, Server-ZIP, Installer, Worker/Pages und Stable-Promotion. Bis dahin unveröffentlichter Kandidat.

# MID v0.9.85.354 · Skybar: Quelltypen vor der Darstellung validieren

Basis: freigegebene v0.9.85.353, `main = mid-stable = c53dc8442abe4038fbc039e1b88432fdace831b7`. Im produktiven `src/detailSkyBar.ts` konnten `Number(false)`, `Number(true)`, `Number([])` und `Number([0])` einen tatsächlich fehlenden Bewölkungs-/Sonnenscheindauerwert als 0/1 deklarieren. Der zentrale `skybarFiniteMeasurement`-Prüfer akzeptiert ausschließlich finite Zahlen und nichtleere numerische Strings. Gemeinsame visuelle Renderpfade, Niederschlags-Tooltip-Sonnenbezug und `detailSkyBarHourCells` verwenden dieselbe Validierung. Echte 0, Schwellen, Werte/Intensitäten, Epoch-Intervalle, Solarpartitionen und Niederschlags-Overlays bleiben unverändert.

`scripts/test-skybar-invalid-observation-0985354.mjs` prüft produktiven Code über esbuild, einschließlich Missing/Bool/Array/Objekt, echter 0 und 65 % Bewölkung, Sonnenschein, Regen-Overlay, 15-min-Slots und DST. Kein Live-Geräte-/VoiceOver-/PNG-Gate aus Unit-Tests abgeleitet; #374 bleibt offen. **Nur Source-Kandidat**: Veröffentlichung ausschließlich über SHA-gebundenes Source-PR-Gate → kontrollierten Bot-Merge → Server-ZIP → Installer → Worker/Pages → mid-stable.


### Fachlich abgegrenztes Browser-/Release-Zuverlässigkeitspaket (weiterhin .354)

Der vollständige Source-Core des ersten .354-Kandidaten zeigte drei **veraltete Quelltext-Vertragsassertions** zur bisherigen direkten Cloud-/Sunshine-Konvertierung; die produktive meteorologische Logik und alle fachlichen Klassen bleiben unverändert. Alle drei Tests prüfen jetzt die einheitliche Typvalidierung einschließlich fehlender Werte. Der Core erzielte im zweiten Source-Lauf 1027/1028 Tests vor dem Fehler in `test-weather-profile-skybar-pills-097723.mjs`. Das Mountain-Heavy-Gate scheiterte in diesem Lauf vor dem UI-Test, weil Chromium seinen vorher reservierten und bereits wieder freigegebenen CDP-TCP-Port nicht rechtzeitig erreichte. Die Browserprüfung `scripts/test-mountain-visual-acceptance-18213.mjs` verwendet jetzt `--remote-debugging-port=0`, `DevToolsActivePort`, `browserStartDiagnostics`, zufällige private Profile und `localCdpEndpoint` für Loopback-Endpoint-Validierung. Der echte Bergwetter-Screenshot-/Touch-/Overflow-/Zeit-/Saison-/Wettertest bleibt vollständig erhalten. `scripts/test-mountain-browser-cdp-startup-0985354.mjs` schützt sichere Portsemantik, ungültige Portdateien, stderr-/Prozessexitdiagnostik und die vollständige Browsermatrix. Das Paket ersetzt keinen echten erfolgreichen CI- und Geräte-Test. Keine dynamischen Wetterdaten, Modellwarnungen, Original-Extremwerte, Produktions-Runner-Timeouts oder MID-Releasepfade wurden geändert.

**Sicherheits-QA-Gate-Konsolidierung (weiterhin .354):** Im vollständigen dritten Core-Lauf auf `c6b70a380963f721f3f315bbe9019ebca233a3e2` waren 1028/1029 Tests erfolgreich; nur die ältere Security/Pollen-Regression `scripts/test-security-pollen-maintenance-0985128.mjs` verlangte noch die inzwischen bewusst entfernte `reserveLoopbackPort`-Vorreservierung und verbot gleichzeitig jede `DevToolsActivePort`-Auswertung. Der korrigierte Sicherheitsvertrag bewahrt die strukturierte `Runtime.callFunctionOn`-Argumentübergabe, erzwingt Browser-eigene Port-0-Bindung, explizites Loopback, Isolation und Startdiagnostik und führt **ausführbare Negativtests** für acht manipulierte CDP-URLs (fremde Hosts, Ports, Credentials, Pfade, Query und TLS-Fehlprotokoll) sowie sechs ungültige Porttypen/-grenzen gegen das unveränderte `localCdpEndpoint` aus. Die Weiterentwicklung ist weder Lockerung noch ersatzweise Abschaltung eines Sicherheitstests: Sie testet die tatsächliche neue Sicherheitsinvariante statt den alten Quellstring. Der neue Source-Gate-Lauf muss weiterhin vollständig grün sein, bevor gemergt oder veröffentlicht wird.

**Vollständige CI-Zuverlässigkeitsreparatur (v0.9.85.354):** Der bisher monolithische Core-Regressionsteil überschritt auch nach SHA-identischem Retry die bestehende 15-Minuten-Step-Grenze, obwohl bis zu 950/1029 Regressionen keine Assertion fehlschlug. Statt Grenzwerte anzuheben oder Prüfungen zu überspringen, laufen nun sämtliche **1030 Core-Regressionsskripte** in vier disjunkten, isolierten GitHub-Actions-Jobs mit je unverändert streng begrenztem Teststep (13 Minuten). Der getrennte Source-Core prüft weiterhin Dependencies, RUC-GRIBs, Produktionsbuild, Worker, iOS-Hülle und Release-ZIP; alle sechs bisherigen Heavy-Jobs bleiben verpflichtend. Der finale SHA-gebundene Gate-Aggregator verlangt zusätzlich den Erfolg **aller vier Core-Subshards**, Source-Core und Heavy; fehlende, abgebrochene oder gescheiterte Teile verhindern jede Veröffentlichung. Die lokale Komplettprüfung `MID_REGRESSION_SHARD=core` bleibt erhalten. `scripts/test-core-regression-isolated-matrix-0985354.mjs` prüft die verlustfreie Zuordnung sämtlicher **1036** Skripte, die Spiegelgleichheit der Quellworkflows und das Fail-closed-Gate. Der neue 20-Minuten-Jobrahmen deckt Node/Python-Installation und Build ab, ohne die 13-Minuten-Teststep-Grenze zu erhöhen. Keine amtlichen Quellen, Warnstufen, meteorologischen Werte oder Release-Berechtigungen werden verändert; Produktivfreigabe bleibt an vollständige Source-/Installer-/Worker-/Pages-/Stable-Nachweise gebunden.

**Abnahme- und Browserstart-Resilienz des vollständigen CI-Pakets:** Der erste tatsächliche Vierer-Core-Lauf bestätigte 3/4 disjunkte Core-Gruppen vollständig; in Gruppe 4 meldeten zwei bestehende Tests noch die alten Quelltextverträge `MID_REGRESSION_SHARD=core` beziehungsweise das kombinierte Source-Core-Zeitbudget. Beide Prüfungen sind nun ausdrücklich auf die neue Architektur umgestellt: SHA-gebundene vierteilige Abnahme, unveränderte RUC-20-min- und Source-Build-15-min-Grenzen, einzelner Core-Regressionsteststep mit 13 Minuten, Pflicht-Python-Umgebung und negatives Fail-closed-Verhalten bei fehlenden Subshards. Der unabhängige Bergwetter-Heavy-Test traf erneut einen sporadischen Chromium-CDP-Starttimeout **vor** seiner UI-Ausführung. Er verwendet deshalb maximal **zwei kontrollierte Chromium-Startversuche mit jeweils eigenem sauber zurückgesetztem privatem Browserprofil**, selbst gewähltem Loopback-CDP-Port, jeweils 45 Sekunden Startup-Budget und Exit-/stderr-Diagnose. Ist auch der zweite Versuch fehlerhaft, bleibt der Heavy-Test rot; alle nachfolgenden sechs Viewports, Light/Dark, NoData-, Einheiten-, Wetter-, Overflow- und Touch-Assertions müssen unverändert vollständig ausgeführt werden. Der gezielte negative Browser-Startup-Vertrag wurde entsprechend ergänzt. Keine meteorologischen Werte, Tests, Security-Rulesets, Release-Bot- und Installer-Authority-Gates werden gelockert. Diese Vorbereitungen erfordern ein erneutes vollständig grünes Source-/Installer-Gate; zuvor keinerlei .354-Veröffentlichung behauptet.

# MID v0.9.85.353 · originale Niederschlags-Zeitstempel gegen boolesche und leere Quellfelder absichern

Basis: veröffentlichte v0.9.85.352, `main = mid-stable = 5eb42a39c1d6051ea6201b014b61696896f2ad37`. Die allgemeine `src/precipitation.ts::precipitationSampleIntervalSeconds` nutzte bislang `finiteOrNaN`, das `false` und Whitespace-Strings über `Number(...)` zu `0` umwandeln konnte. Eine einzelne unvollständige Startgrenze bei gültigem Endzeitstempel konnte daher als mehrstündige Akkumulation statt als fehlende Quelle behandelt werden. Dies ist besonders bei 15-min- gegenüber 60-min-Stufen und der DWD-konformen Einordnung von Regen relevant. Der epoch-spezifische Prüfer akzeptiert nun nur finite Zahlen und nichtleere numerische Strings. Gültige vollständige Originalintervalle behalten Vorrang; unvollständige Grenzen verwenden weiterhin den vertraglichen Fallback (default 3600 s, von Aufrufern bei Bedarf explizit gesetzt), aber niemals eine erfundene 1970-Startzeit. Der allgemeine `finiteOrNaN` für andere physikalische Messgrößen bleibt unverändert.

`scripts/test-precipitation-invalid-interval-epochs-0985353.mjs` testet beide Zeitgrenzen inklusive `false/true/null/undefined/Whitespace/NaN/Infinity/Objekte`, 15-/60-Minuten-Quellen, gültigen Epoch-0-Zeitpunkt, echte Nullmenge, WMO-Regenintensität, nachgewiesene Fallback-Semantik und 23-/25-Stunden-DST mit den echten Produktionsfunktionen. Keine Änderung an DWD-Warnungen, offiziellen Datensätzen, RUC-Codierung, Icons, CSS, Widgets oder Exportformaten; weder Intervalle noch Mengen/Extreme werden geglättet. Die noch ausstehende reale Device-/VoiceOver-Prüfung ist getrennt unter #374 dokumentiert. Veröffentlichungsfreigabe nur nach vollständigem Source-PR-Gate, SHA-gebundenem MID-Bot, Server-ZIP, Installer, Worker-/Pages-Gates und Stable-Promotion.

# MID v0.9.85.352 · Skybar: unvollständige Zeitintervalle nicht als 1970 behandeln

Basis: veröffentlichte v0.9.85.351, `main = mid-stable = 6cc5a8df4d1184ac7a918df60dff31fa49f5a0f8`. Die gemeinsame `detailSkyBar.ts`-Intervallbewertung lässt die JavaScript-Konvertierung `Number(null)` oder `Number('')` derzeit `0` ergeben. Bei nur einseitig vorhandener Intervallgrenze kann das ein unzulässiges Sechsstundenmaximum statt des tatsächlich gelieferten 15-/60-Minuten-Abstands verursachen. Die zentrale Epoch-Validierung akzeptiert jetzt nur finite numerische/nichtleere Stringwerte, verwendet explizite Akkumulationsintervalle nur bei vollständig validen Grenzen und ansonsten vorhandene Original-Nachbar-Epochen. Die gleiche Validierung schützt gezeitete und solar geclippte Teilstücke vor 1970-Falschanfängen. Meteorologische Werte, echte Nullen, Intensitätsgrenzen, Nacht-/Tagesklassen und originale vollständige Intervalle bleiben unverändert.

Der neue Produktionsrenderer-Regressionstest `scripts/test-skybar-partial-timestamp-0985352.mjs` deckt Null/Empty/Undefined/False-Startfelder, 15/60-Minuten-Provenienz, gültige explizite Intervalle, fehlendes Ende, echte NoData/Cloud, 23-/25-Stunden-DST und Geometrie-/Overlay-Parität ab. Vollständige SVG-/Browser-/Widgets-/WKWebView- und physische iOS-/VoiceOver-Abnahmen aus Issue #374 bleiben offen. Keine DWD-/ECMWF-Originaldaten- oder RUC-Lauf-Gates verändert.

Dies ist nur eine Kandidatenbeschreibung: Erfolg und Veröffentlichung erst nach vollständigem Source-PR-Gate, kontrolliertem SHA-gebundenem Bot-Merge, Server-ZIP, `install-mid.yml`, Worker-/Pages-Gates und tatsächlicher Stable-Promotion bestätigen.

# MID v0.9.85.351 · Start-CSS-Größenbudgets mit gebauten Einstiegsassets verbinden

Basis: veröffentlichte v0.9.85.350, main = mid-stable = `aed2fbcef692fe1c744c13a73abe05091c8ac041`. Der erfolgreiche Installer #1938 zeigte ein initiales `index-zGVL3eqU.css`-Asset mit 1.757,93 kB roh. Der frühere, dokumentierte CSS-Coverage-Stand aus #344 betrug 253.294 B gzip-9 / 178.104 B Brotli-6; diese historischen Werte dürfen ausdrücklich nicht als aktueller Netztransfer oder Paint-Zeitwert ausgegeben werden. Die für .351 qualifizierten Grenzwerte müssen im vollständigen Source- und Installer-Build auf der tatsächlichen aktuellen Artefaktausgabe bestanden werden; bei Scheitern weder Limits lockern noch Tests auslassen.

Die vorhandene `scripts/check-build-budget.mjs` berechnet bereits alle aus `dist/index.html` direkt referenzierten CSS-Summen. `MID_PERFORMANCE_BASELINE.json` macht zusätzlich zur verschärften gzip-Grenze auch die bereits berechneten Roh- und Brotli-Kennzahlen zu harten Limits. `scripts/test-initial-css-budget-contract-0985351.mjs` prüft getrennte Assets, Duplikate, dynamische Ausschlüsse und Missing-/External-Fail-Closed. Keine produktive CSS-Kaskade oder Meteorologiedaten geändert.

Offen bleiben Browser-Parität, echte Lade-/Render-Latenzmessungen und Modul-CSS-Split aus #344, Skybar #374, Security-CodeQL-Status #490, RUC #352 und Originaldaten-/Budgetgates DWD/ECMWF #446/#434. Kein Release-Nachweis vor SHA-gebundenem Source-PR-Gate → Bot-Merge → ZIP → Installer → Worker/Pages → Stable.

# MID v0.9.85.350 · 7-Tage-Skybar: echte Solarpartitionen statt fester Segmentzahl

Basis: veröffentlichte v0.9.85.349, `main = mid-stable = 51043685a263393fcb72a6275f8c59a31e72202f`. Nach der publizierten Wochen-Solarfenster-Reparatur (.342) prüft die erweiterte Bestandsregression `scripts/test-skybar-week-solar-0985342.mjs` exakt 168 unveränderte einstündige Quellintervalle, 14 reale Sonnenereignisse und ihre 182 tatsächlichen geometrischen Teilintervalle; `SkyBarSegmentsSvg` behält auch bei identisch zusammenhängendem Farbband jeden Einzel-Tooltip. Zusätzlich werden 168 Niederschlagsakkumulationen unverändert übernommen, Missing bleibt sichtbar fehlend, klares Tagesgrundband übermalt keine astronomische Nacht, und beim DST-Herbstwechsel bleiben beide Stunden einschließlich korrekter Sonnen-Teilungen erhalten. Der Test prüft Produktionsrenderer-Funktionen; das Produkt selbst bleibt identisch.

Die Regression darf nicht durch eine pauschale Annahme „ein Segment je Stunde“ ersetzt werden. Vollständige reale Touch-/Accessibility-/Export-/WKWebView-Abnahmen bleiben unter Issue #374 separat offen. Die Originaldaten- und Budgetgates für DWD-Vollgebiet (#446) und ECMWF (#434) bleiben ebenfalls unverändert; kein Pilot wird aktiviert.

**Freigabegrenze:** Dies ist vor Source-/Installer-Gates nur ein Kandidat; keine Behauptung eines bestandenen Tests oder einer erfolgten Promotion. Release ausschließlich über den SHA-gebundenen MID-Bot, Server-ZIP, `install-mid.yml`, Worker/Pages und Stable.

# MID v0.9.85.349 · Security-/Quality-Testkorrekturen

Basis: veröffentlichte .348 e7fbc07dd319e3589924e841d15eeca88ee0edd4. CDP-Testwerte werden als Argumente statt durch Quelltextinterpolation übergeben; Chromium übernimmt die Portzuweisung. Bounded Startdiagnostik erhält Exit/Signal/Stderr ohne längere Wartebudgets. CSS-Regelnutzung wird ausschließlich in vorhandenen Entwicklungsfixtures gemessen; beide Bergwetter-Seiten müssen vor dem unveränderten Referenzvergleich die Datenanreicherung abgeschlossen haben. Keine produktive CSS-/Daten-/Worker-Fachänderung oder Pilotaktivierung.

# MID v0.9.85.348 · Diagnose-Sicherheitskorrekturen

Basis: veröffentlichte .347 f4360f6e573f78c2be6e20d1c40d9540fd7cb1ea. Exklusives Anlegen von Widget-Erstberichten und Diagnosebildern, private mkdtemp-Verzeichnisse für Browserprofile und Regressionstimings; beide Installer-Uploadpfade werden synchron migriert. Kein Daten-/Worker-Fachpfad geändert. CodeQL-Alertstatus erst nach erneuter Analyse bewerten; #490 bleibt für weitere Befunde offen.

# MID v0.9.85.347 · Browserpflichtprüfungen in der MID-Code-Revision

Ausgangsbasis: veröffentlichte v0.9.85.346, `main = mid-stable = 34563d9f31b0d5a04bf242498841a23e424ab9a2`. Automatischer MID-Revision-Push-Lauf 40503871329 scheiterte beim vorhandenen `scripts/test-fourteen-css-lazy-0985339.mjs` nach erfolgreichen Chromium-Fällen, weil die gepinnte WebKit-Laufzeit `webkit-2215/pw_run.sh` fehlte. Der Browser- und CSS-Test selbst wird nicht verändert. Der bestehende separate, versionierte Browser-Preflight aus dem Release-Installer wird nun auch im regulären CI- und im nächtlichen Revisionsworkflow vor `npm run verify` ausgeführt. Die Pflichtprüfungen werden weder deaktiviert noch abgeschwächt. Die Revision meldet gescheiterte Browserinstallation gesondert; beide GitHub-Workflow-Spiegel sind identisch. App-, Worker-, Daten- und RUC-Algorithmen bleiben unverändert.

Die Freigabe für v0.9.85.347 ist bis zum erfolgreichen Source-PR-Gate, SHA-gebundenem Release-Bot, `install-mid.yml`, betroffenen Worker-/Pages-Gates und exakter Stable-Promotion ausdrücklich ausstehend; diese Beschreibung behauptet keine bereits bestandenen Gates.

# MID v0.9.85.346 · Kartenintegrität und Modellstand

Die Modellstandsanzeige zeigt verifizierte Einzelmodelle als Anzahl und unterscheidet Teilverifikation von fehlenden Nachweisen. Best Match wird als Sammelquelle separat erläutert; überfällige Läufe bleiben sichtbar.

Die lokalen ICON-D2-Karten unterscheiden fehlende Werte wieder von trockenem Wetter. Ungültige Wettercodes werden nicht gerundet; echte Nullwerte und gültige Extremwerte bleiben erhalten. Jeder Rasterpunkt wird vor der Darstellung mit der gemeinsamen Gültigkeitszeit abgeglichen. Fehlende oder zeitlich unpassende Zellen bleiben transparent.

Basis: freigegebene .345, main = mid-stable = afc0fcbde19ca468ecd2d3701cba5a750713b4ca. Neuer Source-Kandidat .346; Source-/Installer-/Worker-/Pages-/Stable-Gates ausstehend. Kein Vollgebiets- oder ECMWF-/Symbolik-Pilot aktiviert.

# MID v0.9.85.345 · Modellphasen und Tablet-Zeitleiste

Die Modellstandsanzeige berücksichtigt eine verifizierte Bereitstellungszeit und den Quellrhythmus statt ausschließlich das Alter seit Initialisierung. Fehlende oder widersprüchliche Metadaten werden nicht grün.

Tempoauswahl und Zeitschieberegler liegen auf Tablets wieder in getrennten, bedienbaren Zeilen.

Das Radar-Phasenraster erhält fehlende und ungültige Niederschlagsmengen sowie Wettercodes als fehlende Werte. Echte trockene Nullen bleiben erhalten. Nicht angeforderte Schauerwerte werden nicht mehr als gemessene Nullmenge ausgegeben. Radar-Echos, Phasenschwellen, RUC-Horizonte und amtliche Warnungen bleiben unverändert.

Basis: veröffentlichte .344, main = mid-stable = 3199af000d03e1a90e8708db52ecd743f249134e. Source-/Installer-/Worker-/Pages-/Stable-Gates für .345 ausstehend. Keine Übernahme der unqualifizierten Symbole aus Draft #480.

# MID v0.9.85.344 · RUC-Aufbereitung und Releasewechsel entkoppeln

RUC-Berechnung und Aufbereitung erhalten getrennte, nachvollziehbare Laufzeiten und einen geprüften Zwischenstand. Eine fehlgeschlagene Aufbereitung kann dadurch ihren vorhandenen Berechnungsstand weiterverwenden. Bereits vollständig geprüfte, aktuelle RUC-Daten können nach einem kompatiblen App-Update erneut zugelassen werden; Herkunft, Datenvertrag, sämtliche Objektbytes und Decoder werden erneut geprüft. Die Veröffentlichung verwendet die aktuelle freigegebene App und verhindert die Rückkehr zu einem älteren RUC-Lauf. Wetterwerte, Ensemble, Extremwerte und Prognosezeiträume bleiben unverändert.

Basis: veröffentlichte .343, `main = mid-stable = 132256654286671e9a6aa30b7183d255562fc896`. PR #486 und Installer `40416048972` vollständig erfolgreich, einschließlich aller Pflichtgruppen, Worker, Pages und exakter Stable-Promotion. .344 ist ein neuer Source-Kandidat; Source-/Installer-/Pages-/Stable-Freigabe ausstehend. Kein manueller Merge oder Stable-Push.

# MID v0.9.85.343 · Browserprüfung und Offline-Entwicklung absichern

Die 14-Tage-Entwicklung bleibt gezielt nachgeladen und steht nach vollständiger Installation der App-Shell auch beim ersten Offline-Aufruf bereit. Die Vorbereitung von Chromium und WebKit erfolgt im Release nun als eigener Schritt mit getrennten Laufzeit- und Abbruchmeldungen. Alle visuellen, funktionalen und meteorologischen Pflichtprüfungen bleiben erhalten.

Basis: main = mid-stable = `5883c7a5284014c8d427994914bd6dfe023b02be`, veröffentlichte .342. Neuer Source-Kandidat; Source-/Installer-/Pages-/Stable-Freigabe ausstehend. RUC-Zeitdiagnose und Snapshot-Wiederverwendung sind separate folgende Pakete.

# MID v0.9.85.342 · 7-Tage-Skybar: Sonnenauf- und -untergänge vollständig

Der Wetterstreifen der 7-Tage-Kurvenübersicht ermittelt die astronomischen Tages- und Nachtgrenzen nun für alle angezeigten lokalen Kalendertage. Auch Freitag, Samstag und Sonntag erhalten damit ihre tatsächlichen Sonnenauf- und -untergänge statt einer künstlich bis zum Wochen-Ende verlängerten Nacht. Die Tageskarten und die Kurvenübersicht verwenden dieselbe astronomische Berechnung; auch 14- und 46-Tage-Zeiträume sowie 23-/25-Stunden-Tage beim Zeitwechsel werden abgesichert. Niederschlagswerte, Wolken, Sonnenscheindauer, RUC-/Modellfusion und amtliche Warnungen bleiben unverändert.

# MID v0.9.85.341 · Browser-Release-Diagnostik absichern

Die RUC-Frischegrenztests und die gezielte 14-Tage-CSS-Auslagerung aus v0.9.85.340 bleiben unverändert erhalten. Die vollständige Chromium-/WebKit- und Responsive-Parität bleibt Pflicht; deren einzelne Fortschritts- und Fehlermeldungen werden im Installer nun während der Ausführung angezeigt statt erst nach Testende. Dies ermöglicht die Behebung des noch offenen Installer-Zeitlimits ohne übersprungene Tests. Wetterberechnung, Warnungen, Modellwerte und Quellenverträge bleiben unverändert.

## Herkunft und Freigabegrenze

Kanonische Stable-Basis .338 `ed934fb0e755e54e0e4a553b8c47d44f7a59c262`. Geprüfte und per Source-Gate übernommene .340-Fachbasis des PR #483 `740cef46e07037ec8ee2c7fa0f3b7b7629bc435a` (direkter Nachkomme der .338 Stable über die vollständig belegte .339/.340 Releasekette). Noch unveröffentlichtes, fehlerhaftes .340 ZIP auf `main` SHA `02b88500e31f55e10c50c9097e7a47a572608d42`; keine direkte Main-/Stable-Korrektur. .341 übernimmt den unveränderten .340 Source-Merge und verbessert ausschließlich Diagnoseausgaben der verpflichtenden CSS-Paritätsprüfung. Vollständige Source-, Heavy-, Installer-, Worker-/Pages- und Stable-Freigabe bleibt erforderlich.

# MID v0.9.85.340 · RUC-Frischeprüfung und Release-Stabilität

Der bisher nicht veröffentlichte 14-Tage-CSS-Ladeschritt aus .339 bleibt vollständig erhalten. Die RUC-Quellenprüfung unterscheidet auch an der erlaubten Fünf-Minuten-Uhrentoleranz zuverlässig gültige und unzulässige Modellläufe; Wetterwerte und RUC-Gewichtung bleiben unverändert. Die verpflichtende CSS-Browserprüfung für Chromium und WebKit erhält kontrollierte Start-/Zeitdiagnosen, ohne die visuellen, funktionalen oder Zugänglichkeitsprüfungen abzuschwächen. Ein tatsächlicher Release erfolgt erst nach erneutem vollständigem Source-/Installer-/Pages-/Stable-Gate.

## Recovery-Provenienz (26.10.2026)

Kanonisch Stable .338 SHA `ed934fb0e755e54e0e4a553b8c47d44f7a59c262`. Erhaltener .339-Source-Merge PR #482 SHA `60ae85ed0513dc7e6bc25008e9c3c263ecbcd429` ist dessen direkter Nachfolger und Ausgangspunkt des autorisierten `chatgpt/v0.9.85.340-release-recovery`-Branches. Der alte installerrote main-Snapshot `addd4c124ea10a5acc503624544f4443e1e4a913` besteht aus diesem Source-Merge plus dem serverseitigen `.339`-ZIP und bleibt unverändert. .340 ist ein eigener Maintenance-Kandidat ohne mitgeführtes ZIP. Das neue Release-ZIP erzeugt ausschließlich der MID Agent Release-Bot nach vollständigem Gate. Keine unterbrochene .339-Promotion als Erfolg ausgegeben.


# MID v0.9.85.339 · 14-Tage-Entwicklung gezielt nachladen

Die Entwicklungsübersicht der 14-Tage-Prognose wird mit ihren eigenen Styles erst beim Öffnen geladen. Wetterwerte, Ensemble-Spannen, Diagramme und Bedienung bleiben erhalten. Dies ist der erste abgegrenzte Schritt der CSS-Auslagerung.

Basis: veröffentlichte .338, ed934fb0e755e54e0e4a553b8c47d44f7a59c262. Ausschließlich der letzte, auf FourteenDayDevelopment begrenzte Kaskadenabschnitt wird gemeinsam mit dem unveränderten Renderer dynamisch geladen. Größere CSS-Pakete und Draft #463 bleiben getrennt. Source-/Installer-/Stable-Gates stehen aus; noch nicht veröffentlicht.

# MID v0.9.85.338 · Dunkles horizontales MID-Logo

Der Startbildschirm verwendet das bereitgestellte dunkle horizontale MID-Wortbild. Die übrigen Logos und App-Icons bleiben erhalten.

Basis: Stable .336, d080fe240d5a59a5a77467c783aba59a33957ddc. Selektive Übernahme der Asset-/Hashänderung aus PR #472; keine Übernahme seiner alten Versionsspiegel. Source-/Installer-/Stable-Gates für .338 stehen aus. .337 bleibt dem separaten SYNOP-Draft #480 vorbehalten.

# MID v0.9.85.336 · Kanonische RUC-Laufabdeckung (Source-Kandidat)

Verifizierte Basis main = mid-stable = 3908e1c7e6c8475278ae07e5cfbd5a4780822e95, v0.9.85.335. RUC-Karten +27 h wurden bereits in .305 nachgewiesen; hier werden gemeinsame Stundenfusion und voraggregierte EPS-Wahrscheinlichkeiten laufbezogen erweitert. Die bestehenden Rapid-/Extrem-/Eventgrenzen bleiben erhalten. Native Vollprüfung, 14-h-Bytepräfix, vollständiger Codec, Rohrollback und Kartenbudget sind eigenständige Nachweise. Die Qualifikationshistorie liegt in #478; die vollständige27h-Paketabnahme ist nun auf diesem Migrationsbranch zusätzlich im finalen regulären Source-Gate verbindlich. Kein veröffentlichter .336-Stand behauptet.

Siehe MID_DWD_RUC_PIPELINE_CONTRACT.md und docs/implementation/MID_C46_RUC27_BUILD_PROOF.json, MID_C46_RUC27_PREFIX_PROOF.json, MID_C46_RUC27_CODEC_PROOF.json. CSS-Coverage #463 und Logo #472 bleiben eigenständige parallele Arbeiten. Normaler MID Source-/Heavy-/Bot-/Installer-/Worker-/Pages-/Stable-Weg bleibt verbindlich.

# MID v0.9.85.335 · Fusionsabruf nach Hintergrund-/Netzrückkehr (Source-Kandidat)

Basis: verifiziertes Stable .333, dfe92422c32971fc18df088e3d5417e228903768. Paralleler Logo-PR #472/.334 bleibt eigenständig; sein Logo ist in diesem Fusionsfix nicht enthalten. Vor Freigabe erneut Refs und Parallelstände prüfen.

Foreground-Refresh mit 5/15/60-s-Fehlerbackoff, danach maximal alle fünf Minuten, mit bestehendem Fusionscache. Sichtbarkeit, online, pageshow und MID-Runtime-Resume starten den versäumten Abruf nach. Keine parallelen Abrufe innerhalb des Effekts, Abort und Schutz vor verspäteten Antworten bei Ortswechsel/Unmount. Modellstand ohne Fusion explizit als nicht verifizierte Übernahme beschrieben. Keine Änderung meteorologischer Werte oder Workerlogik. Nachweis: docs/implementation/MID_C45_FUSION_RESUME_0.9.85.335.md.

Zusätzlich: vorhandene begrenzte selectedDetailIndex-Auswahl auch für sämtliche Tagesdiagramm-Markierungen verwenden. Reproduktion des vorherigen epoch-Absturzes im echten Browser; anschließend unveränderter Bergwettertest mit sechs Viewports × zwei Themes lokal erfolgreich.

Source-/Heavy-/Installer-/Worker-/Pages-/Stable-Gates stehen aus; noch nicht veröffentlicht.

# MID v0.9.85.333 · Karten-Popup-Kontrast (Source-Kandidat)

- Verifizierte Ausgangsbasis: `main = mid-stable = 3887ebc31dc93fc33b51ad87b55284671e4d4224`, v0.9.85.332; Installer 40218239133 erfolgreich einschließlich Core/Build/Audit/iOS, aller Heavy-Shards, Same-Origin-Smoke, Pages und Fast-Forward-Promotion.
- Leaflet-Popups (KONRAD3D, Blitz, NowCastMIX, Standort) übernehmen nun die MID-Themefarben für Fläche und Text. Zentrale MapLibre-Popups erhalten eine eigene Themeklasse; bewusst anders gestaltete Sonderkarten bleiben davon getrennt.
- Popup-Schließen erhält sichtbaren Fokus und auf Touch-Geräten eine 44-px-Zielfläche. Keine Änderung an Kartendaten, Layer-Reihenfolge, Meteorologie, Worker oder Provider.
- Regression `scripts/test-map-popup-theme-0985333.mjs`; technische Prüfung `docs/implementation/MID_MAP_POPUP_THEME_0.9.85.333.md`. Das CSS wird zusammen mit den Kartenmodulen geladen und erhöht nicht das initiale CSS-Budget.
- Source-PR-/Bot-Merge-/ZIP-/Installer-/Pages-/Stable-Gates für .333 stehen aus. Noch keine Veröffentlichung oder Stable-Promotion für diesen Kandidaten.

# MID v0.9.85.332 · Vite-Wartungsupdate (Stable-Stand)

Der Source-PR #469 wurde am 25.10.2026 nach erfolgreichem Source-Gate vom MID-Release-Bot für den exakt geprüften Head `676b04440e2f167fd9ec0947537910ab8e7da852` aus Stable .331 (`447890032ce1b1d9103bc76811061b790b26f328`) gemergt. Der Release-Installer `40215524340` schloss Build, Audit, Core- und Heavy-Regressionen, iOS, unveränderten Worker-Pfad, Same-Origin-Smoke, Pages-Deployment und Fast-Forward-Promotion erfolgreich ab. `main = mid-stable = 253b365fb916c1e104e04f1c594f5c027dfd9bbf`.

Vite wurde von 8.2.4 auf 8.3.5 aktualisiert; @vitejs/plugin-react blieb bei 6.1.2. React/React DOM/react-is blieben bei 19.2.8, React-Typen auf 19.2.x und MapLibre GL JS bei 6.7.0. Capacitor 8.5.3, PostCSS 8.5.31 und Pako 2.2.0 blieben unverändert.

# MID v0.9.85.332 · Ursprünglicher Breitenkandidat (zurückgestellt, nicht veröffentlicht)

Der anfängliche Qualifikationsplan kombinierte React/React DOM/react-is 19.3.1, React-Typen 19.3.0, Vite 8.3.5 und MapLibre GL JS 6.15.0. Die Regression zeigte Überschreitungen der unveränderten harten ReactVendor- und MapLibreCore-Feature-Chunk-Budgets. Dieser Kandidat wurde deshalb nicht veröffentlicht; die Budgets wurden nicht gelockert. Ausschließlich Vite 8.3.5 ging in Stable .332 ein.

# MID v0.9.85.331 · Isoliertes Capacitor-Patchupdate (Source-Kandidat)

Verifizierte Stable-Basis .330: `84d52042521fe087bef490d8a8966ffe72295c1d`. Capacitor Core, CLI und iOS werden gemeinsam von 8.5.2 auf 8.5.3 aktualisiert; andere Capacitor-Plugins und React/Vite/MapLibre/PostCSS/Pako bleiben unverändert. npm erzeugt das Lockfile regulär neu. Vollständige Installations-, Audit-, Build-, Regression-, iOS- und MID-Release-Gates sind erforderlich.

# MID v0.9.85.330 · Isoliertes React-Vite-Plugin-Update (Source-Kandidat)

Verifizierte Stable-Basis .329: `85f98cc3a347657071eef0a18aee4f0345d26ed7`. `@vitejs/plugin-react` wird isoliert von 6.1.1 auf 6.1.2 aktualisiert; React, Vite, Capacitor, MapLibre, Pako und Produktionsabhängigkeiten bleiben unverändert. Das Lockfile aktualisiert ausschließlich die Plugin-Version, Integrität und optionale Oxc-Peer-Anforderung. Upstream nennt einen HMR-Fix für Compound Components. Lokale Installation, vollständige Regressionen, Produktions-CSS-Byteparität und alle MID-Release-Gates bleiben verpflichtend.

# MID v0.9.85.329 · Isoliertes PostCSS-Wartungsupdate (Source-Kandidat)

Verifizierte Stable-Basis .328: `7b7d94447d584dc7b7ee4bad7549150ad19c916c`. PostCSS als direkte exakte Entwicklungsabhängigkeit 8.5.28 → 8.5.31; neu erzeugtes Lockfile aktualisiert nur zusätzlich `nanoid` 3.3.18 → 3.3.20. `source-map-js` bleibt 1.2.2; keine Produktionsabhängigkeiten oder sonstigen Framework-/Capacitor-/Karten-/Pako-Versionen ändern sich. Offizielle Context7/PostCSS-Referenz beschreibt u.a. Kommentarverarbeitung in `list.split()` seit 8.5.29 und SourceMap-/SafeStringifier-Korrekturen bis 8.5.31. Produktionsbuild gegen .328 ist byteidentisch: `index-CuuPtrVL.css`, 1.759.985 Bytes roh, SHA-256 `2d31d276bde4453a367251cd5e8efc999807cdf50ac609d1cdeddb883b1ce4cd`; kein CSS-Split, kein Runtime-/Kaskaden-/Theme-/Widget-/Exportwechsel. Vollständige Types-/Build-/Audit-/Regressionen sowie bestehende Source-/Heavy-/Installer-/Worker-/Pages-/Stable-Gates sind Pflicht.

# MID v0.9.85.328 · Wiederverwendung von Renderberechnungen unter „Aktuell“ (Source-Kandidat)

Ausgangsbasis veröffentlichte v0.9.85.327 SHA e5f509cce4e9f345392b24c7f800d84efc5f8837. Der vollständige Ortsstundenindex ist an unveränderliche Prognosestunden und Zeitzone gebunden; die Echtzeitauswahl der aktuellen Epoche wird pro Render neu ausgewertet. Temperaturwerte, Achsenticks, vollständige stündliche Basis-Skybar und Sonnenfenster werden nur bei geänderten Eingaben neu berechnet. Viertelstunden-Niederschlag und Beobachtungsfrische bleiben unmittelbar an `solarNow` gebunden. Keine fachlichen Wetterwertänderungen. DST-Doppeluhrzeiten, +05:45-Ortsstundenwechsel, Missing/ungültige Daten und geänderte Eingaben sind gegen den historischen Algorithmus geprüft. Lokaler synthetischer React-Profiler: Median 34,1 → 25,1 ms (11 Updates, ca. 26 %), kein Geräte-/Produktionsleistungsversprechen. Nachweise `scripts/test-hour-window-formatter-0985327.mjs`, `scripts/test-complete-calendar-day-current-skybar-0985285.mjs` und `docs/implementation/MID_C42_CURRENT_RENDER_0.9.85.328.md`. Zwingende Source-/Heavy-/Installer-/Worker-/Pages-/Stable-Gates vor Veröffentlichung. Unabhängige CSS-Coverage #463 bleibt Draft und ohne CSS-Split.

# MID v0.9.85.327 · Lokale ICU-Zeitzonenformatierung in der laufenden 12-h-Ansicht (Source-Kandidat)

Ausgangsbasis veröffentlichte v0.9.85.326 SHA f32e100842e434909f2fcd2154a885b2a3b36f56. Einmalige ICU-DateTimeFormat-Instanz nur innerhalb des einzelnen `currentFullHourWindow`-Aufrufs; keine dauerhafte Memoisierung, keine geänderten meteorologischen Werte, Zeitintervalle, UTC-Epochen oder Beobachtungs-/Sonnenzeitfrische. 23/25h-Tage und unvollständige Stundenserien bleiben unverändert. Deterministischer Golden-Test mit echtem TS-Helfer unter `scripts/test-hour-window-formatter-0985327.mjs`; ausführlicher Nachweis `docs/implementation/MID_C49_HOUR_FORMATTER_0.9.85.327.md`. Erst nach Source-/Heavy-/Installer-/Worker-/Pages-/Stable-Gates freigeben. Unabhängiger CSS-Diagnose-Draft #463 nicht übernommen.

# MID v0.9.85.326 · Sonnenzeit-Timer unter Aktuell nur im Vordergrund (Source-Kandidat)

Verifizierte Stable-Basis v0.9.85.325 SHA 3fa82c38920a44bcee383e3f5fa857d6354183e4. Der Sonnenzeit-Timer unter „Aktuell“ wird bei hidden sofort abbestellt; sichtbare/fokussierte Dokumente aktualisieren sofort per aktueller Epoch, ohne falsche DST-Kalenderannahme. Sonnenauf-/untergangsgrenzen bleiben auf 250-ms-Guard und reguläre 30-s-Grenze begrenzt. Neuer fachkernneutraler, deterministischer Timer-Regressionstest. Kein geänderter Wetterwert, RUC/Nowcast, Warnstatus, CSS, Workerkern oder Sicherheitsvertrag. Vollständige Source-/Heavy-/Installer-/Worker-/Pages-/Stable-Gates erforderlich. Andere P1-Punkte CSS-Coverage und gezielte Memoisierung werden aufgrund fehlender Last-/Kaskadenmessung separat behandelt.

# MID v0.9.85.325 · Vollständige laufende Niederschlagsstunde unter Aktuell

Basis veröffentlichtes .324 `cd50ee899c8bfc38799c396a9ba38c41702e5df6`. Die 12h-Anzeige erhält die vollständigen nativen Intervalle der laufenden Stunde; spätere Live-Anpassungen bleiben erhalten. Keine rückwirkende Projektion aktueller Messanker. Allgemeine IANA-/Epochlogik für 23/25h-Tage bleibt unverändert, zusätzliche dynamische Fälle für Berlin 2027/New York 2026. Nachweise: docs/implementation/MID_C41_CURRENT_HOUR_0.9.85.325.md. Source-/Heavy-/Installer-/Worker-/Pages-/Stable- und Live-Nachweis vor Veröffentlichung erforderlich.

# MID v0.9.85.323 · Dezente numerische Hilfskonturen und Niederschlagssummen (Source-Kandidat)

Basis: main=mid-stable=30fa3817db2a3cfba2ff57c7f437e26a5c65ac5a (v0.9.85.322). Skalare Raster-Isolinien werden schmaler, transparenter und unter geografischen Referenzgrenzen gerendert. Für ICON-D2-Modellsummen und DWD-RADOLAN-Stundensummen zeigt der gleiche Algorithmus echte Gitterkonturen in mm; -1/NoData bleibt NaN, gültige Null bleibt Null, Zeit-/Akkumulationsfenster und Datenherkunft bleiben unverändert. SVG-/PNG-Export und umschaltbare Darstellung entsprechen der Kartenansicht. Die dokumentierte Deutschland-Beschneidung von ICON-D2/RUC wird NICHT durch eine fiktive Vollgebietsausdehnung ersetzt; Issue #446 und Original-GRIB-Pilot #449 bleiben gesonderte Gates. Vor Release sind alle Source-, Browser-, Heavy-, Installer-, Worker-, Pages- und Stable-Gates erforderlich.

# MID v0.9.85.322 · Isolierte native RUC-Seitenschritte (Source-Kandidat)

Verifizierte Ausgangsbasis main=mid-stable=205d4c6bf8f9799c9f4ef38f31d20b7940470ced (.321). RUC-Lauf 40088804651 beendete sich nach der Storage-Audit-Ausgabe mit SIGABRT/Exit 134: double free or corruption. Getrennte Python-Prozesse für ICON-D2-Summen, RADOLAN-H5, Modellkarten und Synoptik begrenzen native Bibliothekslebenszyklen; nicht erwartete Exceptions und native Signalabstürze blockieren unverändert jede Veröffentlichung. Kein Codec-, SHA-, Missing-/NoData-, DWD-, 900-MB-, Security- oder Release-Gate wird umgangen. Vollständige Codec-/Pages-/Worker-/Fusion-Produktivabnahme steht noch aus.

# MID v0.9.85.321 · RADOLAN-Abhängigkeiten im Pages-Pfad

Basis freigegeben .319 4c092751208c437a152eb8fcdf87fd8301a537cb, fast-forward auf vollständig source-geprüften Main-Kandidaten 78db20da51104bb2104e06fbe2f7d18f750247f8 (.320). RUC-Job 120826278775 scheiterte nach erfolgreicher Rohaufbereitung an fehlendem h5py: requirements-pages.txt enthielt anders als requirements.txt keine ODIM-Abhängigkeiten. Ergänzt h5py/pyproj im Lean-Pfad, kein awscli, kein neuer Dienst, keine Daten-/Gate-Abschwächung. Kontur-Hilfetext präzisiert. Release-/Live-RADOLAN-Nachweise noch erforderlich.

# MID v0.9.85.320 · Gleichmäßige Konturintervalle

Druckkonturen verwenden je Zoomstufe ein einziges arithmetisches Raster (5/2/1 hPa); lokale spacingKm-Filter dürfen keine Einzelwerte entfernen. Native skalare Flächen zeigen den bestehenden gemeinsamen numerischen Konturpfad einschließlich Export. Geometrie und Missing-Werte bleiben unverändert. Basis 4c092751208c437a152eb8fcdf87fd8301a537cb (.319).

# MID v0.9.85.319 · Radar-Nowcast-Intensität, Szenario-Signalisierung und RADOLAN ODIM-H5 (Source-Kandidat)

Verifizierte Basis `main=mid-stable=1835fd4fda68916620f2518dbbab7d1b379bfb3c` (v0.9.85.318, 24.10.2026). 5-Min-Radarbalken farblich nach Rate in mm/h kategorisiert (leicht ≤0,5, mäßig >0,5–4, stark >4 mm/h; konsistent mit appweiter Regenintensität); eigenständig von der Wahrscheinlichkeit: nur tatsächlich verfügbare unkalibrierte Hit-Szenarioanteile erzeugen graduierte Schraffur/Transparenz, fehlende Werte nie 0/100. Beobachtung voll, Umfeld-Echo besonders markiert, Datenlücke grau. Keine offiziellen Warnstufen. RADOLAN RW im aktuellen DWD Live-Verzeichnis nur als ODIM-H5, bestehender reiner BZ2-900x900-Import scheiterte nachweislich im RUC-Lauf 40061926315 mit `RADOLAN sums unavailable: no fresh aligned RW hour`. Ergänzt h5py/pyproj WGS84 polarstereographische 1200x1100 H5-Ablage mit expliziten Quelldaten-/Projektion-/Stunden-/ACRR-/NoData-Gates; unveränderte historische BZ2-Rastertrennung. Unvollständige Fenster bleiben unverfügbar, keine Messung wird als null/trocken deklariert. Tests und Nachweise: `docs/implementation/MID_C40_RADAR_NOWCAST_RADOLAN_0.9.85.319.md`. Dieser Branch ist ein **noch NICHT freigegebener** Releasekandidat; kein Build/Installer oder Live-DWD-H5-Healthcheck ist damit vorweggenommen. Zwingender regulärer Source-/Heavy-/RUC-/Pages-/Worker-/Stable-Releasepfad, keine parallelen Piloten #449/#433/#425 übernehmen.

# MID v0.9.85.318 · Anbieterzeit und lokale Kalendertage (Source-Kandidat)

Verifizierte Basis main=mid-stable=b34dcea88c84acacdbba24ac3e051bbb00ed0cfc (.317). Getrennter Anbieter-Fixoffset-Parser, eindeutige lokale DST-Labels, unveränderte Rohendstempel, strenge 23/25h-Tagesrekonstruktion, Ensemble-/Event-Kohärenz und Cachemigration. Fachlicher Umfang und Nachweise: docs/implementation/MID_C39_PROVIDER_TIME_0.9.85.318.md. Vollständiger Source-/Heavy-/Installer-/Pages-/Worker-/Stable-Nachweis vor Release erforderlich; keine physische iOS-Abnahme. Piloten #449/#433/#425 bleiben unabhängig.

# MID v0.9.85.317 · Sichtbare Kartenextremwerte (Source-Kandidat, noch NICHT veröffentlicht)

Verifizierte freigegebene Basis: `main=mid-stable=1eca0e0de84abda59d693f6ce69592f3709c7536`, v0.9.85.316. Das bestehende PR451-Feature zur Rasterextrem-Anzeige wird im autorisierten Branch `chatgpt/v0.9.85.317-viewport-extrema` auf tatsächlich sichtbare MapLibre-Kartenbereiche umgestellt: numerische gültige Raster-Zellzentren, dezente weiße Werte ohne sichtbaren Min/Max-Text, NoData/Null und Gleichstände zuverlässig getrennt, Aktualisierung bei Pan/Zoom/Resize, gemeinsamer Pfad NativeModelMap/UnifiedWeatherMap. Unveränderte numerische Originaldaten, Modellprovenienz, Druckzentren, WMO-Standards und sonstige UI-Funktionen. Der PNG/SVG-Export zeigt weiterhin seinen EIGENEN vollständigen Exportbereich, nicht einen fälschlich angenommenen UI-Zoom. Dokumentation: `docs/implementation/MID_18_2_47_VIEWPORT_EXTREMA_WIP.md`; regressionstest `scripts/test-map-scalar-annotations-0985316.mjs` erweitert. Nur echte numerische ICON-D2/RUC-Raster, nicht aus Bildern erfundene WMS-Extreme. P1-Vollgebiet #446 und DWD-GRIB-Pilot #449 bleiben separat offen. App-/Worker-Versionen und Changelogs sind für die geplante .317 synchronisiert, aber die Quelle ist **kein** Build, kein Gate-Nachweis und keine Stable-Freigabe. Release ausschließlich über vollständigen Source-/Heavy-/Browser-/Budget-/CI-Gate, SHA-MID-Bot, Server-ZIP, `install-mid.yml`, Worker/Pages und Stable-Promotion.

# MID v0.9.85.316 · Parameterlinien, Rasterextreme und runde 24-h-Achsen (Source-Kandidat)

Verifizierte freigegebene Basis: main = mid-stable = 48692e0cd168302f1dd035f5d79200a4812a00a6, v0.9.85.314. PR448, Source-Gate 39916972847 und Installer 39920562049 einschließlich Pages/Worker-Prüfungen und Stable-Promotion erfolgreich. PR443/445/447 wurden nach selektiver Integration über #448 als überholt geschlossen; Branches bleiben erhalten. Die volle DWD-Geometrieinventur #449/.315 bleibt unabhängig und wird nicht als produktiv freigegeben behandelt.

PR451 ergänzt native parameterbezogene beschriftete Skalarlinien ohne räumliche Ausdünnung, Min-/Max-Markierungen jeder verfügbaren Rasterzelle einschließlich Rändern, gemeinsame Anzeige-/PNG-/SVG-Daten und runde Wind-/Niederschlagsticks in der gewählten Anzeigeeinheit im 24-h-Profil; das Tagesdetail nutzt dieselbe Windskala. Fehlende Zellen bleiben fehlend, Wettercodes sind keine skalaren Extremwerte, und die Anzeige behauptet keine volle native Modellgebietsabdeckung. Bestehende adaptive Isobaren, Quellen-/Lauf-/Terminbindung und T/H-Konvention bleiben erhalten. Alle Warnlinien bleiben verfügbar; nur kollidierende Schwellentexte werden entzerrt. Native Prozentwerte folgen weatherValueFormat.

Lokale Abnahme: frisches npm ci; 1018/1018 Regressionen, Build/Types/Budget, 24 Unified-Map-Fälle, native responsive Karten-/Exportprüfung, 48 tatsächliche 24-h-Einheiten-/Theme-/Viewportfälle sowie 96 7-/14-Tage-Fälle grün. Produktionsaudit ohne Findings; 0 High/Critical im Gesamtaudit, 3 bekannte moderate Entwicklungsbefunde. Das bestehende PNG-Logo wurde pixel- und metadatenidentisch um 90.170 B komprimiert; kein Budget erhöht. Fachlicher Nachweis: docs/implementation/MID_C39_MAP_ANNOTATIONS_0.9.85.316.md. Tatsächliche Veröffentlichung ausschließlich nach vollständigem aktuellem Source-Gate, SHA-gebundenem MID-Bot, Server-ZIP, Installer, Pages/Worker-Prüfung und Stable-Promotion; der Source-Kandidat allein ist kein Release.

# MID v0.9.85.314 · Konturen-/Audit-Konsolidierung (historischer Source-Kandidat; inzwischen freigegeben)

Verifizierte Basis main=mid-stable=7cabe4ca23d86dbf3aadccdb03aa3fc0dbf20885 (.311). Nutzerfreigabe zum separaten gemeinsamen Release der geprüften Konturenkorrekturen #445 (6d8fa7f777df565c64e4293235f754445814a774) und des gehärteten rein lesenden Auditors #447 (13e0f384981652271d5e54556da470cc638531da). Alle .309-/ .311-Fixes erhalten. Vollgebiet #446 bleibt offen und ist kein Erfolg dieses Releases. Keine neue Datenquelle, keine Crop-Erweiterung, kein experimenteller Pilot, keine ungeprüften Dependency-Upgrades oder zusätzlichen Workflows. Version/Changelog synchronisiert; tatsächlicher Release erst nach vollständigem Source-/RUC-/Heavy-/Browser-Gate, SHA-MID-Bot, ServerZIP, Installer, Worker/Pages und Stable-Promotion. Implementierungsnachweis docs/implementation/MID_C39_CONSOLIDATED_RELEASE_0.9.85.314.md.

# MID v0.9.85.309 · Extremwetterpolygone – georeferenzierter Ersatzmodus (Source-Kandidat)

Neuer unabhängiger Geometrienachweis im Draft .309: verschachtelte GeoJSON-Inseln ab fünf Konturringen wurden bisher in ancestor-weiten Queues doppelt ergänzt. Korrigierte parent-lokale Hole→Island-Rekursion und verschärfter vorhandener Pflicht-Test erhalten genau einen Outer-Ring bzw. ein Loch je Originalkontur. Ein erfolgreicher reiner Canvas-Browserpixeltest auf .308 bestätigte Füllung/Lochtransparenz, ist jedoch keine WebGL-/Live-Gefahrenkartenabnahme.

Basis main=mid-stable b57f07081a2b92ae763af9c909aa3f65b9e211ac (.307). PR #440 (.308), ECMWF #433 und bestehende RUC-/Warnverträge bleiben unangetastet. Source-Kandidat ohne Releasebehauptung; Issue #441 und Belege in docs/implementation/MID_18_2_45_POLYGON_FALLBACK_0.9.85.309.md. Nach Failures der nativen GeoJSON-Kartenebene können vollständige modellierte Konturen georeferenziert degradiert gerendert werden. Keine Veränderung meteorologischer Felder, Wahrscheinlichkeiten oder Warnstufen. Echte Browser-Pixel-/Source-/Worker- und Responsive-Prüfungen vor Freigabe zwingend.

Abgleich 21.10.2026: Die zwischenzeitlich vollständig freigegebene RUC-Erweiterung v0.9.85.308 ist unter Stable-SHA 3420d2b7f7afca80783ed90799234310820c9f3e im selben Integrationscommit erhalten. Die Polygon-Reparatur ergänzt die aktuelle Stable-Basis ausschließlich im eigenen Draft; insbesondere nativer WW-/GRIB-Provenienzpfad, bestehende Source-/ZIP-/Worker-/Pages-Gates und alle .308-Regressionen bleiben unverändert.

# MID v0.9.85.308 · RUC-Komposit und sichtbare Vorhersagestunden (Source-Kandidat)

Verifizierte Basis main=mid-stable=b57f07081a2b92ae763af9c909aa3f65b9e211ac (.307), erneut geprüft am21.10.2026. Parallel-PR439 ist veröffentlicht; dessen RADOLAN-/Ensemble-Extremwert- und unabhängige Referenzverifikation bleiben vollständig erhalten. PR440 führt die RUC-Arbeit fort; Parallel-Drafts einschließlich ECMWF433 und Extrempolygon442 bleiben unberührt. Native RUC-Zusatzquelle mit neun oder zehn GRIB-Komponenten und vollständiger Synoptikachse0..27, separater SHA-Index, ursprüngliche Core/EPS-/Codec-Objekte unverändert. Bei ausschließlich fehlender WW-Analyse beginnt Wolken/Wetter mit dem echten Prognosetermin+1; kein erfundener WW0. Bestehender RUC-Produzent und Source-Gate erweitert, keine neue Workflow-Datei oder Release-Aktion. Live-/Browser-/Release-Nachweise und offene Echtdatenprüfung: docs/implementation/MID_C38_RUC_COMPOSITES_0.9.85.308.md. Noch keine .308-Stable-Veröffentlichung behauptet.

# MID v0.9.85.307 · P1-Datenintegrität (Source-Kandidat)

Stable-Basis .306 a1f40fb42ea45bd3c695583a49a1310e0fc853fc verifiziert; parallele ECMWF-/RUC-Drafts unangetastet; vorhandene Workflownamen und Freigabepfade unverändert.

Szenario-Ausreißerfilter und 6%-Sichtbarkeitsschwelle entfernt; RADOLAN nicht mehr bei 250 mm hart begrenzt, ungültige Daten uncovered.

Lokale Güte- und Lernverifikation: nur measured/private-sensor, >=18h Deckung und Qualität >=0,55 aus ausschließlich Messquellen, jeweils >=12 Temperatur-/Niederschlagsproben; kein beobachtetes Regime rückwirkend als Ausgabe-Regime.

Drei dynamische Pflichtregressionen zum gesamten Bestand hinzugefügt (1013); Source-, Installer-, Worker-, Pages-Gates noch nachzuweisen. Historische Archive bleiben erhalten; keine empirische 90-Tage- oder iOS-Gerätefreigabe behauptet.

# MID v0.9.85.306 · Vorhandene Revisionsprüfungen und Vite-Sicherheit

Verifizierte Basis main=mid-stable=88c04410de7275010cdcf9ff14b2c26ca35479d1 (.305). #435/#436 sind ausschließlich über vorhandenen Source-Gate, Bot, ZIP und Installer39557997892 veröffentlicht. Produktiver RUC-Lauf08UTC21.10.2026 in39574875111: mapHours27/coreHours14, admitted=true,410534246Bytes, unveränderte Quelle/Codec-Proof und bestätigte Pages-/Worker-Frische. Keine physische Geräte-Abnahme behauptet.

Revisionslauf39570739442 erkannte fehlendes numpy im bestehenden Revisionsworkflow sowie HIGH im gebündelten launch-editor von Vite8.2.2. Alle vorhandenen vollständigen Core-Einstiege erhalten dieselbe Python3.12-/requirements-pages-Umgebung; vorhandene Workflow-Namen/Trigger und Releaseweg bleiben. Bestehende bisher unverwaltete Revision-/Analytics-Workflows werden kanonisch gespiegelt, keine zusätzliche aktive Workflow-Datei. Bootstrap-Regression prüft jetzt jeden Core-Job. Kompatibler Vite-Patch8.2.4 mit Registry-Lockfile und aktualisiertem exaktem Upgrade-Vertrag; bekannte moderate uuid-Dev-Abhängigkeit separat, kein force-fix. Release-Kandidat .306 benötigt vollständige Gates. Implementierungs-/Produktionsnachweis: docs/implementation/MID_C38_REVISION_SECURITY_0.9.85.306.md.

# MID v0.9.85.305 · RUC-Kartenintegration (Source-Kandidat)

Verifizierte Basis main=mid-stable: 438bfb7838a727ad8753940872c8b8ab140bb7c2 (.304). Auf den gehärteten Kartenpilot #431 (af75157ee858d6c5e45e1bd213dfc46f73cc0d49) aufgebaut. Eigenständiger Integrationsbranch; #425/#431/#432/#433 bleiben unverändert. Separate native Kartenachse bis +27h; Kern/EPS/Fusion weiterhin14h, Budget900MB und Raw-Rollback unverändert. Prüfbelege/Restpunkte: docs/implementation/MID_C38_RUC_MAP_INTEGRATION_0.9.85.305.md. Keine Releasebehauptung vor Source-/Installer-/Stable-Nachweis.

# MID v0.9.85.304 · Natürlicher 7-Tage-Kurztext und korrekt zugeordnete Sonnenscheinintervalle (Source-PR-Kandidat)

- Nutzerergänzung: 7d-Telegrammstil durch vollständige, natürlich verbundene Aussagen ersetzen. Tatsächliche Beispieldaten ergeben „Heute regnet es; auch in der kommenden Nacht kann es regnen. Ab Donnerstag ist mit Regen zu rechnen.“ DWD-Primärbeispiele recherchiert; keine neue Wetterursache, Verbreitung, Dauer oder Trockenpause erfunden. Semantische Familienmetadaten verbinden nur dasselbe Tag-/Folgenachtpaar; Hazard-Rangfolge, Ereignislimit, Daten und Unsicherheit erhalten.
- Zweite neue Pflichtregression test-seven-day-natural-language-0985304.mjs in beiden Inventaren: tatsächliche Summary-Funktion, unveränderte Eingaben, Phasen-/Nachtwechsel, Singular/Plural/Artikel, Missing und markante Hinweise; zusätzlich 19 Adjektivbezeichnungen und13 Nomen/Gegenbeispiele gegen den tatsächlichen privaten Formatter. Drei historische Wortlaut-Assertions für Bewölkung, Mischwetter und Adjektivliste werden auf die bewusst neue Grammatik aktualisiert; ihr meteorologischer Schutz bleibt erhalten. Implementierungsbericht MID_C37_NATURAL_SUMMARY_0.9.85.304.md.

- Verifizierte Basis main=mid-stable=6c3137426f332fb86369ac8f82783180a8b2f296 (.303), Installer39410945206 und alle fünf Heavygruppen erfolgreich; Pages-Versuch1 erfolgreich, Stable-Promotion bestätigt. Parallel-Draft425 unverändert.
- Tatsächliches mapHours reproduziert 3100 statt1000 Sekunden: Viertelstunden mit gleichem Stundenpräfix enthielten zukünftige Akkumulationen. Die kanonische Stundensumme verwendet jetzt ausschließlich vier eindeutige native Endstempel T−45/30/15min und T. Vollständigkeitsprüfung verhindert Lücken-/Dubletten-/Offgrid-Scheinerfolge; Stunden-Fallback und Missing bleiben erhalten.
- Neue Pflichtregression test-sunshine-quarter-intervals-0985304.mjs in beiden Inventaren, mit tatsächlichen mapHours/mapMinutely15, expliziten Offsets, DST-/Mitternachts-/Halb-/Viertelstundenoffset-Fenstern, Rohdaten-Unveränderlichkeit und Fehlerfällen. Gemeinsamer Sunshine-Pfad erreicht die bestehenden App-/Widget-/Exportverbraucher. Fachvertrag präzisiert; Anbieter-DST-/Cache-/Daily-Migration #428 bleibt offen.
- Release ausschließlich Source-Gates → bestehender SHA-Bot → ServerZIP → Installer/Worker/Pages → Stable. Noch kein .304-Release behauptet. Nachweise im Implementierungsbericht MID_C37_SUNSHINE_INTERVALS_0.9.85.304.md.

# MID v0.9.85.303 · Skybar-Dickenstufen am solaren Tagesrand (Source-PR-Kandidat)

- Ausgangsbasis main=mid-stable=20872a05b80b94824219b20fbf97d3e9441ce98e (.302), Installer39402717597 erfolgreich; Parallel-Draft425 unverändert. Nutzerauftrag: alle gelben/grauen Dicken und Tag-/Nachtübergänge intensiv prüfen.
- Reproduziert: In einem 60-min-Slot mit 15min möglichem Tageslicht wurde relative Sonnenscheindauer gegen60min klassifiziert und dadurch ein falscher Wolkenlücken-Fallback bzw. eine falsche gelbe Stufe gewählt. Ausschließlich der Nenner des solaren Grundband-Renderers wird auf den vereinigten tatsächlichen Tageslichtanteil des Originalslots umgestellt und im Tooltip benannt. Keine Änderung von Sonnenminuten, Wetterwerten, Intervallgrenzen, Niederschlag oder vier Klassen.
- Neue Pflichtregression `scripts/test-skybar-daylight-levels-0985303.mjs` prüft tatsächlichen gemeinsamen SVG-Renderer, alle4gelben/grauen Stufen,15/60min-Dämmerung, Nachtüberlappungen, Missing und unveränderten Niederschlag. Bestehende Sonnen-/DST-/Skybar-Regressionen bleiben unverändert. Präzisierter Darstellungsvertrag und Bericht `docs/implementation/MID_C37_SKYBAR_LEVELS_0.9.85.303.md`.
- Nicht jede Wetterlage enthält jede Klasse; keine künstliche Klassenverteilung. #428 bleibt für Anbieter-Fixoffset/DST separat offen. Keine physische iOS-/WKWebView-Abnahme oder vollständige Livefehler-Erklärung ohne Evidenz behaupten.
- Veröffentlichung nur über vollständigen Source-Gate → bestehenden SHA-Bot → ServerZIP → Installer/Pages/Worker → Stable. Dieser Kandidat ist noch nicht veröffentlicht.

# MID v0.9.85.302 · Explizite UTC-/Offset-Zeitpunkte erhalten (Source-PR-Kandidat)

- Verifizierte Ausgangsbasis main=mid-stable=f17226dea646193a43c78e29198886d7f3601254, v0.9.85.301; Installer 39391396433 erfolgreich. Parallel-Draft #425 bleibt unverändert.
- Beide gemeinsamen Zeitparser ignorierten vorhandene ISO-Zonenangaben. Die Red-Fixture reproduziert u. a. eine Verschiebung der ersten Berliner Herbst-Doppelstunde um eine Stunde. Gemeinsamer Helper `src/explicitIsoInstant.ts` wahrt ausdrücklich angegebene Instants vor jeder IANA-/Offset-Fallbackbehandlung; fehlerhafte explizite Suffixe werden nicht als lokale Zeit umgedeutet.
- Offsetlose IANA-Ortszeiten und bestehende Fixoffset-Aufrufer bleiben unverändert. Keine Änderung an Open-Meteo-Abfragen, Cacheformat, Tagesprodukten, Akkumulation oder Modellwerten. Der größere Open-Meteo-DST-Adapterfehler bleibt offen; keine vollständige DST-Datenmigration behaupten.
- Pflichtregression `scripts/test-explicit-time-offsets-0985302.mjs` in beiden Inventaren: explizites Z, ±Offset mit/ohne Doppelpunkt, Bruchteile, Herbst-Doppelstunde, Frühlingslücke, ungültige Suffixe, Lokal-/Zulu-Darstellung und unveränderte offsetlose Pfade. Technischer Nachweis `docs/implementation/MID_C37_EXPLICIT_TIME_0.9.85.302.md`.
- Freigabe ausschließlich über Source-Gates → SHA-gebundenen MID-Bot → serverseitiges ZIP → Installer → Worker/Pages → Stable. Noch kein Veröffentlichungsbeleg für diesen Kandidaten.

# MID v0.9.85.301 · Direkter Extremwetterabruf: abgebrochene Folgeabfragen verhindern

- Ausgangsbasis: main=mid-stable=589d0bc41860cebf6cbec1591ad1c0644f557097, v0.9.85.300; Issue #345. Parallel-PR #425 ist ein eigenständiger Draft-RUC-Provider-Canary und wird nicht verändert.
- Einziger Fachcode-Fix: `scripts/build-maintenance-aggregates.mjs` bekommt einen sofortigen Parent-Abort-Check vor `guardedOpenMeteoFetch`, innerhalb des vorhandenen try/finally. Das daraus erzeugte `src/extremeWeatherOutlookDirect.generated.js` erhält denselben Guard. Kein geänderter Wetterwert, Warnstatus, Cache-Key, Retry-Limit, Provider oder Datenmodell.
- Neue Regression `scripts/test-direct-outlook-abort-isolation-0985301.mjs` registriert in `MID_BASELINE.json` (beide Inventare). Sechs Fälle mit zwei konkurrierenden Kontexten, bereits abgebrochenen Startpfaden und simulierten unabhängigen HTTP-429-Fehlern. Basisversion/Versionsspiegel, Release Notes und Changelogs synchronisieren.
- Historische isolierte Node-v22-Red-/Green-Fixture bestand; das vollständige Source-Gate und der reguläre Installer sind die verbindlichen Freigabestufen. Reale Netzwerk-429, Browser/WKWebView/VoiceOver und Geräteparität nicht als durch lokale Tests bewiesen ausgeben.
- Nach grünen Source-Gates ausschließlich kontrollierter MID Agent Source Release → serverseitiges ZIP → install-mid.yml → betroffene Worker-/Pages-Gates → mid-stable-Promotion. Kein direkter Merge oder manuelles Deployment.

# MID v0.9.85.300 · Skybar-NoData: fehlende Niederschlagsmenge nicht als 0 mm kennzeichnen

- SHA-verifizierte Ausgangsbasis: main=mid-stable=8b3759960ef78e758d7c19d2603f4acde052522f, v0.9.85.299, install-mid Run #39295438835 erfolgreich. Verträge AGENTS.md, MID_BASELINE.json und bestehende WMO-/Skybar-Regressionen maßgeblich.
- Reproduzierter Fehler: detailSkyBarHourCells() zeigte bei einem 15-Minuten-Slot mit WMO-Code 61 und precipitation=null den falschen Text „0 mm“ bzw. „0.0 mm/15 min“. Das verletzt die Unterscheidung fehlend vs. tatsächlich 0.
- Fix ausschließlich in src/detailSkyBar.ts: validierte Mengenfelder, ursprünglicher WMO-Code als Hinweis bei fehlender Gesamtmenge, getrennte physikalisch bekannte Teilkomponenten ohne erfundene Gesamtmenge. Keine Modell-/Warnverarbeitung oder numerische Akkumulation verändert. Echte Nullwerte bleiben echte Nullwerte; Code 82 behält extreme Intensität.
- Neue kanonische Regression scripts/test-skybar-precipitation-nodata-0985300.mjs; vorhandene Skybar-/Solar-/15-Min-Regressionen werden unverändert mit ausgeführt. Version 0.9.85.300 samt Spiegeln und Changelog synchronisieren.
- Fachlicher Umfang und Teststand: docs/implementation/MID_C42_SKYBAR_PRECIP_NODATA_0.9.85.300.md. Browser-/WKWebView-Parität, produktive Warndaten und übriges CSS-Paket #344 sind nicht mit dieser Korrektur als nachgewiesen anzusehen. Neues Release erst mit Source-PR-/Installer-Gates.

# MID v0.9.85.299 · Bundle-Budget-Integrität bei unvollständigen Build-Artefakten (Source-PR-Kandidat)

- Verifizierte Stable-Basis: main=mid-stable=a21791cea8e51546ba568d9fedaf3729ae069dab, v0.9.85.298; Installer 39277116386 erfolgreich. Kein Branch-Drift zum Beginn.
- Die bisherige `scripts/test-bundle-budget-098594.mjs` meldete ein vorhandenes, aber nur teilweise gefülltes `dist/assets` als bestanden (Main-Asset fehlte und wurde als `0` Byte angezeigt). Die Prüfung verlangt jetzt bei vorhandenem `dist/assets` mindestens ein Main-JS- und ein Main-CSS-Asset; die alten 1.500.000/1.760.000-Byte-Grenzen bleiben hart unverändert.
- Regression `scripts/test-bundle-budget-missing-assets-0985299.mjs` deckt source-only-Prebuild, leeren Build, JS-only, CSS-only, vollständigen Build und zu große CSS/JS-Bundles ab. Bestehende 1.001 Regressionen bleiben erhalten.
- **Kein behaupteter CSS-Performancegewinn**: Die große Start-CSS-Datei bleibt unverändert; #344 braucht Browser-Coverage und Layoutparität. Keine Änderungen an Meteorologie, Datenquellen, PWA-/iOS-Assets, Warnlogik oder Workerberechnung.
- Test-/Source-/Installer-Gates und neue Stable-Promotion gelten erst nach tatsächlichem Nachweis, ausschließlich über den MID-Releasepfad. Technischer Bericht: `docs/implementation/MID_C42_BUNDLE_BUDGET_0.9.85.299.md`.

# MID v0.9.85.298 · RUC-Freshness-Guard für komprimierte Veröffentlichungen (Source-PR-Kandidat)

- Verifizierte Basis: main=mid-stable=9bb0670fbc37d042cd77625672a319aa3dbf3f1e, v0.9.85.297, Installer 39260114652 erfolgreich.
- RUC-Produktionsnachweis: GitHub-Actions 39262472403, Pages-Profil pages-lossless-v1, RUC-Lauf 2026-10-19T13:00, 2252 vollständig verifizierte Teile und erfolgreicher Worker-/Pages-Codec-Healthcheck; ursprüngliche Rohdaten als Rollback-Artefakt erhalten.
- Die günstige Scheduler-Vorprüfung validiert beim produktiv aktiven verlustfreien Transport: Profil und Proof, vollständige positive Objekt-/Bytebilanz, SHA-256-Format, eindeutige sichere Pfade sowie lückenlose, widerspruchsfreie komprimierte Records. Bei ungültigem Manifest folgt der vorhandene fail-open-Neuaufbau statt eines irrtümlichen Freshness-Skips. Rohprofil, Wetterwerte, DWD-Warnungen und Kompression unverändert.
- Erweiterte Python-Regression: tools/ruc/test_ruc_schedule_guard.py, einschließlich mutierter aktiver Manifeste, Recordlücken und Raw-Kompatibilität. Test-, Source-, Release- und Pages-Gates gelten erst nach bestätigtem Abschluss. #352 bleibt für Langzeit-Frische und weitere echte RUC-/Modellkarten offen.

# MID v0.9.85.297 · MID-C37 Detailzeitachse (Source-PR-Kandidat)

- Basis main=mid-stable=e00b41ead6a0aed3a90eb20e9dde26c43455dfc6, veröffentlichte .296.
- Klassische Forecast-/Hourly-Details: gemeinsame lokale Kalender-Epochachse, echte 23/24/25h, solare Nachtbänder/Marker aus kanonischer Astronomie; Band aus unveränderten stündlichen Vorwärtsslots statt 3h-Mittelbewölkung. Keine neue Meteorologie oder Warnschwelle.
- 3h-Gruppen erhalten tatsächliche Intervallenden, brechen an fehlenden Stunden; Stundenquadrate erhalten alle Stunden. Kalendertag bleibt ortslokal auch bei UTC-Anzeige.
- Prüf-/Releasebelege: docs/implementation/MID_C37_DETAIL_SOLAR_0.9.85.297.md. Noch keine Veröffentlichung; ausschließlich bestehender Source-/Bot-/Installer-/Stable-Pfad. #374 bleibt für appweite Live-/Geräteabnahme offen; #352/#405/#411 separat.

# MID v0.9.85.296 · Extremwetter-Tag-3–7: Worker-/Cache-Fix (Source-PR-Kandidat)

- Freigegebene Ausgangsbasis: `main=mid-stable=369cde0bbbe61e52cc422038e4d1dd94ff16099e`, v0.9.85.295; Installer 39169042660 erfolgreich.
- Langfristpfad nicht mehr vom Chunk `extremeWeatherOutlookExtendedFallback` abhängig: frische validierte Browserkopie → Worker (ein Versuch, Open-Meteo-Limit wird respektiert) → lazy direkte ICON-EPS-Berechnung → nur vollständiger Stale-Cache → klarer Fehlerstatus. Vollständige +48–168-h-Perioden und Fachmetadaten werden validiert, keine Missing-zu-Null-Konvertierung.
- Bei echten JS-Importfehlern bietet die Oberfläche einen expliziten Seiten-Neuladevorgang; kein automatischer Retry-/Reload-Loop. Wetterprognose bleibt von amtlichen Warnungen getrennt. Bestehende Regression `scripts/test-extreme-outlook-extended-resilience-0985154.mjs` an die geänderte Architektur angepasst; neue dynamische Regression `scripts/test-extreme-outlook-module-recovery-0985296.mjs` deckt Worker-Erfolg, fehlendes Chunk, geprüften Stale-Cache, fehlerhafte Zeitfenster, Abort und Tageslimit ab.
- Änderungen ausschließlich auf `chatgpt/v0.9.85.296-extended-extreme-recovery`. CI, Browsermatrix, Installer und Stable-Promotion erst nach tatsächlich bestätigtem Grün dokumentieren; keine physische iOS-/VoiceOver-Abnahme behaupten. #352/#374/#405/#411 bleiben unabhängig offen.

- C36-Reparatur: qualifizierter Strada-Testimport, aktiver Meldungsvertrag, unbenutzter Wrapper entfernt, nutzergeeigneter Chunkfehler bis zum Reloadknopf erhalten; null-/lückenhafte Cacheformen verworfen. Lokaler Nachweis: docs/implementation/MID_C36_EXTREME_RECOVERY_0.9.85.296.md. Neue Remote-Gates weiterhin erforderlich.

# MID v0.9.85.295 · Prägnante 7-Tage-Kurzinterpretation (Source-PR-Kandidat)

- Freigegebene Ausgangsbasis: main=mid-stable=b0cf607c45746239ed6246ba1e473ee41877a96d / v0.9.85.294, Installer 39164220384 erfolgreich.
- Tagessegmente, modellierte Gefahren und Ereignisse der Folgendenacht werden gemeinsam priorisiert und nach Tagesindex/Tagesphase chronologisch ausgegeben. Höchstens drei kurze markante Aussagen; keine nachträglich angehängten früheren Ereignisse oder unbelegte Trockenprognosen.
- Neue dynamische Regression scripts/test-seven-day-significant-timeline-0985295.mjs; Nachweis docs/implementation/MID_C36_SEVEN_DAY_0.9.85.295.md. Fachmodelle, amtliche Warnungen und Missing-Werte bleiben unberührt.
- Source-/Release-/Pages-/Stable-Gates für .295 stehen aus; Browser-/Simulatorprüfungen nicht als physische iOS/VoiceOver-Abnahme ausgeben.

# MID v0.9.85.294 · Aktuell-Skybar: exakte Sonnenübergänge (Source-PR-Kandidat)

- Verifizierte Basis main=mid-stable=5ad8be1fbafbcbfbc9d1aeda451b3e642a947617 (.293), erfolgreicher Installer39158231540 attempt2.
- Der gemeinsame zeitgebundene Adapter erhält optional dieselben solaren Nachtintervalle wie der aktuelle 12h-Hintergrund und bewahrt deren Teilsegmentgrenzen beim Epoch-Mapping und Viewport-Clipping. Niederschlag, Masken, Sonnenparameter und diskrete Stundenquadrate unverändert.
- Regression scripts/test-skybar-solar-epoch-split-0985278.mjs erweitert; Nachweis docs/implementation/MID_C36_CURRENT_SOLAR_0.9.85.294.md. Kein physischer iOS-/VoiceOver-Nachweis.
- #374 bleibt für die klassische Detailachse und vollständige appweite Abnahme offen; #352/#411/#405 bleiben separat. Veröffentlichung ausschließlich über bestehendes Source-Gate → SHA-Bot → Server-ZIP → Installer → Worker/Pages → Stable.

# MID v0.9.85.293 · Freie Ortssuche und verlässliches Schließen (Source-PR-Kandidat)

- Freigegebene Ausgangsbasis main=mid-stable=7cfa80f16c7779e14a4b81ec8a060c46a39a9d09 (.292), Installer 39135094553 erfolgreich; ausgelieferte Version und Buildidentität HTTP 200 bestätigt.
- Suchzustand im gemeinsamen App-Elternteil: Standortleiste und Body-Portal der unteren Navigation werden nur während geöffneter Suche entfernt; Nav-Zustand bleibt erhalten. Keine asynchrone Antwort oder Query-Wirkung darf nach Schließen wieder öffnen.
- Selektiv übernommener UI-Diff aus gesichertem Commit 63f0378; Warnungsimplementierung aus PR #414 vollständig beibehalten. Getrennte Pflichtregression scripts/test-location-search-layers-0985293.mjs, Browsermatrix in CI zwingend.
- Belege und Grenzen: docs/implementation/MID_C35_LOCATION_SEARCH_0.9.85.293.md. Kein physischer iOS-/VoiceOver-Nachweis. #411/#352/#374/#405 bleiben offen.
- Nur regulärer Source-PR → SHA-Bot → Server-ZIP → Installer → Worker/Pages → Stable; noch kein Releasebeleg für diesen Kandidaten.

# MID v0.9.85.292 · Allgemeine Warngeometrie und CAP-Lebenszyklus (Source-PR-Kandidat)

- Ausgangsbasis main=mid-stable=fbe9c758599928f4b5ba776de670505018750dbb (.291); PR #414 @79bd72caa7c652cdf684776c4dbcc2b05b6d3df2 selektiv vervollständigt. Kein Hardcode für Barcelona/Gemeinderadius.
- Amtliche Kartenpolygone plus CAP-Geometrie/identische amtliche Sprach-Gebietscodes, vollständige Gebietsnamen, transitive CAP-Update-/Stornoketten vor semantischer Deduplizierung. Quelle docs/implementation/MID_C35_WARNING_COMPLETION_0.9.85.292.md.
- Gesicherter echter 22er-Live-Fall vom 18.10. und erneuter Liveabruf liefern mit Geometrie vier örtliche Warnungen. Dies ersetzt NICHT den fehlenden Einzelmeldungsnachweis des ursprünglichen 26er-Falls. #411 bleibt offen.
- Suchleisten-Fix separat gesichert in lokalem Commit 63f0378; nicht Teil dieses Warnungs-PR. Vollständige Source-/Releasegates stehen aus. Nur regulärer geschützter MID-Releasepfad.

# MID v0.9.85.291 · Strikte API-NoData-Prüfung (Source-PR-Kandidat)

- Ausgangsbasis .289/67b289988ed0ce8433b266c8f2055f070133ffe5. Der funktional unabhängige API-Prüfer wird gegen diese weiterhin aktuelle freigegebene Basis geprüft; paralleler PR #412/.290 bleibt ausdrücklich Draft und unintegriert. Vor dessen späterem Release neue Stable-Basis/Version berücksichtigen.
- scripts/api-contract-series.mjs erkennt fehlende Werte strikt und bewahrt gültige Null/Extremwerte. Min/Max-Unterschiede benötigen zwei echte Werte am selben Index. Pflicht-/Optional-Grenze und Retry bleiben unverändert.
- Pflichtregression scripts/test-api-contract-nodata-0985291.mjs; Nachweis docs/implementation/MID_C35_OPEN_METEO_NODATA_0.9.85.291.md. #405 bleibt für neue Modelle/Live-Rollout/historische Regime offen.
- Noch kein Releasebeleg: nur Source-Gate → SHA-Bot → ZIP → Installer → Worker/Pages → Stable. Keine physische iOS-Abnahme.

# MID v0.9.85.289 · Anzeigeidentische Kurzfrist-Ereignisse und kompakte Karten (Source-PR-Kandidat)

- Freigegebene Ausgangsbasis main=mid-stable=e54c237b2d21859638cf3b21b50a842d2f0f222d nach erfolgreichem Installer #39111144520, v0.9.85.288. Kein Parallelprodukt-PR zum Entwicklungsstart.
- #408: Die Textmeldung im Heute-Kurzfristbereich verwendet ausschließlich die korrigierten sichtbaren Profil-Stundenintervalle; abweichende native Unterstunden-Starts dürfen die Angabe nicht vorziehen. Es gibt nur belastbare Niederschlagshinweise und signifikante Böen >50 km/h; Missing/DST/Zeitzonenvertrag gewahrt. MID-Heuristiken sind keine amtlichen Warnungen.
- #409: Next-Karten mobil: maximal einzeiliger Status und verkleinerte geschlossene Legende, bestehende Produktzeit/Kartennavigation und vollständige Attribution bleiben verfügbar. Keine Zeit- oder Modellfelder verändert.
- Test `scripts/test-short-term-brief-chart-0985289.mjs` verpflichtend in beiden Baseline-Listen. Ergebnis ist erst nach tatsächlichem CI-Gate als bestanden zu bewerten. Web/iOS-Version .289 synchron; keine physische iOS-Abnahme.
- Veröffentlichung nicht allein durch diese Dokumentation; nur Source-PR-Gate → kontrollierter SHA-Bot-Merge → serverseitiges ZIP → Installer → Worker/Pages → Stable-Promotion. Replit/Governance blockiert, Issues #352/#374/#405 separat.

# MID v0.9.85.288 · Sichtweiten-NoData-Grenze (Source-PR-Kandidat)

- Ausgangsbasis main=mid-stable=ffcc37e37c6a143ff73a714494c3e9c52eea987c, v0.9.85.287 nach erfolgreichem Installer/Stable-Promotion #39108469858.
- Ergänzung aus Open-Meteo/ICON-Prüfung #405: an der exportierten Sichtweitenklassifikation dürfen providerseitige JSON-null/blank/booleans/NaN/Infinity niemals gemessene 0 m Sicht oder 0 % relative Feuchte darstellen. Gültige echte Zahlen einschließlich 0 bleiben unverändert. Modell- und METAR-Phänomene bleiben quellengetrennt, WMO/DWD-Schwellen unverändert.
- Neue verpflichtende Regression `scripts/test-visibility-nodata-0985288.mjs` in beiden Baseline-Testinventaren; detaillierter Nachweis `docs/implementation/MID_C39_VISIBILITY_NODATA_0.9.85.288.md`.
- Source-PR-Kandidat ist noch nicht veröffentlicht. Erst aktuelle grüne SHA-gebundene Source-/Release-/Worker-/Pages-/Stable-Gates dürfen v0.9.85.288 freigeben. Kein physischer iOS-/VoiceOver-Nachweis. Andere offene #352/#374/#362 und neue native Modell-IDs #405 bleiben unabhängig.

# MID v0.9.85.287 · Tagesniederschlags-Quellgültigkeit (Source-PR-Kandidat)

- Freigegebener Ausgangsstand main=mid-stable=394ff6f999accb5c4211490d44f52275faefa61c (v0.9.85.286), WIP-Provenienz ef34de34dd153d42ae6c9dfe267a99a5be440b36. Keine produktive Stable-Divergenz zum Start.
- #397: Fehlende providerseitige Tagesakkumulationen bleiben Missing statt 0. Das gilt für Adapter, Kalender-/Modellfusion, probabilistische Zusammenfassung, Cache, Widget-Feeds und native optionale Masken. Gültige 0, unabhängig gültige Komponenten/Wettercodes und 23/24/25-h-Vollabdeckung bleiben erhalten. Regen in mm und Schnee in cm dürfen nicht zu einer fehlenden Gesamtmenge addiert werden.
- Neue Pflichtregression test-missing-daily-source-0985287.mjs in beiden Baseline-Listen; aktuelle CI-Ergebnisse dieses Branches stehen noch aus. Vorherige lokale WIP-Proben nicht als grünes Source-Gate ausgeben.
- Version und Quell-/Worker-/PWA-/iOS-Spiegel v0.9.85.287. Der Source-Kandidat ist **nicht veröffentlicht**. Nur PR-Gate → SHA-gebundener Release-Bot → serverseitiges ZIP → install-mid.yml → erforderliche Worker/Pages-Gates → Stable-Promotion.
- #352 RUC-Kompression, #374 Low-Cloud-Skybar und #405 Open-Meteo Upstream bleiben separate Prüf-/Entwicklungspakete.

# MID v0.9.85.286 · Push-Präferenzen und Bestätigung (Source-PR-Kandidat)

- Verifizierte freigegebene Basis: main=mid-stable=e8c3e4e61eff028797120fcecc6f3be58f993911, .285; Installer 39075158905 erfolgreich. Normaler Basis-Merge, keine publizierte Historie überschrieben.
- #400: vollständige Registrierungsmutationen geordnet, aktuelle Auswahl beim tatsächlichen POST, fehlertolerante Queue und 1,1s Schreibabstand. Status bestätigt nur den konkret angenommenen Modus; alte Antworten und lokale Speicherfehler werden abgegrenzt.
- Scheduler-Rückschreibungen bewahren neueste lesbare Registrierung und Zeitstempel; keine Wiederherstellung abgemeldeter Geräte. Prüfung vor jedem Trigger. KV bleibt eventual consistent, kein globales CAS versprochen.
- Belege/Grenzen: `docs/implementation/MID_C38_PUSH_CONFIRMATION_0.9.85.286.md`. Beide neuen Regressionen in beiden Baseline-Inventaren; Browsermatrix muss in CI tatsächlich laufen. Kein physischer iOS-/VoiceOver-/Push-Nachweis.
- Nur Source-PR → SHA-Bot → serverseitiges ZIP → Installer → Worker/Pages → Stable. #397 bleibt separates unveröffentlichtes Datenpaket.

# MID v0.9.85.285 · Kalendertage und aktuelle Skybar (Source-PR-Kandidat)

- Freigegebene Basis: main=mid-stable=16b6c87906370b62315e0046dec64506304abcc4, v0.9.85.284.
- #401: Nur vollständige 23/24/25 reale Stunden, gültiges Folgestunden-Akkumulationsende und echte Rohwerte dürfen Tagesniederschlag/-anteile aus finalisierten Hour-Objekten neu berechnen. Vorhandene gültige Tageswerte haben bei lückenhafter Stundenfolge Vorrang; vergangener Niederschlag wird nicht durch „ab jetzt“ ersetzt.
- Meteodatenzeit: Epoch/TZ und echte lokale Mitternachtsgrenzen statt einer heuristischen Mindestzahl (18h); Sunshine-Daily-Fallback bei unvollständigen Stunden.
- Aktuell-Skybar: native, volle aktuelle Modellstunden für Basis, getrenntes zukünftiges 15-min-Nowcast für Niederschlag. Keine künstlichen Beobachtungen oder akkumulierten Mengen.
- Pflichtregression: `scripts/test-complete-calendar-day-current-skybar-0985285.mjs` für echtes 0, null/NaN, Tageslücken, 23/24/25h, 17:45 nach Morgenregen. Alle bisherigen Gates weiterhin verbindlich.
- #397 (Provider-Tagessumme vollständig missing), #352 (RUC Transport), #374 (Skybar bei niedriger Bewölkung) werden nicht still als erledigt ausgegeben. Keine echte iOS-/VoiceOver-Abnahme behauptet.
- CI-/Coverage-Härtung und Nachweise: `docs/implementation/MID_C38_CALENDAR_REGRESSION_0.9.85.285.md`; Tages- und Resttagesmenge sind im `MID_PRECIPITATION_INTERVAL_CONTRACT.md` ausdrücklich getrennt.
- Nur Source-PR → SHA-Bot → Release-ZIP → Installer → Worker/Pages → Stable; dieser Kandidatenkopf ist kein Veröffentlichungsbeleg.

# MID v0.9.85.284 · Kartenkontrollen und freie Kartenfläche (Source-PR-Kandidat)

- Ausgangspunkt: main=mid-stable=532f56a95a6d47a5cb2218146aaa038d7a74384c, freigegebene .283; bei Beginn kein konkurrierender Produkt-PR.
- Kleine Displays: statt permanenter Ebenen-/Modellsteuerung ein zugängliches aufklappbares Panel mit aktiver Datenquellenbeschriftung. Direkte Kartenzeitwahl sowie die gemeinsame Zeitleiste bleiben durchgehend verfügbar. Mobile Linienfarbensteuerung wird auf einen kleinen anklickbaren „Linien“-Schalter reduziert.
- Wettermodellkarten zeigen Modell-/Produktwahl weiterhin unmittelbar; Kartenbasis wandert in „Darstellung & Ebenen“, Modell- und Gültigkeitsstatus unter die Kartenfläche. Die Darstellungsfläche wird erhöht, einschließlich Landscape.
- „Isobaren“ und „Isohypsen“ tragen in Steuerungstexten und direkt entlang der Kartenlinien keine redundanten Einheiten. Gemeinsame MapLibre-Linienbeschriftung nutzt das numerische Level, das Komposit dieselben Werte ohne Suffix; in Legenden/Details bleiben hPa/gpdm, Modell, Druckniveau, Gültigkeit und Quellen unverändert.
- Gemeinsame Popover-Positionierung beobachtet Größenänderungen (ResizeObserver) und berechnet die Position im sichtbaren Viewport neu; 844×390-Browserfall bleibt streng auf Überlauf geprüft. Neue verbindliche Regression scripts/test-map-canvas-mobile-0985284.mjs. Responsivität, echte Auswahl, Zeitleiste, Datenstatus, Bildexporte, Hell/Dunkel, Fokus und Warnungsabgrenzung vor Veröffentlichung prüfen. Kein physischer iOS/VoiceOver-Nachweis behauptet.
- Veröffentlichung erst nach grünem Source-PR-Gate, kontrolliertem SHA-Bot, serverseitigem Release-ZIP, install-mid.yml, Worker/Pages und Stable-Promotion. Dieses Dokument ist **kein Releasebeleg**.

# MID v0.9.85.283 · Schnellstart/Netzwerkresilienz (Source-PR-Kandidat)

- Verifizierte Stable-Basis `main=mid-stable=b02d1b018882807fbce114cf6816f520f52339d1`, v0.9.85.282 nach erfolgreichem Installer #39038958909. Issue #398; keine konkurrierenden offenen Produkt-PRs bei Arbeitsbeginn.
- Ortswechsel dürfen ausschliesslich orts-/höhen-/zeitzonenexakte Best-Match-Cache-Prognosen bis 45 Minuten als gekennzeichneten temporären Stand sofort anzeigen; keine ortsfremden oder unvalidierten Daten. Neue Netzdaten aktualisieren weiterhin standortgebunden.
- Höhen-Best-Match wird nicht mehr durch ein optionales Regionalmodell aufgehalten. Regionalmodelle aktualisieren nur nach erfolgreichem Schema-/Zeitabgleich; Abbrüche erhalten einen begrenzten vollständigen Retry mit gleichen Variablen und strikter 429-/Cancel-/Missing-Abgrenzung.
- Pflichtregression `scripts/test-location-mountain-resilience-0985283.mjs` wird zur Baseline aufgenommen. Kein Release ohne grüne Source-, Install-, Worker-, Pages- und Stable-Gates; dieses Dokument selbst belegt keine Veröffentlichung.

# MID v0.9.85.282 · Vollständiger lokaler Kalendertag für Tages-Skybar und Tagessummen (Source-PR-Kandidat)

- Freigegebene Source-Basis: `main = mid-stable = 5153a43979a5b995008e554d1ee8bf111c8dbe5a`, MID v0.9.85.281, Installer #39029978638 nach vollständigen Gates erfolgreich. Issue #395; Screenshot mit im Tagesverlauf abgeschnittenem Wetterstreifen.
- `daySkybarCalendarWindow(date,timezone)` verankert die Skalen für Tageselemente auf realen lokalen Tagesgrenzen, unterstützt echte 23/25h-Zeitumstellung. `daySkybarTimelinePositions`, Stundenenden und Missing-Zeiten verhindern Dehnung ab erstem Reststundenwert und Wetter-/Niederschlagsaussagen ohne Daten. Widgets/Exports verwenden dieselbe Tagesquelle. Sonnen-/Nachtgrenzen bleiben an astronomische Zeiten gebunden.
- `SevenDayForecastSummary` berücksichtigt Tagessignale einschließlich verfügbarer vergangener Stunden. Volle Niederschlags-/Sonnenschein-Tagesmenge stammt aus `Day`, nicht aus der nach „Jetzt“ abgeschnittenen Hour-Reihe. Nowcast und rollierende 24 Stunden werden nicht zum vollständigen Tagesfenster umdefiniert.
- Baseline enthält Test `scripts/test-full-calendar-skybar-0985282.mjs` zusätzlich; 986 erforderliche Regressionen. Keine unbekannten Werte als 0 und keine nicht belegten historischen Stunden rekonstruieren. **Noch kein Release: Source-PR-Gate, SHA-Bot, ZIP, Installer, Worker/Pages und Stable-Promotion vorgeschrieben.**

# MID v0.9.85.281 · Pseudo-Sat-Land/Wasser (Source-PR-Kandidat)

- Verifizierte freigegebene Basis: `main = mid-stable = 9bb12c712cce0d6a5f73460cbe76c4a498c9a01c`, v0.9.85.280 nach Installer 39023811560. Keine offenen konkurrierenden Produkt-PRs beim Start. Vor Release erneut Drift/CI prüfen.
- Schematische Modellwolken erhalten in heller Ansicht eine geografisch geprüfte ruhige Land-/Wasserkarte aus bestehender OpenFreeMap-Quelle. In der separaten ICON-D2-Karte bleibt das Wolken-Wetterraster über der Kartenbasis. SVG/PNG benutzen dieselbe Palette und Natural-Earth-Country-Ringe samt 16 Bundesländerflächen; transparente Clear-/Missing-Pixel bleiben unverändert. Keine Änderung echter Satellitenbeobachtungen, amtlicher Warnungen oder meteorologischer Zahlen.
- Neue gezielte Regression `scripts/test-pseudo-satellite-basemap-0985281.mjs` mit Küsten-/Inland-/Meerproben. Zwei historische Export-Aufruf-Verträge werden nur an die zusätzliche Geometrie-Übergabe angepasst. App- und Worker-Versionsspiegel werden gemeinsam auf .281 gehoben.
- Quelle und Tests sind **kein Release-Nachweis**. Erst Source-Gate, Bot-Merge, serverseitiges ZIP, Installer, Worker/Pages und Stable-Promotion erlauben Veröffentlichungsaussagen.

# MID v0.9.85.280 · Pushzeit-Darstellung und modellgetreue Isobaren (Source-PR-Kandidat)

- Verifizierter Ausgangspunkt `main=mid-stable=afceb2d0b770a7f7c337cc1b9e69359dcfee19d6`, freigegebene v0.9.85.279; Issue #392. Keine konkurrierende Produkt-PR.
- Regen-/Schnee-Vorwarnzeit wird nur für die Anzeige gerundet. Absolute Anzeigen basieren auf dem UTC-Ereignisbeginn und einer validierten Orts- bzw. Geräte-IANA-Zeitzone mit Tageswechsel/DST; unzuverlässige Zeitanker führen zum relativen Fallback. Vorwarnung, Schwellen, Ereignisdeduplizierung und Nachrichtensperren bleiben identisch.
- Synoptische Modellkarten mit eigenen Druckkonturen (auch GFS/IFS) besitzen eine gespeicherte MSLP-Isobaren-Umschaltung. Wolken-/Wetterkarten bleiben auf bestätigte CLCT-/WW-Paarungen begrenzt; kein GDPS-Fallback oder erfundene Konturen.
- Änderungen werden erst nach Source-PR-Gate, kontrolliertem SHA-gebundenem Bot-Merge, serverseitigem ZIP, Installer, Worker/Pages und Stable-Promotion als veröffentlicht gewertet.

# MID v0.9.85.279 · Geprüfte Pseudo-Sat-Kartenkonturen und Ortswechsel-Recovery (Source-PR-Kandidat)

- Ausgangsbasis `main=mid-stable=ee2c00bfd0db42cf0f48715bccd0dbff1e221c42` als freigegebene v0.9.85.278, keine konkurrierende Produkt-PR.
- Ortssuche-Timeout wird nach direktem/Worker-Ausfall ohne vorhandenen passenden Cache nur einmal pro unverändertem Ort automatisch nachgefragt; Ergebnis der alten Ortssuche niemals übernehmen; manuelles Retry verfügbar.
- Schematisches Wolken-/Wetterbild bleibt lokal gespeichert. Pseudo-Layer zeigt dunklere geografische Kartenbasis ausschließlich in Light und nur bei echten Modell-Terminen. Neue Konturauswahl ergänzt MSLP-Isobaren (hPa) um bestätigte 500-hPa-Isohypsen (gpdm); strikt gleicher Modelllauf und Gültigkeitszeitpunkt für Karte/PNG/SVG. Kein GDPS-Fallback oder Radiometrie-Fiktion.
- Keine neuen kostenpflichtigen Datenprodukte, keine Änderung an RUC-Kompression, WMO-Code, fehlenden Wetterwerten oder amtlichen Warnungen.
- Einträge beschreiben einen Source-PR-Kandidaten und dürfen nicht mit erfolgreicher Produktion verwechselt werden, bis kompletter ZIP-/Install-/Pages-/Worker-/Stable-Release abgeschlossen ist.

# MID v0.9.85.278 · Exakte Skybar-Sonnenzeit-Segmente (Source-PR-Kandidat)

- Verifizierter Ausgangspunkt `main = mid-stable = 6754d25358c809966a3e1d026c88f500a1699d69`, v0.9.85.277. Laufende RUC-/Revisions-/Widgetaktionen bleiben separate, nicht zu überschreibende Pipelines. Kein Repo-Handoff aus dem alten Replit-Workspace.
- Der gemeinsame kontinuierliche Skybar-Helfer splittet bekannte Tages-/Nachtteilintervalle ausschließlich an `solarTimelineWindow`-Epochen; Bewölkung und echte Sonnenscheindauer bleiben verschiedene Größen. Keine gelben Bänder in bekannter Nacht, keine meteorologischen Zwischenbilder und keine angenommene Sonnenmessung. Stundenquadrate bleiben diskret.
- Der originale precipitation-/phase-/amount-Slot bleibt unverändert; bei fehlendem Zeitanker gilt die bewährte frühere Darstellung statt frei erfundener Solargrenzen.
- Veröffentlichung erst nach vollständigem Source-PR-Gate, kontrolliertem SHA-Bot-Merge, serverseitigem ZIP, Installer, betroffenen Worker-/Pages-Gates und `mid-stable`-Promotion. Bis dahin ausdrücklich kein bestätigter Release.

# MID v0.9.85.277 · Beobachtungs→Modell-Kartenübergang, Isobaren

- Ausgangsbasis main=mid-stable=ff30648863744759aca9b28c524662e3f65ba496 (v0.9.85.276) und Issue #386. Modell-Wolken/WW-Layer nur auf bestätigten Modellframes der vorhandenen gemeinsamen Zeitachse; Beobachtungen und Nowcast behalten Originalzeit und Quelle, keine fake Frames oder echte satellitenähnliche Radiometrie.
- Zusätzlich umschaltbare MSLP-Isobaren (hPa) für ICON-D2, ICON-EU und ICON Global nur aus den jeweils eigenen verifizierten Druckkonturen mit identischem Modell, Lauf und Termin; GDPS ohne eigene passende Druckquelle bleibt ohne Linien. Gemeinsame dauerhafte Auswahl und gleiche Konturlinien auf Karte sowie PNG/SVG.
- Meteorologische Werte, Warnungen, RUC-Kompression, native Satellitenprodukte und Zeitachsenkern bleiben unverändert. Neue Regression test-pseudo-satellite-isobars-0985277.mjs; Release nur nach vorgeschriebener automatischer Gatefolge.

# MID v0.9.85.276 · Modell-Wolkenbild, Phase A

- Quelle: main=mid-stable=2879b8437123017bfc98bafcf54ec9e9b68a5b50, freigegebene v0.9.85.275, Issue #386. Schematisches Modell-Wolkenbild aus echten paarigen DWD CLCT+WW-Rasterwerten als optionaler Darstellungsmodus. Einheitliche Projektion/Farben/WMO-Zuordnung und identische Karten-/Exportdaten. Keine neue Satellitenradiometrie, kein meteorologischer Zahlenwert und kein erfundener Prognose-Frame. Fehlend ist niemals gleich 0.
- Der bereits bestehende Pseudo-Satelliten-Zeitachsenvertrag bleibt gültig; Phase B (Beobachtungs→Modellübergang) wird hier ausdrücklich nicht vorweggenommen.
- Veröffentlichung nur nach Source-PR-Gate, Bot-Merge, serverseitigem Release-ZIP, Installer, Worker/Pages und Stable-Promotion.

# MID v0.9.85.275 · Isolierte Extremwetter-Direct-Fallback-Abbrüche

- Verifizierte Stable-Basis `fabed02f7f42d4a430ba9478c33aadc0d0f98c25`, Version .274. Issue #345: Modulglobales `directRequestSignal` kann bei überlappenden Direktabrufen den Abbruch der anderen Auswertung übernehmen. Jeder direkte Auswertungsvorgang erhält nun einen eigenen lexikalischen Signal-Kontext. Der generierte Client und der kanonische Generator sind synchron; die meteorologische Worker-Quelle und die bekannten Cache-/Datenverträge bleiben unverändert.
- Deterministischer Test für parallel laufende Produkte, eigene spätere Teilabrufe, Abbrüche und vollständig unabhängig weiterlaufenden zweiten Vorgang in der bestehenden Required-Regression. Cancelled work darf nicht als erfolgreicher neuer Live-Stand ausgegeben werden.
- Source-PR/Review/Gates, kontrollierter Merge, serverseitiges ZIP, `install-mid.yml`, Worker-/Pages-Health und `mid-stable`-Promotion vor einer Freigabe strikt erforderlich.

# MID v0.9.85.274 · Modellstand-Sammelindikator kalibrieren

- Ausgangspunkt `main = mid-stable = 1b842f210c6f817693c8f117c91e4ee867248650`, freigegebenes `v0.9.85.273`. Die bei Einzelmodellalter streng beibehaltenen RUC-/MOSMIX-/Ensemble-Schwellen werden für den **Sammelindikator** differenziert aggregiert: kein globales Rot bei nur einem veralteten von mehreren berücksichtigten Läufen; gelb meldet dies ausdrücklich im Detail. Ab ≥2/3 überfälligen Mitwirkenden bleibt Rot. Unbekannte Werte niemals grün.
- Nur `usedInCanonical=true` oder mangels expliziter Benutzung als aktiv/geladen belegte Modelle; `usedInCanonical=false` wird ausgeschlossen. Aktive `fallback`-Ensembleläufe werden berücksichtigt. Keine Umdeutung des Status zu Prognosegüte oder amtlicher DWD-Warnstufe.
- Nicht als veröffentlicht betrachten, bevor PR-Source-Gate, unveränderlicher serverseitiger ZIP-Release, Installer, Worker, Pages und Stable-Promotion nachweislich erfolgreich sind.

# MID v0.9.85.273 · Modellstand-Aktualität auf einen Blick

- Gegen GitHub-`mid-stable` `1a7eedbe49e35445619131d390d3991e218c164a` und den sauberen vorbereiteten .273-Integrationscommit geprüft. Die bestehende Model-Freshness-Pille wird in Kurzfrist-, 7-Tage- und 14-Tage-Ansichten konsistent mit grün/gelb/rot/grau, Statuspunkt und Screenreadertext ergänzt. Unbekannte Laufzeit- oder Intervallmetadaten bleiben unbekannt; Laufalter ist kein Modell-Skill und keine amtliche Warnung.
- Die bestehende 60-Sekunden-Statusaktualisierung, Modellinit-/Cadence-basierte Regeln, differenzierten MOSMIX-Grenzen und Datenquellenprovenienz sind Teil des Regressionstests. Wetterwerte, Modellfusion, RUC-Kompression und meteorologische Warnungen werden nicht geändert.
- Dieser Source-Stand muss vor Produktivfreigabe den vollständigen Source-PR-/SHA-Bot-/ZIP-/Installer-/Worker-/Pages-/Stable-Promotion-Pfad erfolgreich durchlaufen; eine vorbereitete Branchversion allein ist kein öffentlich bestätigter Release.

# MID v0.9.85.260 · RUC-Nachweise und Open-Meteo-Prüfstand

Diese Entwicklung basiert auf dem erfolgreich veröffentlichten MID .259,
main = mid-stable = 9c0cd7cd0da3dcbd1d6cd72fc9ec1ad90311b021.
Sie ergänzt explizite laufgebundene Codecdiagnostik im bestehenden RUC-Health-CLI
und konsolidiert frühere Open-Meteo-Prüfungen samt Originalquellen in
`docs/implementation/MID_OPEN_METEO_RUC_AUDIT_0.9.85.260.md`.
Rohdaten, meteorologische Berechnungen, API-Modelle, Rollback und Releaseweg
bleiben erhalten. Entwicklungsstand und erfolgreiche Stable-Promotion sind
unterschiedliche Belege; Source-Gate und Installer müssen erst erfolgreich sein.

# MID v0.9.85.256 · RUC-Kompression sicher für Browser und Worker vorbereiten

- Der neue Prüfschritt kann künftig verlustfrei komprimierte RUC-Wetterdaten in JavaScript wieder exakt in ihre ursprünglichen Werte umwandeln. Dabei werden auch fehlende Werte korrekt erhalten.
- Ein zusätzlicher automatisierter Test prüft alle 65.536 möglichen 16-Bit-Muster und echte Python-Kompressionsdateien. Beschädigte, verkürzte oder unerwartete Daten werden zurückgewiesen.
- Die Messung eines vollständigen RUC-Laufs zeigt für Byteplane-gzip rund 70,8 Prozent theoretisches Einsparpotenzial beim bisher veröffentlichten Datenbestand. Das ist eine Messung, noch keine aktivierte Speicherreduktion.
- Die bisherige RUC-Veröffentlichung, Wetterberechnungen, Karten und das bestehende Datenformat bleiben unverändert, bis Web-/Worker-Dual-Read, echte Leistungsprüfungen und die alten App-Caches sicher getestet sind.

# MID v0.9.85.255 · Kartenprüfung bei hoher Browserlast zuverlässiger

- Die regelmäßige Qualitätsprüfung der Wetterkarten verteilt gleichzeitig geöffnete Kartenfenster schonender. Dadurch wird die Software-Grafikdarstellung weniger stark überlastet.
- Alle 24 Bildschirmgrößen-, Design- und Hell-/Dunkel-Prüffälle bleiben erhalten. Die Anzeige der ICON-EU-Isobaren muss weiterhin tatsächlich funktionieren; eine fehlende Karte bleibt ein Fehler.
- Sollte die Prüfung scheitern, zeigt der Bericht jetzt deutlicher, welche Displayvariante, Modellkarte und Kartenlayer betroffen waren.
- An Wetterberechnungen, Modelllaufzeiten, Farben, Karteninhalten und der Bedienung ändert sich nichts. RUC-Datenformate und Speichergrenzen bleiben unverändert.

# MID v0.9.85.254 · Veröffentlichte Modellkarten wieder vollständig erreichbar

- Ein Fehler im Kartenkatalog wurde behoben: Gültige zusätzliche ICON-D2-Wolken-/Wettertermine bei +13, +14, +16 und +17 Stunden führten bisher dazu, dass die App den gesamten Synoptik-Katalog ablehnte. Die bereits veröffentlichten Karten von ICON-D2, ICON-EU, ICON, GFS und IFS sind dadurch wieder auswählbar.
- Die Prüfung bleibt streng: Zusatzstunden gelten ausschließlich für ICON-D2. Lauf, Gültigkeitszeit, Modellhorizont, Größe, Datenformat und Prüfsummen müssen weiterhin stimmen. Fehlende Karten werden nicht geschätzt oder künstlich ergänzt.
- Automatische Kartenprüfungen verwenden auch beim vollständigen Revisionslauf die bestehenden vollständigen Teilgruppen. Alle 24 Größen-/Theme-/Designfälle bleiben erhalten; die Zeitgrenze pro Teilgruppe wird nicht erhöht.
- Neue Regressionen prüfen den tatsächlich veröffentlichten Katalog und zusätzliche Kartenstunden. Wetterberechnungen, Darstellung, Speicherbudget und das RUC-Datenformat bleiben unverändert.

# MID v0.9.85.253 · Sicherheitsprüfungen mit eindeutigem Datenstatus

- Eine hohe Sicherheitslücke im Build-Werkzeugpfad wurde durch den kompatiblen Patch von `source-map-js` auf 1.2.2 behoben.
- Die Prüfung der Produktionsabhängigkeiten unterscheidet jetzt ein geprüftes Ergebnis von einem unbekannten Zustand bei ausgefallenen Prüfdiensten. Ein unbekannter Zustand wird nicht mehr als „keine hohen Sicherheitsbefunde“ bezeichnet.
- Prüfzeit, geprüfter Paketstand und verwendete Quelle werden nachvollziehbar dokumentiert. Bei Dienstausfällen wird eine notwendige Nachprüfung ausgewiesen.
- Unvollständige oder ungültige Antworten gelten nicht als erfolgreiche Prüfung. Bestätigte hohe und kritische Befunde blockieren weiterhin die Freigabe.
- Wetterdaten, Modellkarten und Darstellung bleiben unverändert. Die bestehende Regel für reine externe Dienstausfälle und die unabhängigen Release-Prüfungen bleiben erhalten.

# MID v0.9.85.252 · Modellkarten bei echten Datenlücken besser erreichbar

- Bei geöffneten Modellkarten wählt die gemeinsame Zeitleiste zum Einstieg einen tatsächlich vorhandenen Modelltermin statt eines reinen Radar-/Beobachtungszeitpunkts. Das reduziert leere Synoptik-Komposite bei ungleichmäßig verfügbaren Modellzeiten.
- Bei „Wolken und signifikantes Wetter“ kann ICON-D2 für einzelne fehlende Termine ein schon vorhandenes, zeitgleiches natives Wolken-/Wetterfeldpaar nutzen. Fehlende oder unpassende Felder werden weiterhin nicht ergänzt oder geschätzt.
- Zusätzliche Regressionen prüfen die Terminwahl und stellen sicher, dass nur gemeinsam verfügbare Modellfelder verwendet werden.
- Modellberechnungen, Warnschwellen, RUC-Datenformat, Speicherschutz und die Bedienung anderer Wetterkarten bleiben unverändert.

# MID v0.9.85.251 · Zuverlässigere RUC-Veröffentlichungsprüfung

- MID prüft nach dem Hochladen neuer RUC-Wetterdaten etwas länger, ob der neue Modelllauf tatsächlich an der öffentlichen Adresse angekommen ist. Dadurch führen verzögerte Pages-Aktualisierungen seltener zu unnötigen Fehlalarmen.
- Die Überprüfung bleibt streng: Ein älterer oder ungültiger Modelllauf wird weiterhin nicht als erfolgreich bestätigt. Auch der Worker muss den richtigen Lauf und vollständige Daten melden.
- Zusätzliche automatisierte Tests simulieren sowohl eine verspätete Aktualisierung als auch dauerhaft veraltete oder ungültige Daten. Der Kontrolllauf dokumentiert jetzt die einzelnen Wiederholungsversuche verständlicher.
- Das Wettermodellangebot, die Berechnungen, das Datenspeicherbudget und die App-Oberfläche bleiben unverändert.

# MID v0.9.85.250 · RUC-Datenaktualisierung wieder absichern

- Ein Fehler im neuen internen RUC-Kompressions-Prüfmodul wurde korrigiert. Er hatte zuletzt die Veröffentlichung neuer RUC-Wetterdaten verhindert, obwohl die eigentliche Datenaufbereitung bereits erfolgreich war.
- Vor dem zeitaufwendigen Laden der DWD-Modellfelder kontrolliert MID jetzt alle Python-Programme der RUC-Pipeline auf Syntaxfehler. Zusätzlich ist diese Prüfung im Entwicklungs- und Freigabetest verankert.
- Die eigentlichen RUC-Modellwerte, das Speicherbudget, die Modellkarten und das bisherige Datenformat bleiben unverändert; eine produktive verlustfreie Kompression folgt erst nach eigenen Decoder- und Leistungstests.
- Die App-Oberfläche und ihre Bedienung ändern sich durch diese Fehlerbehebung nicht.

# MID v0.9.85.249 · RUC-Speicheroptimierung sicher vorbereiten und CSS-Startlast messen

- MID prüft neue verlustfreie RUC-Kompressionsverfahren jetzt mit einem zusätzlichen Sicherheitscheck. Dabei bleiben sämtliche 16-Bit-Werte einschließlich fehlender Wetterdaten unverändert; beschädigte und zu große Datenpakete werden im Test erkannt.
- Der Qualitätscheck misst nun die beim App-Start direkt eingebundenen CSS-Dateien auch in gzip- und Brotli-Größe. Das schafft eine Grundlage für gezielte Ladezeitverbesserungen ohne Layoutverlust.
- Noch keine Änderung der tatsächlich ausgelieferten RUC-Datenformate oder des Wetterkartenangebots: Eine produktive Kompressionsumstellung erfolgt erst nach Web-, Worker-, iOS- und Frischeprüfung.
- Prognosen, Warnungen und das gewohnte App-Design bleiben unverändert.

# MID v0.9.85.248 · Zusätzliche ICON-D2-Karten nur bei freiem Speicherbudget

- Für „Wolken und signifikantes Wetter“ versucht MID vier zusätzliche stündliche ICON-D2-Termine (+13, +14, +16 und +17 Stunden), sofern passende Originalfelder tatsächlich vorliegen.
- Die neuen Zeiten werden nur dann veröffentlicht, wenn nach allen bisherigen Karten und RUC-Prognoseprodukten genügend Platz verbleibt. Bestehende Kartentermine werden dafür nicht entfernt, und eine Sicherheitsreserve bleibt bestehen.
- Die CSS-Aufteilung wurde hinsichtlich tatsächlicher Ladewege und späterer Überschreibungen weiter untersucht. Die globale Darstellung bleibt bewusst unverändert, bis die ausgelagerten Styles in allen Größen und Darstellungsmodi nachweislich gleich aussehen.

# MID v0.9.85.247 · Prognose-Radar und klarere Modellkarten

- Das Prognose-Radar prüft auch Favoriten, die nicht geöffnet wurden. Fehlgeschlagene Prüfungen werden bei sichtbarer, verbundener App früher erneut versucht; die regelmäßige Kontrolle erfolgreicher Favoriten bleibt erhalten.
- Im Radar werden Fehler beim Wetterabruf und beim Speichern im Gerät jetzt getrennt angezeigt. So ist besser nachvollziehbar, warum noch keine Prognosebasis vorhanden ist.
- Modellwetterkarten zeichnen Länder- und Verwaltungsgrenzen als eigene Kartenlinien über den Wetterflächen. Ortsnamen bleiben ebenfalls sichtbar; die bereits funktionierenden Kompositkarten sind unverändert.
- Zusätzliche ICON-D2-Stunden werden aus Sicherheitsgründen noch nicht aktiviert: Die RUC-Datenveröffentlichung nutzt bereits nahezu das gesamte 900-MB-Speicherbudget. Vor einer Ausweitung müssen Speicherbedarf und Frische nachweislich abgesichert werden.

# MID v0.9.85.246 · Startlast der Darstellung messbar

- MID erfasst beim Qualitätscheck jetzt getrennt, wie groß die unmittelbar beim App-Start benötigten Gestaltungspakete sind. Damit lassen sich kommende Geschwindigkeitsverbesserungen zuverlässig überprüfen.
- Die Größen für komprimiertes CSS werden mitgemessen, ohne später geladene Ansichten fälschlich zum Startpaket zu zählen.
- Wetterdaten, Piktogramme und das gewohnte Layout bleiben unverändert. Die eigentliche Verkleinerung des Haupt-CSS folgt nach belastbaren Vergleichsmessungen.

# MID v0.9.85.245 · Robuste Wetterdatenabfragen

- Geschlossene Karten-Info-Dialoge geben den Tastaturfokus nur zurück, wenn inzwischen kein anderes Bedienelement ausgewählt wurde. Dadurch bleiben Deckkraftregler und Kartentermin unabhängig bedienbar.
- Identische gleichzeitige Wetterdatenabfragen werden weiter gemeinsam ausgeführt, ohne dass der Abbruch einer Ansicht andere aktive Ansichten beeinträchtigt.
- Bei Orts- und Ansichtswechsel werden nicht mehr benötigte Abfragen beendet, weiterhin benötigte Daten jedoch zuverlässig geladen.
- Explizite längere Wartezeiten von Open-Meteo werden eingehalten; unnötige erneute Versuche bei einer längeren Sperre werden vermieden.
- Zusätzliche automatische Tests sichern gemeinsame Abfragen, unabhängige Abbrüche und die Behandlung von Rate-Limits ab. Wettermodelle und Vorhersageberechnung bleiben unverändert.

# MID v0.9.85.244 · Temperaturspanne und verlässliche Radar-Basis

- Aktuelles zeigt Minimum und Maximum aller angezeigten 12-h-Stundenwerte statt einer Differenz zwischen Anfang und Ende. Fehlende Werte werden ausgewiesen.
- Prognose-Radar speichert Best-Match-Eingänge unabhängig vom Aufklappen. Favoriten werden bei sichtbarer, verbundener App alle 30 Minuten mit höchstens zwei parallelen Abrufen geprüft. Keine Hintergrund-Aufzeichnung bei geschlossener App.
- Anzahl gespeicherter Stände, letzter Stand und letzte Prüfung machen unveränderte Eingänge, Datenlücken und Fehler sichtbar. Fehlende Ensemble-Werte werden nicht als Nullen verglichen.
- Doppelte Kartenbeschreibungen konsolidiert hinter zugänglichem Info-Button; Legende, Quellen, Lauf, Termin und Fehlermeldungen bleiben erreichbar bzw. sichtbar. Auch Ortsvergleich, Radar-Methode und Prognosehinweis verwenden das gemeinsame Info-Popover.

# MID v0.9.85.243 · Orte sortieren und verständliche Wetterwerte

- Prognose-Radar unter Vorhersage eindeutig benannt. Die erweiterte Ensembleanalyse im Prognose-Cockpit zeigt dieselbe Auswertung nicht doppelt; eigenständige Ensembleansichten und Änderungsbenachrichtigungen bleiben erhalten.
- Die Mehrort-Übersicht folgt standardmäßig deiner Favoritenreihenfolge in den Einstellungen. Sortiere alternativ nach Ortsname, Warnlage, Temperatur, Niederschlagsmenge, Böen oder Entfernung. Deine Wahl bleibt gespeichert.
- Übersicht und „Wetterfenster vergleichen“ haben klar unterschiedliche Aufgaben: kompakte Wetterkarten gegenüber einer Rangliste mit hervorgehobenen passenden Stunden und konkreten Trockenphasen.
- Ganzzahlige Temperaturen in der Ortsübersicht; gleiche gerundete Minima und Maxima werden nur einmal angezeigt.
- Einheitliche parameterabhängige Anzeigepräzision: keine Hundertstel bei Niederschlagswerten, ganzzahlige Windwerte auch in m/s, Sichtweiten in fachlich passenden Stufen. Kleine positive Niederschläge bleiben als „<0,1 mm“ sichtbar.
- Neuer verbindlicher Präzisionsvertrag unterscheidet SYNOP-Berichtsregeln von MID-Prognosedarstellung. Die unveränderten Originalwerte bleiben Grundlage für Berechnungen und Vergleiche.

# MID v0.9.85.242 · Meine Orte und korrektes Desktop-Wetterprofil

- Eigene Favoritenseite „Meine Orte“ über die Ortsleiste und Mehr: Mehrort-Übersicht, fairer Ortsvergleich und vorhandene Favoritenverwaltung. Die Seite lädt unabhängig von der Prognose des gerade ausgewählten Orts; Zeitraum, Profil und Umkreis bleiben gespeichert.
- MID Prognose-Radar ist direkt bei der Vorhersage als „Prognoseänderungen“ erreichbar. Die Ansicht lädt beim Öffnen und merkt ihren geöffneten Zustand; bestehende Modellhistorie und gemeinsame Gültigkeitstage bleiben maßgeblich.
- Behebt das im Screenshot sichtbare Desktop-Raster des 24-h-Wetterprofils: Überschrift über beide Spalten, breite Grafik links, kompakte Einzeldaten rechts. Der gemeinsame Profilrenderer gilt auch für Widgets und Exporte.
- Update-Meldung mit lesbarer Textbreite, korrekt markierter Aktuell-Navigation und direkt geöffneten Planermodulen. Neue Eventtermine berücksichtigen die Zeitzone des Zielorts.
- Fehlende WebGL2-Unterstützung zeigt eine wiederholbare Kartenmeldung, statt die ganze App abzubrechen. Gleiche Temperatur-Minima/Maxima erzeugen keine doppelten Diagrammmarkierungen.
- Responsive Browserprüfungen umfassen breite Desktopansichten, Favoritenseiten-Navigation, Zustandswiederherstellung und Grafikfehler. Physische iOS-Geräte und deren Grafiktreiber sind damit nicht geprüft.

Die bisherigen Navigations-/Kernmodultests behalten alle geschützten Bereiche und ergänzen Meine Orte; die alte feste Modulzahl wird ausdrücklich von 18 auf 19 geändert. Die ursprüngliche .169-CSS-Kaskade bleibt unverändert.

# MID v0.9.85.241 · Sicherer Profilstart am Tag-/Nachtübergang

- Behebt den im veröffentlichten Browser reproduzierten Startabbruch bei einer Kurzfrist-Stundengruppe, die den Sonnenaufgang überschreitet.
- Das zusammengefasste Wetterpiktogramm verwendet denselben Tag-/Nachtstatus wie der sichtbare Intervallbeginn. Fehlende zivile Zeitfelder lösen keinen Startabbruch aus.
- Sonnenaufgang, Sonnenuntergang, fehlende Zeitfelder und unveränderte Niederschlagsintervalle werden mit dem echten Profilrenderer geprüft.

# MID v0.9.85.240 · Orte vergleichen und Prognoseänderungen verstehen

- Neuer gemeinsamer Bereich „Orte & Prognose“ unter Aktuell: Mehrort-Übersicht, Ortsvergleich 2.0 und MID Prognose-Radar.
- Alle Favoriten im gleichen kommenden 6-/12-/24-Stunden-Fenster, Trockenfenster, Regenrisiko, Temperatur und Böen; Profile und 30-/100-km-Filter werden gespeichert. Fehlende oder veraltete Daten erhalten keinen Spitzenplatz.
- Mehrort-Übersicht priorisiert amtliche Warnungen, Datenlücken und relevante Wetterlagen. Ensemble-P25/P75-Spannen werden gezielt ergänzt und nur für vollständig abgedeckte Stunden ausgewiesen.
- Prognose-Radar nutzt den vorhandenen Drei-Tage-Modellvergleich: Bisher/Jetzt, Relevanzfilter, Datenkontext und bis zu sechs Prognosestände für denselben Gültigkeitstag. Derselbe Renderer wird im Ensemblebereich verwendet.
- Regenbeginn wird mit absoluten Zeitstempeln abgesichert; abgelaufene Ereignisse und neu ins rollende Fenster kommende Termine werden nicht als Prognoseänderung ausgegeben. Ursachen ohne archivierte Eingangsevidenz bleiben ausdrücklich unbestimmt.
- Daten laden erst beim Öffnen, mit begrenzter Parallelität und Abbruch bei Orts-/Ansichtswechsel. Keine zusätzlichen kostenpflichtigen Quellen.

# MID v0.9.85.239 · Beobachtungen merken und kompakte Wetterphasen

- Beobachtungen lassen sich gemeinsam aus-/einschalten; die gewählten Einzellayer bleiben gespeichert. Direkte Bedienaktionen speichern sofort, unveränderte alte Karteninstanzen überschreiben keine neuere Auswahl.
- Höhenkonturen: 8/4 gpdm. Druckkonturen: 5/2/1 hPa nach Zoom und numerischem Gradienten; neue 1-hPa-Geometrie wird aus dem Modellfeld erzeugt. Ältere unveränderliche Dateien behalten ihre vorhandenen Linien bis zum nächsten passenden Datenlauf.
- Feinere ICON-D2-Isobaren werden einmal im Bodendruckfeld gespeichert; andere native Karten und Exporte nutzen die exakt lauf-/terminpassende Druckgeometrie. T/H bleiben ausschließlich in reinen Bodendruckkarten.
- Der Wetterphasenbereich wird im aktiven Stylesheet kompakt dargestellt: drei kurze Zeilen auf Smartphones, drei Spalten auf größeren Bildschirmen. Werte, Ensemble-Spannen und Quellen bleiben unverändert.

# MID v0.9.85.238 · Adaptive Konturen und klare Ortsanzeige

- Numerische Isobaren/Isohypsen werden beim Zoomen mit 16/8/4 hPa bzw. dam sichtbar; veröffentlichte Daten bleiben unverändert. Isobaren unter 1013 hPa sind gestrichelt, auch im ICON-D2-Export.
- T/H erscheinen ausschließlich in reinen Bodendruckkarten, nicht im Synoptik-Komposit.
- Die Ortszeile erhält eine deckende, isolierte und untransformierte Darstellung; responsive Browserprüfungen berücksichtigen Bottom-Tabs und Nachkomma-Scrollpositionen.
- RUC-Speicheraudit ergänzt einen verlustfreien Delta-/Byteplane-Kandidaten mit vollständiger Byte-Rückprüfung. Keine produktive Codec-Aktivierung, Genauigkeitsreduktion oder Budgetänderung.

Details: docs/implementation/MID_C28_ADAPTIVE_CONTOURS_0.9.85.238.md. Echte iOS-/WKWebView-Abnahme bleibt offen.


# MID v0.9.85.237 · Karten merken sich die Auswahl, mehr ICON-D2-Stunden und Druckzentren

- Die gespeicherte Modellwahl bleibt auch erhalten, wenn ein Modell vorübergehend nicht im Katalog verfügbar ist. Radar-/Satelliten-Layer werden beim erneuten Öffnen wiederhergestellt; die gemeinsame Karte überschreibt keine alte Synoptik-Auswahl.
- Native ICON-D2-Karten erhalten echte Termine für jede Stunde von +1 bis +6. Zusätzliche Synoptik-Termine werden aus demselben Lauf geprüft und im Speicherbudget vor verzichtbarer späterer Dichte erhalten.
- Bodendruckkarten und Synoptik-Komposit zeigen modellgestützte Hoch-/Tiefzentren mit H/T und Druckwert. Markierungen werden nur aus passenden numerischen Druckdaten desselben Laufs und Termins erzeugt. ICON-D2-Exporte enthalten dieselben Zentren.
- Speichergrenzen, Prüfsummen, Mess-/Prognoseunterscheidung und fehlende Daten bleiben verbindlich. Tatsächlich verfügbare Termine richten sich nach Quelle und erfolgreicher RUC-Veröffentlichung.

Technischer Nachweis: docs/implementation/MID_C28_MAPS_0.9.85.237.md. Basis main=mid-stable 7ff4f362da6742b90c5ac20f95cfe56bf5b7dc48. Vollständige echte iOS-/Langzeit-/Wissenschaftsabnahmen bleiben offen.

# MID v0.9.85.236 · Ortsanzeige und verlustfreie RUC-Deduplizierung

- Die ausgewählte Ortsleiste bleibt beim Scrollen über dem Suchkopf scharf lesbar. Der überlagernde Kopf-Blur wird bei sichtbarer Ortsleiste abgeschaltet; Karten-/Einstellungsgrenzen und Dialoge bleiben erhalten.
- Bytegleiche RUC-Chunks werden nach Hash, Größe und vollständigem Bytevergleich einmal gespeichert. Der Worker unterstützt geprüfte Chunk-Aliase sowie unverändert ältere Snapshots. Missing, trockene Nullen, Zeitachsen und Datengenauigkeit bleiben bitidentisch.
- Gemessener Lauf2026-10-11T05:00:899950367 Objektbytes,20103168 Duplikatbytes. Der tatsächliche Gewinn jedes neuen Laufs fließt vor der Synoptik-Budgetierung ein und erhält damit mehr validierte Modelltermine, sofern verfügbar.1MB Reserve plus exakte Manifestprüfung schützen das unveränderte900MB-Budget.
- Gzip/Byteplane-Kompression bleibt Messkandidat bis vollständige Lauf-/Decoder-/Performance-Evidenz vorliegt. Keine zusätzlichen Felder oder Modelle werden zur Einsparung gestrichen, kein kostenpflichtiger Speicher aktiviert.

Details: docs/implementation/MID_C27_STORAGE_LOCATION_0.9.85.236.md. Offene echte Geräte-/Werte-/SLO-Abnahmen bleiben unverändert.

# MID-C27 · 0.9.85.235 · kompakter Profilkopf und Ortskontext

Basis: main = mid-stable fd6890ef73d7f70f8dff962f48042994801fd7f0 (.234); keine überlappenden MID-Source-PRs (nur Dependabot 260/253/252).

Legende und Info stehen im gemeinsamen ShortTermRibbon-Profilkopf. Die bestehenden Funktionen und persistierte Legendenauswahl bleiben erhalten; aria-expanded informiert über beide Zustände. Keine zusätzliche Toolbar-Zeile; Touchflächen mindestens 44px. Classic/Next und sämtliche gemeinsamen Profilverbraucher nutzen dieselbe Komponente.

SelectedPlaceBar verwendet den kanonischen displayLocationName einschließlich Favoritenalias. Die kompakte Ortszeile bleibt beim Scrollen am sicheren oberen Rand sichtbar. Bei Kartenarbeitsbereich, geöffneten Einstellungen, fehlendem Ort und eigenständigem URL-/PNG-Export entfällt sie. Der bisherige Header scrollt mit, um zwei übereinanderliegende Sticky-Köpfe zu vermeiden. Lange Ortsnamen werden visuell gekürzt, vollständiger Name bleibt im Text/Accessibility-Baum und title.

Orientierung: Apple Weather dokumentiert Ort vor Temperatur/Stundenprognose (https://support.apple.com/guide/iphone/check-the-weather-iph1ac0b35f/26/ios/26); meteoblue dokumentiert orts-/höhenbezogene Meteogramme mit Ortsinformation oberhalb der Aktualisierung (https://content.meteoblue.com/en/private-customers/website-help/forecast/meteograms). Daraus folgt unser eigener Ortskontext, keine Aussage über intern verwendete Kompressionsverfahren anderer Apps.

RUC-Lauf 38114988882, prepare 114398002184, erfolgreich: 2026-10-11T04:00, 899950726/900000000 Bytes, nur 49274 Bytes Reserve, 1216 Objekte. Checkout erfolgte vor .234-Stable-Promotion; deshalb noch kein neuer storage-audit-Bericht. Nicht als Kompressionsmessung ausgeben.

Storage-Audit misst jetzt zusätzlich reversible int16-Byteplanes + gzip6 gegen direktes gzip6. Jedes Sample wird vollständig zurückdekodiert und byteweise geprüft, einschließlich Missing-Bitmustern. Lookup wird separat behandelt; bereits komprimierte Kartenobjekte werden nicht erneut komprimiert. Der Produktionsaudit misst sämtliche geeigneten binären Chunks bis2MB vollständig und rückdekodiert; nur die Detailausgabe ist auf drei Stichproben pro Produkt begrenzt. Exakte Kandidatensummen zählen andere Objekte unverändert. Keine Extrapolation. Produktion und 900MB-/950MB-Grenzen unverändert.

Priorisierte Alternativen: (1) verlustfreies gzip bzw. Byteplanes+gzip mit versioniertem Manifest, Roh-/Wire-Hashes, Decode-Limits und echtem Worker-CPU-/Latenznachweis; (2) Content-Dedup identischer Chunks, falls der echte Manifest-Duplikatwert relevant ist, ohne Dekompressionskosten; (3) ortsbezogene Chunk-Ladevorgänge beibehalten, keine Vollgitter im Client; (4) separates Objekt-Backend für vollständige EPS-Member/zusätzliche Rapid-Felder, mit konkreter Kosten-/Retentionprüfung. Keine neue Präzisionsreduktion, keine räumliche oder zeitliche Ausdünnung. R2-Retention allein löst den Pages-Snapshotdeckel nicht. Transportkompression allein löst gespeicherte Bytes nur, wenn tatsächlich komprimierte Objekte gespeichert werden. Keine Aktivierung ohne gemessenen vollständigen Payload und Decoder-/Performanceabnahme.

Offene Gesamtabnahme: numerische Reprojektions-/Kachelnähte, vollständige optionale Datenverträge, langfristige SLO-/Alarmzustellung und echte physische iOS-/WKWebView-/VoiceOver-/Geräteperformance. Browseremulation ersetzt diese Evidenz nicht. GDPS-Uhrzeitkorrektur und CW-Budgetarbeit .233/.234 bleiben bestehen.

# MID v0.9.85.234 · MID-C27 GeoMet-Zeitformat und RUC-Speichermessung

Basis main=mid-stable d4ddd72445abf2e67ee38e814c8d650a52188d32 (.233). GeoMet lehnt .000Z in GetMap-Zeiten mit HTTP200/XML-NoMatch ab. Ausschließlich GeoMet-Relay normalisiert ganze UTC-Sekunden ohne Änderung des Epoch-Werts; Bruchteile werden abgewiesen. Read-only RUC-Inventar misst Produktbytes, Restbudget, deklarierte Duplikate und begrenzte hashgeprüfte gzip-Roundtrips; echte publizierte CW-Stunden werden geloggt. Keine Budget-/Decoder-/Datenänderung. Details docs/implementation/MID_C27_STORAGE_GEOMET_0.9.85.234.md. Veröffentlichung nur regulärer Source-/Installerpfad; offene echte Geräte-/Langzeit-/vollständige Wissenschaftsabnahme bleibt offen.

# MID v0.9.85.233 · MID-C27 Kartenbudget und GDPS-Neuladen

Basis dd9e501f1ae58bab43f2f1e66c3827f388999434, main=mid-stable .232. Live-Katalog bestätigt Budget-Pruning als Ursache einzelner CW-Termine. .233 priorisiert stündliche CW vor optionaler Synoptikdichte und protokolliert Kürzungen bei unverändertem900MB-Gate. GDPS-Retry erhält neue Quellenidentität. Details docs/implementation/MID_C27_CLOUD_BUDGET_0.9.85.233.md. Veröffentlichung nur regulärer Source-/Installerpfad; echter Geräte-/Langzeit-Audit weiter offen.

# MID v0.9.85.231 · Missing bleibt fehlend in RUC-Phasen und Radar-Thermik

Ergänzter freigegebener Scope: Wolken und signifikantes Wetter als gemeinsame Karte mit derselben persistierten sigwx-ID. D2 kombiniert native CLCT/WW mit gleichem Lauf/Termin/Raster; EU/Global optional direkt aus verifizierten DWD-GRIB-Produkten und nur bei cloudWeather-Katalogbeleg. GDPS kombiniert verifizierte Wolken-/Instant-Niederschlagsart-Kacheln mit gemeinsamem Lauf/Termin und eigener Legende, ohne Anspruch auf vollständige Nebel-/Gewitterdiagnostik. Gemeinsame Ortswerte/Exports, keine Kategorieninterpolation. Wissenschaftliche Primärbelege und Einschränkungen: docs/implementation/MID_CLOUD_WEATHER_2026-10-10.md.

Basis main=mid-stable116cc09e9fdd9605cfbc5154e6e84c4065793b78 (.230), Installer38070923765 vollständig erfolgreich. Builder ersetzt fehlende Graupelreihe durch NaN statt0; Packing erhält -32768. Worker-Phasegrid entfernt Number(null)-Coercion und zählt nur echte endliche Werte. Overlay verwirft null/leere/boolesche Werte statt künstlicher0°C/Höhen; echte numerische0 bleiben gültig. Zwei neue Pflicht-Pythonfälle und erweitertes reales Worker-/Overlay-Gate prüfen Packing, partielle Lücken, Trockenwerte, all-missing und Schnee-/Gefrierbeleg. Weitere Auditpunkte einschließlich neu dokumentierter RAIN_GSP-Units/accum-Frage offen; keine unbelegte Umrechnung. Details: docs/implementation/MID_PHASE_MISSING_AUDIT_2026-10-10.md. Veröffentlichung erst nach normalem Source-/Installer-Gate.

# MID v0.9.85.230 · Skybar, alphabetische Karten und optionale MU-Energieverträge

Ergänzte Release-Scope vor Veröffentlichung: Modelle werden in den beiden Karten-Auswahlrouten nach sichtbaren deutschen Labels sortiert; Parameter werden nur innerhalb ihrer bisherigen Gruppen alphabetisch/numerisch sortiert. Gemeinsame immutable alphabeticalMapOptions-Funktion, keine Änderung der kanonischen Modell-/Produktreihenfolge für Fallbacks oder persistierter IDs. Unit-/echte Karten-Browserprüfungen schützen Reihenfolge, Mitgliedschaft und kompatible Auswahl.

Offener wissenschaftlicher Audit: normalize ließ cape_mu/cin_mu bislang ohne Energieeinheitenprüfung passieren; grib_metadata hatte für beide keine feste Produkt-/Schichtmatrix. Vier reale DWD-Header des Laufs2026-10-10T15:00 bei+0/+1h kalibrieren J kg-1, discipline0/category7/number6 bzw7, FirstFixedSurface193/0 (MU), Second255, instant. OPTIONAL_MU_CONTRACTS werden separat von den unveränderten Kernverträgen geführt und im Source-Manifest ausgewiesen; gleiche native Grid-/UTC-Bounds-Gates. CIN-Betragsnormalisierung, Missing, Wire-Layout und ML-/MU-Cadence bleiben unverändert. Pflicht-Negativfixtures prüfen unbekannte/falsche Einheiten, ML-/MU-Verwechslung, Parameter/Processing und echte Header-Evidenz. Keine Werte-/vollständige optionale Produkt-/E2E-Abnahme daraus behaupten.

Source-Gate38067280500 des ersten offenen PR#325 scheiterte allein an C21-Browserfixture ohne neuen minutes15-Prop; alle fünf Heavy-Gates und Unit-Pilot erfolgreich. Fixture reicht jetzt eine explizit leere kanonische Minutenreihe für ihren bestehenden trockenen Stundenfall;28 Fälle lokal erfolgreich. Keine Timeout-/Budgetlockerung. Neue Head-Prüfung und regulärer Installer sind weiterhin für Veröffentlichung erforderlich.

Basis main=mid-stable b88efe2f3ba580aad5a0e692037f2c9814f69547 (.229), Source-Gate38059167998 und Installer38059674163 einschließlich Worker/Pages/Stable erfolgreich. Keine überlappende offene Source-PR. Aktuelles verlor leichte kurze Regenphasen, weil ausschließlich die endgestempelte Stundenreihe unmittelbar als vorwärts gerichtete Skybar verwendet wurde. Current erhält jetzt die finalisierten displayMinutes15 und denselben shortTermAnchor wie Heute. Derselbe buildShortTermForecast-/shortTermProfileHourlyPoints-Pfad liefert Niederschlag und Bewölkung für Band und Stundenquadrate, ohne Radar doppelt einzurechnen.

Der gemeinsame detailSkyBarTimedSegments-Renderer verortet explizite Intervallgrenzen auf der echten Epoch-Achse. Intensität bleibt aus der ursprünglichen Menge und Dauer berechnet, nur Randgeometrie wird beschnitten; fehlende Intervalle werden nicht überbrückt. Temperaturreihe und +12h-Differenz bleiben volle Stunden. Regression reproduziert positive 0,06mm bei trockener grober Reihe und prüft Aktuelles/Heute-Parität, Clipping, Lücken, Squares und Missing. Echte Komponenten werden in 48 Browserkombinationen geprüft. Der Gesamtaudit bleibt mit den unter .229 dokumentierten Einschränkungen offen.

# MID v0.9.85.229 · UTCI, 14d-Entwicklung und reale Werte-Referenz

Basis main=mid-stable ada0f6c54a7ed1faf56d4d202d8a897abf567157 (.228), Source-Gate38050995420 und Installer38051448345 erfolgreich; keine überlappende Source-PR. UTCI wird aus dem bestehenden kanonischen aktuellen Wert prominenter dargestellt, ohne Formel-/Einheitenänderung. Die14d-Entwicklung bündelt kompakte Wetterphasen und verbundene Tmax/Tmin-Tageswerte mit unveränderten echten Ensemblequantilen. Verbindung nur opt-in im gemeinsamen Renderer und nur bei vollständigen aufeinanderfolgenden UTC-Daten; periodische Produkte bleiben diskret.

Reale Werte-Referenz: DWD2026-10-10T09:00,66 Dateien mit zwölf Kernparametern, CLAT/CLON und20EPS-Mitgliedern bei+0/+1h. Vollständiges native Gitter542040 wurde dekodiert und vor Packing geprüft; Niederschlagskonservation maximal0mm Abweichung. 35 exakt dekodierte Zellvektoren, URLs/Hashes, Coverage und Wire-Goldens archiviert. derive_core_fields ist die unveränderte aus main extrahierte Produktionsrechnung und wird für Replay wiederverwendet. Offline-Goldens prüfen Einheiten, physikalische QC, Missing-Bitwerte und Packingfehler, keine neuen Warnschwellen. Roh-GRIBs sind nicht archiviert; Hashes ersetzen keine vollständige Rohdaten-Reproduzierbarkeit. Weiter offen: volle14h-/Rapid-/optionale Produkt-/Lookup-/E2E-Referenz, Leakage-freie Verifikation, Regridding/Nähte, Langzeit-SLOs und reale Geräte-/Kontoevidenz.

# MID v0.9.85.228 · kalibrierte Kern-GRIB- und Gitterverträge

Verifizierte Basis main=mid-stable bc7c73a818714420474b688b48b7ef3fdf2893b1 (.227); Source-Gate38047969482 und Installer38048324417 erfolgreich, Pages Versuch1. Keine überlappenden offenen Source-PRs. Kernverträge verwenden discipline/category/number und rohe Fixed-Surface-Codes mit dekodierten skalierten Werten, nicht allein Dateiname/shortName/typeOfLevel. CLCL: Druckfläche100/80000 Pa bis Boden1/0; CAPE_ML/CIN_ML: lokale Mischschicht192/0, kein zweites Level255. Legitime unknown-Anzeigenamen bleiben erlaubt. Alle dekodierten unstrukturierten Felder müssen das kalibrierte Gitter UUID c6b12daa91ad64045b26c1b6452a2a20, Nummer47, Referenz1,542040 Punkte verwenden. DWD-Gitterrevisionen erfordern explizite Neukalibrierung; gleiche Zellzahl ist kein Identitätsnachweis.

Kern-Zeitvertrag trennt UTC-Initialisierung, Vorlauf, Gültigkeit und Bounds: instant start=end; TOT_PREC accum start0; VMAX_10M max über vorangegangene native Stunde, Nullfenster am Laufstart. init+lead=valid zwingend. ecCodes-Schritte numerisch oder mit m/h/s-Suffix werden gemäß deklarierter Einheit in ganze Sekunden überführt; unbekannte/kontradiktorische Einheiten und ungültige Bounds brechen ab. Produktions-EPS erwartet explizit IDs1..20; ein über alle Termine fehlendes Mitglied darf nicht aus der beobachteten Vereinigungsmenge verschwinden. sourceGribContract in latest.json dokumentiert Quellsemantik und erwartete IDs getrennt von den unveränderten gepackten Niederschlags-Intervallmengen. Bitlayouts, Missing-Werte, Warnschwellen und Freigabegates bleiben unverändert.

Echte ecCodes-Negativfixtures prüfen falsche Parameter/Schichten/Processing, UUID-/Referenzwechsel bei gleicher Zellzahl, Dateinamenverwechslung, UTC/DST-Tag, Sub-hourly und Metadaten-Persistenz. DWD-Laufkennungen ohne Offset werden explizit UTC gelesen, nicht als Host-Lokalzeit; Subprozess mit TZ Europe/Berlin prüft den früheren Versatz. Read-only scientific_grib_contract_probe prüfte vollständig584 native Dateien des Laufs2026-10-10T06:00: zwölf Kernparameter +0..14h, CLAT/CLON, benötigte 5-/15-Minuten-Termine +0..6h und EPS1..20 +0..14h. URL/Hash/Member/Bounds/Grid archiviert; Einheiten aller584 Header separat gegen Produktionsnormalisierung geprüft. Lokal47 GRIB-/Integritäts- und3 Temperaturtests,955 App-Regressionen,14 Browserfälle, Build/Types/Syntax und Produktionsaudit0 Vulnerabilities erfolgreich. Ablagefehler einer neuen Release-Notiz durch Verschieben unter docs korrigiert; Hygiene-Regel unverändert. Keine Werte-/QC-/Packing-/E2E-/Skill-Score-Abnahme daraus behaupten. Weiter offen: feste optionale Produkt-/Levelverträge, kompletter reproduzierbarer Werte-Referenzlauf, Leakage-freie Verifikation, Regridding/Nähte, langfristige SLOs und echte Geräte-/Kontoevidenz.

# MID v0.9.85.227 · wissenschaftlicher Audit: deklarierte Kern- und Koordinateneinheiten

Verifizierte Basis main=mid-stable 6c7d493c65cf1046fc1a5ed2f89bf10b0ea3ffca (.226), Source-Gate38031626313 und Installer38032074847 erfolgreich. Gesicherte Header-Evidenz aus codex/v0.9.85.227-audit-header-evidence unverändert übernommen; keine überlappenden offenen Quell-PRs. Die Größenheuristik für CLAT/CLON wird durch deklarierte Einheiten ersetzt: Degree N/Degree E beziehungsweise degrees_north/degrees_east, oder explizite Radiant-Einheiten. Kleine Gradwerte bleiben Grad; vertauschte Richtungs-/unbekannte Einheiten brechen vor Lookup ab. Geographische Bounds und Endlichkeitsprüfungen bleiben verbindlich.

normalize prüft nun auch u10/v10/wind_gusts_10m auf m/s, cape/convective_inhibition auf J/kg und precipitation_acc auf kg/m² beziehungsweise äquivalente mm Wassersäule. Keine Rate-/Energie-/Windgrößenumdeutung anhand von Werten, keine neuen Warnschwellen, keine Missing-Auffüllung. Native ecCodes-Einheiten sind durch archivierte Header-Stichproben dokumentiert. Verpflichtende Python-Fixtures prüfen gültige Einheiten, trockene Null/Missing, unbekannte/falsche Einheiten, kleine Koordinaten und unveränderte Inputs. read_first_values bleibt für bestehende Verbraucher kompatibel.

Dieses Paket ist bewusst eine begrenzte Einheitenkorrektur, kein vollständiger GRIB-Produktvertrag: feste Parameter-/Raw-Levelmatrix, Bounds/Lead-Zeitsemantik und gemeinsame UUID-Prüfung aller Daten-/Koordinaten-/EPS-Felder bleiben offen. Ebenso vollständiger realer DWD-Referenzlauf, Verifikation/Leakage/Regridding, historische SLOs und Geräte-/Kontoevidenz. Bestehende Source-/Release-Gates unverändert; Veröffentlichung ausschließlich über die bestehende Bot-/Installer-Kette.

# MID v0.9.85.226 · wissenschaftlicher Audit, erstes Umsetzungspaket

Ausgangspunkt main=mid-stable 391ed9334c0335fb9678884f6b67354e53d24dc3 (.224). PR #319 (.225) hatte nach unveränderter Chromium-CDP-Wiederholung grünes Source-Gate und wurde vom Release-Bot zusammengeführt. main 075e0b39fa651b5da8dc7c687b8790d7cd876912 ist der serverseitige Paketcommit; Stable-Promotion war während .226-Vorbereitung wegen Installer-Browserprüfung noch nicht erfolgt. .226 integriert diesen exakt verifizierten main-Stand verlustfrei auf dem aus .224 entstandenen Arbeitsbranch; keine .225-Änderung wird rückgenommen und kein Stable manuell verändert.

Bestätigter P0-Befund: nansum wertet fehlende RUC-Niederschläge in Extremwetter-Aggregaten als 0; fehlende EPS-Mitgliedsperioden werden trocken gezählt. .226 propagiert Missing in vollständigen Periodensummen, rollierenden Fenstern, EPS-Wahrscheinlichkeiten/Quantilen, Phasen- und Kompatibilitätsfeldern. Bestehende Wetter-/Warnschwellen bleiben bestehen. Negativfälle prüfen all-missing, partielle Mitgliedsperioden, echtes trockenes Null und Input-Unveränderlichkeit.

Update-Browsergate auf .224 lokal reproduziert: CSS min-height44 wurde während der Transform-Einblendanimation als43.99999237060547 gemessen. Test wartet jetzt das Animationsende ab und behält die strikte44px-Mindestgröße;14 Browserfälle (7 Viewports×2 Themes) bestanden. Kein Testbudget gelockert.

Inventar/Referenzbaseline erfasst Quell-SHA, Worktree, Hashes der Verträge/Dependencies, Python-Pakete, native ecCodes-API, NumPy/BLAS-Build und Threadkonfiguration. Synthetische Kern-/Missing-/Mitglieds-/Integrationsfixture besitzt festen semantischen Hash. Laufzeit/CPU/RSS separat, unbekannte I/O-Zähler null. Kein vollständiger DWD-Referenzlauf oder CF-/Grid-/Leakage-/Kalibrierungs-/Geräteabschluss behauptet. Details und geordnete Folgearbeiten in docs/implementation/MID_SCIENTIFIC_AUDIT_BASELINE_2026-10-10.md. Weitere P0/P1-Anwendbarkeitsprüfungen, numerische Cross-Model-/Reprojektionsnähte, echte VoiceOver/WKWebView-Abnahme, langfristige SLO-/Alarmierung und Cloudflare-Kontoevidenz bleiben offen.

# MID v0.9.85.225 · MID-C26: Metadaten statt Werteheuristik

Basis main=mid-stable391ed9334c0335fb9678884f6b67354e53d24dc3 (.224), Installer38026620448 erfolgreich. .225 ersetzt normalize-Heuristiken für Temperatur/Druck/Bewölkung/relative Feuchte durch explizite Einheiten. Die frühere max<=1.2-Regel konnte 1 Prozent zu100 Prozent machen; Medianregeln konnten Ausreißer als Einheitenwechsel umdeuten. Explizite K/C, Pa/hPa und Prozent/Bruchteile; unbekannte Einheiten brechen fail-closed ab. Native Missing-Zellen bleiben unverändert. Gleiche physikalische Felder in verschiedenen Einheiten werden numerisch verglichen; Ausreißer bleiben für die bestehenden physikalischen Gates sichtbar.

Acht reale DWD-GRIB-Header am10.10.2026 gelesen und als docs/implementation/MID_C26_RUC_HEADER_SAMPLES_2026-10-10.json mit URL/Hash archiviert: T_2M/TD_2M K, PMSL Pa, RELHUM/CLCT/CLCL Prozent. Samples stammen aus einzelnen live verfügbaren Dateien, nicht aus einem vollständig dekodierten gemeinsamen Lauf; kein vollständiger Produkt-/Level-Vertrag daraus behauptet. CAPE_ML/CIN_ML-Metadaten ebenfalls archiviert.

Der Gesamt-Intensivaudit ist noch nicht abgeschlossen: feste vollständige Parameter-/Levelverträge, Cross-Model-/Reprojektion-/Tile-Nähte, echte Geräteperformance und VoiceOver/WKWebView/macOS, kalibrierte Missing-Grenzen und historische SLO-Auswertung/Alarmierung erfordern weitere Umsetzung/Evidenz. Kein Zugriff auf reale Geräte/macOS in dieser Umgebung. Cloudflare am10.10.2026 erneut direkt geöffnet: normales Anmeldeformular, früherer Verifikationsfehler derzeit nicht sichtbar; Konto-/Cron-Abnahme benötigt sichere Anmeldung. Aktueller Code und CI allein schließen diese Abnahmen nicht.

# MID v0.9.85.224 · MID-C26: vollständiger Kernparametervertrag

Basis main=mid-stable 4c875804953290fdf048b93c72b716c6781064d4 (.223), Installer37991713944 erfolgreich einschließlich Core/Heavy, Pages und Stable. Live-Version am10.10.2026 bestätigt. RUC38022529847 veröffentlichte tatsächlich run03:00; Publish114130462693 bestätigt Pages/Worker, LiveHealth04:56 UTC ready/fresh/schemaValid. Kanonische Standortprobe50.815/7.04 nutzt je13 RUC-/RUC-EPS-Stunden und20 Mitglieder.

Auditbefund: validate_core_fields forderte zehn der zwölf Builder-Kernfelder, pressure_msl und convective_inhibition fehlten im Pflicht-/Wertevertrag. .224 ergänzt beide und verlangt eindeutige EPS-Mitgliedskennungen. Druck in normalisierten hPa muss positiv sein; CIN nach Betrag-Normalisierung nicht negativ (0.01 Rundungstoleranz). Keine neue Missing-Quote oder erfundene obere physikalische Grenze. Tests entfernen jeden einzelnen Pflichtparameter; bestehende Dimensions-/Missing-Fixtures erhalten realistischen Druck statt bislang ungeprüfter Null.

Weiter offen bleiben feste echte GRIB-Produktverträge, numerische Cross-Model-/Einheiten-/Reprojektions-/Tile-Nähte, Geräteperformance, VoiceOver/WKWebView, dauerhafte SLO-Auswertung und Alarmierung sowie direkter Cloudflare-Kontonachweis.

# MID v0.9.85.223 · MID-C26: automatische Updates und eindeutige Wirkung

Verifizierte Basis main=mid-stable 5c52d4fc1ca3c32b9c9abd4acd6ebaf23780e4a1 (.222). Source-Gate37987384825 und Release-Bot37988004602 erfolgreich; Installer37988046040 vollständig erfolgreich einschließlich Core, fünf Heavy-Gates, Worker, Pages im ersten Versuch und Stable-Finalisierung. .221 wurde zuvor durch Installer37985757652 veröffentlicht. Alte Replit-Arbeitsfläche .195 bleibt unprivilegierter UI-Workbench-Stand, keine Veröffentlichung daraus.

Der Screenshot zeigte widersprüchliche Bereitschaft („vollständig vorbereitet“ trotz fehlender Dateien) und einen unbegrenzt deaktivierten Rückfallknopf. Codebefunde: Die Rückfall-Aktion wartete ohne Timeout auf ready/MessageChannel; der normale Knopf suchte trotz bereits neuem Controller und altem Rückfallcache nur nach einem weiteren wartenden Worker. Die automatische PWA-Aktivierung ignorierte die gespeicherte Automatik-Auswahl. Kein Beweis, welcher Einzelfehler die konkrete iOS-Sitzung ausgelöst hat.

.223 korrigiert diese Pfade: klar benannte Download-/Aktivierungsaktion, versionierter ausstehender Zustand und konkrete Fehler, expliziter Neustart des bereits geprüften neuen Caches, Navigation unter bereits bestätigtem neuen Controller, zehn Sekunden begrenzte Rückfallantwort, spätes Reply ohne Navigation, deduplizierte Versuche, Online-Recheck und sichtbares Ende des Retry-Budgets. Die Automatik-Auswahl gilt für PWA-Aktivierung und startet beim Einschalten den aktuellen Versuch. Sitzungsausblenden verhindert weitere automatische Versuche dieser Version. HTML-Metaversion, descriptor und Worker müssen übereinstimmen; aktuelle Caches ohne Gültigkeitsmarker und Aktivierung eines anders versionierten Workers werden abgewiesen. Parallele Downloader schließen vor dem Löschen eines fehlgeschlagenen Caches ab.

Touchflächen mindestens44px, Umbruch und zugeordnete Statusbeschreibung sind in einer eigenen C26-CSS-Schicht enthalten. Die geschützte .169-CSS-Kaskade bleibt unverändert; der CSS-Test erlaubt ausdrücklich die neue geprüfte Ergänzung. Der alte Wartungstest verlangte die sofortige Entfernung des Rückfallbalkens und einen Variablennamen; er prüft jetzt bestätigten Erfolg/Navigation und verspätungsfesten Abschluss. Kein Release-, Meteo- oder Performancebudget gelockert.

Lokale Fehlerfalltests führen die echten Rückfall-/Reload-/Cache-/Message-Funktionen aus: fehlender Controller, Sendefehler, verlorene/abgelehnte/späte Antworten, erfolgreicher Neustart, bereits aktiver neuer Controller, alter Controller, verworfener Cachewechsel, stale HTML/Versionsdatei, fehlender Marker und falsch adressierte Aktivierungs-Version. Finaler .223-Produktionsbuild/Types und alle955 lokalen App-Regressionen erfolgreich;31 echte ecCodes-/GRIB-Tests, Worker-/Service-Worker-Syntax und Produktionsaudit mit0 Vulnerabilities bestanden. Ein erster finaler Prüflauf endete ohne Abschlussbericht; vollständige Wiederholung mit laufender Prozesskontrolle bestätigt exit0. Reguläres Source-/Installer-Gate bleibt erforderlich. Neue Pflicht-Browsermatrix:320/390/412/844/834/1024/1440px jeweils light/dark mit Klickwirkung, ausstehendem Status, Mindest-Touchfläche, Umbruch, Seitenbreite und Sitzungsausblenden. Lokal Browserdownload möglich, Browserstart durch socket()-Umgebungsregel blockiert; deshalb keine lokale Browser- oder Geräteabnahme behaupten. CI führt diese Matrix verbindlich aus.

Fortsetzungsgrenzen des Intensivaudits: .222 misst native Missing-Zellen pro Parameter/Termin/Mitglied, setzt keine erfundene prozentuale Grenze. Archivierte feste produktbezogene GRIB-Metadatenmatrix, kalibrierte optionale Produktquoten, numerische Cross-Model-/Einheiten-/Reprojektions-/Rasternahtprüfungen, reale Geräteperformance und VoiceOver/WKWebView bleiben offen. RUC-Health am2026-10-09T20:35:14Z: run18:00, ready/fresh/schemaValid,542040 Punkte,15 Termine,20 EPS-Mitglieder; dies ist keine Aussage über spätere Aktualität. Längerfristige SLO-Aggregate/Alarmierung und gemeinsame Build-/Daten-/Render-IDs bleiben offen. Direkte Cloudflare-Konto-/Cron-Abnahme blockiert durch Login-Verifikationsfehler. Ausgeführte GitHub-prepare-Logs113938814905/113978381400 belegen cloudflare-watchdog-Dispatches, ersetzen die Kontoabnahme nicht. MID-C26 behält diese offenen Nachweise ausdrücklich als Fortsetzungsauftrag bei.

# MID v0.9.85.222 · MID-C26: differenzierte native Missing-Data-Diagnostik

Verifizierte Integrationsbasis main=mid-stable 270287e8858a2f26cd1ad02968b868baf49b7e08 (.221), Installer 37985757652 erfolgreich inklusive aller Core/Heavy/iOS-Webasset-Prüfungen, Pages im ersten Versuch und Stable-Finalisierung. Source-Gate .221 hatte zuvor einen Bergwetter-Close-Timeout; gezielte Wiederholung bestand unverändert. Keine Budgetlockerung. .222 wurde zunächst isoliert auf verifiziertem .220 vorbereitet, lokal SHA-gesichert und danach verlustfrei auf den veröffentlichten .221-Stand übertragen. .221-RUC-Metriken und Watchdog-Nachweise bleiben erhalten.

meteo_integrity verwendet die bereits berechneten Endlichkeitsmasken für Quoten je Kernparameter/Termin und EPS-Mitglied/Termin. persistentMissingCount beobachtet durchgehend fehlende Zellen; additionalMissingCount benennt zusätzliche Ausfälle. Keine Bitmap-Ursache aus Persistenz erraten, keine Werte auffüllen und keine Prozent-Freigabegrenze erfinden. Native Indexierung und trockene Nullwerte bleiben erhalten. EPS mit leerer Zeitachse wird ausdrücklich durch den Dimensionsvertrag abgewiesen. Builder schreibt schema mid.ruc.missing.v1 und UTC validTimes in vorhandene Joblogs nach erfolgreichen Gates, vor Packing/Aggregation. EPS-Messung betrifft Akkumulation, Kern-Niederschlag betrifft Intervalle. Quoten für optionale Rapid-/Spezialistfelder, kalibrierte Grenzwerte und Archivierung bleiben offen.

Neue verpflichtende ecCodes-Tests prüfen persistent/zusätzlich fehlende Zellen, exakte Bruchteile, trockene Nullen, Inf, echte Member-IDs, JSON-Roundtrip und Builder-Log mit UTC-Terminbindung, unveränderte Inputs sowie leere Dimensionen. Vollraster-Fixture: 542040 Zellen, 16968 dauerhafte fehlende Randzellen, korrekte Quote ohne zusätzliche Missing-Zellen. Lokale Abnahme: 31 echte ecCodes/RUC-Tests, 3 Temperaturdiagnosen, Scheduler-Metriktests, isoliertes npm ci, Produktionsbuild/Types, Worker-Syntax und alle 954 App-Regressionen erfolgreich; Produktionsaudit ohne Vulnerabilities. Chromium ist lokal nicht vorhanden; reale Browsermatrizen bleiben deshalb verpflichtend im Source-/Release-Gate und werden nicht als lokale Geräteabnahme ausgegeben. Kein Testbudget oder Sicherheitsgate wird gelockert.

Cloudflare-Dashboard am 09.10.2026 erneut direkt geprüft: login-Verifikationsfehler und deaktivierte Anmeldung bleiben nach einmaligem Reload bestehen. Konto-Deployment-ID/Cron dadurch nicht direkt abgenommen; GitHub-Dispatchnachweise aus .221 bleiben als separate Evidenz gültig. Keine Secrets, Anmeldung, Credentials oder Schutzregeln geändert. RUC37985156293 wurde erfolgreich aufbereitet, sein Publish wegen .220→.221-Übergang korrekt übersprungen; Erfolg des Workflows allein ist kein Nachweis eines neuen produktiven RUC-Laufs.

Weiter offen: feste echte produktspezifische GRIB-Header-/Parameterverträge, kalibrierte Missing-Freigabequoten, numerische Cross-Model-/Einheiten-/Reprojektions-/Tile-Nähte, Geräteperformance, VoiceOver und echte WKWebView/macOS-Abnahme, dauerhafte SLO-Auswertung/Alarmierung und Build-/Data-/Render-Korrelation. Keine vollständige Audit-Erledigung behaupten. Veröffentlichung ausschließlich Source-PR-Gate → bestehender SHA-gebundener Release-Bot → serverseitiges ZIP → Installer → Worker/Pages → Stable-Promotion.

# MID v0.9.85.221 · MID-C25: RUC-Aktualitätsdiagnostik und Watchdog-Nachweis

Basis main=mid-stable 42dbffde19d546eb847207409c746283e6f6c349 (.220), Installer 37978521219 vollständig erfolgreich inklusive Pages im ersten Versuch und Stable-Finalisierung. Cloudflare-Watchdog-README mit inactive-Label war veraltet: echte ausgeführte GitHub-prepare-Ausgabe nennt cloudflare-watchdog bei RUC37965530049/Job113938814905 (17:20:20 UTC) und RUC37977200345/Job113978381400 (19:00:20 UTC). Dies belegt akzeptierte externe Recovery-Dispatches; keine direkte Cloudflare-Konto-/Deployment-ID-/Cron-Abfrage, keine Aktivierung/Secrets geändert. Früheres inactive-Label nicht als Kontowahrheit weiterführen.

check_ruc_schedule_guard ergänzt mid.ruc.freshness.v1: UTC observedAt, gemeinsam angekündigter dwdRun, publishedRun, pagesMetaValid, unveränderte shouldRun/reason sowie upstreamRunAgeMinutes, publishedRunAgeMinutes und availabilityLagMinutes. Fehlende/ungültige Metriken sind null; negative Werte bleiben als Zeitstempel-/Listing-Anomalie sichtbar. JSON erscheint im bestehenden stdout, GITHUB_STEP_SUMMARY und zusätzlichem GITHUB_OUTPUT freshness_metrics. Keine neue Warn-/SLO-Grenze, keine Entscheidungsschwelle, kein zusätzlicher Netzabruf oder Scheduler. Der DWD-Verzeichnisabgleich ist keine Zusage fertig dekodierter Daten. availabilityLagMinutes ist Initialisierungszeit-Differenz, keine gemessene Discovery→Publish-Latenz.

Pflicht-Scheduler-Tests prüfen getrennte Metriken, echten Nullrückstand, unbekannten Upstream, ungültige Pages-Meta/Kalenderdaten, negative Werte, Zeitzonenidentität und JSON-Roundtrip über stdout/Summary/Output. Bestehender Node-Wrapper bindet sie im normalen Regression-Gate ein. Weitere SLO-Aggregate/Alarmierung, universelle Build-/Data-/Render-Korrelation, feste Parameter-/Member-Verträge, Missing-Quoten, numerische Nähte/Cross-Model und reale Hardware-/VoiceOver-/WKWebView-Abnahme bleiben offen.

RUC-Catch-up auf .220 vor neuem Source-PR abgeschlossen: Workflow37979807681 mit prepare113987136219 und publish113992506618 vollständig erfolgreich. Produktive Health bestätigt ready/fresh/schemaValid und Lauf2026-10-09T18:00; Standort50.815/7.04 bestätigt je13 RUC-/RUC-EPS-Stunden und20 EPS-Mitglieder. Worker meldet eigene Version.195; keine Gleichheit mit App.220 behaupten. Direkte Cloudflare-Kontoabnahme bleibt offen: Dashboard führt zur Anmeldung mit Verifikationsfehler; keine Credentials eingegeben oder Sicherheitsprüfung umgangen.

Lokale Abnahme: isoliertes npm ci, Produktionsbuild/Types, npm audit --omit=dev ohne Vulnerabilities, Worker-Syntax, direkte Scheduler-Metriktests,29 echte ecCodes/RUC-Tests und alle954 App-Regressionen bestanden. Erster App-Lauf zählte im übernommenen dist alte/neue Hauptbundles doppelt; Ausgaben gesichert und sauberer Build plus vollständige Suite danach erfolgreich. Keine Budgetlockerung. System-Python fehlte requests; RUC-Prüfung anschließend in vorhandener isolierter ecCodes-Umgebung erfolgreich.

# MID v0.9.85.220 · MID-C25: RUC-Snapshot-Transport

Basis main=mid-stable c620e672b330f4f35e2d43f7451e27f7773bdb2a (.219). Installer 37974045646: Source-/Release-Core und alle Heavy-Gates erfolgreich; Snapshot-Vorbereitung scheiterte an http.client.IncompleteRead beim CDN-Download, zweiter regulärer Pages-Versuch und Stable-Finalisierung erfolgreich. Einzelner vorbereitender Job war fehlgeschlagen; keine Behauptung eines fehlerfreien Gesamtlaufs.

restore_ruc_pages_snapshot.fetch wiederholt jetzt auch IncompleteRead innerhalb des bisherigen endlichen Retry-/Backoff-Vertrags. Neue Anfrage liest das Objekt von Anfang an; Teilbytes werden nie verkettet oder akzeptiert. Größe/SHA, Objektpfadvertrag, Workerlimit 8, atomare Ersetzung, 404-/andere HTTP-Gates bleiben unverändert. Tests reproduzieren Read-Abbruch im Response-Kontext, Recovery, endliche Erschöpfung, persistente Fehler mit Erhalt des bestehenden Snapshots, Tmp-Cleanup sowie nicht wiederholte Größen-/SHA-Fehler. Dies verbessert REL-001/Observability-Betrieb, ist kein neuer Scheduler oder meteorologischer Fallback. Lokale Abnahme: direkte Transport-/Atomaritäts-/SHA-Negativtests, bestehende Restore-Regression, 29 ecCodes/RUC-Tests, Scheduler-Guard-Tests, isoliertes npm ci, Produktionsbuild/Types, Produktionsaudit ohne Vulnerabilities und alle 954 App-Regressionen. Erster App-Lauf meldete doppelte alte/neue Hauptbundles im lokalen dist; alte Ausgaben gesichert, sauberer Build und vollständige Suite danach grün. Keine Budgetlockerung.

Aktualitätsmechanismus: Primärslots :11/:41, GitHub-Watchdog :23/:53, neuester gemeinsamer DWD-/Pages-Laufvergleich, aktive Läufe nicht abbrechen, Datenpublikation unter gemeinsamer Pages-Sperre. Externer Cloudflare-Watchdog ist im README ausdrücklich source-prepared/inactive; keine Aktivierung oder neues Credential in diesem Paket. Harte maximale Aktualitätsgarantie ist wegen DWD-Verfügbarkeit/GitHub-best-effort-Timern nicht möglich. SLO-Messung soll Run-Alter und Discovery→Publish-Latenz unterscheiden. Weitere feste Header-/Mitgliederverträge, Missing-Quoten, numerische Nähte/Cross-Model, Geräteperformance, VoiceOver, WKWebView und langfristige SLOs bleiben offen.

# MID v0.9.85.219 · MID-C25: EPS-Mitgliederabdeckung

Basis main=mid-stable e4951e420b21f96a308a9f309b79728780ae676c (.218), Installer 37970763374 erfolgreich inklusive Worker/Pages/Stable. Der bisherige EPS-Sammler konnte teilweise vorhandene Mitglieder über eine Schnittmenge still entfernen. Ein vollständig leerer Mitgliedstermin bestand die globale Endlichkeitsprüfung, solange andere Mitglieder Werte enthielten. Kein Nachweis eines tatsächlich fehlerhaft publizierten Laufs.

collect_eps verlangt jetzt dieselben tatsächlich gelieferten Mitglieds-IDs an jedem Zieltermin. validate_eps_member_coverage prüft mindestens eine endliche native Zelle je Termin und Mitglied vor Akkumulationsprüfung und Aggregation. Diagnosen nennen echte Mitglieds-IDs und maximal 24 Termin/Mitglied-Paare. Unveränderte Mindestzahl 10; keine neue feste 20-Mitglieder-Zusage, kein Erraten völlig fehlender IDs, keine prozentuale Missing-Data-Quote, keine neue Warnschwelle, kein Auffüllen. Partielle authentische Masken und trockene Nullen bleiben gültig.

Neue verpflichtende Python-Tests prüfen unveränderte maskierte Inputs, jeden leeren Mitgliedstermin, Dimensionsfehler und den echten Sammler mit 20 ungeordneten Mitgliedern: sortierte IDs, identische Intervallwerte, fehlendes Mitglied am ersten/mittleren/letzten Termin sowie leerer Termin blockieren. 29 ecCodes/RUC-Tests, 6 Bitmap-Tests, alle 954 App-Regressionen, isoliertes npm ci, Produktionsbuild/Types, Produktions-Audit ohne Vulnerabilities sowie echte Chromium-Headless-Shell-Bergmatrix (6 Viewports × 2 Themes) lokal bestanden. Weitere Missing-Data-Quoten, feste produktspezifische Header-/Mitgliedsverträge, numerische Nähte/Cross-Model, Geräteperformance, VoiceOver, WKWebView und dauerhafte SLOs bleiben offen. Echter produktiver RUC-Lauf auf neuer Stable-Version bleibt nach Veröffentlichung nachzuweisen.

# MID v0.9.85.218 · MID-C25: RUC-Terminabdeckung und gemeinsame Dimensionen

Basis main=mid-stable fb4b93c01c24b2d6ff2f1c81ed817b97a2f0c8f6 (.217), Installer 37967615851 vollständig erfolgreich inklusive Worker/Pages/Stable. Reproduziert auf dieser Basis: vollständig leere einzelne Wolken-/Akkumulationstermine sowie abweichende Wolkenfeld-Gitter/Zeitdimensionen bestehen das bisherige globale finite.any(). Abweichende Dimensionen wurden bereits später im Packer abgewiesen; sie werden nun früher durch das semantische Gate diagnostiziert. Kein Nachweis eines tatsächlich veröffentlichten dimensionswidrigen Laufs.

meteo_integrity.py prüft nun vor Packing für jeden stündlichen Kernparameter (auch Druck/CIN ohne zusätzliche physikalische Grenzwerte) identische 2D-Zeit/Gitterdimensionen und mindestens eine endliche Zelle je Termin. Akkumulationen prüfen mindestens eine endliche Zelle je Termin über die übrigen Raum-/Memberachsen. Fehler nennen maximal 24 Null-basierte Terminindizes. Keine neue prozentuale Missing-Data-Grenze, kein Auffüllen, keine Neugitterung, keine Einheitenänderung. Authentische maskierte Randzellen, gültige Extreme und trockene Nullen bleiben unverändert. Die bereits berechnete Endlichkeitsmaske wird für die bestehenden Grenzprüfungen wiederverwendet. Bestehende Origin-/GRIB-/Bitmap-/Taupunkt-/Akkumulationsgates bleiben verbindlich.

test_meteo_integrity.py ergänzt jeden Kernparameter inklusive Druck/CIN, getrennte Zeit-/Gitterabweichung, teilweise NaN-Ränder, unveränderte Inputs, trockene 2D-/3D-Akkumulation sowie vollständig fehlenden mittleren Termin. Ein synthetischer 15x542040-Fall mit16968 maskierten Randzellen bleibt gültig; ein vollständig leerer Termin wird abgewiesen. Die Tests sind bereits über test_fetch_resilience.py im verpflichtenden echten ecCodes-Gate enthalten. Lokale Abnahme: 27 ecCodes/RUC-Tests, 3 Temperaturdiagnose-Tests, 6 Bitmap-Tests, alle954 App-Regressionen, isoliertes npm ci, Dependency-Audit ohne HIGH/CRITICAL und Produktionsbuild/Types. Gemeinsamer node_modules-Symlink wurde nach dessen inkonsistentem Auditbefund durch isolierte Installation ersetzt; keine Audit-Ausnahme. Kein Workflow-/Secret-/Ruleset-/UI-/Widget-Umbau. Vollständige Parameter-/Level-Matrix, differenzierte Missing-Data-Quoten, einzelne EPS-Member-Abdeckung, numerische Naht-/Cross-Model-Prüfung, Geräteperformance, VoiceOver, echte WKWebView-Abnahme und dauerhafte SLO-Aggregate bleiben offen. Keine vollständige Audit-Erledigung behaupten.

# MID v0.9.85.217 · MID-C25: zugängliche Kartenwertanzeige

Basis main=mid-stable 77a6336554a2ceb32fdbfa3dc988d4dc7fc8012a (.216). Der gemeinsame ModelMapProbe enthält interaktive Inhalte und verwendet daher den bestehenden AppPortalPopover-Dialog mit Fokusführung, Escape und Fokusrückgabe, nicht die Tooltip-Semantik. Automatische Schließung nach sechs/zehn Sekunden entfällt; bewusstes Schließen, Außenklick und Kontext-/Kartenbewegung bleiben erhalten. Keine Daten-/Zeit-/Einheiten-/Farbänderung. Bestehende Browsermatrix prüft nun Dialog, Lesedauer, Tab/Shift+Tab und Rückkehr zum Auslöser statt des absichtlich aufgehobenen Ablaufvertrags. Keine echte VoiceOver-/WKWebView-Abnahme behauptet.

RUC-Liveprobe 2026-10-09 17:22 UTC: ready/fresh/schemaValid=true, Run 15 UTC, 542040 Punkte, 15 Zeiten, 20 EPS-Mitglieder. Niederkassel forecast-fusion: active=true, rucAppliedHours=13, rucEpsAppliedHours=13, rucEpsMemberCount=20. Health-Worker meldet .195; das ist nicht die Web-/Stable-Version .216 und wird nicht als synchronisierte Buildidentität ausgegeben. Universelle Build-/Daten-/Render-IDs, Daten-/Nahtverträge, produktive Geräteperformance, VoiceOver und echte iOS-Abnahme bleiben offen. Veröffentlichung ausschließlich durch bestehendes Source-Gate/Bot/Installer/Stable-Verfahren.

Lokale Abnahme: npm ci, Produktionsbuild/Types, Produktions-Dependency-Audit ohne HIGH/CRITICAL, alle 954 Regressionen, echte Chromium-Native/WMS/Export/Navigation-Matrix auf fünf Viewports mit Light/Dark sowie 24 echte Skybar-Viewport/Theme/Design-Fälle erfolgreich. Ein erster zusätzlicher Browserlauf öffnete nach Schließen vor der bestehenden requestAnimationFrame-Fokusrückgabe; der Test wartet nun zwei Paint-Zyklen vor dem nächsten Tastaturflow. Vollständige Matrix erneut grün, ohne Abschwächung der Fokus-/Escape-/Cancel-/Missing-Data-Prüfungen. Generierte dist-/native-Webassets gehören nicht in den Source-PR.

# MID v0.9.85.216 · Intensivaudit: Widget-Renderbereitschaft und Erstfehlernachweis

Basis: verifiziertes main=mid-stable 5dbb92411193ffecb17216952ed4e0ce9f7622f5 (.215), Installer 37888419430 erfolgreich. Keine überlappende offene Entwicklungs-PR. Bestehende Skybar-/RUC-/Karten-/Release-Verträge bleiben erhalten.

Der gemeinsame Widget-Paint-Helper wartet auf Fonts, dekodierte nicht-defekte Bilder, zwei Paint-Zyklen und sichtbare verbundene Geometrie. URL-Exporte melden bei Fehlern ausdrücklich error statt ready; auch manuelle PNG-/Clipboard-Exporte verwenden denselben Helper. Veraltete asynchrone Abnahmen werden beim Effect-Cleanup verworfen. Ready-Ereignisse führen Versions- und Zeitbereichsmetadaten mit; der Zeitbereich ist kein behaupteter Modelllauf.

Der CDP-Renderer bewahrt je Ziel den ersten Fehler in einem separaten diagnostics-Unterordner: Screenshot, begrenzte Ladefehler ohne URLs/Headers/Response-Bodies, erwartete öffentliche Version, Stable-SHA, Renderstatus und verfügbarer Datenzeitbereich. Retry/Recovery überschreiben diese Dateien nicht. Terminale App-Fehler brechen sofort ab; fehlende Bereitschaft läuft weiter mit bestehendem Timeout. Das Workflow-Artefakt wird auch nach Renderfehlern gesichert; die Publish-Stufe bleibt fail-closed. Diagnosen werden nicht in das öffentliche 12-PNG-ZIP aufgenommen. Kanonischer Workflow und aktiver Spiegel werden gemeinsam synchronisiert.

Abnahme: Produktionsbuild und Types bestanden; neue Positive-/Negative-Regression einschließlich Font-/Bildfehlern; 24 bestehende App-/Widget-Fälle mit tatsächlichem PNG; weitere 24 URL-/Widget-Fälle mit echtem Bildfehler und Recovery; echter Chromium/CDP-Erstfehler-Screenshot, unveränderte Erstdiagnose über Retry und erfolgreicher PNG-Recovery bestanden. Bestehende iOS-Webasset-/Lifecycle-Gates werden beibehalten. Keine reale Geräte-/WKWebView-Abnahme behauptet.

Die konsolidierte Widget-Golden-Prüfung erhält nur für die bewusst geänderte Widget-Deklaration einen .216-Fingerprint; 116 weitere Deklarationen, CSS-Cascade, gemeinsame Kurve und SVG-Paint-Restore bleiben unverändert geschützt.

Auditpunkt 7 ist damit für Widget-Erstfehler/Ready-Gates weiter umgesetzt; langfristige SLO-Aggregate, universelle Build-/Daten-/Render-IDs, Geräte-/VoiceOver-/WKWebView-Abnahme und weitere Meteorologie-/Performance-Abnahmen aus dem .215-Statusdokument bleiben offen. Keine vollständige Audit-Erledigung behaupten.

# MID v0.9.85.215 · MID-C24: durchgehende Skybar und konkrete Intensivaudit-Abnahme

Gleiche angrenzende Skybar-Darstellungen werden im gemeinsamen SVG-Renderer einmal gezeichnet; Originalintervalle/Titel, Datenlücken und Niederschlags-Paint-Reihenfolge bleiben erhalten. Konkrete offene Auditschritte und Abnahmegrenzen: docs/implementation/MID_C24_SKYBAR_AUDIT_STATUS_0.9.85.215.md. Basis main=mid-stable a4e0031df84d46614b7fc5889f92577236d01680 (.214). Veröffentlichung ausschließlich durch Source-Gate, bestehenden Bot und Installer/Pages/Stable-Promotion.

# MID v0.9.85.214 · Intensivaudit Phase 3b: isolierte Karten-Speicherprobe

Verifizierte Basis main = mid-stable = 19b28d9e28bb05efa6e5e690f5e224566f62c551 (.213), Installer 37882113485 erfolgreich. Paralleländerungen .207–.213 vollständig erhalten. Branch codex/v0.9.85.214-audit-map-memory.

Die bestehende vollständige 24-Fälle-Kartenmatrix bleibt erhalten. Nach ihrem Abschluss läuft im Heavy-Shard 2/3 (oder lokal ohne Shard) ein zusätzlicher, isolierter 390px/Light/Next-Fall. Zwei Warmup-Rundwechsel ICON-EU→ICON-D2 füllen beide geprüften Modellcaches; danach 20 echte Rundwechsel über dieselben sichtbaren Controls. Jeder Wechsel wartet auf den aktuellen Modellstatus ohne Ladezustand sowie genau eine Synoptik-Flächenebene. Dieselbe ursprüngliche MapLibre-Instanz und genau eine Karte bleiben Pflicht. Die zusätzliche Probe ist klar als isolated-memory-cycles gekennzeichnet, damit ihre GC-/Stress-Frametimings nicht als unveränderte Phase-3a-Baseline verglichen werden.

Chrome DevTools Protocol sammelt nach Garbage Collection H0/H5/H10/H15/H20: V8-Isolate used/allocated heap, optional ArrayBuffer/external-string backing storage sowie DOM-Dokumente/Knoten/Listener. Das ist weder gesamter Browser-/GPU-/Worker-Speicher noch ein WKWebView-Profil. Ein synthetischer Trend allein beweist keinen Leak. Ausgabe enthält absolute Proben, Deltas, strictlyIncreasingHeap als rein beschreibenden Befund und p95 der 20 Roundtrip-Laufzeiten. Keine willkürlichen Heap-/FPS-Grenzen, keine Budgetlockerung, keine User-Telemetrie. Defekte/unvollständige Pflichtmessungen oder fehlerhafte Modellwechsel bleiben fatal; fehlende optionale backingStorage-Metrik wird null statt 0.

MID_MAP_TRACE=1 schreibt einen Chromium devtools.timeline/v8/blink.user_timing-Trace ausschließlich während der isolierten Zyklen nach /tmp/mid-map-cycles-390-light-next.json. Der Trace wird auch nach einem Zyklusfehler gestoppt; CDP-Session wird per finally freigegeben. CI-Normalweg erhebt Speicherproben ohne Tracing-Overhead. Schema mid.map.runtime.fixture.v2 nennt die echte package.json-Version statt der bisher fest codierten .210. Raw-JSON bleibt in bestehenden CI-Logs und /tmp; kompakte Speicherwerte ergänzen das Step-Summary. Keine Workflow-/Secret-/Ruleset-Änderungen.

Pflichtregression scripts/test-map-memory-profile-0985214.mjs prüft 2+20 Cycles, fünf GC-Proben in richtiger Reihenfolge, wachsende/fallende Werte, fehlende/kaputte Messungen, Durchreichen von CDP-/Modellfehlern und vollständiges Browser-Wiring. Beide Baseline-Inventare verlustfrei erweitert. Bestehende Core/Heavy/Responsive/iOS/Release-Gates bleiben unverändert.

Parallelstand: RUC-Bitmap-Reparatur .213 freigegeben. Issue #305 bleibt bis zur erfolgreichen neuen echten DWD-RUC/RUC-EPS-/Pages-Freshness-Abnahme offen. Die aktuelle Repo-Synchronität allein beweist keine frischen Wetterdaten. Weitere Auditpakete: Widget-readiness/Erstfehlerdiagnostik, produktfeste GRIB-Level-/shortName-Verträge mit echten Headern, Cross-Model-/Missing-Data-Prüfungen, A11y-Kartenalternative und iOS-Simulator-Lifecycle. SEC-001 aus dem PDF war durch aktive Rulesets bereits widerlegt (.207); Schutz nicht neu/parallel umbauen.

Primärquellen: https://chromedevtools.github.io/devtools-protocol/tot/Runtime/#method-getHeapUsage ; https://chromedevtools.github.io/devtools-protocol/tot/Memory/#method-getDOMCounters ; https://chromedevtools.github.io/devtools-protocol/tot/HeapProfiler/#method-collectGarbage . Freigabe ausschließlich über Source-PR-Gate → MID Agent Source Release → serverseitiges ZIP → Installer → Worker/Pages → SHA-gebundene Stable-Promotion.

# MID v0.9.85.213 – Intensivaudit: DWD-RUC/GRIB2-Bitmap-Reparatur

## Gesicherte GitHub- und Produktivbasis
Verifizierter Ausgangsstand `main = mid-stable = e71171c0d477c0fbef51e17e9c21c399525ec94d`, v0.9.85.212. Vollständig freigegeben über PR #306 und Release-Installer. Neuer Branch: `chatgpt/v0.9.85.213-ruc-bitmap-recovery`. Offener Produktionsblocker #305.

## Ursachennachweis (nicht aus bloßer Vermutung)
Reale GitHub-Action-Protokolle, u.a. Run 37876446456: Pro `T_2M`-Vorhersageschritt genau 542.040 dekodierte Werte, Kelvin, davon 16.968 konstante 9999-K-Einträge (ca. 3,13 %) entlang des ICON-D2-RUC-Gitterrandes. Der bisherige Parser übernimmt ecCodes-`values` vor Prüfung des GRIB2-Section-6-`bitmap` direkt; seine Kelvin-Umrechnung macht daraus 9725,85 °C. Die korrekte Validierung `validate_core_fields` stoppt deshalb fail-closed mit `temperature_2m: decoded values exceed physical/semantic bounds`. Mehrere Stundenläufe nach v0.9.85.212 reproduzieren dieselbe maschinenlesbare Ursache.

## Umsetzung und semantische Grenzen
`tools/ruc/grib_bitmap.py`: Die GRIB2-`bitmapPresent`- und tatsächliche ecCodes-`bitmap`-Maske wird verbindlich angewendet, bevor die Originalwerte interpretiert oder in Einheiten normiert werden. Bitmap-Bit 0 = nicht definiertes Gitterelement (IEEE NaN). Bitmap-Bit 1 = physikalischer Modellwert. **Alle Zellen und ihre Indizes bleiben erhalten; keinerlei Kürzung, Neugitterung oder Maskenraten**. Unbekannte Indicator-Werte, fehlende/anders lange oder mehrwertige Bitmaps führen zu `MeteoIntegrityError`. Bloßer Zahlenwert 9999 ohne authentische Bitmaske darf nicht stillschweigend eliminiert werden. Auf dieselbe Funktion gehen die Kernfelder, optionalen Rapid-/Phasendaten, RUC-EPS-Member und Koordinaten-Grib. Unmaskierte CLAT/CLON bleiben unverändert.

Im bestehenden Wire-Packer werden IEEE NaN als der bereits etablierte Int16-Wert -32768 (oder bei EPS der UInt16-Wert 65535) kodiert. Unmaskierte, real falsche physikalische Werte werden weiterhin abgewiesen. Der bisherige WMO-/DWD-Phasenvertrag, native DWD-Signatur-/Provenienzprüfer, meteorologische Grenzwerte, fehlende Provider-Backups und alle RUC-Wire-Schemas bleiben unverändert.

## Tests und Abnahme
`tools/ruc/test_grib_bitmap.py`: produktive echte Zellanzahl und fehlender Randbereich, Kelvin->°C nur für gültige Zellen, native Grid-Ausrichtung, Wire-NODATA, fehlende/kaputte/mehrwertige Bitmap, kein unerlaubtes Erraten fehlender Daten bei unmaskierten 9999, physikalischer Validator weiterhin fail-closed. Die Tests sind in den verbindlichen Python-Testpfad `tools/ruc/test_fetch_resilience.py` eingebunden. Nach grünem vollständigen Source-Gate/Installer **muss ein echter vollständiger DWD-RUC-/EPS-Job inklusive Pages-Free-Veröffentlichung und Worker-Datenaktualität grün nachgewiesen** werden; vorher Issue #305 nicht schließen und niemals behaupten, die gesamte Produktionspipeline sei wiederhergestellt.

## Audit-Fortsetzung
Offene Schritte: vollständiger RUC-Probelauf samt Maskenquoten/Panel-Freshness; dokumentierte DWD-Parameter-/Level-Matrix; Karten-Timeline-Traces, mehrfache Performance-Proben, mobile Barrierefreiheit, iOS-WKWebView-Simulator. Bestehende Risiken #270 (Audit-Dependencies), #246 (alte einzigartige Branches), #176 (Agent-Broker) und PR #252/#253/#260 unverändert getrennt.

## Referenzen
DWD ICON-Modellbeschreibung https://www.dwd.de/SharedDocs/downloads/DE/modelldokumentationen/nwv/icon_d2/icon_d2_dbbeschr_aktuell.pdf ; DWD ICON-D2-RUC Open Data https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/ ; dokumentierter Bitmap-Befund mit 16968 Randzellen https://github.com/KnownStormChaser/master-weather-model-list/blob/main/models/nwp_models/regional/germany/icon-d2-ruc.md .


# MID v0.9.85.212 · Intensivaudit: Karten-Themekontrast und RUC-Provenienz

Source-of-truth-Basis: main = mid-stable 055a6ead7b76b68751079935f1994fc8984bf534 (v0.9.85.211); ausschließlich chatgpt/v0.9.85.212-dark-map-ruc-audit für den Source-PR.

## I. Dark Mode, Accessibility, mobile Darstellung

Screenshotbefund: Die direkte Karten-Terminsteuerung in RadarPanel.tsx besitzt in UnifiedWeatherMap.css die Regel background:var(--card,#fff). --card ist nicht kanonisch definiert und der weiße Fallback produziert unter dunklem Theme ein kontrastarmes, sehr helles Formular mit nahezu unsichtbarer Schrift. Appweite native MID-Farbvariablen --surface, --text und --border statt nicht definiertem --card oder hartem Weiß; korrekter nativer color-scheme und Option-Hintergrund, sichtbarer Tastaturfokus, 44px Ziele, mobil <=430px Aufteilung des zusätzlichen Aktuell-Buttons auf volle Zeile. Keine JS-Zeit-/Radar-/Datenänderung.

Tests: scripts/test-map-direct-time-theme-0985212.mjs schützt CSS/Fokus/Touch-/Theme-Vertrag als Core-Regression. Die bestehende echte Chromium-/MapLibre-Matrix scripts/verify-unified-map-browser-0985167.mjs prüft für alle dort verfügbaren Viewport-/Light-/Dark-/Designkombinationen Hintergrundhelligkeit und WCAG-AA-Textkontrast >=4,5 der aktivierten Bedienelemente sowie bereits vorhandene 44px und Overflow-Prüfungen. Browserwerte stammen aus synthetischer kontrollierter Kartenfixture, nicht aus Telemetrie realer Nutzender.

## II. RUC-Integrität: ISSUE #305, bewusst offen

Lauf https://github.com/MeteoMartini/MID/actions/runs/37853501210 scheitert in prepare weiterhin an unplausibel dekodiertem T_2M; Fail-Closed-Meteorologie-Gate bleibt unverändert. Bis zur nachgewiesenen Ursache darf kein ungeprüfter Fallback in die produktive RUC-Veröffentlichung einfließen. tools/ruc/build_ruc_bundle.py protokolliert nur bei Validierungsfehlern begrenzte per-Lead-Provenienz: GRIB-Dateiname, UTC-Valid-Time, Einheiten, Anzahl und Zahl nicht endlicher Zellen, Minimum/Maximum nativer und normierter Werte, Anzahl außerhalb des bestehenden °C-Sanity-Bereichs. Kein Rohfeld, kein Geheimnis, kein vollständiges GRID-Logging; Validator wird weder abgeschwächt noch abgefangen, sondern Fehler bleiben fatal. tools/ruc/test_temperature_decode_audit.py prüft Kelvin->C, C unverändert, NaN/Sentinel-Aggregat und fortdauernde Fehler bei physikalisch ungültigen Temperaturen. Der nächste echte DWD-Preprocessing-Run muss erst Ursache (Encoding, Bitmap/Missing, Unit) belegen. Anschließend separate validierte Korrektur, erneuter vollständiger RUC-Run und Pages-Snapshot. Issue NICHT abschließen ohne Produktivbeleg.

## III. GitHub offene Arbeit geprüft, nicht überstürzt gelöscht oder gemergt

- #305 offen: blockierter DWD-RUC-Produktivlauf; .212 liefert Diagnostik, keine Ursachenbehauptung, keine Gate-Umgehung.
- #270 offen: nächtliche Revision Audit failure; Beispiel https://github.com/MeteoMartini/MID/actions/runs/37764900622 bestätigt npm-audit-Befunde uuid@7.0.3 sowie source-map-js@1.2.1. Auch im verifizierten .212-Lockfile vorhanden; @capacitor/cli steht bereits bei 8.5.2. Abhängigkeitsgraph, Advisory-Fix und CI-/iOS-Kompatibilität müssen separat nachgewiesen werden. Keine npm-audit-Ausnahmeregel.
- #246 offen: zwei alte Branches mit einzigartigen Commits, niemals ohne SHA-verifizierte Sicherung löschen.
- #176 offen: Agent-Ref-Broker ist bewusst ein dauerhaftes Steuer-/Integrationsobjekt.
- PR #260 (13 Dependencies), #252 (pako v2→v3, API-/Export-Breaking-Change) und #253 (Wrangler Action) sind aktuell mergeable=false, z. T. veraltet. Keine automatische Versionserhöhung, Rebase, manuelle Merge-Umgehung oder Workflow-Änderung. Nach getrennten Kompatibilitäts-/Security-Tests und neuem Stable-Base-Check über normalen Source-PR einarbeiten.

## Auditfortsetzung und Freigabe

Map-/Timeline-Performance-Baseline aus .210 bleibt unverändert (Phase 3a); weiterführende Profile für Speicher und Interaktion (3b) erst aus reproduzierbaren Chromium-Traces, getrennt von diesem UI-/RUC-Blocker. Vollständiges Source-PR-Gate, deterministische Regressionen, Heavy-Map/Responsive, Python/RUC, Security/Build/iOS, Agent-Automerge, Release-ZIP, Installer und Worker/Pages- sowie SHA-geprüfte Stable-Promotion bleiben verbindlich.


# MID v0.9.85.211 – Sonderprüfung WMO-Niederschlagsphase und Kurzfrist-Zeitbezug

SHA-verifizierte Basis: main = mid-stable fb289175c0eb4e414900d6d645f9c5ed814c5d44 / v0.9.85.210. WMO-4677 Codes 66/67 stehen für gefrierenden Regen, 68/69 für Regen und Schnee gemischt. Positive Lufttemperatur allein schließt gefrierenden Regen bei kalter Oberfläche nicht aus. MID prüft die modellierte warme Oberfläche >=1,5 °C sowie T2m >=1,5 °C und Feuchtkugel >=1 °C als konservative Plausibilitätskorrektur nur von unbestätigten Forecast-Codes auf gewöhnlichen Regen. Fehlende oder kalte Bodenwerte bleiben vorsichtshalber kein Widerspruch. Ein bei positiver Luft-/Feuchtkugeltemperatur verbleibendes unbestätigtes Gefriersignal wird als möglich formuliert, ohne den WMO-Code oder vorhandenes Gefährdungssignal zu verfälschen. Diese MID-Fachgrenzen sind keine amtlichen DWD-Warnschwellen. Beobachtete Phänomene werden niemals umklassifiziert. FZRA und FZDZ verwenden ein eigenes Glätte-Oberflächenzeichen statt der mit Schneeregen verwechselbaren Schneekristallmarkierung; Schneeregen bleibt Regen plus Schneekristall.

Die Kurzfristüberschrift referenziert nun dieselben aggregierten vorwärts gerichteten Stundenintervalle wie das sichtbare Wetterprofil, bevorzugt innerhalb der ersten betroffenen Stunde den frühesten tatsächlich nassen nativen 15-min-Slot und verwendet dessen Intervallbeginn. Wahrscheinlichkeit bei 0 mm ist kein sicherer Regenbeginn. Die 90-min-Kacheln zeigen keine redundante Wolken-%-Zeile; der wissenschaftliche Skybarwert und seine Erklärung bleiben erhalten. Regressionen: scripts/test-precipitation-shortterm-coherence-0985211.mjs und aktualisierter C23-Sunset-Browsercheck; bestehende Mountain-Kälte-/Regen-Gates unverändert. Kein neuer Datenprovider, kein Release-Shortcut, keine Workerfunktion oder Kosten. Vollständige Source-/Installer-/Pages-/Stable-Gates erforderlich.

Primärquellen: https://confluence.ecmwf.int/spaces/ECC/pages/45023980/WMO%2B6%2Bcode-flag%2Btable ; DWD https://www.dwd.de/DE/leistungen/pbfb_verlag_vub/pdf_einzelbaende/vub_16_gesamt_pdf.pdf?__blob=publicationFile&v=5 .

# MID v0.9.85.210 · Intensivaudit – Schritt 3a: automatische Karten-/Timeline-Laufzeitbaseline

Verifizierte Basis main = mid-stable 722ca3b96f142e96cb6e99d1b7038f48d6386fec (v0.9.85.209). Das bestehende echte Headless-Chromium-QA-Szenario scripts/verify-unified-map-browser-0985167.mjs erhält optionale, nichtproduktive PerformanceObserver- und requestAnimationFrame-Proben. In allen vorhandenen isolierten Heavy-Karten-Shards werden 390px/Tablet/Desktop sowie weitere bisherige Viewports, Light/Dark und klassisches/modernes Design durchlaufen, sofern bereits vom Shard unterstützt. Gemessen werden Zeit bis zum initialen interaktiven Kartenstatus, p95 der aufgezeichneten Frame-Abstände, Anzahl/Maximum der Long Tasks und die im Browser verfügbare letzte LCP-Zeit. Vor vorhandenen Page-Reloads und am Testende werden einzelne Phasen snapshotsicher ausgewertet. Messwerte stehen als schema-versionierte JSON-Datei /tmp/mid-map-runtime-baseline-<shard>.json und als Tabelle im jeweiligen GitHub-Step-Summary. Neue nichtproduktive Statistik-/Browser-Probe-Module: scripts/lib/mapBaselineStatistics.mjs und scripts/lib/mapBrowserPerformanceProbe.mjs; der Pflichtregressionstest scripts/test-map-runtime-baseline-0985210.mjs prüft positive/negative Perzentilfälle und das reale QA-Wiring.

Abgrenzung: Dies ist eine **synthetische Vite-/MapLibre-Karten-Fixture mit simulierten Daten** unter CI-Last, nicht Real-User-Monitoring und nicht die Feldmetrik p75-LCP/INP/CLS. Daher werden keine unkalibrierten Laufzeitgrenzwerte oder feste FPS-Regressionsgates eingeführt; bestehende harte Bundlesicherheitsbudgets aus MID_PERFORMANCE_BASELINE.json und sämtliche Produkt-/Source-/Installer-Gates bleiben unverändert. Der nächste Audit-Schritt vermisst nach mehreren stabilen CI-Durchläufen die Varianz, erstellt gegebenenfalls Chrome-Trace/Heap-Baselines für 20 Karten-Zyklen und prüft Preview-Lighthouse und mobile/Native-WKWebView separat. Keine kostenpflichtigen Angebote, keine Datenquellen-/Workerlogik- oder UI-Änderungen.

Freigabe ausschließlich über Source-PR-Gate → Bot-Merge → serverseitiges Release-ZIP → Installer → Worker-/Pages-Prüfung → Stable-Promotion.

# MID v0.9.85.209 · Intensivaudit – GRIB2-Metadatenhärtung (Schritt 2b)

Verifizierte Basis main = mid-stable 419da8d3d780a142a9b25e50ae6e210be06acddb (v0.9.85.208). GRIB-Herkunft in tools/ruc/grib_metadata.py, fetch_and_build_ruc.py und build_ruc_bundle.py gehärtet: GRIB-Edition 2 und WMO-Ursprungszentrum 78 (DWD/Offenbach) aus der tatsächlichen Nachricht prüfen, Herkunft und Initialisierung der dynamischen deterministischen, Rapid-, optionalen und Ensemble-Felder sowie deren Gültigkeitszeiten kontrollieren. Innerhalb jedes logischen Produktparameters bleiben GRIB discipline/parameterCategory/parameterNumber/typeOfLevel/level/gridType/numberOfPoints invariant; doppelte Rapid-Zeiten oder EPS-Member-Zeitpaare werden abgewiesen. Koordinaten-GRIBs prüfen Edition und Zentrum, bleiben aber aufgrund ihrer Zeitunabhängigkeit von der strikten Run-Initialisierung ausgenommen.

Neue ecCodes-Positiv-/Negativtests in tools/ruc/test_grib_metadata.py sind im bereits verbindlichen Source-PR-Python-Testpfad aufgenommen. Die meteorologischen Plausibilitäts-, Taupunkt- und Niederschlagsakkumulationsprüfungen von v0.9.85.208 bleiben vollständig erhalten. Kein Parameter darf allein aufgrund des Dateinamens als fachlich richtig gelten. Weiter offen bleiben produktfeste shortName-/Level-Abbildungen nach vollständiger Verifikation echter DWD-v1-Produktheader: die jetzige Signaturprüfung erkennt innerhalb eines Produkts gemischte Felder, aber keine vollständig gleichförmig falsch etikettierte Produktfolge. Kein Sicherheits-/Workflow-/Secret-Umbau und keine neuen Kosten.

Quellen: WMO Manual on Codes 306 (gültig 01.06.2026) https://community.wmo.int/site/knowledge-hub/programmes-and-initiatives/wmo-information-system-wis/about-manual-codes-volume-i2/latest-version ; DWD GRIB2 https://www.dwd.de/DE/leistungen/opendata/help/modelle/grib2_erlaeuterungen.pdf?__blob=publicationFile&v=1 ; DWD ICON-D2-RUC v1 https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/p/ . Freigabe ausschließlich über Source-PR-Gate, Agent-Merge, serverseitiges ZIP, Installer, Worker/Pages und Stable-Promotion.

# MID v0.9.85.208 · Intensivaudit – DWD/RUC-Integrität (Schritt 2)

Verifizierte Basis main = mid-stable: 2f3cd42a56fbf6625a901d68329d388889350754 / v0.9.85.207. Neuer fail-closed-Guard in tools/ruc/meteo_integrity.py; GRIB-Datenlauf-Initiierung und doppelte deterministische Gültigkeitszeiten werden im frühzeitigen Core-Coverage-Check geprüft. Vor der verlustbehafteten Serialisierung werden physikalische Grenzen der RUC-Kerndaten und der Taupunkt/Temperatur-Vertrag geprüft. Vor allen kumulativ→Intervall-Umrechnungen werden echte negative Sprünge unter -0,05 mm erkannt, statt wie bisher ohne Befund auf 0 mm gekappt zu werden (Deterministik, Rapid/Phase, EPS). Der numerische Toleranzwert ist ausdrücklich ein MID-Validierungs-Gate und keine amtliche DWD-Warnschwelle. Test: neue Offline-Positiv-/Negativfälle einschließlich extremer gültiger Temperaturen und fehlender Daten in tools/ruc/test_meteo_integrity.py, automatisch zusammen mit dem bereits Source-Gate-pflichtigen tools/ruc/test_fetch_resilience.py. Keine neue Quelle, kein Secret, keine UI-Änderung und keine abgeschwächten Release-Gates.

Offene weitere Schritte des Audits: strikter GRIB-Parameter-/Level-Metadatenvertrag auf Basis real nachgewiesener DWD-Felder, granulare Missing-Data-Quoten, Cross-Model-Prüfung, Performance-Baselines und iOS-Simulator-Smokes. Release ausschließlich nach vollem Source-Gate, Server-ZIP, Installer, Worker/Pages und Stable-Promotion.

# MID v0.9.85.207 · Intensivaudit – Build-Identität

Intensivaudit-Schritt 1: Der Auditbefund, main/mid-stable seien ungeschützt, war falsch. GitHub bestätigt aktive MID Production Branch Guard, MID Stable Protection mit Pflichtcheck und gesonderte Agent-/Replit-Regeln. Verifizierte Basis: main = mid-stable = 541ba0b77dc932288bf68ab78b0efd7925045a47 (v0.9.85.206). Nach dem Vite-Build erzeugt scripts/write-build-identity.mjs eine dist/mid-build-identity.json mit exakter Quellversion, möglicher Quell-SHA, Build-UTC, Anzahl Dateien und SHA-256 der gebauten Assets. Fehlerhafte Versionen oder fehlende JavaScript-Assets stoppen den Build. Neue Positiv-/Negativregression scripts/test-build-identity-0985207.mjs. Build-Quell-SHA, Release-Packaging-SHA und Stable-Promotion-SHA sind verschiedene vertragskonforme Identitäten und dürfen nicht blind gleichgesetzt werden. Wetter-, Daten-, Release- und Sicherheitsfunktionen bleiben unverändert.

# MID v0.9.85.206

Die 90-Minuten-Kacheln zeigen zusätzlich den Bewölkungswert ihres jeweiligen Zeitschritts. Die Skybar erklärt ihre Schwellen und die breite Nacht-Hinterlegung. Vorhandene Werte unter den Bandschwellen bleiben als solche erkennbar und werden nicht als fehlende Daten bezeichnet.

Fehlende Bewölkungswerte werden in gemeinsamen Wetterzeichen, Periodenmitteln, Wolkenschichten und Kurzfrist-Fallbacks nicht mehr als 0 % ausgewertet. In den 3-Stunden-Details folgen trockene Wetterbeschreibung und Wetterzeichen nun demselben Bewölkungsmittelwert. Das 24-h-Profil besitzt einen korrigierten Erklärungstext und kompakter angeordnete Hinweise auf breiten Bildschirmen. Echte Nullwerte, Bandfarben und meteorologische Schwellen bleiben erhalten.

Verifizierte Basis: main = mid-stable = 5abd95581f254b2612d94612dcab73b6c8ba75ce (.205). Details: docs/implementation/MID_C23_CLOUD_AUDIT_0.9.85.206.md. Synoptikhorizonte und sämtliche Veröffentlichungsgates bleiben erhalten.

# MID v0.9.85.205 · Vollständiger veröffentlichter Kartenhorizont

Nachprüfung von MID-C23: Die feste 204h-Navigationsgrenze würde die neu gültigen IFS-/GFS-Endpunkte abschneiden. Das Kartenfenster wird daher aus dem letzten tatsächlich veröffentlichten Modelltermin abgeleitet; es erzeugt keine Termine. Verifizierte Basis main = mid-stable = fe2f97fb77fe401ae86bf8b7d2d6330c7490762b (.204), live bestätigt. Gezielte Funktionsregression und sämtliche 24 Karten-Browserfälle schützen +360/+384h, Wochentag und Rückwechsel auf D2. Die vorhandenen Quelltexttests werden auf diese ausdrücklich erweiterte Grenze präzisiert. Details: docs/implementation/MID_C23_FULL_HORIZON_0.9.85.205.md.

# MID v0.9.85.204 · Bewölkung und längere Synoptik

Das 24-Stunden-Profil verwendet für Bewölkungswerte, Wetterzeichen und Skybar denselben Stundenstand. Die 90-Minuten-Ansicht behält ihre feinere Auflösung. Nachtfelder nennen den tatsächlichen Bewölkungswert und werden bei unbekannten Daten nicht als klare Nacht ausgegeben.

Die Synoptik prüft zusätzlich ICON Global sowie modellabhängige längere Horizonte: ICON-EU bis +120 h, ICON Global laufabhängig bis +120/+180 h, IFS bis +360 h und GFS bis +384 h. Angeboten werden ausschließlich vollständige Termine desselben Laufs, soweit Daten und das unveränderte Speicherbudget verfügbar sind. Spätere Termine nutzen ein gröberes, gekennzeichnetes Übersichtsraster. Navigation und Terminauswahl zeigen den zweibuchstabigen Wochentag.

Integrationsbasis: main = mid-stable 19447694b3077dc2332784d3feb6477de06eef5c (.203), vollständig freigegeben; Refreshkorrektur erhalten. Details: docs/implementation/MID_C23_CLOUD_SYNOPTIC_0.9.85.204.md. Bestehende Gates und Budgets bleiben verbindlich.

# MID v0.9.85.203 · Synoptik-Katalog ohne Terminverlust aktualisieren

Beim Neuladen bleibt der letzte geprüfte und noch gültige Synoptikkatalog sichtbar. Modellwahl, Kartenzeitachse und manuell gewählte Gültigkeitszeit bleiben während einer verzögerten Antwort erhalten. Das angebotene Zeitfenster hängt vom bestätigten Modellkatalog ab, auch wenn der bisherige Termin außerhalb eines neu gewählten Modells liegt.

Die Kartenprüfung kontrolliert feste Gültigkeitszeiten statt veränderlicher Listenpositionen und hält die Katalogantwort gezielt zurück. Die Synoptikdarstellung, erweiterten Modelltermine und RUC-Recovery aus .202 bleiben erhalten.

Basis: main = mid-stable 7139d589f8b0c2bee94d0c64942bb78e25c22589 (.202). Details: docs/implementation/MID_C23_SYNOPTIC_REFRESH_0.9.85.203.md. Unveränderte Release-, Sicherheits-, Frische- und Datenbudgetgates.

# MID v0.9.85.202 · Synoptik-Komposit und Kartenzeitsteuerung

Theta-E 850 hPa erhält dezente graue Konturen; die Linienbeschriftung erscheint nur bei Vielfachen von 12 °C. Die blauen Feuchtelinien in 700 hPa bleiben ohne Linienbeschriftung.

Die fokussierte Wetterkarte wechselt mit den Pfeiltasten links/rechts zum vorherigen/nächsten bestätigten Termin. Eingabefelder und Regler behalten ihre eigene Bedienung.

Für ICON-EU, GFS und IFS werden zusätzlich +60 und +72 Stunden angeboten, soweit vollständige Felder aus demselben Lauf verfügbar sind und das bestehende Datenbudget ausreicht. ICON-D2 bleibt auf seinen regionalen Ausschnitt und 48 Stunden begrenzt. Der große Europa-Ausschnitt und die 6-Grad-Farbstufen aus .200 bleiben erhalten.

Basis: main = mid-stable f654bd172a7afc43f307f6dd0663e9ce00b625cb (.201). Details: docs/implementation/MID_C22_SYNOPTIC_TIMELINE_0.9.85.202.md. Bestehende Release-, Sicherheits- und RUC-Frischegates bleiben verbindlich.

# MID v0.9.85.201

RUC-Kurzfristdaten werden nach erfolgreichen MID-Veröffentlichungen automatisch auf Aktualität geprüft und bei Bedarf nachgeholt. Ein erfolgreicher Verarbeitungslauf ohne tatsächlich veröffentlichte Daten unterdrückt die Wiederaufnahme nicht mehr.

RUC-Übergabeartefakte erhalten pro Ausführungsversuch eindeutige Namen. Der bestehende Vier-Stunden-Frischevertrag, Datenbudgets sowie Release- und Sicherheitsprüfungen bleiben erhalten.

Basis: main = mid-stable c3f3abebfd5e3da86013063d7b051b05399e3876 (v0.9.85.200). Details: docs/implementation/MID_C22_RUC_RECOVERY_0.9.85.201.md.

# MID v0.9.85.200 · MID-C21 Synoptik und Bildwechsel

Verifizierte neue Basis: main = mid-stable = `5b8632355396ff1d6bf25dc20d7edd83415c021e` (.199), parallele Widget-Korrektur erhalten. Europaausschnitt, 60-kt-Pfeile, Theta-E-Stufen/RH700-Konturen, optionale vollständige Termine sowie gepufferte Bildwechsel. Details: docs/implementation/MID_C21_SYNOPTIC_BUFFERING_0.9.85.200.md. Bestehende Source-/Installer-Gates und Datenbudgets bleiben verbindlich.

# MID v0.9.85.199 · Widget-Kurvenkopf kompakt

Verifizierte Ausgangsbasis `main = mid-stable = 36110a193328b0e4a5978e742e3768a8fcd9664f` (.198). Alle Parallelstandsänderungen bis hierher bleiben erhalten. Widget-only Headerrendering via `presentationReady`; 7d-App-Ansicht unverändert. Regressionsschutz in scripts/test-widget-curve-label-spacing-0985191.mjs; reguläres Source-/Installer-/Pages-/Stable-Gate. Details: docs/implementation/MID_C21_CURVE_WIDGET_COMPACT_0.9.85.199.md.

# MID v0.9.85.198 · MID-C21 Karten und RUC-Veröffentlichung

Basis b27bd472e228c59a9cc36e7305307b775623288a (.197). Details: docs/implementation/MID_C21_MAP_RUC_0.9.85.198.md. Bestehende Source-/Installer-Gates bleiben verbindlich.

## MID v0.9.85.197 · MID-C21 Wetterkarte, Synoptik und iPad-Rückkehr

Verifizierte Basis: main = mid-stable = `55bde6e4ed20127a32403c54546379fb6e86943c` (.196). Current-UI mit Skybar über dem Graphen, eine auswählbare OSM-Topologie, native fünfteilige GRIB-Synoptik und getrennte Inhalts-/Menü-Rückkehr. Handoff grün: Run 37694186641 für Head 6e4d3fc39ace83ae17c3b5a71e6ed9c06a902030. Details: `docs/implementation/MID_C21_CURRENT_WEATHER_0.9.85.197.md`. Sämtliche Release-/Sicherheitsgates unverändert.

## MID v0.9.85.196 · MID-C21 vollständiger Handoff

Verifizierte Basis: main = mid-stable = `cd3f88d3852591a6375fb46701f11708d118b6f1` (.195). Der read-only Handoff-Gate erhält für den unveränderten vollständigen Verify-Aufruf 25 statt 15 Minuten innerhalb des bestehenden 30-Minuten-Jobrahmens. Grund: Run 37683018228 meldete bis 900/938 Tests null Fehler und wurde am Zeitlimit beendet. UI-Übernahme folgt erst nach erneut grünem Handoff auf aktueller Stable-Basis. Details: `docs/implementation/MID_C21_HANDOFF_TIME_BUDGET_0.9.85.196.md`. Sämtliche Berechtigungen, Prüfungen und Releasegrenzen unverändert.

## MID v0.9.85.194 · MID-C20 Windereignisse statt redundanter Hinweise

Verifizierte Basis: main = mid-stable = b228e682cb8ea71979b8e296a30aaf8d5ee6fd0d (.193). Inhaltlich gleiche Windhinweise werden nach der probabilistischen Fensterbildung bei zeitlicher Überlappung kanonisch zusammengeführt. Unsicherheit bleibt sichtbar; amtliche Warnungen, verschiedene Stufen/Richtungen/konvektive Risiken und kumulative Niederschlagsfenster bleiben getrennt. Der separate Stundenkurven-Screenshot ist ohne Ort/Modell/Originalstand noch nicht reproduziert und wird nicht pauschal geglättet. Details: docs/implementation/MID_C20_WARNING_EPISODES_0.9.85.194.md. Alle bestehenden Releasegates unverändert.

## MID v0.9.85.193 · MID-C20 vollständige parallele Installerprüfung

Verifizierte Basis: main = mid-stable = 9998db3dd5358101717ecd16482f7f88e4983ebb (.192). Der Installer verteilt das vollständige Regressionsinventar auf Core und isolierte Heavy-Jobs; die Unified-Map-Matrix behält alle 24 Fälle in drei disjunkten Gruppen. Ein eventgebundener Snapshot mit Manifest-/Archiv-/Datei-Hashes wird an jedem Jobübergang vollständig geprüft. Commit und Deployment benötigen den Erfolg des Core und der ganzen Heavy-Matrix. Laufzeitberichte dienen ausschließlich der Diagnose, niemals als Prüfergebnis-Cache. Alle nachfolgenden Worker-/RUC-/Pages-/Stable- und main-Race-Gates bleiben unverändert. Details: docs/implementation/MID_C20_INSTALLER_SHARDING_0.9.85.193.md.

## MID v0.9.85.192 · MID-C20 Kurvenwidget-Ortskopf

Verifizierte Basis: main = mid-stable = df7df09c167b7c482e31c27e64aefa77148bc5ad (.191). Tageskarten und Kurvenwidget besitzen einen gemeinsamen Ortskopf innerhalb der Exportfläche. Ortsname, Koordinaten, Höhe und Ortszeit stimmen damit in Vorschau, URL-Widget, PNG und Zwischenablage überein. Ensemble und sämtliche Sicherheits-/Releasegates bleiben unverändert. Details: docs/implementation/MID_C20_WIDGET_LOCATION_0.9.85.192.md.

## MID v0.9.85.191 · MID-C20 Warnungscenter und Regressionslaufzeit

Verifizierte Basis: `main = mid-stable = 118b0fe24a66205d5d9624716719dd6b562ee0d3` (v0.9.85.190). Aktuelle und anstehende Hinweise werden explizit getrennt. Amtliche und MID-Details öffnen beim Einstieg und erneuter Warnungsnavigation; manuelles Einklappen bleibt möglich. Budgetprüfungen erfassen weiterhin sämtliche Dateien mit unveränderten Grenzen; Kompression wird nur für die ohnehin ausgegebenen 18 größten Dateien berechnet. Details: `docs/implementation/MID_C20_WARNINGS_PERFORMANCE_0.9.85.191.md`. Bestehender Source-/Installer-/Worker-/Pages-/Stable-Pfad unverändert.

## MID v0.9.85.190 · Installer-Zeitbudget und RUC-Wiederaufnahme

Verifizierte Stable-Basis: `6dd6205ab53b2f1aa4d543acb120e51cce1775da` (.188). Der vollständig bekannte .189-Quellstand aus PR #281 (`0dc39b21f8e2c3f1a98f43f241583f144b5fabca`) wird erhalten. Main steht auf dem serverseitigen .189-Release-Commit `e1d00aa04f09b956bd122a78a4c1efb4e8ccb805`; .189 ist wegen Installer-Timeout nicht freigegeben. Details: `docs/implementation/MID_C19_RUC_RELEASE_0.9.85.190.md`. Kein manueller Merge/Dispatch/Stable-Update, kein Entfernen von Release- oder RUC-Snapshot-Gates.

## MID v0.9.85.189 · Robuste Favoriten-Ortsauswahl und getrennte Prognosehorizonte

Basis: `main = mid-stable = 6dd6205ab53b2f1aa4d543acb120e51cce1775da` (.188), nach erfolgreichem Installer/Worker/Pages/Stable-Abschluss. Die gemeinsame Ortsauswahl nutzt die direkten dauerhaften Speicherfunktionen und lässt Speicherfehler nicht mehr die aktive Auswahl abbrechen. Die Favoritenleiste besitzt statt einer timerabhängigen globalen Sperre einen gesten- und favoritengebundenen, selbst ablaufenden Duplicate-Token. Details: `docs/implementation/MID_FAVORITE_RESILIENCE_0.9.85.189.md`.

Das 14-Tage-Entwicklungsdiagramm reicht die vorhandenen gewichteten Tagesquantile für Tmax und Tmin vollständig weiter (P10/P25/P75/P90), ohne Ensemble-Methodik oder Gewichte zu verändern. Best-Match-Fallback erzeugt keine künstlichen Intervalle. Die Phasenübersicht ist kompakter. 46d und Saison besitzen gegenseitig exklusive Darstellung und Datenaktivierung; Saisonabrufe starten erst bei ausdrücklicher Auswahl und werden beim Verlassen abgebrochen. Classic erhält eine explizite Horizontwahl. Der alte Texttest .097825 wurde dem ausdrücklich erweiterten Tmax/Tmin-Vertrag angepasst, nicht gelockert.

## MID v0.9.85.188 · Widget-Export viermal täglich

Basis: `main = mid-stable = 2a8370734e98f2c9c1d6da30ad30d9ee5a87aa34` (v0.9.85.187). Der serverseitige Export der zwölf festen MID-Widget-PNGs wird automatisch ausschließlich viermal täglich im 6-Stunden-Abstand ausgeführt: 00:17, 06:17, 12:17 und 18:17 UTC. Die bisherigen automatischen Zusatztrigger nach erfolgreichem MID-Release und bei `mid-stable`-Push entfallen, damit keine redundanten Renderläufe entstehen. `workflow_dispatch` bleibt als bewusster manueller Diagnose-/Notfallstart erhalten. Renderer, Profile, Validierung, Retry-Logik und das rollierende `widget-latest`-Paket bleiben unverändert. Details: `docs/implementation/MID_WIDGET_CADENCE_0.9.85.188.md`.

## MID v0.9.85.187 · Phasenprüfung und Karten-Kontrast

Basis: main = mid-stable = 251718eec0e792c4fd47eb59610a1fdaec62157c (.186). Fachlich getrennte gefrierende und gemischte Niederschlagsphasen; keine Eisregenableitung aus kaltem Schneeniederschlag. Kartenbedienung und kompakte zeitgebundene Ortswerte in allen Designs. Details docs/implementation/MID_C18_PHASE_MAP_0.9.85.187.md.

## MID v0.9.85.186 · Karten-Layer mit verlässlichen Linien

Basis: `main = mid-stable = c33588bd76a7a169cbaad0bf98539f3c99080471` (v0.9.85.185). Radar und Satellit lassen sich unabhängig vollständig abwählen. Automatische Modell-Darstellung bevorzugt darüber geprüfte Linien; Flächen bleiben optional. Responsive Layer-Schalter, einmalige Ortsbeschriftung und kompakte Favoriten vermeiden Überlappungen und irreführende Nichtverfügbarkeitsmeldungen. Native Isobaren und bestätigte DWD-WMS-Stile benötigen kein Flächenraster. Paralleländerungen .181–.185 bleiben erhalten. Details: `docs/implementation/MID_C18_MAP_LINES_0.9.85.186.md`.

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
## MID v0.9.85.195 · MID-C20 Zeitachse und Karten-Synoptik

Verifizierte Basis: main = mid-stable = 22ddd5888f010dbe72eed4b37230463149d52ba5 (.194). Die gemeinsame Warnungs-Timeline nutzt die gesamte Breite und gruppiert Ereignisse nach lokalem Starttag mit Wochentag, Datum und Ereigniszahl. Desktop erhält eine seitliche Tagesachse, Mobil eine kompakte Datumszeile. Quellenkennzeichen stehen innerhalb des Textbereichs, statt Kartenbreite zu verbrauchen. Karten erhalten dezente, nicht doppelte Verwaltungsgrenzen, fachliche Parametergruppen und ein lauf-/termin-/druckflächengebundenes ICON-Synoptik-Komposit. ECCC/GDPS ergänzt Gesamtbewölkung über einen explizit freigegebenen GeoMet-Layer; ICON-EU-2m und bestätigte 12-h-Karten erweitern den Katalog. Warnungsdaten, Farben, Zeitfenster, Sortierung und Releasegates bleiben unverändert. Kartenprüfung: docs/implementation/MID_C20_MAP_SYNOPTIC_0.9.85.195.md. Zeitachse: docs/implementation/MID_C20_WARNING_DAY_TIMELINE_0.9.85.195.md.

## v0.9.85.262 · Widget-Tageszeilen und vollständige Skybar
Die Widget-Kurvenübersicht verwendet weiterhin SevenDayCurveOverview. Niederschlag zeigt bei aktivierter Option die kompakte Tagesmenge und Wahrscheinlichkeit zwischen Tmin und Wind sowie die bisherigen Säulen; Sonnenschein steuert eine eigene Sonnenstundenzeile oberhalb des Diagramms. Die additive gespeicherte Option showSkybar (Default true für bestehende Einstellungen) steuert ausschließlich den vollständigen Wetterstreifen, unabhängig von den Zahlen-/Säulenoptionen. Nachtflächen bleiben Diagrammeigenschaft. URL-Parameter skybar=0|1 wird unabhängig gelesen; PNG/Vorschau/URL verwenden denselben Renderer. Die neue Anzeige markiert ein Stundenmaximum ausdrücklich mit max und verwendet amtliche DWD-Ereignissemantik nur bei passender Provenienz. Missing bleibt Missing. Required regression: scripts/test-widget-daily-rows-0985262.mjs.