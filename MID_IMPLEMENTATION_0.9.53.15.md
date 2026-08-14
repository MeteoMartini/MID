# MID 0.9.53.15

Kernvorhersage-Resilienz nach wiederholtem HTTP 429 auf iOS/PWA-Reaktivierung.

- Neuer Worker-Pfad `forecast-core` als appweiter Primärpfad für sichtbare Fresh-Reloads.
- Cloudflare-Edge-Cache: 2 Minuten frisch, bis 18 Stunden als letzter belastbarer Rückfallstand.
- Frontend-Core-Cache v2 quantisiert auf ca. 100 m und kann vorhandene v1-Einträge im Nahbereich bis 2,5 km übernehmen.
- Browser-Direktzugriff bleibt als Fallback; der Nutzer sieht bei temporären Limits weiterhin belastbare letzte Daten statt einer leeren App.
- Keine Änderung an meteorologischer Best-Match-/Hyperlokal-Logik.
