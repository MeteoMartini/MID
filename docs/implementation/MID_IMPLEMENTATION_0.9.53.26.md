# MID v0.9.53.26 – app-weite Prognosekonsistenz

## Ziel

MID besitzt ab diesem Stand einen verbindlichen Prognose-Konsistenzvertrag: Hyperlokale Beobachtungen, Radar-/Nowcast-Signale, Konvektion und daraus abgeleitete Änderungen – insbesondere der Niederschlagswahrscheinlichkeit – werden vor der Darstellung in einer gemeinsamen operativen Forecast-Endstufe zusammengeführt. Sichtbare Module dürfen dieselben Anpassungen nicht unabhängig voneinander neu berechnen.

## Kanonische Prognoseebenen

- `displayHours`: finale operative Stundenprognose.
- `displayMinutes15`: aus derselben Evidenz abgeleitete finale 15-Minuten-Prognose für 90-Minuten- und Kurzfristdarstellungen.
- Tageswerte werden anschließend aus den finalen Stunden reconciled.

Damit verwenden 90-Minuten-Cockpit, Kurzfristmodul, Stunden-/Tagesgrafiken, Niederschlags-Nowcast, Widget, Gefahrenlogik sowie Event-/Aktivitätsbewertung denselben fachlichen Prognosestand.

## Hyperlokale Assimilation

Die bisherige feldspezifische Qualitätsprüfung der Stationsbeobachtungen bleibt erhalten. Geeignete lokale Beobachtungen werden nun zentral und zeitlich abklingend in die operative Prognose übernommen. Das betrifft – abhängig von Verfügbarkeit und Parameter-Eignung – unter anderem Temperatur, Feuchte/Taupunkt, Luftdruck, Wind/Böen/Richtung, Bewölkung/Sicht sowie Niederschlag und Wetterzustand.

Beobachteter lokaler Niederschlag kann damit beispielsweise kurzfristig die operative Niederschlagswahrscheinlichkeit erhöhen. Diese Änderung erscheint anschließend nicht nur an einer einzelnen Stelle, sondern konsistent in allen betroffenen Kurzfrist- und Forecastdarstellungen.

## Vermeidung doppelter Anpassungen

Die 90-Minuten- und Kurzfristmodule erhalten keine rohen `minutes15` mehr, wenn `displayMinutes15` vorhanden ist. Ebenso werden Stationsanker und Radar-Nowcast auf App-Ebene nicht erneut als ansichtsspezifische Recheninputs an diese Module durchgereicht. Die Komponenten bleiben technisch rückwärtskompatibel, behandeln die kanonischen Reihen aber als bereits finalisierte Prognose.

## Events

Für andere Eventorte wird derselbe hyperlokale Beobachtungsanker und dieselbe finale Stundenkorrektur verwendet. Für den aktuell geöffneten Standort übernimmt der Eventpfad weiterhin die bereits kanonisch finalisierte Prognose. Dadurch soll eine Eventbewertung nicht von der Hauptvorhersage desselben Ortes abweichen, nur weil sie über einen anderen UI-Pfad berechnet wurde.

## Dauerhafte Architekturregeln

Die verbindlichen Regeln stehen in `MID_FORECAST_CONSISTENCY_CONTRACT.md` und sind zusätzlich in `MID_HYPERLOCAL_ANALYSIS_CONTRACT.md` sowie `MID_SOURCE_OF_TRUTH.md` verankert. Neue Forecastmodule müssen die kanonischen Reihen verwenden oder ausdrücklich dokumentieren, warum eine andere Datenebene fachlich erforderlich ist.

## Regression

`scripts/test-forecast-consistency-contract-095326.mjs` schützt die zentrale Endstufe, die kanonische 15-Minuten-Reihe, die App-weite Verwendung, den Eventpfad und die dauerhafte Vertragsverankerung.
