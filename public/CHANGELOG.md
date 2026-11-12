# MID v0.9.85.461

## Änderungen
- Europäisches OPERA-Radar: Die aktuellen EUMETNET-Originalkomposite werden bei Ausfall des primären Speichers über den in der offiziellen MeteoGate-Antwort benannten ECMWF-Ersatzspeicher bezogen. Fremde Speicherhosts, ungültige DBZH-Dateischlüssel und Weiterleitungen werden abgelehnt.
- Radar-Karten: Der Live-Zeitpunkt orientiert sich an tatsächlichen Beobachtungen. Ein bereits korrekt geladener Radarstand kann bei einem kurzzeitigen Fehler des Nachfolgeframes begrenzt sichtbar bleiben, statt abrupt zu verschwinden.
- Niederschlagsart: Fehlende passende Radarechos bleiben als fehlende Beobachtung kenntlich und werden von Modellprognosen unterschieden.
- RUC: Vor dem GitHub-Pages-Deployment wird das aktuelle Pages-Artefakt zweimal zeitversetzt SHA-256-/Run-gebunden sichtbar geprüft. Diese Prüfung gilt auch für zulässige Rohdaten-Rollbacks; Main-/Stable-SHAs werden unmittelbar davor erneut verglichen.

## Quellen, Sicherheit und Qualität
EUMETNET-OPERA-Kompositprodukte: CC BY 4.0 (https://www.eumetnet.eu/data-access/; https://creativecommons.org/licenses/by/4.0/). MID-Darstellungen und abgeleitete Niederschlagsraten sind keine amtlichen Warnungen. Keine neuen kostenpflichtigen Dienste, Secrets oder Produktionsrechte; bestehende DWD-/WMO-, 27h/EPS20-, NoData-, Akkumulations-, Frische- und Release-Gates bleiben bestehen.

## Freigabe und Einschränkungen
Erst nach dem regulären Source-PR-Gate, SHA-gebundenem Bot-Merge, serverseitigem Release-ZIP, Installer, Worker-/Pages-Checks und Stable-Promotion veröffentlicht. Native ICON-D2-Vollgebietsdaten (#446) benötigen weiterhin echte geschützte SLSA-/73-Objekt-/NoData-Publikationsnachweise. OPERA-Radar ersetzt keine getrennt fehlschlagenden EUMETSAT-Satellitenbilder. Keine reale iOS-/VoiceOver-Abnahme behauptet.
