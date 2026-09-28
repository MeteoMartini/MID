# MID v0.9.37.0 – Radar-Nowcast Next Generation

## Ziel
Die Radar-Nowcast-Leiste soll die erwartete Niederschlagsmenge am Standort weniger häufig überschätzen, ohne den schnellen Erstaufbau der Oberfläche spürbar zu verlangsamen. Die Umsetzung erweitert den bestehenden DWD-RV/KONRAD3D-Pfad in sechs abgestuften Schritten.

## 1. RS als amtlicher Mengenanker
- DWD RS wird nur in der Enrichment-Stufe geladen.
- Der Worker liest den aktuellen RS-TAR-Container, extrahiert die passenden HDF5-Vorhersageglieder und liefert nur die benötigten Dateien an den Client.
- RV bleibt die Quelle für 5-Minuten-Timing und räumliche Struktur.
- RS kalibriert die RV-Verteilung für 0–60 und 60–120 Minuten.
- Abwärtskorrektur ist vollständig zugelassen; Aufwärtskorrektur ist auf 15 % begrenzt.
- Jeder Zukunftsframe kann `amountMm`, `amountSource` und `amountConfidence` tragen.

## 2. HX 250 m als Randtrefferprüfung
- HX wird nicht zur Mengenberechnung verwendet.
- HX wird nur nachgeladen, wenn RV einen schwachen/unsicheren Standorttreffer beziehungsweise eine nahe Echokante meldet.
- 250-m-Pixelumfeld, lokale Stützung und Entfernung zum nächsten Echo entscheiden, ob ein 1-km-RV-Treffer gedämpft werden muss.
- Starke HX-Stützung darf die Menge nicht künstlich erhöhen.

## 3. Wachstum und Zerfall
- Aus mehreren bereits vorhandenen DWD-Radarframes wird die lokale Niederschlagsmasse verfolgt.
- Ein robuster logarithmischer Trend klassifiziert die Struktur als wachsend, stabil oder zerfallend.
- Der Trend verändert die zukünftige 5-Minuten-Verteilung mit zunehmender Vorhersagezeit.
- KONRAD3D-Trendinformation kann die Diagnose konvektiver Zellen ergänzen.

## 4. Lokales Bewegungsfeld
- Aus demselben WMS-Radarbild werden parallel ein regionales und ein zentriertes lokales Korrelationsfeld berechnet.
- Das lokale Feld deckt grob den standortnahen Bereich ab und benötigt keinen zusätzlichen Netzwerkabruf.
- Bei guter Anpassung wird lokal gewichtet, sonst bleibt das regionale Feld maßgeblich.
- KONRAD3D bleibt bei eindeutig zuordenbaren Zellen eine zusätzliche Bewegungsquelle.

## 5. 9-Member-Mikroensemble
- Drei Timingvarianten × drei Intensitätsvarianten ergeben neun Mitglieder.
- RS reduziert die Intensitätsspreizung; unsichere Randtreffer erzeugen durch supportabhängige Member-Schwellen echte Treffer-/Nichttreffer-Varianten statt künstlich 100 % Trefferwahrscheinlichkeit.
- Ergebnis: P25, Median, P75 und Trefferwahrscheinlichkeit für die 2-h-Summe sowie optional je 5-Minuten-Frame.
- Die sichtbare 2-h-Summe verwendet bevorzugt den Ensemble-Median, danach RS-kalibrierte Summe, erst zuletzt die alte Rohableitung.

## 6. Stationskalibrierung
- Nur frische, nahe DWD-Niederschlagsstationen werden berücksichtigt.
- Maximale Distanz 15 km, maximales Alter 30 Minuten.
- Vergleich mit dem jüngsten radarobservierten Zeitraum liefert einen begrenzten Korrekturfaktor.
- Bei Schauern/Gewittern wird das Stationsgewicht deutlich reduziert, damit eine räumlich versetzte Station lokale Konvektion nicht wegkalibriert.
- Die Stationskorrektur darf den kurzfristigen Radarwert nur vorsichtig verändern.

## Grundschicht / Verdunstung
Die bereits mit v0.9.36.10 eingeführte Bewertung aus Feuchte, Taupunktabstand, tiefer Bewölkung, Temperatur und konvektiver Persistenz bleibt nach der neuen Radarkalibrierung aktiv. Bodenfeuchte selbst wird weiterhin nicht zur Niederschlagsmenge verwendet, sondern gehört fachlich in Überflutungs-/Abflussindikatoren.

## Laufzeitstrategie
1. Schneller DWD-Radarabruf unverändert.
2. Nachgelagerte Enrichment-Stufe lädt RS und Stationsabgleich parallel zu den bereits vorhandenen Ergänzungen.
3. HX nur bei diagnostiziertem Grenzfall.
4. Wachstum/Zerfall, lokales Bewegungsfeld und 9-Member-Ensemble verwenden vorhandene Daten beziehungsweise lokale Berechnung.

Damit entstehen im Normalfall nur die RS-/Stationsabrufe nach dem ersten Render; der teurere HX-Pfad bleibt bedarfsgesteuert.

## Neue/erweiterte Dateien
- `src/DwdRsSource.ts`
- `src/HxRadarPointSource.ts`
- `src/RadarNowcastCalibration.ts`
- `src/weather.ts`
- `src/forecastFusion.ts`
- `src/App.tsx`
- `worker/metar-proxy.js`
- `scripts/test-radar-nowcast-calibration-09370.mjs`

## Regression
Die neue Regression schützt explizit:
- RS-Abwärtskalibrierung und begrenzte Aufwärtskalibrierung,
- HX-Randtrefferdämpfung ohne Mengenerfindung,
- Zerfallsverstärkung mit wachsendem Lead,
- lokales Bewegungsfeld ohne Extra-Radarrequest,
- 9-Member-Quantile und Trefferwahrscheinlichkeit,
- vorsichtige Stationskorrektur.
