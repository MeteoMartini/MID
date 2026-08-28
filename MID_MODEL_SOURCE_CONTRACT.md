# MID – Modellquellen- und Ensemble-Fallback-Vertrag

## Verbindlich ab v0.9.53.36

Dieser Vertrag gilt app-weit für deterministische und Ensemble-Modellquellen, Modellstandanzeigen, Events, Langfrist-/Kurzfristpfade und alle daraus abgeleiteten Prognosen.

1. **Erfolgreiche numerische Nutzung ist maßgeblich.** Ein Modell gilt nur dann als aktiv, wenn seine numerischen Daten im aktuellen Lauf erfolgreich eingelesen und in die kanonische Prognose übernommen wurden. Laufmetadaten sind Diagnoseinformation und dürfen ein aktives Modell niemals aus der UI verschwinden lassen.
2. **Success-driven statt slot-driven.** Das Abrufbudget definiert die Zielzahl erfolgreich nutzbarer Modellquellen. Ein fehlgeschlagener Abruf oder ein nicht konfigurierter optionaler Adapter verbraucht keinen Erfolgsplatz; MID rückt mit der nächsten fachlich geeigneten Quelle nach.
3. **Varianten-Fallback innerhalb derselben Modellfamilie.** Bevorzugte native/regionale Varianten werden zuerst versucht. Schlägt eine solche Variante fehl, wird im selben Lauf die definierte globale Schwester versucht (insbesondere ECMWF IFS ENS Europa → IFS ENS global und ECMWF AIFS ENS Europa → AIFS ENS global). Erfolgreiche Schwester-Varianten derselben Variantengruppe werden nicht doppelt gewichtet.
4. **Unabhängigkeitsgruppen bleiben erhalten.** Varianten oder eng verwandte Systeme derselben Institution/Familie dürfen einen modellübergreifenden Konsens nicht künstlich vervielfachen. Die vorhandenen `independenceGroup`-Gewichte bleiben verbindlich.
5. **Optionale Regionaladapter sind optional.** KNMI HARMONIE-AROME EPS und ECCC REPS dürfen ohne konfigurierte Punktadapter die übrige Ensembleauswahl weder blockieren noch verkleinern. Der Zustand muss als `Adapter fehlt` diagnostizierbar sein.
6. **Offizielle Mean/Spread-Reserve.** Wenn vollständige Mitglieder nicht ausreichend verfügbar sind, darf MID offizielle Ensemble-Mittel-/Spread-Produkte verwenden. Die Reserve umfasst – soweit am Ort/Horizont verfügbar – DWD ICON EPS, NOAA GEFS/HGEFS/AIGEFS, ECMWF IFS/AIFS, UKMO, GEM, MeteoSwiss ICON, BOM ACCESS und WeatherNext 2. Mean/Spread ist als Reservepfad zu kennzeichnen und ersetzt nicht stillschweigend echte Mitglieder, wenn diese ausreichend verfügbar sind.
7. **Quellenstatus ist transparent.** Modellstandanzeigen unterscheiden mindestens `Aktiv`, `Fallback`, `Nicht verfügbar`, `Adapter fehlt` und `Reserve`. Fehlende Modelllaufmetadaten werden als solche ausgewiesen; das numerisch aktive Modell bleibt sichtbar.
8. **Kein ungeprüftes „mehr ist besser“.** Neue Modelle werden nur aufgenommen, wenn sie für Region, Horizont, Parameter oder Resilienz zusätzlichen Informationswert liefern. Neue Varianten derselben Modellfamilie werden nicht als unabhängige Stimme behandelt.
9. **Katalogpflege.** Änderungen externer Modellkataloge (insbesondere Open-Meteo) werden gegen diesen Vertrag geprüft. Modell-IDs dürfen nicht still veralten; neue sinnvolle Mean/Spread- oder Modellvarianten werden bewusst bewertet und regressionsgeschützt integriert.
10. **Kanonische Endstufe bleibt unverändert.** Zusätzliche Modellquellen dürfen `MID_FORECAST_CONSISTENCY_CONTRACT.md` nicht umgehen. Sichtbare Prognosen werden weiterhin erst nach der zentralen Fusion/Finalisierung ausgegeben.

Required Regression: `scripts/test-model-source-capability-contract-095336.mjs`.


## ICON-D2-RUC / RUC-EPS Kurzfristvertrag (MID v0.9.67.11)

- Innerhalb des vollständigen ICON-D2-Gebiets darf ein konfigurierter numerischer `MID_DWD_RUC_POINT_ENDPOINT` die kanonischen 0–14-h-Stunden kalibrieren. Das Gewicht ist in 0–3 h am höchsten und fällt bis +14 h ab.
- ICON-D2-RUC bleibt in derselben Unabhängigkeitsgruppe `dwd-icon` wie ICON-D2/ICON-EU und erzeugt deshalb keine zusätzliche DWD-Stimme im Mehrmodellkonsens.
- `MID_DWD_RUC_EPS_POINT_ENDPOINT` ist der bevorzugte kurzreichweitige DWD-EPS-Adapter. RUC-EPS und ICON-D2-EPS teilen die Variantengruppe `dwd-icon-d2-eps-rapid`; fällt RUC-EPS aus oder ist nicht konfiguriert, übernimmt ICON-D2-EPS.
- RUC-EPS wird nur für den sinnvollen Kurzfristhorizont bis +14 h angefordert und nicht in normale 7-/14-Tage-Ensembleabrufe eingeschleust.
- Der Cloudflare-Worker dekodiert keine rohen GRIB2-/BUFR-Raster. RUC-/RUC-EPS-Punktadapter liefern bereits dekodiertes JSON und werden am Edge kurz gecacht.
- KONRAD3D und DWD-Mesozyklonen sind beobachtungsnahe Korrekturen nach der Modellfusion. Eine Gewitterklassifikation im aktuellen/Nowcast-Pfad erfordert weiterhin mindestens einen beobachteten Blitz.
- Der Extremwetter-Ausblick lädt maximal einen regionalen KONRAD3D-/Mesozyklonen-Snapshot pro gecachter Berechnung; der Browser-Direktfallback erzeugt keinen zweiten DWD-Objektabruf.
