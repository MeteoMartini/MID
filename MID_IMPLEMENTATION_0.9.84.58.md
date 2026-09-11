# MID 0.9.84.58

## Installer #1013
Der Installer importierte v0.9.84.57 erfolgreich, installierte die Abhängigkeiten und bestand den Dependency-Audit. Im TypeScript-7-Check stoppte `src/RadarPanel.tsx` mit TS2322, weil der neue Fronten-Tooltip das Prop `sticky` nutzte, das im lokalen MID-Typvertrag des Leaflet-Tooltip nicht vorgesehen ist.

`sticky` ist für die meteorologische Funktion nicht erforderlich und wurde entfernt. Frontlinie, Fronttyp, Modellbezeichnung und Score bleiben im Tooltip erhalten. Die Synoptiklogik selbst bleibt gegenüber v0.9.84.57 unverändert.
