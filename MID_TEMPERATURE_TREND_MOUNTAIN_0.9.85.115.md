# MID v0.9.85.115 · Temperaturtrend-Kohärenz und Bergstunden 12 h

## Ausgangsbasis

Verifizierte Source-of-Truth-Basis ist `mid-stable = main = 9e81bcb21f3dbcdedc8d76fffc038a5e0b1a7ae2` (v0.9.85.114). Die Änderung ist eine fachlich begrenzte Korrektur der bereits kanonischen hyperlokalen Temperaturassimilation sowie eine vom Nutzer vorgegebene UI-Horizontverkürzung im Berg-/Wintersportmodul.

## Ursache des unplausiblen Temperaturverlaufs

Die bisherige Stundenassimilation bestimmte die Temperaturabweichung gegen die zeitlich nächste Modellstunde und blendete eine negative lokale Temperaturkorrektur innerhalb von 120 Minuten linear aus. Bei einer deutlich kälteren lokalen Analyse konnte dadurch die Rücknahme der Korrektur zwischen zwei benachbarten Stunden stärker sein als die eigentliche modellierte Abkühlung. Die sichtbare Stundenreihe konnte deshalb eine **synthetische Erwärmung** zeigen, obwohl dieser Anstieg nicht aus dem zugrunde liegenden Temperaturtrend stammte.

Das Problem lag damit nicht im SVG/Diagramm, sondern in der kanonischen, app-weit verwendeten Stundenreihe.

## Nachhaltige Korrektur

- Ein frischer Temperaturanker führt seinen feldspezifischen Beobachtungszeitpunkt mit.
- Der Modellwert am Beobachtungszeitpunkt wird zwischen den umgebenden Stunden linear interpoliert; die Bias-Bestimmung hängt nicht mehr von der zufällig nächsten Vollstunde ab.
- Die volle lokale Temperaturabweichung bleibt zunächst bestehen und läuft anschließend mit einer glatten Gewichtung aus.
- Die Rückführung zum Modellniveau ist auf höchstens 0,5 K pro Stunde begrenzt.
- Eine fallende bzw. steigende belastbare Modellstundentendenz darf in der unmittelbaren Assimilationsphase nicht allein durch das Ausblenden des lokalen Bias in die Gegenrichtung gedreht werden.
- Die Korrektur erfolgt weiterhin zentral vor allen sichtbaren Nutzungen. Current, Kurzfrist, 24-h-Profil, Tagesableitungen und andere Verbraucher erhalten dieselbe finalisierte Stundenreihe; es wird kein separater Darstellungs-Hack eingeführt.
- Apparent Temperature folgt demselben thermischen Versatz. Andere hyperlokale Felder behalten ihre bisherigen feldspezifischen Ausblendhorizonte.

## Berg-/Wintersport

Die horizontale stündliche Höhenprognose wird von bislang rund 24 Stunden auf **die nächsten 12 Stunden** begrenzt. Es werden höchstens zwölf stündliche Spalten dargestellt. Die vorhandene 7-Tage-Prognose bleibt unverändert bestehen.

Die 24-h-Angaben für rückblickenden/prognostizierten Neuschnee sind eigenständige meteorologische Akkumulationszeiträume und bleiben ausdrücklich 24-stündig; sie sind nicht Teil der verkürzten horizontalen Stundenleiste.

Damit ist die frühere Formulierung im Vertrag v0.9.85.108, wonach die sichtbare primäre Stundenansicht rund 24 Stunden umfasst, für die aktuelle UI ab v0.9.85.115 ersetzt.

## Regression

Required Regression: `scripts/test-mid-18-2-23-temperature-trend-mountain-12h-0985115.mjs`.

Die bestehende Responsive-/Bergwetter-Matrix bleibt verbindlich. Insbesondere darf das Stundenraster intern horizontal scrollen, aber niemals die Dokumentbreite verbreitern.
