# MID v0.9.85.439 – Kartenübergänge und Gefrierpunktachse

## Umfang

Dieser Kandidat enthält zwei begrenzte Darstellungsänderungen: weichere Wolken-/Signifikantwetter-Übergänge beim Laufwechsel desselben Modells und eine besser erkennbare 0-°C-Referenz in Temperaturdiagrammen. Wetterdaten, Modellwahl, Warnungen, RUC-Produktion und Freigabe bleiben unverändert.

## Kartenübergang

- Während ein neuer Lauf desselben Modells lädt, bleibt der letzte validierte Frame sichtbar.
- Die Raster-Layer-Identität ist an Modell und Darstellungsmodus statt an Lauf und Zeitschritt gebunden; ein Wechsel remountet den Renderer nicht unnötig.
- Der angezeigte Vorhersage-Vorlauf bezieht sich solange auf den tatsächlich sichtbaren Frame.
- Bei einem Modellwechsel wird kein Frame eines anderen Modells überbrückt.

## Temperaturdiagramme

Die Gefrierpunktlinie und eine vorhandene 0-°C-Achsenbeschriftung erhalten stärkere Strich- und Textgewichtung in Stunden-, 7-Tage-, Horizont- und Ensemble-Temperaturdiagrammen. Die gemeinsame 7-Tage-Kurvenkomponente bleibt der Renderer für Widget-Verbraucher.

## Regressionen

Die bestehenden Karten- und Diagrammtests prüfen Same-Model-Retention, Ausschluss fremder Modelle, stabile Layer-Identität, zum sichtbaren Frame passende Vorlaufbeschriftung sowie die hervorgehobene Gefrierpunktreferenz. Die vollständigen Source-PR-, Installer-, Worker-/Pages- und Stable-Gates müssen für den endgültigen SHA erfolgreich sein; dieses Dokument allein ist keine Releasefreigabe.
