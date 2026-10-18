# MID-C35 · PR #414 Warnungen vervollständigen

Basis: freigegebene .291, main=mid-stable=fbe9c758599928f4b5ba776de670505018750dbb. Vorarbeit #414 @79bd72caa7c652cdf684776c4dbcc2b05b6d3df2 erhalten, allgemeine Geometrie selektiv ergänzt. Suchleisten-Fix ist separat gesichert und ausdrücklich nicht Bestandteil dieses Warnungs-PR.

## Allgemeine Geographie

Keine Produktionsausnahme für Barcelona, einen Ortsradius oder einen fest eingebauten AEMET-Zonencode. CAP-Polygone/Kreise besitzen Vorrang. Öffentliche amtliche MeteoAlarm-Kartenflächen (`areas` im MVT-2.x-Kartenclient) prüfen den Punkt zusätzlich, statt überschneidende Bounding Boxes mit Flächen gleichzusetzen. Zoom 10, Quell-/Kartenquantisierung bleibt bestehen; keine Behauptung metergenauer Originalgeometrie. Löcher und getrennte Flächen, Länderkennung und amtliche Feature-ID werden geprüft; an einer Gitterkante wird konservativ eingeschlossen. Identische amtliche Gebietscodes verbinden Sprachfassungen, niemals fremde Codes oder ausschließende Polygone.

Quelle: öffentlicher Client https://www.meteoalarm.org/assets/index.X7XqSlnj.js und https://visservice.meteoalarm.org/stream-buffers/live/tiles/{z}/{x}/{y}.mvt. EDR-FAQ https://api.meteoalarm.org/edr/v1/faq erläutert die Grenze der Boxen; MVT-Spezifikation https://github.com/mapbox/vector-tile-spec/tree/master/2.1. Gleicher bestehender kostenfreier amtlicher Dienst, keine neue Zugangsdaten-/Bezahlabhängigkeit. Metadaten-API HTTP401 wird nicht umgangen.

Ein zusätzlicher Geometrieabruf parallel zum Index, vollständiger 15-s-Deadline einschließlich Body, 2-MiB- und Decoderbudgets. Gemeinsame UTC-Tages-URL mit 300-s-Cache statt individueller Millisekunden; Warnzeitfenster behalten ihre genaue Referenzzeit. `Accept: */*` ist erforderlich: enger MIME-Header wurde live mit HTTP406 abgewiesen. Bei Ausfall ist der bestehende Box-Fallback ausdrücklich im SourceStatus markiert, keine negative Polygon-Bestätigung behauptet. Noch kein eigener amtlicher Gemeindegrenzenkatalog für alle Länder.

CAP-Detailabrufe bleiben auf 30 begrenzt (zuerst lokal passende Einträge, dann weitere Kandidaten innerhalb des Budgets), da ein dünner Atom-Gebietsname eine tatsächlich passende CAP-Geometrie nicht widerlegen kann. Die früheren Griechenland-/Österreich-Tests prüfen weiterhin den Ausschluss fremder Meldungen und VIS-Nachbaranfragen, verlangen aber nicht mehr den Verzicht auf eine amtliche CAP-Detailprüfung. Ein erfolgreich geladenes räumlich ausschließendes CAP aktiviert keinen Atomfallback und seine explizite Geometrie unterdrückt auch eine identifizierte ältere VIS-Vertretung; nur ein echter Abruffehler darf auf den Index zurückfallen. Große/unvollständige Feeds außerhalb dieses Detailbudgets bleiben eine Abdeckungsgrenze.

## Lebenszyklus

Actual Cancel/Update und Referenzketten werden unabhängig von Reihenfolge transitiv über bestätigte Identitäten verbunden. Der neueste amtliche Zeitpunkt entscheidet vor Textlänge. Ein Storno ohne info sowie ein Update, das das Zielgebiet verlässt oder ausläuft, unterdrücken den alten Eintrag. Die Identitätskette bleibt bis zur Zusammenführung mit möglicherweise älteren VIS-Vertretungen erhalten. Erst nach der Stornoverarbeitung folgt semantische Deduplizierung; eine unabhängige Warnung desselben Ereignisses wird nicht versehentlich mit storniert. Verschiedene Stufen und Zeitfenster bleiben getrennt, Test-Nachrichten werden nicht zu Actual. Keine Veränderung amtlicher Originaltexte oder Schwellen.

## Nachweise und offene Grenzen

- Verlustfrei gesicherter tatsächlicher 22er-Stand vom 18.10. 10:51 UTC: `scripts/fixtures/meteoalarm-barcelona-20261018.json.gz.base64` (vollständige Atom/CAP-Antworten, nur exakte repetitive VIS-Indexzeilen reduziert; ursprüngliche SHA256 dokumentiert). Vier örtliche Warnungen in zwei Zeitfenstern, de/en/es replaybar; Decoder gegen vorhandenen unabhängigen Mapbox-Decoder verglichen.
- Erneuter echter Liveabruf 18.10. 13:49 UTC: `MID_C35_WARNING_LIVE_2026-10-18.json`, HTTP200, vier Warnungen ausschließlich Litoral de Barcelona, erfolgreiche Kartenpolygonprüfung. Keine bloß synthetische Livezählung.
- Ursprünglich vom Nutzer beobachtete 26 Einzelmeldungen sind nicht konserviert. Der synthetische 26er-Test bleibt ein zusätzlicher Regressionstest und ersetzt diesen fehlenden Nachweis nicht. **Issue #411 bleibt offen.**
- Pflichtregressionen: bestehender Barcelona-Test sowie `test-warning-point-geometry-0985292.mjs` und `test-warning-cap-lifecycle-0985292.mjs`. Stornos/Updateketten, unabhängige gleiche Warnung, Sprachcodes, Geometrie, Ausfälle, Stufen und Fenster.
- Keine physische iOS/WKWebView/VoiceOver-Abnahme. #352 RUC, #374 Skybar und #405 Open-Meteo bleiben eigenständig offen.

Veröffentlichung ausschließlich Source-Gate → SHA-gebundener MID-Bot → serverseitiges ZIP → Installer → Worker/Pages → Stable. Dieses Dokument selbst belegt keine Veröffentlichung.

Lokale Validierung: npm ci 202 Pakete; Produktionsaudit 83 Versionen ohne Findings/Providerfehler; TypeScript-/Produktionsbuild und Worker-Syntax erfolgreich. Vollständige 998er-Regression nach fachlicher Ergänzung grün; abschließende Geometrie-/CAP-Lifecycle-/Rhodos-/Österreich-Fokusregressionen ebenfalls grün. Die verbindliche GitHub-CI für den neuen Commit steht noch aus. Direkter Live-Nachweis der Basis .291: version.json und mid-build-identity.json HTTP200, Buildquelle b5d3f0224d915b85f09c8c885b5313540fc6abe3, AssetHash 7589912b6b1bb07cc1f140fb3f853d1c812e189b2b606ae2ad83006e1cb8d9c0.
