# MID v0.9.67.10 – stufengerechte Warnwert-Pillen

## Anlass
Bei einer niedrigeren automatischen Warnstufe war der Erklärungstext bereits korrekt gestuft, die Wert-Pille übernahm jedoch weiterhin `signal.value` und damit den Spitzenwert einer zeitweise eingebetteten höheren Warnstufe. Im sichtbaren Beispiel stand deshalb bei „Windböen“ 37 kt (68 km/h), obwohl dieser Wert bereits zur parallelen Stufe „Sturmböen“ gehört.

## Umsetzung
Die zentralen Formatter `formatDwdWarningValue` und `formatDwdWarningCompactValue` verwenden bei `lowerIntensity` nun den zur Warnstufe gehörenden `thresholdValue`. Für Schneeverwehungen wird zusätzlich der stufengerechte Schneeschwellenwert geführt. Wärme-, Frost- und Nebelsignale besitzen explizite Schwellenmetadaten, sodass derselbe Vertrag für alle numerischen Warnpillen gilt.

Der Detailtext bleibt bewusst unverändert: Er darf bei niedrigeren Windstufen weiterhin die Schwelle nennen und zusätzlich transparent auf den zeitweise höheren Spitzenwert hinweisen. Die höchste aktive Warnstufe zeigt weiterhin den tatsächlichen Spitzenwert.

## Appweiter Vertrag
- automatische Warnkarten: `formatDwdWarningValue`
- 7-Tage-/Widget-Kompaktwarnungen: `formatDwdWarningCompactValue`
- Ensemble-Hazards: `formatDwdWarningValue`

Damit existiert nur eine zentrale Wertableitung für sichtbare Warnpillen.

## Release
Browser/PWA und Capacitor-iOS verwenden denselben React/Vite-Fachkern. Professional- und Worker-Metadaten werden gemeinsam auf v0.9.67.10 synchronisiert; die fachliche Workerlogik ist unverändert.
