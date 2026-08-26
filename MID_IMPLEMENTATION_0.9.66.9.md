# MID 0.9.66.9 – DWD-nahe Gefahrendarstellung und konfliktfeste Sektionsreihenfolge

## Karte und Gefahrenskala

Der DACH-Ausblick verwendet CARTO Voyager statt der sehr hellen Positron-Grundkarte. Die unbeschriftete Orientierungskarte liegt unter den Prognoseflächen, der zugehörige Beschriftungslayer darüber. Die Füllungen sind transparenter, damit Landes- und Verwaltungsgrenzen auch innerhalb eines Gefahrengebiets als Orientierung erkennbar bleiben.

Die vier MID-Prognosestufen heißen `Wettergefahr`, `markante Wettergefahr`, `Unwetterpotenzial` und `extremes Unwetterpotenzial`. Gelb, Orange, Rot und Violett folgen der vertrauten DWD-Warnlogik. Die Begriffe `Potenzial` und `MID-Prognosestufe` grenzen die automatische Modellprognose weiterhin klar von amtlichen Warnungen ab.

## Bedeutung der Schraffur

Bis 0.9.66.8 entschied der Spitzenwert der Wahrscheinlichkeit eines gesamten zusammenhängenden Polygons über dessen Schraffur. Dadurch konnte ein 45- oder 50-Prozent-Marker in einer ungeschraffierten Fläche liegen, wenn ein anderer Teil derselben Fläche mindestens 60 Prozent erreichte. 0.9.66.9 erzeugt die Schraffurgeometrie separat aus dem interpolierten Wahrscheinlichkeitsfeld. Schraffiert ist damit exakt der jeweilige Flächenanteil unter 60 Prozent; ab 60 Prozent bleibt die Füllung glatt. Farbe beschreibt die erwartete Wirkungsklasse, Prozentwert und Deckkraft die Eintrittswahrscheinlichkeit.

## Dauerhafte Sektionsreihenfolge

Die bisherige synchrone Speicherung reichte bei einem noch nicht aktualisierten IndexedDB-Spiegel nicht aus: Beim nächsten Start konnte der Spiegel den bereits neueren localStorage-Wert wieder überschreiben. Dashboard-Einstellungen tragen deshalb nun einen monotonen `updatedAt`-Zeitpunkt. Die Speicherrettung vergleicht eingebettete Revision und Spiegelrevision und übernimmt den tatsächlich neueren Stand.

Alte Konfigurationen, denen später ergänzte Sektionen fehlen, werden einmalig normalisiert und unmittelbar als vollständiger, revisionierter Stand gespeichert. Der verschlüsselte Geräteabgleich führt für die Sektionsreihenfolge zusätzlich einen eigenen Neuigkeitsvergleich aus; ein älterer Remote-Snapshot darf eine lokal jüngere Reihenfolge nicht mehr ersetzen und wird anschließend mit dem geschützten lokalen Stand aktualisiert.

## Absicherung

Die Regression `scripts/test-extreme-outlook-dwd-scale-dashboard-persistence-09669.mjs` prüft Voyager-Layerfolge, DWD-nahe Namen und Farben, teilflächenbezogene Schraffurgeometrie, Migrationsspeicherung, Wiederanlauf einer geänderten Reihenfolge sowie die Konfliktschutzverträge in Speicherrettung und Geräteabgleich.
