# MID-C35 · Open-Meteo-Vertragsprüfung · v0.9.85.291

## Herkunft und Scope
Verifizierte Arbeitsbasis `main=mid-stable=67b289988ed0ce8433b266c8f2055f070133ffe5`, v0.9.85.289. Offener paralleler PR #412 (.290, Barcelona/CAP) bleibt getrennt; vor Veröffentlichung muss dessen frische freigegebene Basis normal übernommen werden. Issue #405 ist der Prüfauftrag, keine pauschale Freigabe neuer Modelle oder Parameter.

## Reproduzierbarer MID-Befund
Die tatsächlichen Funktionen `finiteSeries` und `rangeSeries` in `scripts/check-api-contracts.mjs` akzeptierten am Ausgangs-SHA je sechs `null`, Leerstrings, Whitespace, `false` oder `true` als sechs echte Werte. Ursache war `Number(value)`. Außerdem konnte der ECMWF-Min/Max-Test eine unterschiedliche Missing-/Zahlenpaarung als Unterschied der Temperaturextrema zählen.

Die gemeinsamen Prüffunktionen in `scripts/api-contract-series.mjs` zählen jetzt ausschließlich endliche Zahlen bzw. nichtleere endliche numerische Strings. Echte 0 und negative Temperaturen bleiben gültig. Mindestens sechs echte Reihenwerte bzw. beim bestehenden Min/Max-Vertrag zwei echte Werte sind weiterhin erforderlich. Lücken dürfen neben ausreichend echten Werten bestehen; bekannte Werte außerhalb der bestehenden Wertebereiche lassen den Vertrag weiterhin scheitern. Ein Min/Max-Unterschied benötigt ein tatsächlich gültiges Zahlenpaar am selben Index. Es wird keine neue vollständige Zeitachsen-/Einheitenvalidierung behauptet.

Pflichtregression `scripts/test-api-contract-nodata-0985291.mjs`: Missing-/Typ-/Null-/Extrem-/Teilabdeckung sowie echte Ausführung des Health-CLI mit HTTP-Fixture. Fehlender Pflichtprovider führt zu Exit 1; fehlender optionaler ARPEGE-Pfad bleibt sichtbare Degradation bei Exit 0. Retry-/429-/5xx-Vertrag und bestehende Provider-Fallbacks bleiben unverändert. Keine Produktionsdaten werden geschrieben.

