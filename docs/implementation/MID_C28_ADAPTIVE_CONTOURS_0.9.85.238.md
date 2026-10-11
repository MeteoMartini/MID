# MID-C28 · 0.9.85.238

Basis: main = mid-stable 6f20ff46587e099aa752939d437934a9d67be0db (.237). Keine überlappenden Source-PRs; nur bestehende Dependabot-PRs. Replit bleibt unveränderte alte UI-Werkbank. Veröffentlichung nur Source-Gate → Release-Bot → Server-ZIP → Installer → Worker/Pages → Stable-FF.

## Konturen und Druckzentren

Gemeinsame numerische Konturen: Zoom <5 zeigt 16 hPa bzw. dam, Zoom 5..<7 zeigt 8, Zoom >=7 zeigt die vorhandenen 4. Kein neues Regridding, keine erfundenen Zwischenwerte, kein Datenabruf beim Zoomen. Separate MapLibre-Zoombänder verhindern, dass ausgeblendete Beschriftungen Kollisionen oder Treffer belegen. Druck unter 1013 hPa gestrichelt; ab 1013 durchgezogen. RH700-60/80-Stile und Theta-E-Konturen bleiben fachlich getrennt.

Verbraucher: Synoptik-Komposit, reine Isohypsenkarten, native Bodendruckkarten sowie zusätzliche Isobaren auf anderen nativen Feldern. Native PNG/SVG-Exporte verwenden denselben Druckschwellenwert; ein statischer Export hat keinen interaktiven Zoom. Bei anderen Bodendruckmodellen ersetzen genau passende numerische MSL-Konturen den festen WMS-Linienstil bzw. ergänzen die WMS-Fläche. Modell, INIT und sichtbarer Gültigkeitstermin müssen exakt passen. Fertige Anbieterbilder ohne passende numerische Konturen können nicht selektiv umgestaltet werden; kein Nachzeichnen aus Pixeln oder Ersatzmodell.

T/H ausschließlich bei parameter=pressure bzw. kind=pressure; kein T/H im Synoptik-Komposit, in reinen Höhenkarten, Theta-E oder zusätzlichen Isobaren auf Temperatur-/Windkarten. Quellenvalidierung und Exportdaten bleiben unverändert.

## Ortszeile und Responsivität

Deckender Hintergrund und isolierte, untransformierte Textdarstellung, ohne transparente gerundete Ränder oder Textschatten. Suchkopf bei Ortszeile ebenfalls deckend. Kein pauschales Abschalten der Blur-Effekte von Dialogen. Die Browserfixture besitzt jetzt die tatsächliche navigation-bottom-tabs-Klasse; Prüfung umfasst Top-Hit-Test, 500.5px-Scroll, Filter, Transform, deckenden Hintergrund, Namen, Touch-Ziele und Überlauf. Geräte-WebKit-Unschärfe ist ohne echte Geräteprüfung nicht als endgültig widerlegt auszugeben.

## RUC-Reduktionsprüfung

Realer veröffentlichter Lauf 2026-10-11T15:00: 898918677 Objektbytes, 20103168 bereits deduplizierte Bytes. ICON-D2-Druckkatalog tatsächlich +1/+2/+3/+4/+5/+6/+12/+24/+48. Beleg: MID_C28_STORAGE_SAMPLE_2026-10-11.json enthält Manifest-/Objekthashes und 24 Rand-/Mittel-/End-Stichproben aus acht Produkten, jeweils vollständig byteweise rückgeprüft einschließlich Missing-Bitmuster.

Stichprobensummen: roh 15162160 B; gzip6 2946622 B; Byteplanes+gzip6 2432305 B; Delta+Byteplanes+gzip6 2817818 B. Delta ist hier schlechter als Byteplanes; keine produktive Aktivierung und keine Gesamtlauf-Hochrechnung. Sparse/Missing-Randchunks komprimieren stärker als gefüllte Innenchunks, weshalb alle drei Positionen dokumentiert sind. Neuer Delta-Prüfmodus ist opt-in; stündliche Produktion erhält keine zusätzliche Kompressionsarbeit. Bisherige Vollinventarmessung für gzip/Byteplanes und bestehende byteidentische Deduplizierung bleiben bestehen.

