# MID-C12 · v0.9.85.144 · Wochenunsicherheit, Trend und Karten

Basis: main = mid-stable = 8e511937458ce06808f0487ce1c61441e87fe360, veröffentlicht v0.9.85.143. Offene PRs und Replit-Branches vor Änderungen geprüft; keine überlappende aktuelle Produkt-PR.

## Wochenbereich

Stündliche Temperaturmitglieder der bereits bestehenden vollständigen Ensembleabrufe bleiben bis zur Quantilbildung erhalten. Pro Datum wird die bestehende repräsentative Modellvariantenwahl und Temperatur-/Frischegewichtung angewandt. Der Cache speichert nur kompakte P25/P50/P75-Stundenreihen, keine Rohmitglieder. Mindestens sechs gültige Werte aus zwei unabhängigen Modellgruppen; Mean/Spread-Pseudomitglieder und als zeitlich interpoliert deklarierte Modelle sind ausgeschlossen. Keine zusätzlichen API-Anfragen, keine Verlängerung des Warnungs-Nachbarschaftsensembles. Das Stundenband wird exakt per Epoch zugeordnet, vorhandene Warnungsensemble-Stunden dienen nur als Reserve. Lücken unterbrechen das Polygon; keine Tagesextremen-Interpolation, Extrapolation oder Verschiebung auf die hyperlokale Einzelkurve. Die Einzelkurve kann außerhalb liegen. Die Achse schließt die Bandgrenzen ein.

Der versionierte Ensemblecache wechselt v17 → v18, damit bereits vorhandene Tagescaches den neuen Stundenpfad nicht blockieren. Historische Testpins wurden auf die neue Cachegeneration angepasst; ihre fachlichen Assertions bleiben erhalten. Die Tagesaggregation bleibt fachlich unverändert; Stundenquantile werden erst im vollständigen Forecastbundle ergänzt. Der separate wissenschaftliche Audit kann dadurch weiter unabhängig die Tagesaggregation prüfen.

Quelle: https://open-meteo.com/en/docs/ensemble-api (stündliche Werte je Mitglied).

## Trendtext

Bisher konnte der reservierte Nacht-/Hazardsatz den dritten ausgewählten Wetterabschnitt abschneiden, darunter Regenbeginn am Mittwoch. Bei einem Zusatzsatz behält die Auswahl nun den Anfang und den relevanten Niederschlagsabschnitt. Nicht dominanter, aber messbarer Tagesregen vor der gewählten nassen Nacht wird ausdrücklich genannt. Dominante Regenabschnitte werden nicht doppelt benannt. Bestehende WMO/DWD-nahe Schwellen, Zeitintervall- und Tages-/Folgenachtverträge bleiben unverändert. Die alte Tokenprüfung, die genau das abschneidende Verhalten verlangte, prüft jetzt die neue Auswahl; eine ausführbare Mittwoch-/Donnerstagnacht-Fixture sichert das Ergebnis.

## Karten

Live-Manifest am 02.10.2026: RUC 12 UTC, Summen aus ICON-D2 09 UTC, kein modelFields-Eintrag. Workflow 37008161267 / Job 110841263871 meldete „ICON-D2 native maps unavailable: invalid percentage“. Direkter GRIB-Abgleich: CLCT 0–100 %, RELHUM 850 hPa bis 100,19159162044525 % im Deutschlandausschnitt, ohne dortige fehlende Zellen. Relative Feuchte ist keine begrenzte Wolkenfraktion; der Decoder akzeptiert leichte Übersättigung und behält separate defensive Obergrenzen (RELHUM 150 %, CLCT 100,01 %). Sentinel 9999 bleibt ungültig. ThetaE berücksichtigt die native relative Feuchte einschließlich leichter Übersättigung. Ein echter erzeugter GRIB-Test prüft beide Parameter und fehlende Werte.

Live-Decoderprüfung des 09-UTC-Laufs: 8 Parameter × 6 Termine = 48 komprimierte Raster erfolgreich; bestehende Auflösung, Hashprüfung, Lauf-/Zeit-/Einheiten-/Budgetverträge bleiben. Die Veröffentlichung dieser Produkte erfolgt regulär durch den nächsten erfolgreichen RUC-/Pages-Lauf nach Stable-Promotion. Kein manuelles Artefaktdeployment.

DWD GetCapabilities: alle 32 angebotenen WMS-Layer gelistet. Die drei schon ausgeschlossenen WW-Layer bleiben ausgeschlossen. Repräsentative GetMap-Prüfung: zunächst 30 PNGs; ICON-24h-Summe mit vollständigem T+24-Fenster und AICON-6h-Summe an T+24 erfolgreich. Vor Ablauf der Akkumulationsfenster sind einzelne Termine nicht renderbar. Der Client filtert historische/vor Initialisierung liegende Termine und akkumulierte Produkte vor ihrem vollständigen Fenster für den aktuellen Referenzlauf. Andere Modelle und Druckflächen behalten den amtlichen WMS-Pfad; sie werden nicht mit einem anderen Modell ersetzt. DWD ICON-D2 verwendet für die früheren Kombinationskarten bereits den direkten nativen Pfad.

Quelle: https://maps.dwd.de/geoserver/wms?service=WMS&request=GetCapabilities; direkte GRIBs unter https://opendata.dwd.de/weather/nwp/icon-d2/grib/09/.

## Balkenwerte und Prüfungen

Replit-Handoff wird separat SHA-verifiziert und nur nach Diff-/Gateprüfung integriert. Dezente P25–P75-Grenzen mit Einheit, echter Median bleibt Marker. Zahlen beziehen sich auf das kräftige Kernband, nicht auf eine kalibrierte Eintrittswahrscheinlichkeit.

Prüfungen: Produktionsbuild/Typecheck, vollständige CI=true-Regressionen, echte GRIB-Fixtures, Live-DWD-Aufbereitung, WMS-Katalog/PNG-Abfragen sowie responsive Hell-/Dunkel-Browserprüfung. Release ausschließlich über Source-PR-Gate → bestehenden Release Bot → Installer → Pages → Stable.
