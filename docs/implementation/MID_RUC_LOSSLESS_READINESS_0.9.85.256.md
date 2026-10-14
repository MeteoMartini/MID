# MID v0.9.85.256 – RUC lossless candidate: Browser-/Worker-Decoder und Realinventar

## Evidenzbasis
- Freigegebene Ausgangsbasis: MID v0.9.85.255, mid-stable SHA dad31ca761293d055eb85bc0542648b3dd5cc8b3, main identisch (14.10.2026). Der erste isolierte .254-Prototyp bleibt im Branch chatgpt/v0.9.85.256-ruc-lossless-js-validation gesichert und wird nicht direkt integriert.
- Die produktive RUC-Transportstruktur bleibt `mid.dwd.ruc.grid.v2` mit `pages-free-v1` und 900.000.000 Byte Obergrenze. Dieser PR führt **keine** komprimierte Produktion ein; keine Änderung am Publisher, Forecast, Worker oder Datenformat.
- Vollständiger echter Speicherbericht: GitHub-Actions-RUC-Prepare-Job 116063908286 im Run 38625621557; DWD-Lauf 2026-10-14T18:00, 1.292 Objekte, exakt 898.726.289 publizierte Bytes und 1.273.711 Byte Reserve.
- Vollständiger, hashverifizierter Candidate-Scan: unverändert 898.726.289 Byte; nur gzip-Kandidat 303.567.703 Byte; Byteplane+gzip-Kandidat 262.669.573 Byte. Rechnerische Byteplane-Ersparnis 636.056.716 Byte (~70,77 %) gegenüber dem **gleichen** veröffentlichten Inventar, kein produktiver Speichergewinn und keine Transportlatenz-Zusage. Modellsynoptik/andere nicht geeignete Payloads bleiben im Kandidatenbestand unkomprimiert.
- Erfolgreicher RUC-Publish-/Worker-Nachweis: Job 116077028489, 2026-10-14T18:00, Worker `backend=pages`, 542.040 Rasterpunkte, 20 EPS-Mitglieder. Aktuellere Läufe separat überprüfen, bevor eine Produktmigration erwogen wird.

## Implementierter nicht-produktiver Decoder
- `tools/ruc/lossless_candidate_decoder.mjs` ist ein unabhängiger Laufzeitdecoder mit identischem Wirevertrag zu `tools/ruc/lossless_codec_pilot.py`: exakt sechs Manifestfelder, Schema `mid.ruc.lossless-candidate.v1`, codec `gzip`, `byteplanes-gzip` oder `delta-byteplanes-gzip`, `decodedBytes` maximal 2.000.000 und `encodedBytes` maximal 2.100.000.
- SHA-256 für Wire **vor** dem Entpacken und für wiederhergestellte Originalbytes **danach**, strikte Größen-/Ausrichtungsprüfung, streaming-bounded gzip-Inflate; keine stillen Fallbacks auf Rohdaten oder andere Codecs. Unerwartete Schemafelder und ungültige Hashes werden abgewiesen.
- `tools/ruc/test_lossless_candidate_decoder.mjs` prüft 65.536 int16-Muster (einschließlich `-32768`-Missing), drei weitere Byteprofile, drei echte Python-gzip-Golden-Payloads, truncation, corruption, Hash-Abweichungen, Dekompressionsbombe und aneinandergehängte gzip-Member.
- `scripts/test-ruc-lossless-candidate-0985256.mjs` läuft als eigener Source-/Installer-Kernregressionstest; kanonische Inventare in `MID_BASELINE.json` jetzt 969/969 statt 968/968. Keine Entfernung, keine Skips, keine Gate-Verlängerung.
- Node.js/WebStreams-/SubtleCrypto-Test beweist eine kompatible API, aber **keine** physische iOS-/WKWebView-/VoiceOver-Geräteabnahme.

## Noch vor einer produktiven Codec-Aktivierung zwingend
1. Reale Web-/Cloudflare-Worker-Consumer-Pfade und Offline-/Service-Worker-Caches mit strikt versioniertem Dual-Read migrieren; alte `grid.v2`-Clients müssen ihre alten Rohdaten weiter lesen können. Komprimierte Chunks nie unter alten, als Rohdaten interpretierten Schlüssel veröffentlichen.
2. Manifestobjekt um `encoding`, Wire-/Original-SHA, Wire-/Originalgröße, maximale Inflate-Größe, eindeutig immutable Blob-Keys und Chunk-Geometrie erweitern; getrennte Publisher-/Worker-/Browser-Contracttests und Release-Fallback in jeder Richtung.
3. Canary mit vollständigen realen Feld-/Zeitreihen, Missing, meteorologischen Golden-Tests, SLO-/Frischekontrolle, Budget und First-Tap-/Karten-Performance in 320–1440 px, Light/Dark, Classic/Next; anschließend ggf. physische iOS-/WKWebView-Prüfung.
4. Erst nach erfolgreicher unabhängiger Source-, Installer-, Worker-/Pages- und Stable-Releasekette produktive Doppel-Lesephase/atomare Daten-Promotion. Codec-Versagen darf weder das RUC-Hauptprodukt stillschweigend als Nullwerte erscheinen lassen noch ältere Clients unbrauchbar machen.

Die gemessene volle Kandidatengröße ist **kein** Beleg dafür, dass der gesamte produktive Pages-Aufbau sofort um 70 % verkleinert werden kann: Vor Veröffentlichung sind Cache-Verhalten, tatsächlich gewählte Codes, Laufzeit und parallele Alt-/Neudaten-Residency separat zu messen.
