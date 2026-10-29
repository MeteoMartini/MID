# GeoSphere: mögliche Aufnahme in Bergwetter, Schnee und Fusion

Lesende Prüfung am 29.10.2026. Original-API-Metadaten von C-LAEF-Kontrolllauf, Ensemble-Grid und SNOWGRID-CL erfolgreich mit HTTP200 gelesen. Maschinenlesbarer Nachweis inklusive Original-URLs, SHA256 und vollständigen Metadaten: `MID_C51_GEOSPHERE_PARAMETER_PROOF_20261029.json`. Attribution GeoSphere Austria, CC BY4.0. Keine Produktivfreigabe. Der aktuelle INCA-v2-Stundenbestand ist separat über acht Parameter und eine echte öffentliche Wien-Punktprobe in Issue#509 belegt.

| MID-Bereich | Geeignete Quelle | Konkrete mögliche Nutzung | Fachliche Aufnahmebedingung |
|---|---|---|---|
| Bergwetter Tal/Mitte/Gipfel | C-LAEF Kontrolllauf und Ensemblestatistik | 2t, Feuchte, 10u/10v, Böen10fg, Bewölkungtcc, Strahlungssrd und Sonnenscheindauersund für den tatsächlich verfügbaren Kurzfristzeitraum bis60h | Modellorografie/Standorthöhe, Exposition und Repräsentativität prüfen; Stations-/Profilkorrektur qualifizieren; 1km ist keine exakte Gipfelmessung |
| Niederschlagsphase und Schneefall | C-LAEF sf/rain/tp/pt sowie snowlmt | Schnee-Wasseräquivalent pro Originalintervall, Regen-/Schneesignal, zeitabhängige Schneefallgrenze | sf ist kg m-2, keine Neuschneehöhe; pt/sy benötigen verifizierte GeoSphere-Codetabellen; keine automatische WMO-ww-Interpretation |
| Bestehende Schneedecke | SNOWGRID-CL v2.1 | Analysierte Schneehöhe snow_depth in m und Schneewasserwert swe_tot in kg m-2 als österreichweite räumliche Ergänzung | Tagesprodukt und Bezugsdatum/Verfügbarkeit sichtbar; getrennt von Stationsmessung und Modellprognose; nicht in measuredSnowDepthCm als Messung ausgeben |
| Neuschneehöhe24/48h | C-LAEF sf plus erst zu qualifizierendes Schneemodell | Wasseräquivalent als zusätzliche Eingangsinformation; ggf. dichteabhängige Neuschneeabschätzung | Kein fixes10:1; Neuschneedichte, Setzung, Schmelze und Verwehung beachten; aktuelle SNOWGRID-API bietet keinen eigenen Neuschneehöhenparameter |
| Aktuelle Analyse/lokale Korrektur | INCA-v2 1h | Temperatur/Feuchte/Wind, stündlicher Niederschlag und Strahlung für AT, situationsabhängige Bias-/Phasenprüfung und Verifikation | Analyse, keine Zukunftsprognose; enthält Modellhintergrund; keine reine unabhängige Stationswahrheit; verfügbare Zeit beachten |
| Regionale Vorhersagefusion | C-LAEF Kontrolllauf plus gesonderte Quantilinformation; INCA nur als Analyseanker | Parametrische, lauf-/lead-/gelände-/güteabhängige Ergänzung der bestehenden Leitprognose innerhalb gültiger Abdeckung | Familien-/Randbedingungsabhängigkeit prüfen, keine doppelten unabhängigen Member; keine Wirkung jenseits Originalhorizont oder außerhalb Gebiet |

## Besonders wichtige Semantik

- Deterministisch angeboten: sf/rain/tp in kg m-2, 10u/10v/10fg in m s-1, 2t in GradC, 2r in Prozent, msl in Pa, sund in Sekunden, ssrd in W m-2. Intervallverarbeitungsart und echter Akkumulationsstart/-endstempel vor Summenaufnahme qualifizieren.
- snowlmt ist in den tatsächlich gelesenen Metadaten als height above ground where falling snow melts beschrieben. Höhenbezug beim Anbieter klären; weder blind als m über Meer ausgeben noch ungeprüft Gelände addieren.
- Ensemble liefert P10/P50/P90 je angebotener Größe, keine Einzelmember. Die Summe stündlicher P90 ist kein P90 der24h-Summe. Ebenso ergeben Quantile von U/V keine quantiltreuen Windgeschwindigkeiten oder Richtungen. Böenquantile10fg sind direkt angeboten.
- Schneefall-Wasseräquivalent ist nicht Schneehöhenzuwachs. Eine Differenz zweier Gesamtschneehöhen ist wegen Setzung/Schmelze/Transport keine direkte Neuschneesumme.
- Aktuelle SNOWGRID-API listet genau snow_depth und swe_tot. Das Schneemodell kann intern weitere Größen berechnen; daraus folgt keine Verfügbarkeit als öffentlicher API-Parameter. Tagesanalyse nicht als aktueller Stundenwert darstellen.
- C-LAEF-Metadatenstichprobe meldete als jüngsten Lauf29.10.06Z und61 Zeitschritte. Drei-Stunden-Zyklus ist keine garantierte Drei-Stunden-Veröffentlichungslatenz. Alter aus Lauf/Gültigkeit statt Abrufzeit bestimmen. Kein allgemeiner Frische- oder Mehrwertnachweis aus Metadaten.

