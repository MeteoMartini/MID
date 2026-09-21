# MID v0.9.85.78 · MID 18.2.4 · Arbeitspaket B

## Bottom-Bar und Favoriten

- Die fünf Hauptziele **Aktuell · Heute · Vorhersage · Karten · Mehr** bleiben dauerhaft sichtbar.
- Die frühere scrollabhängige Auto-Minimierung wird nicht mehr angeboten; ein gespeicherter Legacy-Wert wird beim Start verworfen.
- Die mobile Navigationsreserve wird zentral geführt. Main-Inhalt und Footer addieren keine zweite Safe-Area-/Bottom-Bar-Reserve.
- Bottom-Bar und Favoritenleiste verwenden dieselbe ruhige MID-Materialität.
- Favoriten bleiben auf schmalen Viewports einzeilig, intern horizontal scrollbar und verbreitern die Seite nicht.
- Der aktive Favorit wird dezent markiert; Ortsname und Zusatzzeile bleiben mit Ellipsis lesbar.
- Touch-Ziele der Favoritenverwaltung bleiben fingergeeignet.

## Fachliche Isolation

Keine Änderung an Wetterdaten, Warnlogik, RUC/Nowcast, Skybar/24-Stundenquadraten, Prognosefusion, Radar-/Satellitenprodukten, Einheiten oder Parameterfarben.

## Prüfung

Replit-Referenzabnahme: 360×800, 390×844, 430×932, 768×1024, 1024×768 und 1440×900 in Light/Dark; Typecheck und Produktionsbuild grün. Physische Touch-/Swipe-Abnahme auf realer Hardware war dort nicht automatisiert und bleibt als manuelle Interaktionsprüfung dokumentiert.

Kanonischer Releasepfad: Source-PR-Gate → Merge → Release-ZIP → Installer → Pages/Worker-Gate → Stable-Promotion.
