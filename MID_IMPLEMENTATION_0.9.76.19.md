# MID v0.9.76.19 – Ensemble-Resume-Recovery und Profil-/Marker-Finalisierung

## Anlass
Periodisch konnte die 14-Tage-Ansicht nach einem App-Resume bzw. einer same-location Dashboard-Aktualisierung ohne Ensemble-Daten verbleiben. Die Best-Match-Tagesdaten blieben sichtbar, während der Ensemble-Bereich erst nach einem vollständigen App-Neustart wieder geladen wurde.

## Ursache
`load()` erhöhte bei Resume/Reload die gemeinsame Request-Generation, brach alle laufenden Requests ab und leerte Ensemble-State. Der Ensemble-Effect reagierte jedoch ausschließlich auf Standort und Modulaktivierung. Bei unverändertem Standort änderten sich diese Dependencies nicht; nach dem Abbruch wurde deshalb kein neuer Ensemble-Request gestartet. Ein kompletter Neustart mountete den Effect neu und verdeckte den Lebenszyklusfehler.

## Umsetzung
- Eigene `ensembleRefreshRevision` eingeführt und nach erfolgreichem Kernforecast erhöht.
- Ensemble-Effect an die aktuelle Forecast-Generation gekoppelt; same-location Resume/Reload startet den Ensemble-Abruf erneut.
- Vorhandene Ensemble-Tage werden bei einem same-location Refresh nicht mehr vorsorglich gelöscht.
- Transiente Ensemble-Fehler löschen den letzten erfolgreichen Stand nicht mehr.
- Bei leerem/fehlgeschlagenem Ensemble-Abruf erfolgt bei sichtbarer, online befindlicher App nach 45 s ein automatischer Wiederholungsversuch.
- Neuer Regressionstest `test-ensemble-resume-refresh-097619.mjs` schützt den Resume-/Retry-Vertrag.

## Mitgeführte UI-Finalisierung
- 24-h-Wetterprofil: Nachtbereiche wieder klar sichtbar schraffiert; redundante rote Jetzt-Linie und „JETZT“-Beschriftung entfernt; gewählte Uhrzeit sitzt an der blauen Auswahlachse; „gleitend ab …“ entfernt; Zellüberlappungen bei thermischem Empfinden, Wolken und Hazards vermieden.
- DWD „Wolken + Niederschlagsart“: Ortsmarker als dünnere Stecknadel mit geringer Bildabdeckung.
- Die zugehörigen CSS-Quellfragmente wurden mit dem generierten `styles.css` synchronisiert, damit `maintain:aggregates` die Änderungen nicht zurückrollt.

## Releasewirkung
Gemeinsamer Browser/PWA/iOS-React-Kern. Keine fachliche Worker-Änderung; nur die Releaseversionszeile des Workers wird synchronisiert und vom semantischen Worker-Diff herausgefiltert. Kein manueller Worker-Upload erforderlich.
