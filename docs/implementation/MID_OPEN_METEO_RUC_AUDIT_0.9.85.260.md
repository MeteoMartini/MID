# MID-C31 · RUC-Betriebsnachweis und konsolidierte Open-Meteo-Prüfungen

Prüfstand: 15.10.2026. Verifizierte Releasebasis: MID 0.9.85.259,
main = mid-stable = `9c0cd7cd0da3dcbd1d6cd72fc9ec1ad90311b021`.
Installer [38689707057](https://github.com/MeteoMartini/MID/actions/runs/38689707057)
erfolgreich. Frühere Chatangaben wurden gegen aktuelle Repository- und originale
Upstream-Metadaten geprüft. Offene Dependency-PRs #340/#339/#338/#253/#252 sind
separate Arbeit; keine davon wird mit dieser Änderung integriert.

## RUC: nachgewiesen und noch offen

Die nachfolgenden echten RUC-Läufe 38691001963, 38692385170 und
[38697017928](https://github.com/MeteoMartini/MID/actions/runs/38697017928)
auf exakt der .259-Basis waren erfolgreich. Der letzte publiziert den Lauf
`2026-10-15T06:00`, einschließlich
`runs/2026-10-15T0600/lossless-v1/826c5f4bb323d86d5c13d570b63e5ed750f7e47acd4ab9d22463269f4f7053e7.bin`.
Der vollständige Produktumfang liegt bei 899064994 Bytes, 935006 Bytes unter
dem unveränderten 900000000-Byte-Budget. Der Storage-Audit nennt für den letzten
deterministischen Rohchunk 492480 Bytes und für dessen Byteplane-gzip-Probe
224323 Bytes. Das ist eine Chunkmessung, keine Gesamtspeicher-Einsparquote.

Der deployte Worker bestätigte um 07:28:04 UTC den aktuellen Lauf, 542040 Punkte,
20 EPS-Mitglieder sowie frische, schema- und objektgültige Daten. Das bisherige
Health-CLI protokollierte `codecPilot` nicht. Daher beweisen diese bisherigen
Logs noch kein erfolgreiches Codec-Lesen am Worker. Direkte zusätzliche
Live-Abfragen waren in der Prüfungsumgebung blockiert; daraus folgt kein
Produktionsausfall.

.260 protokolliert nach unverändert erfolgreichem Health-Gate zusätzlich
`MID RUC codec evidence` mit Lauf, publiziertem Pilot, Zusatzbytes, Advertised-,
ReadEnabled-, Verified-, Transport-, Chunk-, RawRetained- und Fehlerstatus.
`verified:true` wird nur für einen publizierten Pilot mit explizit aktiviertem,
vom Worker verifiziertem Byteplane-gzip-Read und beidseitig erhaltenen Rohdaten
ausgegeben. Fehlende Diagnostik, ausgeschalteter Leser und Rohfallback bleiben
sichtbar `verified:false`; sie werden niemals aus allgemeinem `ready:true`
als Kompressionserfolg abgeleitet. Der laufgebundene Basis-Gate und alle
Rollbackwege bleiben unverändert. Der nächste echte RUC-Lauf liefert damit
den bisher fehlenden protokollierten Betriebsnachweis oder einen konkreten
offenen Codecstatus.

Rohdaten werden nicht entfernt. Der Pilot erzeugt begrenzte zusätzliche
Residency; vollständige Migration, Nettoeinsparung, größere Chunks,
Geräte-/Offline-/Altclient-Abnahme und CPU/RAM/SLO-Freigabe sind weiter offen.
Details und Kill-Switches: `MID_RUC_DUAL_READ_0.9.85.258.md`.

## Open-Meteo: übernommene historische Befunde

Der frühere Bericht `MID-OpenMeteo-Watch-20260912.md` wurde vollständig gelesen.
Seine Aussagen werden als historischer Prüfstand übernommen, nicht als neue
Produktionsbeobachtung:

| Befund | Einordnung für MID |
| --- | --- |
| KMA LDPS/GDPS eingestellt; KIM nicht als verifizierte API-ID verfügbar | Keine erfundene KIM-ID. Bestehende JMA-/best_match-Route und Modellfamilienverträge beibehalten. |
| AROME France HD: native 15-Minuten-Niederschlagsintervalle, upstream #2120 | Serverseitige Rekonstruktion rechtfertigt keine zusätzliche Client-Interpolation oder Skalierung. |
| Open-Meteo v1.6.0: Marine-Reader, NoDataError, Unix-/NaN-/AQI-/SIS-Korrekturen | Kein aus diesem Bericht belegter inkompatibler Forecast-API-Wechsel. Missing bleibt Missing. |
| MID .245: geteilte Transportabfragen, unabhängige Verbraucherabbrüche, 429/Retry-After | Bereits implementiert; siehe `MID_OPEN_METEO_GUARD_0.9.85.245.md` und tatsächliche Multicaller-Regression. Nicht erneut patchen. |

## Originale Upstream-Prüfung vom 15.10.2026

PR-Status und Merge-SHA stammen aus den originalen GitHub-Metadaten von
open-meteo/open-meteo. Ein Mergezeitpunkt ist kein nachgewiesener API-Rollout.

| Originalquelle | Verifizierter Stand | Konsequenz |
| --- | --- | --- |
| [#2205](https://github.com/open-meteo/open-meteo/pull/2205) | merged 13.10.; `4633aa1250c8495539d7d988e1112281628339e5`: fehlende Temperaturextrema aus Hermite-Intervallen; Tagesintervalle inklusive folgendem Mitternachtsintervall | Keine zweite Tagesaggregation/Korrektur im MID-Client. Historische Prognosen können andere Datenqualität haben. |
| [#2204](https://github.com/open-meteo/open-meteo/pull/2204) | merged 13.10.; `713bed562292d72d92bac6b0f6349359d286bcb5`: rückwärts bezogene Mittelwerte/minTwo/maxTwo/sum | Zeit- und Akkumulationssemantik beibehalten; keine pauschale Zeitschrittverschiebung. |
| [#2202](https://github.com/open-meteo/open-meteo/pull/2202) | merged 13.10.; `768e7a74b0cd8eaa9712bcc9466d1d153c297dc8`: ECMWF Tagesminima/-maxima und IFS/AIFS-025-Trennung | Kein daraus belegter erforderlicher MID-API-Patch. Produktionsrollout nicht unabhängig bestätigt. |
| [#2180](https://github.com/open-meteo/open-meteo/pull/2180) | merged 06.10.; `a5aac75ca4aed1e1a97dd7e09564f0e06a8359f0`: GEM-Akkumulation nach tatsächlichem Schrittintervall | GEM Global Strahlung nach +84 h historisch bis Faktor 3 betroffen; Ensemble ggf. ab +192 h. Keine blinde Division aktueller Werte, kein belegtes historisches Backfill. |
| [#2157](https://github.com/open-meteo/open-meteo/pull/2157) | merged 28.09.; `b06f4760fd1f997e5559bb380f64c5e496b4a509`: HRRR/NAM Windrichtung gitterrelativ → geografisch Nord | Historischen Kalibrierungsbruch beachten; keine erneute Windrotation im Client. |
| [#1993](https://github.com/open-meteo/open-meteo/pull/1993) | merged 03.10.; `1cd0eaa1ed97857772a6bd968bbe373bd23636f3`: native ICON-Gitter | Kein Zwang zu unvalidiertem Aliaswechsel. |
| [#2160](https://github.com/open-meteo/open-meteo/pull/2160) | merged 12.10.; `e75818015239921b194b38ee147b2c1af639b15a`: ICON-v1-/EPS-Umstellung, Termin 30.11.2026 | Native Abdeckung und Auflösung beachten; Visibility kann im neuen Feed fehlen und wird nicht als 0 ersetzt. Upstream nennt gestaffelte Inbetriebnahme. |
| [#2176](https://github.com/open-meteo/open-meteo/pull/2176) | merged 12.10.; `735f488affdb3d8332df878ac7508d12bc51a42c`: Legacy-ICON-Aliase mit nativem Fallback | Bestehende Aliase nicht vorschnell ersetzen. Bounding-Box-/Randabdeckung und Missing weiterhin prüfen. |
| [#2187](https://github.com/open-meteo/open-meteo/issues/2187) | Issue offen: HRRR Stundenböen bei minutely_15 möglicherweise Momentanwert statt vorausgehendes Stundenmaximum | Offener Upstream-Befund, kein belegter Fix; keine erfundene Böenskalierung. |
| [#2186](https://github.com/open-meteo/open-meteo/pull/2186) | PR offen und Draft: ICON-D2 RUC | Draft-ID nicht als produktiv behandeln; MID-DWD-RUC nicht dadurch ersetzen. |

## Grenzen und Folgeschritte

Die bestehende Forecast-Verifikation speichert keine gesichert beobachtete
Upstream-Rollout-Epoche. Daher historische Lern-/Kalibrierungsdaten nicht anhand
eines GitHub-Mergezeitpunkts löschen, umrechnen oder rückwirkend als korrigiert
kennzeichnen. GEM-/HRRR-Vergleiche müssen den möglichen Datenbruch kenntlich
machen. Diese Änderung verändert keine meteorologischen Werte oder API-Modelle.

[MID #345](https://github.com/MeteoMartini/MID/issues/345) beschreibt einen
separaten Verdacht auf gemeinsame `directRequestSignal`-Zustände in parallelen
normalen/erweiterten Browser-Fallbackabfragen. Ein vollständiger Laufzeitnachweis
mit verzögerten Folgeabrufen und wechselseitigen Abbrüchen steht noch aus.
Diese Dokumentation erklärt ihn nicht für behoben. Ein späterer Fix muss über
den kanonischen Generator erfolgen und .245-Deduplizierung/Retry-After erhalten.

## Validierung

Die vorhandene RUC-Health-Regression prüft nun zusätzlich echte, fehlende,
deaktivierte und auf Rohdaten zurückgefallene Codecdiagnostik sowie strikte
Boolean-Semantik. Bestehende Konvergenz-, falscher-Lauf-, stale-, Schema- und
Rollbackprüfungen bleiben erhalten. Source-PR- und Installer-Ergebnisse sind
erst nach ihrem tatsächlichen Abschluss Releasebelege; keine Vorabfreigabe.

Lokale Ergebnisse: reproduzierbares `npm ci`, TypeScript-Prüfungen und
Produktionsbuild erfolgreich. 970/971 Regressionen bestanden beim ersten Lauf;
die Bundle-Budget-Prüfung zählte alte und neue generierte Hauptdateien gemeinsam.
Nach Weglegen des alten generierten dist-Verzeichnisses: frischer Build,
Bundle-Prüfung (1442963/1500000 B JS, 1759989/1760000 B CSS) und abschließende
RUC-Health-Regression erfolgreich. Keine Budgetanhebung oder Testabschwächung.
Produktionsaudit: 0 Befunde; Gesamtaudit: 3 moderate, 0 hohe/kritische Befunde.
