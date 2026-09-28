# MID Mountain Data Quality Contract · v0.9.85.110

## Zweck

Dieser Vertrag schützt die fachliche und sichtbare Konsistenz der Berg-/Wintersportsektion. Er ergänzt `MID_MOUNTAIN_FORECAST_REDESIGN_0.9.85.108.md` und gilt für Höhenprognose, Höhenzonenanalyse, Neuschnee, Tagespiktogramme und Quellendarstellung.

## Quellenhierarchie

- Die 7-Tage-Höhenprognose behält Open-Meteo Best Match als vollständige, robuste Basis und Fallback.
- Wo für das Land und die Koordinate ein belastbares hochaufgelöstes Regionalmodell verfügbar ist, wird **ein und dasselbe Regionalmodell für alle konfigurierten Höhenpunkte** verwendet. Dadurch entstehen Tal-/Mitte-/Berg-Unterschiede nicht aus einem unbeabsichtigten Modellwechsel zwischen den Höhenstufen.
- Der regionale Kurzfristhorizont wird anschließend nahtlos durch Best Match fortgeführt. Fehlende Regionalmodellfelder werden nicht als Null interpretiert, sondern aus der vorhandenen Best-Match-Basis übernommen.
- Deutschland: DWD ICON-D2; Österreich: GeoSphere AROME Austria; Schweiz: MeteoSwiss ICON-CH1; Frankreich: Météo-France AROME HD. Weitere unterstützte nationale/regionale Modelle sind in `MOUNTAIN_REGIONAL_MODELS` dokumentiert.
- DWD ICON-D2-RUC bleibt ein standortbezogenes 15-Minuten-Kurzfristsignal. Solange keine getrennten höhenbezogenen RUC-Reihen vorliegen, darf RUC **nicht** als Tal-/Mitte-/Berg-Wert ausgegeben oder blind auf die Höhenstufen kopiert werden. Es darf die Höhenzonenanalyse als gemeinsamer Standortfaktor ergänzen.
- Diagnosefelder, die das jeweilige Regionalmodell nicht liefert (z. B. Druckniveauwerte), dürfen aus einem getrennten Modell-/Best-Match-Diagnosepfad stammen; diese Herkunft ist semantisch von der sichtbaren Kernprognose zu trennen.
- GeoSphere-Schneemessungen bleiben nur bei strenger Entfernung-, Höhendifferenz- und Aktualitätsprüfung zulässig.

## Niederschlag und Orographie

- Niederschlag darf **nicht** künstlich monoton mit der Höhe skaliert werden.
- Ein Talpunkt kann meteorologisch mehr Niederschlag erhalten als ein höherer Punkt. Maßgeblich sind unter anderem Anströmung, Luv/Lee, horizontale Lage, Konvektion und Modellorographie.
- Bei räumlich getrennten Höhenpunkten wird deshalb transparent darauf hingewiesen, dass Unterschiede nicht ausschließlich als Höheneffekt interpretiert werden dürfen.
- Gleichzeitig soll innerhalb des hochaufgelösten Regionalmodell-Horizonts für alle Höhenpunkte dieselbe Modellfamilie verwendet werden, um künstliche Sprünge durch unterschiedliche Best-Match-Modellwahl zu vermeiden.
- Niederschlag und Neuschnee bleiben Intervallgrößen. Fehlende Intervalle werden als fehlend behandelt und niemals zu 0 mm bzw. 0 cm umgedeutet.

## Neuschnee

- `snowfall` wird als Neuschnee in Zentimetern behandelt. Null bedeutet nur dann `0 cm`, wenn die Quelle tatsächlich einen numerischen Nullwert liefert.
- Kleine positive Mengen bleiben über den gemeinsamen Anzeigevertrag als `<1 cm` sichtbar.
- In der Sommerdarstellung wird ein permanentes `0 cm` nicht als redundanter Tageswert gezeigt. Ein Neuschneewert erscheint dort nur, wenn tatsächlich eine positive Menge vorliegt. Im Winter bleibt ein echter Nullwert sichtbar.
- `snow_depth` (Schneedecke) und `snowfall` (Neuschnee) bleiben fachlich getrennt.
- Eine fehlende Schneefallangabe darf nicht allein aus Temperatur, Niederschlag oder Schneefallgrenze als exakte Zentimetermenge erfunden werden.

## Tagespiktogramme

- Tageszeilen sind Tageszusammenfassungen und werden mit Tagesdarstellung gerendert; ein Mond-Symbol ist dort unzulässig.
- Der repräsentative Wetterzustand für die Tageszeile wird bevorzugt aus Tageslichtperioden gewählt.
- Geöffnete 3-Stunden- und Stundenwerte behalten dagegen die astronomisch korrekte Tag-/Nacht-Darstellung.

## Quellenanzeige

- Die sichtbare Höhenprognose nennt das tatsächlich verwendete hochaufgelöste Regionalmodell, sofern es erfolgreich eingebunden wurde, inklusive Kurzfristhorizont.
- Best Match wird als 7-Tage-Basis/Fallback genannt und nicht mehr pauschal als alleinige Quelle dargestellt.
- Bei vorhandenen `rapidMinutes15` wird RUC als **ergänzendes standortbezogenes** Kurzfristsignal gekennzeichnet, nicht als höhenaufgelöste Quelle.
- Bei horizontal deutlich versetzten Profilpunkten wird die räumliche Spannweite und der mögliche Luv-/Lee-Einfluss erklärt.

## UI / Responsive

- Die Höhenzonenanalyse verwendet dieselbe Typografie-, Farb-, Surface- und Disclosure-Hierarchie wie die übrige Berg-/Wintersportsektion.
- Die Disclosure-Kopfzeile darf auf kleinen Displays weder Text überlagern noch einen fremden dunklen Button-Stil erben.
- Touch-Ziele bleiben auf Mobilgeräten mindestens 44 × 44 CSS-Pixel groß.
- Die bestehende Visual-Acceptance-Matrix 390×844, 430×932, 412×915, 834×1194, 1194×834 und 1440×900 ist in Light/Dark weiterhin verbindlich.

## Release-Gate

v0.9.85.110 darf erst veröffentlicht werden, wenn TypeScript/Produktionsbuild, bestehende Mountain-Regressionsprüfungen, die neue Datenqualitätsregression und die responsive Bergwetter-Visualmatrix erfolgreich sind.
