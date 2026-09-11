# MID Niederschlagspiktogramm- und Schneehöhenvertrag

## Ziel
MID zeigt Niederschlagsart, Intensität und Tag-/Nachtcharakter appweit über denselben zentralen Piktogrammpfad. Schneehöhen werden für Nutzende immer in ganzen Zentimetern dargestellt, ohne die internen Modellwerte zu runden.

## Niederschlagsintensität
- Zentrale Quelle ist `src/precipitation.ts`; `WeatherPictogram` visualisiert nur den dort bestimmten Zustand.
- Visuelle Stufen: `light`, `moderate`, `heavy`, `very-heavy`.
- Dauerregen: DWD-orientiert ≤ 0,5 mm/h leicht, > 0,5–4 mm/h mäßig, > 4 mm/h stark.
- Schnee: DWD-orientiert nach Schneezuwachs ≤ 0,5 cm/h leicht, > 0,5–4 cm/h mäßig, > 4 cm/h stark.
- Regenschauer: DWD-orientiert auf 10-Minuten-Mengen: <0,4 mm/10 min leicht, 0,7–<2 mm/10 min mäßig, 2–8 mm/10 min stark, >8 mm/10 min sehr stark. Der in der DWD-Mengentabelle nicht eindeutig zugeordnete Bereich 0,4–<0,7 mm/10 min bleibt bei reiner Mengenableitung konservativ leicht; ein expliziter WMO-Code 81/92 hebt mindestens auf mäßig an. Längere Forecast-Akkumulationen dürfen nicht als tatsächlich gemessene 10-Minuten-Rate ausgegeben werden; die normierte Menge ist dort nur eine konservative Untergrenze.
- WMO 82 bleibt `very-heavy`; eine gröbere Stundenmenge darf diesen Code nicht auf `moderate` oder `light` herabsetzen.
- WMO-/SYNOP-Sammelcodes, die mehrere Intensitäten umfassen, werden ohne belastbare Zusatzinformation nicht künstlich in eine genauere Stufe aufgeteilt.

## Niederschlagsart und Tag/Nacht
- WMO 80–82: Regenschauer.
- WMO 83–84: Schneeregenschauer.
- WMO 85–86: Schneeschauer.
- WMO 87–88: Graupel-/small-hail-Schauer.
- WMO 89–90: Hagelschauer ohne aktuelles Gewitter.
- WMO 91–92: Regenschauer zum Beobachtungszeitpunkt nach Gewitter in der vorangegangenen Stunde; daher konvektives Schauerpiktogramm **ohne aktuellen Blitz und ohne Sonne/Mond**. Sichtbarer Text/Accessibility: „Regenschauer nach Gewitter“.
- WMO 93–94: Schnee, Schneeregen oder Hagel nach Gewitter in der vorangegangenen Stunde; bewusst generisches winterliches Symbol, weil der Code die einzelne Phase nicht sicher festlegt.
- WMO 95–99: aktuelles Gewitter gemäß Codegruppe. WMO 95/97 kodieren Niederschlag, aber nicht eindeutig dessen Phase (Regen, Schnee oder Schneeregen); MID zeichnet deshalb nur eine Phase, wenn explizite Regen-/Schauer- oder Schneefelder sie tragen. Eine bloße Gesamt-Niederschlagsmenge reicht nicht aus. WMO 96/99 zeigen ohne Zusatzinformation ein neutrales kombiniertes Graupel-/Hagelzeichen; `TSGS` bzw. `TSGR` dürfen auf die eindeutige Variante schalten. WMO 98 ist Gewitter mit Staub-/Sandsturm und kein Niederschlagsnachweis.
- Schauerfamilien dürfen den Tages-/Nachthimmelskörper zeigen: Sonne am Tag, Mond in der Nacht. Dauerregen, Dauerschnee und andere stratiforme Phänomene erhalten keinen künstlichen Sonnen-/Mondrest.
- Graupel/Hagel/WMO 93–94 müssen in Detail-, Perioden-, Berg-, Event-, Routen-, Wasser-, Kurzfrist-, Tages- und Widgetrepräsentanzpfaden berücksichtigt werden und dürfen nicht durch alte Whitelists verloren gehen.

## Aggregation
- Stunden-/15-Minuten-Darstellungen übernehmen die intervallbezogene Intensität.
- Tages-/Folgenachtpiktogramme verwenden `periodWeatherVisual` und aggregieren nur die Stunden der jeweiligen Periode.
- Lange Ensemble-/Klimaaggregate ohne zuverlässige Intervallintensität erhalten keine künstliche Intensitätsstufe nur aus einer Tagesgesamtsumme.

## Schneehöhe
- Sichtbare Werte für `snow_depth`, `snowDepth`, `snowDepthMean`, modellierte oder gemessene Schneedecke: ganze cm.
- Achsenticks der Schneehöhe: ganze cm, Mindestschritt 1 cm.
- Eingaben für Mindestschneehöhe: Schrittweite 1 cm; intern wird der Grenzwert ganzzahlig behandelt.
- Interne Rohwerte bleiben ungerundet.
- Neuschnee, Schneefallmenge und Akkumulationen (`snowfall`, `newSnow24Cm`, `newSnow48Cm`, `pastSnow24Cm`) sind **nicht** Schneehöhe und dürfen weiterhin Dezimalstellen zeigen, damit kleine Mengen nicht zu `0 cm` verfälscht werden.

## Regression
`scripts/test-pictogram-intensity-snow-depth-098426.mjs` schützt diesen Vertrag zusätzlich zu den bestehenden Piktogramm-, Niederschlags-, Perioden- und Schneeeinheitentests.

## Nicht intensitätskodierte Sondercodes und WMO 98
- WMO 76/77/78/79 tragen keine reguläre leicht/mäßig/stark-Intensitätsklasse. Die Phasen bleiben appweit getrennt: 76 **Eisnadeln**, 77 **Schneegriesel**, 78 **vereinzelte Schneesterne/-flocken**, 79 **Eiskörner**. Insbesondere dürfen 76 und 78 nicht dieselbe Geometrie verwenden. MID erfindet aus dem Code allein keine Intensitätsbezeichnung; eine quantitative Schneemenge darf bei Schneegriesel die Darstellung nur dann staffeln, wenn sie tatsächlich vorliegt.
- WMO 98 bedeutet ein Gewitter mit Staub- oder Sandsturm. Der Code ist kein Niederschlagsnachweis: Das Piktogramm zeigt Gewitter/Wind, aber keine erfundenen Regentropfen; die zentrale Niederschlagslogik behandelt 98 nur dann als nass, wenn unabhängige Mengen-/Phasenfelder Niederschlag belegen.



## Present-Weather-Weitergabe
- Ein vom Fachkern bestimmtes `phenomenon` wird zusammen mit Code und Intensität durch Kurzfrist-, Detail-, Tages-/Nacht-, Event-, Berg-, Routen- und Wasserpfade gereicht.
- Beobachtete METAR/SYNOP/BUFR-Present-Weather-Kürzel haben für die semantische Phänomenbeschreibung Vorrang vor generischen Labels, solange die Beobachtung frisch genug ist.
- `HZ`, `FU`, `DU`, `SA` dürfen dieselbe Sichttrübungs-Grundform teilen, müssen aber textlich und in Accessibility eindeutig als trockener Dunst, Rauch, Staub bzw. Sand benannt sein.