## Open-Meteo-Upstream, am 18.10.2026 neu gelesen
- [v1.7.0](https://github.com/open-meteo/open-meteo/releases/tag/1.7.0) wurde am 16.10.2026 um 14:09:20 UTC veröffentlicht. Enthält native ICON-/Legacy-Arbeiten sowie konvektiven ICON-Schnee. Daraus folgt keine pauschale Bestätigung aller SDK-Modelle/Variablen für den öffentlichen Forecast-Endpunkt.
- [ARPEGE #2197](https://github.com/open-meteo/open-meteo/pull/2197) wurde am 16.10.2026 um 15:52:18 UTC gemergt, also nach diesem Release. Der gelesene Diff skaliert Strahlungsakkumulationen anhand der tatsächlichen Intervalllänge. Weder GitHub-Merge noch Releasezeit beweisen den Produktionsrollout oder ein historisches Backfill. Keine lokale Division durch drei.
- MID fordert im geprüften `src/weather.ts` und den Worker-Kern-/Fusionskonstanten keine direkte `shortwave_radiation` an. ARPEGE World ist jedoch im Fusionskatalog enthalten und `sunshine_duration` wird verarbeitet. Daher ist eine mögliche indirekte Auswirkung auf abgeleiteten Sonnenschein/historische Lernwerte nicht allein durch fehlenden direkten Strahlungsabruf ausgeschlossen. Ohne nachgewiesene Upstream-Rollout-Epoche und historische Quellobjekte erfolgt keine Änderung alter Werte; diese Untersuchung bleibt in #405 offen.
- [RUC #2186](https://github.com/open-meteo/open-meteo/pull/2186) ist weiterhin offen, nicht gemergt. Beschreibung nennt `dwd_icon_d2_ruc_native`; das ist kein Beleg öffentlicher Produktionsverfügbarkeit. Eigenständige DWD-RUC-Pipeline und bestehende IDs/Fallbacks bleiben erhalten. RRFS, `cloud_ceiling`, `freezing_rain`, `radar_reflectivity` und neue native IDs werden durch diesen Patch nicht freigegeben.
- Context7 lieferte die offizielle DWD-API-Dokumentation: native Variablen unterscheiden sich zwischen Domänen; Modellinitialisierung ist von Bereitstellungszeit zu unterscheiden. Keine Modell-/Gitter-/Schnee-Doppelkorrektur aus allgemeinen Dokumentationsangaben.

## Qualitäts- und Releasegrenzen
Dieser eng begrenzte Patch repariert den API-Prüfer, keine meteorologischen Produktionswerte. #405 bleibt für öffentliche Schema-/Live-Abdeckung und historische Regimeprüfung offen. #344 CSS-Messung, #350 native RUC-Karten, #352 Provider-/Geräteleistung und #374 appweite visuelle Skybar-Abnahme sind getrennte Pakete. #345 Abbruchisolierung ist bereits seit .275 im Source enthalten.

Nur Source-PR-Gate → SHA-gebundener bestehender Release-Bot → serverseitiges ZIP → Installer → Worker/Pages → Stable. Lokale Fixtures sind weder Provider-Livebelege noch physische iOS/WKWebView/VoiceOver-Abnahmen. Erfolgreiche Prüfungen und finaler SHA werden nach Ausführung ergänzt.

## Ausgeführte lokale Prüfungen
- Reproduzierbare Installation: `npm ci --ignore-scripts` erfolgreich, 202 Pakete; Offlineversuch zuvor mangels Cacheobjekt beendet, kein Lockfile-Workaround. Node 24.19.0/npm 11.9.0 lokal, verbindlicher CI-Node-22-Pfad unverändert.
- `npm run build`: Types und Produktionsbuild erfolgreich, 116 Assets; Buildidentität .291. Worker-Syntax erfolgreich.
- Produktionsaudit: 83 Paketversionen, Advisory-Endpoint erfolgreich, keine Findings oder Providerfehler; Dependency-Policy erfolgreich.
- Reale lesende `node scripts/check-api-contracts.mjs`: 4 Kern- und 7 optionale Providerprüfungen bestanden, keine Degradation. Dies belegt die bestehenden angefragten Verträge, keine neue Modell-ID und keine historische Strahlungskorrektur.
- Neue NoData-/CLI-Regressionsprüfung und bestehende Retry-, Health-Resilienz- und Open-Meteo-Update-Prüfungen erfolgreich. Lokale native/unified Karten-Quellprüfungen erfolgreich. Bergwetter-Browsermatrix ausdrücklich SKIP wegen fehlendem Chromium; CI muss echte Browserfälle ausführen.
- PR-Completion-Watcher für #412 ausgeführt: state blocked wegen fehlendem gh. Verbundene GitHub-API liefert die aktuellen SHA-/Job-/Gatebelege. Keine generische Landing-Aktion.
- Vollständiger lokaler Core-Shard: **992/992**, 0 Fehler, 181,0 s (`mid-c35-291-core.log`). Heavy-Browser-/Source-/Installer-Gates bleiben bis tatsächlicher CI-Ausführung offen.

## Zeitgebundene öffentliche API-Proben (18.10.2026, 10:24:03–10:24:05 UTC)
Die bestehende öffentliche Testkoordinate 50.815/7.037 wurde für einen Tag mit GMT abgefragt; keine Modell-/Produktionskonfiguration geändert. Vollständige zusammengefasste Antworten in `MID_C35_OPEN_METEO_API_PROBES_2026-10-18.json`. Das ist eine aktuelle Punkt-/Parameterprobe, keine weltweite oder historische Verfügbarkeitsfreigabe.

| Request | HTTP | Reales Ergebnis |
| --- | --- | --- |
| dwd_icon_d2_native / dwd_icon_eu_native / dwd_icon_global_native, temperature_2m + visibility | 200 | Je 24 Temperaturwerte in °C, aber 24/24 visibility=null bei deklarierter Einheit m |
| dwd_icon_d2_ruc_native, temperature_2m + visibility | 400 | Modellkennung wird als ungültig zurückgewiesen |
| noaa_rrfs, temperature_2m + visibility | 400 | Diese konkrete Modellkennung wird als ungültig zurückgewiesen; keine Aussage zu anderen RRFS-Aliasnamen |
| best_match, je einzeln cloud_ceiling / freezing_rain / radar_reflectivity | 400 | Die jeweils angefragte Variable wird als ungültig zurückgewiesen |

Damit ist der Unterschied zwischen akzeptierter API-Syntax und nutzbarer Feldabdeckung unmittelbar belegt. Die neue Regression prüft auch den gesicherten realen Missing-Reihentyp; ein HTTP-200-Status und korrekt benannte Einheit dürfen keine nicht vorhandene Sichtweite erzeugen. Keine Schätzung als 0 m, keine vorschnelle Umstellung bestehender Modellpfade.
