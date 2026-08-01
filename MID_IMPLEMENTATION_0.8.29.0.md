# MID v0.8.29.0

## Vollständige Sicherung und Wiederherstellung

- Neues Sicherungsformat v2 mit vollständigem langlebigem MID-Zustand.
- Gesichert und wiederhergestellt werden Favoriten, Gruppen, Profile, aktiver/letzter Standort, App-, Modul-, Diagramm- und Darstellungseinstellungen sowie das vollständige Wetterzwilling-Langzeitarchiv.
- Die Wiederherstellung ersetzt den bisherigen langlebigen lokalen Stand statt nur einzelne vorhandene Werte zu ergänzen.
- Der bestehende verschlüsselte Geräteverbund wird in der Sicherung als Wiederherstellungsinformation mitgeführt; bei fehlendem Verbund kann nach dem Import automatisch ein neuer Verbund erzeugt werden.

## iOS-PWA-Übernahme

- Safari kann eine installierte Home-Bildschirm-Web-App technisch nicht direkt öffnen und deren getrennten Speicher nicht unmittelbar beschreiben.
- Nach einer Wiederherstellung außerhalb der installierten MID-App wird deshalb ein Übernahmecode angezeigt.
- Der wiederhergestellte Gesamtstand wird verschlüsselt in den Geräteverbund hochgeladen und kann in der installierten MID-App über Einstellungen → Daten & Synchronisation übernommen werden.
- Wird die Sicherung direkt innerhalb der installierten MID-App eingespielt, erfolgt der Neustart automatisch.

## Geräteübergreifende Synchronisation

- Aktiver/letzter Standort wird nun ebenfalls synchronisiert.
- Remote-Stände werden verlustarm mit vorhandenen lokalen Daten zusammengeführt, statt lokal vorhandene zusätzliche Schlüssel pauschal zu löschen.
- Änderungen an Wetterzwilling-Daten lösen automatisch einen gedrosselten Archivabgleich aus.
- Automatischer Abgleich bei App-Start, Rückkehr in den Vordergrund, Wiederherstellung der Internetverbindung und im Zweiminutenintervall.
- Nach Übernahme eines entfernten Standes lädt MID einmal kontrolliert neu, damit sämtliche React-Zustände und Einstellungen sofort konsistent sind.

## Sicherheitsgrenzen

- Gerätegebundene Push-Abonnements, Stationspasswörter und Zugangsschlüssel werden weiterhin nicht exportiert oder synchronisiert.
- Der Cloudflare Worker speichert ausschließlich browserseitig AES-GCM-verschlüsselte Nutzdaten.
