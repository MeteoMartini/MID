# MID 0.9.84.69 – Design-Audit Mobile, iPad und Desktop

## Maßstab
Der Audit richtet sich an den aktuellen Apple-HIG-Stand von September 2026 sowie an die vorhandenen MID-Verträge. Für die WebApp werden native Apple-Points nicht mathematisch in CSS-Pixel umgerechnet; stattdessen wird die Interaktionshierarchie responsiv nachgebildet.

## Umgesetzt
- Touchziele: 44 px für häufige Interaktionen auf Touch-/Hybridgeräten; Fine-Pointer-Oberflächen bleiben mit 32 px Mindestziel kompakter.
- Hybrid-iPad: `any-pointer: coarse` verhindert, dass ein angeschlossenes Trackpad die Touchreserve versehentlich zurücknimmt.
- Safe Areas: vorhandene `env(safe-area-inset-*)`-Logik wird mit konsistenten Seitenrändern kombiniert.
- Navigation: iPhone nutzt die vorhandene Fünf-Bereiche-Bottom-Bar; reguläre iPad-/Desktop-Breiten wechseln in die vorhandene Seitenleistenform. Das entspricht dem adaptiven Tab-/Sidebar-Prinzip, ohne MID in eine native UIKit-Kopie umzubauen.
- Niedrige/breite Fenster und Split-View-Situationen werden im neuen Kaskadenabschluss über verfügbare Höhe/Breite statt eine neue Orientation-Sonderregel behandelt.
- Typografie: normale UI-Mikrotexte haben nun eine semantische 11-px-Untergrenze; wissenschaftliche Diagrammachsen bleiben separat kompakt.
- 14 Tage: Informationsverlust durch extreme Verdichtung beseitigt. Breitere Karten und horizontales Scrollen ersetzen 6–8-px-Mikrotypografie.
- Settings/System/Planner: Untertitel, Kategorien, Schaltertexte und Systemhinweise vereinheitlicht.
- Interaktionszustände: Custom Controls erhalten neben Focus-Visible auch einen klaren Press-State.

## Bewusst nicht pauschal verändert
- Diagramm-/SVG-Achsentexte, weil eine globale Vergrößerung Überlagerungen und falsche Skalenlesbarkeit erzeugen könnte.
- Parameterfarben und MID-Wetterpiktogramme.
- Meteorologische Datenlogik, Warnstufen, Zeitintervalle und Modellfusion.
- Liquid-Glass-Effekte auf Inhaltskarten; Glas bleibt Navigation/Kontroll-Chrome vorbehalten.

## Nächste sichere Auditstufe
Weiterhin sinnvoll ist ein eigener Visualisierungs-Audit für Diagramme und Klimagrafiken. Dort sollten Achsen, Tooltips, Legenden und Zoom-/Hover-Verhalten pro Diagrammtyp geprüft werden, statt über eine globale Schriftregel vergrößert zu werden.
