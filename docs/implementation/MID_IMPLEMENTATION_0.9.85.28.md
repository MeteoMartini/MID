# MID v0.9.85.28 – MID-C8 sichtbarer Konzeptumbau

## Vergleich mit dem Konzeptbild

Das Referenzbild definiert keine neue Wetterdatenlogik, sondern eine andere Hierarchie: ein kompakter Kontrollkopf, eine große Istwetter-Bühne, integrierte Messwertleisten und eine vom Bildschirmrand gelöste mobile Navigation. Die vorherigen C7-Ebenen hatten einzelne dieser Elemente, ließen jedoch viele Bereiche weiterhin wie gleichrangige, gerundete Kacheln wirken.

## Umsetzung

- `midC8VisibleRedesign.css` ist nach allen historischen Gestaltungsregeln geladen und setzt die MID-Next-Hierarchie daher verbindlich durch.
- Kopf und Favoriten bilden ein funktionales Kontroll-Dock. Glas/Blur bleiben dort und in der Bottom-Bar auf die Navigation beschränkt.
- Der Ortsbereich ist eine Informationsleiste. Niederschlags- und lokale Gefahrendaten bleiben fachlich unverändert, werden aber nicht mehr als konkurrierende Hauptkarten präsentiert.
- Die aktuelle Wetterlage ist eine einzige Bühne mit Piktogramm, Temperaturkern und eingebetteter Datenleiste. Vertiefende Messwerte folgen als zusammenhängendes Raster mit Trennlinien statt als Kartenstapel.
- Kurzfrist, Prognose und Karte behalten ihre vorhandenen fachlichen Zeitachsen und Produktkennzeichnungen. Ihre Container erhalten ruhige, zusammenhängende Arbeitsflächen.

## Grenzen und Fachlichkeit

MID übernimmt keine künstlichen Radar- oder Satellitenprognosen. Beobachtung, Nowcast und Modelltermine bleiben wie bisher explizit getrennt. Parameter-, Warn- und WMO/DWD-Farbsemantik wurde nicht umgewidmet. Klassik bleibt unverändert auswählbar.

## Prüfung

`scripts/test-c8-visible-redesign-098528.mjs` sichert Lade-Reihenfolge, Kontroll-Dock, zusammenhängende Istwetter-Bühne, mobile Bottom-Bar und die Begrenzung von Glas auf Funktionsflächen. Typecheck, C7-Viewport-Matrix und Produktionsbuild wurden zusätzlich ausgeführt.
