# DWD ADWICE- und Turbulenzdaten – Einbindungsprüfung für MID v0.8.26.5

## Ergebnis

Die derzeitigen Vereisungs- und Turbulenzfelder in den MID-Meteogrammen sind automatisierte Diagnosen aus Temperatur, Feuchte, Bewölkung, Wind und vertikaler Windscherung des ausgewählten Druckniveaumodells. Sie sind nicht identisch mit den operationellen DWD-Produkten ADWICE beziehungsweise WAWFOR-EDP.

## Offizielle DWD-Produkte

- **ADWICE** erkennt Gebiete mit unterkühltem Flüssigwasser und dient der Vereisungsprognose für den europäischen Luftraum.
- Das DWD-Produkt **WAWFOR** bietet ein Vereisungspaket mit ADWICE-Schweregrad auf vielen Druckniveaus und einem ADWICE-Szenario.
- Das WAWFOR-Turbulenzpaket enthält EDP-Felder auf zahlreichen Druckniveaus sowie Maximalwerte für vier Flugflächenbereiche. Die ICON-basierte WAWFOR-Variante besitzt globale Abdeckung.
- Die Bereitstellung erfolgt über einen vertraglich freigeschalteten DWD-Datenserver per SFTP oder HTTPS im Format GRIB2. Das Produkt ist nicht Bestandteil des frei zugänglichen DWD-Open-Data-Verzeichnisses.

## Technische Bewertung

Eine belastbare direkte Einbindung erfordert:

1. einen WAWFOR-Vertrag und Zugangsdaten,
2. einen serverseitigen GRIB2-Ingest mit Produkt- und Laufindex,
3. eine räumliche und vertikale Punkt-/Routenextraktion,
4. Caching und Laufzeitkontrolle im Backend,
5. eindeutige Quellen-, Lauf- und Gültigkeitsmetadaten,
6. eine Darstellung gemäß den DWD-Vorgaben für digitale Flugwetterinformationen.

Ein vollständiger GRIB2-Datensatz sollte nicht im Browser oder direkt in einem mobilen Client geladen und dekodiert werden. Für MID wäre bei vorhandenem Vertrag ein separater serverseitiger Ingest-Dienst sinnvoll, der nur die für Standort, Route und Zeitraum benötigten Profile ausliefert.

## Umsetzung in v0.8.26.5

- Keine ungesicherte oder vorgetäuschte ADWICE-/WAWFOR-Einbindung.
- Bestehende weltweite diagnostische Turbulenz- und Vereisungsdarstellung bleibt vollständig erhalten.
- Meteogramme kennzeichnen die Datenherkunft nun ausdrücklich als **MID-Diagnose**.
- Die Architektur bleibt für eine spätere lizenzierte WAWFOR-Anbindung offen.
