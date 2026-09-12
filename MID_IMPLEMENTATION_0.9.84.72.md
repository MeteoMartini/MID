# MID 0.9.84.72 – Implementierung

## Ausgangsbasis
Direkte Fortsetzung des MID-Standes 0.9.84.71. Zu Beginn des Patches standen `main` und `mid-stable` noch auf dem erfolgreich installierten MID 0.9.84.70 (`fa6f15dd72bbfa63cca4efe6021fc5d576c30dd4`); deshalb wurde der unmittelbar zuvor erzeugte 0.9.84.71-Stand als Arbeitsbasis beibehalten. Unmittelbar vor der Paketierung waren anschließend sowohl `main` als auch `mid-stable` auf MID 0.9.84.71 (`64dccfafa8f95c35f9668d6e7213d271442414f3`) promotet. Damit ist bestätigt, dass die Arbeitsbasis dem zu diesem Zeitpunkt kanonischen Projektstand entspricht.

## Änderungen
1. Screenshot-getriebener Audit der iPhone-Kopfzeile: Versionsnummer, Brand und fünf Aktionsschalter werden auf <=430 px als zwei echte `max-content`-Spalten reserviert. Die Versionsnummer darf nicht mehr unter die Aktionen laufen oder abgeschnitten werden.
2. Für <=360 px wird die Kopfzeile bewusst dreizeilig (Brand / Aktionen / Suche), damit Touchziele und Version vollständig bleiben statt weiter verkleinert zu werden.
3. `Feuchte / Taupunkt` im kompakten Istwetter-Fact darf auf kleinen Breiten balanciert umbrechen; der Wertblock bleibt zentriert und kollisionsfrei.
4. Die zehn `Aktuelles Wetter > mehr`-Karten wurden in Primärwert, kurze sichtbare Zusammenfassung und ausführliche Infoebene getrennt.
5. Messquellen, Methodik, längere Niederschlags-/Bewölkungs-/Sonnenscheintexte sowie QFF-Einordnung bleiben vollständig verfügbar, liegen aber hinter dem vorhandenen (i)-Popover.
6. Sichtbar bleiben nur unmittelbar nützliche Kurzangaben, z. B. relative Feuchte, Windrichtung, 1-h-Niederschlag, Bewölkungscharakter, Drucktendenz, UVI-Wert, dominanter Luftschadstoff und Bezugszeitraum der Sonnenscheindauer.
7. Sichtbare Zusammenfassungen werden auf maximal zwei Zeilen begrenzt; Touch-Infoziele bleiben bei 44 px.
8. Neuer Regressionstest `scripts/test-current-header-density-098472.mjs`; `src/styles.css` aus den fünf kanonischen Modulen neu aufgebaut.
9. Releaseversion auf 0.9.84.72 synchronisiert. Worker-Domainlogik unverändert; nur `WORKER_VERSION` geändert.

## Nicht geändert
Keine meteorologische Messwert-/Forecastlogik, keine Modellfusion oder Quellengewichtung, keine Warnschwellen, keine Radar-/Nowcastlogik, keine WMO-/DWD-Terminologie, keine Wetterpiktogramme und keine Parameterfarben.
