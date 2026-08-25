# MID 0.9.65.15

## Flugmeteorologie – Höheneingabe im Streckenbriefing

- Ursache des Eingabefehlers behoben: Die kontrollierte Zahleneingabe normalisierte und begrenzte bislang jeden einzelnen Tastenschritt. Mehrstellige Eingaben konnten dadurch bereits während des Tippens auf hohe FL-Werte geklemmt werden; die Einheit sprang anhand des Zwischenwerts.
- Höheneinheit jetzt explizit auswählbar: `FL` oder `ft AGL`; kein automatischer Einheitssprung während der Eingabe.
- Mehrstellige Eingaben bleiben bis Blur/Briefing-Start unverändert editierbar.
- `FL`: FL050–FL550; Rundung auf Zehner beim Commit.
- `ft AGL`: 0–4900 ft; 100-ft-Auflösung. Unter FL050 bleibt diese Genauigkeit intern erhalten.
- Beschriftungen verwenden neutral „Flugniveau“, wenn auch AGL-Höhen möglich sind.
- Pflichtregression `test-flight-altitude-input-096515.mjs` ergänzt.
