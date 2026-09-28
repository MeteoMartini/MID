# MID v0.9.53.55

## Netatmo-Persistenz
- Die Nutzerentscheidung „Eigene Messwerte verwenden“ bleibt nach App-Neustarts erhalten.
- Ein erfolgreicher Netatmo-OAuth-/Live-Status wird lokal als autorisierte Verbindung persistiert.
- Bestehende Installationen mit bereits aktivierter Messwertübernahme werden kompatibel migriert.
- Während der erneuten Statusprüfung bleibt die zuletzt gewählte Messwertübernahme sichtbar und unverändert.
- Erst „Trennen“ löscht den gespeicherten Autorisierungszustand ausdrücklich.

## Ensemble-Wetterband
- Die weiße Schneeflocke erhält eine sehr dünne dunkle Unterkontur, damit sie insbesondere auf gelben/hellen Himmelsbändern besser lesbar bleibt.
- Keine Änderung der meteorologischen Daten-, Ensemble- oder Niederschlagslogik.

## Worker
- Keine funktionale Worker-Änderung. Die Worker-Version wird nur mit dem Release synchronisiert.
