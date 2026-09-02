# MID Implementation v0.9.77.27

Datum: 2026-09-02

## Anlass

Der saisonale Langfristbereich sollte nicht nur vorhandene Quellen darstellen, sondern **sämtliche realistisch nutzbaren numerischen Saisonmodelle** zu einem transparenten Poor-Man’s-Ensemble vereinigen. Gleichzeitig musste verhindert werden, dass dieselbe physikalische Modelllinie über C3S, NOAA NMME und Open-Meteo mehrfach gewichtet wird. Der bisherige NOAA-NMME-Pfad war außerdem unnötig schwergewichtig, weil pro Ortsabruf vollständige NetCDF-Felder geladen wurden.

## Quellenprüfung

Die vollständige Prüfung ist in `MID_SEASONAL_LONG_RANGE_SOURCE_AUDIT_0.9.77.27.md` dokumentiert.

Für die gemeinsame monatliche Saisonachse sind produktiv bzw. über den bestehenden sicheren MID-Adapter nutzbar:

- C3S Seasonal Multi-System mit 10 aktuell operationellen Systemen,
- NOAA CPC NMME mit dynamischer Übernahme aller im jeweils neuesten ENSMEAN-Lauf tatsächlich vorhandenen Systeme,
- Open-Meteo Seasonal als öffentlicher ECMWF-SEAS5-Fallback.

Bei vollständig aktivem C3S plus aktuellem NMME ergibt sich derzeit ein maximaler Pool von **13 unabhängigen Modelllinien**. GFDL SPEAR bleibt als dynamisch erkannte NMME-Identität vorbereitet und wird nur aufgenommen, wenn es in einem aktuellen ENSMEAN-Lauf tatsächlich wieder vorhanden ist.

WMO LC-LRFMME, APCC und ECCC CanSIPS wurden ebenfalls geprüft. Sie werden nicht blind als zusätzliche Stimmen eingemischt: WMO/DWD-EPISODES arbeiten auf einer abweichenden 3-Monats-/Saisonachse, APCC-Einzelmodelle haben ein Authentifizierungsgate und APCC-/WMO-MME-Produkte wären bereits aggregierte Multi-Modell-Produkte. CanSIPS besteht aus ECCC-Modellen, die über C3S/NMME bereits vertreten sind.

## Umsetzung

### Kanonische Modellidentität

`SeasonalPointModel` besitzt jetzt:

- `modelKey`: konkrete Modell-/Systemidentität,
- `independenceKey`: Poor-Man-Stimme,
- `sourcePriority`: Auswahlpriorität bei derselben Modelllinie aus mehreren Quellen.

Die Reihenfolge lautet C3S > NOAA NMME > direkte Fallbacks. Entscheidend bleibt aber `independenceKey`: dieselbe Modelllinie erhält unabhängig vom Anbieter höchstens eine Stimme.

Explizit zusammengeführt werden unter anderem:

- NCEP CFSv2 aus C3S/NMME/Fallback,
- ECCC GEM5.2-NEMO aus C3S/NMME,
- die eng gekoppelte ECCC-CanESM5-Linie,
- ECMWF SEAS5 aus C3S/Open-Meteo.

NCAR CESM1 und NCAR CCSM4 bleiben dagegen zwei getrennte Modellsysteme und werden nicht mehr unter einer generischen `NCAR`-Familie zusammengezogen.

### C3S

Der Katalog ist auf die seit April 2026 operationellen Systeme aktualisiert. ECCC System 4 und 5 sind zwei getrennte Einträge:

- CanESM5.1p1bc / System 4,
- GEM5.2-NEMO / System 5.

Der Met-Office-Eintrag verwendet GloSea6-GC5.1 / System 610, JMA CPS4 / System 4.

### NOAA NMME

Der Worker behält die dynamische Modellfindung aus dem neuesten ENSMEAN-Verzeichnis. Keine statische Whitelist beschränkt zukünftige aktuelle Systeme.

Die Punktentnahme wurde von vollständigen NetCDF-Downloads auf Sparse-I/O umgestellt:

1. kleiner Header-Range,
2. NetCDF-Classic-Header dekodieren,
3. nächstgelegenen Rasterpunkt und exakte Scalar-Offsets bestimmen,
4. benötigte Monatswerte in einem HTTP-Multi-Range je Datei laden,
5. bei fehlender Range-Unterstützung oder Parserproblem auf den bisherigen Volldownload zurückfallen.

Die parallelen Modellabrufe sind auf drei Modelle gleichzeitig begrenzt. Dadurch sinkt die gleichzeitige Originlast deutlich.

### Poor-Man’s-Ensemble und UI

- Eine Stimme je `independenceKey`, unabhängig von Memberzahl oder Datenanbieter.
- Mittelwert = arithmetisches Mittel der verfügbaren Modellmittel.
- P10/P25/P75/P90 = Streuung der unabhängigen Modellmittel.
- Keine Nullauffüllung für fehlende Modelle/Monate.
- Bei genau einem Modell bleibt dessen echte Rauchfahne sichtbar.
- Ab zwei Modellen erscheint zusätzlich der gemeinsame Einzelmodellvergleich.
- Das Diagramm unterstützt mehr als zwölf Modellsysteme durch Kombination aus Modellfarben und Linienmustern.
- Reine Katalog-/Gateway-/„weitere Modelle“-Kästchen bleiben aus der Hauptansicht entfernt.

## Cross-Platform / iOS

Die Änderung liegt vollständig im gemeinsamen React/Vite-/Worker-Fachkern. Es gibt keinen iOS-Fork. Browser/PWA und iOS verwenden dieselbe Saisonmodelllogik und dieselbe responsive Darstellung.

Der formale iOS-Meilenstein `macOS/Xcode-Simulator-QA` wird dadurch nicht vorgezogen oder umgangen.

## Kosten-/Ressourcenvertrag

- Keine neue Cloudflare-Ressource.
- Keine neue KV-Bindung.
- Keine kostenpflichtige API.
- NOAA NMME bleibt öffentlich und kostenneutral.
- C3S bleibt hinter dem vorhandenen sicheren optionalen Adapter; CDS-Zugangsdaten werden nicht in den Client eingebaut.

## Worker

**Funktionale Workeränderung.** Der Worker enthält den aktualisierten 10-System-C3S-Vertrag sowie die sparse NOAA-NMME-Multi-Range-Punktentnahme. Ein Worker-Upload ist für v0.9.77.27 erforderlich.
