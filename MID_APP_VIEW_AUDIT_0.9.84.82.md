# MID App-View-Audit 0.9.84.82

## Fortsetzung MID 17.7.24 – Karten, Diagramme, horizontale Fachleisten

Die Vollständigkeitsmatrix aus 0.9.84.79 und der Overlayvertrag aus 0.9.84.80 bleiben verbindlich. 0.9.84.82 prüft gezielt komplexe Karten-/Diagrammflächen, horizontal scrollende Fachleisten sowie flache Querformate.

Referenzgrößen: 320×568, 360×800, 390×844, 430×932, 844×390, 600×1024, 768×1024, 834×1194, 1024×1366, 1366×768, 1440×900 und 1920×1080.

| Bereich | Gefundene Restgefahr | Maßnahme 0.9.84.82 |
|---|---|---|
| Meteogramm | Tooltip lag im horizontal scrollenden Diagrammcontainer, `white-space: nowrap`; Rand-/Touch-Clipping möglich | Body-Portal mit viewportfesten Koordinaten, max. 320 px, Umbruch, Höhenlimit; Touch-Auto-Dismiss nach 4,2 s |
| Wetterkarten | Titel + Quellenbadge auf schmalen iPhones zu eng; Metadaten ellipsierten ohne vollständige Alternativanzeige | mobile Einspalten-Kopfzeile, Quellenbadge darf umbrechen, Metadaten vollständig lesbar |
| DWD Wolken + Niederschlagsart | lokale absolute Legende konnte rechts/unten aus dem sichtbaren Bereich ragen | mobile feste Safe-Area-Legende mit internem Scrollen |
| Synoptik | historische 6–6,5-px-Rückfälle bei 360 px; Stations-/Impacttexte ellipsierten | Mindestschrift angehoben, Texte dürfen umbrechen, Kartenlegende höhenbegrenzt scrollbar |
| Extremwetter | Regionsnamen/-details ellipsierten; Legende in sehr schmalen Karten dominant | vollständiger Umbruch, mobile Legendenbreite/-höhe begrenzt und scrollbar |
| Querformat | Kartenhöhen konnten bei 844×390 bzw. ähnlich flachen Viewports unnötig groß bleiben | Wetterkarte, Extremwetter, Synoptik und Radar bei <=520 px Höhe gezielt begrenzt |
| horizontale Fachleisten | Start-/Endelemente konnten in Split-View bündig am Rand liegen | `scroll-padding-inline` für Fachleisten vereinheitlicht |

## Viewportsimulation

Der neue Vertrag `test-map-chart-responsive-continuation-098482.mjs` simuliert die horizontale Tooltip-Geometrie an allen zwölf Referenzgrößen für Pointerpositionen am linken Rand, in der Mitte und am rechten Rand. Zusätzlich werden Portal, Touch-Auto-Dismiss, Safe-Area-Legende, mobile Wetterkartenstruktur, Synoptik-/Extremwetter-Regeln und die kanonische Stylesheet-Aggregation geschützt.

## Fachliche Abgrenzung

Keine Wetter-, Radar-, Satelliten-, Modell-, Ensemble-, Warn-, Piktogramm- oder Parameterfarbenlogik wurde geändert. Die Änderungen betreffen ausschließlich Darstellung und Interaktion.

## Lokale Umgebungsgrenze

Das Transport-ZIP enthält bewusst keine `node_modules`. Zwei ältere Fachtests (`test-synoptic-map-direction-09001.mjs`, `test-extreme-outlook-labels-layout-persistence-09668.mjs`) benötigen `typescript-strada` und können deshalb lokal nicht gestartet werden. Ein vollständiger Paket-/Browserbuild wird nicht vorgetäuscht; er bleibt Bestandteil des Installer-/CI-Gates nach Upload.
