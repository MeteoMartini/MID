# MID v0.9.85.83 · MID 18.2.5 · Arbeitspaket E

## Gemeinsame 7-/14-Tage-Prognosezeilen

Arbeitspaket E vereinheitlicht die 7- und 14-Tage-Prognose als gemeinsame MID-Forecast-Row-Familie. Beide Horizonte verwenden dieselbe Interaktionsregel: Alle Tage bleiben kompakt, nur der ausgewählte Tag öffnet sich unmittelbar unter seiner Zeile.

Die 7-Tage-Ansicht besitzt keinen separaten unabhängigen Stunden-Öffnungszustand mehr. Die vorhandene Tagesauswahl steuert zugleich die Inline-Erweiterung. Die bereits bestehende stündliche Tagesansicht, Prognosedaten, Skybar-Fachlogik und Warn-/Hazard-Inhalte bleiben unverändert.

Die 14-Tage-Ansicht verwendet weiterhin Best Match plus Ensemble-/Konsistenzinformationen, zeigt die Tagesinformationen jedoch ebenfalls als ruhige Prognosezeilen. Die bisher getrennte Fokuskarte wird direkt der ausgewählten Zeile zugeordnet. Eine kompakte Skybar und ein Tmin/Tmax-Temperaturfaden verwenden die vorhandenen kanonischen Stunden- beziehungsweise Tageswerte; es wird keine neue Wetterdatenquelle eingeführt.

Jede kompakte Zeile priorisiert Datum, Wetterzustand, Tmin/Tmax, Skybar, Niederschlag sowie Wind/Böen. Responsive Regeln ordnen dieselben Inhalte auf Smartphone, Tablet hoch/quer und Desktop neu an, anstatt separate mobile und Desktop-Komponenten zu pflegen.

Replit hat die Designrichtung mit gemeinsamer ForecastRow, genau einer Inline-Erweiterung, Typecheck, Produktionsbuild sowie Light/Dark auf 360×800, 390×844, 430×932, 768×1024, 1024×768 und 1440×900 geprüft. Die kanonische Produktübernahme erfolgt in ForecastCockpit und dem nachgelagerten MID-Designlayer.
