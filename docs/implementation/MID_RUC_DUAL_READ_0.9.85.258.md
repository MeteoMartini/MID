# MID .258 — begrenzter RUC-Dual-Read-Pilot

Ursprüngliche Basis e0f05c5059a6b5e88c377f433e9737423a174393 (.257). MID-C31: nach erfolgreichem Governance-Installer 38683986405 die neue bestätigte Stable-Basis 21497e06947dedabc89758e9ca42d14eb80856bf samt erweitertem AGENTS.md konfliktfrei übernommen; keine offenen Parallel-PRs beim erneuten Abgleich. Decoderarbeit aus MID 18.2.31/.256/.257 wird übernommen.

## Publisher
Nach der bisherigen vollständigen Daten-/Kartenallokation kann prepare_ruc_pages.py eine Byteplane-gzip-Kopie des letzten deterministischen Chunks ergänzen: höchstens ein Chunk und 524288 Originalbytes. Python prüft Roh-SHA, EOF-Geometrie und vollständige Rückdekodierung vor dem Schreiben. Kopie und zusätzliches Manifest müssen strikt ins bestehende 900000000-Budget passen. Ohne Platz oder Kompressionsvorteil bleibt das Ergebnis unverändert. Keine Felder, Karten oder Termine werden dafür entfernt.

Alle Rohobjekte behalten Schlüssel, Bytes und SHA. Dies ist zunächst zusätzliche begrenzte Residency, keine Netto-Speicherersparnis. Vollständige Roh-/Codec-Doppelkopie wäre zu groß. Schema grid.v2 bleibt erhalten; alte Leser ignorieren optionale pages.losslessV1-Metadaten. Codecschlüssel enthalten Lauf und vollständige Wire-SHA. Niemals Codecbytes unter Rohschlüsseln.

## Consumer
Nur deterministischer Punktadapter und explizite Pilot-Healthprüfung aktivieren Codec-Lesen; sonstige Record-Leser bleiben standardmäßig roh. Prüfungen vor Abruf: bekannte Schemafelder, Rohschlüsselbindung, Laufnamespace, SHA-Schlüssel, Integer-/Ausrichtungs-/EOF-Geometrie und Größen. 3-s-Abrufdeadline und bounded Read; .256-Decoder prüft Wire-SHA vor sowie Original-SHA nach Inflate. Nur verifizierte Originalbytes erreichen den Record-Decoder.

Bei gültigem Deskriptor und defektem Codec wird die passende Rohdatei zusätzlich gegen Originalgröße/SHA geprüft. Ebenfalls defekter Rohfallback liefert keine Daten, niemals erfundene Nullen. Ungültige Deskriptoren wählen Legacy-Raw ohne Codecabruf. Rückfall ist diagnostiziert. Fehlabrufe: 30-s-Backoff, maximal vier Einträge. Decodecache: maximal zwei Chunks (1 MiB), gebunden an Ursprung/Rohschlüssel/Manifest; kein Überschreiben des Rohcaches.

## Rollback und Abnahme
MID_RUC_LOSSLESS_CANARY=0 deaktiviert Zusatzpublikation im Publisher-Prozess. MID_DWD_RUC_LOSSLESS_READ=disabled deaktiviert deterministisches Codec-Lesen. Auch active:false, Deskriptorentfernung oder alter .257-Worker verwenden erhaltene Rohdaten. Keine neuen Secrets, Dienste oder Backends.

Pflichtregression: Python-Publisher, unveränderter .257-Leser und tatsächlicher neuer Worker-Punktadapter; Temperatur/Missing/Null, Budget, Rohfallback/Abschaltung, Cacheisolation/Backoff, fremder Lauf, unbekannte Formate, falsche Größen/SHA. Bestehende 65536-Muster-Prüfungen bleiben. Browser erhalten weiterhin Punkt-JSON, keinen neuen Forecast-Codec. Physische iOS/WKWebView/VoiceOver-Abnahme und alte Offline-/SW-Profile vor vollständiger Rohentfernung nicht behaupten.

App-Release allein beweist noch keine aktive Datenkompression. Erst nachfolgender echter erfolgreicher RUC-Lauf mit losslessTransport, unveränderten Rohobjekten und codecPilot.verified=true am deployten Worker belegt den produktiven Pilot. Budget-Skip ausdrücklich melden. Vollständige Rohablösung, größere Chunks, RAM/CPU/SLO-Freigabe und atomare Vollmigration bleiben nächste Schritte.

## MID-C31: zusätzliche Transportprüfung

Die 3-s-Codecdeadline umfasst HTTP-Header und vollständigen begrenzten Body-Read. Ein tatsächlicher Worker-VM-Test simuliert erfolgreiche Header mit stockendem Body, prüft den Signalabbruch und byteidentischen SHA-geprüften Rohfallback. Der globale Legacy-Fetchhelfer bleibt unverändert.

## .259 · unabhängige Installer-Umgebung

Source-Gate .258 (38685505944) war vollständig grün, Installer 38686567282 scheiterte jedoch ausschließlich an der neuen Dual-Read-Regression: lossless_codec_pilot importierte über storage_audit NumPy, obwohl Byteplane-gzip nur stdlib benötigt. Der optionale Delta-Diagnostikpfad lädt seine Audit-Helfer jetzt erst bei tatsächlicher Auswahl. Der vollständige Python-Publisher-/Worker-End-to-End-Test startet die Fixture zwingend mit python3 -S; ein fehlendes Site-Package kann so nicht mehr vom lokalen oder Source-Gate-Umfeld verdeckt werden. Keine zusätzliche Dependency installieren und kein Gate verändern. .258 wurde nicht promotet. Die neue .259 übernimmt den vollständigen Pilot von #366 und ändert weder Wirebytes noch Wetterwerte.
