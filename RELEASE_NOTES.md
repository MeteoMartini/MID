# MID v0.9.85.329 · Isoliertes PostCSS-Wartungsupdate

PostCSS wird separat von 8.5.28 auf 8.5.31 qualifiziert. Das reproduzierbar erneuerte Lockfile zieht nur die dafür erforderliche Nanoid-Patchversion nach; `source-map-js` bleibt auf dem bereits geprüften 1.2.2. React, Vite, Plugin-React, Capacitor, MapLibre und Pako ändern sich nicht. Produktions-CSS, Kaskade, Themen, Widgets, Karten und Exporte bleiben byteidentisch zum freigegebenen .328-Build. Das ist ein Entwicklungsabhängigkeits- und CSS-Parser-Wartungsschritt, kein CSS-Split und kein Laufzeit-/Designwechsel.

Context7/PostCSS-Quelldokumentation und die Registry-Metadaten für 8.5.31 wurden geprüft. Build, vollständige Regression, Dependency-Audit, CSS-Kaskaden-/Budget-Tests und MID-Release-Gates bleiben erforderlich.
