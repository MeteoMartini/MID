# MID-C23 · Synoptik-Refresh .203

Verifizierte Basis: main = mid-stable 7139d589f8b0c2bee94d0c64942bb78e25c22589 (.202). Source-PR #295, Source-Gate 37766781966 und Installer 37767539618 vollständig grün, Pages erster Versuch erfolgreich; public/version.json .202. .202 enthält graue Theta-E-Konturen mit 12-Grad-Labels, unbeschriftete RH700-Konturen, fokussierte Pfeiltasten und optionale +60/+72-h-Felder. Kein Rückgriff auf einen alten Replit-Stand.

## Nachgelagerter Befund

Post-Push-Revision 37768611958: 943/944 Regressionen erfolgreich, CodeQL grün. Der Refresh-Fall in test-unified-map-layers-0985167 meldet Index 1 statt 16. Der Test kann während der asynchronen Katalogersetzung zu früh prüfen; zugleich hängen verfügbare Termine bisher vom gerade passenden Renderplan ab und werden beim Katalog-Neuladen geleert. Listenpositionen ändern sich auch bei aktualisierten Beobachtungsterminen. Die Prüfung darf deshalb keine feste Position mit einer Gültigkeitszeit gleichsetzen.

## Umsetzung

useSynopticCatalog behält beim Neuladen ausschließlich den bereits SHA-validierten Katalog, solange sämtliche Modellläufe weiterhin im bestehenden zulässigen Zeitfenster liegen (−1 bis +24 Stunden Alter). Keine Abschwächung von Frische-, Integritäts- oder Fehlerprüfung. Neue Daten ersetzen den alten Katalog erst nach vollständiger Validierung. Fehler bleiben sichtbar; aria-busy kennzeichnet den laufenden Refresh bzw. Feldabruf.

Die Zeitachse stammt direkt aus den tatsächlich vorhandenen Modellframes und ist unabhängig von der Existenz eines passenden Renderplans. Dadurch bleiben reale Modelltermine auch beim Modellwechsel von einem längeren auf einen kürzeren Horizont auswählbar. Die vorhandene timestampbasierte seek()/step()-Remap bleibt erhalten.

Browserprüfung: +72-h-Option anhand ihres echten Zeitstempels wählen, Endbegrenzung gegen diesen Zeitstempel prüfen; Katalog-HTTP-Antwort gezielt anhalten, Modellwahl und gültigen Termin während der Verzögerung prüfen; Antwort freigeben, bis aria-busy=false warten und dieselbe Gültigkeitszeit erneut prüfen. Keine Löschung, Lockerung oder Auslassung eines Assertionsziels. Pflichtmatrix weiterhin 24 Geräte-/Theme-/Designfälle im Source-/Installer-Gate.

## Daten-Nachweise aus MID-C22/C23

RUC-Recovery .201: Verarbeitungserfolg ohne Veröffentlichung unterdrückt keinen Catch-up mehr; eindeutige Übergabeartefakte pro Versuch; Post-Installer-Watchdog. Veröffentlichung des 09-UTC-Laufs 37762730007 vollständig erfolgreich. Normale Vorhersageabfrage nach .202 für Niederkassel 50,82/7,14 ohne refresh-Flag: RUC und RUC-EPS successful=true und usedInCanonical=true, jeweils 13 Stunden, 20 EPS-Mitglieder.

RUC-Lauf 37768664275 auf .202: Aufbereitung erfolgreich, Lauf 10 UTC, 899572109/900000000 Bytes, 1184 Objekte; ICON-D2 13 und ICON-EU/GFS/IFS jeweils 15 vollständige Synoptiktermine. Aufbereitung und Veröffentlichung vollständig erfolgreich; öffentliche Health-Prüfung ready=true, fresh=true, schemaValid=true, Lauf 10 UTC.

Original-DWD-Verzeichnisse ICON-EU 06 UTC enthalten alle sieben Komponenten für +60/+72 h eindeutig. Realer +72-h-Decoderlauf und exakte Frontendvalidierung erfolgreich: 329×689 Punkte, 29,5–70,5° N / −23,5–62,5° E, 529099 gzip-Bytes, 1918087 dekodierte Bytes, RH700 ausschließlich 60/80 %, 9108 Windvektoren innerhalb des bestehenden 10000er-Limits. Keine Änderung eines Budgets nötig.

Replit-Statusabfrage ausschließlich lesend; Connector meldete HTTP504. Kein Änderungs-, Synchronisations-, Reset- oder Veröffentlichungsauftrag erteilt. Replit-Stand deshalb noch nicht verifiziert; angehängte Logo-Archive unberührt.

## Validierung vor Source-PR

941/941 Core-Regressionen, TypeScript und Produktionsbuild erfolgreich. Alle 24 realen Kartenfälle erfolgreich; zusätzliche abschließende 390-px-Prüfung mit verzögertem Katalog und ICON-EU +72 → ICON-D2 +48 erfolgreich. Sämtliche 58 öffentlich veröffentlichten Synoptikfelder heruntergeladen, Bytezahl und SHA überprüft und mit dem exakten Frontendvalidator erfolgreich geprüft. Unabhängig lokal erzeugtes ICON-EU-+72-h-Feld stimmt per SHA mit dem veröffentlichten Feld überein. Pflicht-Gates führen die finale Quelle erneut vollständig aus.
