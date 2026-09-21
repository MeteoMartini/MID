# MID v0.9.85.80 · MID 18.2.4 · Arbeitspaket D

## Heute / Tagesprofil / 24-h-Profil

Das 24-Stunden-Profil nutzt eine gemeinsame Zeitspur für Wetterstreifen, Temperatur, weitere Parameter, Auswahlmarker und Einzeldaten. Vertikale Hilfslinien bleiben stündlich sichtbar; Zeitbeschriftungen werden in einem ruhigen 3-Stunden-Raster gezeigt und an Tagesgrenzen ergänzt.

Die Skybar beziehungsweise die alternative Darstellung mit Stundenquadraten bleibt unabhängig von einer verdichteten Kurvendarstellung **stündlich aufgelöst**. Sonne, Gesamtbewölkung und Niederschlag folgen weiterhin derselben zentralen MID-Logik; Niederschlagsphase und Intensität werden nicht neu klassifiziert oder normalisiert.

Die Temperaturkurve nutzt die bestehende wertbasierte ECMWF-Farbskala. Maxima und Minima sowie der ausgewählte Zeitpunkt bleiben sichtbar, ohne die Kurve durch übergroße Marker zu überdecken.

Die Einzeldaten und Zeit-Lupe folgen exakt demselben ausgewählten Zeitpunkt. Wettertext, Piktogramm, Temperatur, Taupunkt, Niederschlag, Wind/Böen, Luftdruck und Bewölkung stammen damit aus demselben Zeitschritt.

Mobile, Tablet- und Desktop-Darstellung wurden auf eine gemeinsame Instrumentfläche verdichtet. Overlays, Einzeldaten und Legenden bleiben im Viewport; die mobile Bottom-Bar-Safe-Area wird berücksichtigt.

Wetterfachlogik, Warnungen, RUC/Nowcast, Radar/Karten, Datenfusion und Wetterzwilling bleiben unverändert. Replit implementiert und prüft; Veröffentlichung, Deployment und Stable-Promotion erfolgen ausschließlich durch ChatGPT über den kanonischen MID-Releasepfad.

## D.2 · Temperaturtrend und Nachtstunden

Der 12-Stunden-Temperaturtrend verwendet dieselbe bereits lokal beziehungsweise hyperlokal angepasste Stundenreihe wie die übrigen Prognosemodule. Der aktuelle Messwert wird nicht mehr isoliert als erster Kurvenpunkt in eine anders korrigierte Reihe eingesetzt. Dadurch entstehen keine künstlich großen Trendbeträge allein durch unterschiedliche Datenbasen.

Bei einem deutlichen Richtungswechsel wird der Verlauf in zwei Phasen beschrieben, beispielsweise zuerst Abkühlung und anschließend erneute Erwärmung. Die Änderung wird in ganzen Kelvin ausgegeben; die Spannweite bleibt separat sichtbar.

Nachtstunden werden über eine gemeinsame, minutengenaue Sonnengeometrie berechnet und dezent im Hintergrund von Temperaturkurve und Skybar beziehungsweise Stundenquadraten dargestellt. Die Kennzeichnung blendet an Sonnenuntergang und Sonnenaufgang weich ein beziehungsweise aus. Die meteorologischen Farben, Wetterklassifikation und stündliche Skybar-Auflösung werden dadurch nicht verändert.

Replit hat D.2 inklusive Light/Dark und der vereinbarten Smartphone-, Tablet- und Desktopgrößen geprüft. Veröffentlichung und Stable-Promotion erfolgen ausschließlich durch ChatGPT.
