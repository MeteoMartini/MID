# MID v0.9.85.248 – D2-Optionen unter echtem RUC-Budget, CSS-Teilentkopplung mit Kaskadenbeweis

## Freigegebene Codebasis
`main = mid-stable = 9e11280be4b12b8995d4248da3f78c96833804ae`, Release v0.9.85.247. Keine parallelen Quell-PRs im Arbeitsbereich. Umsetzung auf `chatgpt/v0.9.85.248-d2-budget-css-audit`; keine Direktänderung an Produktionsbranches, Release-Gates oder Cloudflare-Zugang.

## 1. Neue ICON-D2-Wolken-/Wetterkarten
Die Routine `tools/ruc/build_cloud_weather_fields.py` fordert weiterhin die etablierten Stunden 0–12, 15, 18, 21, 24, 30, 36, 42 und 48 an und **versucht zusätzlich** 13, 14, 16 und 17 Stunden. Fehlende WMO-4677-Wetter-/Gesamtbewölkungs-Paare werden **nicht** interpoliert oder als leere Karte ersetzt. DWD-GRIB-Kopplung, Gitter-/Laufzeitgleichheit, Qualitätsprüfung, Datenhashes und 600-Sekunden-Optionallimit bleiben verbindlich.

### Produktionsdaten statt Annahmen
GitHub-RUC-Prepare-Lauf `38408242957` für `2026-10-13T13:00` endete erfolgreich. Sein `storage-audit.v1` weist `publishedBytes = 898979917`, `budgetBytes = 900000000`, `remainingBytes = 1020083` aus (mit physischem Manifest zusätzlich ca. 0,26 MB). Bereits eingesetzte verlustfreie Optimierungen: identische Chunk-Aliase, Reduktion redundanter schneller Felder, Ausschluss optionaler `state15`-/`solar15`-Blöcke aus Pages. Daraus folgt **keine** freie Erhöhung des 900-MB-Limits.

### Vorrang der Kernprognose
`fit_synoptic_budget` in `tools/ruc/prepare_ruc_pages.py` entfernt neue D2-Zeiten vor der bestehenden Erhaltungs-/Pruning-Logik aus dem Budgetinventar. Es lässt **zuerst** den bisherigen vollständigen RUC-, Synoptik- und Wolken-/Wetterkartenbestand unverändert durch die bewährte Priorisierung laufen. Erst danach werden die vier neuen D2-Paare einzeln erneut eingefügt. Zulassung nur, wenn danach mindestens 256.000 B über der bisherigen Manifestreserve frei bleiben. Zulassung, Ablehnung und Ursache werden in `cloudWeatherBudget.optionalD2` dokumentiert. Neue D2-Karten können somit nie die bisherigen Modellkarten oder die RUC-Kernfelder verdrängen. Der gesamte harte Pages-Guard bleibt unverändert und fail-closed.

**Einschränkung:** Die Produktion kann je nach realer Datenverfügbarkeit und Bytebudget alle, einige oder keinen der vier neuen Termine veröffentlichen. Bei der RUC-Preprocessing-Frischeprüfung dürfen zusätzliche D2-Downloads den übergeordneten 600-s-D2-/Synoptik-Deadlinevertrag nicht aushebeln. Terminbudget und Konvention der amtlichen WMO/DWD-Codes bleiben dieselben.

## 2. CSS-Aufteilung (Audit, bewusst kein kaskadenbrechender Move)
In Stable werden 70 geordnete Quellen in `src/midPresentation.css` zusammengeführt; Vite `cssCodeSplit: true` wirkt bereits auf echte async Modulimporte. `src/styles-src/25-extreme-outlook.css` hat 23.957 B, der konsolidierte Bereich im generierten globalen CSS ca. 23,8 kB. Es finden sich **mindestens sieben** späte Regelklassen und weitere übergeordnete selektorbasierte Überschreibungen für den Extremwetterbereich *nach* dieser CSS-Quelle. Einfacher Import in die bereits lazy geladene `ExtremeWeatherOutlookPanel.tsx` würde diese Reihenfolge ändern: Vite stellt sicher, dass Chunk-CSS vor Ausführung des Imports geladen ist, **nicht**, dass dessen Kaskadenposition wie in der ursprünglichen 70-Dateien-Folge bleibt.

Der bestehende Golden-CSS-/Browser-Vertrag bleibt deshalb unangetastet. Der Audit in `scripts/test-module-css-consolidation-0985170.mjs` quantifiziert in CI den extrahierbaren Kandidaten, die nachgelagerten Selektoren und den globalen Umfang. Eine tatsächliche CSS-Auslagerung erfolgt erst, wenn im separaten Pilot die *gleiche* Priorität (einschließlich Light/Dark, High Contrast, ::before, media, @supports), 320/390/430/834/1024/1440-Hoch/Quer-Ansichten, Ersttipper-/Popover-Wechsel und die Komponenten-/Screenshot-Parität reproduzierbar nachgewiesen sind.

Möglicher Pfad: Statt blindem Ausschneiden der 25er-Quelldatei aus der Mitte der Kaskade zunächst ein ausschließlich einer Lazy-Route zugeordnetes, am **Ende** der Kaskade liegendes Stylesegment auslagern; später CSS an explizite Feature-Eigentümer koppeln und das Original mit goldenem Render- und Computed-Style-Vergleich rekonstruieren. Nicht nur die erste CSS-Dateigröße, sondern initiale rohe/gzip/Brotli Bytes, parse/style-recalc, Route-Delta, Splash-FCP und Cold/Warm Cache als Gate messen. Issue #344 bleibt bis zur messbaren Umsetzung offen.

## 3. Risikominderung und Folgeoptimierungen
1. **Kurzfristig:** Datenabhängige, ausschließlich optional zugelassene D2-Zeiten (dieser Build). Unter 900 MB bleiben, keine Reduktion des vorhandenen Angebots.
2. **Mittelfristig:** Bitgenaue, verlustfreie Kompression der nativen RUC-Chunks als separates Transport-/Decoder- und Hash-Contract-Migrationspaket. `tools/ruc/storage_audit.py` zeigt in unveröffentlichten Kandidaten gzip/Byteplane-gzip eine dramatisch kleinere Inventargröße. Dies sind **keine schon realisierten** Einsparungen. Worker, Cache, Chunk-Offsets, NoData und mobile CPU-Messungen müssten gemeinsam migriert werden.
3. **Architektur:** Optionale hochaufgelöste D2-Karten möglichst von der kritischen RUC-Basispipeline entkoppeln; erst nach erfolgreicher Kernpublikation und unabhängiger Snapshotvalidierung die ergänzenden Produkte veröffentlichen. Keine unkontrollierte zweite RUC-Pipeline, kein Aushebeln von Pages-Speicher-, Worker- oder Scheduler-Gates.
4. **Fachlich:** Geo-Referenzierung, Abdeckung und maximale Zeithorizonte der zusätzlichen Modelle getrennt nach realem DWD-Datensatz validieren. RUC-Karten als eigenes geprüftes Produkt (Issue #350) und nicht als umbenannte ICON-D2-Karten.

## Freigabe
Pflicht: vollständige Source-Gate- und Installer-Regressionen, Web/iOS-Hülle, Security/Dependencies, Worker/Pages/RUC-Frische, SHA-gebundene Stable-Promotion. Keine Behauptung physischer WKWebView-/VoiceOver-Abnahme ohne Geräteevidenz.