Nachtrag hyperlokale Stunden: Öffentliches Manifest auf midwx.app/ruc/latest.json vollständig geprüft: deterministisch und RUC-EPS jeweils identische 15 Termine INIT bis +14 ohne Lücken. Fetch-Workflow fordert 14 Stunden, hourly_targets erzeugt 0..14; Pages verändert diese Zeitachsen nicht, der Punktdecoder liest alle Stunden. Die Kurzfristfusion verarbeitet die vorhandenen passenden Stunden mit fachlicher, zum Ende auslaufender Gewichtung; keine Stunden wurden für Speicherersparnis entfernt. Keine Wiederherstellung oder künstliche Verlängerung nötig. Belegzeitachse und Manifest-Hash im Speicherbeleg.

Weitere mögliche Schritte: versionierte gzip/Byteplane-Speicherung erst nach begrenztem Decoder, Raw-/Wire-Hashes, Worker-CPU-/Latenz-/Cacheprüfung und echten gesamten Laufbytes; feldgetrennte oder blockweise Differenzierung separat messen, da das aktuelle point-time-field-Layout Wechsel zwischen ungleichen Parametern enthält. Lookup-uint32 wird nicht als int16 behandelt. Keine zeitliche/räumliche Ausdünnung, keine reduzierte Genauigkeit, keine gestrichenen Modelle/Parameter oder Budgeterhöhung. Retention allein senkt nicht den aktuellen Pages-Snapshot.

## Prüfungen und Grenzen

962 Appregressionen, 157 Python-Tests; responsive Orts-/Profilmatrix 48 Fälle (320/390/412/844/1024/1440, Light/Dark, Classic/Next, band/squares) und Kartenmatrix 24 Fälle mit tatsächlichen MapLibre-Zoombändern, Druckschwelle, numerischem WMS-Ersatz und T/H-Ausschluss. Produktionsbuild, Typecheck, Worker-Syntax und Produktionsaudit ohne Befunde. Alle genannten lokalen Prüfungen erfolgreich abgeschlossen. Erneute vollständige Appregression nach finalem Build: 962/962, 0 Fehler; expliziter Python-Runner: 157/157, 0 Fehler. Kartenmatrix in drei Gruppen zu acht Fällen vollständig grün. Source-Gate und produktive Release-Gates müssen anschließend den exakt veröffentlichten Commit prüfen.

Frühe lokale Fehlstarts: wiederverwendetes dist enthielt zwei Versions-Hauptbundles; frischer Release-Build hält unveränderte Budgets. Zwei gleichzeitige Vite-Testserver verwendeten denselben Dependency-Cache; getrennte QA-Caches verhindern deren gegenseitige Invalidierung. Eine neue WMS-Prüfung wählt den exakten Gültigkeitstermin statt eines flüchtigen Auswahlindex; DOM-Optionen werden auf Vorhandensein geprüft, da native Options nicht sichtbar sind. Die numerische reine Druck-Linienkarte wartet nur auf den passenden verifizierten numerischen Termin, nicht auf ein anschließend ersetztes WMS-Bild. Kein Test-/Timeout-/Budget-Abschwächen. Vorherige Build-Ausgaben sind erhalten; source-only PR transportiert keine dist-Artefakte oder ZIP.

Browserfixtures sind keine physische iOS/WKWebView-/VoiceOver-Abnahme. Vollständige wissenschaftliche Naht-/Golden-/Conservation-, optionale Parameter-, SLO-/Alarm- und Geräteperformance-Abnahmen bleiben offene Folgearbeit; beide Audit-PDFs bilden weiterhin den Prüfrahmen. Kein Gesamtaudit-Abschluss.
