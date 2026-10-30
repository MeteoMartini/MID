# MID v0.9.85.372

## Modellkarten: nur passende Quellen und bestätigte Termine
- Der Kartenbereich prüft die tatsächlich vom DWD beziehungsweise ECCC veröffentlichten WMS-Layer gemeinsam. Nicht mehr gelistete oder für den gewählten Zeitraum beziehungsweise Höhenwert nicht bestätigte Kombinationen erscheinen nicht als neue Kartenauswahl.
- Die Prüfung gilt für den klassischen Modellkartenbereich und für die kombinierte Modell-/Parameterwahl der vereinheitlichten Karte. Bei Ausfall eines Anbieters bleiben persönliche Einstellungen erhalten; fehlende Daten werden nicht als Null oder als gültige Karte ausgegeben.
- WMS-Karten ohne bestätigten Modelllauf, Gültigkeitszeitpunkt oder erforderliche Druck-/Höhenebene werden nicht mehr als Vorhersagekacheln geladen. Ereignisabhängige Nowcast-Karten berücksichtigen weiterhin ihre eigene Zeitsemantik.
- Ein begrenzter, ausschließlich lesender Live-Kartentest kann sämtliche publizierten Layer auf gültige Bildantworten prüfen. Ein leeres Bild bei trockenem Wetter und eine vorübergehende Netzstörung werden ausdrücklich nicht als endgültige Abschaltung behandelt.
