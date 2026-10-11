# MID-C27 · 0.9.85.236 · tatsächliches Inventar und Ortslesbarkeit

Verifizierte Basis main=mid-stable0fbc0b3370cab20b608ce67de4fac94c4cfc8827 (.235), bestehende Source-/Installer-Gates erfolgreich. Offene Dependabot-PRs260/253/252 überlappen diese Quellen nicht.

## Gemessene Datenmenge

RUC38117759281, prepare114405991646, Aufbereitung erfolgreich, Bericht06:39:55Z für2026-10-11T05:00:899950367 Objektbytes, Budget900000000, Rest49633,1216 Objekte. Manifestbasierte identische Hash-/Größenpaare belegen20103168 Duplikatbytes. Das ist eine exakte Inventarmessung; die neue Producer-Implementierung bestätigt zusätzlich jedes zusammengeführte Paar vollständig byteweise. Keine Hochrechnung aus den drei Gzip-Stichproben pro Produkt. Der Publish-Schritt dieses Laufs wurde wegen zwischenzeitlicher Stable-Änderung sicher übersprungen; diese Evidenz stammt aus dem tatsächlich aufbereiteten Snapshot, nicht aus einem bestätigten produktiven05:00-Snapshot.

Der theoretische gleiche Inventarstand nach Deduplizierung wäre879847199 Objektbytes. Vor Manifest und zusätzlicher Synoptik wären20152801 Bytes frei;1MB wird konservativ für latest.json reserviert. Das ist eine Gegenrechnung dieses konkreten Inventars, kein bereits veröffentlichter236-RUC-Lauf. Tatsächliche Einsparung und verfügbare Termine werden für jeden Lauf neu berechnet.

## Modellangebot

Die Aufbereitung meldet vollständige Synoptik-Termine für ICON-D2, ICON-EU, ICON Global, GFS und IFS. Der neue Platz wird vor fit_synoptic_budget ermittelt: vorhandene, quellvalidierte optionale Termine dieser Modelle sowie Wolken/Wetter-Termine können erhalten bleiben, statt dem alten knappen Restbudget zu weichen. Der bisherige Prioritätsvertrag bleibt bestehen. Wolken/Wetter besitzt im gemessenen Inventar stündliche nahe Termine bei ICON-D2/EU/Global; daraus folgt kein WMO-Wetterangebot für GFS/IFS. Weitere neue Modellnamen sind ohne Produkt-/Quellvertrag nicht freigegeben.

## Datenvertrag

Deduplizierung nur für Chunk-.bin vor unabhängigen Synoptikobjekten. Jeder Alias wird in pages.chunkKeys als vollständiger immutable runs/<gleicher Lauf>/…-Schlüssel angegeben. Listenlänge entspricht chunkCount; Record-Geometrie und Reihenfolge unverändert. Worker prüft jeden angefragten Verweis vor dem Fetch und lehnt falschen Lauf, Traversal, Query/Fragment, Encodings und unvollständige Listen ab, nutzt sonst alte numerische Chunk-Adressen. Manifest enthält nur physisch vorhandene Objekte, daher funktioniert der vorhandene Hash-geprüfte Restore ohne Sonderweg. Binärformat und quantisierte Werte bleiben identisch; kein Decoder-/Dekompressions-CPU-Aufwand. Gleiche leere/Missing-Chunks dürfen über Produktgrenzen dieselben Bytes teilen, ohne Semantik zu teilen.

Das physische900MB-Limit wird einschließlich tatsächlicher latest.json-Größe geprüft. Die Site950MB-Grenze bleibt unverändert. Bestehende EPS-/Rapid-Projektion unverändert; keine neue Datenreduktion. Kompressionsaudit misst weiterhin alle eindeutigen geeigneten Binärobjekte. Native gzip-JSON-Karten bleiben unverändert. R2/andere bezahlte Backends nicht aktiviert.

## Ortsanzeige

Vorher hatte die Ortsleiste z35, der Suchkopf1000/1820 und teils backdrop blur. Beim Scrollen konnte der Kopf die Ortsleiste überlagern. Ortsleiste jetzt1900, unter modalen Portalen; Kopf-Backdrop bei sichtbarer Ortsleiste abgeschaltet. Browserfixture enthält jetzt den echten Kopf-Selektor und prüft nach500px Scroll sowohl Sticky-Geometrie als auch elementFromPoint/Filter, sechs Viewports, Classic/Next, hell/dunkel und beide Skybar-Modi. Keine physische iOS-/WKWebView-/VoiceOver-Abnahme daraus behaupten.

## Weiter offen

Vollständiger produktiver Kompressionsbericht aus235 oder später; produktiver236-RUC-Gewinn/Terminkatalog nach Stable-Promotion; echte Karten-/iOS-/Geräte-Abnahme, numerische Nähte, vollständige optionale GRIB-Verträge, langfristige SLO-/Alarmzustellung. Die bestehende Freigabekette entscheidet über Veröffentlichung.

Worker-Hotpath: Form/Länge der Liste in O(1), Sicherheitsprüfung ausschließlich des gerade angefragten Schlüssels. Kein O(chunkCount)-Scan pro Kartenpunkt; alle angefragten Aliase werden geprüft. Vergleichsprobe vor Optimierung:1000 PageInfo-Aufrufe mit133 Aliasen ca28ms lokal; kein physisches Geräte-/Cloudflare-CPU-Golden daraus abgeleitet.
