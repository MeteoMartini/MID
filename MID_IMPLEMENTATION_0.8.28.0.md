# MID v0.8.28.0

## 1. iCloud-Drive-Sicherung und Wiederherstellung

Unter **Einstellungen → Daten & Synchronisation** steht eine neue vollständige MID-Sicherung bereit.

Gesichert werden:

- Favoriten, Gruppen, Profile und bevorzugte Orte
- App-, Darstellungs-, Diagramm- und Moduleinstellungen
- Einstellungen des lokalen Wetterzwillings
- Wetterzwilling-Prognosen, Referenzen und Beobachtungen aus Local Storage und IndexedDB
- weitere dauerhaft gespeicherte MID-Konfigurationen

Bewusst nicht exportiert werden Zugangsschlüssel, Stationspasswörter, Push-Abonnements, Geräte-Synchronisationsgeheimnisse und temporäre Wettercaches.

Die Datei verwendet die Endung `.midbackup` und enthält einen SHA-256-Integritätswert. Beim Import werden Format und Integrität geprüft. Die Sicherung ist **nicht verschlüsselt**; sie sollte daher nur im eigenen iCloud Drive abgelegt werden.

Eine installierte Web-App kann iCloud Drive nicht direkt und unbeaufsichtigt beschreiben. MID öffnet auf iPhone/iPad deshalb das systemeigene Teilen-Menü. Dort wird **In Dateien sichern → iCloud Drive** gewählt. Auf anderen Geräten steht ein Dateidownload zur Verfügung.

## 2. Professionell neu aufgebaute Ensemble-Diagramme

Temperatur, Niederschlag sowie Wind/Böen verwenden jetzt eine gemeinsame Chart-Engine mit denselben geometrischen Grundwerten:

- identische horizontale Tagespositionen
- gleichartige, zweizeilige Tagesbeschriftung
- gemeinsame Plot-Ränder, Achsenbreiten und X-Achsenhöhen
- einheitlicher moderner Karten-, Raster- und Typografiestil
- identische responsive Regeln für Hochformat, Querformat, Desktop und Export
- barrierearme, lesbare Tooltips

Auf schmalen Displays werden Tooltips als feste mobile Detailkarte außerhalb des Diagramm-Clippings dargestellt. Auf Desktop bleiben sie als kompakte, positionsnahe Karten erhalten.

Die Temperaturgrafik behält sämtliche bisherigen Inhalte: Best Match, P10–P90, optional P25–P75, ENS-Mittel, Klimamittel, Sonnenscheindauer, Wetter-/Niederschlagsband, Warnmarker sowie Modell- und Mitgliederinformationen. Die Wetterleiste besteht aus lückenlosen Tageszellen; jede Tageshilfslinie schneidet die Mitte der zugehörigen Zelle.

## 3. Schutz gegen weißen PWA-Start und Datenverlust

MID besitzt nun mehrere Startschutzebenen:

- sofort sichtbare HTML-Startoberfläche statt leerer weißer Seite
- Zeitlimits für die Wiederherstellung lokaler und geräteübergreifender Zustände
- React Error Boundary mit verständlicher Wiederherstellungsansicht
- native Fallback-Oberfläche, wenn React selbst nicht starten kann
- gezielte Reparatur von App-Shell- und Service-Worker-Caches
- lokale Daten in Local Storage und IndexedDB werden bei der Reparatur nicht gelöscht
- Möglichkeit, direkt aus der Wiederherstellungsansicht zunächst eine MID-Sicherung anzulegen
- Speicherung technischer Startfehler für die Diagnose

Damit erfordert ein beschädigter PWA-Cache nicht mehr automatisch die Neuinstallation der Web-App und den Verlust lokaler Einstellungen.

## Prüfung

- 204 von lokalen Abhängigkeiten unabhängige Regressionstests vollständig bestanden
- 11 weitere, TypeScript-basierte Altprüfungen konnten in der isolierten Arbeitsumgebung nicht ausgeführt werden, weil deren lokale npm-Typdefinitionen unvollständig sind; sie werden im GitHub-Workflow nach `npm ci` regulär ausgeführt
- neue Prüfungen für iCloud-Sicherung, Startwiederherstellung und die gemeinsame Ensemble-Chart-Engine bestanden
- keine unaufgelösten Namen oder ungenutzten Deklarationen in den geänderten Quelldateien erkannt
