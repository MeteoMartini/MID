# MID v0.9.53.56

- Niederschlags-Push warnt ausschließlich vor dem erwarteten Beginn; ein bereits laufender Niederschlag löst keine verspätete Beginnwarnung mehr aus.
- Vorwarnzeit ist geräte-/nutzerspezifisch einstellbar: 15, 30, 45, 60, 90 oder 120 Minuten.
- Mindestmenge ist einstellbar: 0,1 / 0,2 / 0,5 / 1,0 / 2,0 / 5,0 mm erwartete Ereignismenge im Kurzfristfenster.
- Die vorhandene globale Meldungspause (15–180 min) bleibt übergeordnet und wird auch für Niederschlags-Vorwarnungen unverändert respektiert.
- Der Worker prüft für Push bis zu 6 h 15-Minuten-Daten, gruppiert zusammenhängende Niederschlagsphasen und benachrichtigt nur, wenn Beginn im gewählten Vorlauf liegt und die Mindestmenge erreicht wird.
- Die Karte „Aktuelle Niederschlagswahrscheinlichkeit“ kennzeichnet nun explizit, wenn das stündliche Modell über das +2-h-Radar-/Nowcastfenster hinaus weiteren oder erneut einsetzenden Niederschlag erwartet.
