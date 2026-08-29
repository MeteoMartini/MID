# MID RUC-Appweit- und Rapid-Source-Audit – v0.9.71.1

Stand: 29.08.2026

## Ergebnis

DWD ICON-D2-RUC und RUC-EPS bleiben **keine eigene UI-Prognose**, sondern kalibrieren die kanonische MID-Ortsprognose innerhalb des RUC-Gebiets und im fachlich begrenzten 0–14-h-Horizont. Der Best-Match-Anker bleibt kohärente Ausgangsbasis; RUC, reguläres ICON-D2 und weitere DWD-ICON-Varianten erhalten über `independenceGroup: dwd-icon` kein mehrfaches Familienbudget.

Der kanonische App-Pfad ist:

`Best Match / Mehrmodell-Fusion → DWD ICON-D2-RUC/RUC-EPS → Wetterzwilling → Radar/Nowcast + Beobachtung → displayHours → displayMinutes15 / displayDays / Hazards / Fachansichten`

## Geprüfte Verbraucher

- **Current / Kurzfrist / 7 Tage / Tagesansicht:** verwenden `displayHours`, `displayMinutes15` und aus finalen Stunden reconciliierte `displayDays`.
- **Wetterzwilling:** erhält bereits die RUC-kalibrierten Fusionsstunden als Eingangsreihe; es gibt keinen separaten RUC-Lernpfad.
- **Events / Aktivitäten:** verwenden dieselbe Fusions-, Wetterzwilling-, Finalisierungs- und Hyperlokal-Endstufe; nur wenn bereits ein kanonischer App-Kontext vorhanden ist, wird exakt dieser wiederverwendet.
- **Warnindikatoren:** werden aus `displayHours` abgeleitet. Die UI-Quellenbezeichnung wurde von „Best Match“ auf „kanonische MID-Ortsprognose“ präzisiert.
- **Wasserwetter:** meteorologische Ortswerte stammen aus den kanonischen Stunden; Wellen, Tide, Wasserstand und marine Spezialparameter bleiben bewusst getrennte Marine-Daten. Veraltete „ortsbezogener Best Match“-Beschriftungen wurden korrigiert.
- **Native Widgets / WidgetKit:** Current und Astronomie bleiben die Open-Meteo-Hülle; stündliche und tägliche Forecastwerte werden bei verfügbarer Fusion aus der kanonischen MID-Ortsprognose übernommen. Der öffentliche Vertrag bleibt `mid.native.widget.v1`.
- **Prognoseänderungs-Push:** verwendet nicht mehr einen eigenen `models=best_match`-Abruf, sondern `forecast-fusion`.
- **Lüftungsassistent / Lüftungs-Push:** verwendet nicht mehr einen eigenen Open-Meteo-Ortsforecast. Temperatur, Feuchte, Niederschlag, Wettercode und Böen stammen aus `forecast-fusion`; die dort in kt geführten Böen werden für die Lüftungslogik explizit in km/h umgerechnet.

## Bewusst eigenständige Spezialpfade

Folgende Pfade sind **keine** konkurrierende Ortsprognose und werden deshalb nicht blind mit bodennahem RUC überschrieben:

