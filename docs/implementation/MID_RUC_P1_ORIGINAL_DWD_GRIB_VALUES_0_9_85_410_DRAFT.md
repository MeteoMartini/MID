# RUC P1 – Originale DWD-GRIB-Werte und EPS20 vollständig nachprüfbar abfragen (Draft)

**Source of Truth:** `MeteoMartini/MID`, bei Branch-Erzeugung main=mid-stable v0.9.85.408, SHA `17b2bb99e3935fe494400d95a79ff18b5ed01e4a`. Die parallele .409-Audit-PR #611 sowie D2-Vollgebiets-Drafts #606/#600 bleiben geschützt und unberührt. Branch ist ein .410-**Draft**, kein Build, keine produktive Freigabe oder neue Modellquelle. Vor Integration erneut GitHub SHAs, Versionsspiegel, Verträge, Rulesets und PRs prüfen.

## Motivation

Der bestehende P1-Observer liest DWD-Verzeichnisse und Pages-/Worker-Metadaten, liefert aber laut eigenem Vertrag **keinen Original-GRIB-Header-/Werte-/EPS20-Beweis**. Die nun getrennte lesende Probe `tools/ruc/ruc_p1_original_native_values_probe.py` nutzt Original-DWD-URLs und zwei **unabhängig ausgeführte vorhandene** Prüfungskomponenten: die DWD-`scientific_grib_contract_probe.inspect`-GRIB2/WMO/UTC-Einheiten-/Raster-/Originalhash-Headerprüfung und den kanonischen `build_ruc_bundle.read_messages`-Datenreader einschließlich `grib_bitmap.decode_bitmap_values` und strenger nativer Member-/Bitmapbehandlung.

Sie prüft auf **denselben SHA-gebundenen Originalbytes** die Datei, das Modelllaufdatum, exakten angeforderten nativen Vorhersage-Lead, ein GRIB-Message pro Datei, den DWD/Offenbach-Ursprung, Parameter/Level/Akkumulation, 542040 native Gitterpunkte, NoData vs. echte Null, Inf-Unzulässigkeit, physikalische Einheitennormalisierung und jede Member-ID 1–20. Die angeforderte Achse ist 0–6h, 0–14h oder 0–27h, optional natives 5/15-min-Fenster 0–6h. Pro Originaldatei werden SHA256, Bytezahl, Lead, ValidTime, Werte-/NoData-Zahlen und Extremwerte **ohne Glättung** sowie UTC-Request-Anfang und Response-Ende dokumentiert. Die Begrenzungen verhindern übergroße Downloads und einen heimlichen Produktionsdispatch; Fehlschlag ist fatal, der Report wird nicht als erfolgreich geschrieben.

## Verbindliche Evidenzgrenzen

**Ein vollständig qualifizierter einzelner Original-DWD-Modelllauf ist kein 168-Stunden-Laufverfügbarkeitsarchiv.** Jeder positive Dateinachweis beweist die beobachtete Verfügbarkeit spätestens zum Abschluss des HTTP-Abrufs; er beweist **nicht** den exakten ersten Publikationszeitpunkt des DWD. Erst mit Originalbelegen für alle erforderlichen UTC-Stundenläufe über 168+ Stunden, tatsächlichen Poll-Gaps, negativen Polls und Rechts-/Intervallzensierung lassen sich P1-Verzögerungsquantile qualifizieren. Frühere directory-only Beobachtungen bleiben directory-only; alte Artefakte dürfen nicht nachträglich als `valuesVerified` umetikettiert werden.

Das Script ist **ausschließlich read-only**. Weder Fast-Lane/0–6h, die gesamte 27h/20-EPS-Pipeline noch der globale Single-Writer/CAS, die 900-MB-Budgetprüfung, die Shader/Widgets/Exporte oder ein App/Client-P95 werden daraus freigegeben. `publicationAuthorized=false`, `productionSloAuthorized=false`, `firstDwdPublicationInstantVerified=false`, `full168hObserved=false` bleiben auch bei erfolgreich geprüfter Einzelprobe fest.

## Prüfung und Übergabe

Die neue adversarielle Python-Unit-Testdatei wird durch den bereits vorhandenen, canonical und active byteidentischen `mid-ruc-p1p5-evidence-qa.yml` im PR-Head ausgeführt; kein DWD-Netz benötigt. Tests decken echte 0 vs. Bitmap-Missing, vollständiges Missing, native Größe, Extremwert-Erhalt, originalen SHA-Wert, UTC-Lauf/Lead, Member-ID-Vertauschung, doppelte GRIB-Messages, EPS20-Lücken und überzogene Produktiv-/168h-Claims ab.

Nach erfolgreicher SHA-gebundener QA muss eine **reale Original-DWD-Abfrage unter kontrollierter Read-only-Ausführung** für +0…+27h und alle 20 EPS-Mitglieder je Lead erfolgen und als unverfälschtes Original-Evidenzartefakt nachgewiesen werden. Erst wenn ein zweites tatsächliches Format (native 5-/15-min, bitmap, Echtwerte) und real beobachtete 168h vorliegen, ist der P1-DoD bewertbar.

Release nur über eine neue vollständige MID Source-PR-Gate → SHA-gebundenen Bot-Merge → Server-ZIP → install-mid.yml Core/Heavy/Worker/Pages/Finalize → Stable. P2–P5 einschließlich global CAS/Fencing und realem Web/Widget/Export-P95 bleiben gesondert offen. Keine Secret-Erweiterung, keine kostenpflichtige Datenquelle, keine Schutzregelabsenkung.
