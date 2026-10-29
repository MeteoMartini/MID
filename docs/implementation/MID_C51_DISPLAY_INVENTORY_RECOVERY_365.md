# MID-C51 · Systematische Rückkehrinventur und Release-Recovery .365

## Verifizierte Herkunft und gesperrter Vorgänger
Freigegeben bleibt .363: main=mid-stable war vor .364 f0ccf4a448b5281a7bfc795d687544c06439104b. PR#511-Sourcehead b152a56ab97d3e8e611877221a155ae429b9b505 / Tree007001fd25e5973c42e32e62f01f5e708c716b55 hatte SourceGate40893359176 und Unitpilot40893359150 vollständig grün (4Core,6Heavy), lokaler Core1037/1037 und echte12React-/Speicherfälle. Bot40895323887 integrierte5cfe6e545366c8684dd4333d9f5a682657565ffe und bereitete ZIP-Event11733c934f8ac60ff109f8b7f175d5bf4fc6f9ef vor. Installer40895387461 scheiterte in Versuch1 und2 ausschließlich bei Search-Chromium-Start (je1036/1037Core erfolgreich, alleHeavy grün). Daher wurde .364 **nicht veröffentlicht**. Changelog kennzeichnet den unveröffentlichten Entwicklungsstand. Keine Source-/Stable-Promotion nach diesem Fehler behaupten.

Neuer autorisierter Branch beginnt auf frisch verifiziertem Stable.363 und übernimmt den exakt geprüften .364-Source-Tree per lokalem Commitac3655226a0c2253957f62e690de0626dd5d4589. Bekannter Main-Alt-ZIP-Kandidat gehört zur dokumentierten Fehler-Recovery in ci/github/workflows/chatgpt-pr-gate.yml: PR-Head ZIP-frei, bestehendes Main-ZIP im synthetischen Merge nachweislich unverändert, nur im temporären Source-Runner ausgeklammert. Die vollständige Main-Tree-Probe ist nachgewiesen: Entfernt man ausschließlich das gescheiterte ZIP aus Main-Tree80b7fe79ac4effb057bc9bb561e8a61b83d8d96f, ergibt sich exakt der zuvor geprüfte .364-Source-Tree007001fd25e5973c42e32e62f01f5e708c716b55. Damit keine unerkannten Main-Codeänderungen überschrieben. Der neue Source-Commit kann den bekannten Main-Kandidaten11733c... als Parent haben und enthält selbst kein ZIP; dessen obsolete Kopie wird im Source-Tree entfernt und später ausschließlich vom regulären Bot neu erzeugt. Das alte Archiv bleibt über den unveränderten Commit11733c... und den Installer-Snapshot nachvollziehbar. Keine direkte main/stable-Mutation, kein Force/Bypass, keine Workflowänderung.

## Neun weitere dauerhafte Zustände
AST-Inventur aller TSX-useState-Auswahlpfade fand86 nach Namen relevante Zustände; Daten/Ladezustände, Viewportmessungen und absolute Wetterzeitpunkte werden fachlich getrennt. Zusätzlich zu .363/.364 speichern nun:

| Verbraucher | Zustand / Vorgabe | Semantik |
|---|---|---|
| MountainZoneAnalysis | geöffnet, false | Allgemeine Analyseansicht |
| MountainSnowLineTrend | geöffnet false; Horizont3 | Alle bestehenden1/3/7/14-Tage-Optionen erhalten |
| MountainForecastOverview | Höhenrolle summit | valley/middle/summit; Ersatzrolle nur anzeigen, bevorzugte Rolle nicht rückschreiben |
| CompositeLegend | ausführlich false | Radar-Legendenumfang |
| RadarPanel | Ebenenabschnitt, bisherige responsive Vorgabe | Echter Details-Abschnitt; Fokus-Popover bleibt transient |
| PollenForecast | erweitert false | Anzeigeumfang |
| ShortTermRibbon | Stundenliste erweitert false | Anzeigeumfang |
| Forecast | Alle Stunden false, je Tages-/Stundenansicht | Tages-/Auflösungswechsel löschen Darstellung nicht |

Die neun Zustände enthalten die zwei getrennten SnowLine-Felder. Tageswechsel überschreiben die gewählte1h/3h-Tagesauflösung nicht mehr mit3h. Feste1h-Stundenansicht bleibt erhalten. Dialogfokus, Hover, einzelne Ereignisse, expandierte absolute Datumszeilen und Wetterzeitpunkte bleiben transient. Warnungsdetails sind ausdrücklich **keine dauerhafte Präferenz**: der bestehende Warncenter-Vertrag verlangt beim erneuten Öffnen vollständig sichtbare amtliche Texte und MID-Hinweise. Dieser Vertrag bleibt unverändert, einschließlich Ereignis-Disclosure-Reset.

