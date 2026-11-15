# MID-Karten – ergänzendes Accessibility-/Zeitsemantik-Audit (QA-Draft, 15.11.2026)

**Verifizierte Basis:** `main=mid-stable=f9c0b182b0e11278651e2afa13039015e1aa0f0b`, Release v0.9.85.482; AGENTS.md, MID_SOURCE_OF_TRUTH.md, contracts/index.json und fünf aktive Rulesets. Keine direkten Writes an Stable/Main. Diese Ergänzung verwendet **ausschließlich noch nicht durch den Leitchat-Releasekandidaten #822 belegte Dateien**.

## Aus Audit und Repositorycode belegte Punkte

1. **Kartenbereich / Komposit:** Die gemeinsame `MapTimelineRange` war ein natives Range-Input mit einem Frameindex (`min=0`, `value=index`), dessen dynamischer tatsächlicher Zeitpunkt allein im wechselnden `aria-label` stand. Screenreader können dadurch `Wert 12` statt `WMO-/Beobachtungs-/Prognosegültigkeit 15:15` ankündigen. Die Quellzeit ist bereits vorhanden, als `targetMs` und `selectedFrame.phase`.
2. **Kartenbereich / Wetterkarten:** `WeatherMapsPanel` verwendet den gemeinsamen Timeline-Slider über eine explizite `rangeControl`-Override. Eine nur auf `MapTimelineControls` angewandte Korrektur würde die reale zweite Kartenoberfläche verfehlen. Die meteorologisch echte Gültigkeit ist als `selectedTime` plus `referenceTime` und `phaseLabel` vorhanden.
3. **Kartenzeit:** Das bereits sichtbare `<time>`-Element hatte kein ISO-Gültigkeitsdatum. Ein zusätzliches sichtbares `Uhrzeit-Pill` ist wegen des MID-Kartenzeitvertrags ausdrücklich nicht zulässig. Abhilfe: `datetime` am vorhandenen einen `<time>`, kein zweiter Status-/Zeittermin.
4. **Umfeld-Wetter:** PR #822 übernimmt bereits die maßgeblichen Umfeldkarten-Dateien aus früherem #820 und weiterentwickelt diese. Dort sind die quantisierten UTC-Viertelstundentermine, originale Wolken/SigWx-Herkunft, getrennte realörtliche Temperaturwerte und Responsive-CSS bereits in Bearbeitung. **Die vorliegende Ergänzung schreibt deshalb nicht erneut in `CurrentSurroundings*`, `currentSurroundingsCloudImage.ts`, CSS-Pipeline oder Quellzeitverträge.** Verbleibende Punkte: Original-IR10.8-Bildpipeline und tatsächliches Safari-/iPhone-Screenshot-/Fokus-/Überlauf-Audit.

## Implementierter disjunkter QA-Fix

- `MapTimelineRange`: optionales `valueText`, direkt an der nativen `input type=range`-Eigenschaft `aria-valuetext`. `aria-label` bleibt eine stabile, verständliche Funktionsbezeichnung, `aria-valuetext` vermittelt die selektierte Modell-/Messzeit samt Phase. Ohne Wert bleibt bisherige native Semantik unverändert.
- `MapTimelineControls`: optionales `rangeValueText` und `timeISO`, durchgereicht an die *bestehenden* Slider- und `<time>`-Elemente. Kein zusätzliches DOM-Pill, keine neuen Timer, Netzwerkrequests, Persistenz- oder Rechenpipelines.
- `RadarPanel`: Wert besteht aus der bereits bestätigten relativ/absoluten Kartenzeit plus echter Framephase Beobachtung, Nowcast oder Modell; `timeISO` ist `selectedFrame`-gebunden. Keine Zeit für fehlende Frames erfinden.
- `WeatherMapsPanel`: `rangeValueText` ebenfalls am expliziten `MapTimelineRange`-Override, mit Originalgültigkeit, Vorhersagevorlauf und Produktphase; `timeISO` ist `selectedTime`-gebunden.
- `tests/unit/map-timeline-accessible-validity-qa.test.ts`: direkte React-Server-Render-Regression des nativen Input-Werts, gültigem `datetime`, fehlenden Daten, Abwärtskompatibilität und beider Consumer. Diese statischen Komponentenchecks sind **keine** VoiceOver-/iOS-Abnahme.

## Integrationsgrenzen

- **Leitchat-PR #822** ist ein bereits aufgebauter gemeinsamer Performance-/Umfeldkarten-Source-Train und darf nicht durch ein isoliertes Merge aus diesem QA-Draft ersetzt werden. #822 basiert auf **früherem #820-Commit `2e146545…`**, während #820 später weitere IR10.8-Originaldatenvalidierung auf `f90d5999…` fortgeführt hat. Vor einer Integration des späteren IR-Scopes muss der Leitchat den tatsächlichen Git-Blob-Diff **selektiv** vergleichen; keine blind doppelten oder veralteten PR-Merges.
- Der disjunkte Timeline-Kandidat wird nur nach aktuellem Stable-/Parallel-PR-SHA-Abgleich selektiv importiert. Aktualisierte Versionsspiegel und Nutzer-Changelog erst beim echten Build. Kein direktes `main`/`mid-stable`-Write, kein autonomer Merge/Installer/Stable-Promotion.
- Pflicht vor Produktionsfreigabe: CI Vitest und TypeScript am exakten Head; Source/Core/Heavy/Browser/WebKit 320/390/430/834 px und Tablet hoch/quer, Light/Dark, Fokus-/Tastatur-/Touch- und 200%-Text-Zoom, reale iOS-/VoiceOver-Abnahme separat. Hier wird keine Live-Browserprüfung behauptet.
