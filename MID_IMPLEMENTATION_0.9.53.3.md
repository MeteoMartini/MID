# MID v0.9.53.3

## Niederschlagswahrscheinlichkeit in Tageskarten
- 7-Tage-Darstellung wieder mit Zeitraum: klar erhöhtes 6-h-Fenster, ansonsten 00–24 h.
- Echte Ensemble-Ereigniswahrscheinlichkeit bleibt unverändert.
- Best-Match-Fallback bleibt transparent als stündliches Maximum (`max`) gekennzeichnet; der Zeitraum ist nur die zeitliche Einordnung des Maximums.
- Niederschlagsdauer wird, wenn > 0, kompakt in ganzen Stunden ergänzt.
- Konsistent in Cockpit, klassischer 7-Tage-Vorhersage und Widget.

Worker: keine funktionale Änderung; kein erneuter Cloudflare-Upload erforderlich.
