# MID v0.8.30.0

## Sicherung & Synchronisation
- Automatische Web-App-Synchronisation und manuelle iCloud-Sicherheitskopie sind im Einstellungsmenü klar getrennt und widerspruchsfrei beschrieben.
- Jede installierte MID-Web-App kann einmal mit demselben persönlichen Synchronisationscode verbunden werden.
- Danach werden sämtliche portablen MID-Einstellungen, Favoriten, Standorte, Modul-/Diagrammzustände, Radar-/Meteogramm-/Reiseplaneroptionen und Wetterzwilling-Daten verschlüsselt abgeglichen.
- Vollständige Snapshots synchronisieren auch entfernte oder zurückgesetzte Einstellungen.
- Das Sicherungsformat v3 verwendet dieselbe portable Datenrichtlinie wie die Synchronisation.

## Bewusst gerätegebunden
- Push-Abonnements
- Stationspasswörter, Bearer-Token und externe Zugangsschlüssel
- temporäre Wetter-, Karten-, Modell- und Diagnose-Caches

## iOS/PWA
Safari und eine installierte Home-Bildschirm-Web-App können getrennte Speicherbereiche besitzen. MID kann die installierte App aus Safari nicht automatisch öffnen. Der vollständige Datenstand wird deshalb über den einmalig einzugebenden Synchronisationscode übertragen.
