# MID LC 1.7 – D2 `TOT_PREC` +47/+48 h: Referenzwert-/Packungsregression

**Stand 16.11.2026 · QA DRAFT · NO RELEASE / NO NATIVE MAP APPROVAL.** Autoritativer GitHub-Stable `c9fadfcd0969e949a92f414b321627dd3d4fb0cc` / v0.9.85.483; [Sammelkandidat #833](https://github.com/MeteoMartini/MID/pull/833) v0.9.85.484. Live-DWD-Diagnose aus [Run 43749744387](https://github.com/MeteoMartini/MID/actions/runs/43749744387), Job 132920840812, und [Issue #446](https://github.com/MeteoMartini/MID/issues/446#issuecomment-6902289204); **keine** eigenen neuen GRIB2-Originale abgerufen oder attestiert.

## Konkret reproduzierter Grenzfall
Der echte +48-h-Pilot hatte bei einem nativen ICON-D2-Rasterindex (41285, 56.836773° N / 2.487289° E) `TOT_PREC(+47h)=1.23046875 mm`, `TOT_PREC(+48h)=1.228515625 mm`, also exakt **−0.001953125 mm**. Beide `grid_ccsds`-Nachrichten wiesen `binaryScaleFactor=-9`, `decimalScaleFactor=0` und entsprechend `Q=2^-9=0.001953125 mm` auf, aber minimal voneinander abweichende originale `referenceValue`-Angaben `1.0256479759818967e-16` versus `1.344340416617183e-16`. Der bestehende Decoder-/Originalfeldvertrag verlangt `referenceValue == 0.0`, daher ist `wmoPackingMetadataConsistent=false` und die notwendige Quantisierungsschranke wird nicht zur Produktzulassung berechnet.

Die neue **synthetische, deterministische** Testfunktion `test_realistic_48h_tiny_nonzero_ccsds_reference_remains_unapproved` in `tools/ruc/test_d2_tot_prec_quantization_qa.py` nutzt die Originalkonstanten auf einem eigens bezeichneten **4-Zellen-Fixture** (anstelle einer vorgetäuschten realen 542.040-Punkte-Datei). Sie beweist nur den präzisen bisherigen Reject-Fall:
- Beide Packungsquanten exakt `2^-9`, eine negative Differenz exakt `−Q`, Bitmap-Übereinstimmung, Position der synthetischen Negativzelle.
- **Exact-zero-reference-Gate weiterhin aktiv:** `wmoPackingMetadataConsistent=false`, `necessaryRoundingAllowanceMm=null`, `negativeCellsNotExplainedByPacking=1`, `allNegativeCellsRoundingCompatible=false`, `productionApproved=false`.
- Die Eingabewerte und das fehlende Rasterelement bleiben unmodifiziert; **Missing Data wird nicht als 0 verwendet**, kein Clipping, keine geglätteten Extreme, keine erfundene gültige Akkumulation.
- Der Test ist ein **Regressionsevidenzfall** gegen unbemerkte Toleranzaufweichung, **kein** proof-of-physics und keine WMO-/DWD-Freigabe.

## Konsequenz für Weiterarbeit
Keine Änderung an `tools/ruc/d2_tot_prec_quantization_qa.py`, `tools/ruc/d2_native_eight_bundle.py`, GRIB-Raster-/Bitmap-Quellen, `productionApproved`, Release-/Workflow-/Worker-/iOS-Code. Vor jeder fachlich begründeten späteren Änderung zuerst beide Original-GRIB2-Nachrichten unabhängig anhand SHA, stepRange, CCSDS-Referenzwerten in Speicherpräzision, Skalen, Bitmap, Zellen, Monotonie und echten +47/+48h-Modelllaufkontrollen lesen. Die notwendige Bedingung `−delta <= (Q_prev+Q_curr)/2` ist **nicht** hinreichend für einen physikalisch zulässigen Akkumulationswert. Keine pauschale `epsilon`-Freigabe aus dem Fixture.

Der vollständige SHA-gebundene kombinierte GitHub-Check (`MID Draft · gezielte Regressionen`, D2 native eight-field physics/no-data und Vitest) ist nach jeder Integrationsänderung neu erforderlich. Vollständige Source/Core/Heavy-, echte Originaldaten-/DWD-/Signer-/Publisher-/Browser- und install-mid/Pages/Stable-Gates weiterhin separat offen.
