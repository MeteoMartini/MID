# MID v0.9.85.213 – Intensivaudit: DWD-RUC/GRIB2-Bitmap-Reparatur

## Gesicherte GitHub- und Produktivbasis
Verifizierter Ausgangsstand `main = mid-stable = e71171c0d477c0fbef51e17e9c21c399525ec94d`, v0.9.85.212. Vollständig freigegeben über PR #306 und Release-Installer. Neuer Branch: `chatgpt/v0.9.85.213-ruc-bitmap-recovery`. Offener Produktionsblocker #305.

## Ursachennachweis (nicht aus bloßer Vermutung)
Reale GitHub-Action-Protokolle, u.a. Run 37876446456: Pro `T_2M`-Vorhersageschritt genau 542.040 dekodierte Werte, Kelvin, davon 16.968 konstante 9999-K-Einträge (ca. 3,13 %) entlang des ICON-D2-RUC-Gitterrandes. Der bisherige Parser übernimmt ecCodes-`values` vor Prüfung des GRIB2-Section-6-`bitmap` direkt; seine Kelvin-Umrechnung macht daraus 9725,85 °C. Die korrekte Validierung `validate_core_fields` stoppt deshalb fail-closed mit `temperature_2m: decoded values exceed physical/semantic bounds`. Mehrere Stundenläufe nach v0.9.85.212 reproduzieren dieselbe maschinenlesbare Ursache.

## Umsetzung und semantische Grenzen
`tools/ruc/grib_bitmap.py`: Die GRIB2-`bitmapPresent`- und tatsächliche ecCodes-`bitmap`-Maske wird verbindlich angewendet, bevor die Originalwerte interpretiert oder in Einheiten normiert werden. Bitmap-Bit 0 = nicht definiertes Gitterelement (IEEE NaN). Bitmap-Bit 1 = physikalischer Modellwert. **Alle Zellen und ihre Indizes bleiben erhalten; keinerlei Kürzung, Neugitterung oder Maskenraten**. Unbekannte Indicator-Werte, fehlende/anders lange oder mehrwertige Bitmaps führen zu `MeteoIntegrityError`. Bloßer Zahlenwert 9999 ohne authentische Bitmaske darf nicht stillschweigend eliminiert werden. Auf dieselbe Funktion gehen die Kernfelder, optionalen Rapid-/Phasendaten, RUC-EPS-Member und Koordinaten-Grib. Unmaskierte CLAT/CLON bleiben unverändert.

Im bestehenden Wire-Packer werden IEEE NaN als der bereits etablierte Int16-Wert -32768 (oder bei EPS der UInt16-Wert 65535) kodiert. Unmaskierte, real falsche physikalische Werte werden weiterhin abgewiesen. Der bisherige WMO-/DWD-Phasenvertrag, native DWD-Signatur-/Provenienzprüfer, meteorologische Grenzwerte, fehlende Provider-Backups und alle RUC-Wire-Schemas bleiben unverändert.

## Tests und Abnahme
`tools/ruc/test_grib_bitmap.py`: produktive echte Zellanzahl und fehlender Randbereich, Kelvin->°C nur für gültige Zellen, native Grid-Ausrichtung, Wire-NODATA, fehlende/kaputte/mehrwertige Bitmap, kein unerlaubtes Erraten fehlender Daten bei unmaskierten 9999, physikalischer Validator weiterhin fail-closed. Die Tests sind in den verbindlichen Python-Testpfad `tools/ruc/test_fetch_resilience.py` eingebunden. Nach grünem vollständigen Source-Gate/Installer **muss ein echter vollständiger DWD-RUC-/EPS-Job inklusive Pages-Free-Veröffentlichung und Worker-Datenaktualität grün nachgewiesen** werden; vorher Issue #305 nicht schließen und niemals behaupten, die gesamte Produktionspipeline sei wiederhergestellt.

## Audit-Fortsetzung
Offene Schritte: vollständiger RUC-Probelauf samt Maskenquoten/Panel-Freshness; dokumentierte DWD-Parameter-/Level-Matrix; Karten-Timeline-Traces, mehrfache Performance-Proben, mobile Barrierefreiheit, iOS-WKWebView-Simulator. Bestehende Risiken #270 (Audit-Dependencies), #246 (alte einzigartige Branches), #176 (Agent-Broker) und PR #252/#253/#260 unverändert getrennt.

## Referenzen
DWD ICON-Modellbeschreibung https://www.dwd.de/SharedDocs/downloads/DE/modelldokumentationen/nwv/icon_d2/icon_d2_dbbeschr_aktuell.pdf ; DWD ICON-D2-RUC Open Data https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/ ; dokumentierter Bitmap-Befund mit 16968 Randzellen https://github.com/KnownStormChaser/master-weather-model-list/blob/main/models/nwp_models/regional/germany/icon-d2-ruc.md .
