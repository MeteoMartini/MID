# MID v0.9.85.282 · Vollständige Tages-Skybar und Tageswerte

- Tagesansichten berücksichtigen jetzt den **ganzen lokalen Kalendertag**, auch wenn die aktuelle Uhrzeit bereits fortgeschritten ist. Fehlende Stunden werden in der Skybar ausdrücklich als nicht verfügbare Daten angezeigt, statt verbleibende Stunden zu strecken oder vorausgegangene Stunden als klar/trocken auszugeben.
- Wetterstreifen, Stundenquadrate und Nachtzeiten verwenden dieselben tatsächlichen Stundenintervalle; auch die Zeitumstellungen mit 23 bzw. 25 Stunden bleiben korrekt. Tages-/Kurvenansicht und Widget-Export nutzen die entsprechende Zeitachse.
- Tagesniederschlagsmenge und Sonnenscheindauer beruhen weiterhin auf den kanonischen **Volltageswerten**, soweit diese verfügbar und gültig sind. Die qualitative 7-Tage-Interpretation schneidet für „Heute“ nicht pauschal die vergangenen Tagesstunden ab.
- Die bewusst **rollierenden** 90-Minuten-, 12-/24-Stunden- und Nowcast-Prognosen bleiben ab der aktuellen Zeit in die Zukunft ausgerichtet. WMO-Wetterfarben, amtliche Warnungen, RUC, Modellwerte, Tagesakkumulationsgrenzen und Quellen bleiben unverändert.
- Fehlen vergangene Stunden oder ist ein Tageswert nicht verfügbar, werden keine Werte erfunden, nicht als 0 behandelt und keine historischen Beobachtungen simuliert.