- **Flugmeteorologie:** Druckniveaus, vertikale Profile, Cross-Sections und ICAO-/TAF-/METAR-Kontext. Ein bodennaher RUC-Punktwert darf keine Druckniveauschicht ersetzen. Die normale Oberflächen-/Eventumgebung bleibt kanonisch.
- **Bergwetter:** höhenkorrigierte Mehrpunkt-/Druckniveau-Prognosen und Schneefallgrenzen. Der Fachpfad benötigt echte Höheninformation; bodennaher RUC darf nicht pauschal hochgerechnet werden.
- **Radar-/Niederschlagsphasen-Nowcast:** vertikale Modellprofile dienen als Klassifikations-/Nowcast-Hilfsdaten und werden nachgelagert in die gemeinsame Endstufe eingebunden.
- **Extremwetter-Ausblick Mitteleuropa:** räumliche Gefahrenfelder, Polygone und Raster benötigen flächenhafte Felddaten. Ein Punkt-RUC-Adapter darf daraus keine künstliche Fläche erzeugen. Grenzen, Straßen/Kartenkontext und Städtenamen bleiben oberhalb mehrerer Gefahrenlayer geschützt.
- **Marine, Tide und Wasserstand:** physikalisch eigene Datenquellen; die atmosphärischen Begleitwerte stammen weiterhin aus dem kanonischen Ortsforecast.
- **Retrospektive Best-Match-Kontrollreihe:** bleibt absichtlich unverändert, weil sie die Kontrollgruppe für Wetterzwilling-/Skill-Vergleiche bildet.
- **15-Minuten-Niederschlags-Push:** native 15-Minuten-Reihe bleibt als zeitlich höher aufgelöster Seed erhalten und wird mit DWD-Radar priorisiert. Die sichtbare App-Reihe `displayMinutes15` wird dagegen wie bisher aus der RUC-/Twin-korrigierten Stundenreihe finalisiert. Eine künstliche Interpolation von RUC-Feldern auf 15-Minuten-Rohwerte wird vermieden.

## KNMI HARMONIE-AROME

Der Audit bestätigt KNMI HARMONIE-AROME Europe/NL als echte Rapid-Update-Quelle:

- Europe ca. 5,5 km, NL ca. 2 km,
- regulär stündlich aktualisiert,
- Forecast etwa 2,5 Tage,
- UWC-West / HARMONIE-AROME Cy43,
- KNMI Data Platform: Open Data, GRIB, CC-BY-4.0; Open Data API / Notification Service,
- direkte KNMI-Datei-API benötigt API-Key/Quota- und GRIB-Dateihandling.

MID bindet KNMI deshalb weiterhin über die bereits vorhandene kostenfreie Open-Meteo-Modellanbindung ein. Ein zweiter direkter KNMI-GRIB-Pipelineweg würde aktuell Infrastruktur und Wartung duplizieren, ohne einen belegten Qualitätsgewinn für die Punktprognose zu liefern. Er wird **nicht** aktiviert.

KNMI HARMONIE Europe/NL und DMI HARMONIE bleiben als Anbieter/Modelle sichtbar, teilen im Forecast-Konsens aber nun das konservative Unabhängigkeitsbudget `uwc-west-harmonie`, weil beide derselben UWC-West/HARMONIE-AROME-Architekturfamilie entstammen. DMI aktualisiert im vorhandenen Datenpfad alle drei Stunden und ist deshalb kein gleichrangiger stündlicher Rapid-Update-Ersatz für KNMI.

## Weitere kostenfreie Rapid-/Regionalquellen

Bereits im Modellkatalog vorhanden und regional begrenzt: MET Nordic (stündlich), UKV (stündlich), Météo-France AROME, GeoSphere AROME, MeteoSwiss ICON-CH, CHMI ALADIN sowie weitere regionale Modelle. Es wird **keine zusätzliche Direktpipeline** nur um der Quellenanzahl willen eröffnet. Neue Quellen müssen einen eigenständigen fachlichen Mehrwert, dauerhaft kostenlose Nutzung und vertretbare Betriebs-/Integrationskosten belegen.

## DWD-RUC-Kostenpfad

Verbindlich bleibt:

`DWD Open Data → GitHub Actions/ecCodes → GitHub Pages → Worker → MID`

R2 bleibt optional, deaktiviert und kosten-gated. Keine kostenpflichtige Infrastruktur wurde aktiviert.

## Regressionsschutz

Die bestehenden Regressionen wurden erweitert, ohne einen zusätzlichen Scheintest anzulegen:

- Forecast-Fusion schützt DWD-Familienbudget und gemeinsame UWC-West-HARMONIE-Unabhängigkeitsgruppe.
- Lüftungsregression verhindert einen Rückfall auf einen direkten Open-Meteo-Schattenpfad und prüft die funktionale Worker-Ausführung.
- Widgetregression schützt die Kopplung des nativen Feeds an `forecast-fusion`.
- Worker-Niederschlagsvertrag schützt den kanonischen Prognoseänderungs-Push.
- bestehende Mitteleuropa-/Kartenkontext- sowie Tagesansichtsregressionen bleiben unverändert verbindlich.
