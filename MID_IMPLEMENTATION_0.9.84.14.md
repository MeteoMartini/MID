# MID v0.9.84.14 – Ensemble-Widgetauswahl

## Umsetzung

- Das 14-Tage-Ensemble-Widget exportiert nicht mehr alle Diagramme gemeinsam.
- Im Widget-Menü ist genau eines der Diagramme **Temperatur**, **Niederschlag** oder **Wind/Böen** wählbar.
- Die Auswahl wird zusammen mit den übrigen Widgeteinstellungen lokal gespeichert.
- Der angezeigte Orts- beziehungsweise Favoritenname steht im Kopf jedes Ensemble-Widgets.
- Modellfamilien, Modellstände, technische Exportmetadaten, Übersichtspillen und allgemeine Ensemble-Werkzeuge werden in der Widgetdarstellung nicht angezeigt.
- Nur das ausgewählte Diagramm ist in Vorschau, Zwischenablage und PNG sichtbar.
- Die normale 14-Tage-Ensembleansicht der App bleibt unverändert.

## Ortsliste der Live-URLs

Die feste Ortsliste liegt zentral in `src/widgetUrlExports.ts` unter `WIDGET_URL_LOCATIONS`.
Ein Ort wird durch genau eine Zeile mit stabiler ID, URL-Kennung, Anzeigename, Breite und Länge gepflegt. Die Kombinationen aus Kompakt/Kurve und 5/7 Tagen werden daraus automatisch erzeugt.

