# MID v0.9.85.78 · Arbeitspaket B · Bottom-Bar + Favoriten

Die mobile MID-Navigation bleibt im neuen Design dauerhaft erreichbar. Die fünf Hauptziele **Aktuell, Heute, Vorhersage, Karten und Mehr** werden nicht mehr durch Scroll-Auto-Hide ausgeblendet.

Die Favoritenleiste wurde als ruhige, zur Bottom-Bar passende Instrumentfläche nachgeschärft. Ortsnamen bleiben einzeilig; auf schmalen Geräten scrollt die Leiste intern horizontal statt die Seite zu verbreitern oder Ortsnamen in mehrere Zeilen zu brechen. Der aktive Ort wird dezent über Rand, Hintergrundton und Signaturkante markiert.

Die mobile Safe-Area-Reserve wird als gemeinsamer Navigationsabstand geführt. Die Bottom-Bar respektiert den Home-Indikator und bleibt zugleich frei von doppelten Leerflächen oder Inhaltsüberlagerungen.

Navigation über die fünf Hauptziele verwendet direkte Scrollpositionierung statt verzögertem Smooth-Scroll. Fachlogik für Wetter, Warnungen, RUC/Nowcast, Skybar/24-Stundenquadrate, Prognose und Karten bleibt unverändert.

Replit dient für dieses Arbeitspaket ausschließlich der Umsetzung und Prüfung. Veröffentlichung, Deployment und Stable-Promotion erfolgen ausschließlich durch ChatGPT über den kanonischen Source-PR-Gate-Releasepfad.
