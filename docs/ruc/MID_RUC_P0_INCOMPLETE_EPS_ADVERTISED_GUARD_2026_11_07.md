# RUC P0: DWD-Index-Falschstart bei unvollständigem EPS20 vermeiden (QA DRAFT)

Verifizierte Basis: MID v0.9.85.445, `main=mid-stable` SHA `b6526e7c5c24035bd1a75b87b77e7bb8e821c334`. **Kein Release, keine Datenquellenänderung, kein produktiver Write.**

## Fehlerbeleg
[Original Actions #42407050483](https://github.com/MeteoMartini/MID/actions/runs/42407050483), 07.11.2026: 19:42:41Z `DWD 19Z != Pages 18Z` triggert Neubau. 19Z hat nur **263/560** RUC-EPS-Originaldateien; GRIB/EPS Header weist fehlende Member um +13h nach. Das ist ein korrektes NoData-Fail-Closed. Es wird jedoch wieder 18Z gebaut (`core-download-decode=622.314s`, EPS quantile darin `422.372459s`) und am 20:11:51Z erneut der 18Z-Lauf auf Pages/Worker nachgewiesen. Der neue Pages-Site-Umfang unterscheidet sich um 60.811 Byte, daher keinesfalls behaupten, derselbe Run sei byteidentisch oder dass nachgelieferte optionale Felder identisch sind.

## Sehr begrenzter Kandidat
`check_ruc_schedule_guard.py` prüft **nur bei gültigem, maximal 240 Minuten altem veröffentlichtem Pages-Snapshot und streng neuerem angekündigtem DWD-RUC** zusätzlich das bekannte veröffentlichte RUC-EPS-Dateiverzeichnis `e/01..20/s/PT000..027H00M.grib2`. Max. 21 kleine HTML-Direktory-GETs, je Request 4 Sekunden, Gesamtfenster 14 Sekunden. Das eindeutige Fehlen einer der 560 erwarteten Dateinamen kann den nicht erzwungenen Schedulerlauf bis zur nächsten regulären :11/:41-Chance zurückstellen.

**Vertragsgrenzen:** Dies ist ein **negativer Verzeichnisindikator**, kein positiver Nachweis von originalen GRIB-Headern, Werten, Bitmap, Akkumulation, erster DWD-Veröffentlichung oder 20 funktionierenden Mitgliedern. Ein vollständiger Index durchläuft weiterhin **alle** alten Header-/Bitmap-/Wert-/EPS-Qualitätsgates. Jede unbekannte URL-Struktur, 404/Timeout, neue Dateiendung, unlesbare Metadaten, veraltete/ungültige Pages, erzwungener/manueller Build oder Quelllauf-Rückschritt führt weiterhin in den bisherigen Prüfungspfad (fail-open). Die bestehende 27h/EPS20-, 5-/15min-, SHA-/Codec-/Worker-/Pages-/Rollback-/900MB-Semantik bleibt unverändert.

Gezielte Offline-Fälle: 20×28 vollständig, 19Z=263/560 bzw. einzelne fehlende Leads/Members, unbekanntes Quellformat, Timeout, ungültige Quelle/Pages, alter Pages-Lauf, echter Zukunftsversatz. Weder Client-P95 noch 168h werden aus einer Einsparung abgeleitet.

**Aufnahme nur nach unabhängiger QA, Schedulertests, Vollgate und normalem Source-Bot→Server-ZIP→Installer→Worker/Pages→Stable-Pfad. Nicht automatisch produktiv setzen.**
