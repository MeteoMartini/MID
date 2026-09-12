# MID 0.9.84.70 – Vollständigkeits-Audit Design Mobile, iPad und Desktop

## Ziel
Alle sichtbaren MID-Hauptansichten übernehmen denselben responsiven Designvertrag. Die in 0.9.84.62–0.9.84.69 schrittweise eingeführten Regeln für Typografie, Touchziele, Safe Areas und adaptive Navigation werden damit nicht mehr nur punktuell, sondern als App-Vertrag abgesichert.

## App-weite Abdeckung
| Bereich | Status | Schwerpunkt |
| --- | --- | --- |
| Istwetter / Heute | abgedeckt | Typografie, Kennwerte, Touchziele, mobile Fakten |
| Kurzfrist / 90 min | abgedeckt | Labels, Infoziele, Nowcast-Bedienung |
| 24-h-Wetterprofil | abgedeckt | Toolbar, Signale, Achsen separat lesbar |
| 7 Tage | neu vertieft | Tagesköpfe, Tmin/Tmax, Achsen, Legenden |
| 14 Tage | abgedeckt | breite mobile Karten, Scroll-Snap, 44-px-Infoziel |
| Ensemble | neu vertieft | Achsen, Legenden, Tooltips, Parameterdeck |
| Radar / Komposit | abgedeckt | Touchziele, Tabs, Legenden |
| Warnungen / Extremwetter | abgedeckt | Touchziele, Quellen-/Gültigkeitstexte |
| Wetterkarten / Synoptik | neu vertieft | Toolbars, Legenden, synoptische Metadaten |
| Klima | neu vertieft | Achsen, Legenden, Monatskarten, Quellenhinweise |
| Meteogramm | neu vertieft | Achsen, Zeilenlabels, Legenden, Tooltips |
| Langfrist / Subseasonal | neu vertieft | Achsen, Skalen, Modelllegenden, Tooltips |
| Events / Reise | appweiter Vertrag | Formulare, Controls, Metadaten, progressive Details |
| Flugmeteorologie | appweiter Vertrag | Controls, Quellen-/Statushinweise; Diagramme separat kompakt |
| Wasser | appweiter Vertrag | Controls, Status-/Quellentexte, Touchziele |
| Lüftungsassistent | appweiter Vertrag | Controls, Status-/Hinweistexte |
| Einstellungen / System | abgedeckt | Formulare, Dialoge, Safe Areas, iOS-Eingaben |

## Verbindliche Regeln
- Touch-/Hybridgeräte: 44 px für interaktive Hauptziele; Desktop-Fine-Pointer bleibt kompakter.
- iOS/iPadOS-Formulare: Texteingaben, Selects und Textareas erhalten auf Touchbreiten 16 px Schriftgröße, damit Safari beim Fokussieren nicht unnötig hineinzoomt.
- Normale UI-Mikrotexte: mindestens der semantische MID-Micro-Token (11 px).
- Safe Areas und vorhandene adaptive Tab-/Sidebar-Navigation bleiben erhalten.
- Diagrammachsen werden nicht blind auf 11 px angehoben; sie erhalten pro Visualisierung eigene, kollisionsarme Mindestgrößen.
- Parameterfarben, Piktogramme und meteorologische Bedeutungen werden nicht verändert.

## Visualisierungs-Audit Block 1
Klima, Meteogramm, Ensemble, 7-Tage-Kurve, Langfrist/Subseasonal und Synoptik wurden einzeln nachgezogen. Achsen und Kartenlabels bleiben kompakter als normale UI-Texte, während Legenden, Tooltips, Quellenhinweise und Bedienbeschriftungen klar lesbar sind.

## Bewusst unverändert
Wetterlogik, WMO-/DWD-Terminologie, Warnschwellen, Vorhersagefusion, Ensembleberechnung, Radar/Nowcast, Open-Meteo-Modellquellen, Piktogramme und Parameterfarbvertrag.
