# MID v0.9.84.41 – Wetterpiktogramm-Standard 2.1 und robuster Widget-Bildexport

## Ziel

Die Wetterpiktogramme werden app-weit auf eine fachlich präzisere, zentral verbindliche Semantik gehoben. Parallel wird der Widget-Kurvenübersicht-Export gegen SVG-/CSS-Variablenfehler gehärtet, die beim PNG-/Clipboard-Export einzelne Nachtsegmente schwarz darstellen konnten.

## Wetterpiktogramm-Standard 2.1

- WMO 96/99 wird ohne zusätzliche Phaseninformation neutral als Gewitter mit Graupel oder Hagel behandelt; eindeutiger Graupel bzw. Hagel wird nur bei belastbarer Zusatzinformation dargestellt.
- WMO 76/77/78/79 sind getrennt als Eisnadeln, Schneegriesel, vereinzelte Schneesterne und Eiskörner modelliert und dargestellt.
- Gewitter 95/97 erhalten Regen, Schnee oder Mischphase nur bei tatsächlich vorliegender MID-Phaseninformation; die Gesamt-Niederschlagsmenge allein erzeugt keine künstliche Regenphase.
- Present Weather wird bis zum zentralen Piktogramm durchgereicht, darunter BR/HZ/FU/DU/SA, SQ/FC, GS/GR sowie TS-Kombinationen.
- WMO 91/92 bleibt fachlich „Schauer nach Gewitter in der vorangegangenen Stunde“ und wird ohne Blitz sowie ohne Sonne/Mond dargestellt.
- HZ/FU/DU/SA dürfen eine verwandte Sichttrübungsgeometrie verwenden, werden aber in Text, Tooltip und Accessibility eindeutig als Dunst, Rauch, Staub bzw. Sand benannt.

## App-weite Durchsetzung

Die neue Semantik ist nicht nur im SVG-Renderer hinterlegt. Alte Niederschlags-/Schnee-Whitelists wurden in den betroffenen Zwischenpfaden aktualisiert, darunter Tages-/Detaildarstellung, Meteogramm, Eventbewertung, Routen- und Wassersportansicht, 7-Tage-Zusammenfassung, Radar-/Modellphase, Wetterkarten und Niederschlagsintervalle. Schneegriesel, Schneesterne, Eisnadeln und Eiskörner bleiben dadurch bis zur sichtbaren Darstellung getrennt.

## Widget-Kurvenübersicht: schwarze Nachtfelder

Das Screenshot-Schadbild stammte aus dem PNG-/Clipboard-Export und nicht aus den Wetterdaten: Die Nachtsegmente der Kurvenübersicht nutzten im SVG `fill="var(--mg-night)"`. `html-to-image` kann bei der SVG-Serialisierung einzelne CSS-Variablen bzw. berechnete Paint-Werte verlieren; der SVG-Initialwert für `fill` ist dann schwarz.

Die Korrektur ist zweistufig:

1. Nachtsegmente besitzen nun einen expliziten neutralen SVG-Fallback (`#495c71` mit geringer Deckkraft). Die normale Theme-CSS darf diesen Wert in der Live-Ansicht weiterhin überschreiben.
2. Vor jedem Widget-PNG-/Clipboard-Export friert `widgetImageExport.ts` alle browserseitig bereits berechneten SVG-Paint-Werte (`fill`, `stroke`, Gradient-Stopps und Opazitäten) als explizite Werte ein. Nach Abschluss wird der Live-DOM exakt auf seinen vorherigen Inline-Style-Stand zurückgesetzt.

Damit ist nicht nur das konkrete Nachtband abgesichert, sondern dieselbe Exportfehlerklasse auch bei SVG-Piktogrammen, Temperaturgradienten und Niederschlagsfarben.

## Worker

Die app-weite Present-Weather-/Phasenpräzisierung berührt auch die kanonischen Workerquellen. Gegenüber dem zuletzt stabilen Workerstand ist deshalb ein Worker-Deploy fachlich relevant; er soll weiterhin ausschließlich über den abgesicherten automatischen Releasepfad erfolgen.
