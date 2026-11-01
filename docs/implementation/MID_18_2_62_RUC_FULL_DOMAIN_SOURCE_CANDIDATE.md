# MID 18.2.62 – DWD ICON-D2-RUC Vollgebiet, unveröffentlichter Quellkandidat

## SHA-Verifikation
Basis: main=mid-stable v0.9.85.392 @ 74f39cc3ea371e8e1ddae5d09d16e77241864a32; Installer #41279397041 success, 5 Rulesets. Parallele PRs #449/#555 (Original-GRIB-Inventar), #557 (RUC-Performance) und #559 (GeoSphere .393) bleiben unverändert. Dieser unversionierte Draft wird nicht produktiv integriert.

## Problem und Lösung
Originaler DWD-RUC-Source-Lookup aus build_ruc_bundle.py: BBOX [-3.85,43.18,20.22,58.05] bei 0,025° und max. 5km nächstem nativen DWD-Gitterpunkt, explizit UINT32_NODATA für nicht belegte Stellen. ruc_map_candidate.py und build_ruc_synoptic_fields.py beschnitten danach erneut auf 47..55,2°N / 5,5..15,6°E. Beide Quellgeneratoren behalten jetzt die vollständigen, bereits SHA-geprüften Source-Lookup-Zellen ohne zusätzliche meteorologische Interpolation. Bestehende Null-/Missing-Masken, quantisierte nativ geprüfte Maxima, Original-Run und ValidTime bleiben erhalten.

## Zulassung und Budgets
admit_ruc_map_candidate.py führt vor jeder Produktionsobjekt-Schreibung die bestehende unabhängige SHA-/Byte-verifizierende audit_model_domain_coverage.inspect-Quelle über alle sechs RUC-Kartenparameter und sämtliche Vorlaufstunden aus. Masken-, Werte-, Lookup- oder Vollgebietsabweichungen blockieren den optionalen Kartenbestandteil, erhalten den verifizierten Core/EPS20-Snapshot unverändert. Die vorhandenen 12 MB Dekodierbudget je Frame, 100 MB Kandidatenbudget und 900 MB Gesamt-Pages-Snapshotbudget bleiben unverändert. Ein unzulässiges Budget wird nicht durch Datenlückenauffüllung oder reduzierten Source-Scope geheilt.

## Client / QA
nativeModelFields.ts prüft Druckkonturen innerhalb der tatsächlichen Feldachsen statt festen Deutschlandgrenzen, unter weiterhin plausibler Regionenhülle. Für reine deterministische germany_regular-lat-lon-Produkte bleibt die alte Deutschland-Footprint-Mindestprüfung erhalten. NativeModelMap.tsx verwendet echte Feldachsen für Kartenausschnitt/Favoriten und unterscheidet RUC-Nearest-Native-Cell (max. 5 km) vom direkt remappten ICON-D2. PNG/SVG verwenden den gleichen Originalfeldpfad. Bestehende Python-/Node-Pflichtregressionen wurden um Außengebiet, NoData, Konturen, source-bound Admission und dynamische Bounds ergänzt, ohne Testliste zu kürzen.

## Offene tatsächliche Beweise vor Release
Mindestens drei aufeinanderfolgende echte DWD-Original-GRIB-Läufe sämtlicher angebotener Felder/Leads (Issue #446 und PR #555), unabhängige vor-Quantisierungs-/Originalextremvergleichsberichte, 27h-E2E-RUC/Pages/Worker-Readback, Source-Budget und Prozess-Heap-Probe, 168h Frische-Qualifikation und reale Browser-/iOS-/VoiceOver-Abnahme fehlen noch. Der deterministische germany_regular-lat-lon-Quelle kann nicht durch reine RUC-Änderungen ein über den gelieferten Quell-BBOX hinausgehendes Vollgebiet hinzugefügt werden.

Status: WIP-Draft. Kein App-Build, keine neue Version, kein Production-Adoption-Gate erfüllt. Ein späterer Release braucht frische Stable-Provenienz, vollständige Source-PR-Gates, SHA-Bot, serverseitiges ZIP, Installer, Worker/Pages und Stable-Promotion.
