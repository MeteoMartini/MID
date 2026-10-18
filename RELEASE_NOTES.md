# MID v0.9.85.290

- **Amtliche Barcelona-Warnzone 690804:** AEMET bestätigt für die Gemeinde Barcelona (08019) die Zone 690804 „Litoral de Barcelona“; MID nutzt diese eng auf Barcelona und einen Ortskoordinaten-Plausibilitätsradius beschränkte Zuordnung auch beim MeteoAlarm-VIS-Ausfall. Die Zonen 690802 (Depresión central) und 690803 (Prelitoral) werden dadurch nicht aufgrund ihrer ähnlichen Namen als Stadtwarnungen übernommen. Quelle: https://www.aemet.es/es/eltiempo/prediccion/municipios/barcelona-id08019 sowie das amtliche Gemeinde-Zonen-Verzeichnis (AEMET/Meteoalerta).

- **Amtliche Warngebiete präziser abgleichen:** Liegt eine MeteoAlarm-Warngebietsauswahl vor, muss die CAP-Gebietsbezeichnung vollständig passen. Ein Ortsname allein, etwa „Barcelona“ in „Prelitoral de Barcelona“, reicht nicht mehr zur Zuordnung.
- **Dubletten und Warnstufen:** Gleichzeitige, tatsächlich unterschiedliche Warnstufen bleiben als eigenständige Warnmeldungen erhalten. Identische CAP-Kennungen und Referenzen werden weiterhin zusammengeführt.
- **Geometrie:** Echte CAP-Polygone und Kreise behalten Vorrang. Begrenzungsrechtecke aus MeteoAlarm sind nur eine Vorfilterung und beweisen nicht in jedem Fall eine punktgenaue Zuordnung.
- **Transparenz:** Die vom Nutzer beobachteten 26 Barcelona-Meldungen konnten nicht einzeln aus dem Live-MID-Worker geprüft werden. Ein ausdrücklich synthetischer 26-Meldungen-Test sichert die erkannte Fehlerklasse; die tatsächliche heutige Warnzahl bleibt separat zu validieren.
- Keine Änderung amtlicher Warnstufen, Vorhersageschwellen, Warntexte, RUC oder anderer Wettermodelle.
