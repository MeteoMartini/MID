# MID v0.9.53.14

## DWD-nahe Tages-PoP und Open-Meteo-429-Resilienz

- Die 7-Tage-Tageskarten zeigen bei DWD-Ensemble-PoP wieder 00–24 h beziehungsweise eines der klassischen 6-h-Fenster 00–06, 06–12, 12–18 oder 18–24 h. Ein 6-h-Fenster wird nur dann hervorgehoben, wenn sein Risiko gegenüber dem zweitstärksten Fenster um mindestens 15 Prozentpunkte und gegenüber dem Mittel der übrigen Fenster um mindestens 20 Prozentpunkte erhöht ist.
- Bei 0 % wird kein Zeitfenster angegeben. Der Best-Match-Stundenfallback bleibt transparent als `max` gekennzeichnet und erhält dieselbe strenge Schwerpunktlogik.
- Direkte Open-Meteo-Anfragen laufen appweit über einen gemeinsamen Request-Guard mit Prioritäten, begrenzter Parallelität, Startabstand, Inflight-Deduplizierung und gemeinsamem 429-Cooldown. Dadurch können Resume-/Favoriten-/Event-/Wetterzwilling-Hintergrundjobs den Dienst nicht mehr gleichzeitig fluten.
- Die Kernvorhersage besitzt einen kurzen Fresh-Cache und einen längeren Stale-if-Rate-Limit-Fallback. Beim Reaktivieren einer App kann daher die zuletzt erfolgreiche Vorhersage sichtbar bleiben, statt die gesamte Favoritenansicht mit `HTTP 429` zu ersetzen.
- Manueller Reload bleibt ein echter Fresh-Versuch. Bei aktivem Rate Limit zeigt MID eine nutzerfreundliche Statusmeldung und plant die Aktualisierung selbstständig erneut ein.
- Wetterzwilling-Lernen arbeitet mit Hintergrundpriorität, pausiert zwischen Favoriten und stoppt den Restlauf sofort bei Rate Limit. Auch Event-Flugprofile, Meteogramm-Fallback, Berg-/Wintersport, saisonale und Reise-Klimadaten sowie Referenz-/Reanalyseabrufe teilen den zentralen Guard.
- Neue Required-Regression `test-dwd-pop-and-openmeteo-rate-guard-095314.mjs`. Worker fachlich unverändert.


## Buildfix nach Installerlauf

- TravelPlanner-Regressions: ESM-Testimports für `cachePolicy` und den neu eingebundenen `openMeteoGuard` werden im temporären TypeScript-Testbuild explizit auf `.js` normalisiert. Damit prüfen die beiden bestehenden Reiseplaner-Regressionen wieder den Produktionscode statt an Node-ESM-Auflösung zu scheitern.
- Keine fachliche Änderung am Reiseplaner oder am Open-Meteo-Rate-Limit-Guard.
