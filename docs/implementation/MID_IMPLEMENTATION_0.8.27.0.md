# MID v0.8.27.0 – Progressive Ensemble-Analyse und Rendering-Optimierung

## Ausgangsbasis

- Fortsetzung des lokalen vollständigen Arbeitsstands v0.8.26.19.
- Verifizierte kanonische Stable-Basis: GitHub-Branch `mid-stable`, dort v0.8.26.18.
- Der funktionale Hyperlokal-/Kurzfriststand aus v0.8.26.19 bleibt vollständig erhalten.

## 1. Erweiterte Analysebereiche

Das Modelllauf-Änderungsradar und die Szenario-Cluster werden nur noch im erweiterten Modus erzeugt. Beide Module besitzen eine eigene, zugängliche Einklappsteuerung und werden im geschlossenen Zustand nicht gerendert. Der jeweilige Offen-/Geschlossen-Zustand wird lokal gespeichert.

## 2. Reaktiver Sonne-/Bewölkungsbalken

Der Sonne-/Bewölkungsbalken der Tagesdetailansicht wird unmittelbar aus den Stundenwerten erzeugt, die auch Wetterzustand, Piktogramme und Detailwerte speisen. Die frühere nachträgliche DOM-Manipulation mit einem separat erfassten Forecast-Snapshot wurde entfernt. Dadurch aktualisiert sich der Balken bei Standort-, Favoriten-, Daten- und Hyperlokaländerungen im selben React-Renderzyklus wie die übrige Tagesdarstellung.

## 3. Responsivität und Laufzeit

- Resize- und Scrollereignisse für Ensemble-Portale werden höchstens einmal pro Animationsframe verarbeitet.
- Positions- und Breitenzustände werden nur bei tatsächlichen Änderungen geschrieben.
- Detaildiagramm- und Querformatmessungen sind ebenfalls rAF-gedrosselt und vergleichen den neuen Zustand vor dem Setzen.
- Die aufwendige Ensemble-Tagesaufbereitung ist memoisiert; Stunden werden einmal nach Datum gruppiert statt je Tag wiederholt gefiltert.
- Modelllaufänderungen werden im erweiterten Modus in Leerlaufphasen berechnet.
- Der globale Nachbearbeitungs-Observer beobachtet nur noch konkret benötigte Altmodule und nicht mehr große Vorhersage- oder Ensemble-Unterbäume.
- Geschlossene erweiterte Analysebereiche werden aus dem Renderbaum entfernt; sichtbare Analyse-/Exportkörper verwenden Browser-Containment.

## 4. Verständlicher Standardmodus

Im Standardmodus bleiben Best Match, P10–P90, Wetterverlauf und wesentliche Unsicherheit sichtbar. Technische Zusatzebenen und Bedienelemente wie P25–P75, ENS-Mittel, Klimamittel, Modellstände, exakte Modell-/Mitgliederstatistik, interaktive Konsistenzdetails, Szenario-Cluster und Änderungsradar stehen ausschließlich im erweiterten Modus bereit.

## 5. MID-Prognose-Kompass

Der neue Prognose-Kompass verdichtet die Ensemble-Auswertung zu drei direkt nutzbaren Aussagen:

1. Sicherheit der nächsten drei Tage,
2. weiterer Trend,
3. Tag mit der größten Unsicherheit.

Exakte technische Prozentwerte werden nur im erweiterten Modus ergänzt. Damit erhält die App eine entscheidungsorientierte Ebene oberhalb der Rohdiagramme, ohne die fachlichen Details zu verlieren.

## Regression

Die neue Regression `scripts/test-advanced-progressive-skybar-performance-08270.mjs` schützt:

- erweiterter Modus und Einklappbarkeit,
- reaktive Skybar,
- Entfernung der veralteten imperativen Nachbearbeitung,
- progressive Offenlegung technischer Ensemble-Inhalte,
- Prognose-Kompass,
- Memoisierung, Leerlaufberechnung und gedrosselte Observer,
- Versions- und Parserkonsistenz.
