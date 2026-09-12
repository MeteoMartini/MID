# MID Design- und Quellen-Audit v0.9.84.76

## Ergebnis

Der Audit erweitert v0.9.84.75 ohne Rückbau bestehender Quellen oder Ansichten. Nationale/amtliche Direktquellen behalten Vorrang; neue Adapter werden nur eingesetzt, wenn sie fachlich und technisch verfügbar sind.

### Design

- Mindestlesbarkeit für sichtbare sekundäre Informationen nachgezogen; Diagrammachsen bleiben separat behandelt.
- Vollständiges Wrapping für Eventtitel, Eventmetadaten, Gewitter-Ortsdetails, Radar-/Warnhinweise und Flugmet-Quellenhinweise.
- Touch-Ziele der geprüften Navigationen bleiben bei mindestens 44 px.
- Ensemble-Tooltip bleibt deckend, mobil viewportgebunden und intern umbrechbar.
- Chromium-Matrix: 320×568, 375×812, 390×844, 430×932, 768×1024, 1024×768, 1366×768, 1920×1080 – kein horizontaler Dokumentüberlauf in den Auditfixtures.

### Quellen

1. PEGELONLINE: echte `WV`-Werte einschließlich Forecast/Estimate und Initialisierung.
2. Freshness: alte amtliche Adapterwerte dürfen keine frischeren Fallbacks überstimmen.
3. UBA v4: aktuelle Messung, klare Attribution, Modell bleibt Prognose/Fallback.
4. KNMI: aktuelle EDR-Collection; API-Key-Pflicht bestätigt; Legacy gesperrt.
5. SwissMetNet: öffentlicher STAC-Vertrag bestätigt.
6. ECMWF 50r1/AIFS v2: Streammigration und neue Wave/Snow-Cover-Produkte bestätigt; keine erfundene AIFS-Schneehöhe.
7. DWD KONRAD3D/Mesozyklonen: bestehender Direktpfad ist aktuell und bleibt unverändert.
8. WIS2: wachsender offizieller Austausch bestätigt die Normalizer-Architektur.
9. BAFU/LINDAS: neue P1-Erweiterung für die Schweizer Wasseransicht; eigener Einheiten-/Gefahrenstufenvertrag vor produktiver Integration erforderlich.
