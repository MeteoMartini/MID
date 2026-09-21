# MID 18.2.1 · Replit-Handoff · v0.9.85.71

## Übernommener Umfang

Der Replit-Stand wird nicht als eigene Wetterdatenbasis in MID kopiert. Übernommen werden ausschließlich die dort verifizierten UI-/Navigationsverbesserungen, soweit sie im kanonischen Produktionszweig noch fehlen.

- Lange Ortsnamen bleiben vollständig lesbar und werden nicht mehr mit Ellipse abgeschnitten.
- Ein expliziter Sprung zu „Heute“ beginnt wieder am Kopf der Kurzfristansicht und übernimmt keinen alten internen Scrollstand.
- Radar/Satellit wird im modernen Kartenarbeitsraum weiter verdichtet; Karte und Zeitleiste erhalten Vorrang vor dekorativen Flächen.
- Die bestehende produktive Radar-, Satelliten-, Nowcast-, DWD- und Synoptiklogik bleibt unverändert. Insbesondere wird die bereits vorhandene amtliche DWD-Bodenanalyse plus MID-Modellanalyse nicht durch die einfachere Replit-Demo ersetzt.

## Responsive Abnahme

Verbindliche Zielgrößen: 390×844, 430×932, 834×1112, 1112×834 und 1440×1000, jeweils Light/Dark. Kritische Punkte: vollständiger Ortsname, deterministischer Heute-Sprung, keine horizontale Überbreite, Kartenhöhe, Timeline und Bottom-Bar-Safe-Area.

## Releaseweg

Source-PR-Gate → Auto-Merge → Release-ZIP → Installer → Pages/Worker-Gate → Stable-Promotion.
