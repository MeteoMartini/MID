# MID – Einrichtung regionaler Ensemble-Punktadapter

## Zweck

MID kennt `knmi_harmonie_arome_cy43_eps` und `eccc_reps` bereits als hochwertige regionale Ensemblefamilien. Beide Quellen liegen upstream primär als gerasterte GRIB-Dateien vor. Der Cloudflare-Worker soll diese großen Raster nicht bei jeder Nutzeranfrage selbst dekodieren. Deshalb erwartet MID einen kleinen **Punktadapter**, der für `lat/lon` eine kompakte stündliche JSON-Zeitreihe liefert.

## Vom MID-Worker erwarteter Request

### KNMI HARMONIE-AROME Cy43 P4a – produktiver Rolling-Manifest-Pfad

Ab v0.9.77.19 orchestriert der MID-Worker die KNMI-Quelle selbst, sobald **beide** Worker-Secrets/Variablen `MID_KNMI_API_KEY` und `MID_KNMI_HARMONIE_EPS_POINT_ENDPOINT` vorhanden sind. Der Decoder bekommt dann **POST** mit `Content-Type: application/json` und Schema `mid.knmi.harmonie-eps.point-decode-request.v1`.

Der Request enthält `latitude`, `longitude`, `forecastHours`, `variables` und ein `manifest` mit:

- sechs lückenlosen stündlichen P4a-Archiven,
- dynamischer Zuordnung 1–5, 6–10, …, 26–30,
- auf den neuesten Lauf ausgerichteten `validLeadHours` 0–54 h,
- kurzlebigen KNMI-Download-URLs,
- den aus dem persistenten MID-TAR-Index stammenden exakten Bytepositionen,
- vorgepackten HTTP-Multi-Range-Gruppen mit höchstens 16 Teilen.

Der Decoder **darf keinen zweiten KNMI-Listing-/TAR-Indexpfad aufbauen**. Er lädt ausschließlich die im Manifest bezeichneten Byte-Ranges, dekodiert die GRIB-Nachrichten außerhalb von Cloudflare und gibt die numerische Punktzeitreihe zurück. Temporäre Download-URLs dürfen weder persistiert noch protokolliert werden.

Fehlt `MID_KNMI_API_KEY`, bleibt der historische GET-Punktadapter als Kompatibilitätsweg möglich. Er gilt nicht als produktiver Cachepfad und darf eine nicht konfigurierte Quelle nicht blockieren.

### ECCC REPS / Legacy-Punktadapter

Für ECCC und den Kompatibilitätsweg ruft der Worker den konfigurierten Adapter per GET auf und ergänzt `lat`, `lon`, `forecast_days`, `variables` und `model`. Optional sendet er `Authorization: Bearer <TOKEN>`.

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

Der KNMI-API-Key gehört **ausschließlich in den MID-Worker**, nicht in Frontend oder Decoder. Kanonischer Secret-Name ist `MID_KNMI_API_KEY` (alternativ unterstützt der Worker `KNMI_OPEN_DATA_API_KEY`). Der Decoder erhält nur kurzlebige signierte Download-URLs und Range-Manifeste.

### ECCC

```text
MID_ECCC_REPS_POINT_ENDPOINT=https://<eigener-adapter>/eccc-reps
MID_ECCC_REPS_POINT_TOKEN=<optional-eigenes-adapter-token>
```

Für den ECCC-Datamart ist upstream normalerweise kein persönlicher API-Key erforderlich. Ein eigenes Adapter-Token ist dennoch sinnvoll, damit der Punktadapter nicht öffentlich missbraucht wird.

## Empfohlene Adapterarchitektur

1. Für KNMI ausschließlich das vom MID-Worker gelieferte Rolling-Manifest verwenden; **kein eigenes Listing und kein eigener TAR-Index**.
2. Nur die angegebenen Multi-Range-Bereiche aus den kurzlebigen Download-URLs laden.
3. Quellen-native GRIB-Daten außerhalb des Cloudflare Workers dekodieren. **KNMI Cy43 P4a ist GRIB1**; ECCC kann einen abweichenden GRIB-Vertrag besitzen. Für KNMI ist `tools/knmi_eps_decoder/` der kanonische Referenzdecoder mit ecCodes.
4. Für die angefragten Koordinaten den nächstgelegenen bzw. fachlich geeigneten interpolierten Gitterpunkt bestimmen.
5. Die vom Worker vorgegebene Rolling-Membernummer und `validLeadHours` unverändert in das Hourly-Schema transformieren.
6. Numerische Punktresultate dürfen kurz nach Modelllauf + gerundetem Punkt gecacht werden; signed URLs dürfen nicht persistiert werden.
7. Quelle/Laufzeit intern protokollieren; Fehler mit HTTP 4xx/5xx und verständlichem `error`/`detail` zurückgeben.

## Referenzdecoder ab v0.9.77.22

`tools/knmi_eps_decoder/` implementiert den dritten der vier KNMI-Produktionsabschnitte als reproduzierbare, containerfähige Referenz. Er akzeptiert ausschließlich `mid.knmi.harmonie-eps.point-decode-request.v1`, baut **weder KNMI-Listing noch TAR-Index** selbst auf, verlangt HTTP 206 für alle Worker-vorgegebenen Ranges und dekodiert die P4a-GRIB1-Felder Temperatur, Regen, 10-m-Wind und Böen. Die rollierende Niederschlagsakkumulation wird je 5er-Batch am ersten gemeinsamen Gültigkeitszeitpunkt auf null gesetzt und danach in Stundenmengen differenziert. Signed URLs werden weder persistiert noch protokolliert.

Der Referenzdecoder ist in diesem Release **nicht öffentlich gehostet und nicht als Worker-Variable aktiviert**. Eine reale End-to-End-Aktivierung bleibt Abschnitt 4/4 und setzt einen bereits verfügbaren kostenfreien HTTPS-Runtimepfad oder eine ausdrückliche Kostenfreigabe voraus.

## Attribution

In MID bzw. der Datenquellen-/Infoansicht sollte bei Nutzung stehen:

- KNMI: `Quelle: KNMI / UWC-West HARMONIE-AROME Cy43 EPS, CC BY 4.0.`
- ECCC: `Basierend auf Daten von Environment and Climate Change Canada (ECCC).`

## Betriebsprüfung

v0.9.53.36 bietet am Worker `mode=ensemble-capabilities`. Dort müssen für die beiden Modelle nach Einrichtung `configured: true` erscheinen. In der Modellstandanzeige verschwindet anschließend `Adapter fehlt`; bei erfolgreichem numerischem Abruf erscheint die Quelle als `Aktiv` oder – falls eine bevorzugte Variante scheiterte – `Fallback`.

## Kosten-Governance ab v0.9.53.37

Der hier beschriebene GRIB-Punktadapter bleibt optional. Die Datenquellen selbst können kostenfrei/Open-Data sein, für einen dauerhaft erreichbaren externen Containerhost können jedoch Hostingkosten anfallen. Nach `MID_COST_GOVERNANCE_CONTRACT.md` darf deshalb kein VPS/Container-Tarif oder anderes kostenpflichtiges Hosting ohne vorherige transparente Kostenangabe und ausdrückliche Nutzerfreigabe beschafft oder aktiviert werden. Solange kein bereits vorhandener kostenfreier Host zur Verfügung steht, bleibt der Adapter unkonfiguriert; die success-driven Ensemblelogik rückt automatisch mit den vorhandenen kostenlosen Modellfamilien nach.
