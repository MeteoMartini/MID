# MID Audit 1.2 — CRPS aus originalen, vollständigen Ensemblemitgliedern (QA-DRAFT)

**Zeit:** 18.11.2026. **Verifizierte Ausgangsbasis:** main=mid-stable=`42c188f44606f511826d2b6665b764c36b23412c`, MID v0.9.85.490 in package.json, MID_BASELINE.json und contracts/index.json; fünf aktive GitHub-Rulesets. **Status:** Forschung/QA ausschließlich. **KEIN READY / MERGE / RELEASE**, keine Produkt- oder Warnwertänderung.

## Anlass und keine Überschneidungen

Originalaudit `20261117_MID-Audit(1).pdf`, S. 3–4: Ensemble-Konfidenz benötigt echte Verteilungsverifikation, nicht nur einen Konfidenzindex. In Stable existieren bereits Brier-/Temperaturverifikation (`src/forecastVerification.ts`, `src/rainBrierPresentation.ts`). Der isolierte Draft #911 behandelt unabhängige DWD-Stations-Paarungen mit MAE und Brier, #919 kumulierte Ensemble-Regenmengen, #914 Feld-Zeitintegrität, #917 Wochenaggregation. **Dieses Paket führt keinen dieser Pfade erneut ein.** Es ergänzt nur die fehlende, echte Ensemble-Verteilungsbewertung mittels Continuous Ranked Probability Score (CRPS). Kein CSS, JS-Bootstrap, React, Worker, API, iOS, Forecast-Weights, Modell-/WMO-/DWD-Warnlogik oder CI-Konfigurationspfad wird modifiziert.

## Reine Berechnung, Provenienz und Ausschlüsse

`src/twinEnsembleCrpsEvidence.ts` verarbeitet ausschließlich bereits vom Adapter fertig validierte, originale Vorhersage-/Beobachtungspaare und führt selbst **keinen Fetch** aus. Jeder zulässige Datensatz erfordert:

- Ein SHA-256-gebundenes Archiv der *vor* der ursprünglichen Gültigkeit ausgegebenen Modellvorhersage, Modelllaufkennung und Initialisierung sowie Ausgabe-/Archivzeit < Gültigkeitsbeginn. Nachträglich rekonstruierte Vorhersagen sind unzulässig.
- Vollständige, eindeutige Originalmitglied-IDs, Anzahl exakt wie erwartete native Ensemblemitglieder; keine fehlenden Mitglieder durch 0 ersetzen, kein ungeregeltes Glätten oder Wegwerfen von Extremmitgliedern. Die reine Eingabeprüfung bestätigt **nicht eigenständig** einen realen Provider-Upload, Blob-SHA oder die DWD-Quellenauthentizität; diese muss ein separat qualifizierter Originaladapter bescheinigen.
- Unabhängige, historisch qualitätsgesicherte **amtliche Messstation**; überprüfte Stations-/Standort-Repräsentativität, vollständig bekannte reale Beobachtungszeit und Messwertverfügbarkeit. Keine Reanalyse, Modell, private/provisorische Quelle oder retrospektive Reparatur als unabhängiger Messwert.
- Identische Variable, ausdrücklich gleiche Einheiten (Temperatur Celsius, Akkumulation mm), räumlicher Bezug und native zeitliche Gültigkeit. Temperatur ist ein Zeitpunkt, Niederschlag ein vollständiges ursprüngliches Akkumulationsintervall. Keine scheingenauen Umrechnungen, keine unvollständigen 23-/25-Stunden-Tage.
- IANA-Lokalzeit des Beobachtungsstandorts, geprüftes Ortsdatum; Akkumulations-Endstempel bei genau lokaler Mitternacht wird zum vorherigen lokalen Tag gezählt. Exakte Epochenzeiten; keine abgeleiteten Fixoffset-Zeiten als Ortszeit.
- Fachlich getrennte Kohorten nach Standort, Modell, Variable, Vorlauf 0–6 / 6–24 / 24–72 / 72–168 Stunden und Akkumulationsdauer. Doppelte konkurrierende Zielintervalle werden **sämtlich ausgeschlossen**, nicht nach bestem Treffer ausgewählt. Innerhalb eines lokalen Tages werden Fälle gemittelt, anschließend zählen Tage gleich schwer.
- Einheiten der ausgegebenen CRPS-Werte: °C bei Temperatur, mm bei Niederschlagsmenge. Der beobachtete Anteil innerhalb des linearen P10–P90-Ensembleintervalls ist eine **deskriptive Abdeckungsfrequenz**, keine automatisch kalibrierte 80%-Aussage.

Die native Ensemble-CRPS-Formel lautet

`CRPS = mean_i(|member_i - observation|) - (1/(2n²)) * sum_i,sum_j(|member_i - member_j|)`.

Die sortierte Berechnung erreicht `O(n log n)` statt paarweiser `O(n²)`-Arithmetik. Das komplette Verfahren ist ohne I/O auf höchstens 10.000 Paare und 128 Mitglieder pro Paar begrenzt und liefert einzelne Tages-/Modell-/Lead-Kohorten in `O(P * M log M)`. Keine App-Renderarbeit, kein ungedrosselter Background-Job oder API-Schlüssel erforderlich. Die qualifizierende 30-Tage-Schwelle ist eine **eigene explorative MID-Audit-Regel**, kein WMO-Mindeststandard.

## DWD-Originalquelle: entscheidende zeitliche Grenze

