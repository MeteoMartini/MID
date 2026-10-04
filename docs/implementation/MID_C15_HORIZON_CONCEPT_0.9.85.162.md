# MID-C15 · Horizonte mit eigener Aussage

Basis main = mid-stable = c8c2a4f98892b97a104c43575dedbecd23af439f, veröffentlicht .161.

| Horizont | Nutzerfrage | Hauptdarstellung | Erhalten |
| --- | --- | --- | --- |
| 14d | Wie entwickelt sich das Wetter, wann öffnet sich die Bandbreite? | Abschnitte Tag 1–4, 5–9, 10–14; Tages-Tmax mit echten P10–P90-Spannen und täglicher Konsistenz | Erwartete Entwicklung/Konfidenz, Szenarien, sämtliche Ensemble-Grafiken; Tageskarten als aufklappbare Detailansicht |
| 46d | Welche Wochen weichen ab, ist die Richtung offen? | Wochenintervalle um Null statt paralleler Absolut- und Klimakurven; bestehende Modell- und Parameterwahl | P10–P90/P25–P75, absolutes Diagramm über Umschalter, Quellenvergleich |
| Saison | Welche Monatsanomalien liefern die Modelle, wie groß ist ihre Streuung? | Monatsanomalien mit allen numerisch gelieferten Einzelmodelllinien; separate echte SEAS5-Mitgliedskurven | Gleiches Gewicht je unabhängiger Modellfamilie, DWD-Deutschland-Perspektive, Modellvergleich |

## Fachliche Grenzen

14d-Abschnittsmittel sind beschreibende Mittel der Punktprognose, keine Quantile des Abschnittsmittels. Tagesquantile werden nicht gemittelt und als Wochenwahrscheinlichkeiten ausgegeben. Konsistenz bleibt von kalibrierter Eintrittswahrscheinlichkeit getrennt.

46d-Wochenabweichungen werden aus den bereits gelieferten Wochenwerten minus kalendergleichem ERA5-Mittel 1991–2020 gebildet. Sie sind explizit unbereinigte Abweichungen zur Reanalyse, keine aus Hindcasts kalibrierten Modellanomalien und keine Tertilwahrscheinlichkeiten. Fehlendes Klima erzeugt eine Lücke. Ab Tag 36 wird NOAA GEFS nicht extrapoliert. Ein Intervall über Null lässt die Richtung offen; große Abweichung allein beweist keinen Forecast-Skill.

## Saisonprüfung und zusätzliche Kurven

Reale Open-Meteo-Abfrage am 4.10.2026, 50.82 N / 7.04 E: monatliche SEAS5-Felder enthalten nur Mittelwerte, keine `_member`-Felder. Die bisherige Mindestzahl 51 behauptete Mitgliedsverfügbarkeit ohne Daten. Der zusätzliche explizite SEAS5-Tagesabruf liefert 51 numerische Verläufe (Kontrolllauf plus 50 perturbierte Mitglieder). Diese werden zu vollständigen Kalendermonaten aggregiert: Temperatur arithmetisches Tagesmittel; Niederschlag Summe / tatsächliche Kalendertage in mm/Tag. Teilmonate und fehlende Tage bleiben unvollständig und werden nicht als voller Monat gezeichnet. Quantile entstehen aus den tatsächlichen Mitgliedsmonatswerten; Lücken werden nicht verbunden. Keine fremde Klimareferenz wird in diese absoluten Roh-Mitgliedskurven hineingerechnet. Sie sind Modellgitterwerte, keine biasbereinigte lokale Punktprognose.

Der Monatsabruf liefert `precipitation_mean`/`precipitation_anomaly` mit Einheit mm. MID normalisiert jetzt nach tatsächlicher Monatslänge auf die gemeinsame mm/Tag-Achse. Temperaturdifferenzen bleiben K. Ein unbekannter Niederschlagseinheitenvertrag wird nicht als bekannte Einheit ausgegeben. Cache v5 verhindert die Wiederverwendung früherer falsch skalierter Monatswerte.

