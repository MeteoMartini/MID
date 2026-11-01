# MID v0.9.85.400 – Prognoseansicht behalten und Datenlücken klar anzeigen

- **Vorhersage-Auswahl bleibt bestehen:** Ist die gewählte 7- oder 14-Tage-Prognose vorübergehend nicht verfügbar, zeigt MID eine verfügbare Ansicht, ohne die gespeicherte Auswahl zu überschreiben. Sobald die Daten wieder vorhanden sind, kehrt die gewählte Ansicht zurück; eine ausdrücklich ausgewählte Navigation hat Vorrang.
- **Temperaturlücken werden nicht mehr verbunden:** In den kleinen Kurzfrist- und 7-Tage-Prognosekurven unterbricht eine fehlende Temperatur die Linie. Ungültige SVG-Werte und „NaN °C“ in den zugehörigen Hinweisen werden vermieden. Tatsächliche Werte bleiben unverändert.
- **Saisonmodelle mit ehrlicher Herkunft:** Sind die Ensemble-Mitglieder eines numerischen Saisonmodells nicht ausgewiesen, behauptet die Legende kein Ensemble-Mittel mehr. Bei exakt einem Member wird „1 Member“ ausgewiesen.

