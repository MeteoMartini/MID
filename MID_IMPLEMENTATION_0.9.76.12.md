# MID v0.9.76.12 – Konsolidierung der parallelen v0.9.76.11-Linien

Stand: 2026-08-31

## Ausgangslage

Am 31.08.2026 entstanden nahezu zeitgleich zwei gültige v0.9.76.11-Stände auf
derselben gemeinsamen Basis v0.9.76.10:

1. DWD-Ortsausschnitt für „Wolken + Niederschlagsart“ mit Originallegende und
   Originalpixel-Auswertung.
2. Feinschliff des 24-h-Wetterprofils für mobile Dichte und ruhigere Achsen.

v0.9.76.12 führt beide Linien ohne Rollback zusammen.

## Bewahrter DWD-Ortsausschnitt aus der hochgeladenen v0.9.76.11

- deutsche Standorte/Favoriten starten als standortzentrierter Ausschnitt des
  unveränderten amtlichen DWD-Kombinationsbilds;
- Marker und Bildklicks bleiben an normierte Originalpixel und den gebundenen
  Produktzeitstand gekoppelt;
- Zoom/Panning verändern ausschließlich die Ansicht;
- die fest sichtbare Originallegende stammt aus derselben geladenen DWD-
  Bildantwort;
- die bilineare reine Ansichtsabbildung, Randabdeckung und inverse
  Originalpixel-Rückrechnung bleiben durch
  `scripts/test-dwd-location-crop-original-pixels-097611.mjs` geschützt;
- die angepassten DWD-Georeferenzierungsregressionen aus dem Upload bleiben
  vollständig erhalten.

## Zusätzlich integrierter 24-h-Profil-Feinschliff

- die redundante Kopf-Pille „Start bis Ende Uhr“ entfällt; eine dezente
  Fenster-Notiz informiert nur noch über den gleitenden +24-h-Bezug;
- kompaktere Seitenränder schaffen insbesondere mobil deutlich mehr Nutzbreite;
- Achsen-, Einheiten-, Parameter- und Wolkenlabels sind typografisch
  vereinheitlicht und mit einem kontrastwahrenden Hintergrund-Stroke gegen
  optische Überdeckung geschützt;
- Nachtstunden bleiben über dieselbe gemeinsame Zeitachse markiert, sind aber
  durch reduzierte Füllung, Schraffur und Opacity deutlich weniger dominant;
- die separate dominante obere Kalenderzeile entfällt; obere und untere
  Zeitachse verwenden dieselben sparsamen Zeitmarker, Tageswechsel werden
  kompakt ausgewiesen;
- das rollende Fenster `jetzt` bis `jetzt + 24 h`, die gemeinsame senkrechte
  Zeitskala aller Parameter, DWD-Windwarnschwellen, Sonnenauf-/untergang,
  Luftdruck, Wolken Gesamt/H/M/L, Hazards und Einzeldaten bleiben erhalten.

## Plattform- und Worker-Vertrag

Beide Änderungen liegen im gemeinsamen React/Vite-Fachkern bzw. in der
Darstellung. Browser, PWA und Capacitor-iOS nutzen denselben Code. Es gibt
keinen iOS-Fork. Nach Neutralisierung der Versionskonstante sind die Worker-
Quellen der beiden v0.9.76.11-Linien fachlich bytegleich; v0.9.76.12 enthält
keine Worker-Fachänderung.

## Regression

Zusätzlich zum vollständigen DWD-Ortsausschnitt-Vertrag schützt
`scripts/test-weather-profile-mobile-compact-097612.mjs`:

- Entfernung der redundanten Zeitpille,
- kompaktere linke/rechte Diagrammränder,
- vereinfachte obere Zeitachse ohne separates Kalender-Overlay,
- kompakte Tagesmarker an der unteren Achse,
- entschärfte Nachtmarkierung,
- lesbare, nicht von Achsen/Gittern verdeckte Beschriftungen.
