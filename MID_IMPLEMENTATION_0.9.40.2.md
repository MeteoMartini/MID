# MID v0.9.40.2

## 24-h-Wetterprofil: appweit konsistente Tmin/Tmax

Das 24-h-Wetterprofil hat seine Extremwertbeschriftung bislang nochmals aus der stündlichen Reihe abgeleitet. Die übrigen MID-Ansichten verwenden dagegen die finale Tagesaggregation `displayDays`, nachdem Best Match, Modellfusion, lokale Nachkorrektur, Beobachtungsabgleich und die abschließende Stunden-/Tages-Reconciliation durchlaufen wurden. Dadurch konnten Rundungs- bzw. Aggregationsabweichungen entstehen.

Ab v0.9.40.2 gilt ein gemeinsamer Vertrag:

- Angezeigtes Tagesmaximum = `displayDays[date].max`.
- Angezeigtes Tagesminimum = `displayDays[date].min`.
- Die stündliche Reihe bestimmt ausschließlich den plausiblen Zeitpunkt/Marker auf der 24-h-Kurve.
- Liegt dieser Zeitpunkt außerhalb des sichtbaren Profilfensters, wird der Tagesextremwert dort nicht markiert.
- Es wird niemals das Minimum oder Maximum des bloßen sichtbaren 24-h-Fensters als Tages-Tmin/Tmax ausgegeben.

Damit stimmen die Zahlen im 24-h-Wetterprofil mit 7-Tage-Vorhersage, Cockpit-Tageskarten, 14-Tage-Best-Match-Anteilen und Widget überein.
