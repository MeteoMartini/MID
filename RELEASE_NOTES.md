# MID v0.9.85.186 · 06.10.2026 · Karten-Layer

- Radar und Satellit bevorzugen Modelllinien; Flächen bleiben ausdrücklich optional auswählbar.
- Isobaren werden unabhängig von einem Flächenraster gezeichnet. DWD-Linien und Windfiedern verwenden die tatsächlich angebotenen Katalogstile.
- Kartenebenen mit klareren aktiven Zuständen, gut erreichbaren Schaltern und vollständigen Quell- und Terminangaben.
- Mobile Layer-Auswahl ohne Überlappung, Radar und Satellit komplett abwählbar; einzelne Ortsbeschriftung und kompakte Favoriten bei reiner Ortsauswahl.

Intern:

- Modell-Darstellung Automatisch/Linien/Flächen persistiert; vorhandene bewusst deaktivierte Layer bleiben deaktiviert.
- Native Zwei-Punkt-Isobarensegmente unabhängig von Rastererzeugung; GeoJSON-Koordinatenreihenfolge, gleicher Lauf/Termin und bedarfsgesteuerte Daten bleiben geschützt.
- Worker-Metadaten enthalten geprüfte DWD-WMS-Stilnamen. Kein stiller Flächen-Fallback bei fehlender Linienfähigkeit; EPS-Spread ist keine Druck-Isobare.
