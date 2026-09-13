# MID 0.9.84.79 – Fortsetzung App-weiter Darstellungsprüfung

## Ziel

Fortsetzung des in MID 17.7.23 festgelegten Vorgehens: nicht nur einzelne gemeldete Screenshots, sondern sämtliche Dashboard-Module sowie globale Bedien-, Einstellungs-, Tooltip-/Popover- und Installationsflächen werden gegen denselben Lesbarkeits- und Responsive-Vertrag geprüft.

## Umsetzung

- Neue vollständige Audit-Matrix `MID_APP_VIEW_AUDIT_0.9.84.79.md` für alle 18 aktivierbaren Dashboard-Module sowie Shell-/Sekundärbereiche.
- Optionale moderne Heute-Ansicht: historische 7,5–9-px-Texte auf die semantischen MID-Typografietokens angehoben; Wetterbeschreibung, Kennwerte und Kurztrend werden nicht mehr per Ellipse abgeschnitten.
- Aktuelles Wetter: kompakte lokale Hinweis-/Gefahrenzeilen einschließlich Status und Erläuterungen lesbarer gemacht.
- Warnungen: Status-/Zeittexte im kompakten Warnkopf vereinheitlicht.
- Prognosegüte und Quellenanalyse: Modell-/Quellennamen dürfen vollständig umbrechen; KPIs, Rankings und Metadaten verwenden die gemeinsame Mindesttypografie.
- Routenwetter: Formular-, Such-, Bewertungs-, Tooltip- und Checkpointtexte vereinheitlicht.
- Einstellungen, Gerätesync, verbundene Stationen, iCloud-/Apple-/Push-/Wetterzwilling-Einstellungen sowie PWA-Installationsdialoge an denselben Sekundärtextvertrag gebunden.
- Ensemble-Szenariocluster: erklärende Texte und Modellnamen vollständig lesbar; die eigentliche Mini-Zeitachse bleibt als dichte wissenschaftliche Visualisierung separat.
- Touch-Vertrag für die neu einbezogenen Sekundärbereiche auf groben Zeigegeräten mit mindestens 44 px abgesichert.

## Nicht verändert

Keine Änderung an Wetterdaten, Modellfusion, Nowcast-/Warnlogik, Wetterpiktogrammen, Parameterfarben, amtlichen Quellenadaptern oder Worker-Fachlogik. Der Worker erhält nur die übliche Versionsmetadaten-Synchronisierung.
