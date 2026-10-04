# MID v0.9.85.164 · MID-C16

Verifizierte Basis: main = mid-stable = 7a9066bbb0b6babc03fc44dff93bcd6f815cddfe (.163), sauberer frischer Checkout. Keine offenen PRs bei Beginn. Integrationsbranch codex/v0.9.85.164-c16-outlooks.

## Fachlicher Vertrag

- Die 15-Minuten-Himmelsreihe erhält Bewölkungsdeltas relativ zur ursprünglichen Modell-Stundenreihe, vor RUC-/Mehrquellen-/Twin-Fusion. Die bisherige twinHours-Basis verschluckte bereits erfolgte RUC-Korrekturen. Niederschlagsakkumulationen und Wahrscheinlichkeitsdeltas behalten twinHours als Basis: keine doppelte Fusion.
- Stundenfusion verwirft alte Modell-Sonnenscheindauer bei mindestens einem Okta Wolkenänderung, wenn die neue Quelle keine eigene Dauer liefert. Viertelstunden-Reconciliation nutzt die korrigierte Viertelstundenbewölkung. WMO-Sonnenscheindauer wird niemals aus dem Wolkenkomplement erfunden. Dies ist dieselbe dokumentierte MID-Provenienzregel wie .163.
- Saison-Niederschlagsabweichung: 100 × Anomalie / positives Monatsmittel des zugehörigen Modellklimas. Modellreferenzen werden nicht zwischen unabhängigen Modellen ausgetauscht. Native Prozentwerte bleiben erhalten; unbekannte/nichtpositive Referenz bleibt fehlend. Keine willkürliche Begrenzung auf ±300 %. Die gemeinsame Linie mittelt die verfügbaren unabhängigen Prozentwerte, nicht mm-Werte. Roh-Anomalien aller Modelle bleiben im absoluten Einzelmodellvergleich erreichbar.
- Echte vollständige SEAS5-Mitgliedsmonate werden zu K-Temperaturanomalien und Prozent-Niederschlagsanomalien umgerechnet. Die zugehörige Referenz stammt ausdrücklich aus demselben Open-Meteo-SEAS5-Monatsabruf (Modellmittel minus gelieferte Anomalie). Diese Referenz bleibt mit den Roh-Mitgliedern verbunden, auch wenn der C3S-Adapter bei der Ensemble-Deduplizierung Vorrang erhält. Keine ERA5-/Fremdmodellreferenz, keine erfundenen Member, keine Monatsinterpolation, Lücken bleiben Lücken.
- Neuer Saisoncache v6 verhindert Wiederverwendung von Bundles ohne verknüpfte Mitgliedsreferenz. Früher fehlende Referenzen erzeugen bis zur Neuladung keinen falschen Anomalienplot.
- Monatsachsen behalten alle Monate. Bei ausreichender Breite Langlabel, sonst 10/26; nötigenfalls Diagramm horizontal scrollbar, Beschriftungen bleiben mindestens 12 px. Keine Ausdünnung der Monate oder Verkleinerung unter lesbare Bildschirmgröße.
- Die vorhandene ECMWF-Farbeinstellung bleibt zentral in mid:forecastDisplaySettings gespeichert; vorhandene Widget-Einstellung bleibt separat gespeichert. Kein unnötiger neuer Einstellungsvertrag.

## Quellen

ECMWF: Anomalien gegen das aus Hindcasts abgeleitete Modellklima: https://www.ecmwf.int/en/forecasts/datasets/seasonal-13-month-forecast-vii-ii-monthly-mean-anomalies-ensemble-means-single-level und https://www.ecmwf.int/en/forecasts/datasets/seasonal-13-month-forecast-vii-iv-monthly-mean-anomalies-individual-ensemble-members-single-level.
Open-Meteo: https://open-meteo.com/en/docs/seasonal-forecast-api. API-Monatsmittel und Anomalien aus dem gleichen Modell bilden die Referenz für die vorhandenen vollständigen Tagesmitglieder. Diese Operation ist ein dokumentierter MID-Ableitungspfad, keine zusätzliche Kalibrierung oder Skillbehauptung.

## Prüfung

908/908 Regressionen auf dem ersten Integrationsstand bestanden. Neue ausführbare Datenregression für native Prozentwerte, fehlende/ungültige Referenzen, keine Begrenzung großer positiver Abweichungen, Memberumrechnung ohne Mutation und späte RUC-Fusion. Historische Literalguards erhalten alle Assertions und berücksichtigen nur den zusätzlichen skyBaseHours-Eingang bzw. den Cache v6.
Browser-QA: zwölf Viewport/Theme-Fälle für 14d/46d/Saison und alle Monatslabels; zwölf App/Widget/PNG-Fälle für gemeinsam gerenderte echte Quartile, Nachtflächen und fehlende Werte. ECMWF-Persistenz: 18 Browserfälle (sechs Breiten × Light/Dark/High-Contrast) mit gespeichertem true/false und vollständigem Neuladen sowie tatsächlich gerenderter Palette. Produktionsabhängigkeits-Audit ohne HIGH/CRITICAL; TypeScript und Produktionsbuild bestanden. iOS-Web-Copy, gemeinsame Shell und Offline-/Resume-Lifecycle geprüft. Abschließende UI-Integration und Release-Gates werden vor Veröffentlichung erneut geprüft.

## Veröffentlichung

Ausschließlich Source-PR-Gate → kontrollierter Agent-Release → serverseitiges ZIP → Installer → Worker/Pages-Prüfung → Stable-Promotion. Keine direkten Änderungen an Produktionsrefs und kein lokales Einzel-ZIP. Worker-Fachlogik bleibt unverändert; reine Versionsspiegel sind keine fachliche Workeränderung.
