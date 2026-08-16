# MID – Einrichtung regionaler Ensemble-Punktadapter

## Zweck

MID kennt `knmi_harmonie_arome_cy43_eps` und `eccc_reps` bereits als hochwertige regionale Ensemblefamilien. Beide Quellen liegen upstream primär als gerasterte GRIB-Dateien vor. Der Cloudflare-Worker soll diese großen Raster nicht bei jeder Nutzeranfrage selbst dekodieren. Deshalb erwartet MID einen kleinen **Punktadapter**, der für `lat/lon` eine kompakte stündliche JSON-Zeitreihe liefert.

## Vom MID-Worker erwarteter Request

Der Worker ruft den konfigurierten Adapter per GET auf und ergänzt:

- `lat=<Breitengrad>`
- `lon=<Längengrad>`
- `forecast_days=<Tage>`
- `variables=<kommagetrennte Variablen>`
- `model=knmi_harmonie_arome_cy43_eps` bzw. `model=eccc_reps`

Optional sendet er `Authorization: Bearer <TOKEN>`.

## Erwartetes Response-Schema

Der Adapter antwortet mit HTTP 200 und JSON im Open-Meteo-ähnlichen Hourly-Schema. `hourly.time` muss mindestens 12 Zeitpunkte enthalten. Für echte Ensembleauswertung sollen mindestens drei konsistent benannte Mitglieder vorhanden sein; fachlich sinnvoll sind alle verfügbaren Mitglieder.

```json
{
  "latitude": 50.8,
  "longitude": 7.1,
  "timezone": "Europe/Berlin",
  "hourly": {
    "time": ["2026-08-15T00:00", "2026-08-15T01:00"],
    "temperature_2m_member01": [18.2, 18.0],
    "temperature_2m_member02": [18.4, 18.1],
    "precipitation_member01": [0.0, 0.2],
    "precipitation_member02": [0.0, 0.0],
    "wind_speed_10m_member01": [5.0, 5.5],
    "wind_gusts_10m_member01": [9.0, 10.0],
    "sunshine_duration_member01": [0, 0]
  }
}
```

Die Member-Suffixe müssen je Variable übereinstimmen (`_member01`, `_member02`, ...). Temperatur ist Pflicht für die Mitgliedererkennung; Niederschlag, Wind und Böen sollten für den vollen MID-Nutzen ebenfalls geliefert werden. `sunshine_duration` ist optional.

## Cloudflare-Variablen

### KNMI

```text
MID_KNMI_HARMONIE_EPS_POINT_ENDPOINT=https://<eigener-adapter>/knmi-harmonie-eps
MID_KNMI_HARMONIE_EPS_POINT_TOKEN=<optional-eigenes-adapter-token>
```

Der KNMI-API-Key gehört **in den Adapter**, nicht in das Frontend. Empfehlter Secret-Name dort: `KNMI_OPEN_DATA_API_KEY`.

### ECCC

```text
MID_ECCC_REPS_POINT_ENDPOINT=https://<eigener-adapter>/eccc-reps
MID_ECCC_REPS_POINT_TOKEN=<optional-eigenes-adapter-token>
```

Für den ECCC-Datamart ist upstream normalerweise kein persönlicher API-Key erforderlich. Ein eigenes Adapter-Token ist dennoch sinnvoll, damit der Punktadapter nicht öffentlich missbraucht wird.

## Empfohlene Adapterarchitektur

1. Neueste Modellläufe serverseitig erkennen und Dateien nur einmal pro Lauf herunterladen/cachen.
2. GRIB2 mit `eccodes`/`cfgrib`, `wgrib2` oder GDAL dekodieren.
3. Für angefragte Koordinaten den nächstgelegenen bzw. fachlich geeigneten interpolierten Gitterpunkt bestimmen.
4. Ensemblemitglied, Prognosezeit und Parameter in das obige Hourly-Schema transformieren.
5. Ergebnis kurz cachen (z. B. pro Modelllauf + gerundetem Punkt), damit viele MID-Nutzer nicht dieselben GRIB-Dateien erneut dekodieren.
6. Quelle/Laufzeit intern protokollieren; Fehler mit HTTP 4xx/5xx und verständlichem `error`/`detail` zurückgeben.

## Attribution

In MID bzw. der Datenquellen-/Infoansicht sollte bei Nutzung stehen:

- KNMI: `Quelle: KNMI / UWC-West HARMONIE-AROME Cy43 EPS, CC BY 4.0.`
- ECCC: `Basierend auf Daten von Environment and Climate Change Canada (ECCC).`

## Betriebsprüfung

v0.9.53.36 bietet am Worker `mode=ensemble-capabilities`. Dort müssen für die beiden Modelle nach Einrichtung `configured: true` erscheinen. In der Modellstandanzeige verschwindet anschließend `Adapter fehlt`; bei erfolgreichem numerischem Abruf erscheint die Quelle als `Aktiv` oder – falls eine bevorzugte Variante scheiterte – `Fallback`.

## Kosten-Governance ab v0.9.53.37

Der hier beschriebene GRIB-Punktadapter bleibt optional. Die Datenquellen selbst können kostenfrei/Open-Data sein, für einen dauerhaft erreichbaren externen Containerhost können jedoch Hostingkosten anfallen. Nach `MID_COST_GOVERNANCE_CONTRACT.md` darf deshalb kein VPS/Container-Tarif oder anderes kostenpflichtiges Hosting ohne vorherige transparente Kostenangabe und ausdrückliche Nutzerfreigabe beschafft oder aktiviert werden. Solange kein bereits vorhandener kostenfreier Host zur Verfügung steht, bleibt der Adapter unkonfiguriert; die success-driven Ensemblelogik rückt automatisch mit den vorhandenen kostenlosen Modellfamilien nach.
