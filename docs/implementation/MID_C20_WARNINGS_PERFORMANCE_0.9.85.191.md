# MID v0.9.85.191 · Warnungscenter und Regressionsdauer

Basis: main = mid-stable = 118b0fe24a66205d5d9624716719dd6b562ee0d3 (.190).

## Befund und Verhalten

Der Screenshot enthält einen zukünftigen Böenhinweis. Der alte Kopf bezog sich nur auf jetzt, der Zähler auf alle relevanten Zeitfenster. Keine meteorologische Fehlklassifikation: Der neue Kopf nennt den aktuellen Zustand und die Anzahl anstehender Hinweise ausdrücklich. Diese steht im Text auch dann, wenn CSS den separaten Zähler auf kleinen Displays versteckt.

Hazards startet mit geöffneter Gruppe und ohne geschlossene Einträge. OfficialWarnings startet ebenfalls ohne geschlossene Einträge. Geschlossene IDs werden unabhängig gespeichert; mehrere Einträge können gleichzeitig offen bleiben. Neue Meldungen öffnen standardmäßig. WarningCenter reagiert auf die bestehende mid:open-module-Navigation für warnings und erneuert die Kindschlüssel, damit erneuter Einstieg beide Gruppen öffnet. Gewöhnliche Datenupdates klappen manuell geschlossene Einträge nicht wieder auf. Amtliche Beschreibungen, Anweisungen, Quellenfehler, Herkunft, Zeitfenster und Farblogik bleiben erhalten. Die Timeline benennt beide Arten statt ausschließlich amtliche Warnungen.

Der alte Disclosure-Texttest .09657 wurde an die ausdrücklich angeforderte Default-open-/Zukunftsstatus-Regel angepasst; .098577 prüft die präzisierte gemeinsame Timelineüberschrift. Keine fachliche Schwelle wurde verändert.

## Laufzeitprüfung

Das vollständige Core-Inventar dauerte lokal rund 92 Sekunden. Es ist bereits konservativ in 616 parallel-sichere und 315 serielle Prüfungen klassifiziert; drei Browser-Heavy-Jobs sind im Source-Gate isoliert. Weitere pauschale Parallelisierung würde die bestehenden Sicherheits-/Isolationsregeln aufweichen und wurde daher nicht vorgenommen.

Die Budgetprüfung berechnete gzip und Brotli mit Qualität 11 für sämtliche Dateien, obwohl nur 18 Zeilen ausgegeben werden und alle Grenzwerte rohe Dateigrößen vergleichen. Sie liest nun alle Größen für unveränderte vollständige Budgetprüfungen; gzip/Brotli werden mit identischen Einstellungen nur für die 18 Berichtsdateien berechnet. Vorher/nachher auf identischem lokalen Dateibestand: 11,78 / 11,29 Sekunden; Ausgaben byteidentisch. Kleine Optimierung, keine belastbare große Releasebeschleunigung behauptet. Keine Tests, Gates, Dependency-/Securityprüfung, Installation oder Browser-QA entfallen.

## Validierung

Neue Laufzeitregression prüft tatsächliche gerenderte React-Komponenten: nur zukünftiger Hinweis, gemischte aktuelle/anstehende Hinweise, leerer Zustand, anfänglich offene MID-Details, vollständige amtliche Beschreibung/Anweisung und Quellenfehler. Navigation-Reset ist zusätzlich abgesichert. Responsive Browserprüfung testet manuelles Schließen und erneutes Öffnen auf Telefon-, Tablet- und Desktopgrößen in beiden Themes. Produktionsbuild mit sauberem dist-Ausgabeverzeichnis und vollständiges Inventar: 932/932 bestanden (94 s lokal). 12 Browserfälle bestanden: 393×852, 852×393, 768×1024, 1024×768, 360×800 und 1440×900, jeweils Light/Dark. Die isolierte Prüfung nutzt echte Warnkomponenten und die reale Stylesheet-Kaskade; die Timeline erhielt auf schmalen Displays volle Breite. Der Browsernachweis wird in GitHub Actions als Teil der neuen Pflichtregression erneut ausgeführt. Kein Replit-Diff übernommen: reine Rückfrage endete mit HTTP 504. Keine direkte Stable-Mutation.

## Zusätzlicher Widgetauftrag

Der reine Erklärungstext im Kopf von SevenDayCurveOverview entfällt im gemeinsamen Renderer, damit App, Vorschau, URL-Widget und PNG dieselbe Darstellung verwenden. Die fachliche Skybar-, Nacht-, Quantil- und Niederschlagslogik bleibt unverändert. Die Wind-/Böenwerte erhalten einen expliziten zweizeiligen Flow mit 2 px Zwischenraum und 1,25-facher Zeilenhöhe; negative Abstände oder überlagernde Positionierung werden ausgeschlossen. Ein Browsernachweis kontrolliert reale Textboxen einschließlich PNG-Rasterisierung.

Widget-Browserprüfung: 40 Größen-/Theme-/Einheitenfälle (360/393/768/1024/1440 px, Light/Dark, kt/kmh/ms/mph) mit realen Textboxen; Abstand mindestens 2 px. Raster-PNG visuell geprüft. Die neue Widget-Pflichtregression wiederholt den Browsernachweis in GitHub Actions.
