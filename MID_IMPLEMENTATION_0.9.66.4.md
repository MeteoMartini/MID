# MID 0.9.66.4 – ausfallsicherer DACH-Extremwetter-Ausblick

## Anlass

Der produktive Cloudflare-Endpunkt konnte den DACH-Ausblick mit `Daily API request limit exceeded. Please try again tomorrow.` bereits vor Ausführung der MID-Route ablehnen. Die bisherige Oberfläche zeigte dann die rohe, irreführend um DNS/CORS ergänzte Worker-Fehlermeldung und hatte nach einem App-Neustart keinen dauerhaften letzten Ausblick zur Verfügung.

## Umsetzung

- Der MID-Worker bleibt der bevorzugte Datenweg. Bei seinem Tageslimit oder einer sonstigen Nichterreichbarkeit führt die Professional-App denselben DACH-Ausblick als kostenfreien Direkt-Fallback im Browser aus Open-Meteo ICON-D2-EPS und ICON-D2 aus.
- Die Browserberechnung wird bei jedem Wartungslauf direkt aus `worker-src/25-dach-extreme-outlook.js` erzeugt. Damit bleiben DACH-Maske, 117 Stützpunkte, Perioden, P-/I-Klassen, Mehrparameter-Gewitterdiagnostik und alle übrigen meteorologischen Schwellen bytegleich zur Worker-Fachlogik; es gibt keine vereinfachte Ersatzprognose.
- Höchstens 60 Stützpunkte werden je Modellabruf übertragen. Der zentrale Open-Meteo-Guard begrenzt Parallelität, berücksichtigt Abbruchsignale und entfernt Browser-unzulässige Worker-Header.
- Ein gültiger Ausblick wird 20 Minuten als frischer und bis zu zwölf Stunden als ausdrücklich gekennzeichneter lokaler Ausfallcache gespeichert. Nach erkanntem Worker-Tageslimit wird der aussichtslose Worker-Aufruf bis zum nächsten UTC-Tageswechsel lokal übersprungen.
- Der Worker hält das aufwendig berechnete Ergebnis 30 Minuten im Fachcache und liefert für die Route einen 30-Minuten-Cachevertrag mit sechs Stunden `stale-while-revalidate`. Das reduziert wiederholte Modellberechnungen und ist eine funktionale Worker-Änderung.
- Die Oberfläche benennt den aktiven Datenweg, weist eine aktuelle Browser-Direktberechnung transparent aus und zeigt nur dann einen Warnstatus, wenn tatsächlich ältere lokal gesicherte Daten verwendet werden. Schlagen Worker, Direktabruf und lokaler Cache gemeinsam fehl, erscheint eine kurze deutsche Handlungsmeldung ohne rohe Infrastrukturdiagnose.

## Unverändert

Die meteorologischen Schwellen, Wahrscheinlichkeits- und Intensitätslogik, Konturendarstellung, Datenquellen, appweiten Einheiten und Lokal-/Z-Zeit-Einstellungen bleiben unverändert. Der Fallback nutzt ausschließlich bestehende frei zugängliche Datenwege; es entstehen keine zusätzlichen Kosten oder kostenpflichtigen Abhängigkeiten.
