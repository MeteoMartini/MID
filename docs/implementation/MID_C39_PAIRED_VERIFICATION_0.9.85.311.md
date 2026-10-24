# MID-C39 · gepaarte Prognoseverifikation · v0.9.85.311 Source-Kandidat

## Basis und Parallelstände

Am 22.10.2026 main=mid-stable=8e829d2e1d474f4beb10937194773d65e12c69fe, v0.9.85.309; package/Baseline/Source-of-Truth und AGENTS geprüft. Beide Produktionsbranches protected=true; fünf vorhandene Rulesets aktiv. Keine Schutzänderung. GitHub-Connector-Identität MeteoMartini; Source-Schreibrechte verifiziert. Neuer Branch codex/v0.9.85.311-paired-verification. Draft #443 reserviert .310 für Konturentreue und wird weder übernommen noch überschrieben. #433 bleibt diagnostischer ECMWF-Pilot, Issue #434 sein produktiver Folgeauftrag. RUC #435 ist bereits integriert; alte Handoffs sind keine neue Basis.

## Reproduzierter Fehler und Korrektur

Der neue dynamische Regressionstest schlägt am bisherigen Code fehl: identische Fehler in gemeinsamen Parametern ergeben einen scheinbaren Vorteil, wenn nur eine Prognose zusätzlich einen fehlerfreien optionalen Parameter enthält. Außerdem verwendete der Gesamtbericht unterschiedlich abgedeckte Gesamtarchive, während die adaptive Obergrenze bereits Fallpaare verwendete. Die Aktivierung konnte dadurch auf einer anderen Verbesserung als die lokale Kontrollstatistik beruhen.

Die Vergleichsmaske wird jetzt für beide Seiten pro gespeichertem Prognosestand identisch gesetzt. Nicht gemeinsam auswertbare Parameter sind für beide Missing. Beide Prognosen werden gegen dieselbe unabhängige Messreferenz bewertet. Horizonte werden zuerst innerhalb eines Zieltages gemittelt, anschließend alle Tage gleich gewichtet. Nur berechenbare Paare zählen als Fälle bzw. Tage. Anzeige, adaptive Kontrolldiagnose und Aktivierungsentscheidung verwenden dieselbe lokale Kontrollfunktion. Das ungewichtete Mittel bleibt ausdrücklich als deskriptiver Gesamtarchivwert gekennzeichnet.

Keine Prognosehistorie wird umgeschrieben; keine Rohwerte, meteorologischen Schwellen, Ensemblegewichte oder amtlichen Warnungen geändert. Bestehende Tages-/Score-Skalierung bleibt bestehen. Ein fehlender Parameter führt nicht zu einem Nullfehler. Dies ist eine Korrektur des bestehenden Kontrollvergleichs, keine neue statistische Kalibrierung und kein Nachweis verbesserter Prognosen.

## Nachweise