Die monatliche Multi-Modell-Streuung wird als Modellstreuung bezeichnet; sie ist kein Mitgliederensemble und keine kalibrierte Wahrscheinlichkeit. Alle tatsächlich numerisch geladenen Modelle erscheinen auch als Linien direkt in den Anomaliegrafiken. Katalogeinträge ohne Zahlenwerte bleiben ausgeschlossen.

## Quellenrecherche

- Open-Meteo Seasonal API: https://open-meteo.com/en/docs/seasonal-forecast-api – echte SEAS5-Tagesmitglieder zusätzlich zu numerischen Monatsanomalien; aktuell implementierter zusätzlicher Abruf.
- ECMWF sub-seasonal: https://www.ecmwf.int/en/forecasts/datasets/atmospheric-model-sub-seasonal-forecast-set-vi-sub-seasonal – Wochenmittel, Mitgliedsanomalien und Wahrscheinlichkeiten als unterschiedliche Produkte.
- C3S: https://www.ecmwf.int/en/forecasts/datasets/c3s-seasonal-forecasts – ECMWF, Met Office, Météo-France, DWD, CMCC, NCEP, JMA, ECCC. MID hat bereits numerische Adapter und konservative unabhängige Modellidentitäten; ein nicht konfigurierter Adapter wird durch diese UI-Änderung nicht mit fiktiven Daten ersetzt.
- NOAA CFSv2: https://www.cpc.ncep.noaa.gov/products/CFSv2/CFSv2_body.html – E1/E2/E3 sind Initialisierungsfenster-Mittel, nicht drei einzelne Member. Vorhandener MID-Fallback bleibt erhalten.
- NOAA NMME: https://ftp.cpc.ncep.noaa.gov/NMME/realtime_anom/ENSMEAN/ – vorhandener dynamischer numerischer Quellenpool für u. a. GFDL SPEAR, NASA GEOS, ECCC und NCAR. Bereits vorhandene Modelllinien werden nicht als neue unabhängige Quellen doppelt gezählt; nun auch direkt in den Haupt-Anomaliegrafiken sichtbar.

## Sicherungen

Gemeinsamer Periodenrenderer für 14d/46d. Vorhandene Ensemble-Grafiken und sämtliche Regressionen bleiben erhalten. Gezielt neue Daten- und Browserprüfungen für Monatsvollständigkeit, Einheiten, tatsächliche Memberkurven, fehlende Referenz, Horizontumschalter und mobile Darstellung. Keine Workflow-/Gate- oder Budgetaufweichung.

Validierung: 906/906 Regressionen bestanden, Typprüfung und Produktionsbuild bestanden. 12 reale Browserfälle mit sechs Viewports × hell/dunkel: vollständiger 14d-Kalender aufklappbar, absolute 46d-Grafiken erreichbar, 51 echte SEAS5-Verläufe je Parameter aus geprüftem API-Payload, Quellenlinien in beiden Anomaliegrafiken, antippbare Periodenwerte, lesbare Achsen und kein Seitenüberlauf. Fehlendes Klima führt zu explizit fehlendem Vergleich statt Nullsignal. Build-Budget eingehalten (101 Dateien, Code/Text gzip 1.767.175 B), Abhängigkeits-Audit ohne HIGH/CRITICAL, iOS-Kopie und Shell-/Lifecycle-Prüfungen bestanden.

Historische Guards wurden nur für den bewusst geänderten Cache v5, die ehrliche Modellstreuungs-Beschriftung und vollständige verfügbare P25–P75-Monatsbereiche aktualisiert. Keine Memberquartile werden nach halbem Horizont künstlich ausgeblendet; Lücken bleiben Lücken. NOAA-E1/E2/E3-Mittel erhalten keine fingierte Zahl gelieferter Einzelmitglieder.
