# MID v0.9.41.0 – C3S / DWD GCFS2.2 / UI-Dichte

## Datenpfade

### C3S / CDS

MID führt die neun aktuell vorgesehenen C3S-Zentren weiterhin im Langfrist-Modellkatalog. Der neue Worker-Endpunkt `mode=c3s-seasonal-point` delegiert ausschließlich an einen fest konfigurierten HTTPS-Decoder. Credentials verbleiben serverseitig.

- `MID_C3S_SEASONAL_POINT_ENDPOINT`
- optional `MID_C3S_SEASONAL_POINT_TOKEN`
- primärer Memberpfad: `seasonal-monthly-single-levels`
- ergänzender Anomaliepfad: `seasonal-postprocessed-single-levels`
- Variablen: 2-m-Temperatur und Gesamtniederschlag
- Auswahl: nächstgelegener Modellgitterpunkt
- Ausgabe: normalisierte Monatswerte, Ensemblemember/Quantile und Modellmetadaten

Ist kein Decoder konfiguriert, meldet MID den Pfad als `unconfigured`; es werden weder Mockwerte noch aus Kartenfarben rekonstruierte Werte erzeugt.

### DWD GCFS2.2 / EPISODES

Der Worker-Endpunkt `mode=dwd-gcfs-episodes-point` ist auf die Deutschlandperspektive begrenzt und erwartet einen numerischen Decoder für die saisonale QA-Auswertung:

- `MID_DWD_GCFS_EPISODES_POINT_ENDPOINT`
- optional `MID_DWD_GCFS_EPISODES_POINT_TOKEN`
- Experiment: `seasonal qa`
- Driving Model: `GCFS22` / Modellversion GCFS2.2
- Downscaling: EPISODES
- Domain: `DE-015x01`, 0,15° × 0,1°, etwa 10 km
- Zeiträume: Monate 1–3, 2–4, 3–5, 4–6
- Anomalien: `tasAnom`, `prAnom`
- Referenz: 1991–2020
- Qualitätsdaten: `mse`, `corr_pea`; zusätzlich MSESS/RPSS, falls der Adapter die DWD-Skill-Auswertung numerisch bereitstellt

Die UI führt diese Perspektive getrennt von den monatlichen C3S-Rauchfahnen. Alte GCFS2.1-Karten werden nicht als GCFS2.2-Werte behandelt.

## UI / Rendering

- Globale Informationsdichte `Auto / Kompakt / Komfortabel` mit persistenter Einstellung.
- Gemeinsame Touchflächen-, Abstands- und Radiusvariablen.
- Popover: Outside-Tap, Escape, Swipe-down.
- Dynamische Legenden und Progressive Disclosure.
- Section-local Sticky Controls in Langfrist, Ensemble und Wetterkarten.
- Vorhandenes `ViewportGate` bleibt der zentrale Sichtbarkeitsmechanismus; Berg-/Wintersport wurde ergänzt.
- Cockpit bewahrt Scrollposition pro Kurzfrist-/7-/14-Tage-Horizont.
- Langfrist bewahrt ausgewähltes Modell und horizontale Modellstreifenposition pro Standort.

## Deployment

Der Worker ist funktional geändert und muss für v0.9.41.0 neu ausgerollt werden. Ohne die beiden optionalen Decoder-Endpunkte bleibt MID vollständig lauffähig; C3S verwendet die bestehende numerische Baseline und zeigt weitere Zentren als Katalog, DWD GCFS2.2/EPISODES als vorbereiteten, aber nicht numerisch aktiven Pfad.
