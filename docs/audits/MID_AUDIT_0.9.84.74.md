# MID Design-Audit v0.9.84.74

## Ziel

Geräteübergreifender Layout- und Interaktionsaudit für iPhone/iPadOS, weitere schmale Handybreiten und Desktop. Schwerpunkt dieses Blocks: vollständig lesbare Event-Inhalte, nicht dauerhaft eingeblendete Werte-Tooltips im 24-h-Wetterprofil und vollständig lesbare Ensemble-Tooltips.

## Geprüfte Viewports

Die aktuelle CSS-Kaskade wurde mit repräsentativen Hochrisikomustern in Chromium auf folgenden Viewports simuliert:

- 320 × 568 px – sehr kleines iPhone/Handy
- 360 × 800 px – schmales Handy
- 390 × 844 px – aktuelles iPhone-Hochformat
- 430 × 932 px – großes iPhone/Handy
- 844 × 390 px – iPhone-Querformat
- 600 × 1024 px – iPad Split View / schmales Tabletfenster
- 768 × 1024 px – klassisches iPad-Hochformat
- 834 × 1194 px – aktuelles iPad-Hochformat
- 1024 × 1366 px – großes iPad
- 1366 × 768 px – kleiner Desktop/Laptop
- 1440 × 900 px – typischer Desktop
- 1920 × 1080 px – Full-HD-Desktop

Ergebnis: 12/12 Viewports ohne dokumentweiten horizontalen Überlauf bei den geprüften Hochrisikomustern. Event-Navigation, lange Eventtexte, Sortierfeld, Wetterkurztext und Ensemble-Tooltip bleiben innerhalb des verfügbaren Layouts. Der Profil-Werteoverlay ist im Ruhezustand nicht sichtbar.

## App-weite Abdeckung

Zusätzlich zur Browser-Matrix schützen die bestehenden appweiten MID-Verträge weiterhin die Haupt- und Sekundäransichten für Istwetter, Kurzfrist/90 min, 24 h, 7/14 Tage, Ensemble, Radar/Komposit, Warnungen/Extremwetter, Synoptik, Klima, Meteogramm, Langfrist, Events, Reise, Flugmeteorologie, Wasser/Tide sowie Einstellungen/System. Die Browser-Matrix bildet bewusst die überlaufkritischen Layoutmuster ab; ein vollständiger lokaler Live-Build aller Laufzeitdaten war in der isolierten Arbeitsumgebung nicht verfügbar.

## Befunde und Änderungen

### Eventplaner

- Workspace-Tabs schneiden „Details & Rat“ nicht mehr mit Ellipse ab; bei Bedarf ist ein sauberer mehrzeiliger Umbruch erlaubt.
- Die Sortierung erhält auf schmalen Displays eine eigene volle Zeile. „Chronologisch“ und die übrigen Optionen bleiben vollständig lesbar.
- Lange Eventnamen, Ortsangaben und Wetterkurzinfos werden nicht mehr per `text-overflow: ellipsis` abgeschnitten.
- Die zusätzlichen Zeilen vergrößern bei Bedarf die Karte statt Informationen zu verbergen.

### 24-h-Wetterprofil

- Die bisher dauerhaft sichtbaren Werte-Pillen sind von der dauerhaften Zeitauswahl entkoppelt.
- Maus/Trackpad: Werteoverlay nur bei Hover oder Tastaturfokus; Pointer-Leave/Blur schließt es wieder.
- Touch: Antippen zeigt den Werteoverlay temporär; nach 4,8 Sekunden wird er automatisch ausgeblendet.
- Escape und Interaktion außerhalb schließen den Overlay ebenfalls.
- Die ausgewählte Zeitmarkierung und der dauerhafte Bereich „Einzeldaten“ bleiben erhalten. Es geht keine Information verloren.

### Ensemble-Diagramm-Tooltips

- Mobil wird die verfügbare Viewportbreite genutzt, statt Inhalte in historische 272/280-px-Boxen zu pressen.
- Längere Texte dürfen umbrechen; der Tooltip kann bei viel Inhalt intern vertikal scrollen.
- Die Tooltipfläche ist deckend und verhindert dadurch störendes Durchscheinen darunterliegender Diagramm-/Kartentexte.
- Safe Areas oben/unten und niedrige Landscape-Fenster werden berücksichtigt.
- Ältere hochspezifische `nowrap`- und 7,8-px-Regeln für Einzelwerte werden am Kaskadenende zuverlässig überstimmt.
- Lange Schlüssel wie „Sonnenscheindauer“ werden auf breiten Tooltips nicht mitten im Wort getrennt; auf schmalen Geräten werden Schlüssel und Wert untereinander angeordnet.

## CI-/Vertragsnachprüfung

Die zehn im v0.9.84.73-Installer noch fehlgeschlagenen historischen Verträge wurden einzeln nachgezogen und bestehen lokal wieder. Zusätzlich sind der zentrale UI-Architekturvertrag (`useDismissibleLayer`) und der Wolkenschicht-Verfügbarkeitsvertrag auf den neuen flüchtigen Profil-Overlaypfad abgestimmt.

## Fachlogik

Unverändert: Wetterdaten, Modellfusion, Ensembleberechnung, Warnschwellen, WMO-/DWD-Terminologie, Radar/Nowcast, Piktogramme, Parameterfarben und Worker-Fachlogik.
