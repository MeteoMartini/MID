# MID v0.9.64.4 – konsistentes Gewitterrisiko und Wassersport-Übersicht

## Einheitliches Gewitterrisiko

- Die Ortsansichten „Aktuell“ und „Wassersport“ verwenden denselben zentral berechneten Wert für die nächsten 6 Stunden. Angezeigt werden qualitative Stufe und Prozentwert; der Wassersport führt keine eigene Schwelle mehr.
- Wettercode, CAPE, Lifted Index, CIN, Feuchte, Schauer, Niederschlag und Auslösewahrscheinlichkeit werden gemeinsam bewertet. CAPE allein erzeugt kein Gewitterrisiko.
- Die Höhenansicht ruft Lifted Index, CIN und integrierten Wasserdampf zusätzlich ab und verwendet dieselbe Mehrparameterdiagnose. Ein reines CAPE-Signal heißt dort nur noch „konvektive Instabilität“.
- Die bereits eingeführte Begriffsgrenze für aktuelle Radar-Zellen bleibt unverändert: Ohne detektierten Blitz heißt eine Zelle „Starker Schauer“; „Gewitter“ setzt mindestens einen Blitz voraus. Ein prognostiziertes Gewitterrisiko ist davon klar getrennt.

## Neue Wassersport-Übersicht

- Die umgesetzte Konzeptansicht gliedert alle vorhandenen Werte in „Wasser & Wellen“, „Strömung & Tide“ und „Wetter am Wasser“. Der doppelte Innentitel entfällt; der bestehende Modulrahmen bleibt die eindeutige Überschrift.
- Gewässer- und Aktivitätsauswahl stehen kompakt am Kopf. Die Eignung wird als farbiger Score-Ring mit den bisherigen Klassifizierungen und vollständigen Begründungen dargestellt.
- Auf schmalen Displays bleiben zwei kompakte Spalten erhalten; Tidenkarte und Gewitterrisiko nutzen bei Bedarf die volle Breite. Alle Karten besitzen `min-width: 0`, umbrechbare Details und keine horizontale Abschneidung.
- Der einklappbare Wasserwetter-Verlauf sowie die vollständigen Gezeitenereignisse bleiben erhalten. Seine Zeitsegmente verwenden ebenfalls die zentrale Gewitterdiagnose statt einer CAPE-Sonderregel.

## Vollständiger Tidenhub

- Primärwert der Tide-Karte ist jetzt der komplette Tidenhub: die absolute Wasserstandsdifferenz des nächsten vollständigen Hoch-/Niedrigwasserpaars.
- Der aktuelle modellierte Wasserstand inklusive Tide und seine Tendenz bleiben als eigener Sekundärwert sichtbar; eine kompakte 24-Stunden-Kurve unterstützt die Einordnung.
- Liegt kein vollständiges Hoch-/Niedrigwasserpaar vor, zeigt MID keinen scheinbar vollständigen Tidenhub aus einem angebrochenen 24-Stunden-Ausschnitt. Der aktuelle Wasserstand bleibt dennoch erhalten.

## Qualität und Auslieferung

- Eine neue funktionale Regression prüft CAPE-Alleinsignale, Mehrparametersignale, gemeinsame 6-Stunden-Weitergabe, den vollständigen Tidenhub, die Bergparameter sowie das responsive Gruppierungslayout.
- Frontend, Versionsdateien, Service Worker, Worker und beide Auslieferungs-ZIPs werden gemeinsam auf v0.9.64.4 synchronisiert. Der Worker enthält keine neue Fachlogik dieses Releases, wird aber für einen kohärenten Versionsstand mit ausgeliefert.
