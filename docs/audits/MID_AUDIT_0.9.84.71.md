# MID 0.9.84.71 – Visualisierungs-Audit Block 2

## Ziel
Fortsetzung des appweiten Mobile-/iPad-/Desktop-Designvertrags aus 0.9.84.69/70. Dieser Block konzentriert sich auf Bereiche, die wegen hoher meteorologischer Informationsdichte bislang bewusst separat behandelt wurden.

## Abgedeckte Bereiche
| Bereich | Schwerpunkt |
| --- | --- |
| Wasser / Tide | Kennwerte, Tidekarten, Timeline, Quellenhinweise, Split View |
| Flugmeteorologie | Cross-Section-Achsen, Quellen-/Gefahrentexte, Punktkarten, Legende |
| Flug-/Routenwetter | Karten-Tooltip, Suchergebnisse, Kontrollbeschriftungen, Touchziele |
| Events | Workspace-Navigation, Kennwerte, Status-/Detailtexte, Touchziele |
| Reise | Suche, Optionen, Constraints, Tagesstreifen, Ergebnis-/Kennwerttexte |
| Warnungen / Gefahren | Gültigkeit, Stufen, Restfenster, Windschwellen, Touchziele |
| Radar / Komposit | kompakte Legende, Layer-/Basemaptexte, aktive Layerchips |
| Karten-Tooltips | DWD-Niederschlagsart, KONRAD, Druckzentren, Konturlabels |

## Verbindliche Designregeln
- Normale UI-/Status-/Quellentexte verwenden mindestens die semantische MID-Micro-Stufe.
- Wissenschaftliche SVG-/Kartenbeschriftungen dürfen kompakter bleiben, werden aber nicht mehr auf historische 5–8-px-Werte gedrückt, sofern Platz durch Scrollen oder Kartenbreite verfügbar ist.
- Touch-/Hybridgeräte behalten 44-px-Mindestziele für zentrale Aktionen.
- iPad Split View wird als eigene verfügbare Fläche behandelt; Karten werden lieber breiter/scrollbar als typografisch unlesbar.
- Horizontale Zeitreihen verwenden `overscroll-behavior`, Momentum-Scrolling und Scroll-Snap, wo das die Informationsdichte besser erhält.

## Bewusst unverändert
Keine Änderung an Wetter-, Warn-, Tide-, Strömungs-, Flug-, Event-, Reise-, Radar- oder Nowcastberechnung. Keine Änderung an WMO-/DWD-Terminologie, Piktogrammen oder Parameterfarben.