## Browserstart reparieren, UI-Gates erhalten
Die Fehlerausgabe war in beiden Installerversuchen derselbe12s-Timeout vor UI-Matrix und ohne Prozess-/Stderrfehler. Der ausgewählte Binär-/Ressourcen-Grund ist damit nicht abschließend bewiesen. Isolierte lokale echte Search-Matrix und Source-Quartalstest bestanden; deshalb kein weiterer blinder Gesamt-Retry. Search verwendet nun den bereits validierten Mountain/Push-Vertrag: maximal2Starts, je frisches Profil und45s-Startbudget, begrenzter2s-Loopback-HTTP-Probe, TERM/KILL und Stoppen vor Profilwiederverwendung, strikte Port0-/Loopback-CDP-Validierung. UI-Waits bleiben12s, alle6Viewports×2Themes und Interaktionen unverändert. Keine Assertion, kein Browser-/Warn-/Sicherheitsgate entfällt.

Neue Regression test-search-browser-startup-0985365.mjs startet den tatsächlichen Search-Test mit kleinen lokalen ausführbaren Fault-Wrappers: Beide Starts scheitern→Gate muss rot werden und darf keine UI-Matrix behaupten; erster Start scheitert und hinterlässt Sentinel im Profil→zweiter Start muss bereinigtes Profil verwenden, startet absichtlich erst nach13s und führt alle12echten UI-Fälle erfolgreich aus. CI verlangt echtes Chromium; lokal zusätzlich mit Chromium141 HeadlessShell vollständig geprüft. Keine simulierte UI als Geräteabnahme ausgeben.

## Historische Verträge
Drei veraltete Quelltextprüfungen (24h-Liste, Komposit-Legende, Mountain/CSS-Golden) sind gezielt angepasst. false-Defaults und vollständige Anzeigen-/WMO-/Phasenassertions bleiben. Die117 historischen extrahierten Deklarationen behalten ihre bisherigen Hashes: Für drei Mountain-UI-Komponenten wird ausschließlich die exakt geforderte neue Persistenzanbindung auf der Vergleichskopie zurückübersetzt; nur der bewusst entfernte Ersatzrollen-Schreibeffekt wird dort historisch rekonstruiert. Jede Berechnung, jeder Renderer und alle anderen Bytes bleiben goldengeprüft. Keine pauschale Golden-Neugenerierung.

## Freigabegrenzen
.365 bleibt Kandidat bis neuem vollständigem Source-/Bot-/ServerZIP-/Installer-/Worker-/Pages-/Stable-Nachweis. Types, Produktionsbuild,1038Core, tatsächliche Fault-Injection, allgemeine12React-/Speicherfälle und alle externen Heavy-Gates nachweisen. Versionsspiegel einschließlich nativem Buildcounter366 synchron. Keine Dependency-, meteorologische Quellen- oder Fusionsgewichtungsänderung. CLI-Auditbestand3moderate transitive uuid/xcode/Capacitor-Befunde bleibt, keine High/Critical-Produktionseinführung.

MID18.2.54-Nachträge sind übernommen. GeoSphere-Metadaten und mögliche Rollen in Bergwetter/Schnee/Fusion liegen im .364-Quellpaket und#509/#510; echte C-LAEF-Bergpunktantwort und TAWES-SCHNEE0/Missing-Proben in den Issues. TAWES-Bestandsadapterkorrektur, amtliche CH/DE-Messdatenqualifikation und RUC-Endstundenfusion#352 bleiben fachlich getrennt. Keine unqualifizierte Quelle aktivieren und keine stündlichen Quantile zu Summenquantilen erklären.

Lokaler abschließender Sicherheitsnachweis: kanonisches audit:dependencies erfolgreich über OSV-Fallback (83Produktions-Paketversionen, findings=[], recheckRequired=false), nachdem npm-bulk nach18s nicht antwortete; Dependency-Policy erfolgreich. Types, Produktionsbuild und allgemeine12React-/Speicherfälle erfolgreich. Konkrete vollständige Regressionsergebnisse werden im PR nachgetragen; keine Veröffentlichung vor externen Gates. Offizielle Node22-Dokumentation über Context7 bestätigt AbortSignal.timeout für den begrenzten Loopback-Abruf: https://nodejs.org/docs/latest-v22.x/api/globals.html .
