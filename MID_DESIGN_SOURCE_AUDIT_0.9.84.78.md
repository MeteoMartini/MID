# MID Design-/Quellen-Audit v0.9.84.78

## Designbefund: vollständige Versionsanzeige

Der Header konnte auf schmalen iPhonebreiten die Versionsnummer abschneiden, weil Marke/Version und fünf Aktionsziele dieselbe Rasterzeile teilten. Der neue Vertrag trennt bei höchstens 430 px Marke/Version, Aktionen und Suche in drei Rasterzeilen. Die Versionskennung ist `nowrap`, darf nicht ellipsiert werden und ihr Container darf nicht auf eine unlesbare Restbreite schrumpfen. Die 44-px-Touchziele der Aktionen werden dafür nicht verkleinert.

Der strukturelle Regressionstest ist bestanden. Eine zusätzliche Chromium-Simulation mit dem aggregierten MID-CSS wurde versucht, konnte in der aktuellen Sandbox wegen der D-Bus/Zygote-Umgebung des Headless-Browsers jedoch nicht zuverlässig abgeschlossen werden. Aus diesem Lauf wird deshalb bewusst kein visueller Echtrender-Erfolg abgeleitet.

## Quellenbefund: Schweizer BAFU-Hydrologie

Für die Schweiz wird die öffentliche BAFU-Datenplattform als amtlicher Direktpfad genutzt. Der serverseitige Adapter liest aktive Stationsmetadaten sowie hydrologische Live-Beobachtungen und übernimmt Wasserstand (`W`), Abfluss (`Q`) und Wassertemperatur (`WT`). GraphQL-Fehler werden auch bei HTTP 200 explizit ausgewertet; Stationsmetadaten werden begrenzt gecacht und Beobachtungen unterliegen einer Freshness-Prüfung.

Wasserstände werden bewusst im von BAFU gelieferten nativen Höhenbezug, typischerweise `m ü. M.`, dargestellt. Es erfolgt **keine** Umrechnung in den deutschen PEGELONLINE-Pegelvertrag `cm`. Abfluss bleibt in `m³/s`, Wassertemperatur in `°C`. MID kennzeichnet die Daten als amtliche Live-Rohbeobachtung.

## Abgrenzung und Priorität

- Deutschland: WSV PEGELONLINE REST API v2, Wasserstand in cm und verfügbare `WV`-Vorhersagen.
- Schweiz: BAFU Nationales hydrologisches Messnetz über die öffentliche Datenplattform, native Pegelhöhe, Abfluss und Wassertemperatur.
- GloFAS bleibt Modellprognose und wird weder als Messung noch als amtliche Hochwasserwarnung ausgegeben.
- EFAS bleibt gemäß bestehendem Quellenvertrag von einer öffentlichen Echtzeitdarstellung ausgeschlossen.

## Releasehinweis

Der BAFU-Pfad ergänzt funktionale Workerlogik. Für v0.9.84.78 ist deshalb ein Worker-Deployment erforderlich. Der vollständige lokale Projektbuild konnte in dieser Laufzeit wegen wiederholter Registry-DNS-Fehler (`EAI_AGAIN`) nicht ausgeführt werden; GitHub Actions bleibt dafür das verbindliche Release-Gate.
