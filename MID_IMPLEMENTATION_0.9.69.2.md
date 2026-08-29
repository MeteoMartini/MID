# MID v0.9.69.2 – privater RUC-R2-Betrieb, Retention und Health

## Ziel der Etappe

Der in MID 17.7.3 vorgesehene kostenarme Produktionspfad wird bis zum realen Cloudflare-Kontogate gehärtet, ohne den gemeinsamen Browser/PWA/iOS-Fachkern aufzuteilen:

`DWD Open Data -> GitHub Actions/ecCodes -> verdichtete RUC/RUC-EPS-Produkte -> privates Cloudflare R2 -> gemeinsamer MID Worker -> React/Vite Browser/PWA/iOS`.

## Private-by-default / Berechtigungen

- `r2.dev` wird beim Einmal-Bootstrap ausdrücklich deaktiviert. MID benötigt kein öffentliches Bucket und kein Custom Domain.
- Ein Custom Domain bleibt nur als optionaler, separat freizugebender Pfad (`MID_RUC_PUBLIC_DOMAIN_APPROVED=true`) vorbereitet.
- Der Einmal-Bootstrap verwendet R2-Administrationsrechte nur für Bucket/Privatmodus/Lifecycle und optional Worker-Scripts-Read zur Binding-Prüfung.
- Der stündliche GitHub-Publisher ist davon getrennt und kann mit einem auf genau den RUC-Bucket beschränkten R2 Object Read & Write Token betrieben werden; Bucket-Administration ist im Stundenjob nicht erforderlich.
- Die bestehende Worker-Binding-Liste wird vom Bootstrap nicht per Settings-PATCH rekonstruiert. Fehlt `MID_DWD_RUC_DATA`, wird ein klarer einmaliger manueller Gate gemeldet, damit bestehende Secret-/KV-Bindings nicht gefährdet werden.

## Atomizität / Retention

- `latest.json` bleibt atomarer Pointer auf genau einen vollständigen immutable Run.
- Vor einem neuen großen Upload darf der Publisher verwaiste/alte Präfixe entfernen, aber niemals den durch das aktuelle `latest.json` referenzierten Fallback.
- Nach vollständigem Upload und Remote-Größenprüfung wird `latest.json` zuletzt ersetzt; erst danach darf der alte Fallback aus der Vier-Run-Retention herausfallen.
- Ein identischer bereits vollständiger Lauf ist idempotent und erzeugt keine neuen PUTs.
- Zusätzlich räumt Cloudflare nach 48 h verwaiste `runs/`-Objekte als zweite Leck-Sicherung auf. Diese Frist ist absichtlich länger als die normale Publisher-Retention, damit ein vorübergehender Pipelineausfall nicht unnötig früh den letzten vollständigen Run entfernt.
- Cloudflares aktueller Location-Hint-Vertrag wird validiert (`weur`, `eeur`, `enam`, `wnam`, `apac`, `oc` oder leer/automatisch).

## Operativer Health-Pfad

Der gemeinsame Worker besitzt `?mode=ruc-health`. Er prüft ohne GRIB-Decodierung und ohne Offenlegung von Bucketnamen/Credentials:

- R2-Binding vorhanden,
- `mid.dwd.ruc.grid.v2`-Schema,
- Run/GeneratedAt und Laufalter,
- 0–14-h-Zeitreihe/Punktzahl/EPS-Memberzahl,
- tatsächliche Existenz von Lookup, Deterministik, EPS-Summary und Event-EPS-Memberobjekt per R2-HEAD,
- `ready` nur bei frischem und vollständigem Lauf.

Ein alter oder unvollständiger Lauf bleibt als Diagnose sichtbar, wird aber nicht als produktiv `ready` gemeldet. Die eigentliche Forecast-Fusion fällt weiterhin auf Best Match/ICON-D2 beziehungsweise ICON-D2-EPS zurück.

## Aktivierungsfolge

Der Release aktiviert weder R2 noch die Stundenpipeline. Nach R2-Checkout, Bootstrap-Token und GitHub-Secrets wird der Einmal-Bootstrap ausgeführt. Danach wird bei Bedarf das Worker-Binding einmal ergänzt, ein manueller RUC-Preprocess-Lauf gestartet und `ruc-health` geprüft. Ist `MID_RUC_WORKER_HEALTH_URL` gesetzt, führt der Preprocess-Workflow diesen produktiven Smoke nach jedem Publish automatisch aus und verlangt exakt den gerade veröffentlichten Run. Erst bei `configured:true`, `ready:true`, `fresh:true` wird `MID_RUC_PIPELINE_ENABLED=true` dauerhaft gesetzt.

## Plattformvertrag

Browser/PWA und iOS verwenden unverändert denselben React/Vite-Fachkern und denselben Worker. Die Etappe enthält keinen iOS-Fork, keine native Wetterberechnung und keine neue lokale Persistenz.

## Regression / Freigabe

- `tools/ruc/test_cloudflare_r2_bootstrap.py`: private-by-default, aktueller Location-Hint, Lifecycle, Kosten-Gate, Binding-Verifikation ohne Worker-PATCH.
- `tools/ruc/test_publish_ruc_r2.py`: Fallback-sicherer Preflight, atomarer Pointerwechsel, Post-Publish-Retention, idempotenter Null-Write-Zweitlauf.
- `tools/ruc/test_ruc_pack.py`: kompakter Wire-/Metadatenvertrag.
- `scripts/test-ruc-dwd-pipeline-09690.mjs`: DWD-/Actions-/Kosten-/Retentionvertrag.
- `scripts/test-ruc-fusion-runtime-09691.mjs`: echte RUC/RUC-EPS-Workerfusion mit Summary-Normalpfad, Event-Memberpfad und Gewittersperre.
- `scripts/test-ruc-storage-health-09692.mjs`: frischer, stale, unvollständiger und unkonfigurierter R2-Zustand sowie echter Router-Smoke.
- `tools/ruc/test_ruc_health_check.py`: Post-Publish-Prüfung akzeptiert nur den exakt veröffentlichten frischen/ready Run.
- Vollständige parallele MID-Suite nach Versionssynchronisierung: **550/559 bestanden**. Die 9 übrigen Tests starten ausschließlich wegen der beschädigten lokalen Dependency-Installation nicht: 7 benötigen das fehlende lokale TypeScript-Paket/Binary, 2 das fehlende `esbuild`; **0 fachliche Assertion-Fehler**.
- TypeScript-5.9.3-Lauf, Vite-Produktionsbuild und `cap sync ios` sind lokal nicht ausführbar, weil `node_modules/.bin/{tsc,vite,cap}` fehlen; die npm-Registry bleibt mit `EAI_AGAIN` unerreichbar. `npm audit` ist aus demselben Grund netzwerkblockiert.
- Worker-Syntax bestanden; `worker.js` und `worker/metar-proxy.js` sind byte-identisch. Cross-Platform-, iOS-Safe-Area-, Workflow-Pin- und Workflow-Selbstmodifikationsschutztests sind grün.
- Die reguläre Release-CI muss nach erfolgreichem `npm ci` TypeScript, Vite, die 9 compile-basierten Tests und Capacitor-Sync nachholen.

## Worker-Release

Worker-Upload **erforderlich**, weil der gemeinsame Worker um `ruc-health`, robustere RUC-Metadatenzeitinterpretation und R2-Vollständigkeitsdiagnostik erweitert wird.