## Einbindung in vorhandenen MID-Code

`mountainSports.ts` besitzt bereits modelSnowDepthCm, measuredSnowDepthCm und newSnow24Cm/newSnow48Cm. SNOWGRID-Analyse benötigt eine getrennte Herkunftskategorie/Analysezeit (beispielsweise analysedSnowDepthCm), nicht ein Überschreiben von Messwerten. C-LAEF sf darf nicht direkt in die cm-Neuschneefelder geschrieben werden. Vor neuer Quelle Einheiten-/Darstellungspräzisionsvertrag, gemeinsame Renderer, Widgets und PNG-/URL-Exporte erweitern. Wetterlage/Originalextreme bewahren; bei Missing keine0.

Für den Start kleine Punktabrufe an bestehenden Bergniveau-Koordinaten und Worker-Cache auf unveränderlicher Modelllauf-ID, Parameter und Standort; kein unbudgetierter Vollgebietsdownload in den RUC-Snapshot. Vergleich mit bisherigen Vorhersagen und getrennten Stationsreferenzen auf gleichen Höhen/Leadzeiten, danach qualifizierter Pilot und erst anschließend neue Gewichtung. Keine fachliche Quelle wird durch das Anzeige-Persistenzpaket aktiviert.

## Priorisierung

1. Bergwetter-Kontrolllauf und echte kurzfriste Quantilinformation qualifizieren.
2. SNOWGRID-Tagesanalyse für Schneedecke/SWE getrennt ergänzen.
3. INCA als analysierten Korrektur-/Verifikationsanker prüfen.
4. Neuschneehöhen erst nach separater Dichte-/Massenbilanz- und Güteabnahme erweitern; allgemeine Fusion nach belegtem Zusatznutzen und unverändertem vollständigem Releasepfad.

## Abgleich MID18.2.54 / Issue #510

Die bestehende GeoSphere-TAWES-Anbindung ist keine neu einzuführende Quelle. Am 29.10.2026 wurde die offizielle `https://dataset.api.hub.geosphere.at/v1/station/current/tawes-v1-10min/metadata` erfolgreich HTTP200 gelesen (SHA256 `827b59570d40dd05fed91fa4d43483356488aeb98b4854a45b72f70950bce538`). Sie listet `SCHNEE`, Einheit `cm`, Beschreibung „Gesamtschneehöhe 10 Minuten aus Schneepegelmessung“. Die bestehenden Worker-Versuche `HS`, `SH`, `SNOW_DEPTH` sind nicht im gelesenen Parameterverzeichnis enthalten. Damit ist der in MID18.2.54 genannte Kennungsverdacht durch Originalmetadaten erhärtet; vor einer Codekorrektur sind echte Stationsantworten einschließlich gültiger Null, Missing, Zeitstempel und Rohdatenstatus erforderlich. Das Anzeige-Persistenzpaket korrigiert diesen unabhängigen Datenadapter noch nicht.

Amtliche Schneemessungen CH/AT/DE werden in #510 getrennt qualifiziert: SLF manuelle/automatische Messwerte, MeteoSchweiz manuelle Schneehöhe/Neuschnee mit eigenem Tagesintervall, DWD tägliche Gesamtschneehöhe. Manuelle Tagesmessungen benötigen eigene Frischegrenzen statt pauschaler 3h-TTL. Bergfex-Daten ohne ausdrückliche Weiterverwendungslizenz nicht übernehmen; selbst lizenzierte Pistenberichte bleiben eine andere Quellenklasse als freie Gelände-Schneedecke und amtliche Messung. Keine Doppelgewichtung gemeinsamer Analyse-/Modellhintergründe.

RUC-Fachbefund aus MID18.2.54 bestätigt: veröffentlichte +27h sind nicht gleichbedeutend mit positivem deterministischem Gewicht am letzten Lead. Stunden-Fade bei +27h null und native 15-Minuten-Blendgrenze <=6h getrennt prüfen; keine künstliche Verlängerung oder unbelegte Gewichtserhöhung. Der in #352 dokumentierte 12Z-Publish vom 29.10.2026 ist eine Betriebsprüfung, keine neue Fusionsgüteabnahme.
