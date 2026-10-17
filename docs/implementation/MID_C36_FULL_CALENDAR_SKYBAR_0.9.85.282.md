# MID-C36 · Ganzer Kalendertag in Tagesansichten (v0.9.85.282)

## Ausgangslage

Verifizierte Stable-Basis: `5153a43979a5b995008e554d1ee8bf111c8dbe5a` (v0.9.85.281). User-Screenshot und Issue #395. Alte Tages-Skybar verwendete `epochs[0]` als relativen Beginn, und einzelne Band-/Quadratsegmente reichten bis zur **nächsten vorhandenen** statt zur nächsten realen Stunde. Stunden nach 14:00 wurden damit auf 00:00 bis 24:00 gestreckt, interne Lücken übermalt.

## Fachliche Zeit- und Datenverträge

Tagessicht = lokaler IANA-Kalendertag `[00:00, nächster Tag 00:00)`; Echtzeitdauer an DST-Grenzen 23/24/25 h. Rollierende Diagramme/Nowcast = ab jetzt bis +24 h oder jeweilige Kurzfristspanne, **kein** Volltag. Gültige `Day.precipitation` und `Day.sunshineDuration` sind die Tagessummen; fehlende Hour-Intervalle dürfen sie nicht reduzieren oder ersetzen. Fehlen Tageswerte selbst, erfolgt keine Schätzung aus unvollständigen Stunden. Nicht verfügbare Skybar-Zeiten als transparente/neutral gekennzeichnete Lücken, ohne künstliches Aufhellen, Sonnen- oder Regenfarben.

## Codepfade

- `daySkybarTimeline.ts`: `daySkybarCalendarWindow`, `daySkybarHourEndPositions`, `daySkybarUnavailableRanges`.
- `detailSkyBar.ts`, `SkyBarSegments.tsx`: optionale echte Endkoordinaten und explizit markierte unbekannte Zeitabschnitte; Solar-Clipping in den tatsächlichen Stundenintervallen.
- `ForecastCockpit.tsx`: Tageskarten, Kurvenübersicht, Widget-Kurven, Tages- und Nachtbänder. Filter auf den exakten Kalendertag und Stundenachsen bleiben getrennt von rollierenden Nowcastfenstern.
- `SevenDayForecastSummary.tsx`: Tageswetter-Bewertung nutzt verfügbare Stunden des kompletten Tages statt bloß zukünftige. Bereits vergangene Stunden dürfen nicht nach fortgeschrittener Uhrzeit aus dem Tagescharakter verschwinden.

## QA / Abgrenzung

Regression `scripts/test-full-calendar-skybar-0985282.mjs`: Tagesbeginn, 14 Uhr, 23 Uhr, interne Lücken, komplette Tageslücke, Zeitumstellung, quadratische Zellen/Bandenden, unberührte Tagesakkumulationen und rollierendes Profil. Besonders 23/25h und offene Datenlücken nicht durch Proportional-Interpolation auffüllen. Appweite visuelle Matrix Light/Dark, mobile portrait/landscape, tablet, desktop, Widget/SVG/PNG prüfen; echte iOS/WKWebView/VoiceOver-Geräteprüfung nur bei tatsächlichem Gerät. Kein CI-/Source-Grün vor dokumentiertem Gate.
