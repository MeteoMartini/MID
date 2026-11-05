# MID v0.9.85.431 – belegte Open-Meteo-Betriebspflege

Basis: freigegebenes v0.9.85.430, main=mid-stable `e9b798a42d7e0e55e07d83858c92a6eaa04a96a9`. Vorherige #657/#660-UI-/Cache-Änderungen bleiben vollständig enthalten. #658 wird auf ausdrücklichen Nutzerauftrag in diesem gemeinsamen .431-Kandidaten veröffentlicht: passive, nur auf ausdrücklichen Auftrag gestartete Handoff-Utility, keine automatische Ref-/PR-/Release-Mutation aus Kilo.14 isolierte Tests und reale #659-Teilrechte sind nachgewiesen; die erste vollständige Live-Nutzungsabnahme aus Kilo bleibt separat offen.

## Originalquellen und wiederverwendete Evidenz

- Vollständiger heutiger Watch: https://github.com/MeteoMartini/MID/issues/405#issuecomment-6651699382 .
- Unveränderte3 Metadaten-/2 kleine3h-Forecastantworten mit Längen, Zeitstempeln undSHA256: https://github.com/MeteoMartini/MID/tree/c8f9ff6029082403f775a5294f0c4450bc44a66b/docs/evidence/openmeteo-2026-11-05 . Kein erneuter Datenabruf für diese bereits beantworteten Fragen.
- GeoSphere-Sunset/C-LAEF: https://open-meteo.com/en/docs/geosphere-austria-api . AROME seit04.11. eingestellt; damaliger AROME-Run04.11.03Z war bei HTTP200 bereits>28h alt.
- Quotenvertrag: Open-Meteo-Commit `aeab72e33f6a30f1a87d1b5444fd169d536ce914` (RateLimiter, API-Key-Handling und Quoten-Dokumentation). Context7-API-Dokumentation zusätzlich geprüft; die genaue neue Headersemantik aus diesem primären Commit verifiziert. `Reset` ist absolut inUnix-Sekunden; Window60/3600/86400,Remaining nach Gewichtung,Cost kann bei Quoten-429 fehlen.

## Endgültiger Scope

AROME wird vor sämtlichen fünf aktiven Verbraucherpfaden ausgeschlossen: Modellstand/Metadaten, hyperlokaler Hintergrund, Bergwetter, Worker-Fusion und Phasenraster. Alte Kennungen/Labels/Gebiete dienen weiterhin historischer Provenienz; ein alter Modellstandcache darf sie nicht reaktivieren. Bestehende aktive DWD-/MeteoSwiss-/globale Fallbacks bleiben erhalten. Kein C-LAEF-/RRFS-Fusionsstart aus einem Einzelpunkt-Canary.

Client und Worker prüfen dieselbe begrenzte numerische Headersemantik. Erfolgreiche Bodies bleiben unverändert. Der Client setzt die Quotenpause vor Transportfreigabe, weist bei langer Pause bereits wartende Requests mit dem vorhandenen RateLimitError zurück und entfernt deren Abort-Listener. Vorhandene TTLs, max2Transportslots, URL-Allowlist, Abort-/Dedupe-/Retry-After-/Timeout-Verträge bleiben erhalten. Der Worker sperrt nur weitere gebührengewichtete `/v1/`-Abrufe derselben bekannten Free-API-Origin und antwortet währenddessen429/no-store; fremde Anbieter, andere API-Origins und Metadaten werden dadurch nicht geblockt. Keine Wetterwerte werden synthetisiert oder umgerechnet.

## Prüfung und Releasegrenzen

53 deterministische Quotenfälle prüfen Minute/Stunde/Tag,absolute vs.relative Zeit,teilweise/falsche Header,gewichtete Restquote,fehlendenCost,erfolgreichenBody,Queued-Slot-Rennen,langenCooldown,Abort-Listener,Retry-After,Origin-/Metadatenisolation und Wiederaufnahme. Bestehende Multicaller-/Cache-/Fallback-/Bergwetter-/Gebietstests bleiben erforderlich. Der GeoSphere-Test übt die tatsächlichen Selektoren und direkte Fetch-Einstiege samt altem Phasen-/Modellstandcache aus; null Netzaufrufe für eingestelltes AROME. Die vormals rein formatgebundene BBox-Assertion wurde um die exakt definierte vorgeschaltete Sunset-Sperre aktualisiert; BBox-vor-Länderfallback und grenzüberschreitende aktive Quellen bleiben positiv/negativ geprüft.

Keine `tools/ruc/`-/RUC-Produzenten-/RUC-Decoder-/Source-Workflow-Änderung: der unveränderte vertrauenswürdige Source-Classifier muss deshalb keinen neuen3-DWD-Originalrun anfordern. Keine Originaldaten-Massenläufe,kein Ruleset-/Budget-/Schlüsselwechsel. Keine RUC-P0–P5-/168h-/P95-/Mitglieder-/Gitterfreigabe aus dieser Betriebspflege ableiten. Neue Modellintegration sowie NAM-/HRRR-/ICON-Migration werden weiter in #405/#509/#636 qualifiziert.

Ein tatsächlicher App-Build benötigt synchronisierte .431-Versionsspiegel/Changelogs und alle regulären Source-/Core-/Heavy-/Chromium-/Installer-/Worker-/Pages-/Stable-Gates. Worker enthält fachliche Abrufänderung und muss diesmal tatsächlich .431 deployen; ein reiner .410-Wiederverwendungsnachweis reicht hierfür nicht. Lokale Tests sind kein exakter Remote-Head-/Releasebeweis.
