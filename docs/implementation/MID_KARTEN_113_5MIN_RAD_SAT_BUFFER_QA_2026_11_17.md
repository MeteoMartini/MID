# MID-Karten 1.13 · Rad/Sat 5-Minuten-Achse und flackerfreie Originalbilder

**QA-DRAFT · NO READY / NO MERGE / NO RELEASE.** Authoritative base: main=mid-stable `a78465b655d25cafc9ecc0390080694cb7aca957`, v0.9.85.486; fünf aktive Rulesets.

## Verifizierte Ursache und Abgrenzung

- DWD RADOLAN RY/RX bietet echte 5-Minuten-Quelltermine. EUMETSAT Meteosat-11 MSG Rapid-Scan kann 5 Minuten liefern; MTG Full-Disc 10 Minuten, weitere MSG-Produkte 15 Minuten. Maßgeblich sind ausschließlich die tatsächlich vom MID-`composite-times`-Katalog belegten Originale.
- `src/MapLibreCore.tsx` / `ImageQuadLayer` enthält bereits den GPU-Readiness-Guard und den 350-ms-Crossfade aus MID C441. In `CurrentSurroundings` wird der Radar-Layer bei einem neuen Zeitschritt jedoch wegen des noch nicht exakt passenden `selectVerifiedSurroundingsRadarFrame`-Ergebnisses vorübergehend **ausgehängt**, wodurch der interne Texturpuffer verlorengeht. Der Satelliten-Layer kann bei fehlendem Original/Fehler ebenso entfernt werden.
- Die laufenden LC-PRs #858 und #868 ändern aktuell `src/CurrentSurroundings.tsx` und `src/MapLibreCore.tsx`. Daher nur **isolierte neue QA-Dateien**, keinerlei konkurrierender Produktiv-/Worker-/Source- oder Versionsspiegel-Write. Übernahme ausschließlich nach neuem Leitchat-HEAD-/Diff-Abgleich.

## Neues funktionsfähiges, aber QA-only Zustandsmodell

`tests/helpers/surroundingsRadSat5MinuteBuffer.ts` und seine Vitest-Suite kapseln:

1. `radSatTarget5m` rundet die Anwahl auf das letzte abgeschlossene **UTC-5-Minuten-Raster** und bietet −45 bis +120 Minuten (Schritte −9…+24). Wolken/SigWx behält weiterhin die 15-Minuten-Zeitachse.
2. `selectRadar5m` nimmt nur passende echte DWD-Radar-Originale innerhalb 2,5 Minuten zur Zielzeit; für »Jetzt« darf der zuletzt katalogisierte Beobachtungstermin höchstens zehn Minuten alt sein. Zukünftige Schritte akzeptieren nur echte Nowcast-Frames, nie Beobachtungen mit neuem Label.
3. `selectSatellite5m` kann bei den 5-Minuten-Auswahlschritten dasselbe echte 10-/15-Minuten-Satellitenoriginal mit seiner **unveränderten Quellzeit** anzeigen, höchstens 15 Minuten alt und niemals als Satellitenvorhersage.
4. `requestBufferedFrame` hält einen bereits sichtbaren, zum selben Ort/BBox/Anzeigemodus gehörenden Quellenframe bei neuer Anforderung. Erst ein identischer, tatsächlich geprüfter MapLibre-GPU-Ready-Callback darf via `commitBufferedFrame` den Bildwechsel abschließen; verspätete Antworten bleiben wirkungslos. Fehler behalten den vorherigen Originalframe, ohne dessen tatsächlichen UTC-Zeitstempel zum neu gewählten Ziel umzudatieren. Derselbe URL-/Frame-Vertrag führt keinen weiteren Request aus. Bei Ortswechsel, falschem BBox-Scope oder Beobachtung/Nowcast-Phasenwechsel wird der alte Frame sofort gesperrt.
5. `bufferedFrameInfo` gibt **Zielzeit getrennt von Bildoriginalzeit** zurück, einschließlich Lade- und Fehlerstatus.

**Wichtig:** Dieses reine Modell liest keine echten WMS-Pixel. `verifiedOriginal:true` ist eine notwendige Vorbedingung des noch zu integrierenden Quellen-/Pixelprüfers, **kein** hier erwiesener Live-Status. Die QA-Dateien sind nicht in der produktiven `src/`-Importkette. Erfolgreiche Unit-Tests beweisen noch keinen flackerfreien Live-MapLibre-Render.

## Kontrollierter Leitchat-Handoff zur tatsächlichen Produktumsetzung

- Nach SHA-Hunk-Abgleich die 5-Minuten-Selektoren an `CurrentSurroundings` anbinden; Sliderlimits, −/+5-Min-Buttons, relative Uhrzeiten, ARIA/Tastatur, Jetzt und geladene DWD-/Sat-Katalogzeiten konsistent ändern. `CurrentSurroundings.mode` bleibt persistent, `cloudStep` unverändert 15 Minuten.
- In Radar **und** Satellit dieselbe `ImageQuadLayer`-Identität bei unverändertem Kartenausschnitt behalten; niemals wegen eines noch ausstehenden `displayedRadar`-Werts unmounten. `key` ausschließlich an Geo-Scope, nicht an die Zeit binden. Neue URL erst nach passendem Quellenoriginal anfordern, alten Texturframe bis MapLibre-`render/isSourceLoaded` belassen; vorhandenen 350-ms-Crossfade samt `prefers-reduced-motion` wiederverwenden. Keine parallele zweite Fade-Engine.
- UI-Status muss auch während der Überblendung den tatsächlichen **angezeigten** Originalzeitpunkt und separat den angefragten Zieltermin melden. Kein altes Satellitenbild als Zukunft, kein altes Radarbild als neuer Nowcast. Es bleibt korrekt, beim Wechsel Beobachtung↔Nowcast kurz die echte Kartengrundlage zu zeigen.
- Wiederbesuchte Frames nicht ohne Not neu abrufen. Der bestehende Renderer erstellt bei URL-Wechsel dennoch `new Image()`; ein tatsächliches RAM-/HTTP-Cache-verspricht die QA daher **nicht**. Erst nach begrenztem 6–8-Frame-/TTL-/Bytes-Budget sowie CORS/NoData/Safari-Messung eine Decoder-Cache-Erweiterung erwägen.
- Bestehende 15-Minuten-Sat/Rad-Testtexte/-Assertierungen gezielt auf fünf Minuten anpassen; Cloud/SigWx-Original-only-Verträge nicht abschwächen. Reale Browsermatrix 320/390/430/834/Desktop Light/Dark, Rapid-Scrub, fehlende Originale, CORS/Alpha-NoData, stotternde Netzverbindung, GPU-Ready, Reduced Motion und echtes iOS/VoiceOver separat prüfen.

**Primärquellen:** https://www.dwd.de/DE/leistungen/radolan/produktuebersicht/radolan_produktuebersicht_pdf.pdf · https://www.eumetsat.int/our-satellites/meteosat-series · https://maplibre.org/maplibre-gl-js/docs/API/classes/ImageSource/

**Release:** Nur erfolgreicher finaler Source-PR-Gate→SHA-Merge→ZIP→Installer→Worker/Pages→Stable. #740/#839 bleiben dem Release-Spezialchat vorbehalten. Dieser PR ist **QA, nicht Live-Aktivierung**.
