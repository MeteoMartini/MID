# MID 0.9.85.463 · DWD-Signer-Frische und OPERA-Objektfallback

## Produktionsbefund
Der geschützte DWD-Originalsigner #43331143841 hat echte 542040 native Originalpunkte, 72 Felder und 73 SHA-gebundene Objekte geliefert. Eine frühere RUC-Zulassung war erfolgreich. Der spätere Produktivlauf #43378017097 scheiterte ausschließlich beim optionalen Anschluss mit `ValueError: Attested ICON-D2 model run is stale or future-dated`; die signierte ursprüngliche DWD-Modellzeit überschritt inzwischen die unveränderte 12-Stunden-Grenze. So darf keine meteorologisch überholte Originalkarte erscheinen; die getrennte stündliche RUC-Kernpipeline sollte trotzdem weiterlaufen.

## Enger Fail-closed-Vertrag
`attach()` bleibt unverändert streng bezüglich SHA, Source-Commit, indexSha256, Signer-/Inventar-Belegen, Snapshot-Größe, UTC, NoData, nativer Rastergeometrie, 900-MB-Grenze und atomarer Veröffentlichung. Nur nach validiertem Snapshot und signierter Index-/Report-Provenienz sowie eindeutigem `age > MAX_AGE` kann der automatisierte Scheduler `--skip-stale` setzen. Er erhält `status=skipped-stale-attestation` und `nativeAdmitted=false`, belässt `latest.json` unverändert und publiziert keinen `modelFieldsNative`-Pointer. Ein explizit gepinnter Signer wird niemals optional ausgelassen. Ein Zukunftslauf ist kein Ablauf: fatal.

## Offizielle Radarquelle
OPERA DBZH wird ausschließlich unter gleichem validierten HDF5-Objektschlüssel über die vorhandenen offiziellen MeteoGate/ECMWF-/CloudFerro-Speicher versucht. Eine gültige Response verlangt HTTP 200, Body und passenden binären Inhaltstyp; Fehler erhalten keinen positiveren Cache. Erfolg wird als Primär-/Backup-Provenienz ausgewiesen. Beide Quellen ausgefallen → 502/no-store, nicht Regen=0.

## QA und noch offene Produkttests
OPERA-Regression testet Primär-500, Backup-Erfolg, beide Quellen ungültig und veralteten Datenkatalog. Die RUC-Python-Suite enthält neue negative Tests für Ablauf ohne Mutation, explizit strenge Zulassung, Zukunftsdatum und Indexmanipulation. Vollständige CI/Browser- und Publikationsnachweise sind für den Release-Kandidaten separat erforderlich. Public RUC `modelFieldsNative` + alle Originalobjekte + Sölden/NoData/Export sind weiterhin ein gesondertes Exit-Kriterium für #446.