- Reproduzierbares npm ci aus unverändertem Abhängigkeitsbestand erfolgreich; keine neuen npm-Dependencies. Produktionsaudit: 0 Befunde.
- Types und Produktionsbuild erfolgreich. Erster Volltest: zwei veraltete exakte .309-Versionsassertions sowie zwei RUC-Tests wegen lokal fehlendem requests. Versionstests auf mindestens .309 plus unveränderte Spiegel-/Fach-/Browserverträge korrigiert; lokale Python-Umgebung gemäß tools/ruc/requirements-pages.txt vervollständigt.
- Zweiter kompletter Regressionslauf: 1017/1017 erfolgreich, 133,2 s. Neuer Test prüft gemeinsame Parameter, unpaarige Tage, Nullbelege, fehlende Daten, Horizont-/Tagesgewichtung und Verbindung zum Bericht/Freigabepfad. Bestehende P1-RADOLAN-, Extremmember- und unabhängige Referenztests zusätzlich gezielt erfolgreich.
- Echter Bericht und echte React-Komponente, synthetisches Archiv mit sechs gültigen Paaren und einem absichtlich schlechten unpaarigen Best-Match-Tag: exakt 6 Tage/6 Fälle und 50% statt eines künstlich erhöhten Vorteils. 14 Chromium-Headless-Fälle: 320/390/430px Smartphone, 844px quer, 768px Tablet hoch, 1024px Tablet quer, 1440px Desktop, jeweils Light/Dark; kein Seitenoverflow oder pageerror. Reproduzierbar via node scripts/verify-paired-verification-browser-0985311.mjs; optional MID_PAIRED_QA_DIR für Screenshots. Der Pflichtregressionstest startet dieselbe Browserprüfung im GitHub-Actions-Gate. Kein physischer iOS-/WKWebView-/VoiceOver-Nachweis.
- Browser-Vollchromium scheiterte zunächst am lokalen Unix-Socket-Verbot; reguläres Playwright-Headless-Shell funktioniert. Kein Gate ausgenommen. Lokale Git-/gh-Schreibauthentifizierung fehlt; verbundene GitHub-API wird für den Source-Handoff verwendet, keine Tokenkopie und kein Ersatz-Mergepfad.
- Replit ausschließlich lesend befragt; phase=paused und leere Antwort. Keine bestätigte aktuelle Workspace-Provenienz, keine Änderungen angefordert oder importiert.

## Offener wissenschaftlicher und funktionaler Backlog

| Paket | Aktueller belegter Zustand / nächste sichere Aktion |
| --- | --- |
| Extremwerte Radar/Cluster | .307 im Stable enthält Entkappung, seltene Cluster und Provenienzgate; drei P1-Regressionsprüfungen erneut erfolgreich. Feld-/Reprojektions-/Live-E2E bleibt gesondert. |
| Niederkassel empirisch | Kein lokales Prognose-/Sensorarchiv in diesem Work vorhanden. Keine erfundene Studie. Unveränderte Ausgabeprognosen und unabhängige QC-Messungen für einen vorab festgelegten zeitlichen Holdout paaren; Fallzahlen, Bias/MAE/RMSE, Brier/CRPS und blockbasierte Unsicherheit ausweisen. |
| Ensemblekalibrierung | Gepaarter Kontrollfehler hier korrigiert; Member-Coverage, Quantile und empirische Reliability weiterhin gesondert belegen. Szenarioanteile bleiben Modellgewichte, keine kalibrierten Eintrittswahrscheinlichkeiten. |
| Native ECMWF/RUC | #433/#434 und #352/#443 koordinieren; keine zweite ECMWF-Konsensstimme, keine Aktivierung unvalidierter Raster oder neuer kostenpflichtiger Dienste. |
| P2 / P3 | Modellvergleich, Radar-E2E, PWA-Offlinematrix, Beschriftungen/Provenienz und GitHub-Infobereich aus Screenshot bleiben im Folgebacklog; Z500-Cluster nur nach vollständiger Datengrundlage und belegtem Zusatznutzen. |

Context7-Prüfung der offiziellen Open-Meteo-Dokumentation: Historical Weather ist Reanalyse; Historical Forecast setzt jeweils frühe Laufstunden zusammen. Previous Runs erhält feste Leads, Single Runs den expliziten Modelllauf. Keines davon ist allein eine unabhängige Stationsmessung. Quellen: https://open-meteo.com/en/docs/historical-forecast-api und https://open-meteo.com/en/docs/single-runs-api. Keine neue API-Anbindung aus dieser Dokumentationsprüfung.

## Veröffentlichung

Nur Source-PR mit vollständigem Source-/Browser-/Heavy-Gate, bestehender MID-SHA-Bot, serverseitiges Release-ZIP, install-mid.yml und erfolgreiche Worker-/Pages-/Stable-Gates. Dieser Bericht enthält noch keinen Nachweis einer .311-Promotion. Vor jeder Integration Refs erneut lesen; kein generischer PR-Completion-Merge, kein Direct-Push und kein Force-Update.