Die offizielle DWD-CDC-Datensatzbeschreibung der stündlichen Niederschlagsmessungen (v24.03) trennt die abgeschlossene, versionierte Qualitätssicherung unter `historical/` ausdrücklich von den täglich aktualisierten, noch **nicht** vollständig qualitätsgesicherten Daten unter `recent/`. Die historischen Daten werden nach DWD-Beschreibung jährlich erneuert, `recent/` täglich. Sie belegt außerdem stündliche Summen in mm, Stations-ID, Stationswechsel/Geräte-/Uhrzeitmetadaten, den Qualitätsindikator `QN_8`, den Fehlwert `-999` und CC BY 4.0 als Lizenz. Diese Details sind verbindliche Original-Adapterchecks, nicht eine Garantie, dass ein bestimmter Stationswert schon für Skill verwendbar ist.

**Konsequenz:** Für aktuelle laufende 30-/90-Tage-MID-Diagnosen darf `recent/` nicht heimlich als endgültig amtlich verifiziert ausgegeben werden. Der reine CRPS-Score sperrt diese Fälle mit `observationQuality:'recent-provisional'` aus; vorläufige Echtzeitdiagnosen benötigen ein getrennt beschriftetes Produkt. Die historisch geprüfte Studie kann zeitversetzt erfolgen, sobald `historical/` die zugehörigen Originalintervalle enthält. Es ist unzulässig, vorab fehlende aktuelle historische Messungen durch Reanalyse, Radar-Nowcast oder 0 mm zu ersetzen. Eine temporär niedrige unabhängige Fallzahl ist kein Modellfehler.

Offizielles DWD-Quellformat: https://opendata.dwd.de/climate_environment/CDC/observations_germany/climate/hourly/precipitation/DESCRIPTION_obsgermany_climate_hourly_precipitation_en.pdf ; `historical/`: https://opendata.dwd.de/climate_environment/CDC/observations_germany/climate/hourly/precipitation/historical/ ; `recent/`: https://opendata.dwd.de/climate_environment/CDC/observations_germany/climate/hourly/precipitation/recent/ . Attribution und Weitergaberechte beim späteren Adapter dokumentieren.

## Abnahme & Grenzen

`tests/unit/mid-audit12-native-ensemble-crps.test.ts` enthält 11 synthetische Testfälle: exakte diskrete Formel, nicht geglättete Extremwerte, fehlende Native-Mitglieder, Doppelbelege, Provenienz/Unabhängigkeit, Ausgabe-vor-Gültigkeit und Beobachtung-nach-Gültigkeit, explizite Einheiten, 23-/25-Stunden-Tage, gleichgewichtete unabhängige Tage, Modell-/Vorlauftrennung, 30-Tage-Schwelle, ungültige Fenster und O(1)-Budgetabbruch. Die lokale isolierte TypeScript-Typprüfung und Node-22-Kurztests erfolgten vor GitHub-Handoff; **dies ersetzt keinen originalen MID Vitest-/Core-/Heavy-/CI- oder realen DWD-Test**.

Ein niedriger CRPS ist **kein CRPS Skill Score**. Ohne auf denselben Fällen gepaarte, valide Basis-CRPS (z. B. explizit historisierte Vergleichsprognose) und geblockte Unsicherheitsanalyse darf keine positive Skillbewertung oder Modellgewichtung freigegeben werden. Die P10–P90-Hit-Rate allein belegt keine Zuverlässigkeitskalibrierung. Serial dependence, Stationsrepräsentativität, Modellfamilien-Korrelation, ungleiches Sampling nach Nutzeraktivität und mehrere Orte pro Wetterlage müssen im Originaldatentest quantifiziert werden. Ein Ergebnis mit 30 Tagen bleibt `exploratory-only`.

**Leitchat-/Work-Handoff:** Erst die tatsächlichen amtlichen Originalstationsdaten und native Modellmember-Archive bei Eil (Köln/Bonn) über 30/90 Tage mit nachgewiesener Quelle, Stations-ID, Rechte-/Aufbewahrungsprüfung und vollständigem Capture-Sampling verbinden. Danach Zeit-/Feldmetadaten, Source-SHA, Ensemblevollständigkeit, DWD-QC, CRPS-/P10-P90-Verifikation und überlappende PR-Intakes (#911/#919/#914/#917) separat prüfen. Eine spätere Produktanzeige bedarf 320/390/430/768/1024/1440-px-Reflow, 200%-Zoom, Light/Dark, Accessibility und realer Web-/iOS-Abnahme. Anschließend auf dem **finalen** Source-SHA alle regulären Source/Core/Heavy/Review/ZIP/Installer/Worker/Pages/Stable-Gates. #903 Sicherheitsprüfung unabhängig; #839/#740 kein pauschaler Blocker für disjunkte Änderungen. Keine direkten `main`-/`mid-stable`-Writes.

## Fachliche Originalreferenzen

- WMO Guidelines on Ensemble Prediction Systems and Forecasting: https://public.wmo.int/guidelines-ensemble-prediction-systems-and-forecasting
- ECMWF Forecast User Guide, ensemble meteograms and member percentiles: https://confluence.ecmwf.int/spaces/FUG/pages/673551076/Section%2B8.1.4%2BMeteograms
- ECMWF Forecast User Guide, probability verification (CRPS, reliability/Brier): https://confluence.ecmwf.int/pages/viewpage.action?pageId=283544832
- WMO Lead Centre on Verification of Ensemble Prediction Systems: https://epsv.kishou.go.jp/EPSv/
- MET Norway / Yr: uncertainty and 21-day forecasts: https://hjelp.yr.no/hc/en-us/articles/12329349662492-The-21-day-forecast-on-Yr
