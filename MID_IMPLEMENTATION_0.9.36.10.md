# MID v0.9.36.10

## Schwerpunkt
- Feinabstimmung des Kompositbilds mit zusätzlichem Niederschlagsart-Layer
- Verbesserte standortbezogene Radar-Nowcast-Dämpfung zur Reduktion überschätzter Niederschlagsmengen

## Umgesetzt

### 1. Kompositbild · Niederschlagsart
- Standard-Deckkraft des zusätzlichen DWD-WN-Niederschlagsart-Layers auf **64 %** feinjustiert.
- Layer-Hinweistext konkretisiert: empfohlene Überlagerung im Bereich **60–70 %**.
- Bestehende ausblendbare Komposit-Legende unverändert beibehalten.
- Darstellungshinweis präzisiert: nach Prüfung top-aktueller Alternativen bleibt das **DWD-WN-Originalprodukt** derzeit die robuste und konsistente Lösung.

### 2. Radar-Nowcast-Leiste · Genauigkeitssteigerung ohne Zusatzrequests
Für die operative stündliche Kurzfristkorrektur wird Radarecho nicht mehr nur direkt in die Prognose gemischt, sondern zusätzlich anhand der bodennahen Luftmasse bewertet:
- neue Bewertung des **Grundschicht-Zustands** (gesättigt / feucht / normal / trocken / sehr trocken)
- Nutzung von **Temperatur, Taupunkt und Feuchte** zur Abschätzung möglicher Verdunstung unterhalb der Wolke
- Berücksichtigung von **tiefer Bewölkung** als Stützkriterium
- zusätzliche Abschwächung bei **schauerartiger/konvektiver** Struktur mit geringer Stützung
- leichte Dämpfung unsicherer Radarintensitäten (`rateUncertain`, `rateApproximate`)
- Schneefall-/Kaltluftfälle werden bewusst weniger stark gedämpft

Ziel: weniger Überzeichnung von erwarteten Mengen, wenn zwar Echo vorhanden ist, aber die Grundschicht eher trocken oder die Schauerpersistenz zweifelhaft ist.

## Technische Umsetzung
- `src/forecastFusion.ts`
  - neue Hilfsfunktionen:
    - `groundLayerState(...)`
    - `convectivePersistenceFactor(...)`
    - `refineOperationalRadarBlend(...)`
  - `applyOperationalNowcastHours(...)` nutzt jetzt den verfeinerten Blend.
- `src/RadarPanel.tsx`
  - Default-Feinabstimmung für Niederschlagsart-Layer
  - aktualisierte Bedien- und Hinweistexte

## Regressionen
Geprüft mit:
- `scripts/test-composite-precipitation-type-layer-09366.mjs`
- `scripts/test-dwd-precipitation-type-radar-09200.mjs`
- `scripts/test-dwd-composite-source-integrity-09300.mjs`
- `scripts/test-nowcast-daily-consistency-08333.mjs`
- `scripts/test-radar-interval-seamless-blend-09120.mjs`

## Hinweis zu weiteren Ausbaustufen
Perspektivisch prüfbar, aber bewusst noch **nicht** ohne weiteres in dieses Build übernommen:
- DWD-/Nowcast-Spezialprodukte mit zusätzlichen Serveranfragen
- ML/AI-basierte Extrapolationsverfahren
- hochfrequente Bias-Korrektur aus weiteren Beobachtungsquellen

Damit bleibt die Ladezeit praktisch unverändert, während die Kurzfristniederschlagsdarstellung robuster wird.
