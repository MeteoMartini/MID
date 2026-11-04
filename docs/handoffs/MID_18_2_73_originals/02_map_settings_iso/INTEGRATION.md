# Wolken/Wetter: ein Modus, persistente Linien und terminrichtige Konturen

**Basis:** v0.9.85.427 SHA `4d3051f80a17a180c3952c83bf5afa51623b1eb3`. **Status:** SHA-geprüfte *vorgeschlagene* Source-Transformationen mit synthetischen Tests. Keine App-/CI-/iOS-Freigabe.

## Behobene Ursachen im Quellvorschlag

- `cloudWeatherData.ts`: bisher UI-Einstellungen der Isohypsen/Isobaren direkt `localStorage` statt der MID-Durable-Storage-Brücke mit IndexedDB-Mirror. Neue Reads/Writes über `readDurableStorageValue` / `writeDurableStorageValue` bei unveränderten Keys und Standardwerten; `false` und `true` erhalten. Storage-Recover-/Quota-Test ist weiterhin Pflicht.
- `cloudWeatherIsobars.ts::nativeCloudIsobars`: bisher `field.modelId!==undefined` als unzulässig abgelehnt; das blockiert legalen neuen ICON-D2-v2-Feldstatus `modelId==='icon-d2'`. Vergleich auf zulässige `undefined` **oder** `icon-d2`; trotz allem Modell, Run, Time, Einheit und Druckisobaren streng matchen.
- `UnifiedWeatherMap`: synoptischen Druck-Fallback anfordern, wenn native Konturen für den aktuellen Lauf fehlen, leer sind oder der aktuelle Druck-Request konkret fehlschlug; niemals Druckkurven anderer Modellzeiten oder Modelle anzeigen. Bei aktivierten, aber nicht freigegebenen Konturen klaren Status je Isobaren/Isohypsen zeigen, statt den Speicherwunsch heimlich abzuschalten.
- `NativeModelMap`: im `sigwx`-Fall tatsächlich `cloudContours` statt versehentlich `isobars` als GeoJSON zeichnen. Kein Standard-vs-Pseudo-Auswahlbutton mehr. Auch im Export ausschließlich pseudo-Sat-**Modellwolkenbild**, niemals reales Satellitenbild vortäuschen.

## Patch / Sicherheitsgrenze

Bevorzugt einmalig `node 02_map_settings_iso/apply-combined-visual.mjs --apply /path/to/MID`, **nur wenn** der Live-Stable-Head `.427` exakt zu dem dokumentierten SHA passt, die tatsächliche Integration auf einem freigegebenen, **sauberen**, frischen `chatgpt/v0.9.85.428-*`/`codex/v0.9.85.428-*`-Branch erfolgt und alle sechs Quell-Blob-SHAs gleich sind. Alternative Einzeltransforms sind nur für unabhängige Expertenprüfung gedacht; **nicht beide separat nacheinander anwenden**. Auf einem neueren Release den Patch rediffen, nicht die SHA-Sperren entfernen.

## Was noch VOR einer Versionierung fehlt

1. Reale Repo-TypeScript-/Linter-/Buildprüfung gegen alle bestehenden Referenzen auf `CloudWeatherRenderMode`, Cloud-Weather-Control und Darstellungstests. Pseudo-only-Transform entfernt auch die historisch verzweigten SVG-/PNG-Exportausgaben; dies ist derzeit nur mit synthetischen Originalankern geprüft. Der tatsächliche MID-Quellcode muss im Integrationsreview auf **alle** Standardreferenzen und verbleibende JSX-/CSS-/Testreste geprüft werden; keine produktive Freigabe allein durch Transformtest.
2. Alte `mode==='standard'`-Verträge und Snapshot-/Browserfixtures fachlich entsprechend **der ausdrücklich beauftragten neuen Darstellung** fortschreiben, niemals Tests pauschal abschalten. ECCC GDPS WMS bleibt Anbieteroriginal und wird nicht als generiertes pseudo-Satbild fehlbezeichnet.
3. 320/390/430/834/1024/1440 px, Hell/Dunkel, Dynamic Type, Touch, Keyboard, Reload/Tab-/iOS-Restart; beide Checkboxen (einzeln, beide), Persistenz mit überfülltem localStorage, Midmap unter jedem 15-/60min-Slot.
4. ICON-D2, RUC, ICON-EU, ICON Global: `model/run/validUTC` exakt gleich für Cloud/WW, MSLP-Isobaren und 500-hPa-Isohypsen; fehlender Quelltermin bleibt sichtbarer **unavailable**, kein synthetisches Interpolat; auf UI wie PNG/SVG gleiche Konturen. Druck- und Höhenkonturen sind verschiedene Produkte.
5. App-Version/Versionsspiegel/Changelog, Source/Heavy-Gate, bot-controlled Merge, Installer, Worker/Pages/Finalize, Stable und öffentlicher Readback. Kein direkter Hauptbranch-Push und keine Gate-Ausnahme.
