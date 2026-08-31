# MID v0.9.76.35 – P0 Gewittersemantik und RUC-Mehrparameterdiagnostik

## Anlass
Die bestehende Blitz-Schutzregel war zu weit gefasst. Ursprünglich sollte sie verhindern, dass eine aktuell erkannte Radar-/KONRAD3D-Zelle ohne elektrische Aktivität bereits als beobachtetes Gewitter bezeichnet wird. In der RUC-/Forecast-Fusion war daraus jedoch eine numerische Sperre geworden: selbst ein numerischer Gewittercode konnte ohne beobachteten Blitz zu einem Schauercode zurückgestuft werden.

Ab v0.9.76.35 gilt deshalb verbindlich:

- **Beobachtung:** aktuelle Radar-/KONRAD3D-Zelle ohne Blitz = Schauer/starke Schauerzelle; mit Blitz = Gewitterzelle.
- **Prognose:** numerische Gewitterentwicklung darf unabhängig vom aktuellen Blitzstatus entstehen.
- **Ohne Rapid:** kanonische NWP-/WMO- und Mehrparameterdiagnostik bleibt vollständig gewitterfähig.
- **Mit ICON-D2-RUC Rapid:** eine ingredient-basierte Mehrparameterdiagnostik ergänzt 0–6 h; kein einzelnes Feld allein erzeugt einen synthetischen Gewittercode.

## Fachliche Umsetzung

### 1. Numerischer Blitz-Gate entfernt
`worker-src/00-core-observations.js`

- `safeRapidThunderCode(..., lightningObserved=false)` wurde entfernt.
- `rapidForecastWeatherCode()` erhält einen bestehenden numerischen Gewittercode und erlaubt auch eine direkte numerische RUC-Wetterinterpretation, sofern künftig ein belastbarer WW-Wert geliefert wird.
- RUC-EPS darf die Niederschlagswahrscheinlichkeit kalibrieren, ohne dabei einen bereits vorhandenen WMO-Gewittercode der kanonischen Prognose herabzustufen.
- Der Forecast-Fusion-Strategietext trennt nun explizit aktuelle Zellklassifikation und numerische Vorhersage.

### 2. ICON-D2-RUC Rapid als wissenschaftliche Mehrparameterdiagnostik
Neu im kanonischen `src/forecastFusion.ts`: Rapid-Gewitterdiagnostik ohne zusätzliche Laufzeitabhängigkeit

Die Rapid-Diagnose nutzt bewusst ein **Ingredient-based-Konzept** statt eines Einzelparameters:

- Instabilität: CAPE / MU-CAPE,
- Inhibition: CIN / MU-CIN,
- konvektiver Trigger: 5-min-Peakrate, 15-min-Niederschlag, modellierte `DBZ_CMAX`,
- elektrische Unterstützung: LPI / LPI_MAX,
- Organisation/Tiefenkonvektion: UH, EchoTop, maximaler Aufwind.

CAPE bzw. LPI allein können keinen synthetischen Gewittercode erzeugen. Instabilität + ein aufgelöster Trigger müssen gemeinsam tragen; LPI/UH/EchoTop/Aufwind erhöhen anschließend die Evidenz. Die verwendeten Zahlenbereiche dienen als kontinuierliche Normierung, nicht als amtliche Warnschwellen.

Ein hinreichend stark und mehrfach gestütztes Rapid-Signal darf in der 15-min-Prognose WMO 95 erzeugen. Schwere-/Hagel-Untercodes 96/97/99 werden nicht heuristisch erfunden; sie bleiben einer direkten Modellinterpretation beziehungsweise zusätzlicher expliziter Evidenz vorbehalten.

### 3. 15-min-Kurzfristpfad
`src/forecastFusion.ts`

- `finalizeForecastMinute15()` verwendet die gemeinsame Rapid-Mehrparameterdiagnostik.
- Wahrscheinlichkeitsunterstützung aus Rapid wird mit dem vorhandenen Niederschlags-/Konvektionspfad kombiniert.
- Bei `likely/high` und vorhandenem konvektivem Niederschlag kann ein prognostischer WMO-95-Code entstehen.
- Radar/Nowcast und lokale Beobachtungen bleiben nachgelagerte, beobachtungsnähere Korrekturen.

### 4. Zentrale Gewitterinformation
`src/thunderstorm.ts` + `src/App.tsx`

- Die App übergibt sowohl die kanonische 3-h-Mehrparameterdiagnose als auch die Rapid-Diagnose an `combineThunderstormInformation()`.
- **Ohne aktuelle relevante Zelle** kann die Kachel nun korrekt `Gewitter möglich`, `Gewitter wahrscheinlich` oder `Hohes Gewitterrisiko` ausgeben – auch ohne Rapid-Daten.
- **Bei einer aktuellen blitzlosen KONRAD3D-Zelle** bleibt die Zellklassifikation weiterhin `Starker Schauer`/`Schauerinformation`. Eine gleichzeitig numerisch erwartete Gewitterentwicklung erscheint separat als `Numerische Prognose`; sie benennt die beobachtete Zelle nicht um.
- Eine bereits abgezogene Radar-/KONRAD3D-Zelle darf eine unabhängige neue numerische Gewitterprognose nicht mehr unterdrücken.
- RUC-Details wie MU-CAPE/CIN, modellierte Reflektivität, LPI, UH, EchoTop und maximaler Aufwind werden in der numerischen Gewitterdiagnose transparent ausgewiesen, soweit vorhanden.

### 5. KONRAD3D / VIL
Die aktuelle Zellenintensität bleibt am amtlichen KONRAD3D-Severity-Vertrag orientiert. VIL, maximale Reflektivität, Starkregenpotential und weitere Zellmerkmale werden nicht als eigener MID-Blitzersatz missbraucht. Sie bleiben Radar-/Schwereevidenz; ein aktuelles `Gewitter` als Zustandsbezeichnung setzt weiterhin einen Zellblitz voraus.

Dies entspricht der DWD-KONRAD3D-Dokumentation, nach der u. a. zellbasiertes VIL, vertikale 55-dBZ-Ausdehnung, maximale Reflektivität, Starkregenpotential und Zellmasse gemeinsam den Zellschweregrad bestimmen. LPI und UH bleiben numerische Modell-/Organisationsdiagnostik, keine Beobachtung.

## Verträge aktualisiert
- `MID_DWD_RUC_PIPELINE_CONTRACT.md`
- `MID_RUC_PARAMETER_AUDIT_0.9.73.11.md`
- `MID_FORECAST_CONSISTENCY_CONTRACT.md`

Die historische Kurzform „Gewitter erst ab Blitz“ gilt damit nur noch für die **Benennung des aktuell beobachteten Radar-/KONRAD3D-Zustands**, nicht für Prognosen.

## Regressionen
Neu:
- `scripts/test-thunder-numerical-ruc-097635.mjs`

Aktualisiert:
- `scripts/test-ruc-fusion-runtime-09691.mjs`
- `scripts/test-ruc-dwd-pipeline-09690.mjs`
- `scripts/test-europe-alerts-shower-model-pill-09643.mjs`
- `scripts/test-cockpit-compass-local-hazards-09170.mjs`

## Worker
**Worker-Upload erforderlich.**

Grund: Die fachliche Forecast-Fusion im Worker wurde geändert; der bisherige numerische Blitz-Gate wurde entfernt. Browser/PWA/iOS nutzen weiterhin denselben gemeinsamen Fachkern und denselben kanonischen Forecast-Fusion-Vertrag.
