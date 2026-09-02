# MID v0.9.77.19 – KNMI EPS Worker-Anbindung, Current-Temperaturbrücke und Installer-Hotfix

## Anlass

Dieser Stand setzt den zweiten der vier verbleibenden Hauptabschnitte um: **Worker-Anbindung**. Gleichzeitig werden zwei vom Nutzer unmittelbar beobachtete Regressionen beseitigt: eine sichtbare Temperaturkerbe im 24-h-Wetterprofil/Tagesdetail und der fehlgeschlagene GitHub-Installer-Run #828.

## 1. KNMI HARMONIE EPS – produktive Worker-Anbindung

Der seit v0.9.77.18 geschützte TAR-Indexcache wird jetzt vom kanonischen Ensemble-Proxy tatsächlich konsumiert. Es entsteht ausdrücklich **kein zweiter Listing-, Index- oder Downloadpfad**.

Verbindlicher Ablauf:

- KNMI Open Data Dataset `harmonie_arome_cy43_p4a`, Version `1.0`;
- fünf Minuten Isolate-Cache für das Dateilisting, um unnötiges Polling zu vermeiden;
- sechs stündlich lückenlose Archive bilden das rollierende Vollensemble;
- je Startzeit fünf Member: 1–5, 6–10 … 26–30;
- zeitabhängige Membernummern existieren nur im Laufzeitmanifest und werden nie im TAR-Index persistiert;
- ältere Startzeiten werden über `validLead = lokaler Lead − Alter` auf die neueste Initialisierung ausgerichtet;
- gemeinsamer Vollensemble-Horizont maximal 0–54 h;
- TAR-Struktur kommt ausschließlich aus `cache:knmi-eps:tar-index:v1:`;
- Header-Ranges müssen HTTP 206 liefern; ein HTTP-200-Vollarchivfallback ist unzulässig;
- benötigte Sparse-Bytebereiche werden im bestehenden max-16-Multi-Range-Vertrag beschrieben;
- kurzlebige KNMI-Signed-URLs werden nicht persistiert.

### Decodergrenze

Der langjährige MID-Vertrag bleibt bestehen: **Der Cloudflare Worker dekodiert kein GRIB/eccodes/wgrib.** Der konfigurierte HTTPS-Punktdecoder erhält stattdessen per POST das Schema `mid.knmi.harmonie-eps.point-decode-request.v1` mit den sechs Archiven, exakten Bytebereichen, 30-Member-Zuordnung und gültigen Leads. Der Decoder darf weder KNMI-Listing noch TAR-Index nochmals selbst aufbauen.

Konfiguration:

- `MID_KNMI_API_KEY`
- `MID_KNMI_HARMONIE_EPS_POINT_ENDPOINT`
- optional `MID_KNMI_HARMONIE_EPS_POINT_TOKEN`
- vorhandenes `MID_PUSH_SUBSCRIPTIONS` für den getrennten TAR-Indexcache

Es wird keine neue Cloudflare-Ressource und kein neuer GitHub-Workflow angelegt. Fehlt die produktive Decoderkonfiguration oder sind sechs stündliche Archive nicht vollständig vorhanden, bleibt die Quelle fail-open und blockiert die übrigen Ensemblequellen nicht.

Verbindlicher Vertrag: `MID_KNMI_HARMONIE_EPS_WORKER_CONTRACT.md`.

## 2. Temperaturkerbe im 24-h-Wetterprofil und Tagesdetail

Die Ursache lag nicht in den beiden Diagrammen selbst, sondern in der gemeinsamen Forecast-Finalisierung. Ein `current.temperature_2m` zwischen zwei Stunden wurde bisher auf genau einen nächstgelegenen Stundenpunkt geschrieben. Bei einer Beobachtung z. B. um 09:35 konnte dadurch nur die 10-Uhr-Stunde versetzt werden – sichtbar als lokale Delle in allen Ansichten, die den kanonischen `displayHours`-Pfad verwenden.

Die Korrektur erfolgt deshalb zentral in `src/forecastFusion.ts`:

1. standortlokalen echten Beobachtungszeitpunkt bestimmen;
2. Modelltemperatur zwischen den beiden umschließenden Stunden linear auf diesen Zeitpunkt interpolieren;
3. Differenz zwischen Beobachtung und interpoliertem Modellwert berechnen;
4. beide Brückenstunden erhalten dieselbe volle Korrektur, sodass die Kurve am Beobachtungszeitpunkt exakt durch den Current-Wert läuft;
5. davor über 120 Minuten und danach über 180 Minuten mit einer glatten S-Kurve in den unveränderten Modellverlauf überblenden;
6. `apparent` erhält denselben thermischen Versatz.

`App.tsx` und `eventWeatherEngine.ts` verwenden für `current.time` nun `localIsoEpoch(..., timezone, utc_offset_seconds)` statt einer gerätelokalen `Date.parse`-Interpretation. Damit bleibt die Assimilation auch bei einem Favoriten/Reiseziel in einer anderen Zeitzone korrekt.

Die Änderung wirkt automatisch auf 24-h-Profil, Tagesansicht und weitere kanonische Stundenansichten; es gibt keinen UI-Sonderpatch.

## 3. GitHub Installer #828

Run #828 scheiterte nach erfolgreichem `npm ci`, TypeScript und Vite ausschließlich an `scripts/test-maintenance-modularization-09560.mjs`.

`scripts/build-maintenance-aggregates.mjs` nahm `worker-src/05-knmi-eps-cache.js` bereits korrekt in `worker/metar-proxy.js` und `worker.js` auf. Die Regression verglich das Aggregat jedoch noch mit der alten Modulliste ohne dieses Fragment. Der Test wurde auf die kanonische Worker-Modulliste einschließlich `05-knmi-eps-cache.js` synchronisiert. Produktionslogik des Aggregators wurde dafür nicht abgeschwächt.

## Regressionen

Neu:

- `scripts/test-current-temperature-smooth-bridge-097719.mjs`
- `scripts/test-knmi-eps-worker-binding-097719.mjs`

Weiterhin explizit geschützt:

- `scripts/test-knmi-eps-productive-cache-097718.mjs`
- `scripts/test-maintenance-modularization-09560.mjs`
- `scripts/test-official-observation-ensemble-09470.mjs`
- `scripts/test-ruc-dwd-pipeline-09690.mjs`

## Worker / Infrastruktur

Der Worker wurde fachlich geändert. **Worker-Deploy ist erforderlich.**

Keine neue Binding-, KV-, R2- oder kostenpflichtige Infrastruktur wird erzeugt. Der bestehende gestagte 0-% → Smoke → 100-% Auto-Deploy bleibt der kanonische Deploymentpfad.
