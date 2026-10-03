# MID v0.9.85.155 · MID-C13 · realer Langfristausblick

Verifizierte Basis: main = mid-stable = 2b380aefc25239b86838e9f4afb83865b11b90f6 (.154). Paralleländerungen .153/.154 erhalten; keine aktive Agent-Doppelimplementierung.

## Ursache und Entscheidung

Reale HTTP-200-Antwort am 03.10.2026: `dwd_icon_eps_ensemble_mean` liefert rain_spread, wind_gusts_10m/spread und snowfall_spread als null (Einheit undefined). Der alte Feldvertrag entfernte daher alle fünf Tagesperioden. Das Seamless-Mean-Modell liefert auch keinen rain_spread; allein ein anderer Mean-Modellname behebt den Fehler nicht.

Daher tatsächliche 40 Mitglieder von `dwd_icon_seamless_eps`, Felder rain, snowfall, wind_gusts_10m. Mitglieder einschließlich des unsuffigierten Kontrollmitglieds werden je Stunde normalisiert: arithmetisches Mittel und Populationsstandardabweichung, mindestens 32/40 endliche Werte. Regen bleibt Regen, keine Gleichsetzung mit Gesamtniederschlag und keine erfundene Streuung. Bestehende unkalibrierte Bewertung und Intensitätsschwellen bleiben erhalten.

Die globale Regen-/Schneevorhersage deckt Tag 3–7 ab. Böen besitzen einen kürzeren tatsächlichen ICON-EU-EPS-Horizont. Jede Gefahr erfordert vollständige Stunden des jeweiligen Tages und 65 % des Gesamtrasters. Perioden bleiben bei mindestens einer auswertbaren Gefahr erhalten. Fehlende Einzelgefahren erscheinen als Datenlücke ohne Karte/Entwarnung; Nutzer können weiter Zeitraum/Gefahr wechseln. Keine Konvektions-/Eisregeninferenz.

Worker-Fachcache und Browsercache auf v3 getrennt, bestehende 6h/3h/24h-Resilienz erhalten. Canonical source generates both worker aggregates and browser implementation.

## Nachweis

API-Fixture `scripts/fixtures/icon-eps-seamless-20261003.json` ist unveränderte reale Einpunktantwort (Rheidt 50.78/7.06) vom 03.10.2026, 169 Stunden, Open-Meteo/DWD. Abruf: https://ensemble-api.open-meteo.com/v1/ensemble?latitude=50.78&longitude=7.06&forecast_hours=169&hourly=rain,snowfall,wind_gusts_10m&models=dwd_icon_seamless_eps&wind_speed_unit=kmh . Quelle/Dokumentation: https://open-meteo.com/en/docs/ensemble-api und https://open-meteo.com/en/docs/ensemble-mean-api . Fixture dient dem Feldvertrag, keine aktuelle regionale Liveprognose.

Neue ausführbare Regression prüft reale Felder, exakte Statistik, 31/32-Mitgliedergrenze, fünf Tagesperioden und fehlende Böen/kompletten Ausfall. Historische .151/.154-Tests behalten sämtliche fachlichen und Resilienzassertionen; Request und vollständige synthetische Mitgliederfixtures folgen dem bewusst korrigierten Vertrag. Keine Release-/CI-Konfiguration verändert.

Validierung: vollständiger realer regionaler Direktabruf: 40/40 Punkte, alle fünf Tage, Regen/Schnee bis Tag 7, Böen in den ersten beiden Tagesfenstern. Lokale `npm run verify`: 904/904 Regressionen bestanden. Browserharness: sechs Größen (320/390/412/844/1024/1440), Hell/Dunkel, 44px-Touch, kein Seitenüberlauf, Tag-7-Böen ohne Karte/Entwarnung, weiterhin auswählbarer Schnee, echter Browser-Direktpfad bei Workerfehler mit realem Feldfixture.
