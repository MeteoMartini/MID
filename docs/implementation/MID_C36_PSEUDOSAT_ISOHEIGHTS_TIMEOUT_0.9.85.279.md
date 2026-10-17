# MID v0.9.85.279 – Karten-Konturen und Wetterabruf-Recovery (Issue #390)

## Verifizierte Herkunft
Freigegebene Basis: `main = mid-stable = ee2c00bfd0db42cf0f48715bccd0dbff1e221c42` nach Installer #39012604444 (v0.9.85.278). Alle Arbeiten auf `chatgpt/v0.9.85.279-pseudo-isohypses-timeout`, nicht auf Replit oder geschützten Branches. Keine neue Datenquelle / kein Abbau von Release-Gates.

## Pseudo-Satellit, Kartenbasis und Persistenz
- Die Wahl `Standard / Modell-Wolkenbild`, Wetter-Farbcodes nach WMO 4677, Quellmodell und Hauptparameter waren schon über `mid:cloud-weather-render:v1` bzw. `mid:unified-map:v1` gespeichert. Bestehende Speicherung bleibt kompatibel. Der neue, separate `mid:cloud-weather-isoheights:v1` schaltet die 500-hPa-Isohypsen unabhängig von `mid:cloud-weather-isobars:v1`. Bei gesperrtem Storage gelten sichtbare Session-Werte weiter; die Persistenz wird nicht fälschlich versprochen.
- Nur die geografische Light-Kartenbasis erhält bei aktiver **schematischer** Modellwolken-Vorhersage (`modelAtSelectedTime`) ein gedämpftes mittelgraues Land und gedämpftes Blau für Wasser. Echte Beobachtungen, Radar, Satellitenmessungen, andere Karten und Dark bleiben unverändert. Wolken-, Wetter-, NoData-, Gefahrensymbol- und Interpolationswerte werden nicht verändert.
- Isobaren: MSLP hPa aus bisher verifizierten nativen/synoptischen Feldern; Isohypsen: 500-hPa-Geopotential in **gpdm** aus `SynopticField.height`. Beide Quellen müssen **selbes Modell, Run, Gültigkeitszeit** wie Wolken/WW besitzen. Abweichende oder fehlende Felder bleiben unsichtbar und der Status meldet die Abwesenheit; niemals Druck- und Höhenlinien vermischen, keine künstlichen Zwischenframes. GDPS bleibt ohne diese modellgebundenen Konturen.
- Identische Konturwahl/Geometrie auf Karte, SVG- und PNG-Export; Höhenlinien separat in Gold mit gpdm-Legende, Drucklinien separat in hPa. Schematisches Wolkenbild ist keine echte Satellitenradiometrie und ersetzt keine DWD-Beobachtung oder Warnung.

## Ortswechsel-Timeout
Screenshot .277 (17.10.2026, Sportplatz Rankenhohn) zeigt sporadisch `Wetterabruf hat das Zeitlimit überschritten.`. Fehlerpfad: 6500-ms-Grenze direkter Open-Meteo-Best-Match-Kernvorhersage; Worker-Proxy nachfolgend; dann ausschließlich passender lokaler Cache. Nach 1. bestätigtem Timeout ohne Cache wird genau **ein** weiterer Fetch für den unveränderten Ort/Gültigkeitskontext angestoßen, wenn Browser sichtbar und online ist. `seq.current` schützt vor Antworten und Timern älterer Orte. 429-Cooldown und Speicherkontingent-Fehler behalten ihre Spezialbehandlung; nach erneutem Scheitern ist ein ausdrücklich beschrifteter manueller Retry möglich. Keine Blind-Endlos-Retries oder falschen null-Wetterwerte.

## Regression und offene reale Abnahme
- Neuer `scripts/test-mid279-pseudosat-isoheight-timeout.mjs`: gespeicherte Einstellungen, Same-Run/Term/Model- und GDPS-Sperren, 500-hPa-Grafik und hPa/gpdm-Einheiten in Exporten, transparentes Missing, Light/Dark-Quelldisziplin, bounded Retry- und veraltete Ortsgeneration-Quellverträge.
- Vorhandene `test-pseudo-satellite-cloud-render-0985276` und `test-pseudo-satellite-isobars-0985277` prüfen die aktualisierte Export-Signatur; fachlicher Pixel-/WMO-Kontrakt bleibt.
- Verbindlich: vollständiger Source-Core, Heavy-native/unified/mountain, temporale Cloud/WW- und iOS-Web-Bundle-Gates, Safe-Area/Touch/Fokus/Overflow klein-groß Smartphone/Tablet/desktop, Light/Dark, PNG/SVG. Physische iOS-/VoiceOver-Abnahme noch gesondert erforderlich.
- Nur nach vollständigem grünen Source-PR-Gate folgt SHA-Bot-Merge, serverseitiges ZIP, Installer, Worker/Pages und Stable-Promotion.
