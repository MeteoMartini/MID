# MID v0.9.84.76 – Design- und Quellen-Audit 2

## Extern

- Weitere mobile Mikrotexte wurden vereinheitlicht: Event-, Gewitter-, Klima-, Radar-, Flugmet-, Warn-, Einstellungs- und Navigationsinformationen bleiben auch auf sehr schmalen Displays lesbar.
- Lange Eventtitel werden im kompakten Event-Center nicht mehr mit Ellipse abgeschnitten, sondern vollständig umgebrochen.
- PEGELONLINE zeigt bei Stationen mit `WV` nun den tatsächlichen nächsten amtlichen Vorhersage-/Abschätzungswert und nicht nur die bloße Verfügbarkeit einer Vorhersagereihe.
- Amtliche Beobachtungsadapter werden bei veralteten oder zeitlich unplausiblen Daten nicht mehr höher priorisiert als frischere Fallbacks.
- UBA-Luftdaten behalten die Trennung zwischen aktueller Messung und Modellprognose und führen die amtliche Quellenattribution explizit mit.

## Design-Audit

Die repräsentativen Hochrisikokomponenten wurden mit dem tatsächlich generierten MID-CSS in Chromium simuliert: 320×568, 375×812, 390×844, 430×932, 768×1024, 1024×768, 1366×768 und 1920×1080.

Geprüft wurden insbesondere untere Schnellnavigation, Event-Center, Astronomie/Finsternis, Flugmet, Radar-Nowcast, Warnkarten, Ensemble-Tooltip, Klima-Legenden und kompakte Gewitter-Ortsdetails. In der Matrix entstanden kein dokumentweiter horizontaler Überlauf und kein abgeschnittener nicht umbrechender Audittext. Die geprüften sichtbaren Informations-/Bedientexte lagen bei mindestens 11 px; echte Diagramm-/Kartenachsen bleiben davon bewusst ausgenommen.

## Quellen-Audit

- WSV PEGELONLINE REST v2: Stationsauswahl bleibt UUID-basiert. Für `WV` wird zusätzlich `stations/{uuid}/WV/measurements.json` gelesen; Forecast/Estimate, Initialisierungszeit und verfügbare Perzentile bleiben getrennt.
- Amtliche Punktadapter: MeteoSwiss/KNMI 10-min erhalten 90-min-Freshness, Météo-France 120 min, WIS2 180 min; Beobachtungen >20 min in der Zukunft werden ebenfalls verworfen.
- UBA v4: Messpfad wird mit Zeitbasis MEZ, maximal 180 min Alter und der Quellenangabe „Umweltbundesamt mit Daten der Messnetze der Länder und des Bundes“ abgesichert.
- KNMI: ausschließlich `10-minute-in-situ-meteorological-observations`; die stillgelegten Quellen bleiben als Negativvertrag gesperrt. Da EDR einen API-Key verlangt, bleibt der serverseitige Adaptervertrag fachlich sinnvoll.
- MeteoSwiss: `ch.meteoschweiz.ogd-smn` bleibt der kanonische SwissMetNet-STAC-Vertrag. Das öffentliche STAC führt 158 automatische Stationen mit 10-Minuten-Werten.
- ECMWF 50r1: `scda`, `scwv` und `enfo/type=cf` bleiben in ausführbarem Code verboten. AIFS v2 wird für Wellen und Schneebedeckung beobachtet; Schneehöhe wird nicht fälschlich als neues AIFS-v2-Open-Data-Produkt vorausgesetzt.
- DWD: vorhandene direkte KONRAD3D-/Mesozyklonenpfade bleiben bestehen; kein redundanter Aggregator wird davor gesetzt.
- WIS2: Architektur bleibt externer Ingest/Normalizer → `mid-official-observation-v1`; kein BUFR-Decoder im Request-Worker.
- Neuer P1-Folgepunkt: BAFU-Hydrologie/LINDAS für die Schweiz. Der amtliche 10-Minuten-Pfad für Abfluss, Wasserstand, Temperatur und Gefahrenstufen wird als eigener Wasserquellenvertrag vorbereitet, aber noch nicht in den deutschen PEGELONLINE-cm-Vertrag gepresst.

## Worker

Worker-Fachlogik ist geändert (PEGELONLINE-WV, Freshness-Guard, UBA-Härtung). Worker-Deployment ist erforderlich.
