# MID v0.9.64.1 – Tagesdetail direkt am gewählten Tag

## Aufklappverhalten

- Im Hochformat wird der stündliche Tagesverlauf im selben 7-Tage-Raster unmittelbar nach der ausgewählten Tageszeile gerendert.
- Die späteren Tage folgen unterhalb des geöffneten Verlaufs in unveränderter Reihenfolge.
- Beim Zuklappen entfällt ausschließlich der Detailblock; die sieben Tageszeilen nehmen wieder ohne Lücke ihre vorherige kompakte Anordnung ein.
- Im Querformat bleiben die sieben gleich breiten Tagesspalten erhalten. Der Detailblock überspannt darunter die vollständige Reihe, damit keine Tagesspalte verdrängt oder abgeschnitten wird.

## Sonnenscheindauer

- Jede Tageskarte zeigt zusätzlich die tägliche Sonnenscheindauer als kompakte Angabe „☀ x h“.
- Der Tageswert in Sekunden wird mit `Math.round` auf volle Stunden gerundet.
- Die Angabe nutzt die vorhandene Metadatenfläche für Niederschlagswahrscheinlichkeit und -dauer. Sie erzeugt weder eine zusätzliche Kartenzeile noch eine größere Tageskarte.

## Unveränderte Verträge

- Die ausrichtungsabhängige Darstellung aus v0.9.64.0 und die farbigen Regimeklassifizierungen wie „Heiß“, „Ruhig“, „Sonnig“, „Wind“, „Schauer“ und Niederschlagsarten bleiben erhalten.
- Wetterdaten, Prognosefusion und Worker-Funktionalität ändern sich nicht. Ein funktionales Worker-Update ist nicht erforderlich; nur die Releasekennung wird synchronisiert.
