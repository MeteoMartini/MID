# MID v0.9.85.34 · C14 Screenshot-Audit

Geprüft gegen reale Smartphone-Aufnahmen IMG_1841–IMG_1844.

- `Aktuell`: Kopf, Suche, Favoriten und Ortskontext waren trotz C13 noch zu hoch; Ursache war die CSS-Kaskade. Legacy-Regeln werden nun vor dem Redesign geladen, anschließend werden die realen Smartphone-Abstände nochmals kompakter festgelegt.
- `Aktuell`: der Wetterkern war vertikal zu lang. Auf Smartphonebreiten werden vier Kernparameter zweispaltig priorisiert; Sichtweite bleibt als Zusatzdetail erreichbar.
- `Impressum`: im Hochformat konnte der Dialog außerhalb des dynamischen Viewports liegen. Der Dialog ist nun an `100dvh` und Safe-Areas gebunden; der Kopf mit Schließen-Schaltfläche bleibt sticky, nur der Inhalt scrollt.
- `Kurzfrist · Wolken + Niederschlagsart`: der DWD-Bildzoom durfte die Seite verbreitern. Das vergrößerte Originalbild wächst nur noch innerhalb seines eigenen Scroll-Viewports.
- `24-h-Wetterprofil` und andere breite Diagramme: äußere App-Container werden horizontal begrenzt; notwendige breite Inhalte skalieren oder scrollen ausschließlich innerhalb ihrer Fachfläche.
- Die Bottom-Navigation erhält zusätzlichen Inhaltsabstand und Scroll-Padding, damit Fachinhalte nicht unter der schwebenden Leiste enden.
