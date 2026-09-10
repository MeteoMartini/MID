# MID Implementation 0.9.84.29 – Reise-Center und horizontabhängige Reisewetter-Fusion

## Nutzerfunktion

Der Reiseplaner besitzt nun ein eigenes Reise-Center. Reisen können dauerhaft festgepinnt werden. Die Übersicht zeigt Ziel, Zeitraum und Präferenz sowie die schon zuvor im Reiseplaner angebotenen Kernparameter Temperatur, Niederschlag/Regentage, Sonnenschein, Wind, Schnee/Schneehöhe und – sofern verfügbar – Wassertemperatur. Über `Details` wird die vollständige bisherige Auswertung geöffnet; `Bearbeiten` übernimmt die gespeicherte Reise zurück in die Planung.

## Datenlogik

- Tag 1–14: vorhandener MID-Forecast plus Ensemblekern; unabhängige Modellfamilien statt Member-Zählung.
- Tag 15–46: ECMWF-EC46-Wochenanomalien werden gedämpft auf die lokale ERA5-Seamless-Klimareferenz übertragen. NOAA GEFS dient, solange verfügbar, zur unabhängigen Bestätigung/Relativierung des Temperatur- und Niederschlagssignals.
- Ab Tag 47: numerisch verfügbare saisonale Multi-Modell-Anomalien werden nur schwach auf die Klimatologie übertragen. Die bereits in MID deduplizierten Modellfamilien bleiben maßgeblich. DWD GCFS2.2/EPISODES kann mit vorhandener Güteinformation als regionaler Qualitätsanker einfließen.
- Nicht verfügbare Parameter bleiben klimatologisch. Mit wachsendem Vorlauf steigt der Anteil der Klimatologie bewusst an.
- Küsten-Wassertemperatur bleibt NOAA OISST v2.1, Normperiode 1991–2020.

## Transparenz

Die Detailansicht weist Quellenmodus, modellgestützte Reisetage, mittleren Modellanteil, unabhängige Modellfamilien sowie jede geprüfte Quelle als `verwendet`, `nicht verfügbar` oder `außerhalb des Horizonts` aus. Damit ist erkennbar, wenn die Reisebewertung nicht nur aus Klimatologie besteht.

## Persistenz und UI

Gespeicherte Reisen liegen unter einem eigenen dauerhaften Schlüssel und verändern weder Ortsfavoriten noch Event-Center-Einträge. Die Übersicht ist für iPhone-Hochformat responsiv verdichtet; Detailparameter bleiben vollständig erhalten.

## Worker

Keine fachliche Workeränderung. Die Release-Version wird wie üblich synchron gehalten; ein separater Worker-Upload ist für diese Funktion nicht erforderlich.
